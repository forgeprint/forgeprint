import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_FILES_URL,
  DEFAULT_INDEX_URL,
  FALLBACK_INDEX_URL,
  loadPublishedIndex,
  publishedAgents,
  publishedEntry,
  publishedFileUrl,
  publishedUrls,
  PublishedCatalogError,
  readPublishedFile,
} from './published.js';
import type { CatalogIndex } from './build-index.js';

/** An agent the registry schema accepts, so the validation is exercised for real. */
const AGENT = {
  id: 'cursor',
  name: 'Cursor',
  vendor: 'Anysphere',
  kind: 'ide',
  mcp: { stdio: true, http: true, sse: true },
  context_files: ['.cursor/rules/*.mdc'],
  skill_format: null,
  skill_path: null,
  install_mcp: null,
  secrets_via: ['env'],
  headless: false,
  headless_command: null,
  limits: 'Rules are per project.',
  render: { path: '.cursor/rules/{slug}.mdc', frontmatter: null, max_chars: null },
  docs: 'https://docs.cursor.com/context/rules',
  last_checked: '2026-09-23',
};

const INDEX = { schema: 1, blueprints: [{ slug: 'a-blueprint' }], agents: [AGENT] };

/** A reader that answers from a map, so no test touches the network. */
function reading(pages: Readonly<Record<string, string>>) {
  const asked: string[] = [];
  const read = (url: string): Promise<string> => {
    asked.push(url);
    const page = pages[url];
    return page === undefined ? Promise.reject(new Error('HTTP 404')) : Promise.resolve(page);
  };
  return { read, asked };
}

describe('publishedUrls', () => {
  it('defaults to Pages for the index and the raw repository for files', () => {
    const urls = publishedUrls({}, {});
    assert.equal(urls.indexUrl, DEFAULT_INDEX_URL);
    assert.equal(urls.filesUrl, DEFAULT_FILES_URL);
  });

  // The two variables the MCP server already documents, so a mirror is
  // configured once rather than once per door.
  it('takes the environment overrides the MCP server uses', () => {
    const urls = publishedUrls(
      {},
      { FORGEPRINT_INDEX_URL: 'https://mirror/index.json', FORGEPRINT_FILES_URL: 'https://mirror' },
    );
    assert.equal(urls.indexUrl, 'https://mirror/index.json');
    assert.equal(urls.filesUrl, 'https://mirror');
  });

  it('ignores an empty variable rather than fetching an empty URL', () => {
    assert.equal(publishedUrls({}, { FORGEPRINT_INDEX_URL: '' }).indexUrl, DEFAULT_INDEX_URL);
  });
});

describe('loadPublishedIndex', () => {
  it('reads the published index', async () => {
    const { read } = reading({ [DEFAULT_INDEX_URL]: JSON.stringify(INDEX) });
    const { index, from } = await loadPublishedIndex({ read });
    assert.equal(index.blueprints[0]?.slug, 'a-blueprint');
    assert.equal(from, DEFAULT_INDEX_URL);
  });

  // Pages is a deployment, and a deployment has minutes when it is not there.
  it('falls back to the raw repository when Pages does not answer', async () => {
    const { read, asked } = reading({ [FALLBACK_INDEX_URL]: JSON.stringify(INDEX) });
    const { index, from } = await loadPublishedIndex({ read });
    assert.equal(index.blueprints.length, 1);
    assert.deepEqual(asked, [DEFAULT_INDEX_URL, FALLBACK_INDEX_URL]);
    // Reported, because `get` prints which catalog answered.
    assert.equal(from, FALLBACK_INDEX_URL);
  });

  it('names both URLs and what to do offline when neither answers', async () => {
    const { read } = reading({});
    await assert.rejects(loadPublishedIndex({ read }), (error: Error) => {
      assert.ok(error instanceof PublishedCatalogError);
      assert.match(error.message, /index\.json: HTTP 404/);
      assert.match(error.message, /--root/);
      return true;
    });
  });

  it('refuses a document that parses but is not a catalog', async () => {
    const { read } = reading({ [DEFAULT_INDEX_URL]: '{"nope":true}' });
    await assert.rejects(loadPublishedIndex({ read, fallbackIndexUrl: null }), /not a catalog/);
  });
});

describe('readPublishedFile', () => {
  it('reads a file from the entry folder its kind lives in', async () => {
    const url = `${DEFAULT_FILES_URL}/experts/code-reviewer/SKILL.md`;
    const { read } = reading({ [url]: '# a skill\n' });
    assert.equal(
      await readPublishedFile('expert', 'code-reviewer', 'SKILL.md', { read }),
      '# a skill\n',
    );
    assert.equal(publishedFileUrl('expert', 'code-reviewer', 'SKILL.md'), url);
  });

  it('says which file, which entry and which URL when it is not there', async () => {
    const { read } = reading({});
    await assert.rejects(readPublishedFile('blueprint', 'a-blueprint', 'AGENTS.md', { read }), {
      message: /AGENTS\.md of blueprint "a-blueprint" from https:.*HTTP 404/,
    });
  });
});

describe('publishedAgents', () => {
  it('validates what was published, because render reads a file layout from it', () => {
    const registry = publishedAgents(INDEX as unknown as CatalogIndex);
    assert.equal(registry.agents[0]?.render.path, '.cursor/rules/{slug}.mdc');
    assert.equal(registry.version, 1);
  });

  it('says the catalog is too old rather than failing inside the renderer', () => {
    assert.throws(() => publishedAgents({ blueprints: [] } as unknown as CatalogIndex), {
      message: /carries no agent registry/,
    });
  });

  it('refuses an agent entry this version does not understand', () => {
    const broken = { blueprints: [], agents: [{ ...AGENT, render: { path: '' } }] };
    assert.throws(() => publishedAgents(broken as unknown as CatalogIndex), PublishedCatalogError);
  });
});

describe('publishedEntry', () => {
  it('names what the catalog does have', () => {
    assert.throws(() => publishedEntry([{ slug: 'one' }, { slug: 'two' }], 'blueprint', 'three'), {
      message: 'No blueprint "three". The published catalog has: one, two',
    });
  });

  it('says a kind is empty rather than listing nothing', () => {
    assert.throws(() => publishedEntry(undefined, 'crew', 'any'), {
      message: 'No crew "any": the published catalog has no crews',
    });
  });
});
