import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadTaxonomy } from 'forgeprint';
import { makeRepo } from 'forgeprint/testing';
import { normalizeProfile, requirementsIn } from './profile.js';

const taxonomy = loadTaxonomy(makeRepo([]));

describe('normalizeProfile', () => {
  it('takes the label a person would say, not only the id the catalog stores', () => {
    // "I know C#" reached the resolver as a language nobody knows, which is
    // the heaviest criterion, and the answer came back as no_match.
    const { profile, unrecognised } = normalizeProfile({ languages: ['C#'] }, taxonomy);
    assert.deepEqual(profile.languages, ['csharp']);
    assert.deepEqual(unrecognised, []);
  });

  it('leaves an id alone', () => {
    assert.deepEqual(normalizeProfile({ languages: ['csharp'] }, taxonomy).profile.languages, [
      'csharp',
    ]);
  });

  it('folds case and the punctuation people vary on', () => {
    const { profile } = normalizeProfile(
      { languages: ['c#'], project_type: 'API service', requirements: ['Continuous integration'] },
      taxonomy,
    );
    assert.deepEqual(profile.languages, ['csharp']);
    assert.equal(profile.project_type, 'api');
    assert.deepEqual(profile.requirements, ['ci']);
  });

  it('reports what it could not place instead of scoring it as a silent zero', () => {
    const { profile, unrecognised } = normalizeProfile(
      { languages: ['Brainfuck'], requirements: ['telepathy'] },
      taxonomy,
    );
    // Left as it was: it still counts as text, and the caller is told.
    assert.deepEqual(profile.languages, ['Brainfuck']);
    assert.deepEqual(unrecognised, ['languages: Brainfuck', 'requirements: telepathy']);
  });

  it('folds punctuation but never a word, so two ids cannot collide', () => {
    // `db-per-tenant` must never reach `per-tenant`: only case and the
    // separators are folded, and an unknown value keeps its own spelling.
    const { profile } = normalizeProfile(
      { requirements: ['Authentication', 'ci', 'db-per-tenant'] },
      taxonomy,
    );
    assert.deepEqual(profile.requirements, ['auth', 'ci', 'db-per-tenant']);
  });

  it('leaves free text and the locale alone', () => {
    const { profile } = normalizeProfile(
      { goal: 'A multi-tenant SaaS API', skills: ['C#'], locale: 'tr-TR' },
      taxonomy,
    );
    assert.equal(profile.goal, 'A multi-tenant SaaS API');
    assert.deepEqual(profile.skills, ['C#']);
    assert.equal(profile.locale, 'tr-TR');
  });

  it('passes a profile with nothing stated straight through', () => {
    assert.deepEqual(normalizeProfile({}, taxonomy), {
      profile: {},
      unrecognised: [],
      inferred: [],
    });
  });
});

describe('requirementsIn', () => {
  it('reads a requirement the sentence names', () => {
    // "I'm building a multi-tenant SaaS API" put the decisive word in free
    // text, worth four points against forty for a language, and the resolver
    // asked the user to choose between two blueprints over a word they had
    // already said.
    assert.deepEqual(requirementsIn('an API with auth', taxonomy), ['auth']);
  });

  it('reads a label written as several words', () => {
    assert.deepEqual(requirementsIn('an API with continuous integration', taxonomy), ['ci']);
  });

  it('folds the separators people vary on', () => {
    assert.deepEqual(requirementsIn('set up continuous-integration please', taxonomy), ['ci']);
  });

  it('does not read a requirement the sentence rules out', () => {
    assert.deepEqual(requirementsIn('an API, no authentication', taxonomy), []);
    assert.deepEqual(requirementsIn('I do not want authentication', taxonomy), []);
  });

  it('finds nothing in a sentence that names nothing', () => {
    assert.deepEqual(requirementsIn('a small JSON service', taxonomy), []);
    assert.deepEqual(requirementsIn(undefined, taxonomy), []);
  });

  it('merges into the profile without repeating what was stated', () => {
    const { profile, inferred } = normalizeProfile(
      { goal: 'an API with auth and ci', requirements: ['auth'] },
      taxonomy,
    );
    assert.deepEqual(profile.requirements, ['auth', 'ci']);
    // Only what the sentence added, so the caller can see what it did not type.
    assert.deepEqual(inferred, ['ci']);
  });
});
