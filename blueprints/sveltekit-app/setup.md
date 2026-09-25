# Setup

Creates a server-rendered SvelteKit application in Svelte 5 runes mode and strict
TypeScript: Tailwind, adapter-node, one server `load` and one form action with
validation on the server, a Content Security Policy, and tests that start the
production build and read what it sends.

Run every step from the empty directory that will hold the project. Each step is
one action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.13 or newer: ESLint 10 needs 22.13, Vite 8 needs 22.12. The
generated `.npmrc` sets `engine-strict=true`, so an older Node stops at the
install instead of failing somewhere later.

1. Generate the project with the pinned Svelte CLI: the minimal template, TypeScript, Prettier, ESLint, Vitest for unit tests only (its component-test mode drives a browser that Playwright downloads from outside the npm registry), Tailwind with no plugins, and adapter-node. `--no-install`, because the next step pins every version the generator leaves as a range. The CLI fetches nothing but itself for these official add-ons, and none of the tools it sets up collect telemetry: `npx --yes sv@0.17.1 create --template minimal --types ts --add prettier eslint vitest="usages:unit" tailwindcss="plugins:none" sveltekit-adapter="adapter:node" --no-install --no-dir-check .`
   Verify: `test -f vite.config.ts && test -f eslint.config.js && test -f src/routes/+layout.svelte`

2. Pin every version exactly instead of the generator's ranges. Vitest is on 5.0.1 rather than the generator's 4.1 line: npm fails to resolve Vitest 4.1's optional peers at all. `cookie` is overridden to 0.7.2 because SvelteKit still depends on 0.6, which has a low-severity advisory (GHSA-pxg6-pf52-xh8x); remove the override when SvelteKit moves. `vitest` is pinned a second time under `overrides`, and npm refuses to install if the two ever differ. Vite's optional `@vitejs/devtools` peer leads to one that accepts any `vitest`; npm resolves that to the newest release instead of the pinned one, and npm 10 and 11 crash on the mismatch while building the tree ("Cannot read properties of null (reading 'edgesOut')"). None of those optional peers is installed. Replace `package.json` with:

   ```json
   {
     "name": "app",
     "private": true,
     "version": "0.1.0",
     "type": "module",
     "engines": {
       "node": ">=22.13"
     },
     "scripts": {
       "dev": "vite dev",
       "build": "vite build",
       "preview": "vite preview",
       "start": "node build",
       "prepare": "svelte-kit sync || echo ''",
       "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --fail-on-warnings",
       "lint": "prettier --check . && eslint .",
       "format": "prettier --write .",
       "test": "vitest --run",
       "test:built": "node --test tests/built-server.test.mjs"
     },
     "overrides": {
       "cookie": "0.7.2",
       "vitest": "5.0.1"
     },
     "devDependencies": {
       "@eslint/js": "10.0.1",
       "@sveltejs/adapter-node": "5.5.7",
       "@sveltejs/kit": "2.70.3",
       "@sveltejs/vite-plugin-svelte": "7.3.1",
       "@tailwindcss/vite": "4.3.3",
       "@types/node": "22.20.4",
       "eslint": "10.11.0",
       "eslint-config-prettier": "10.1.8",
       "eslint-plugin-svelte": "3.23.0",
       "globals": "17.12.0",
       "prettier": "3.9.9",
       "prettier-plugin-svelte": "4.1.1",
       "prettier-plugin-tailwindcss": "0.8.1",
       "svelte": "5.57.1",
       "svelte-check": "4.7.6",
       "tailwindcss": "4.3.3",
       "typescript": "6.0.3",
       "typescript-eslint": "8.70.1",
       "vite": "8.3.1",
       "vitest": "5.0.1"
     }
   }
   ```

   Verify: `grep -q '"@sveltejs/kit": "2.70.3"' package.json`

3. Install the pinned dependencies. This writes `package-lock.json`, which is committed and is what CI installs from: `npm install --no-audit --no-fund`
   Verify: `npm ls @sveltejs/kit @sveltejs/adapter-node svelte vite vitest cookie && test -f package-lock.json`

