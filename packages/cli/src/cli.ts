import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Command } from 'commander';
import { renderCodeowners } from './build-codeowners.js';
import { loadBlueprints, renderIndex } from './build-index.js';
import { buildManifestJsonSchema } from './build-schema.js';
import {
  listBlueprintSlugs,
  readBlueprintFile,
  readBlueprintFolder,
  readManifest,
} from './catalog.js';
import { affectedBlueprints, changedFiles } from './changed.js';
import { CONFIG_FILE, loadConfig } from './config.js';
import { lintSetup } from './lint-setup.js';
import type { Manifest } from './manifest.js';
import { checkOptions, resolveSetupOptions } from './options.js';
import { parseRecipe } from './recipe.js';
import { fetchRequests, hasGitHubCli, renderRequests } from './requests.js';
import { checkTools, runDirectoryName, runRecipe, type StepOutcome } from './test-setup.js';
import { compareBlueprints, DEFAULT_THRESHOLD, renderReport } from './similarity.js';
import { findRepoRoot, repoPaths } from './paths.js';
import { loadTaxonomy } from './taxonomy.js';
import { validateCatalog } from './validate.js';

export const VERSION = '0.2.3';

interface GlobalOptions {
  root?: string;
}

/**
 * Every pipeline step is a command here, so that contributors and maintainers
 * get the same result locally that CI produces (ADR 0002).
 */
