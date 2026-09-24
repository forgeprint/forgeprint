import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  changelogEntry,
  checkVersions,
  classifyPublishError,
  draftNotes,
  failureLines,
  hasChangelogEntry,
  isReleaseVersion,
  publishable,
  publishedCodeUnchanged,
  quoteForShell,
  type WorkspacePackage,
} from './release.js';

const pkg = (name: string, version: string, isPrivate = false): WorkspacePackage => ({
  name,
  dir: `/repo/packages/${name}`,
  version,
  private: isPrivate,
});

describe('classifyPublishError', () => {
  // Each of these cost a wrong diagnosis on the day this module was written.
  // They are here as the record of what the words actually mean.
  const cases: { name: string; output: string; expected: string }[] = [
    {
      name: 'npm’s wording for "this version already exists"',
      output:
        'Error: ERR_PNPM_FAILED_TO_PUBLISH\n  (status 409 Conflict):\n  {"success":false,"error":"Cannot publish over previously staged version \\"0.2.5\\"."}',
      expected: 'already-published',
    },
    {
      name: 'the older wording for the same thing',
      output: 'npm error 403 You cannot publish over the previously published versions: 1.0.0.',
      expected: 'already-published',
    },
    {
      name: 'a stage-only token, which is invisible until exactly this moment',
      output:
        'Error: ERR_PNPM_FAILED_TO_PUBLISH\n  (status 403 Forbidden):\n  {"success":false,"error":"This token can only publish to a staging area. Run `npm stage publish` to publish this version, then approve it. (E_STAGE_REQUIRED)"}',
      expected: 'stage-only',
    },
    {
      name: 'a 2FA challenge nobody can answer from inside a subprocess',
      output:
        'error forgeprint did not publish: × The registry requires additional authentication, but pnpm is not running in an interactive terminal',
      expected: 'needs-interactive',
    },
    {
      name: 'a rejected token, which npm reports as a missing package',
      output:
        'Failed to publish package forgeprint@0.2.5 (status 404 Not Found): {"error":"Not found"}',
      expected: 'unauthorized',
    },
    {
      name: 'a rejected token that says so',
      output:
        'npm error code E401\nnpm error 401 Unauthorized - GET https://registry.npmjs.org/-/whoami',
      expected: 'unauthorized',
    },
    {
      name: 'anything else',
      output: 'npm error network request to https://registry.npmjs.org/ failed, reason: ETIMEDOUT',
      expected: 'failed',
    },
  ];

  for (const { name, output, expected } of cases) {
    it(name, () => {
      assert.equal(classifyPublishError(output).kind, expected);
    });
  }

  it('keeps the tail of an unrecognised failure, so the maintainer sees it', () => {
    const outcome = classifyPublishError('line one\nline two\nthe part that matters');
    assert.ok(outcome.kind === 'failed');
    assert.match(outcome.detail, /the part that matters/);
  });

  it('reads any "404" as a rejected token, which is the known limit of this', () => {
    // Stated rather than hidden: the check is a substring, so a message that
    // merely contains the digits is misread. It is only ever given the output
    // of a failed publish, where 404 has one meaning, and the cost of being
    // wrong is a misleading sentence next to a registry check that settles it.
    const outcome = classifyPublishError('failed: my-package-404-helper');
    assert.equal(outcome.kind, 'unauthorized');
  });
});

describe('hasChangelogEntry', () => {
  const changelog =
    '# Changelog\n\n## 0.3.0 — 2026-01-01\n\n- something\n\n## 0.2.10 — 2025-12-01\n';

  it('finds the entry for a version', () => {
    assert.equal(hasChangelogEntry(changelog, '0.3.0'), true);
    assert.equal(hasChangelogEntry(changelog, '0.2.10'), true);
  });

  it('does not accept a version that is only a prefix of another', () => {
    // 0.2.1 must not be satisfied by the 0.2.10 heading.
    assert.equal(hasChangelogEntry(changelog, '0.2.1'), false);
  });

  it('reports a missing entry', () => {
    assert.equal(hasChangelogEntry(changelog, '0.4.0'), false);
  });
});

describe('changelogEntry', () => {
  const changelog = [
    '# Changelog',
    '',
    '## 1.1.0 — 2026-01-01',
    '',
    '- the new thing',
    '',
    '## 1.0.0 — 2025-01-01',
    '',
    '- the first thing',
    '',
  ].join('\n');

  it('returns one version’s body without the next version’s', () => {
    assert.equal(changelogEntry(changelog, '1.1.0'), '- the new thing');
  });

  it('returns the last entry, which has no following heading', () => {
    assert.equal(changelogEntry(changelog, '1.0.0'), '- the first thing');
  });

  it('returns nothing for a version that is not there', () => {
    assert.equal(changelogEntry(changelog, '2.0.0'), undefined);
  });

  it('returns nothing for a heading with an empty body', () => {
    assert.equal(changelogEntry('## 1.0.0\n\n## 0.9.0\n\n- old\n', '1.0.0'), undefined);
  });
});

describe('checkVersions', () => {
  const changelogs: Record<string, string> = {
    a: '## 1.2.0\n\n- done\n',
    b: '## 1.1.0\n\n- older\n',
  };
  const read = (p: WorkspacePackage): string | undefined => changelogs[p.name];

  it('passes when every package is at the version and says so', () => {
    assert.deepEqual(checkVersions([pkg('a', '1.2.0')], '1.2.0', read), []);
  });

  it('reports every problem, not the first', () => {
    const problems = checkVersions([pkg('a', '1.1.0'), pkg('b', '1.2.0')], '1.2.0', read);
    assert.equal(problems.length, 2);
    assert.ok(problems[0]?.problem.includes('package.json says 1.1.0'));
    assert.ok(problems[1]?.problem.includes('no entry for 1.2.0'));
  });

  it('reports a package with no changelog at all', () => {
    const problems = checkVersions([pkg('c', '1.2.0')], '1.2.0', () => undefined);
    assert.equal(problems[0]?.problem, 'no CHANGELOG.md');
  });
});

