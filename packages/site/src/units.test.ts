import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderSite } from './render.js';
import { agentBadges, requestedExperts, type IndexWithUnits } from './units.js';

const AGENTS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    kind: 'cli' as const,
    headless: true,
    docs: 'https://x',
  },
  { id: 'cursor', name: 'Cursor', kind: 'ide' as const, headless: false, docs: 'https://y' },
];

const INDEX = {
  schema: 1,
  taxonomy: {
    version: 1,
    languages: { csharp: 'C#' },
    project_type: { api: 'API service' },
    roles: { 'software-architect': 'Software architect', 'data-engineer': 'Data engineer' },
    domains: { software: 'Software engineering' },
    seniority: { senior: 'Senior' },
    deliverables: { adr: 'Architecture decision record' },
  },
  blueprints: [],
  agents: AGENTS,
  experts: [
    {
      slug: 'sample-architect',
      name: 'Sample Architect',
      summary: 'A sample expert.',
      role: 'software-architect',
      domain: 'software',
      seniority: 'senior',
      languages: ['csharp'],
      deliverables: ['adr'],
      checklists: ['layering'],
      agents: ['claude-code'],
      tier: 'community',
      provenance: 'generated' as const,
      maintainers: ['octocat'],
      deprecated: false,
      files: ['SKILL.md'],
    },
  ],
  crews: [
    {
      slug: 'sample-crew',
      name: 'Sample Crew',
      summary: 'A sample crew.',
      byline: "Octocat's Sample Crew",
      members: ['sample-architect'],
      integrations: ['sample-mcp'],
      for_what: 'Assembling a team.',
      not_for: 'Anything real.',
      agents: ['claude-code'],
      tier: 'community',
      maintainers: ['octocat'],
      deprecated: false,
    },
  ],
  integrations: [
    {
      slug: 'sample-mcp',
      name: 'Sample MCP',
      summary: 'A sample integration.',
      kind: 'mcp',
      upstream: 'https://github.com/example/sample',
      upstream_version: '1.4.2',
      verified_on: '2026-09-23',
      install: { 'claude-code': 'claude mcp add-json sample' },
      needs_secrets: ['SAMPLE_TOKEN'],
      permissions_summary: 'Reads the sample data.',
      fits: ['software'],
      agents: ['claude-code'],
      tier: 'community',
      maintainers: ['octocat'],
      deprecated: false,
    },
  ],
} as unknown as IndexWithUnits;

function pageAt(path: string): string {
  const found = renderSite(INDEX).find((page) => page.path === path);
  assert.ok(found, `no page at ${path}`);
  return found.html;
}

describe('agent badges', () => {
  it('marks tested and untested differently, and not by colour alone', () => {
    const html = agentBadges(['claude-code'], AGENTS);
    assert.match(html, /class="agent tested"[^>]*title="Tested with Claude Code"/);
    assert.match(html, /class="agent"[^>]*title="Cursor: not tested"/);
    // The mark carries the state for a reader who cannot rely on colour.
    assert.match(html, /✓/);
    assert.match(html, /·/);
  });

  it('shows nothing when there is no registry to compare against', () => {
    assert.equal(agentBadges(['claude-code'], []), '');
  });
});