export function createProgram(): Command {
  const program = new Command();
  program
    .name('forgeprint')
    .description('Forgeprint catalog tooling')
    .version(VERSION)
    .option('--root <dir>', 'repository root (default: nearest one above the working directory)');

  const rootOf = (): string => findRepoRoot(program.opts<GlobalOptions>().root);

  program
    .command('validate')
    .description('check every blueprint against the schema, the taxonomy and the catalog rules')
    .action(() => {
      const root = rootOf();
      const report = validateCatalog(root);
      for (const problem of report.problems) {
        const where = problem.blueprint === undefined ? '' : `${problem.blueprint}: `;
        console.error(`error  ${where}${problem.message}`);
      }
      if (report.ok) {
        console.log(`ok  ${report.checked} blueprint(s) valid`);
        return;
      }
      console.error(`\n${report.problems.length} problem(s) in ${report.checked} blueprint(s)`);
      process.exitCode = 1;
    });

  program
    .command('lint-setup')
    .argument('[slug]', 'blueprint to check; omit with --all')
    .option('--all', 'check every blueprint in the catalog')
    .description('check a blueprint setup.md against the structure and safety rules')
    .action((slug: string | undefined, options: { all?: boolean }) => {
      const root = rootOf();
      const taxonomy = loadTaxonomy(root);
      const slugs = targets(root, slug, options.all === true);
      let problemCount = 0;

      for (const target of slugs) {
        const folder = readBlueprintFolder(root, target);
        const manifest = readManifest(taxonomy, folder);
        const problems = lintSetup(readBlueprintFile(folder, 'setup.md'), {
          options: manifest.options ?? {},
        });
        for (const problem of problems) {
          console.error(
            `error  ${target}/setup.md:${problem.line}  ${problem.rule}: ${problem.message}`,
          );
        }
        problemCount += problems.length;
      }

      if (problemCount === 0) {
        console.log(`ok  ${slugs.length} setup recipe(s) pass the setup rules`);
        return;
      }
      console.error(`
${problemCount} problem(s) in ${slugs.length} setup recipe(s)`);
      process.exitCode = 1;
    });

  program
    .command('similarity')
    .argument('[slug]', 'blueprint to compare; omit with --all')
    .option('--all', 'report on every blueprint in the catalog')
    .option('--threshold <ratio>', 'flag above this similarity', String(DEFAULT_THRESHOLD))
    .option('--fail-on-flag', 'exit non-zero on a red flag, not only on a rule 9 rejection')
    .description('report how close a blueprint is to the ones already in the catalog')
    .action(
      (
        slug: string | undefined,
        options: { all?: boolean; threshold: string; failOnFlag?: boolean },
      ) => {
        const root = rootOf();
        const taxonomy = loadTaxonomy(root);
        const blueprints = loadBlueprints(root, taxonomy);
        const threshold = Number(options.threshold);
        if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
          throw new Error('--threshold must be a ratio between 0 and 1');
        }

        let rejected = false;
        let flagged = false;
        for (const target of targets(root, slug, options.all === true)) {
          const subject = blueprints.find((blueprint) => blueprint.slug === target);
          if (subject === undefined) throw new Error(`No such blueprint: ${target}`);
          const report = compareBlueprints(
            subject,
            blueprints.filter((blueprint) => blueprint.slug !== target),
            threshold,
          );
          console.log(renderReport(report));
          console.log('');
          rejected ||= report.closest?.sameCombination === true;
          flagged ||= report.flagged;
        }

        // A red flag is a question for the reviewer, which the pull request
        // template makes them answer (rule 11). Only the objective rule — one
        // blueprint per stack + project_type + requirements — fails the command.
        if (rejected || (options.failOnFlag === true && flagged)) process.exitCode = 1;
      },
    );

  program
    .command('test-setup')
    .argument('[slug]', 'blueprint to run; omit with --all')
    .option('--all', 'run every blueprint in the catalog')
    .option('--options <pairs>', 'option values, for example database=postgres,auth=jwt')
    .option('--all-options', 'run every combination of the declared options')
    .option('--changed-since <ref>', 'only the blueprints changed since this git reference')
    .option('--keep', 'keep the working directory instead of deleting it')
    .description('run a setup recipe in a fresh directory and verify every step')
    .action(
      async (
        slug: string | undefined,
        flags: {
          all?: boolean;
          options?: string;
          allOptions?: boolean;
          changedSince?: string;
          keep?: boolean;
        },
      ) => {
        const root = rootOf();
        const taxonomy = loadTaxonomy(root);
        let failures = 0;

        let selected = targets(root, slug, flags.all === true);
        if (flags.changedSince !== undefined) {
          const ref = flags.changedSince;
          selected = affectedBlueprints(changedFiles(root, ref), selected);
          if (selected.length === 0) {
            // Not a skip and not a failure: the question was asked and the
            // answer is nothing to run. A required check has to say that out
            // loud, or the pull request waits forever.
            console.log(`ok  no blueprint changed since ${ref}; no recipe to run`);
            return;
          }
          console.log(`Changed since ${ref}: ${selected.join(', ')}`);
        }

        for (const target of selected) {
          const folder = readBlueprintFolder(root, target);
          const manifest = readManifest(taxonomy, folder);

          // Nothing is installed: a missing tool is a refusal, not a guess at a
          // different toolchain (ADR 0005).
          const missing = await checkTools(manifest.requires_tools ?? []);
          if (missing.length > 0) {
            for (const problem of missing) console.error(`error  ${target}: ${problem.message}`);
            console.error(`\n${target} cannot be tested on this machine. Nothing was installed.`);
            failures += 1;
            continue;
          }

          for (const chosen of combinations(manifest, flags)) {
            checkOptions(manifest, chosen);
            const label = describeOptions(chosen);
            console.log(`\n${target}${label === '' ? '' : `  ${label}`}`);

            const resolved = resolveSetupOptions(readBlueprintFile(folder, 'setup.md'), chosen);
            const recipe = parseRecipe(resolved.markdown);
            if (recipe.problems.length > 0) {
              for (const problem of recipe.problems) {
                console.error(`error  setup.md:${problem.line}: ${problem.message}`);
              }
              failures += 1;
              continue;
            }

            const dir = mkdtempSync(join(tmpdir(), `${runDirectoryName(target, chosen)}-`));
            const started = Date.now();
            const result = await runRecipe(recipe.steps, {
              dir,
              // The step's own number can outrun the count: a branch the caller
              // did not pick leaves a gap in the numbering of the one they did.
              onStep: (step, position, total) => {
                console.log(
                  `  [${String(position).padStart(2)}/${total}] ${step.number}. ${step.title}`,
                );
              },
            });

            if (result.ok) {
              console.log(`ok  ${recipe.steps.length} step(s) in ${seconds(started)}`);
              if (flags.keep === true) console.log(`  working directory: ${dir}`);
              else rmSync(dir, { recursive: true, force: true });
            } else {
              const failure = result.failure;
              console.error(
                `\nerror  step ${String(failure?.step.number)} failed during the ` +
                  `${String(failure?.phase)} (exit ${String(failure?.exitCode)})`,
              );
              console.error(`  ${failedCommand(failure)}`);
              console.error(indent(tail(failure?.output ?? '', 40)));
              console.error(`  working directory kept at ${dir}`);
              failures += 1;
            }
          }
        }

        if (failures > 0) process.exitCode = 1;
      },
    );

  program
    .command('build-index')
    .description('regenerate docs/index.json from the catalog')
    .action(() => {
      const root = rootOf();
      const taxonomy = loadTaxonomy(root);
      write(repoPaths.index(root), renderIndex(loadBlueprints(root, taxonomy), taxonomy));
    });

  program
    .command('build-schema')
    .description('regenerate schema/manifest.schema.json from the taxonomy')
    .action(() => {
      const root = rootOf();
      write(repoPaths.manifestSchema(root), buildManifestJsonSchema(loadTaxonomy(root)));
    });

  program
    .command('build-requests')
    .description('regenerate docs/requests.json from the open blueprint-request issues')
    .option(
      '--repository <owner/repo>',
      `repository to read (default: repository in ${CONFIG_FILE})`,
    )
    .action((options: { repository?: string }) => {
      const root = rootOf();
      const repository = options.repository ?? loadConfig(root).repository;
      if (repository === undefined) {
        throw new Error(`No repository: pass --repository or set repository in ${CONFIG_FILE}`);
      }
      // Without gh there is nothing to ask, and an empty list would delete a
      // good one. The build carries on either way: the demand list is never
      // worth failing on (ADR 0002).
      if (!hasGitHubCli()) {
        console.log('skip   gh is not installed; docs/requests.json left as it is');
        return;
      }
      const requests = fetchRequests(repository);
      write(repoPaths.requests(root), renderRequests(repository, requests));
      console.log(`       ${String(requests.length)} open request(s)`);
    });

  program
    .command('build-codeowners')
    .description('regenerate .github/CODEOWNERS from every manifest maintainers field')
    .option('--owner <handle>', `core maintainer (default: core_maintainer in ${CONFIG_FILE})`)
    .action((options: { owner?: string }) => {
      const root = rootOf();
      const owner = options.owner ?? loadConfig(root).core_maintainer;
      if (owner === undefined) {
        throw new Error(
          `No core maintainer: pass --owner or set core_maintainer in ${CONFIG_FILE}`,
        );
      }
      const taxonomy = loadTaxonomy(root);
      write(repoPaths.codeowners(root), renderCodeowners(loadBlueprints(root, taxonomy), owner));
    });

  return program;
}

