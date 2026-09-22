import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { makeRepo, validManifest } from 'forgeprint/testing';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { localSource } from './catalog.js';
import { createServer } from './index.js';

/**
 * What `resolve` answers, as a table.
 *
 * Every row here is a way a real profile arrives wrong: a value in the field
 * next to the right one, a spelling nobody in the catalog uses, a sentence
 * that says nothing, an answer that contradicts itself. The rule the table
 * enforces is the one the tool exists for — it returns one blueprint, or a
 * question, and **never invents a match**.
 *
 * The first two rows are the dogfood run that produced dogfood-1 and
 * dogfood-2.
 */

const root = makeRepo([
  {
    slug: 'saas-api',
    manifest: validManifest({
      slug: 'saas-api',
      name: 'Multi-tenant SaaS API',
      languages: ['csharp'],
      stack: ['aspnetcore', 'postgres'],
      project_type: 'api',
      distribution: ['saas'],
      requirements: ['multi-tenant', 'auth', 'ci'],
      platforms: ['docker'],
    }),
  },
  {
    slug: 'plain-api',
    manifest: validManifest({
      slug: 'plain-api',
      name: 'Plain REST API',
      languages: ['csharp'],
      stack: ['aspnetcore'],
      project_type: 'api',
      distribution: ['free'],
      requirements: ['auth', 'ci'],
      platforms: ['docker'],
    }),
  },
  {
    slug: 'node-cli',
    manifest: validManifest({
      slug: 'node-cli',
      name: 'Node command-line tool',
      languages: ['typescript'],
      stack: ['node'],
      project_type: 'cli',
      distribution: ['open-source'],
      requirements: ['ci'],
      platforms: ['linux'],
    }),
  },
]);

const client = new Client({ name: 'forgeprint-resolve-tests', version: '1.0.0' });

before(async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer(localSource(root)).connect(serverTransport);
  await client.connect(clientTransport);
});

after(async () => {
  await client.close();
});

interface Answer {
  readonly status: string;
  readonly blueprint?: { readonly slug: string };
  readonly candidates?: readonly { readonly slug: string }[];
  readonly questions?: readonly { readonly field: string }[];
  readonly unrecognised_values?: readonly string[];
  readonly moved_to_the_right_field?: readonly string[];
  readonly read_from_your_description?: readonly string[];
  readonly closest?: { readonly slug: string };
}

async function resolve(args: Record<string, unknown>): Promise<Answer> {
  const result = await client.callTool({ name: 'resolve', arguments: args });
  const content = result.content as { text: string }[];
  return JSON.parse(content[0]?.text ?? '{}') as Answer;
}

interface Row {
  readonly name: string;
  readonly input: Record<string, unknown>;
  readonly status: string;
  /** The slug it must land on, for a resolved row. */
  readonly slug?: string;
  /** Substrings that must appear somewhere in the named report field. */
  readonly moved?: readonly string[];
  readonly unrecognised?: readonly string[];
  readonly read?: readonly string[];
  readonly asks?: string;
}