4. Runes everywhere, adapter-node, and a Content Security Policy. Configuration lives in `vite.config.ts`; the generator no longer writes a `svelte.config.js`. Replace `vite.config.ts` with:

   ```typescript
   import tailwindcss from '@tailwindcss/vite';
   import { defineConfig } from 'vitest/config';
   import adapter from '@sveltejs/adapter-node';
   import { sveltekit } from '@sveltejs/kit/vite';

   export default defineConfig({
     plugins: [
       tailwindcss(),
       sveltekit({
         compilerOptions: {
           // Runes everywhere except inside dependencies. Can be removed in Svelte 6.
           runes: ({ filename }) =>
             filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
         },
         adapter: adapter(),
         // Nothing runs in the page that this server did not send. SvelteKit adds a
         // nonce to its own inline script on every server-rendered response, so
         // script-src needs no 'unsafe-inline'. Styles keep it: Vite injects them
         // as <style> elements in development, and Svelte transitions do at run time.
         csp: {
           mode: 'auto',
           directives: {
             'default-src': ['self'],
             'script-src': ['self'],
             'style-src': ['self', 'unsafe-inline'],
             'img-src': ['self', 'data:'],
             'font-src': ['self'],
             'connect-src': ['self'],
             'form-action': ['self'],
             'base-uri': ['self'],
             'object-src': ['none'],
             'frame-ancestors': ['none'],
           },
         },
       }),
     ],
     test: {
       // A test that asserts nothing passes; this makes it fail instead.
       expect: { requireAssertions: true },
       environment: 'node',
       include: ['src/**/*.spec.ts'],
     },
   });
   ```

   Verify: `grep -q "frame-ancestors" vite.config.ts`

5. Type the error the browser is shown and the `meta` every page's load returns. Replace `src/app.d.ts` with:

   ```typescript
   declare global {
     namespace App {
       // What the browser is told about an unexpected error: a message that gives
       // nothing away, and an id to find the full error in the server log.
       interface Error {
         message: string;
         id?: string;
       }
       // Every page's load returns `meta`; the root layout writes it into <head>.
       interface PageData {
         meta?: {
           title: string;
           description: string;
         };
       }
     }
   }

   export {};
   ```

   Verify: `grep -q "interface PageData" src/app.d.ts`

6. The server's start-up check, its response headers, and what an unexpected error tells the browser. Create `src/hooks.server.ts` with:

   ```typescript
   import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';
   import { building, dev } from '$app/environment';
   import { env } from '$env/dynamic/private';

   // adapter-node builds every absolute URL from ORIGIN: the canonical link, and the
   // origin a form post is checked against. Without it they come from the Host
   // header of whoever is asking. So the production server refuses to start
   // without one, instead of guessing.
   export const init: ServerInit = () => {
     if (dev || building) return;
     const origin = env.ORIGIN;
     if (!origin) {
       throw new Error(
         'ORIGIN is not set. Set it to the public origin, such as https://example.com',
       );
     }
     if (URL.parse(origin)?.origin !== origin) {
       throw new Error(`ORIGIN must be an origin with no path or trailing slash, not "${origin}"`);
     }
   };

   export const handle: Handle = async ({ event, resolve }) => {
     const response = await resolve(event);
     response.headers.set('X-Content-Type-Options', 'nosniff');
     response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
     return response;
   };

   // The whole error goes to the server log. The browser gets an id to quote,
   // never the message, which can carry a path, a query or a secret.
   export const handleError: HandleServerError = ({ error, event, status, message }) => {
     if (status === 404) return { message };
     const id = crypto.randomUUID();
     console.error(
       `[${id}] ${event.request.method} ${event.url.pathname} failed with ${status}`,
       error,
     );
     return { message: 'Internal error', id };
   };
   ```

   Verify: `test -f src/hooks.server.ts`

7. Create `src/lib/site.ts` with:

   ```typescript
   // What a page falls back to when its load returns no `meta`. The origin is not
   // here: it comes from ORIGIN at run time, so there is one place to set it.
   export const site = {
     name: 'App',
     description: 'A SvelteKit application rendered on the server.',
   } as const;
   ```

   Verify: `test -f src/lib/site.ts`

