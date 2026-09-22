import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lintSetup } from './lint-setup.js';

const OPTIONS = { database: ['postgres', 'sqlserver'] };

const VALID = `# Setup

1. Create the project: \`dotnet new webapi -o src/Api\`
   Verify: \`test -f src/Api/Api.csproj\`

<!-- if options.database == postgres -->

2. Add the provider: \`dotnet add src/Api package Npgsql.EntityFrameworkCore.PostgreSQL --version 10.0.0\`
   Verify: \`dotnet build\`

<!-- endif -->

<!-- if options.database == sqlserver -->

2. Add the provider: \`dotnet add src/Api package Microsoft.EntityFrameworkCore.SqlServer --version 10.0.0\`
   Verify: \`dotnet build\`

<!-- endif -->

3. Run the tests: \`dotnet test\`
   Verify: \`dotnet test\`
`;

function rules(source: string, options: Record<string, string[]> = OPTIONS): string[] {
  return lintSetup(source, { options }).map((problem) => problem.rule);
}

describe('lintSetup', () => {
  it('accepts a recipe that follows the rules', () => {
    assert.deepEqual(lintSetup(VALID, { options: OPTIONS }), []);
  });

  it('lets sibling branches repeat the number they opened at', () => {
    assert.ok(!rules(VALID).includes('step-numbering'));
  });

  it('rejects a gap in the numbering', () => {
    const source = '1. First: `a`\n   Verify: `b`\n\n3. Third: `c`\n   Verify: `d`\n';
    assert.ok(rules(source).includes('step-numbering'));
  });

  it('rejects a step with no verification', () => {
    const source = '1. Create it: `dotnet new webapi`\n';
    assert.ok(rules(source).includes('step-needs-verification'));
  });

  it('rejects a step that states no command', () => {
    const source = '1. Install the required packages.\n   Verify: `dotnet build`\n';
    assert.ok(rules(source).includes('step-needs-command'));
  });

  it('rejects a document with no steps at all', () => {
    assert.ok(rules('Just run the usual commands.\n').includes('no-steps'));
  });

  it('rejects piping a download into a shell', () => {
    const source =
      '1. Install: `curl -sSL https://example.com/i.sh | sh`\n   Verify: `x --version`\n';
    assert.ok(rules(source).includes('no-pipe-to-shell'));
  });

  it('rejects sudo, recursive deletes and system paths', () => {
    const found = rules(
      '1. One: `sudo apt-get install -y git`\n   Verify: `git --version`\n\n' +
        '2. Two: `rm -rf ./build`\n   Verify: `test ! -d ./build`\n\n' +
        '3. Three: `cp app /usr/local/bin/app`\n   Verify: `app --version`\n',
    );
    assert.ok(found.includes('no-sudo'));
    assert.ok(found.includes('no-recursive-delete'));
    assert.ok(found.includes('no-system-paths'));
  });

  it('ignores a forbidden word in prose, and catches it in a command', () => {
    const prose = '1. Do not use sudo here: `dotnet build`\n   Verify: `dotnet build`\n';
    assert.ok(!rules(prose).includes('no-sudo'));
  });

  it('requires a pinned NuGet version', () => {
    const source = '1. Add it: `dotnet add package Serilog`\n   Verify: `dotnet build`\n';
    assert.ok(rules(source).includes('pin-nuget'));
  });

  it('sees the form recipes actually use, with the project in the middle', () => {
    // `dotnet add <project> package <name>` went unchecked entirely: the rule
    // required "add package" to be adjacent, and no recipe here writes it that
    // way. Found by rehearsing a review against a deliberately unpinned PR.
    const source =
      '1. Add it: `dotnet add src/App.Api package Npgsql.EntityFrameworkCore.PostgreSQL`\n' +
      '   Verify: `dotnet build`\n';
    assert.ok(rules(source).includes('pin-nuget'));
  });

  it('accepts a pinned version with the project in the middle', () => {
    const source =
      '1. Add it: `dotnet add src/App.Api package Npgsql --version 10.0.3`\n' +
      '   Verify: `dotnet build`\n';
    assert.ok(!rules(source).includes('pin-nuget'));
  });

  it('accepts a pinned NuGet version', () => {
    const source =
      '1. Add it: `dotnet add package Serilog --version 4.2.0`\n   Verify: `dotnet build`\n';
    assert.ok(!rules(source).includes('pin-nuget'));
  });

  it('requires a pinned npm version and a tagged image', () => {
    const found = rules(
      '1. Add it: `npm install zod`\n   Verify: `npm test`\n\n' +
        '2. Start it: `docker run postgres`\n   Verify: `docker ps`\n',
    );
    assert.ok(found.includes('pin-npm'));
    assert.ok(found.includes('pin-image'));
  });

  it('rejects a tag that merely contains latest', () => {
    // `2025-latest` moves exactly as much as `latest` does, and it passed for
    // as long as the rule matched the whole tag. Found by a review reading a
    // compose file, which is the kind of thing a rule should have caught.
    const source = [
      '1. Write `compose.yaml`:',
      '',
      '   ```yaml',
      '   services:',
      '     db:',
      '       image: mcr.microsoft.com/mssql/server:2025-latest',
      '   ```',
      '',
      '   Verify: `docker compose config`',
      '',
    ].join('\n');
    assert.ok(rules(source, {}).includes('pin-image'));
  });

  it('accepts a compose image with a pinned tag', () => {
    const source = [
      '1. Write `compose.yaml`:',
      '',
      '   ```yaml',
      '   services:',
      '     db:',
      '       image: postgres:18-alpine',
      '   ```',
      '',
      '   Verify: `docker compose config`',
      '',
    ].join('\n');
    assert.ok(!rules(source, {}).includes('pin-image'));
  });

  it('rejects an image tagged latest', () => {
    const source = '1. Start it: `docker run postgres:latest`\n   Verify: `docker ps`\n';
    assert.ok(rules(source).includes('pin-image'));
  });

  it('allows a bare npm install, which pins nothing by definition', () => {
    const source = '1. Install: `npm install`\n   Verify: `npm test`\n';
    assert.ok(!rules(source).includes('pin-npm'));
  });

  it('allows a registry host and a localhost health check', () => {
    const source =
      '1. Fetch it: `dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget`\n' +
      '   Verify: `dotnet nuget list source`\n\n' +
      '2. Check it: `curl -f http://localhost:5000/health`\n   Verify: `curl -f http://localhost:5000/health`\n';
    assert.ok(!rules(source).includes('registry-only'));
  });

  it('allows a documentation host, which resolves to nothing anybody runs', () => {
    // RFC 2606 reserves example.com for exactly this. A step that proves a
    // server rejects `Origin: https://example.com` names a host without
    // reaching one, and the rule used to fail it.
    const source =
      '1. Check it refuses a browser origin: `curl -sS -H "Origin: https://example.com" http://127.0.0.1:8080/`\n' +
      '   Verify: `test -f out.txt`\n';
    assert.ok(!rules(source).includes('registry-only'));
  });

  it('rejects a host that is not a package registry', () => {
    const source =
      '1. Fetch it: `curl -o tool.zip https://files.example.com/tool.zip`\n   Verify: `test -f tool.zip`\n';
    assert.ok(rules(source).includes('registry-only'));
  });

  it('rejects a guard for an option that is not declared', () => {
    const source =
      '<!-- if options.cache == redis -->\n\n1. One: `a`\n   Verify: `b`\n\n<!-- endif -->\n';
    assert.ok(rules(source).includes('unknown-option'));
  });

  it('rejects a guard value that is not declared', () => {
    const source =
      '<!-- if options.database == mysql -->\n\n1. One: `a`\n   Verify: `b`\n\n<!-- endif -->\n';
    assert.ok(rules(source).includes('unknown-option-value'));
  });

  it('rejects an unclosed guard', () => {
    const source = '<!-- if options.database == postgres -->\n\n1. One: `a`\n   Verify: `b`\n';
    assert.ok(rules(source).includes('unclosed-guard'));
  });

  it('rejects nested guards (ADR 0001)', () => {
    const source =
      '<!-- if options.database == postgres -->\n' +
      '<!-- if options.database == sqlserver -->\n\n1. One: `a`\n   Verify: `b`\n\n' +
      '<!-- endif -->\n<!-- endif -->\n';
    assert.ok(rules(source).includes('no-nested-guards'));
  });

  it('rejects a malformed guard rather than ignoring it', () => {
    const source =
      '<!-- if database == postgres -->\n\n1. One: `a`\n   Verify: `b`\n\n<!-- endif -->\n';
    assert.ok(rules(source).includes('guard-syntax'));
  });

  it('reports problems in line order', () => {
    const problems = lintSetup('1. One: `a`\n\n5. Five: `b`\n', { options: {} });
    const lineNumbers = problems.map((problem) => problem.line);
    assert.deepEqual(
      [...lineNumbers].sort((a, b) => a - b),
      lineNumbers,
    );
  });
});

