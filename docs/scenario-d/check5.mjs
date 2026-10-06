// Scenario D, acceptance check 5: a malformed body to each create route must
// answer 400, not 500.
//
// Not in checks.sh, because this one needs a token and the app's internals, and
// those are the agent's to arrange. It assumes two things the blueprint
// establishes and the task does not license changing: `createApp(settings)` is
// exported from `dist/app.js`, and a Hono app is a fetch handler, so there is
// no server and no port. If either has moved, this fails to load — and that is
// itself a finding to judge rather than a result to record.
//
// It runs from outside the run directory so that checking cannot change what is
// being checked.
//
//   node docs/scenario-d/check5.mjs ~/scenario-d/run-d1a
//
// It uses the project's own built app and the same token shape its tests use,
// because a Hono app is a fetch handler: no server, no port, no listening.
import { createRequire } from 'node:module';

const dir = process.argv[2];
if (!dir) throw new Error('usage: node check5.mjs <run-dir>');

// Resolve the project's own jose rather than a copy next to this script: the
// script lives outside the run directory on purpose, so that running a check
// cannot change what is being checked.
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
const send = (path, body) =>
  app.request(path, {
    method: 'POST',
    headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
    body,
  });

// A project has to exist before a task route can be reached, or a 404 would
// hide whatever the body handling does.
const created = await send('/projects', JSON.stringify({ name: 'check 5' }));
if (created.status !== 201) {
  console.log(`could not create a project to test against: ${created.status}`);
  process.exit(1);
}
const { id } = await created.json();

const cases = [
  ['POST /projects', '/projects'],
  ['POST /projects/:id/tasks', `/projects/${id}/tasks`],
];
const bodies = [
  ['not json at all', '{'],
  ['json but not an object', '"a string"'],
  ['object with nothing it wants', '{}'],
  ['wrong types', '{"name":123}'],
];

let worst = 0;
for (const [label, path] of cases) {
  for (const [what, body] of bodies) {
    const status = (await send(path, body)).status;
    const verdict = status === 400 ? 'ok' : status >= 500 ? 'FAIL' : `(${status})`;
    if (status >= 500) worst = 1;
    console.log(`${verdict.padEnd(6)} ${label.padEnd(26)} ${what.padEnd(26)} -> ${status}`);
  }
}
console.log(
  worst === 0 ? '\ncheck 5 passes: no 5xx' : '\ncheck 5 fails: a malformed body reached a 5xx',
);
process.exit(worst);
