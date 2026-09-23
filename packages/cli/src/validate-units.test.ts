import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { stringify } from 'yaml';
import { repoPaths } from './paths.js';
import { loadTaxonomy } from './taxonomy.js';
import { makeRepo } from './testing.js';
import { UNIT_DIRECTORY, type UnitKind } from './unit.js';
import { validateUnits } from './validate-units.js';

type Fields = Record<string, unknown>;

function expert(overrides: Fields = {}): Fields {
  return {
    schema: 1,
    slug: 'sample-architect',
    name: 'Sample Architect',
    version: '1.0.0',
    tier: 'community',
    maintainers: ['octocat'],
    summary: 'A sample expert used by the Forgeprint test suite, and nothing more.',
    agents: ['claude-code'],
    role: 'software-architect',
    domain: 'software',
    seniority: 'senior',
    deliverables: ['adr'],
    checklists: ['layering'],
    ...overrides,
  };
}

function crew(overrides: Fields = {}): Fields {
  return {
    schema: 1,
    slug: 'sample-crew',
    name: 'Sample Crew',
    version: '1.0.0',
    tier: 'community',
    maintainers: ['octocat'],
    summary: 'A sample crew used by the Forgeprint test suite, and nothing more.',
    agents: ['claude-code'],
    byline: "Octocat's Sample Crew",
    members: ['sample-architect'],
    for_what: 'Assembling a team for the test suite, which needs one to exist.',
    not_for: 'Anything anybody would actually ship, because it is a fixture.',
    ...overrides,
  };
}

function integration(overrides: Fields = {}): Fields {
  return {
    schema: 1,
    slug: 'sample-mcp',
    name: 'Sample MCP Server',
    version: '1.0.0',
    tier: 'community',
    maintainers: ['octocat'],
    summary: 'A sample integration used by the Forgeprint test suite, and nothing more.',
    agents: ['claude-code'],
    kind: 'mcp',
    upstream: 'https://example.com/sample-mcp',
    upstream_version: '1.4.2',
    verified_on: '2026-09-23',
    install: { 'claude-code': 'claude mcp add-json sample "{}"' },
    permissions_summary: 'Reads the sample data the test fixture provides, and nothing else.',
    fits: ['software'],
    ...overrides,
  };
}

/** Write one unit folder into a repository the blueprint fixtures created. */
function writeUnit(
  root: string,
  kind: UnitKind,
  manifest: Fields,
  extra: Record<string, string> = {},
): void {
  const slug = String(manifest['slug']);
  const dir = join(root, UNIT_DIRECTORY[kind], slug);
  const files: Record<string, string> = {
    'manifest.yaml': stringify(manifest),
    'CHANGELOG.md': `## ${String(manifest['version'])}\n`,
    ...(kind === 'expert'
      ? {
          'SKILL.md': '---\nname: sample\ndescription: sample\n---\n\nHow this expert works.\n',
          'overview.md': '# Sample\n',
          'references.md': '# References\n\n- Something, v1, checked 2026-09-23\n',
          'checklists/layering.md': '# Layering\n',
        }
      : { 'README.md': `# ${slug}\n` }),
    ...extra,
  };
  for (const [name, contents] of Object.entries(files)) {
    const file = join(dir, ...name.split('/'));
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, contents, 'utf8');
  }
}

/** A repository with the units a test needs, and the messages it produced. */
function check(units: { kind: UnitKind; manifest: Fields; extra?: Record<string, string> }[]): {
  messages: string[];
} {
  const root = makeRepo();
  for (const unit of units) writeUnit(root, unit.kind, unit.manifest, unit.extra);
  const report = validateUnits(root, loadTaxonomy(root));
  return { messages: report.problems.map((problem) => `${problem.slug}: ${problem.message}`) };
}