8. The validation the form action runs, in the server-only part of `$lib`. Create `src/lib/server/signup.ts` with:

   ```typescript
   // Server-only: SvelteKit refuses to build if anything under $lib/server is
   // imported by code that reaches the browser. The list of topics lives here so
   // the form is drawn from it and the action checks against it, and a value the
   // browser made up is refused rather than stored.
   export const topics = [
     { id: 'releases', label: 'Releases' },
     { id: 'security', label: 'Security notices' },
   ] as const;

   export type TopicId = (typeof topics)[number]['id'];

   export interface Signup {
     email: string;
     topic: TopicId;
   }

   export interface SignupErrors {
     email?: string;
     topic?: string;
   }

   export type SignupResult =
     { ok: true; value: Signup } | { ok: false; errors: SignupErrors; email: string };

   // The longest address SMTP can carry. Checked before the pattern, so the
   // pattern never runs on a long input.
   const MAX_EMAIL_LENGTH = 254;

   // Deliberately loose. The only proof that an address works is a message that
   // arrives; this catches typing mistakes, not invented addresses.
   const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

   export function parseSignup(form: FormData): SignupResult {
     const rawEmail = form.get('email');
     const rawTopic = form.get('topic');
     // A file upload in place of a text field is a string of nothing.
     const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
     const topic = topics.find((candidate) => candidate.id === rawTopic);
     const errors: SignupErrors = {};

     if (email.length === 0) {
       errors.email = 'Enter an email address.';
     } else if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
       errors.email = 'Enter a valid email address.';
     }
     if (topic === undefined) {
       errors.topic = 'Choose one of the listed topics.';
     }

     if (errors.email !== undefined || topic === undefined) {
       return { ok: false, errors, email: email.slice(0, MAX_EMAIL_LENGTH) };
     }
     return { ok: true, value: { email, topic: topic.id } };
   }
   ```

   Verify: `test -f src/lib/server/signup.ts`

9. Create `src/lib/server/signup.spec.ts` with:

   ```typescript
   import { describe, expect, it } from 'vitest';
   import { parseSignup } from './signup';

   function form(fields: Record<string, string | Blob>): FormData {
     const data = new FormData();
     for (const [name, value] of Object.entries(fields)) data.set(name, value);
     return data;
   }

   describe('parseSignup', () => {
     it('accepts an address and a listed topic, trimmed', () => {
       expect(parseSignup(form({ email: '  someone@example.com ', topic: 'releases' }))).toEqual({
         ok: true,
         value: { email: 'someone@example.com', topic: 'releases' },
       });
     });

     it('names every problem at once', () => {
       const result = parseSignup(form({}));
       expect(result).toEqual({
         ok: false,
         email: '',
         errors: { email: 'Enter an email address.', topic: 'Choose one of the listed topics.' },
       });
     });

     it('refuses a topic the server did not offer', () => {
       const result = parseSignup(form({ email: 'someone@example.com', topic: 'admin' }));
       expect(result).toMatchObject({
         ok: false,
         errors: { topic: 'Choose one of the listed topics.' },
       });
     });

     it('refuses an address that is not one, and keeps what was typed', () => {
       const result = parseSignup(form({ email: 'someone at example', topic: 'security' }));
       expect(result).toEqual({
         ok: false,
         email: 'someone at example',
         errors: { email: 'Enter a valid email address.' },
       });
     });

     it('refuses an address longer than SMTP allows, and does not echo all of it', () => {
       const long = `${'a'.repeat(250)}@example.com`;
       const result = parseSignup(form({ email: long, topic: 'releases' }));
       expect(result).toMatchObject({
         ok: false,
         errors: { email: 'Enter a valid email address.' },
       });
       expect(result.ok === false && result.email.length).toBe(254);
     });

     it('treats a file sent in place of the address as no address', () => {
       const result = parseSignup(form({ email: new Blob(['x']), topic: 'releases' }));
       expect(result).toMatchObject({ ok: false, errors: { email: 'Enter an email address.' } });
     });
   });
   ```

   Verify: `test -f src/lib/server/signup.spec.ts`

10. The page's server `load` and its form action. Create `src/routes/+page.server.ts` with:

    ```typescript
    import { fail } from '@sveltejs/kit';
    import { parseSignup, topics } from '$lib/server/signup';
    import type { Actions, PageServerLoad } from './$types';

    export const load = (() => ({
      meta: {
        title: 'Join the list',
        description:
          'Leave an address and pick a topic. The form works without JavaScript, and every value is checked on the server.',
      },
      topics,
    })) satisfies PageServerLoad;

    export const actions = {
      default: async ({ request }) => {
        const result = parseSignup(await request.formData());
        if (!result.ok) {
          return fail(400, { email: result.email, errors: result.errors });
        }
        // Where a signup goes (a database, a mailing-list provider) is the first
        // real decision after setup. Until it is made, a valid signup is
        // acknowledged and not stored.
        return { success: true, email: result.value.email };
      },
    } satisfies Actions;
    ```

    Verify: `test -f src/routes/+page.server.ts`

