import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parse } from 'yaml';
import { parseManifest } from './catalog.js';
import { combinationKey, manifestSchema } from './manifest.js';
import { parseTaxonomy } from './taxonomy.js';
import { TEST_TAXONOMY, validManifest } from './testing.js';

const taxonomy = parseTaxonomy(TEST_TAXONOMY);
const schema = manifestSchema(taxonomy);

describe('manifest schema', () => {
  it('accepts a complete manifest and applies defaults', () => {
    const result = schema.parse(validManifest());
    assert.equal(result.slug, 'sample-api');
    assert.equal(result.deprecated, false);
    assert.equal(result.supersedes, null);
  });

  it('rejects a tag that is not in the taxonomy', () => {
    const result = schema.safeParse(validManifest({ stack: ['aspnetcore', 'cobol'] }));
    assert.equal(result.success, false);
  });

  it('rejects an unknown field, so typos do not pass silently', () => {
    const result = schema.safeParse(validManifest({ framework: 'aspnetcore' }));
    assert.equal(result.success, false);
  });

  it('rejects a version that is not semver', () => {
    assert.equal(schema.safeParse(validManifest({ version: '1.2' })).success, false);
  });

  it('rejects duplicate values in a list', () => {
    const result = schema.safeParse(validManifest({ languages: ['csharp', 'csharp'] }));
    assert.equal(result.success, false);
  });

  it('allows up to three option fields with up to three values each', () => {
    const options = {
      database: ['postgres', 'sqlserver'],
      auth: ['jwt', 'oidc', 'session'],
      runtime: ['node', 'bun'],
    };
    assert.equal(schema.safeParse(validManifest({ options })).success, true);
  });

  it('rejects a fourth option field (ADR 0001)', () => {
    const options = {
      database: ['postgres', 'sqlserver'],
      auth: ['jwt', 'oidc'],
      runtime: ['node', 'bun'],
      cache: ['redis', 'memory'],
    };
    assert.equal(schema.safeParse(validManifest({ options })).success, false);
  });

  it('rejects a fourth option value (ADR 0001)', () => {
    const options = { database: ['postgres', 'sqlserver', 'mysql', 'sqlite'] };
    assert.equal(schema.safeParse(validManifest({ options })).success, false);
  });

  it('rejects an option field with a single value', () => {
    assert.equal(
      schema.safeParse(validManifest({ options: { database: ['postgres'] } })).success,
      false,
    );
  });

  it('rejects a blueprint that supersedes itself', () => {
    const result = schema.safeParse(validManifest({ supersedes: 'sample-api' }));
    assert.equal(result.success, false);
  });

  it('reports the failing field in the error message', () => {
    assert.throws(() => parseManifest(taxonomy, 'schema: 1\nslug: Not Kebab\n'), /slug/);
  });

  it('parses manifests written as YAML', () => {
    const yaml = `schema: 1
slug: sample-api
name: Sample API
version: 1.0.0
tier: community
maintainers: [octocat]
summary: A sample API blueprint used by the Forgeprint test suite.
stack: [aspnetcore]
languages: [csharp]
platforms: [linux]
distribution: [saas]
project_type: api
audience: [intermediate]
requirements: [auth]
agents: [claude-code]
`;
    assert.equal(parseManifest(taxonomy, yaml).name, 'Sample API');
    assert.equal(typeof parse(yaml), 'object');
  });
});

describe('combinationKey', () => {
  it('ignores the order of stack and requirements', () => {
    const a = schema.parse(
      validManifest({ stack: ['aspnetcore', 'postgres'], requirements: ['auth', 'ci'] }),
    );
    const b = schema.parse(
      validManifest({ stack: ['postgres', 'aspnetcore'], requirements: ['ci', 'auth'] }),
    );
    assert.equal(combinationKey(a), combinationKey(b));
  });

  it('separates blueprints with a different project type', () => {
    const api = schema.parse(validManifest({ project_type: 'api' }));
    const cli = schema.parse(validManifest({ project_type: 'cli' }));
    assert.notEqual(combinationKey(api), combinationKey(cli));
  });
});

describe('provenance', () => {
  const withSource = (derived_from: unknown): unknown =>
    schema.parse(validManifest({ derived_from }));

  it('accepts a complete record', () => {
    const manifest = schema.parse(
      validManifest({
        derived_from: {
          url: 'https://github.com/example/starter',
          license: 'MIT',
          verified_on: '2026-09-22',
          note: 'The auth wiring and the test layout; the rest is ours.',
        },
      }),
    );
    assert.equal(manifest.derived_from?.license, 'MIT');
  });

  it('is optional, because a blueprint written from scratch has none', () => {
    assert.equal(schema.parse(validManifest()).derived_from, undefined);
  });

  it('refuses a source that is not an https URL', () => {
    // A provenance record is a credit somebody can follow. "an old project of
    // mine" credits nobody.
    assert.throws(() =>
      withSource({
        derived_from: 'an old project of mine',
        license: 'MIT',
        verified_on: '2026-09-22',
      }),
    );
  });

  it('refuses a date that is not a calendar date', () => {
    assert.throws(() =>
      withSource({
        url: 'https://github.com/example/starter',
        license: 'MIT',
        verified_on: 'last spring',
      }),
    );
  });

  it('refuses a record with the licence left out', () => {
    // Which licence decides whether the derivation was allowed at all.
    assert.throws(() =>
      withSource({
        url: 'https://github.com/example/starter',
        verified_on: '2026-09-22',
      }),
    );
  });
});

describe('provenance', () => {
  it('is human when nothing says otherwise', () => {
    // Every blueprint written before this field existed was written by a
    // person. A default of anything else would be a lie about all of them.
    assert.equal(schema.parse(validManifest()).provenance, 'human');
  });

  it('accepts generated', () => {
    assert.equal(schema.parse(validManifest({ provenance: 'generated' })).provenance, 'generated');
  });

  it('refuses a generated blueprint that claims tier: official', () => {
    // official is the catalog saying a person stands behind this. Nobody sat
    // with a generated one, whatever CI says about its recipe (ADR 0011).
    assert.throws(
      () => schema.parse(validManifest({ provenance: 'generated', tier: 'official' })),
      /cannot be tier: official/,
    );
  });

  it('allows a generated blueprint at the tiers below official', () => {
    assert.equal(
      schema.parse(validManifest({ provenance: 'generated', tier: 'community' })).tier,
      'community',
    );
  });

  it('refuses a value that is neither', () => {
    assert.throws(() => schema.parse(validManifest({ provenance: 'ai' })));
  });
});