describe('publishable', () => {
  it('leaves out the private packages, which npm must never see', () => {
    const names = publishable([pkg('a', '1.0.0'), pkg('site', '1.0.0', true)]).map((p) => p.name);
    assert.deepEqual(names, ['a']);
  });
});

describe('isReleaseVersion', () => {
  it('accepts a release version', () => {
    assert.equal(isReleaseVersion('0.2.5'), true);
    assert.equal(isReleaseVersion('1.0.0-rc.1'), true);
  });

  it('refuses anything that could carry a shell argument', () => {
    for (const bad of ['0.2.5 && rm -rf /', '0.2', 'latest', '', '0.2.5; echo', '$(whoami)']) {
      assert.equal(isReleaseVersion(bad), false, bad);
    }
  });
});

describe('draftNotes', () => {
  it('collects what the changelogs already say', () => {
    const notes = draftNotes(
      '1.0.0',
      [{ name: 'forgeprint', entry: '- a tool change' }],
      [{ slug: 'ts-mcp-server', entry: '- a blueprint change' }],
    );
    assert.ok(notes.includes('## Tools'));
    assert.ok(notes.includes('### forgeprint'));
    assert.ok(notes.includes('- a tool change'));
    assert.ok(notes.includes('## Blueprints'));
    assert.ok(notes.includes('- a blueprint change'));
  });

  it('says so rather than producing an empty file', () => {
    assert.ok(draftNotes('1.0.0', [], []).includes('No changelog entries'));
  });

  it('marks itself as a draft, because a release cannot be edited afterwards', () => {
    assert.ok(draftNotes('1.0.0', [], []).startsWith('<!-- Draft.'));
  });
});

describe('failureLines', () => {
  it('finds the failing test in output that ends with the runner\u2019s epilogue', () => {
    // The case this exists for: a failing check printed its tail, the tail was
    // pnpm saying which package failed, and the test that failed was hundreds
    // of lines above it.
    const output = [
      'ok 1 - something',
      'not ok 2 - the one that matters',
      '# fail 1',
      'ELIFECYCLE Test failed.',
      'Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL',
    ].join('\n');
    const lines = failureLines(output);
    assert.ok(lines.includes('not ok 2 - the one that matters'));
    assert.ok(lines.includes('# fail 1'));
  });

  it('keeps the tail, because an unfamiliar failure has nothing to match on', () => {
    const output = Array.from({ length: 50 }, (_, i) => `line ${i}`).join('\n');
    assert.ok(failureLines(output, 3).includes('line 49'));
  });

  it('does not repeat a line that is both marked and in the tail', () => {
    const lines = failureLines('not ok 1 - only failure', 5);
    assert.equal(lines.filter((l) => l === 'not ok 1 - only failure').length, 1);
  });
});

describe('quoteForShell', () => {
  it('quotes an argument with a space', () => {
    // The failure this exists for: `git tag -m Forgeprint 0.2.8` reaching cmd
    // as two arguments, and the tag never being created.
    assert.equal(quoteForShell('Forgeprint 0.2.8'), '"Forgeprint 0.2.8"');
  });

  it('leaves a plain argument alone', () => {
    assert.equal(quoteForShell('--access'), '--access');
    assert.equal(quoteForShell('v0.2.8'), 'v0.2.8');
  });

  it('quotes the characters cmd would otherwise act on', () => {
    for (const argument of ['a&b', 'a|b', 'a>b', 'a(b)', 'a%b%', 'a^b', 'a!b']) {
      assert.equal(quoteForShell(argument), `"${argument}"`, argument);
    }
  });

  it('escapes an embedded quote', () => {
    assert.equal(quoteForShell('say "hi"'), '"say \\"hi\\""');
  });

  it('turns an empty argument into an empty quoted one', () => {
    // Dropped entirely otherwise, which silently shifts every later argument.
    assert.equal(quoteForShell(''), '""');
  });
});

describe('publishedCodeUnchanged', () => {
  const pkgs = [pkg('a', '1.0.0'), pkg('b', '1.0.0')];

  it('lets a release finish when only a private package moved', () => {
    // The case this exists for: the tag and the GitHub release were made, npm
    // was not, and the only commits since touched the site — which is private
    // and never reaches the tarball. Refusing here spends a version number to
    // publish byte-identical code.
    assert.equal(
      publishedCodeUnchanged(() => false, 'v1.0.0', pkgs),
      true,
    );
  });

  it('refuses when a published package has changed since the tag', () => {
    assert.equal(
      publishedCodeUnchanged(() => true, 'v1.0.0', pkgs),
      false,
    );
  });

  it('asks about the published packages and nothing else', () => {
    const asked: string[][] = [];
    publishedCodeUnchanged(
      (_ref, paths) => {
        asked.push(paths);
        return false;
      },
      'v1.0.0',
      pkgs,
    );
    assert.deepEqual(asked, [['/repo/packages/a', '/repo/packages/b']]);
  });

  it('says yes when there is nothing published at all', () => {
    assert.equal(
      publishedCodeUnchanged(
        () => {
          throw new Error('should not ask git about nothing');
        },
        'v1.0.0',
        [],
      ),
      true,
    );
  });
});
