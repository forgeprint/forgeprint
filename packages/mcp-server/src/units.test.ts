import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from './index.js';
import type { CatalogSource } from './catalog.js';
import { MAX_RECOMMENDED_EXPERTS } from './units.js';

/** A catalog small enough to read in a failure message. */
function source(index: Record<string, unknown>, files: Record<string, string> = {}): CatalogSource {
  return {
    description: 'test catalog',
    loadIndex: () => Promise.resolve(index as never),
    readFile: (slug, path, kind = 'blueprint') => {
      const key = `${kind}/${slug}/${path}`;
      const contents = files[key];
      if (contents === undefined) return Promise.reject(new Error(`no ${key}`));
      return Promise.resolve(contents);
    },
  };
}

const EXPERT = {
  slug: 'sample-architect',
  name: 'Sample Architect',
  summary: 'A sample expert used by the test suite.',
  role: 'software-architect',
  domain: 'software',
  seniority: 'senior',
  languages: ['csharp'],
  deliverables: ['adr'],
  checklists: ['layering'],
  tier: 'community',
  maintainers: ['octocat'],
  files: ['SKILL.md', 'overview.md', 'references.md', 'checklists/layering.md', 'CHANGELOG.md'],
};

const REVIEWER = {
  ...EXPERT,
  slug: 'sample-reviewer',
  name: 'Sample Reviewer',
  summary: 'Reviews things for security, in the test suite.',
  role: 'security-reviewer',
  domain: 'security',
  languages: [],
  deliverables: ['security-review'],
  checklists: ['boundaries'],
};

const CREW = {
  slug: 'sample-crew',
  name: 'Sample Crew',
  summary: 'A sample crew.',
  byline: "Octocat's Sample Crew",
  members: ['sample-architect', 'sample-reviewer'],
  integrations: ['sample-mcp'],
  for_what: 'Assembling a team for the test suite.',
  not_for: 'Anything real.',
  tier: 'community',
  maintainers: ['octocat'],
  files: ['README.md', 'CHANGELOG.md'],
};

const INTEGRATION = {
  slug: 'sample-mcp',
  name: 'Sample MCP',
  summary: 'A sample integration.',
  kind: 'mcp',
  upstream: 'https://example.com/sample',
  upstream_version: '1.4.2',
  verified_on: '2026-09-23',
  install: { 'claude-code': 'claude mcp add-json sample "{}"' },
  needs_secrets: ['SAMPLE_TOKEN'],
  permissions_summary: 'Reads the sample data.',
  fits: ['software'],
  tier: 'community',
  maintainers: ['octocat'],
  files: ['README.md', 'CHANGELOG.md'],
};

const AGENTS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    skill_path: '.claude/skills/<name>/SKILL.md',
    install_mcp: 'claude mcp add-json <name>',
    render: { path: 'CLAUDE.md', frontmatter: null, max_chars: null },
    limits: 'none',
    docs: 'https://example.com/claude',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    skill_path: null,
    install_mcp: null,
    render: {
      path: '.cursor/rules/{slug}.mdc',
      frontmatter: { alwaysApply: 'true' },
      max_chars: null,
    },
    limits: 'editor',
    docs: 'https://example.com/cursor',
  },
];

/** Only the vocabularies `resolve` reads; the unit tools read none of them. */
const TAXONOMY = {
  version: 1,
  languages: { csharp: 'C#' },
  stack: { aspnetcore: 'ASP.NET Core' },
  project_type: { api: 'API service' },
  platforms: { docker: 'Docker' },
  distribution: { saas: 'SaaS' },
  requirements: { auth: 'Authentication' },
};

const INDEX = {
  schema: 1,
  taxonomy: TAXONOMY,
  blueprints: [],
  agents: AGENTS,
  experts: [EXPERT, REVIEWER],
  crews: [CREW],
  integrations: [INTEGRATION],
};

const FILES = {
  'expert/sample-architect/SKILL.md': '---\nname: sample-architect\n---\n\nHow it works.\n',
  'expert/sample-architect/overview.md': '# Overview\n',
  'expert/sample-architect/references.md': '# References\n',
  'expert/sample-architect/checklists/layering.md': '# Layering\n',
  'crew/sample-crew/README.md': '# Sample Crew\n',
  'integration/sample-mcp/README.md': '# Sample MCP\n',
};

async function connect(index: Record<string, unknown> = INDEX): Promise<Client> {
  const [serverSide, clientSide] = InMemoryTransport.createLinkedPair();
  const server = createServer(source(index, FILES));
  const client = new Client({ name: 'test', version: '0' });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return client;
}

async function call(client: Client, name: string, args: Record<string, unknown>): Promise<never> {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as { text: string }[];
  const text = content[0]?.text ?? '';
  if (result.isError === true) throw new Error(text);
  return JSON.parse(text) as never;
}