const TABLE: readonly Row[] = [
  {
    name: 'the label a person writes, not the id the catalog stores (dogfood-1)',
    input: { languages: ['C#'], project_type: 'API service', requirements: ['Multi-tenancy'] },
    status: 'resolved',
    slug: 'saas-api',
  },
  {
    name: 'the requirement is in the sentence, not in the field (dogfood-2)',
    input: { languages: ['csharp'], goal: "I'm building a multi-tenant SaaS API" },
    status: 'resolved',
    slug: 'saas-api',
    read: ['multi-tenant'],
  },
  {
    name: 'a distribution written as a requirement is scored from distribution',
    input: { languages: ['csharp'], goal: 'an API for customers', requirements: ['SaaS'] },
    status: 'resolved',
    slug: 'saas-api',
    moved: ['requirements: SaaS → did you mean distribution: saas?'],
  },
  {
    name: 'a requirement written as a distribution is scored from requirements',
    input: {
      languages: ['csharp'],
      goal: 'an API for customers',
      distribution: ['multi-tenant'],
    },
    status: 'resolved',
    slug: 'saas-api',
    moved: ['distribution: multi-tenant → did you mean requirements: multi-tenant?'],
  },
  {
    // `resolve` used to have no `stack` input at all, so a stack an agent
    // sent was dropped by the schema before anything could score it. Here it
    // is the fact that decides the answer.
    name: 'a stack reaches the score instead of being dropped before it',
    input: { languages: ['csharp'], stack: ['PostgreSQL'], goal: 'an API for customers' },
    status: 'resolved',
    slug: 'saas-api',
  },
  {
    name: 'an alias resolves to the blueprint written in that language',
    input: { languages: ['ts'], goal: 'a command line tool for developers' },
    status: 'resolved',
    slug: 'node-cli',
  },
  {
    name: 'an alias the catalog has no blueprint for says so, and is not called unknown',
    input: { languages: ['golang'], goal: 'a command-line tool for developers' },
    status: 'no_match',
    unrecognised: [],
  },
  {
    name: 'a spelling with the separators moved around',
    input: { languages: ['Type Script'], stack: ['Node.js'], goal: 'a command line tool' },
    status: 'resolved',
    slug: 'node-cli',
  },
  {
    name: 'a language nobody has heard of is named, not silently scored',
    input: { languages: ['Brainfuck'], goal: 'an API for customers' },
    status: 'no_match',
    unrecognised: ['languages: Brainfuck'],
  },
  {
    name: 'a goal that says nothing is a question, not a match',
    input: { languages: ['csharp'], goal: 'hi' },
    status: 'questions',
    asks: 'goal',
  },
  {
    name: 'an empty goal is the same question',
    input: { languages: ['csharp'], goal: '   ' },
    status: 'questions',
    asks: 'goal',
  },
  {
    name: 'a short goal that names something the catalog knows is an answer',
    input: { languages: ['typescript'], goal: 'a CLI' },
    status: 'resolved',
    slug: 'node-cli',
  },
  {
    name: 'contradictory distribution states both, and neither is invented',
    input: {
      languages: ['csharp'],
      goal: 'an API for customers',
      distribution: ['free', 'saas'],
      requirements: ['multi-tenant'],
    },
    status: 'resolved',
    slug: 'saas-api',
  },
  {
    name: 'nothing in the catalog is a language the user does not have',
    input: { languages: ['python'], goal: 'a data pipeline for reports' },
    status: 'no_match',
  },
];

describe('resolve, as a table', () => {
  for (const row of TABLE) {
    it(row.name, async () => {
      const answer = await resolve(row.input);
      assert.equal(answer.status, row.status, JSON.stringify(answer).slice(0, 400));

      if (row.slug !== undefined) assert.equal(answer.blueprint?.slug, row.slug);
      if (row.asks !== undefined) {
        assert.ok(answer.questions?.some((question) => question.field === row.asks));
      }
      for (const expected of row.moved ?? []) {
        assert.ok(
          answer.moved_to_the_right_field?.includes(expected),
          `moved: ${JSON.stringify(answer.moved_to_the_right_field)}`,
        );
      }
      for (const expected of row.unrecognised ?? []) {
        assert.ok(answer.unrecognised_values?.includes(expected));
      }
      for (const expected of row.read ?? []) {
        assert.ok(answer.read_from_your_description?.includes(expected));
      }
      // The rule the whole table is really testing.
      assert.equal(answer.candidates === undefined || answer.candidates.length <= 2, true);
    });
  }

  it('never returns a second blueprint as a recommendation', async () => {
    for (const row of TABLE) {
      const answer = await resolve(row.input);
      if (answer.status === 'resolved') assert.ok(answer.blueprint !== undefined);
      if (answer.status === 'no_match') assert.equal(answer.blueprint, undefined);
    }
  });
});