11. Create `src/routes/page.server.spec.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';
    import { actions, load } from './+page.server';

    type ActionEvent = Parameters<typeof actions.default>[0];

    function submit(fields: Record<string, string>) {
      const request = new Request('http://localhost/', {
        method: 'POST',
        body: new URLSearchParams(fields),
      });
      return actions.default({ request } as ActionEvent);
    }

    describe('load', () => {
      it('sends the page meta and the topics the action accepts', () => {
        const data = load();
        expect(data.meta.title).toBe('Join the list');
        expect(data.meta.description.length).toBeGreaterThan(50);
        expect(data.topics.map((topic) => topic.id)).toEqual(['releases', 'security']);
      });
    });

    describe('the default action', () => {
      it('fails with 400, the reasons, and the address as typed', async () => {
        const result = await submit({ email: 'nope', topic: 'releases' });
        expect(result).toMatchObject({
          status: 400,
          data: { email: 'nope', errors: { email: 'Enter a valid email address.' } },
        });
      });

      it('fails on a topic that was not offered, however valid the address', async () => {
        const result = await submit({ email: 'someone@example.com', topic: 'everything' });
        expect(result).toMatchObject({
          status: 400,
          data: { errors: { topic: expect.any(String) } },
        });
      });

      it('acknowledges a valid signup', async () => {
        const result = await submit({ email: 'someone@example.com', topic: 'security' });
        expect(result).toEqual({ success: true, email: 'someone@example.com' });
      });
    });
    ```

    Verify: `test -f src/routes/page.server.spec.ts`

12. The root layout: the only place that writes the title, the description and the canonical link, and the landmark the skip link points at. Replace `src/routes/+layout.svelte` with:

    ```svelte
    <script lang="ts">
    	import './layout.css';
    	import favicon from '$lib/assets/favicon.svg';
    	import { page } from '$app/state';
    	import { site } from '$lib/site';

    	let { children } = $props();

    	const title = $derived(page.data.meta?.title ?? site.name);
    	const description = $derived(page.data.meta?.description ?? site.description);
    	// Absolute, from the request's origin, which in production is ORIGIN and never
    	// the Host header (see hooks.server.ts). The query string is dropped, or every
    	// tracking link would be a separate page to a crawler.
    	const canonical = $derived(new URL(page.url.pathname, page.url.origin).href);
    </script>

    <!-- The only place in the project that writes the title, the description and
         the canonical link. A page supplies them through its load's `meta`. -->
    <svelte:head>
    	<title>{title}</title>
    	<meta name="description" content={description} />
    	<link rel="canonical" href={canonical} />
    	<meta property="og:title" content={title} />
    	<meta property="og:description" content={description} />
    	<meta property="og:url" content={canonical} />
    	<link rel="icon" href={favicon} />
    </svelte:head>

    <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
    <main id="main" class="mx-auto max-w-xl p-6">
    	{@render children()}
    </main>
    ```

    Verify: `grep -q "svelte:head" src/routes/+layout.svelte`

13. The page: a plain form post that works with JavaScript off, progressively enhanced. Replace `src/routes/+page.svelte` with:

    ```svelte
    <script lang="ts">
    	import { enhance } from '$app/forms';
    	import type { PageProps } from './$types';

    	let { data, form }: PageProps = $props();
    </script>

    <h1 class="text-2xl font-semibold">Join the list</h1>

    {#if form?.success}
    	<p role="status" class="mt-6">Thanks. {form.email} is on the list.</p>
    {:else}
    	<!-- A plain form post: it works with JavaScript off, and use:enhance only
    	     saves the full page load when JavaScript is on. -->
    	<form method="POST" use:enhance class="mt-6 space-y-4">
    		<div>
    			<label for="email" class="block font-medium">Email</label>
    			<input
    				id="email"
    				name="email"
    				type="email"
    				autocomplete="email"
    				required
    				value={form?.email ?? ''}
    				aria-invalid={form?.errors?.email ? 'true' : undefined}
    				aria-describedby={form?.errors?.email ? 'email-error' : undefined}
    				class="mt-1 w-full rounded border px-3 py-2"
    			/>
    			{#if form?.errors?.email}
    				<p id="email-error" class="mt-1 text-red-700">{form.errors.email}</p>
    			{/if}
    		</div>

    		<fieldset aria-describedby={form?.errors?.topic ? 'topic-error' : undefined}>
    			<legend class="font-medium">Topic</legend>
    			{#each data.topics as topic (topic.id)}
    				<label class="mt-1 flex items-center gap-2">
    					<input type="radio" name="topic" value={topic.id} required />
    					{topic.label}
    				</label>
    			{/each}
    			{#if form?.errors?.topic}
    				<p id="topic-error" class="mt-1 text-red-700">{form.errors.topic}</p>
    			{/if}
    		</fieldset>

    		<button type="submit" class="rounded bg-black px-4 py-2 text-white">Sign up</button>
    	</form>
    {/if}
    ```

    Verify: `grep -q "use:enhance" src/routes/+page.svelte`