describe('fenced blocks', () => {
  it('does not read a system path inside a Dockerfile as writing outside the project', () => {
    // The image's filesystem is not the reader's. /usr/local is where a
    // container puts what it installs, and the rule is about the machine
    // running the recipe.
    const source = [
      '1. Write the `Dockerfile`:',
      '',
      '   ```dockerfile',
      '   FROM python:3.13-slim',
      '   COPY --from=build /install /usr/local',
      '   ```',
      '',
      '   Verify: `test -f Dockerfile`',
      '',
    ].join('\n');
    assert.ok(!rules(source, {}).includes('no-system-paths'));
  });

  it('still refuses a system path in a shell block', () => {
    const source = [
      '1. Write the script `run.sh`:',
      '',
      '   ```bash',
      '   cp app /usr/local/bin/app',
      '   ```',
      '',
      '   Verify: `test -f run.sh`',
      '',
    ].join('\n');
    assert.ok(rules(source, {}).includes('no-system-paths'));
  });

  it('does not read a numbered line inside a code block as a step', () => {
    const source = [
      '1. Write the file `notes.md`:',
      '',
      '   ```markdown',
      '   1. This is content, not a step.',
      '   2. So is this.',
      '   ```',
      '',
      '   Verify: `test -f notes.md`',
      '',
      '2. Build it: `dotnet build`',
      '   Verify: `dotnet build`',
      '',
    ].join('\n');
    assert.deepEqual(lintSetup(source, { options: {} }), []);
  });

  it('still lints commands inside a code block', () => {
    const source = [
      '1. Write the script `run.sh`:',
      '',
      '   ```bash',
      '   sudo systemctl restart app',
      '   ```',
      '',
      '   Verify: `test -f run.sh`',
      '',
    ].join('\n');
    assert.ok(rules(source, {}).includes('no-sudo'));
  });
});

