import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildIndex, loadBlueprints, loadTaxonomy } from 'forgeprint';
import { makeRepo, validManifest } from 'forgeprint/testing';
import { renderSite } from './render.js';
import { llmsText, SITE_URL, sitemap } from './seo.js';
import type { IndexWithUnits } from './units.js';

function sampleIndex(): IndexWithUnits {
  const root = makeRepo([
    { slug: 'sample-api', manifest: validManifest({ slug: 'sample-api', name: 'Sample API' }) },
  ]);
  const taxonomy = loadTaxonomy(root);
  const index = buildIndex(loadBlueprints(root, taxonomy), taxonomy);
  return {
    ...index,
    agents: [
      { id: 'claude-code', name: 'Claude Code', kind: 'cli', headless: true, docs: 'x' },
      { id: 'codex', name: 'Codex CLI', kind: 'cli', headless: true, docs: 'y' },
    ],
    experts: [
      {
        slug: 'sample-expert',
        name: 'Sample Expert',
        summary: 'Reviews things & says why.',
        role: 'software-architect',
        domain: 'software',
        seniority: 'senior',
        deliverables: ['adr'],
        checklists: ['layering'],
        agents: ['claude-code'],
        tier: 'community',
        maintainers: ['octocat'],
        deprecated: false,
      },
    ],
    crews: [],
    integrations: [
      {
        slug: 'sample-mcp',
        name: 'Sample MCP',
        summary: 'Reads samples.',
        kind: 'mcp',
        upstream: 'https://github.com/example/sample',
        upstream_version: '1.0.0',
        verified_on: '2026-09-24',
        install: { codex: 'codex mcp add sample -- npx -y sample@1.0.0' },
        permissions_summary: 'Reads the samples it is pointed at.',
        fits: ['software'],
        agents: ['claude-code'],
        tier: 'community',
        maintainers: ['octocat'],
        deprecated: false,
      },
    ],
  } as unknown as IndexWithUnits;
}

const INDEX = sampleIndex();
const PAGES = renderSite(INDEX);

function ldOf(html: string): Record<string, unknown> {
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(raw !== undefined, 'no JSON-LD');
  return JSON.parse(raw) as Record<string, unknown>;
}

describe('what a crawler reads on every page', () => {
  it('names itself by an absolute canonical URL', () => {
    for (const page of PAGES) {
      assert.ok(
        page.html.includes(`<link rel="canonical" href="${SITE_URL}${page.path}" />`),
        page.path,
      );
    }
  });

  it('carries Open Graph and Twitter tags', () => {
    for (const page of PAGES) {
      for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'og:site_name']) {
        assert.match(
          page.html,
          new RegExp(`property="${tag}" content="[^"]+"`),
          `${page.path} ${tag}`,
        );
      }
      assert.match(page.html, /name="twitter:card" content="summary"/, page.path);
    }
  });

  it('describes itself in JSON-LD that parses', () => {
    for (const page of PAGES) {
      const data = ldOf(page.html);
      assert.equal(data['@context'], 'https://schema.org', page.path);
      assert.equal(data.url, `${SITE_URL}${page.path}`, page.path);
    }
  });

  it('keeps markup out of the JSON-LD, whatever a summary contains', () => {
    const html = PAGES.find((page) => page.path === 'e/sample-expert.html')?.html ?? '';
    const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? '';
    assert.ok(!raw.includes('<'), raw);
    assert.equal(ldOf(html).description, 'Reviews things & says why.');
  });

  it('points at the machine-readable catalog', () => {
    for (const page of PAGES) {
      assert.match(
        page.html,
        /<link rel="alternate" type="application\/json" href="[^"]*index\.json"/,
      );
    }
  });
});

describe('sitemap.xml', () => {
  const xml = sitemap(PAGES.map((page) => page.path));

  it('lists the landing page and every generated page, absolutely', () => {
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes(`<loc>${SITE_URL}</loc>`));
    for (const page of PAGES)
      assert.ok(xml.includes(`<loc>${SITE_URL}${page.path}</loc>`), page.path);
  });
});

describe('llms.txt', () => {
  const text = llmsText(INDEX);

  it('follows the llms.txt shape: a title, a summary, then sections of links', () => {
    assert.match(text, /^# Forgeprint\n\n> .+\n/);
    assert.match(text, /\n## Blueprints\n/);
    assert.match(text, /\n## Experts\n/);
  });

  it('links every entry to its page, with its summary', () => {
    assert.ok(
      text.includes(
        `- [Sample Expert](${SITE_URL}e/sample-expert.html): Reviews things & says why.`,
      ),
    );
    assert.ok(text.includes(`(${SITE_URL}b/sample-api.html)`));
    assert.ok(text.includes(`(${SITE_URL}i/sample-mcp.html)`));
  });

  it('says how an agent connects, and where the whole index is', () => {
    assert.match(text, /npx -y forgeprint-mcp/);
    assert.ok(text.includes(`${SITE_URL}index.json`));
  });

  it('leaves out a kind with nothing in it', () => {
    assert.ok(!text.includes('## Crews'));
  });
});

describe('catalog content in a translated page', () => {
  const integration = PAGES.find((page) => page.path === 'i/sample-mcp.html')?.html ?? '';

  it('marks entry text as English, so readers and translators treat it so', () => {
    assert.match(integration, /<p lang="en">Reads the samples it is pointed at\.<\/p>/);
    assert.match(integration, /<p class="tagline" lang="en">Reads samples\.<\/p>/);
  });

  it("says, in the reader's language, that entries stay in English", () => {
    assert.match(integration, /class="lang-note"[^>]*data-i18n="site\.contentNote"/);
  });

  it('names the agent an install command is for, not its identifier', () => {
    assert.match(integration, /<h3>Codex CLI<\/h3>/);
  });
});