describe('experts', () => {
  it('accepts one that names what it produces and what it checks', () => {
    assert.deepEqual(check([{ kind: 'expert', manifest: expert() }]).messages, []);
  });

  it('refuses a checklist with no file behind it', () => {
    // The whole point of the unit: a claim with nothing under it is what an
    // expert is not allowed to be (ADR 0012).
    const { messages } = check([{ kind: 'expert', manifest: expert({ checklists: ['ghost'] }) }]);
    assert.deepEqual(messages, ['sample-architect: checklist "ghost" has no checklists/ghost.md']);
  });

  it('refuses a second expert for the same role, domain and seniority', () => {
    const { messages } = check([
      { kind: 'expert', manifest: expert() },
      { kind: 'expert', manifest: expert({ slug: 'other-architect', name: 'Other Architect' }) },
    ]);
    assert.match(messages.join('\n'), /same role \+ domain \+ seniority as "other-architect"/);
  });

  it('allows the same role at a different seniority', () => {
    const { messages } = check([
      { kind: 'expert', manifest: expert() },
      {
        kind: 'expert',
        manifest: expert({
          slug: 'principal-architect',
          name: 'Principal Architect',
          seniority: 'principal',
        }),
      },
    ]);
    assert.deepEqual(messages, []);
  });

  it('refuses pairing with an expert nobody wrote', () => {
    const { messages } = check([{ kind: 'expert', manifest: expert({ pairs_with: ['nobody'] }) }]);
    assert.deepEqual(messages, [
      'sample-architect: pairs_with "nobody", which is not in the catalog',
    ]);
  });

  it('refuses a missing required file', () => {
    const root = makeRepo();
    const dir = join(root, 'experts', 'thin');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'manifest.yaml'), stringify(expert({ slug: 'thin' })), 'utf8');
    const report = validateUnits(root, loadTaxonomy(root));
    assert.match(report.problems[0]?.message ?? '', /missing required file/);
  });
});

describe('crews', () => {
  it('accepts one whose members exist', () => {
    const { messages } = check([
      { kind: 'expert', manifest: expert() },
      { kind: 'crew', manifest: crew() },
    ]);
    assert.deepEqual(messages, []);
  });

  it('refuses a member nobody wrote', () => {
    // Composition's own failure mode: the crew looks complete and resolves to
    // nothing.
    const { messages } = check([{ kind: 'crew', manifest: crew({ members: ['ghost'] }) }]);
    assert.deepEqual(messages, ['sample-crew: member "ghost" is not an expert in the catalog']);
  });

  it('refuses more members than a team can hold', () => {
    const { messages } = check([
      { kind: 'crew', manifest: crew({ members: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }) },
    ]);
    assert.match(messages.join('\n'), /manifest\.yaml: members/);
  });

  it('refuses a second crew with the same members', () => {
    const { messages } = check([
      { kind: 'expert', manifest: expert() },
      { kind: 'crew', manifest: crew() },
      { kind: 'crew', manifest: crew({ slug: 'same-crew', name: 'Same Crew' }) },
    ]);
    assert.match(messages.join('\n'), /same members \+ integrations as "same-crew"/);
  });
});

describe('integrations', () => {
  it('accepts one that is pinned and says what its secrets reach', () => {
    assert.deepEqual(check([{ kind: 'integration', manifest: integration() }]).messages, []);
  });

  it('refuses a moving tag where a pin belongs', () => {
    const { messages } = check([
      { kind: 'integration', manifest: integration({ upstream_version: 'latest' }) },
    ]);
    assert.match(messages.join('\n'), /must be a pinned version, not a moving tag/);
  });

  it('refuses an http upstream', () => {
    const { messages } = check([
      { kind: 'integration', manifest: integration({ upstream: 'http://example.com/x' }) },
    ]);
    assert.match(messages.join('\n'), /upstream/);
  });

  it('refuses two recipes for the same upstream', () => {
    const { messages } = check([
      { kind: 'integration', manifest: integration() },
      {
        kind: 'integration',
        manifest: integration({ slug: 'sample-mcp-two', name: 'Sample MCP Two' }),
      },
    ]);
    assert.match(messages.join('\n'), /same upstream as "sample-mcp"/);
  });

  it('treats a trailing slash as the same upstream', () => {
    const { messages } = check([
      { kind: 'integration', manifest: integration() },
      {
        kind: 'integration',
        manifest: integration({
          slug: 'sample-mcp-two',
          name: 'Sample MCP Two',
          upstream: 'https://example.com/sample-mcp/',
        }),
      },
    ]);
    assert.match(messages.join('\n'), /same upstream/);
  });
});

describe('a catalog with none of these', () => {
  it('is valid, because they arrived after it did', () => {
    const root = makeRepo([{ slug: 'sample-api' }]);
    assert.deepEqual(validateUnits(root, loadTaxonomy(root)).problems, []);
    assert.ok(repoPaths.taxonomy(root).endsWith('taxonomy.yaml'));
  });
});
