// Scenario D, round 2 — the acceptance checks that need the built app.
//
//   node docs/scenario-d/round-2/check-app.mjs <run-dir>
//
// Four checks live here because all four need a token and a route table:
//
//   0b  the route floor. Sixteen new routes, four per resource. Round 1
//       learned that a gate which never asks "was the work done" passes a run
//       that implemented nothing; `check 0` in checks.sh is the git half of
//       that floor and this is the behavioural half.
//   5   a malformed body to each create route answers 4xx, never 5xx.
//   6   a declared type is type-tested rather than coerced.
//   7   a refusal names what the route accepts, never what the caller sent.
//
// Checks 6 and 7 are new in round 2, and they are new for a reason rather than
// for coverage: an independent reviewer inside round 1's D3b found exactly
// these two defects in work that passed all five of round 1's checks, and
// ADR 0014 says that when a finding would have been caught by a deterministic
// check, write that check — and only that one. The reviewer's third finding, a
// missing content-type check, is deliberately *not* here: the report counts
// two, and `src/body.ts` already answers 415 by default, so a check for it
// would measure whether the agent reused the blueprint rather than whether the
// work is sound.
//
// It assumes what the blueprint establishes and the task does not license
// changing: `createApp(settings)` exported from `dist/app.js`, and a Hono app
// is a fetch handler, so there is no server and no port. If either has moved,
// this fails to load — and that is a finding to judge rather than a result to
// record.
//
// It runs from outside the run directory so that checking cannot change what
// is being checked.
import { createRequire } from 'node:module';

const dir = process.argv[2];
if (!dir) throw new Error('usage: node check-app.mjs <run-dir>');

// Resolve the project's own jose rather than a copy next to this script.
const fromProject = createRequire(`${dir}/package.json`);
const { SignJWT } = await import(fromProject.resolve('jose'));
const { createApp } = await import(`${dir}/dist/app.js`);

const settings = {
  secret: new TextEncoder().encode('not-a-real-secret-only-for-tests-0000'),
  audience: 'service-tests',
  issuer: 'service-tests',
};
const bearer = await new SignJWT({ sub: 'user-1' })
  .setProtectedHeader({ alg: 'HS256' })
  .setAudience(settings.audience)
  .setIssuer(settings.issuer)
  .setExpirationTime('1h')
  .sign(settings.secret);

const app = createApp(settings);
const post = (path, body) =>
  app.request(path, {
    method: 'POST',
    headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
    body,
  });

let failed = 0;
const say = (verdict, line) => console.log(`${verdict.padEnd(6)}${line}`);
const ok = (line) => say('PASS', line);
const no = (line) => {
  failed += 1;
  say('FAIL', line);
};

// --- 0b. the route floor ---------------------------------------------------
//
// Middleware registrations come back as ALL and are not routes, which is the
// same filter the blueprint's own route-table test uses.
const resources = ['projects', 'notes', 'tags', 'budgets'];
const routes = createApp(settings)
  .routes.filter((r) => r.method !== 'ALL')
  .map((r) => `${r.method} ${r.path}`);

// The baseline declares three: GET /health, GET /items, POST /items. Four
// resources with create, read, list and delete is sixteen more.
if (routes.length >= 19) {
  ok(`check 0b  ${routes.length} routes declared, floor 19 (baseline 3 + 16)`);
} else {
  no(`check 0b  ${routes.length} routes declared, floor 19 — the task is not implemented`);
  console.log(routes.map((r) => `      ${r}`).join('\n'));
}
for (const name of resources) {
  const mine = routes.filter((r) => r.includes(` /${name}`));
  if (mine.length >= 4) {
    ok(`check 0b  /${name}: ${mine.length} routes`);
  } else {
    no(`check 0b  /${name}: ${mine.length} routes, needs create, read, list and delete`);
  }
}