describe('the catalog page', () => {
  const html = pageAt('catalog.html');

  it('has a tab per non-empty kind, and exactly one selected', () => {
    for (const label of ['Experts', 'Crews', 'Integrations']) {
      assert.match(html, new RegExp(`>${label}</span> <span class="count"`));
    }
    assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
  });

  it('gives no tab to a kind with nothing in it', () => {
    // This fixture has no blueprints, so there is nothing to put behind a
    // Blueprints tab and an empty one would only be a dead end.
    assert.ok(!html.includes('>Blueprints <span'));
  });

  it('publishes the roles nobody has filled', () => {
    // An empty role is a contribution call, not a gap (ADR 0012).
    assert.match(html, /1 roles with no expert yet/);
    assert.match(html, /Data engineer/);
    assert.ok(!/>Software architect</.test(requestedExperts(INDEX)));
  });

  it('names the contributor on a crew card', () => {
    assert.match(html, /Octocat&#039;s Sample Crew|Octocat's Sample Crew/);
  });
});

describe('unit pages', () => {
  it('writes one page per expert, crew and integration', () => {
    const paths = renderSite(INDEX).map((page) => page.path);
    assert.ok(paths.includes('e/sample-architect.html'));
    assert.ok(paths.includes('c/sample-crew.html'));
    assert.ok(paths.includes('i/sample-mcp.html'));
  });

  it('says on an expert page that it was generated and not verified', () => {
    assert.match(pageAt('e/sample-architect.html'), /Generated, not manually verified/);
  });

  it('gives a crew page the half that matters: where it is wrong', () => {
    const html = pageAt('c/sample-crew.html');
    assert.match(html, /Where it is wrong/);
    assert.match(html, /Anything real/);
  });

  it('leads an integration page with the third-party warning', () => {
    const html = pageAt('i/sample-mcp.html');
    assert.match(html, /Forgeprint hosts none of this code/);
    assert.match(html, /an agent never enters a secret for you/);
    assert.match(html, /1\.4\.2/);
  });

  it('escapes what it renders', () => {
    const crew = (INDEX.crews ?? [])[0];
    assert.ok(crew);
    const hostile = {
      ...INDEX,
      crews: [{ ...crew, byline: '<script>alert(1)</script>' }],
    } as unknown as IndexWithUnits;
    const page = renderSite(hostile).find((one) => one.path === 'c/sample-crew.html');
    assert.ok(page);
    assert.ok(!page.html.includes('<script>alert(1)</script>'));
    assert.match(page.html, /&lt;script&gt;/);
  });
});

describe('navigation between pages', () => {
  it('sends each unit page back to its own tab of the catalog', () => {
    assert.match(pageAt('e/sample-architect.html'), /href="\.\.\/catalog\.html#experts"/);
    assert.match(pageAt('c/sample-crew.html'), /href="\.\.\/catalog\.html#crews"/);
    assert.match(pageAt('i/sample-mcp.html'), /href="\.\.\/catalog\.html#integrations"/);
  });

  it('opens the catalog tab the address names, and keeps the address in step', () => {
    const html = pageAt('catalog.html');
    assert.match(html, /addEventListener\('hashchange'/);
    assert.match(html, /history\.replaceState/);
  });

  it('gives each panel the id its address names, so the link works without the script', () => {
    const html = pageAt('catalog.html');
    for (const id of ['experts', 'crews', 'integrations']) {
      assert.match(html, new RegExp(`class="cards" id="${id}"`));
    }
  });

  it('links the catalog back to the landing page', () => {
    assert.match(pageAt('catalog.html'), /<a class="home" href="\.\/">/);
  });
});

describe('filtering crews', () => {
  it('finds a crew by an integration it names, not only by its members', () => {
    const card = pageAt('catalog.html').match(/data-terms="sample-crew[^"]*"/)?.[0] ?? '';
    assert.ok(card.includes('sample-mcp'), card);
  });
});

describe('the catalog tabs, as a keyboard user meets them', () => {
  const html = pageAt('catalog.html');

  it('ties each tab to its panel, both ways', () => {
    assert.match(html, /role="tab" id="tab-experts"[^>]*aria-controls="experts"/);
    assert.match(
      html,
      /id="experts" data-kind="expert" role="tabpanel" aria-labelledby="tab-experts"/,
    );
  });

  it('keeps only the selected tab in the tab order', () => {
    assert.match(html, /aria-selected="true" tabindex="0"/);
    assert.match(html, /aria-selected="false" tabindex="-1"/);
  });

  it('moves between tabs with the arrow keys, Home and End', () => {
    assert.match(html, /ArrowRight/);
    assert.match(html, /ArrowLeft/);
    assert.match(html, /'Home'/);
    assert.match(html, /'End'/);
  });
});

describe('a hosted integration', () => {
  const hosted = {
    ...INDEX,
    integrations: [
      { ...(INDEX.integrations?.[0] ?? {}), slug: 'sample-hosted', upstream_version: 'hosted' },
    ],
  } as unknown as IndexWithUnits;
  const pages = renderSite(hosted);
  const card = pages.find((page) => page.path === 'catalog.html')?.html ?? '';
  const detail = pages.find((page) => page.path === 'i/sample-hosted.html')?.html ?? '';

  it('says hosted and when it was checked, not "pinned hosted"', () => {
    assert.doesNotMatch(card, /pinned hosted/);
    assert.match(card, /hosted, checked \d{4}-\d{2}-\d{2}/);
  });

  it('says on its page that a hosted server cannot be pinned', () => {
    assert.match(detail, /cannot be pinned/);
  });
});
