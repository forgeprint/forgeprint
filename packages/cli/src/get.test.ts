import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { localPlan, publishedPlan } from './get.js';
import { DEFAULT_FILES_URL, DEFAULT_INDEX_URL } from './published.js';
import { makeRepo } from './testing.js';

const AGENT = {
  id: 'cursor',
  name: 'Cursor',
  vendor: 'Anysphere',
  kind: 'ide',
  mcp: { stdio: true, http: true, sse: true },
  context_files: ['.cursor/rules/*.mdc'],
  skill_format: 'SKILL.md',
  skill_path: '.cursor/skills/<name>/SKILL.md',
  install_mcp: null,
  secrets_via: ['env'],
  headless: false,
  headless_command: null,
  limits: 'Rules are per project.',
  render: { path: '.cursor/rules/{slug}.mdc', frontmatter: null, max_chars: null },
  docs: 'https://docs.cursor.com/context/rules',
  last_checked: '2026-09-23',
};

const BLUEPRINT = {
  slug: 'sample-api',
  name: 'Sample API',
  summary: 'A sample.',
  options: { database: ['postgres', 'sqlserver'] },
  integrations: ['sample-mcp'],
  files: ['AGENTS.md', 'manifest.yaml', 'setup.md', 'skills/sample-skill/SKILL.md'],
};

const EXPERT = { slug: 'sample-expert', name: 'Sample Expert', summary: 'Reviews.', files: [] };

const files: Record<string, string> = {
  [DEFAULT_INDEX_URL]: JSON.stringify({
    schema: 1,
    blueprints: [BLUEPRINT],
    experts: [EXPERT],
    agents: [AGENT],
  }),
  [`${DEFAULT_FILES_URL}/blueprints/sample-api/AGENTS.md`]: '# Sample API\n',
  [`${DEFAULT_FILES_URL}/blueprints/sample-api/setup.md`]: '1. Do nothing.\n',
  [`${DEFAULT_FILES_URL}/blueprints/sample-api/skills/sample-skill/SKILL.md`]: '# a skill\n',
  [`${DEFAULT_FILES_URL}/experts/sample-expert/SKILL.md`]: '# an expert\n',
};

const asked: string[] = [];
const read = (url: string): Promise<string> => {
  asked.push(url);
  const page = files[url];
  return page === undefined ? Promise.reject(new Error('HTTP 404')) : Promise.resolve(page);
};

describe('publishedPlan', () => {
  it('builds a blueprint from the index and the published files', async () => {
    const plan = await publishedPlan('sample-api', {}, { read });
    assert.equal(plan.input.body, '# Sample API\n');
    assert.equal(plan.input.summary, 'A sample.');
    assert.ok(plan.recipe, 'a blueprint has a recipe');
    assert.equal(plan.recipe.setup, '1. Do nothing.\n');
    assert.equal(plan.recipe.name, 'Sample API');
    assert.deepEqual(plan.recipe.integrations, ['sample-mcp']);
    assert.match(plan.source, /published catalog/);
  });

  // There is no directory to read over HTTP, so the index's file list is how a
  // skill is found at all.
  it('finds the skills in the index file list, and fetches only those', async () => {
    const plan = await publishedPlan('sample-api', {}, { read });
    assert.deepEqual(Object.keys(plan.input.skills ?? {}), ['sample-skill']);
    assert.ok(!asked.includes(`${DEFAULT_FILES_URL}/blueprints/sample-api/manifest.yaml`));
  });

  it('declares the options the entry declares, so --options is checked', async () => {
    const plan = await publishedPlan('sample-api', {}, { read });
    assert.ok(plan.recipe);
    assert.deepEqual(plan.recipe.declares.options, { database: ['postgres', 'sqlserver'] });
  });

  it("gives an expert's SKILL.md as both the body and the skill, and no recipe", async () => {
    const plan = await publishedPlan('sample-expert', { expert: true }, { read });
    assert.equal(plan.input.body, '# an expert\n');
    assert.deepEqual(plan.input.skills, { 'sample-expert': '# an expert\n' });
    assert.equal(plan.recipe, undefined);
  });

  it('names the agents the published catalog carries', async () => {
    const plan = await publishedPlan('sample-api', {}, { read });
    assert.deepEqual(
      plan.agents.agents.map((agent) => agent.id),
      ['cursor'],
    );
  });
});

describe('localPlan', () => {
  // The two builders exist to produce the same shape; a checkout and the
  // published catalog differ in what is trusted, not in what comes out.
  it('builds the same shape from a checkout', () => {
    const root = makeRepo([{ slug: 'sample-api' }]);
    writeFileSync(
      join(root, 'schema', 'agents.yaml'),
      JSON.stringify({ version: 1, agents: [AGENT] }),
      'utf8',
    );
    const plan = localPlan(root, 'sample-api');
    assert.equal(plan.input.slug, 'sample-api');
    assert.equal(plan.input.body, '# sample-api\n');
    assert.ok(plan.recipe);
    assert.equal(plan.recipe.setup, '1. Do nothing.\n');
    assert.match(plan.source, /^the catalog at /);
  });
});