// --- the create routes -----------------------------------------------------
//
// One valid body per resource, from the task's own wording. Everything below
// is that body with one thing wrong, so a refusal is about the one thing.
const creates = [
  { path: '/projects', valid: { name: 'check' }, fields: { name: 'string', archived: 'boolean' } },
  {
    path: '/notes',
    valid: { title: 'check', content: 'check' },
    fields: { title: 'string', content: 'string', pinned: 'boolean' },
  },
  { path: '/tags', valid: { label: 'check' }, fields: { label: 'string' } },
  {
    path: '/budgets',
    valid: { name: 'check', limit: 10 },
    fields: { name: 'string', limit: 'number' },
  },
];

// A create route that refuses its own valid body cannot be measured by any of
// the three checks below: every one of them sends that body with one thing
// wrong, and a 404 would answer them all. So the route is probed first, and a
// resource that fails here is left out of 5, 6 and 7 rather than scoring four
// accidental passes on a route that does not exist.
const usable = [];
for (const create of creates) {
  const res = await post(create.path, JSON.stringify(create.valid));
  if (res.status >= 200 && res.status < 300) {
    ok(`valid    POST ${create.path} accepts ${JSON.stringify(create.valid)} -> ${res.status}`);
    usable.push(create);
  } else {
    no(`valid    POST ${create.path} refused its own valid body -> ${res.status}`);
  }
}
if (usable.length < creates.length) {
  const left = creates.filter((c) => !usable.includes(c)).map((c) => c.path);
  say('note', `checks 5, 6 and 7 not run for: ${left.join(', ')}`);
}

// --- 5. a malformed body answers 4xx, never 5xx ----------------------------
const malformed = [
  ['not json at all', '{'],
  ['json but not an object', '"a string"'],
  ['object with nothing it wants', '{}'],
  ['an array', '[]'],
];
for (const create of usable) {
  for (const [what, body] of malformed) {
    const { status } = await post(create.path, body);
    if (status >= 500) no(`check 5   POST ${create.path}  ${what} -> ${status}`);
    else ok(`check 5   POST ${create.path}  ${what} -> ${status}`);
  }
}

// --- 6. a declared type is type-tested, not coerced ------------------------
//
// `Boolean(value)`, `value ?? false` and `!!value` all accept null, and one of
// them shipped in round 1. `Number(value)` accepts "10", null and true just as
// readily. So every declared field is offered null and the two values its own
// type coerces from, and 400 is the only acceptable answer.
const coercions = {
  string: [null, 123, true],
  boolean: [null, 'yes', 1],
  number: [null, '10', true],
};
for (const create of usable) {
  for (const [field, kind] of Object.entries(create.fields)) {
    for (const value of coercions[kind]) {
      const { status } = await post(
        create.path,
        JSON.stringify({ ...create.valid, [field]: value }),
      );
      const shown = `${field} (${kind}) = ${JSON.stringify(value)}`;
      if (status === 400) ok(`check 6   POST ${create.path}  ${shown} -> 400`);
      else no(`check 6   POST ${create.path}  ${shown} -> ${status}, wanted 400`);
    }
  }
}

// --- 7. a refusal does not echo what the caller sent -----------------------
//
// An error message that names the rejected field turns a validator into a
// reflector. The probe is in the key and in the value, because either one
// coming back is the same defect.
const probeKey = 'zzzprobekey';
const probeValue = 'zzzprobevalue';
for (const create of usable) {
  const body = { ...create.valid, [probeKey]: probeValue };
  const res = await post(create.path, JSON.stringify(body));
  const text = await res.text();
  const echoed = [probeKey, probeValue].filter((p) => text.includes(p));
  if (res.status < 400 || res.status >= 500) {
    no(`check 7   POST ${create.path}  unknown key -> ${res.status}, wanted 4xx`);
  } else if (echoed.length > 0) {
    no(`check 7   POST ${create.path}  refusal echoed ${echoed.join(' and ')}: ${text}`);
  } else {
    ok(`check 7   POST ${create.path}  refusal names only what it accepts -> ${res.status}`);
  }
}

console.log(
  failed === 0 ? '\nchecks 0b, 5, 6 and 7 pass.' : `\n${failed} assertion(s) failed above.`,
);
process.exit(failed === 0 ? 0 : 1);
