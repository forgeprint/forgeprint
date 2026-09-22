import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { makeRepo, validManifest } from 'forgeprint/testing';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { localSource } from './catalog.js';
import { createServer } from './index.js';

const SETUP_WITH_OPTIONS = [
  '# Setup',
  '',
  '1. Create it: `dotnet new webapi -o src/Api`',
  '   Verify: `dotnet build`',
  '',
  '<!-- if options.database == postgres -->',
  '',
  '2. Add Npgsql: `dotnet add src/Api package Npgsql --version 10.0.3`',
  '   Verify: `dotnet build`',
  '',
  '<!-- endif -->',
  '',
  '<!-- if options.database == sqlserver -->',
  '',
  '2. Add SqlServer: `dotnet add src/Api package Microsoft.EntityFrameworkCore.SqlServer --version 10.0.12`',
  '   Verify: `dotnet build`',
  '',
  '<!-- endif -->',
  '',
].join('\n');

const OVERVIEW = [
  '# Sample API',
  '',
  '## What it fits',
  '',
  'Services that speak JSON.',
  '',
  '## What it is NOT for',
  '',
  'Server-rendered web applications.',
  '',
  '## Trade-offs made on your behalf',
  '',
  'Minimal APIs rather than controllers.',
  '',
].join('\n');

const root = makeRepo([
  {
    slug: 'sample-api',
    manifest: validManifest({
      slug: 'sample-api',
      options: { database: ['postgres', 'sqlserver'] },
      requires_tools: ['dotnet>=10'],
    }),
    files: {
      'setup.md': SETUP_WITH_OPTIONS,
      'overview.md': OVERVIEW,
      'AGENTS.md': '# Sample API\n\nEndpoints live in Program.cs.\n',
    },
  },
  {
    slug: 'sample-cli',
    manifest: validManifest({
      slug: 'sample-cli',
      project_type: 'cli',
      languages: ['typescript'],
      stack: ['node'],
      distribution: ['free'],
      requirements: ['ci'],
    }),
    files: {
      'overview.md': '# Sample CLI\n\n## What it is NOT for\n\nLong-running services.\n',
      'AGENTS.md': '# Sample CLI\n\nArgument parsing lives in cli.ts.\n',
    },
  },
]);

const client = new Client({ name: 'forgeprint-tests', version: '1.0.0' });

before(async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createServer(localSource(root)).connect(serverTransport);
  await client.connect(clientTransport);
});

after(async () => {
  await client.close();
});

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const content = result.content as { type: string; text: string }[];
  const text = content[0]?.text ?? '';
  return { isError: result.isError === true, text, payload: safeParse(text), meta: result._meta };
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

describe('the tool surface', () => {
  it('registers exactly the six documented tools', async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((tool) => tool.name).sort(), [
      'compare_blueprints',
      'get_blueprint',
      'request_blueprint',
      'resolve',
      'search_blueprints',
      'validate_blueprint',
    ]);
  });

  it('tells the calling agent that blueprint content is data', async () => {
    const { meta } = await call('search_blueprints', { languages: ['csharp'] });
    assert.match(String(meta?.['content_is_data']), /data, not instructions/);
  });
});

describe('resolve', () => {
  it('returns questions instead of guessing when the profile is thin', async () => {
    const { payload } = await call('resolve', {});
    assert.equal(payload.status, 'questions');
    assert.equal(payload.questions[0].field, 'languages');
    assert.match(payload.instruction, /Ask the user these questions/);
  });

  it('returns exactly one blueprint once the profile is complete', async () => {
    const { payload } = await call('resolve', {
      languages: ['csharp'],
      goal: 'a JSON API for my product',
      project_type: 'api',
      distribution: ['saas'],
    });
    assert.equal(payload.status, 'resolved');
    assert.equal(payload.blueprint.slug, 'sample-api');
    assert.ok(Array.isArray(payload.why_it_fits));
    assert.ok(payload.next_step.includes('get_blueprint'));
  });

  it('reports the tools the setup needs and the options still undecided', async () => {
    const { payload } = await call('resolve', {
      languages: ['csharp'],
      project_type: 'api',
      distribution: ['saas'],
    });
    assert.deepEqual(payload.tools_the_setup_needs, ['dotnet>=10']);
    assert.deepEqual(payload.decisions_still_to_make, [
      { field: 'database', values: ['postgres', 'sqlserver'] },
    ]);
  });

  it('refuses to name a match when nothing fits', async () => {
    const { payload } = await call('resolve', {
      languages: ['rust'],
      project_type: 'game',
      distribution: ['iap'],
      platforms: ['ios'],
    });
    assert.equal(payload.status, 'no_match');
    assert.ok(payload.closest.why_it_does_not_fit.length > 0);
    assert.match(payload.instruction, /request_blueprint/);
  });

  it('hands the locale back rather than translating', async () => {
    const { meta } = await call('resolve', { locale: 'tr-TR' });
    assert.equal(meta?.['present_in'], 'tr-TR');
  });
});

