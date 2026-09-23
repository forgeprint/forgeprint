import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { findAgent, loadAgentRegistry, type Agent } from './agents.js';
import { findRepoRoot } from './paths.js';
import { RenderError, renderForAgent, writeRendered } from './render.js';
import { loadTaxonomy, terms } from './taxonomy.js';

const root = findRepoRoot();
const registry = loadAgentRegistry(root);

function agent(id: string): Agent {
  const found = findAgent(registry, id);
  assert.ok(found, `${id} is not in the registry`);
  return found;
}

const INPUT = {
  slug: 'sample-api',
  summary: 'A sample API blueprint, used to check what render writes.',
  body: '# Sample\n\nHow to work in this project.\n',
  skills: { 'sample-skill': '---\nname: sample-skill\n---\n\nDo the thing.\n' },
};

describe('render writes what each agent actually reads', () => {
  it('gives Cursor the frontmatter without which it ignores the file', () => {
    // Not decoration: a .cursor/rules file with no frontmatter is skipped
    // entirely, so this is the difference between a rule and a dead file.
    const [file] = renderForAgent(agent('cursor'), INPUT);
    assert.ok(file);
    assert.equal(file.path, '.cursor/rules/sample-api.mdc');
    assert.match(file.contents, /^---\ndescription: .*\nalwaysApply: true\n---\n/);
  });

  it('puts Kiro’s inclusion mode first, as Kiro requires', () => {
    const [file] = renderForAgent(agent('kiro'), INPUT);
    assert.ok(file?.contents.startsWith('---\ninclusion: always\n---\n'));
  });

  it('writes a plain file where the agent wants no frontmatter', () => {
    const [file] = renderForAgent(agent('codex'), INPUT);
    assert.ok(file);
    assert.equal(file.path, 'AGENTS.md');
    assert.equal(file.contents, INPUT.body);
  });

  it('sends skills only to the agents that load them', () => {
    // A skill folder an agent never reads is litter, not compatibility.
    const withSkills = renderForAgent(agent('claude-code'), INPUT).map((file) => file.path);
    const without = renderForAgent(agent('cursor'), INPUT).map((file) => file.path);
    assert.ok(withSkills.includes('.claude/skills/sample-skill/SKILL.md'));
    assert.deepEqual(
      without.filter((path) => path.includes('skill')),
      [],
    );
  });

  it('refuses rather than letting Windsurf truncate in silence', () => {
    // Windsurf caps a workspace rule at 12,000 characters and says nothing.
    // A half-delivered context is worse than a refused one: the agent acts as
    // though it read the whole thing.
    assert.throws(
      () => renderForAgent(agent('windsurf'), { ...INPUT, body: 'x'.repeat(12_001) }),
      (error: unknown) => error instanceof RenderError && /caps .* at 12000/.test(error.message),
    );
  });

  it('fits inside the cap when the content does', () => {
    const files = renderForAgent(agent('windsurf'), { ...INPUT, body: 'x'.repeat(11_000) });
    assert.equal(files.length, 1);
  });
});

describe('every registered agent', () => {
  for (const id of terms(loadTaxonomy(root), 'agents')) {
    it(`${id} renders to a path of its own`, () => {
      const files = renderForAgent(agent(id), INPUT);
      assert.ok(files.length > 0);
      for (const file of files) {
        assert.ok(!file.path.startsWith('/'), 'paths are relative to the output directory');
        assert.ok(!file.path.includes('{slug}'), 'every placeholder is filled in');
        assert.ok(file.contents.endsWith('\n'));
      }
    });
  }

  it('gives no two agents the same target file for the same content', () => {
    // Two agents may legitimately share AGENTS.md. What must not happen is a
    // path that still carries a placeholder, or an empty plan.
    const plans = terms(loadTaxonomy(root), 'agents').map((id) => renderForAgent(agent(id), INPUT));
    assert.ok(plans.every((files) => files.length > 0));
  });
});

describe('writing', () => {
  it('creates the directories the layout needs', () => {
    const out = mkdtempSync(join(tmpdir(), 'forgeprint-render-'));
    const written = writeRendered(out, renderForAgent(agent('cursor'), INPUT));
    assert.deepEqual(written, ['.cursor/rules/sample-api.mdc']);
    assert.match(
      readFileSync(join(out, '.cursor', 'rules', 'sample-api.mdc'), 'utf8'),
      /How to work in this project/,
    );
  });
});
