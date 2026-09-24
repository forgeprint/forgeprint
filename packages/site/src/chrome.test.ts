import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildIndex, loadBlueprints, loadTaxonomy } from 'forgeprint';
import { makeRepo, validManifest } from 'forgeprint/testing';
import { attr, CHROME, keysIn, SITE_SCRIPT, t } from './chrome.js';
import { renderSite } from './render.js';
import type { IndexWithUnits } from './units.js';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const dictionary = (lang: string): Record<string, unknown> =>
  JSON.parse(readFileSync(`${REPO}docs/i18n/${lang}.json`, 'utf8')) as Record<string, unknown>;

function sampleSite(): { path: string; html: string }[] {
  const root = makeRepo([
    {
      slug: 'sample-api',
      manifest: validManifest({
        slug: 'sample-api',
        options: { database: ['postgres', 'sqlserver'] },
        provides: { mcp: ['github'], skills: ['testing'] },
      }),
    },
  ]);
  const taxonomy = loadTaxonomy(root);
  const index = buildIndex(loadBlueprints(root, taxonomy), taxonomy) as unknown as IndexWithUnits;
  const units = {
    ...index,
    taxonomy: { ...index.taxonomy, roles: { 'data-engineer': 'Data engineer' } },
    agents: [{ id: 'claude-code', name: 'Claude Code', kind: 'cli', headless: true, docs: 'x' }],
    experts: [
      {
        slug: 'sample-expert',
        name: 'Sample Expert',
        summary: 'x',
        role: 'software-architect',
        domain: 'software',
        seniority: 'senior',
        deliverables: ['adr'],
        checklists: ['layering'],
        pairs_with: ['other'],
        agents: ['claude-code'],
        tier: 'community',
        provenance: 'generated',
        maintainers: ['octocat'],
        deprecated: false,
      },
    ],
    crews: [
      {
        slug: 'sample-crew',
        name: 'Sample Crew',
        summary: 'x',
        byline: 'x',
        members: ['sample-expert'],
        integrations: ['sample-mcp'],
        for_what: 'x',
        not_for: 'x',
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
        summary: 'x',
        kind: 'mcp',
        upstream: 'https://github.com/example/sample',
        upstream_version: '1.0.0',
        verified_on: '2026-09-24',
        install: { 'claude-code': 'claude mcp add sample -- npx -y sample@1.0.0' },
        needs_secrets: ['SAMPLE_TOKEN'],
        permissions_summary: 'x',
        fits: ['software'],
        agents: ['claude-code'],
        tier: 'community',
        maintainers: ['octocat'],
        deprecated: false,
      },
    ],
  } as unknown as IndexWithUnits;
  return renderSite(units, {
    requests: [
      {
        number: 1,
        title: 'x',
        url: 'https://github.com/forgeprint/forgeprint/issues/1',
        author: 'someone',
      },
    ],
    requestsFrom: '2026-09-24',
    featured: ['octocat'],
  });
}

describe('the language switch', () => {
  const pages = sampleSite();

  it('is on every page, with the script at the right depth', () => {
    assert.ok(pages.length >= 5);
    for (const page of pages) {
      assert.match(page.html, /data-lang="tr"/, page.path);
      const up = '../'.repeat(page.path.split('/').length - 1);
      assert.ok(page.html.includes(`<script src="${up}site.js"></script>`), page.path);
    }
  });

  it('uses only words the English source has', () => {
    for (const page of pages) {
      for (const key of keysIn(page.html)) {
        assert.ok(key in CHROME, `${page.path}: site.${key} is not in CHROME`);
      }
    }
  });

  it('has every word translated in every dictionary the site ships', () => {
    for (const lang of ['tr']) {
      const site = (dictionary(lang).site ?? {}) as Record<string, string>;
      const missing = Object.keys(CHROME).filter((key) => typeof site[key] !== 'string');
      assert.deepEqual(missing, [], `${lang}.json is missing site.${missing.join(', site.')}`);
      const stray = Object.keys(site).filter((key) => !(key in CHROME));
      assert.deepEqual(stray, [], `${lang}.json has site keys nothing uses`);
    }
  });

  it('keeps each placeholder in the translation', () => {
    const site = (dictionary('tr').site ?? {}) as Record<string, string>;
    for (const [key, english] of Object.entries(CHROME)) {
      const wanted = [...english.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
      const found = [...(site[key] ?? '').matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
      assert.deepEqual(found, wanted, `site.${key}`);
    }
  });

  it('remembers the choice under the key the landing page uses', () => {
    const landing = readFileSync(`${REPO}docs/assets/promo.js`, 'utf8');
    assert.match(landing, /'forgeprint\.lang'/);
    assert.match(SITE_SCRIPT, /'forgeprint\.lang'/);
  });
});

describe('marking chrome', () => {
  it('writes the English in, and carries the placeholders for the script', () => {
    assert.equal(
      t('rolesOpen', { n: 3 }, 'h2'),
      '<h2 data-i18n="site.rolesOpen" data-arg-n="3">3 roles with no expert yet</h2>',
    );
  });

  it('escapes what it writes', () => {
    assert.match(attr('title', 'testedWith', { agent: '<x>' }), /title="Tested with &lt;x&gt;"/);
  });
});