describe('get_expert', () => {
  it('returns the manifest and every file that makes it checkable', async () => {
    const payload: { expert: { slug: string }; files: Record<string, string> } = await call(
      await connect(),
      'get_expert',
      { slug: 'sample-architect' },
    );
    assert.equal(payload.expert.slug, 'sample-architect');
    // The checklists are the point: an expert without them is a job title.
    assert.ok('checklists/layering.md' in payload.files);
    assert.ok('references.md' in payload.files);
    // The changelog is not content the agent should act on.
    assert.ok(!('CHANGELOG.md' in payload.files));
  });

  it('says where the files go for an agent that loads skills', async () => {
    const payload: { write_to: Record<string, string> } = await call(
      await connect(),
      'get_expert',
      { slug: 'sample-architect', agent: 'claude-code' },
    );
    assert.equal(payload.write_to['context'], 'CLAUDE.md');
    assert.equal(payload.write_to['skill'], '.claude/skills/sample-architect/SKILL.md');
  });

  it('offers no skill path to an agent that loads none', async () => {
    // A skill folder an agent never reads is litter, not compatibility.
    const payload: { write_to: Record<string, string> } = await call(
      await connect(),
      'get_expert',
      { slug: 'sample-architect', agent: 'cursor' },
    );
    assert.equal(payload.write_to['context'], '.cursor/rules/sample-architect.mdc');
    assert.ok(!('skill' in payload.write_to));
  });

  it('names what the catalog has when the slug is wrong', async () => {
    await assert.rejects(
      call(await connect(), 'get_expert', { slug: 'nobody' }),
      /sample-architect/,
    );
  });

  it('says the catalog has no experts rather than that the slug is wrong', async () => {
    await assert.rejects(
      call(await connect({ ...INDEX, experts: [] }), 'get_expert', { slug: 'anyone' }),
      /no experts yet/,
    );
  });
});

describe('get_crew', () => {
  it('resolves its members and its integrations', async () => {
    const payload: {
      members: { slug: string }[];
      integrations: { slug: string; install?: string; note: string }[];
    } = await call(await connect(), 'get_crew', { slug: 'sample-crew', agent: 'claude-code' });

    assert.deepEqual(
      payload.members.map((member) => member.slug),
      ['sample-architect', 'sample-reviewer'],
    );
    const first = payload.integrations[0];
    assert.ok(first);
    assert.equal(first.install, 'claude mcp add-json sample "{}"');
    assert.match(first.note, /Third-party software/);
  });

  it('omits the install command for an agent with no verified syntax', async () => {
    const payload: { integrations: { install?: string }[] } = await call(
      await connect(),
      'get_crew',
      { slug: 'sample-crew', agent: 'cursor' },
    );
    assert.equal(payload.integrations[0]?.install, undefined);
  });
});

describe('get_integration', () => {
  it('carries the permissions and the upstream note', async () => {
    const payload: { integration: { permissions_summary: string }; note: string } = await call(
      await connect(),
      'get_integration',
      { slug: 'sample-mcp' },
    );
    assert.equal(payload.integration.permissions_summary, 'Reads the sample data.');
    assert.match(payload.note, /never enters a secret/);
  });

  it('says so, and where to look, when an agent has no verified command', async () => {
    // A guessed command is worse than a missing one (ADR 0013).
    const payload: { install?: string; install_unavailable?: string } = await call(
      await connect(),
      'get_integration',
      { slug: 'sample-mcp', agent: 'cursor' },
    );
    assert.equal(payload.install, undefined);
    assert.match(payload.install_unavailable ?? '', /example\.com\/cursor/);
  });
});

describe('recommend_experts', () => {
  it('returns at most three, never a list to browse', async () => {
    const payload: { experts: { slug: string }[] } = await call(
      await connect(),
      'recommend_experts',
      { task: 'something entirely unrelated to anything' },
    );
    assert.ok(payload.experts.length <= MAX_RECOMMENDED_EXPERTS);
  });

  it('puts the matching domain first', async () => {
    const payload: { experts: { slug: string; why: string }[] } = await call(
      await connect(),
      'recommend_experts',
      { task: 'review this for security', domains: ['security'] },
    );
    const first = payload.experts[0];
    assert.ok(first);
    assert.equal(first.slug, 'sample-reviewer');
    assert.match(first.why, /security/);
  });

  it('returns one crew when the task is plainly the whole job it is for', async () => {
    const payload: { crew?: { slug: string }; experts?: unknown[] } = await call(
      await connect(),
      'recommend_experts',
      { task: 'assembling a team for the test suite' },
    );
    assert.equal(payload.crew?.slug, 'sample-crew');
    assert.equal(payload.experts, undefined);
  });

  it('does not reach for a crew on a narrow question', async () => {
    // Recommending a whole crew for a one-expert question is how a single
    // answer turns into a catalog dump.
    const payload: { crew?: unknown; experts?: unknown[] } = await call(
      await connect(),
      'recommend_experts',
      { task: 'security', domains: ['security'] },
    );
    assert.equal(payload.crew, undefined);
    assert.ok(Array.isArray(payload.experts));
  });

  it('says the catalog is empty rather than inventing an expert', async () => {
    const payload: { experts: unknown[]; note: string } = await call(
      await connect({ ...INDEX, experts: [], crews: [] }),
      'recommend_experts',
      { task: 'anything' },
    );
    assert.deepEqual(payload.experts, []);
    assert.match(payload.note, /no experts yet/);
  });
});

describe('resolve intent', () => {
  for (const [intent, tool] of [
    ['expert', 'recommend_experts'],
    ['crew', 'recommend_experts'],
    ['integration', 'get_integration'],
  ] as const) {
    it(`routes ${intent} to ${tool} instead of answering with a blueprint`, async () => {
      const payload: { status: string; tool: string } = await call(await connect(), 'resolve', {
        intent,
        goal: 'whatever the user said',
      });
      assert.equal(payload.status, 'use_another_tool');
      assert.equal(payload.tool, tool);
    });
  }

  it('answers normally when the intent is a project', async () => {
    const payload: { status: string } = await call(await connect(), 'resolve', {
      intent: 'project',
      goal: 'an api',
    });
    assert.notEqual(payload.status, 'use_another_tool');
  });
});