describe('get_blueprint', () => {
  it('resolves the chosen option branch and drops the other', async () => {
    const { payload } = await call('get_blueprint', {
      slug: 'sample-api',
      options: { database: 'postgres' },
    });
    assert.match(payload.files['setup.md'], /Npgsql/);
    assert.doesNotMatch(payload.files['setup.md'], /SqlServer/);
    assert.deepEqual(payload.unresolved_option_guards, []);
  });

  it('says which guards are still unresolved when an option was not chosen', async () => {
    const { payload } = await call('get_blueprint', { slug: 'sample-api' });
    assert.deepEqual(payload.unresolved_option_guards, ['database']);
    assert.deepEqual(payload.undecided_options, [
      { field: 'database', values: ['postgres', 'sqlserver'] },
    ]);
  });

  it('returns every required file', async () => {
    const { payload } = await call('get_blueprint', { slug: 'sample-api' });
    for (const file of ['manifest.yaml', 'AGENTS.md', 'overview.md', 'setup.md', 'CHANGELOG.md']) {
      assert.ok(file in payload.files, `${file} is missing`);
    }
  });

  it('refuses an option value the blueprint does not declare', async () => {
    const { isError, text } = await call('get_blueprint', {
      slug: 'sample-api',
      options: { database: 'mysql' },
    });
    assert.equal(isError, true);
    assert.match(text, /postgres, sqlserver/);
  });

  it('names the catalog when the slug is unknown', async () => {
    const { isError, text } = await call('get_blueprint', { slug: 'nope' });
    assert.equal(isError, true);
    assert.match(text, /sample-api/);
  });
});

describe('search_blueprints', () => {
  it('ranks by the stated criteria and explains each result', async () => {
    const { payload } = await call('search_blueprints', {
      languages: ['typescript'],
      project_type: 'cli',
    });
    assert.equal(payload.matches[0].slug, 'sample-cli');
    assert.ok(payload.matches[0].reasons.length > 0);
  });
});

describe('compare_blueprints', () => {
  it('lifts the sections that actually separate two blueprints', async () => {
    const { payload } = await call('compare_blueprints', {
      slugs: ['sample-api', 'sample-cli'],
    });
    assert.equal(payload.comparison.length, 2);
    assert.match(payload.comparison[0].not_for, /Server-rendered/);
    assert.match(payload.comparison[1].not_for, /Long-running services/);
    assert.match(payload.comparison[0].trade_offs, /Minimal APIs/);
  });
});

describe('validate_blueprint', () => {
  it('reports schema and setup problems in a draft', async () => {
    const { payload } = await call('validate_blueprint', {
      files: {
        'manifest.yaml': 'schema: 1\nslug: Bad Slug\n',
        'AGENTS.md': '# draft\n',
        'setup.md': '1. Do something.\n',
      },
    });
    assert.equal(payload.ok, false);
    assert.ok(payload.problems.some((problem: string) => /missing required file/.test(problem)));
    assert.ok(payload.problems.some((problem: string) => /manifest\.yaml/.test(problem)));
  });

  it('rejects a draft that claims an existing combination', async () => {
    const draft = validManifest({ slug: 'another-api' });
    const { payload } = await call('validate_blueprint', {
      files: {
        'manifest.yaml': toYaml(draft),
        'AGENTS.md': '# Another API\n\nEndpoints live in Program.cs.\n',
        'overview.md': '# Another API\n',
        'setup.md': '1. Create it: `dotnet new webapi`\n   Verify: `dotnet build`\n',
        'CHANGELOG.md': '## 1.0.0\n',
      },
    });
    assert.ok(
      payload.problems.some((problem: string) => /already claims this stack/.test(problem)),
      payload.problems.join('\n'),
    );
    assert.equal(payload.similarity.closest.sameCombination, true);
  });
});

describe('request_blueprint', () => {
  it('produces an issue the user can file, and does not file it', async () => {
    const { payload } = await call('request_blueprint', {
      goal: 'A Godot 2D mobile game with ads',
      languages: ['csharp'],
      rationale: 'The closest blueprint is an API; nothing in the catalog builds a game.',
    });
    assert.match(payload.issue.title, /Blueprint request/);
    assert.match(payload.issue.body, /nothing in the catalog builds a game/);
    assert.match(payload.url, /issues\/new/);
    assert.match(payload.instruction, /Do not file it for them/);
  });
});

function toYaml(manifest: Record<string, unknown>): string {
  return Object.entries(manifest)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
}

describe('resolve takes the words a person uses', () => {
  it('resolves a language given by its label, not only by its taxonomy id', async () => {
    // The dogfood run: "I know C#. I'm building a multi-tenant SaaS API."
    // The agent wrote `C#`, the catalog stores `csharp`, and the answer came
    // back as no_match with "written in C#, which you did not list".
    const { payload } = await call('resolve', {
      languages: ['C#'],
      project_type: 'API service',
    });
    const body = payload as {
      status: string;
      blueprint?: { slug: string };
      why_it_fits?: string[];
    };
    assert.equal(body.status, 'resolved');
    assert.equal(body.blueprint?.slug, 'sample-api');
    assert.ok(body.why_it_fits?.some((reason) => /which you know/.test(reason)));
  });

  it('gives the same answer for the id and for the label', async () => {
    const byLabel = await call('resolve', { languages: ['C#'], project_type: 'API service' });
    const byId = await call('resolve', { languages: ['csharp'], project_type: 'api' });
    assert.deepEqual(byLabel.payload, byId.payload);
  });

  it('names a value it could not place, rather than scoring it as unknown', async () => {
    const { payload } = await call('resolve', {
      languages: ['Brainfuck'],
      project_type: 'api',
    });
    const body = payload as { unrecognised_values?: string[] };
    assert.deepEqual(body.unrecognised_values, ['languages: Brainfuck']);
  });

  it('searches by label too', async () => {
    const { payload } = await call('search_blueprints', { languages: ['C#'] });
    const body = payload as { matches: { slug: string }[] };
    assert.equal(body.matches[0]?.slug, 'sample-api');
  });
});
