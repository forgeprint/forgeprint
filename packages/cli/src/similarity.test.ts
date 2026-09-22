import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadBlueprints } from './build-index.js';
import { compareBlueprints, renderReport } from './similarity.js';
import { loadTaxonomy } from './taxonomy.js';
import { makeRepo, validManifest, type BlueprintFixture } from './testing.js';

function report(fixtures: readonly BlueprintFixture[], slug: string, threshold = 0.7) {
  const root = makeRepo(fixtures);
  const blueprints = loadBlueprints(root, loadTaxonomy(root));
  const subject = blueprints.find((blueprint) => blueprint.slug === slug);
  assert.ok(subject !== undefined, `fixture ${slug} is missing`);
  return compareBlueprints(
    subject,
    blueprints.filter((blueprint) => blueprint.slug !== slug),
    threshold,
  );
}

/** Two blueprints that share a stack but describe different work. */
const DISTINCT: BlueprintFixture[] = [
  {
    slug: 'dotnet-api',
    manifest: validManifest({ slug: 'dotnet-api', requirements: ['auth'] }),
    files: {
      'AGENTS.md': '# API\n\nRoutes, controllers, request validation, OpenAPI documents.\n',
      'setup.md': '1. Create the web project and add the OpenAPI package.\n',
    },
  },
  {
    slug: 'dotnet-cli',
    manifest: validManifest({
      slug: 'dotnet-cli',
      project_type: 'cli',
      requirements: ['ci'],
      distribution: ['free'],
      stack: ['node'],
      languages: ['typescript'],
    }),
    files: {
      'AGENTS.md': '# Command line tool\n\nArgument parsing, terminal output, exit codes.\n',
      'setup.md': '1. Scaffold the command line entry point and wire the argument parser.\n',
    },
  },
];

describe('compareBlueprints', () => {
  it('says so when there is nothing to compare against', () => {
    const result = report([{ slug: 'sample-api' }], 'sample-api');
    assert.equal(result.closest, undefined);
    assert.equal(result.flagged, false);
    assert.match(renderReport(result), /no other blueprint/);
  });

  it('flags two blueprints that were copied from each other', () => {
    const result = report(
      [
        { slug: 'first-api', manifest: validManifest({ slug: 'first-api' }) },
        {
          slug: 'second-api',
          manifest: validManifest({ slug: 'second-api', requirements: ['auth'] }),
        },
      ],
      'second-api',
    );
    assert.equal(result.closest?.slug, 'first-api');
    assert.equal(result.flagged, true);
    assert.match(renderReport(result), /RED FLAG/);
  });

  it('does not flag blueprints that only share a language', () => {
    const result = report(DISTINCT, 'dotnet-cli');
    assert.equal(result.flagged, false);
  });

  it('reports the same combination as a rejection, not a flag', () => {
    const result = report([{ slug: 'first-api' }, { slug: 'second-api' }], 'second-api');
    assert.equal(result.closest?.sameCombination, true);
    assert.match(renderReport(result), /REJECTED/);
    assert.match(renderReport(result), /rule 9/);
  });

  it('lists the tags that separate the two', () => {
    const result = report(DISTINCT, 'dotnet-api');
    const closest = result.closest;
    assert.ok(closest !== undefined);
    assert.ok(closest.onlyHere.includes('type:api'));
    assert.ok(closest.onlyThere.includes('type:cli'));
  });

  it('orders the candidates by how close they are', () => {
    const result = report(
      [
        { slug: 'subject-api', manifest: validManifest({ slug: 'subject-api' }) },
        { slug: 'twin-api', manifest: validManifest({ slug: 'twin-api', requirements: ['auth'] }) },
        ...DISTINCT.slice(1),
      ],
      'subject-api',
    );
    assert.equal(result.scores[0]?.slug, 'twin-api');
    assert.equal(result.scores.at(-1)?.slug, 'dotnet-cli');
  });

  it('honours a threshold the reviewer chooses', () => {
    assert.equal(report(DISTINCT, 'dotnet-cli', 0.01).flagged, true);
  });

  it('scores every dimension between 0 and 1', () => {
    const closest = report(DISTINCT, 'dotnet-api').closest;
    assert.ok(closest !== undefined);
    for (const score of [closest.tags, closest.agents, closest.setup, closest.highest]) {
      assert.ok(score >= 0 && score <= 1, `score out of range: ${score}`);
    }
  });
});

describe('renderReport wording', () => {
  it('separates the objective rejection from the reviewer question', () => {
    const rejection = renderReport(
      report([{ slug: 'first-api' }, { slug: 'second-api' }], 'second-api'),
    );
    assert.match(rejection, /REJECTED/);
    assert.doesNotMatch(rejection, /RED FLAG/);

    const flag = renderReport(
      report(
        [
          { slug: 'first-api', manifest: validManifest({ slug: 'first-api' }) },
          {
            slug: 'second-api',
            manifest: validManifest({ slug: 'second-api', requirements: ['auth'] }),
          },
        ],
        'second-api',
      ),
    );
    assert.match(flag, /RED FLAG/);
    assert.doesNotMatch(flag, /REJECTED/);
  });
});