/** Every combination of the declared options, or just the first of each. */
function combinations(
  manifest: Manifest,
  flags: { options?: string; allOptions?: boolean },
): Record<string, string>[] {
  if (flags.options !== undefined) return [parsePairs(flags.options)];

  const fields = Object.entries(manifest.options ?? {});
  if (fields.length === 0) return [{}];
  if (flags.allOptions !== true) {
    // One run, deterministically the first value of each field. The full matrix
    // is slow enough that making it the default would mean nobody runs it.
    return [Object.fromEntries(fields.map(([field, values]) => [field, values[0] ?? '']))];
  }
  return fields.reduce<Record<string, string>[]>(
    (rows, [field, values]) =>
      rows.flatMap((row) => values.map((value) => ({ ...row, [field]: value }))),
    [{}],
  );
}

function parsePairs(text: string): Record<string, string> {
  return Object.fromEntries(
    text.split(',').map((pair) => {
      const [field = '', value = ''] = pair.split('=');
      if (field.trim() === '' || value.trim() === '') {
        throw new Error(`--options takes field=value pairs, got "${pair}"`);
      }
      return [field.trim(), value.trim()];
    }),
  );
}

function describeOptions(chosen: Readonly<Record<string, string>>): string {
  return Object.entries(chosen)
    .map(([field, value]) => `${field}=${value}`)
    .join(' ');
}

/** What to show for a failure: the verification, or the action that ran. */
function failedCommand(failure: StepOutcome | undefined): string {
  if (failure === undefined) return '';
  if (failure.phase === 'verify') return failure.step.verify;
  return failure.step.action.kind === 'run'
    ? failure.step.action.command
    : `write ${failure.step.action.path}`;
}

function seconds(started: number): string {
  return `${((Date.now() - started) / 1000).toFixed(1)}s`;
}

function tail(text: string, lines: number): string {
  return text.split('\n').slice(-lines).join('\n');
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => `  | ${line}`)
    .join('\n');
}

/** The blueprints a command should act on: one slug, or the whole catalog. */
function targets(root: string, slug: string | undefined, all: boolean): string[] {
  if (all && slug !== undefined) {
    throw new Error('Pass a slug or --all, not both');
  }
  if (all) return listBlueprintSlugs(root);
  if (slug === undefined) throw new Error('Pass a blueprint slug, or --all for every blueprint');
  return [slug];
}

function write(file: string, contents: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf8');
  console.log(`wrote  ${file}`);
}
