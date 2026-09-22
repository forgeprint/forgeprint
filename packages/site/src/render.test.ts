import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildIndex, loadBlueprints, loadTaxonomy, type CatalogIndex } from 'forgeprint';
import { makeRepo, validManifest, type BlueprintFixture } from 'forgeprint/testing';
import { escape, renderBlueprintPage, renderIndexPage, renderSite } from './render.js';

const CONTEXT = {
  requests: [
    {
      number: 7,
      title: 'Blueprint request: Rust CLI',
      url: 'https://github.com/forgeprint/forgeprint/issues/7',
      author: 'someone',
    },
  ],
  featured: ['aliosmanmho'],
};

function catalog(fixtures: readonly BlueprintFixture[]): CatalogIndex {
  const root = makeRepo(fixtures);
  const taxonomy = loadTaxonomy(root);
  return buildIndex(loadBlueprints(root, taxonomy), taxonomy);
}

const INDEX = catalog([
  {
    slug: 'sample-api',
    manifest: validManifest({
      slug: 'sample-api',
      name: 'Sample API',
      tier: 'official',
      options: { database: ['postgres', 'sqlserver'] },
      requires_tools: ['dotnet>=10'],
    }),
  },
  {
    slug: 'old-api',
    manifest: validManifest({ slug: 'old-api', name: 'Old API', deprecated: true }),
  },
]);

describe('renderSite', () => {
  it('produces one page per blueprint plus the index', () => {
    assert.deepEqual(
      renderSite(INDEX).map((page) => page.path),
      // The index sorts blueprints by slug, and the pages follow it.
      ['index.html', 'b/old-api.html', 'b/sample-api.html'],
    );
  });

  it('is deterministic, so a committed copy can be checked for drift', () => {
    assert.deepEqual(renderSite(INDEX), renderSite(INDEX));
  });
});

describe('the index page', () => {
  it('counts the catalog and lists every blueprint', () => {
    const html = renderIndexPage(INDEX);
    assert.match(html, /2 blueprints/);
    assert.match(html, /b\/sample-api\.html/);
    assert.match(html, /b\/old-api\.html/);
  });

  it('gives each card the terms the filter searches', () => {
    const html = renderIndexPage(INDEX);
    assert.match(html, /data-terms="[^"]*csharp[^"]*"/);
  });

  it('marks a deprecated blueprint rather than hiding it', () => {
    assert.match(renderIndexPage(INDEX), /class="card deprecated"/);
  });

  it('says so when the catalog is empty instead of showing an empty grid', () => {
    const html = renderIndexPage(catalog([]));
    assert.match(html, /The catalog is empty/);
    assert.equal(/id="cards"/.test(html), false);
  });
});

describe('a blueprint page', () => {
  const entry = INDEX.blueprints.find((blueprint) => blueprint.slug === 'sample-api');

  it('shows the call that fetches it, with an option already chosen', () => {
    assert.ok(entry !== undefined);
    const html = renderBlueprintPage(entry, INDEX.taxonomy);
    assert.match(html, /get_blueprint \{ "slug": "sample-api"/);
    assert.match(html, /"database": "postgres"/);
  });

  it('shows the tags as labels rather than identifiers', () => {
    assert.ok(entry !== undefined);
    const html = renderBlueprintPage(entry, INDEX.taxonomy);
    assert.match(html, /API service/);
    assert.match(html, />C#</);
  });

  it('links its files to the folder on GitHub', () => {
    assert.ok(entry !== undefined);
    const html = renderBlueprintPage(entry, INDEX.taxonomy);
    assert.match(html, /blueprints\/sample-api\/setup\.md/);
  });

  it('resolves the stylesheet from one level down', () => {
    assert.ok(entry !== undefined);
    assert.match(renderBlueprintPage(entry, INDEX.taxonomy), /href="\.\.\/forgeprint\.css"/);
  });
});

describe('escape', () => {
  it('neutralises markup that would otherwise close a tag', () => {
    assert.equal(escape('<script>"&"</script>'), '&lt;script&gt;&quot;&amp;&quot;&lt;/script&gt;');
  });
});

describe('contributor visibility', () => {
  it('credits the maintainer on a blueprint page, with a face', () => {
    const entry = INDEX.blueprints.find((blueprint) => blueprint.slug === 'sample-api');
    assert.ok(entry !== undefined);
    const html = renderBlueprintPage(entry, INDEX.taxonomy);
    assert.match(html, /Blueprint by/);
    // The avatar is a plain image URL: no API call at build time, no script.
    assert.match(html, /github\.com\/octocat\.png\?size=64/);
    assert.match(html, /href="https:\/\/github\.com\/octocat"/);
  });

  it('lists the open requests, so the demand queue is public', () => {
    const html = renderIndexPage(INDEX, CONTEXT);
    assert.match(html, /Requested blueprints/);
    assert.match(html, /Rust CLI/);
    assert.match(html, /asked by @someone/);
  });

  it('says the queue is empty rather than hiding it', () => {
    const html = renderIndexPage(INDEX);
    assert.match(html, /No open requests right now/);
    assert.equal(/Requested blueprints/.test(html), false);
  });

  it('shows the featured contributors, and nothing when there are none', () => {
    assert.match(renderIndexPage(INDEX, CONTEXT), /Featured contributors/);
    assert.equal(/Featured contributors/.test(renderIndexPage(INDEX)), false);
  });

  it('passes the context through renderSite to the index page only', () => {
    const pages = renderSite(INDEX, CONTEXT);
    assert.match(pages[0]?.html ?? '', /Featured contributors/);
    assert.equal(/Featured contributors/.test(pages[1]?.html ?? ''), false);
  });
});