describe('guard groups', () => {
  const TWO_FIELDS = { database: ['postgres', 'sqlserver'], auth: ['jwt', 'oidc'] };

  it('continues the numbering when a second group branches on another field', () => {
    const source = [
      '1. One: `a`',
      '   Verify: `b`',
      '',
      '<!-- if options.database == postgres -->',
      '',
      '2. Postgres: `a`',
      '   Verify: `b`',
      '',
      '<!-- endif -->',
      '',
      '<!-- if options.database == sqlserver -->',
      '',
      '2. SQL Server: `a`',
      '   Verify: `b`',
      '',
      '<!-- endif -->',
      '',
      '<!-- if options.auth == jwt -->',
      '',
      '3. JWT: `a`',
      '   Verify: `b`',
      '',
      '<!-- endif -->',
      '',
      '<!-- if options.auth == oidc -->',
      '',
      '3. OIDC: `a`',
      '   Verify: `b`',
      '',
      '<!-- endif -->',
      '',
      '4. Four: `a`',
      '   Verify: `b`',
      '',
    ].join('\n');
    assert.deepEqual(lintSetup(source, { options: TWO_FIELDS }), []);
  });

  it('accepts a docker run whose image is tagged, past the flags', () => {
    const source =
      '1. Start it: `docker run -d --name check -p 8080:8080 app-api:dev`\n   Verify: `docker ps`\n';
    assert.ok(!rules(source, {}).includes('pin-image'));
  });

  it('still rejects a docker run with an untagged image past the flags', () => {
    const source =
      '1. Start it: `docker run -d --name check -p 8080:8080 app-api`\n   Verify: `docker ps`\n';
    assert.ok(rules(source, {}).includes('pin-image'));
  });
});

describe('two guard groups on one field', () => {
  it('continues the numbering when the same field branches again', () => {
    const source = [
      '<!-- if options.transport == stdio -->',
      '',
      '1. Stdio project: `a`',
      '   Verify: `b`',
      '',
      '<!-- endif -->',
      '',
      '<!-- if options.transport == http -->',
      '',
      '1. HTTP project: `a`',
      '   Verify: `b`',
      '',
      '<!-- endif -->',
      '',
      '<!-- if options.transport == stdio -->',
      '',
      '2. Stdio entry point: `a`',
      '   Verify: `b`',
      '',
      '<!-- endif -->',
      '',
      '<!-- if options.transport == http -->',
      '',
      '2. HTTP entry point: `a`',
      '   Verify: `b`',
      '',
      '<!-- endif -->',
      '',
      '3. Build: `dotnet build`',
      '   Verify: `dotnet build`',
      '',
    ].join('\n');
    assert.deepEqual(lintSetup(source, { options: { transport: ['stdio', 'http'] } }), []);
  });
});