14. A liveness endpoint for whatever runs the server. Create `src/routes/health/+server.ts` with:

    ```typescript
    import { json } from '@sveltejs/kit';
    import type { RequestHandler } from './$types';

    // Liveness only: it says the process answers. Add a readiness check beside it
    // when there is a database, rather than making this one depend on it.
    export const GET: RequestHandler = () => json({ status: 'ok' });
    ```

    Verify: `test -f src/routes/health/+server.ts`

15. Tests that start the production build and read what it sends. Create `tests/built-server.test.mjs` with:

    ```javascript
    import assert from 'node:assert/strict';
    import { spawn } from 'node:child_process';
    import { once } from 'node:events';
    import { createServer } from 'node:net';
    import { after, before, describe, it } from 'node:test';

    // These tests start the production build with `node build`, the command a
    // deployment runs, and read what it sends. A template can be right and the
    // output wrong; the output is what a crawler and a browser get.
    // Run `npm run build` first.

    /** Ask the operating system for a free port on the loopback interface. */
    async function freePort() {
      const probe = createServer();
      probe.listen(0, '127.0.0.1');
      await once(probe, 'listening');
      const address = probe.address();
      probe.close();
      assert.ok(address !== null && typeof address === 'object');
      return address.port;
    }

    /** @param {Record<string, string>} settings */
    function start(settings) {
      /** @type {Record<string, string | undefined>} */
      const env = { ...process.env, HOST: '127.0.0.1', ...settings };
      if (!('ORIGIN' in settings)) delete env.ORIGIN;
      return spawn(process.execPath, ['build'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    }

    /**
     * Post the form the way a browser with JavaScript off does.
     * @param {string} url
     * @param {Record<string, string>} fields
     * @param {string} from the Origin header the browser would send
     */
    function post(url, fields, from) {
      return fetch(url, {
        method: 'POST',
        headers: {
          accept: 'text/html',
          origin: from,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(fields),
      });
    }

    describe('the built server', () => {
      /** @type {import('node:child_process').ChildProcess | undefined} */
      let server;
      let origin = '';

      before(async () => {
        const port = await freePort();
        origin = `http://127.0.0.1:${port}`;
        server = start({ PORT: String(port), ORIGIN: origin });
        for (let attempt = 0; attempt < 100; attempt += 1) {
          try {
            if ((await fetch(`${origin}/health`)).ok) return;
          } catch {
            // Not listening yet.
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error('the server did not answer /health within ten seconds');
      });

      after(() => {
        server?.kill();
      });

      it('writes one title, a description and an absolute canonical link into the HTML', async () => {
        const response = await fetch(`${origin}/?utm_source=newsletter`);
        assert.equal(response.status, 200);
        const html = await response.text();
        assert.equal(html.match(/<title>/g)?.length, 1);
        assert.match(html, /<title>Join the list<\/title>/);
        assert.match(html, /<meta name="description" content="[^"]{50,}"/);
        // From ORIGIN, and without the query string.
        assert.match(html, new RegExp(`<link rel="canonical" href="${origin}/"`));
        assert.match(html, /<meta property="og:url" content="[^"]+"/);
        assert.match(html, /<html lang="en"/);
      });

      it('sends a content security policy with a nonce, and nosniff', async () => {
        const response = await fetch(`${origin}/`);
        const policy = response.headers.get('content-security-policy') ?? '';
        assert.match(policy, /script-src 'self' 'nonce-[^']+'/);
        assert.match(policy, /frame-ancestors 'none'/);
        assert.match(policy, /object-src 'none'/);
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      });

      it('refuses an invalid signup on the server and says why in the page', async () => {
        const response = await post(
          `${origin}/`,
          { email: 'not-an-address', topic: 'releases' },
          origin,
        );
        assert.equal(response.status, 400);
        assert.match(await response.text(), /Enter a valid email address\./);
      });

      it('refuses a topic the page never offered', async () => {
        const response = await post(
          `${origin}/`,
          { email: 'someone@example.com', topic: 'admin' },
          origin,
        );
        assert.equal(response.status, 400);
        assert.match(await response.text(), /Choose one of the listed topics\./);
      });

      it('accepts a valid signup', async () => {
        const response = await post(
          `${origin}/`,
          { email: 'someone@example.com', topic: 'releases' },
          origin,
        );
        assert.equal(response.status, 200);
        assert.match(await response.text(), /someone@example\.com is on the list/);
      });

      it('refuses a form post from another origin', async () => {
        const response = await post(
          `${origin}/`,
          { email: 'someone@example.com', topic: 'releases' },
          'https://example.com',
        );
        assert.equal(response.status, 403);
      });

      it('answers an unknown path with 404', async () => {
        const response = await fetch(`${origin}/no-such-page`);
        assert.equal(response.status, 404);
      });
    });

    describe('the built server without ORIGIN', () => {
      it('refuses to start rather than trust the Host header', { timeout: 15_000 }, async () => {
        const child = start({ PORT: String(await freePort()) });
        let output = '';
        child.stderr?.on('data', (chunk) => (output += chunk));
        child.stdout?.on('data', (chunk) => (output += chunk));
        const [code] = await once(child, 'exit');
        assert.notEqual(code, 0, output);
        assert.match(output, /ORIGIN is not set/);
      });
    });
    ```

    Verify: `test -f tests/built-server.test.mjs`

16. Remove the generator's example unit test, which the tests above replace: `rm -r src/lib/vitest-examples`
    Verify: `test ! -e src/lib/vitest-examples`

17. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      build:
        runs-on: ubuntu-latest
        timeout-minutes: 15
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          # Exactly what package-lock.json names; fails if it disagrees with package.json.
          - run: npm ci --no-audit --no-fund
          - run: npm audit --audit-level=high
          - run: npm run check
          - run: npm run lint
          - run: npm test
          - run: npm run build
          # Starts `node build` and reads what it sends: the head, the policy, the form.
          - run: npm run test:built
    ```

    Verify: `test -f .github/workflows/ci.yml`

