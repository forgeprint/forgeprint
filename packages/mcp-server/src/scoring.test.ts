import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadBlueprints, buildIndex, loadTaxonomy, type CatalogIndex } from 'forgeprint';
import { makeRepo, validManifest, type BlueprintFixture } from 'forgeprint/testing';
import { isGenuineTie, MATCH_FLOOR, questionsFor, scoreCatalog } from './scoring.js';

function catalog(fixtures: readonly BlueprintFixture[]): CatalogIndex {
  const root = makeRepo(fixtures);
  const taxonomy = loadTaxonomy(root);
  return buildIndex(loadBlueprints(root, taxonomy), taxonomy);
}

/** A C# API, a TypeScript CLI, and a C# API for a different distribution. */
const CATALOG = catalog([
  {
    slug: 'csharp-api',
    manifest: validManifest({
      slug: 'csharp-api',
      languages: ['csharp'],
      project_type: 'api',
      distribution: ['saas'],
      requirements: ['auth', 'ci'],
    }),
  },
  {
    slug: 'typescript-cli',
    manifest: validManifest({
      slug: 'typescript-cli',
      languages: ['typescript'],
      stack: ['node'],
      project_type: 'cli',
      distribution: ['free'],
      requirements: ['ci'],
    }),
  },
  {
    slug: 'csharp-internal-api',
    manifest: validManifest({
      slug: 'csharp-internal-api',
      languages: ['csharp'],
      stack: ['aspnetcore'],
      project_type: 'api',
      distribution: ['free'],
      requirements: ['auth'],
    }),
  },
]);

describe('scoreCatalog', () => {
  it('puts a language the user knows above everything else', () => {
    const scored = scoreCatalog(CATALOG, { languages: ['typescript'], project_type: 'api' });
    assert.equal(scored[0]?.entry.slug, 'typescript-cli');
  });

  it('explains both why a blueprint fits and why it does not', () => {
    const [best] = scoreCatalog(CATALOG, { languages: ['csharp'], project_type: 'cli' });
    assert.ok(best !== undefined);
    assert.ok(best.reasons.length > 0 || best.mismatches.length > 0);
    assert.ok(best.mismatches.some((reason) => /not a command-line tool/i.test(reason)));
  });

  it('does not penalise a criterion the profile left unstated', () => {
    const withPlatform = scoreCatalog(CATALOG, {
      languages: ['csharp'],
      project_type: 'api',
      platforms: ['ios'],
    });
    const without = scoreCatalog(CATALOG, { languages: ['csharp'], project_type: 'api' });
    assert.ok((without[0]?.total ?? 0) > (withPlatform[0]?.total ?? 0));
  });

  it('scores a perfect profile above the floor and a wrong one below it', () => {
    const right = scoreCatalog(CATALOG, {
      languages: ['csharp'],
      project_type: 'api',
      distribution: ['saas'],
      requirements: ['auth', 'ci'],
    });
    assert.ok((right[0]?.total ?? 0) > MATCH_FLOOR);

    const wrong = scoreCatalog(CATALOG, {
      languages: ['rust'],
      project_type: 'game',
      distribution: ['iap'],
    });
    assert.ok((wrong[0]?.total ?? 1) < MATCH_FLOOR);
  });

  it('leaves deprecated blueprints out', () => {
    const withDeprecated = catalog([
      {
        slug: 'old-api',
        manifest: validManifest({ slug: 'old-api', deprecated: true }),
      },
      { slug: 'new-api', manifest: validManifest({ slug: 'new-api', supersedes: 'old-api' }) },
    ]);
    const slugs = scoreCatalog(withDeprecated, { languages: ['csharp'] }).map(
      (score) => score.entry.slug,
    );
    assert.deepEqual(slugs, ['new-api']);
  });
});

describe('questionsFor', () => {
  it('asks for languages first when they are unknown', () => {
    const questions = questionsFor(CATALOG, {});
    assert.equal(questions[0]?.field, 'languages');
  });

  it('asks what the user is building when nothing says so', () => {
    const questions = questionsFor(CATALOG, { languages: ['csharp'] });
    assert.ok(questions.some((question) => question.field === 'goal'));
  });

  it('asks about a field the candidates actually disagree on', () => {
    const questions = questionsFor(CATALOG, {
      languages: ['csharp'],
      goal: 'an API for my product',
    });
    const distribution = questions.find((question) => question.field === 'distribution');
    assert.ok(distribution !== undefined, 'the two C# APIs differ on distribution');
    assert.deepEqual(distribution.choices?.map((choice) => choice.id).sort(), ['free', 'saas']);
  });

  it('does not ask about a field every candidate shares', () => {
    const single = catalog([{ slug: 'only-api' }]);
    const questions = questionsFor(single, { languages: ['csharp'], goal: 'an API' });
    assert.deepEqual(questions, []);
  });

  it('gives every question a reason the agent can pass on', () => {
    for (const question of questionsFor(CATALOG, {})) {
      assert.ok(question.why.length > 20, `question "${question.field}" has no reason`);
    }
  });
});

describe('asking in rounds', () => {
  it('asks only the two required questions in the first round', () => {
    // Discriminating questions are held back: somebody who has not said what
    // they are building cannot usefully answer them yet.
    assert.deepEqual(
      questionsFor(CATALOG, {}).map((question) => question.field),
      ['languages', 'goal'],
    );
  });

  it('stops asking once one candidate is clearly ahead', () => {
    const questions = questionsFor(CATALOG, {
      languages: ['typescript'],
      project_type: 'cli',
      goal: 'a command-line tool',
    });
    assert.deepEqual(questions, []);
  });
});

describe('isGenuineTie', () => {
  it('does not call it a tie when one candidate covers more of what was asked for', () => {
    const scored = scoreCatalog(CATALOG, {
      languages: ['csharp'],
      project_type: 'api',
      requirements: ['auth', 'ci'],
    });
    const [best, runnerUp] = scored;
    assert.ok(best !== undefined && runnerUp !== undefined);
    assert.equal(best.entry.slug, 'csharp-api');
    assert.equal(isGenuineTie(best, runnerUp), false);
  });

  it('is a tie when the two are close and cover the same requirements', () => {
    const scored = scoreCatalog(CATALOG, { languages: ['csharp'], project_type: 'api' });
    const [best, runnerUp] = scored;
    assert.ok(best !== undefined && runnerUp !== undefined);
    assert.equal(isGenuineTie(best, runnerUp), true);
  });
});
