import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
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
import { CONFIG_FILE, loadConfig } from './config.js';
import { lintSetup } from './lint-setup.js';
import { compareBlueprints, DEFAULT_THRESHOLD, renderReport } from './similarity.js';
import { findRepoRoot, repoPaths } from './paths.js';
import { loadTaxonomy } from './taxonomy.js';
import { validateCatalog } from './validate.js';

export const VERSION = '0.1.0';

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
