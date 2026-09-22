import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { renderCodeowners } from './build-codeowners.js';
import { loadBlueprints, renderIndex } from './build-index.js';
import { buildManifestJsonSchema } from './build-schema.js';
import { findRepoRoot, repoPaths } from './paths.js';
import { loadTaxonomy } from './taxonomy.js';
import { validateCatalog } from './validate.js';
import { makeRepo, validManifest } from './testing.js';

function messages(root: string): string[] {
  return validateCatalog(root).problems.map((problem) => problem.message);
}

describe('validateCatalog', () => {
  it('accepts an empty catalog', () => {
    const report = validateCatalog(makeRepo());
    assert.equal(report.ok, true, report.problems.map((p) => p.message).join('\n'));
    assert.equal(report.checked, 0);
  });

  it('accepts a well-formed blueprint', () => {
    const report = validateCatalog(makeRepo([{ slug: 'sample-api' }]));
    assert.equal(report.ok, true, report.problems.map((p) => p.message).join('\n'));
    assert.equal(report.checked, 1);
  });

  it('reports a missing required file', () => {
    const root = makeRepo([{ slug: 'sample-api', omit: ['overview.md'] }]);
    assert.match(messages(root).join('\n'), /missing required file\(s\): overview\.md/);
  });

  it('reports a manifest slug that does not match the folder', () => {
    const root = makeRepo([{ slug: 'other-api', manifest: validManifest({ slug: 'sample-api' }) }]);
    assert.match(messages(root).join('\n'), /does not match the folder name/);
  });

  it('reports a version with no CHANGELOG entry (rule 17)', () => {
    const root = makeRepo([
      {
        slug: 'sample-api',
        manifest: validManifest({ version: '2.0.0' }),
        files: { 'CHANGELOG.md': '## 1.0.0\n' },
      },
    ]);
    assert.match(messages(root).join('\n'), /CHANGELOG\.md has no entry for version 2\.0\.0/);
  });

  it('reports two blueprints that claim the same combination (rule 9)', () => {
    const root = makeRepo([{ slug: 'first-api' }, { slug: 'second-api' }]);
    assert.match(messages(root).join('\n'), /same stack \+ project_type \+ requirements/);
  });

  it('allows a duplicate combination when the older blueprint is deprecated', () => {
    const root = makeRepo([
      { slug: 'first-api', manifest: validManifest({ slug: 'first-api', deprecated: true }) },
      {
        slug: 'second-api',
        manifest: validManifest({ slug: 'second-api', supersedes: 'first-api' }),
      },
    ]);
    assert.equal(validateCatalog(root).ok, true, messages(root).join('\n'));
  });

  it('reports a supersedes target that does not exist', () => {
    const root = makeRepo([
      { slug: 'sample-api', manifest: validManifest({ supersedes: 'ghost-api' }) },
    ]);
    assert.match(messages(root).join('\n'), /not in the catalog/);
  });

  it('reports a stale docs/index.json', () => {
    const root = makeRepo([{ slug: 'sample-api' }]);
    writeFileSync(repoPaths.index(root), '{}\n', 'utf8');
    assert.match(messages(root).join('\n'), /docs\/index\.json is out of date/);
  });

  it('reports a stale schema/manifest.schema.json', () => {
    const root = makeRepo();
    writeFileSync(repoPaths.manifestSchema(root), '{}\n', 'utf8');
    assert.match(messages(root).join('\n'), /manifest\.schema\.json is out of date/);
  });

  it('checks CODEOWNERS only when a core maintainer is configured', () => {
    const root = makeRepo([{ slug: 'sample-api' }]);
    assert.equal(validateCatalog(root).ok, true);
    writeFileSync(join(root, 'forgeprint.json'), '{"core_maintainer":"octocat"}\n', 'utf8');
    assert.match(messages(root).join('\n'), /CODEOWNERS is missing/);
  });

  it('ignores a line-ending difference in a generated file', () => {
    const root = makeRepo([{ slug: 'sample-api' }]);
    const taxonomy = loadTaxonomy(root);
    const index = renderIndex(loadBlueprints(root, taxonomy), taxonomy);
    writeFileSync(repoPaths.index(root), index.replace(/\n/g, '\r\n'), 'utf8');
    assert.equal(validateCatalog(root).ok, true, messages(root).join('\n'));
  });
});

describe('generated artifacts', () => {
  it('produces a JSON Schema that lists the taxonomy values', () => {
    const schema = JSON.parse(buildManifestJsonSchema(loadTaxonomy(makeRepo())));
    assert.deepEqual(schema.properties.project_type.enum, ['api', 'cli']);
    assert.equal(schema.properties.languages.uniqueItems, true);
  });

  it('writes one CODEOWNERS line per blueprint, after the root owner', () => {
    const root = makeRepo([{ slug: 'sample-api' }]);
    const taxonomy = loadTaxonomy(root);
    const lines = renderCodeowners(loadBlueprints(root, taxonomy), 'core-owner').split('\n');
    assert.ok(lines.includes('* @core-owner'));
    assert.ok(lines.includes('/blueprints/sample-api/ @octocat'));
  });

  it('records the files and translations of each blueprint in the index', () => {
    const root = makeRepo([
      { slug: 'sample-api', files: { 'i18n/tr/overview.md': '# Genel bakis\n' } },
    ]);
    const taxonomy = loadTaxonomy(root);
    const index = JSON.parse(renderIndex(loadBlueprints(root, taxonomy), taxonomy));
    assert.deepEqual(index.blueprints[0].i18n, ['tr']);
    assert.ok(index.blueprints[0].files.includes('setup.md'));
  });
});

describe('findRepoRoot', () => {
  it('finds the root from a subdirectory', () => {
    const root = makeRepo([{ slug: 'sample-api' }]);
    assert.equal(findRepoRoot(repoPaths.blueprintDir(root, 'sample-api')), root);
  });

  it('explains itself when there is no repository above the directory', () => {
    assert.throws(() => findRepoRoot(tmpdir()), /taxonomy\.yaml/);
  });
});
