import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Command } from 'commander';
import { renderCodeowners } from './build-codeowners.js';
import { loadBlueprints, renderIndex } from './build-index.js';
import { buildManifestJsonSchema } from './build-schema.js';
import { readBlueprintFile, readBlueprintFolder, readManifest } from './catalog.js';
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
    .argument('<slug>', 'blueprint to check')
    .description('check a blueprint setup.md against the structure and safety rules')
    .action((slug: string) => {
      const root = rootOf();
      const folder = readBlueprintFolder(root, slug);
      const manifest = readManifest(loadTaxonomy(root), folder);
      const problems = lintSetup(readBlueprintFile(folder, 'setup.md'), {
        options: manifest.options ?? {},
      });
      for (const problem of problems) {
        console.error(`error  setup.md:${problem.line}  ${problem.rule}: ${problem.message}`);
      }
      if (problems.length === 0) {
        console.log(`ok  ${slug}/setup.md passes the setup rules`);
        return;
      }
      console.error(`
${problems.length} problem(s) in ${slug}/setup.md`);
      process.exitCode = 1;
    });

  program
    .command('similarity')
    .argument('<slug>', 'blueprint to compare against the rest of the catalog')
    .option('--threshold <ratio>', 'flag above this similarity', String(DEFAULT_THRESHOLD))
    .option('--fail-on-flag', 'exit non-zero on a red flag, not only on a rule 9 rejection')
    .description('report how close a blueprint is to the ones already in the catalog')
    .action((slug: string, options: { threshold: string; failOnFlag?: boolean }) => {
      const root = rootOf();
      const taxonomy = loadTaxonomy(root);
      const blueprints = loadBlueprints(root, taxonomy);
      const subject = blueprints.find((blueprint) => blueprint.slug === slug);
      if (subject === undefined) throw new Error(`No such blueprint: ${slug}`);
      const threshold = Number(options.threshold);
      if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
        throw new Error('--threshold must be a ratio between 0 and 1');
      }
      const report = compareBlueprints(
        subject,
        blueprints.filter((blueprint) => blueprint.slug !== slug),
        threshold,
      );
      console.log(renderReport(report));
      // A red flag is a question for the reviewer, which the pull request
      // template makes them answer (rule 11). Only the objective rule — one
      // blueprint per stack + project_type + requirements — fails the command.
      if (report.closest?.sameCombination === true || options.failOnFlag === true) {
        if (report.flagged || report.closest?.sameCombination === true) process.exitCode = 1;
      }
    });

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

function write(file: string, contents: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents, 'utf8');
  console.log(`wrote  ${file}`);
}