18. Replace `README.md` with:

    ```markdown
    # App

    A server-rendered SvelteKit application: Svelte 5 runes, strict TypeScript,
    Tailwind, adapter-node, and a form action validated on the server.

    ## Commands

    - `npm run dev` starts the development server.
    - `npm run check` type-checks, and fails on a compiler warning.
    - `npm run lint` checks formatting and runs ESLint; `npm run format` fixes formatting.
    - `npm test` runs the unit tests.
    - `npm run build` builds the server into `build/`; `npm run test:built` starts it and reads what it sends.

    ## Running the build

    `node build` needs `ORIGIN`, the public origin the site is served from, and
    refuses to start without it. `PORT` and `HOST` choose where it listens:

        ORIGIN=https://example.com PORT=3000 node build

    See `AGENTS.md` before adding a page or a form.
    ```

    Verify: `grep -q "ORIGIN" README.md`

19. Apply the project's own formatting to every file this recipe wrote. Prettier with the Svelte and Tailwind plugins is the house style, and the lint step below refuses anything else: `npm run format`
    Verify: `npx prettier --check .`

20. Type-check the application, the tests and the Svelte components, failing on any compiler warning: `npm run check`
    Verify: `npm run check`

21. Lint: formatting, then ESLint with the TypeScript and Svelte rules: `npm run lint`
    Verify: `npm run lint`

22. Run the unit tests: the validation, the `load` and the form action, called directly: `npm test`
    Verify: `npm test`

23. Build the production server: `npm run build`
    Verify: `test -f build/index.js && test -f build/handler.js`

24. Start the built server on a port the operating system chooses and read what it sends: the title, description and canonical link in the HTML, the Content Security Policy, the form action refusing bad input and a cross-origin post, and the server refusing to start with no `ORIGIN`: `npm run test:built`
    Verify: `npm run test:built`

## After setup

- Set `ORIGIN` wherever the server runs. It is the only required setting.
- Decide where a signup goes. The action acknowledges and drops it until then;
  the comment in `src/routes/+page.server.ts` marks the place.
- Commit `package-lock.json`. CI installs from it with `npm ci`.
