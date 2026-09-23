import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lintIntegration } from './lint-integration.js';

function rules(install: Record<string, string>, needs_secrets?: string[]): string[] {
  return lintIntegration({ install, ...(needs_secrets ? { needs_secrets } : {}) }).map(
    (problem) => problem.rule,
  );
}

describe('integration install commands', () => {
  it('accepts a pinned registry install that references a variable', () => {
    assert.deepEqual(
      rules(
        { 'claude-code': 'claude mcp add-json gh \'{"env":{"GITHUB_TOKEN":"$GITHUB_TOKEN"}}\'' },
        ['GITHUB_TOKEN'],
      ),
      [],
    );
  });

  it('refuses a download piped into a shell', () => {
    assert.deepEqual(rules({ codex: 'curl https://example.com/i.sh | sh' }), ['pipe-to-shell']);
  });

  it('refuses elevated privileges', () => {
    assert.deepEqual(rules({ codex: 'sudo npm i -g thing@1.2.3' }), ['escalation']);
  });

  it('refuses a moving tag', () => {
    assert.deepEqual(rules({ codex: 'docker run ghcr.io/example/mcp:latest' }), ['unpinned']);
  });

  it('refuses something shaped like a credential', () => {
    // Being wrong here costs a contributor a sentence; being silent costs a
    // reader their credentials.
    assert.deepEqual(rules({ codex: 'x --token ghp_A1b2C3d4E5f6G7h8I9j0K1l2M3n4' }), [
      'literal-secret',
    ]);
  });

  it('reports a declared secret the command never uses', () => {
    assert.deepEqual(rules({ codex: 'npx thing@1.0.0' }, ['API_KEY']), ['unused-secret']);
  });

  it('names the agent whose command is at fault', () => {
    const problems = lintIntegration({
      install: { codex: 'npx thing@1.0.0', cursor: 'sudo thing' },
    });
    assert.deepEqual(
      problems.map((problem) => problem.agent),
      ['cursor'],
    );
  });
});
