import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { findRepoRoot, repoPaths } from './paths.js';
import { aliasesFor, describeError, parseTaxonomy, terms } from './taxonomy.js';
import { TEST_TAXONOMY } from './testing.js';

/** What the maintainer would read, rather than the raw issue list. */
function refusal(block: string): string {
  try {
    parseTaxonomy(withAliases(block));
  } catch (error) {
    return describeError(error);
  }
  return 'it was accepted';
}

/** The fixture, with its own aliases section replaced by this one. */
function withAliases(block: string): string {
  return `${(TEST_TAXONOMY.split('aliases:')[0] ?? '').trimStart()}\n${block}`;
}

describe('taxonomy aliases', () => {
  it('reads the spellings declared for a vocabulary', () => {
    const taxonomy = parseTaxonomy(TEST_TAXONOMY);
    assert.equal(aliasesFor(taxonomy, 'languages')['golang'], 'go');
    assert.deepEqual(aliasesFor(taxonomy, 'platforms'), {});
  });

  it('refuses an alias for a value that is not in the vocabulary', () => {
    // An alias is a spelling of a value that already exists. Pointing one at
    // a missing id would add a value through the back door, and the
    // vocabularies are closed (rule 8).
    assert.match(
      refusal('aliases:\n  languages:\n    rusty: rust\n'),
      /"rust" is not in languages/,
    );
  });

  it('refuses an alias for a vocabulary that does not exist', () => {
    assert.match(
      refusal('aliases:\n  frameworks:\n    rails: rails\n'),
      /"frameworks" is not a vocabulary/,
    );
  });

  it('refuses an alias that is already an identifier', () => {
    assert.match(
      refusal('aliases:\n  languages:\n    go: csharp\n'),
      /"go" is already an identifier/,
    );
  });

  it('accepts a taxonomy with no aliases at all', () => {
    const source = TEST_TAXONOMY.split('aliases:')[0] ?? '';
    assert.deepEqual(aliasesFor(parseTaxonomy(source), 'languages'), {});
  });
});

describe('the vocabularies experts and integrations draw from', () => {
  const taxonomy = parseTaxonomy(readFileSync(repoPaths.taxonomy(findRepoRoot()), 'utf8'));

  // The three dimensions of an expert identity (ADR 0012). They are separate
  // vocabularies rather than one nested tree because rule 9 makes the triple
  // unique, and a tree would quietly decide which combinations may exist.
  for (const vocabulary of ['domains', 'roles', 'seniority', 'deliverables'] as const) {
    it(`has ${vocabulary}`, () => {
      assert.ok(terms(taxonomy, vocabulary).length > 0);
    });
  }

  it('offers more roles than the catalog has experts', () => {
    // The role list is deliberately wider than what is filled. An unfilled
    // role is what the site publishes as a requested expert, so a list that
    // only described existing content would have nothing to ask for.
    assert.ok(terms(taxonomy, 'roles').length >= 40);
  });

  it('names an integration kind for each thing Forgeprint can install', () => {
    assert.deepEqual(terms(taxonomy, 'integration_kind'), ['connector', 'mcp', 'plugin']);
  });
});
