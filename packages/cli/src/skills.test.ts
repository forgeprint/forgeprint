import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { makeRepo } from './testing.js';
import { checkSkills, findSkills } from './skills.js';

const VALID = [
  '---',
  'name: efcore-migrations',
  'description: Create, review, apply and undo EF Core migrations.',
  'license: CC-BY-4.0',
  '---',
  '',
  '# EF Core migrations',
  '',
].join('\n');

/** A repository with one blueprint and the given root-level skills. */
function repoWith(skills: Readonly<Record<string, string>>, blueprintSkill?: string): string {
  const root = makeRepo([
    {
      slug: 'sample-api',
      files:
        blueprintSkill === undefined ? {} : { 'skills/efcore-migrations/SKILL.md': blueprintSkill },
    },
  ]);
  for (const [name, contents] of Object.entries(skills)) {
    const dir = join(root, 'skills', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), contents, 'utf8');
  }
  return root;
}

describe('findSkills', () => {
  it('finds the catalog skills and the ones a blueprint ships', () => {
    const root = repoWith(
      { 'blueprint-author': VALID.replace('efcore-migrations', 'blueprint-author') },
      VALID,
    );
    assert.deepEqual(
      findSkills(root).map((skill) => skill.path),
      // Both are `<something>/skills/<name>`, which is what the tools discover.
      ['blueprints/sample-api/skills/efcore-migrations', 'skills/blueprint-author'],
    );
  });

  it('finds nothing in a repository without skills, rather than failing', () => {
    assert.deepEqual(findSkills(makeRepo([])), []);
  });
});

describe('checkSkills', () => {
  const only = (skill: string): ReturnType<typeof checkSkills> =>
    checkSkills(repoWith({ 'efcore-migrations': skill }));

  it('passes a skill that both tools can install', () => {
    assert.deepEqual(only(VALID), []);
  });

  it('refuses a name that does not match the folder, because that is the address', () => {
    const problems = only(VALID.replace('name: efcore-migrations', 'name: migrations'));
    assert.match(problems[0]?.message ?? '', /does not match the folder name/);
  });

  it('refuses a name that is not lower-case words joined by hyphens', () => {
    const root = repoWith({ EfCore: VALID.replace('name: efcore-migrations', 'name: EfCore') });
    assert.match(
      checkSkills(root).find((p) => /lower-case/.test(p.message))?.message ?? '',
      /lower-case words joined by hyphens/,
    );
  });

  it('refuses a missing description, which is what an agent matches against', () => {
    const problems = only(VALID.replace(/^description:.*$/m, 'description: ""'));
    assert.match(problems[0]?.message ?? '', /needs a `description`/);
  });

  it('requires a license, because the file is copied into another repository', () => {
    const problems = only(VALID.replace(/^license:.*\n/m, ''));
    assert.match(problems[0]?.message ?? '', /needs a `license`/);
  });

  it('refuses allowed-tools as a list, which the publisher rejects', () => {
    const problems = only(
      VALID.replace('license: CC-BY-4.0', 'license: X\nallowed-tools: [shell]'),
    );
    assert.match(problems[0]?.message ?? '', /has to be a string/);
  });

  it('refuses install metadata that was committed by mistake', () => {
    // `gh skill install` injects these into the copy it writes; committing
    // them back into the source breaks its update detection.
    const problems = only(
      VALID.replace('license: CC-BY-4.0', 'license: X\nmetadata:\n  github-path: skills/x'),
    );
    assert.match(problems[0]?.message ?? '', /install metadata/);
  });

  it('refuses two skills with the same name, because a name has to address one', () => {
    const root = repoWith({ 'efcore-migrations': VALID }, VALID);
    assert.match(checkSkills(root)[0]?.message ?? '', /another skill is also named/);
  });

  it('says so when there is no frontmatter at all', () => {
    assert.match(only('# A skill\n')[0]?.message ?? '', /no YAML frontmatter/);
  });

  it('says so when the folder has no SKILL.md', () => {
    const root = makeRepo([]);
    mkdirSync(join(root, 'skills', 'empty'), { recursive: true });
    assert.match(checkSkills(root)[0]?.message ?? '', /no SKILL\.md/);
  });
});
