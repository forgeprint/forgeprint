import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { parse } from 'yaml';
import { repoPaths } from './paths.js';

/**
 * Skills, checked against the format the distribution tools actually read.
 *
 * Forgeprint does not define a skill format; it follows the Agent Skills
 * conventions so that `npx skills add forgeprint/forgeprint` and
 * `gh skill install forgeprint/forgeprint <name>` work on this repository
 * without anything Forgeprint-specific (rule 6, and the fourth differentiator
 * in the README). The rules below are theirs, not ours — see
 * docs/decisions/0006-skill-distribution.md for what was verified against the
 * real tools and when.
 *
 * The check is offline and deterministic on purpose: it belongs in `validate`,
 * which has to pass on a laptop with no network (ADR 0002).
 */

/** Both tools resolve a skill by the name of its directory. */
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** agentskills.io naming rules, as `gh skill publish` enforces them. */
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;

/** Frontmatter `gh skill install` injects; committing it breaks updates. */
const INSTALL_METADATA = /^github-/;

export interface SkillProblem {
  /** Repository-relative path of the SKILL.md, for the error message. */
  readonly file: string;
  readonly message: string;
}

export interface SkillFolder {
  /** Repository-relative path of the folder, e.g. `skills/blueprint-author`. */
  readonly path: string;
  readonly name: string;
  readonly file: string;
}

/**
 * Every skill in the repository: the catalog's own, and the ones a blueprint
 * ships. Both live at `<something>/skills/<name>/SKILL.md`, which is the
 * layout the tools discover.
 */
export function findSkills(root: string): SkillFolder[] {
  const parents = [root, ...listDirectories(repoPaths.blueprintsDir(root))];
  return parents
    .flatMap((parent) => listDirectories(join(parent, 'skills')))
    .map((dir) => ({
      path: relative(root, dir),
      name: dir.split(sep).at(-1) ?? '',
      file: join(dir, 'SKILL.md'),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Check every skill, and the catalog-wide rule no single skill can check: a
 * name is how both tools address a skill, so it has to be unique here.
 */
export function checkSkills(root: string): SkillProblem[] {
  const skills = findSkills(root);
  const problems = skills.flatMap((skill) => checkSkill(skill));
  const owners = new Map<string, string>();
  for (const skill of skills) {
    const owner = owners.get(skill.name);
    if (owner === undefined) {
      owners.set(skill.name, skill.path);
      continue;
    }
    problems.push({
      file: `${skill.path}/SKILL.md`,
      message: `another skill is also named "${skill.name}" (${owner}); a name addresses one skill`,
    });
  }
  return problems;
}

function checkSkill(skill: SkillFolder): SkillProblem[] {
  const file = `${skill.path}/SKILL.md`;
  const problem = (message: string): SkillProblem => ({ file, message });

  let source: string;
  try {
    source = readFileSync(skill.file, 'utf8');
  } catch {
    return [problem('no SKILL.md: a skill folder without one is invisible to both tools')];
  }

  const frontmatter = readFrontmatter(source);
  if (frontmatter === undefined) {
    return [problem('no YAML frontmatter between --- lines at the top of the file')];
  }

  let fields: Record<string, unknown>;
  try {
    const parsed: unknown = parse(frontmatter);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return [problem('frontmatter is not a mapping of fields')];
    }
    fields = parsed as Record<string, unknown>;
  } catch (error) {
    return [
      problem(`frontmatter is not valid YAML: ${error instanceof Error ? error.message : ''}`),
    ];
  }

  const problems: SkillProblem[] = [];
  const name = fields['name'];
  if (typeof name !== 'string' || name === '') {
    problems.push(problem('frontmatter needs a `name`'));
  } else {
    if (name !== skill.name) {
      problems.push(problem(`name "${name}" does not match the folder name "${skill.name}"`));
    }
    if (!SKILL_NAME.test(name)) {
      problems.push(problem(`name "${name}" must be lower-case words joined by hyphens`));
    }
    if (name.length > MAX_NAME) {
      problems.push(
        problem(`name is ${String(name.length)} characters; the limit is ${String(MAX_NAME)}`),
      );
    }
  }

  const description = fields['description'];
  if (typeof description !== 'string' || description.trim() === '') {
    // The description is what an agent matches against, so an empty one is a
    // skill nobody will ever load.
    problems.push(
      problem('frontmatter needs a `description` saying what it does and when to use it'),
    );
  } else if (description.length > MAX_DESCRIPTION) {
    problems.push(
      problem(
        `description is ${String(description.length)} characters; the limit is ${String(MAX_DESCRIPTION)}`,
      ),
    );
  }

  // Recommended by the tools, required here: a skill is copied into somebody
  // else's repository, and §8 only works if each copy says what it is under.
  if (typeof fields['license'] !== 'string' || fields['license'] === '') {
    problems.push(problem('frontmatter needs a `license`, because the file travels on its own'));
  }

  if ('allowed-tools' in fields && typeof fields['allowed-tools'] !== 'string') {
    problems.push(problem('`allowed-tools` has to be a string, not a list'));
  }

  const metadata = fields['metadata'];
  if (metadata !== null && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const injected = Object.keys(metadata).filter((key) => INSTALL_METADATA.test(key));
    if (injected.length > 0) {
      problems.push(
        problem(
          `frontmatter carries install metadata (${injected.join(', ')}); that belongs to an ` +
            'installed copy, not to the source',
        ),
      );
    }
  }

  return problems;
}

/** The text between the opening `---` and the next one, or undefined. */
function readFrontmatter(source: string): string | undefined {
  const lines = source.split('\n');
  if (lines[0]?.trim() !== '---') return undefined;
  const end = lines.indexOf('---', 1);
  if (end === -1) return undefined;
  return lines.slice(1, end).join('\n');
}

function listDirectories(dir: string): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(dir, entry.name))
    .sort();
}

function relative(root: string, dir: string): string {
  return dir
    .slice(root.length + 1)
    .split(sep)
    .join('/');
}
