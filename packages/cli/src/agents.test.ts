import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  findAgent,
  loadAgentRegistry,
  parseAgentRegistry,
  staleAgents,
  vocabularyMismatches,
  type AgentRegistry,
} from './agents.js';
import { findRepoRoot } from './paths.js';
import { describeError, loadTaxonomy, terms } from './taxonomy.js';

/** One well-formed entry, so a test only states the field it is about. */
function entry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'sample-agent',
    name: 'Sample Agent',
    vendor: 'Example',
    kind: 'cli',
    mcp: { stdio: true, http: false, sse: false },
    context_files: ['AGENTS.md'],
    skill_format: null,
    skill_path: null,
    install_mcp: null,
    secrets_via: ['env'],
    headless: false,
    headless_command: null,
    limits: 'Nothing worth noting.',
    docs: 'https://example.com/docs',
    last_checked: '2026-09-23',
    ...overrides,
  };
}

function registry(...agents: Record<string, unknown>[]): AgentRegistry {
  return parseAgentRegistry(JSON.stringify({ version: 1, agents }));
}

/** What the maintainer would read, rather than the raw issue list. */
function refusal(...agents: Record<string, unknown>[]): string {
  try {
    registry(...agents);
  } catch (error) {
    return describeError(error);
  }
  return 'it was accepted';
}

describe('the agent registry', () => {
  it('reads an entry back', () => {
    const agent = findAgent(registry(entry()), 'sample-agent');
    assert.ok(agent);
    assert.equal(agent.name, 'Sample Agent');
    assert.equal(agent.mcp.stdio, true);
  });

  it('refuses an entry that claims headless without saying how', () => {
    // Half a record is worse than none: a matrix built from it would schedule
    // a run nobody can start.
    assert.match(refusal(entry({ headless: true })), /headless and headless_command must agree/);
  });

  it('refuses a skill format with no path to write it to', () => {
    assert.match(
      refusal(entry({ skill_format: 'SKILL.md' })),
      /skill_format and skill_path must agree/,
    );
  });

  it('refuses two entries with the same id', () => {
    assert.match(refusal(entry(), entry()), /duplicate id/);
  });

  it('refuses a field nobody verified, rather than accepting a guess', () => {
    assert.match(refusal(entry({ docs: 'http://example.com' })), /docs/);
  });
});

describe('registry against vocabulary', () => {
  const taxonomy = loadTaxonomy(findRepoRoot());

  it('reports an agent the vocabulary does not know', () => {
    assert.deepEqual(vocabularyMismatches(registry(entry()), taxonomy).slice(0, 1), [
      '"sample-agent" is in schema/agents.yaml but not in the agents vocabulary',
    ]);
  });

  it('reports a vocabulary value with no entry behind it', () => {
    const mismatches = vocabularyMismatches(registry(entry({ id: 'claude-code' })), taxonomy);
    assert.ok(
      mismatches.some((message) => message.includes('has no schema/agents.yaml entry')),
      mismatches.join('\n'),
    );
  });

  it('is satisfied by the repository as it stands', () => {
    // The check that matters: this file and the taxonomy are one list written
    // twice, and nothing keeps them together except this (ADR 0013).
    const root = findRepoRoot();
    assert.deepEqual(vocabularyMismatches(loadAgentRegistry(root), loadTaxonomy(root)), []);
  });
});

describe('staleness', () => {
  it('names entries nobody has re-read inside the interval, oldest first', () => {
    const old = registry(
      entry({ id: 'older', last_checked: '2026-01-01' }),
      entry({ id: 'newer', last_checked: '2026-03-01' }),
      entry({ id: 'fresh', last_checked: '2026-09-01' }),
    );
    assert.deepEqual(
      staleAgents(old, new Date('2026-09-23T00:00:00Z')).map((agent) => agent.id),
      ['older', 'newer'],
    );
  });

  it('counts an entry checked exactly at the boundary as still fresh', () => {
    const at = registry(entry({ last_checked: '2026-06-25' }));
    assert.deepEqual(staleAgents(at, new Date('2026-09-23T00:00:00Z')), []);
  });
});

describe('every agent in the vocabulary', () => {
  const root = findRepoRoot();
  const loaded = loadAgentRegistry(root);

  for (const id of terms(loadTaxonomy(root), 'agents')) {
    it(`${id} records what a renderer needs`, () => {
      const agent = findAgent(loaded, id);
      assert.ok(agent, `${id} has no registry entry`);
      // `forgeprint render` writes the first context file, so an entry
      // without one cannot be rendered for.
      assert.ok(agent.context_files.length > 0);
      assert.ok(agent.docs.startsWith('https://'));
    });
  }
});
