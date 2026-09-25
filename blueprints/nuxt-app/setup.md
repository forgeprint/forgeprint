# Setup

Creates a server-rendered Nuxt 4 application with Tailwind, one API route
under `server/api` that validates its input with a schema shared with the
form that calls it, pages whose SEO tags are asserted in the HTML the built
server sends, and unit, component and end-to-end tests on Vitest.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.19 or newer, which is the floor Nuxt 4.5 declares
(`^22.19.0 || ^24.11.0 || >=26.0.0`), and `curl` for the checks against the
running server.

The project is written file by file rather than created with `nuxi init` or
`npm create nuxt`: both download their template from GitHub rather than from
the npm registry, and both ask questions. Everything below comes from the
registry, pinned.

Nuxt telemetry is off. `nuxt.config.ts` sets `telemetry: false` in step 2,
before any Nuxt command runs, which stops Nuxt from loading its telemetry
module at all; the CI workflow also sets `NUXT_TELEMETRY_DISABLED=1`.

1. `vitest` is pinned a second time under `overrides`, and npm refuses to install if the two ever differ. Vite's optional `@vitejs/devtools` peer leads to one that accepts any `vitest`; npm resolves that to the newest release instead of the pinned one, and npm 10 and 11 crash on the mismatch while building the tree ("Cannot read properties of null (reading 'edgesOut')"). None of those optional peers is installed. Create `package.json` with:

   ```json
   {
     "name": "app",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "engines": {
       "node": "^22.19.0 || ^24.11.0 || >=26.0.0"
     },
     "scripts": {
       "build": "nuxt build",
       "dev": "nuxt dev",
       "postinstall": "nuxt prepare",
       "typecheck": "nuxt typecheck",
       "lint": "eslint . --max-warnings 0",
       "test": "vitest run"
     },
     "overrides": {
       "vitest": "5.0.1"
     },
     "dependencies": {
       "@tailwindcss/vite": "4.3.3",
       "h3": "1.15.11",
       "nuxt": "4.5.2",
       "tailwindcss": "4.3.3",
       "vue": "3.5.43",
       "vue-router": "5.3.1",
       "zod": "4.6.5"
     },
     "devDependencies": {
       "@nuxt/eslint": "1.17.0",
       "@nuxt/test-utils": "4.3.2",
       "@vue/test-utils": "2.5.1",
       "eslint": "10.11.0",
       "happy-dom": "20.14.5",
       "typescript": "6.0.3",
       "vitest": "5.0.1",
       "vue-tsc": "3.3.11"
     }
   }
   ```

   Verify: `test -f package.json`

2. Create `nuxt.config.ts` with:

   ```typescript
   import tailwindcss from '@tailwindcss/vite';

   export default defineNuxtConfig({
     compatibilityDate: '2026-09-25',
     modules: ['@nuxt/eslint'],
     // Off here rather than by an environment variable somebody has to
     // remember: with `false`, Nuxt never loads its telemetry module.
     telemetry: false,
     devtools: { enabled: false },
     css: ['~/assets/css/main.css'],
     app: {
       head: {
         htmlAttrs: { lang: 'en' },
       },
     },
     runtimeConfig: {
       public: {
         // Every canonical URL is built from this. Set NUXT_PUBLIC_SITE_URL to
         // the real origin in production; example.com is reserved and owned
         // by nobody, which is why it is the placeholder.
         siteUrl: 'https://example.com',
       },
     },
     typescript: {
       strict: true,
       // Nuxt's generated tsconfigs cover app/, server/ and shared/. These
       // lines add the tests that run outside Nuxt, so `nuxt typecheck`
       // checks every TypeScript file in the project.
       nodeTsConfig: {
         include: ['../vitest.config.ts', '../test/unit/**/*', '../test/e2e/**/*'],
       },
     },
     vite: {
       plugins: [tailwindcss()],
     },
   });
   ```

   Verify: `grep -q "telemetry: false" nuxt.config.ts`

3. Create `tsconfig.json` with:

   ```json
   {
     "files": [],
     "references": [
       { "path": "./.nuxt/tsconfig.app.json" },
       { "path": "./.nuxt/tsconfig.server.json" },
       { "path": "./.nuxt/tsconfig.shared.json" },
       { "path": "./.nuxt/tsconfig.node.json" }
     ]
   }
   ```

   Verify: `test -f tsconfig.json`

4. Create `eslint.config.mjs` with:

   ```javascript
   // @ts-check
   // The rules come from @nuxt/eslint, generated into .nuxt/ by `nuxt prepare`
   // so they match the project's own auto-imports and directories.
   import withNuxt from './.nuxt/eslint.config.mjs';

   export default withNuxt({
     rules: {
       // Prettier writes void elements as `<input />`, and the Vue preset
       // warns about that by default. Agree with the formatter, or the two
       // tools fight over every form.
       'vue/html-self-closing': ['warn', { html: { void: 'always' } }],
     },
   });
   ```

   Verify: `test -f eslint.config.mjs`

5. Create `vitest.config.ts` with:

   ```typescript
   import { defineVitestProject } from '@nuxt/test-utils/config';
   import { defineConfig } from 'vitest/config';

   // Three projects, because the three kinds of test need three different
   // worlds. unit: plain Node, fast, no Nuxt at all. nuxt: a component mounted
   // inside a Nuxt runtime in happy-dom, with auto-imports working. e2e: the
   // application built for production and started as a real server.
   export default defineConfig({
     test: {
       projects: [
         {
           test: {
             name: 'unit',
             include: ['test/unit/**/*.test.ts'],
             environment: 'node',
           },
         },
         await defineVitestProject({
           test: {
             name: 'nuxt',
             include: ['test/nuxt/**/*.test.ts'],
             environment: 'nuxt',
             environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } },
           },
         }),
         {
           test: {
             name: 'e2e',
             include: ['test/e2e/**/*.test.ts'],
             environment: 'node',
             // The suite builds the application before its first test.
             hookTimeout: 300_000,
           },
         },
       ],
     },
   });
   ```

   Verify: `test -f vitest.config.ts`

6. Create `shared/greeting.ts` with:

   ```typescript
   import { z } from 'zod';

   // One schema, imported by the server route that enforces it and by the
   // form that mirrors it. The server's copy is the one that counts: the
   // browser's check is a convenience for the person typing, and a request
   // does not have to come from the browser at all.
   export const greetingRequest = z.object({
     name: z.string().trim().min(1).max(80),
   });

   export type GreetingRequest = z.infer<typeof greetingRequest>;

   export interface GreetingResponse {
     greeting: string;
   }
   ```

   Verify: `test -f shared/greeting.ts`

7. Create `shared/canonical.ts` with:

   ```typescript
   // The canonical URL is the configured site plus the route's path, and
   // nothing from the request. The path is assigned to `pathname` rather than
   // resolved against the site: `new URL('//attacker.example/x', site)`
   // resolves to a different host, and a catch-all page will one day hand
   // this function exactly that path.
   export function canonicalUrl(siteUrl: string, path: string): string {
     const url = new URL(siteUrl);
     url.pathname = path;
     url.search = '';
     url.hash = '';
     return url.href;
   }
   ```

   Verify: `test -f shared/canonical.ts`

8. Create `server/api/greeting.post.ts` with:

   ```typescript
   import { greetingRequest, type GreetingResponse } from '#shared/greeting';

   // Checked before the body is read. h3 reads a body into memory whole, so
   // the only moment a size limit costs nothing is before reading starts.
   // Node's HTTP parser holds a request to the length it declares, which is
   // why checking the header is enough — and why a request that declares no
   // length is refused.
   const MAX_BODY_BYTES = 1024;

   export default defineEventHandler(async (event): Promise<GreetingResponse> => {
     const declared = Number(getRequestHeader(event, 'content-length'));
     if (!Number.isInteger(declared)) {
       throw createError({ statusCode: 411, statusMessage: 'Length Required' });
     }
     if (declared > MAX_BODY_BYTES) {
       throw createError({ statusCode: 413, statusMessage: 'Payload Too Large' });
     }

     // A body that does not match the schema never reaches the line below:
     // h3 turns the thrown error into a 400 before this handler sees any of it.
     const { name } = await readValidatedBody(event, (body) => greetingRequest.parse(body));

     return { greeting: `Hello, ${name}.` };
   });
   ```

   Verify: `test -f server/api/greeting.post.ts`

9. Create `app/assets/css/main.css` with:

   ```css
   @import 'tailwindcss';
   ```

   Verify: `test -f app/assets/css/main.css`

10. Create `app/app.vue` with:

    ```vue
    <template>
      <NuxtPage />
    </template>
    ```

    Verify: `test -f app/app.vue`

11. Create `app/composables/usePageSeo.ts` with:

    ```typescript
    import { canonicalUrl } from '#shared/canonical';

    interface PageSeo {
      title: string;
      description: string;
    }

    // The only place in the project that writes SEO tags. Every page calls it
    // with both fields, so a page without a description fails the type check
    // instead of shipping an empty meta tag.
    export function usePageSeo({ title, description }: PageSeo): void {
      // From configuration, never from the request's Host header: a canonical
      // URL built from the request lets whoever sends the request choose it.
      const { siteUrl } = useRuntimeConfig().public;
      const canonical = canonicalUrl(siteUrl, useRoute().path);

      useSeoMeta({
        title,
        description,
        ogTitle: title,
        ogDescription: description,
        ogUrl: canonical,
      });
      useHead({ link: [{ rel: 'canonical', href: canonical }] });
    }
    ```

    Verify: `test -f app/composables/usePageSeo.ts`

12. Create `app/components/GreetingForm.vue` with:

    ```vue
    <script setup lang="ts">
    import { greetingRequest, type GreetingResponse } from '#shared/greeting';

    const name = ref('');
    const greeting = ref<string | null>(null);
    const problem = ref<string | null>(null);

    async function submit(): Promise<void> {
      greeting.value = null;
      problem.value = null;

      const parsed = greetingRequest.safeParse({ name: name.value });
      if (!parsed.success) {
        problem.value = 'Enter a name between 1 and 80 characters.';
        return;
      }

      try {
        const response = await $fetch<GreetingResponse>('/api/greeting', {
          method: 'POST',
          body: parsed.data,
        });
        greeting.value = response.greeting;
      } catch {
        // The server's message is for the log, not for the page.
        problem.value = 'Something went wrong. Try again.';
      }
    }
    </script>

    <template>
      <form class="mt-6 flex flex-col gap-3" @submit.prevent="submit">
        <label for="name" class="font-medium">Your name</label>
        <input
          id="name"
          v-model="name"
          name="name"
          class="rounded border px-3 py-2"
          maxlength="80"
        />
        <button type="submit" class="self-start rounded bg-black px-4 py-2 text-white">
          Greet me
        </button>
        <p v-if="greeting" role="status">{{ greeting }}</p>
        <p v-if="problem" role="alert">{{ problem }}</p>
      </form>
    </template>
    ```

    Verify: `test -f app/components/GreetingForm.vue`

13. Create `app/pages/index.vue` with:

    ```vue
    <script setup lang="ts">
    usePageSeo({
      title: 'Nuxt app',
      description: 'A server-rendered Nuxt application with its SEO tags and its API tested.',
    });
    </script>

    <template>
      <main class="mx-auto max-w-2xl p-8">
        <h1 class="text-2xl font-semibold">Nuxt app</h1>
        <GreetingForm />
      </main>
    </template>
    ```

    Verify: `test -f app/pages/index.vue`

14. Create `test/unit/greeting.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import { greetingRequest } from '../../shared/greeting';

    describe('greetingRequest', () => {
      it('accepts a name and trims it', () => {
        expect(greetingRequest.parse({ name: '  Ada  ' })).toEqual({ name: 'Ada' });
      });

      it('refuses a name that is only whitespace', () => {
        expect(greetingRequest.safeParse({ name: '   ' }).success).toBe(false);
      });

      it('refuses a name longer than 80 characters', () => {
        expect(greetingRequest.safeParse({ name: 'a'.repeat(81) }).success).toBe(false);
      });

      it('refuses a body that is not an object with a name', () => {
        expect(greetingRequest.safeParse('Ada').success).toBe(false);
        expect(greetingRequest.safeParse({ nom: 'Ada' }).success).toBe(false);
      });
    });
    ```

    Verify: `test -f test/unit/greeting.test.ts`

15. Create `test/unit/canonical.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import { canonicalUrl } from '../../shared/canonical';

    describe('canonicalUrl', () => {
      it('joins the configured site and the path', () => {
        expect(canonicalUrl('https://example.com', '/posts/first')).toBe(
          'https://example.com/posts/first',
        );
      });

      it('keeps the configured host when the path starts with two slashes', () => {
        // Resolving this path against the site would produce another host.
        expect(canonicalUrl('https://example.com', '//attacker.invalid/x')).toBe(
          'https://example.com//attacker.invalid/x',
        );
      });

      it('does not care whether the site ends in a slash', () => {
        expect(canonicalUrl('https://example.com/', '/about')).toBe('https://example.com/about');
      });
    });
    ```

    Verify: `test -f test/unit/canonical.test.ts`

16. Create `test/nuxt/GreetingForm.test.ts` with:

    ```typescript
    import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
    import { flushPromises } from '@vue/test-utils';
    import { describe, expect, it } from 'vitest';

    import GreetingForm from '~/components/GreetingForm.vue';

    // The endpoint is replaced here, so this proves the component — what it
    // sends and what it shows — and not the route. The route is proved by the
    // e2e suite against a real server.
    registerEndpoint('/api/greeting', {
      method: 'POST',
      handler: () => ({ greeting: 'Hello, Ada.' }),
    });

    describe('GreetingForm', () => {
      it('shows the greeting the server returns', async () => {
        const form = await mountSuspended(GreetingForm);

        await form.get('input[name="name"]').setValue('Ada');
        await form.get('form').trigger('submit');
        await flushPromises();

        expect(form.get('[role="status"]').text()).toBe('Hello, Ada.');
      });

      it('does not call the server for an empty name', async () => {
        const form = await mountSuspended(GreetingForm);

        await form.get('input[name="name"]').setValue('   ');
        await form.get('form').trigger('submit');
        await flushPromises();

        expect(form.get('[role="alert"]').text()).toContain('between 1 and 80');
        expect(form.find('[role="status"]').exists()).toBe(false);
      });
    });
    ```

    Verify: `test -f test/nuxt/GreetingForm.test.ts`

17. Create `test/e2e/app.test.ts` with:

    ```typescript
    import { request } from 'node:http';

    import { $fetch, fetch, setup, url } from '@nuxt/test-utils/e2e';
    import { describe, expect, it } from 'vitest';

    // Builds the application for production, starts the built server on a
    // free port, and asks it over HTTP. No browser: everything asserted here
    // is in the HTML the server sends, which is also what a crawler reads.
    await setup({ server: true, browser: false });

    function getWithHost(path: string, host: string): Promise<string> {
      const target = new URL(url(path));
      return new Promise((resolve, reject) => {
        const outgoing = request(
          {
            hostname: target.hostname,
            port: target.port,
            path: target.pathname,
            headers: { host },
          },
          (incoming) => {
            let body = '';
            incoming.setEncoding('utf8');
            incoming.on('data', (chunk: string) => (body += chunk));
            incoming.on('end', () => resolve(body));
          },
        );
        outgoing.on('error', reject);
        outgoing.end();
      });
    }

    describe('the rendered page', () => {
      it('carries one title, and it is not a placeholder', async () => {
        const html = await $fetch<string>('/');
        const titles = html.match(/<title>(.*?)<\/title>/g) ?? [];
        expect(titles).toHaveLength(1);
        expect(titles[0]).toBe('<title>Nuxt app</title>');
      });

      it('carries a description long enough to be one', async () => {
        const html = await $fetch<string>('/');
        expect(html).toMatch(/<meta name="description" content="[^"]{20,}"/);
      });

      it('carries an absolute canonical URL built from configuration', async () => {
        const html = await $fetch<string>('/');
        expect(html).toMatch(/<link rel="canonical" href="https:\/\/example\.com\/"/);
      });

      it('does not let the Host header choose the canonical URL', async () => {
        // node:http rather than fetch, because fetch replaces a Host header
        // with the real one and this test would then pass without testing
        // anything.
        const html = await getWithHost('/', 'attacker.invalid');
        expect(html).toContain('<link rel="canonical" href="https://example.com/"');
        expect(html).not.toContain('attacker.invalid');
      });

      it('renders the content on the server, not only in the browser', async () => {
        const html = await $fetch<string>('/');
        expect(html).toMatch(/<h1[^>]*>Nuxt app<\/h1>/);
      });
    });

    describe('POST /api/greeting', () => {
      const post = (body: string, headers: Record<string, string> = {}) =>
        fetch('/api/greeting', {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers },
          body,
        });

      it('greets a valid name, trimmed', async () => {
        const response = await post(JSON.stringify({ name: '  Ada  ' }));
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ greeting: 'Hello, Ada.' });
      });

      it('refuses an empty name with 400', async () => {
        const response = await post(JSON.stringify({ name: '' }));
        expect(response.status).toBe(400);
      });

      it('refuses a body that is not JSON with 400', async () => {
        const response = await post('name=Ada');
        expect(response.status).toBe(400);
      });

      it('refuses a body over the limit with 413, before reading it', async () => {
        const response = await post(JSON.stringify({ name: 'a'.repeat(2048) }));
        expect(response.status).toBe(413);
      });

      it('does not answer GET', async () => {
        // `.post.ts` in the file name is the whole method check. A GET falls
        // through to Nuxt's renderer, which answers 404 rather than 405.
        const response = await fetch('/api/greeting');
        expect(response.status).toBe(404);
      });
    });
    ```

    Verify: `test -f test/e2e/app.test.ts`

18. Create `.gitignore` with:

    ```text
    node_modules/
    .nuxt/
    .output/
    .data/
    .env*
    *.log
    server.pid
    server.port
    ```

    Verify: `test -f .gitignore`

19. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    env:
      NUXT_TELEMETRY_DISABLED: 1

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          # `postinstall` runs `nuxt prepare`, which writes the .nuxt/ types
          # and ESLint config the next three steps read.
          - run: npm install --no-audit --no-fund
          - run: npm run lint
          - run: npm run typecheck
          - run: npm test
          - run: npm run build
    ```

    Verify: `test -f .github/workflows/ci.yml`

20. Create `README.md` with:

    ```markdown
    # app

    A server-rendered Nuxt application with one validated API route and its
    SEO tags tested against the built server.

    ## Run it

    `npm install`, then `npm run dev`. `npm test` runs the unit, component and
    end-to-end suites; the end-to-end suite builds the application first.

    ## Before the first deploy

    Set `NUXT_PUBLIC_SITE_URL` to the real origin. Every canonical URL comes
    from it, and the default is `https://example.com`, which nobody owns.

    Build with `npm run build` and run `node .output/server/index.mjs`.
    `NITRO_HOST` and `NITRO_PORT` choose where it listens.

    ## Change it

    See `AGENTS.md`.
    ```

    Verify: `test -f README.md`

21. Install the pinned dependencies. The `postinstall` script runs `nuxt prepare`, which generates the `.nuxt/` types and ESLint configuration the later steps read: `npm install --no-audit --no-fund`
    Verify: `test -f .nuxt/tsconfig.app.json`

22. Lint with the rules `@nuxt/eslint` generated for this project: `npm run lint`
    Verify: `npm run lint`

23. Type-check the app, the server, the shared code and the tests: `npm run typecheck`
    Verify: `npm run typecheck`

24. Run the unit, component and end-to-end suites. The end-to-end suite builds the application and asks the built server for the page and the API: `npm test`
    Verify: `npm test`

25. Build the application for production: `npm run build`
    Verify: `test -f .output/server/index.mjs`

26. Ask the operating system for a free port and keep it. The built server does not accept port 0 — it treats it as unset and falls back to 3000, which may already be taken, and then the checks below could be answered by somebody else's server: `node -e "const s = require('node:net').createServer(); s.listen(0, '127.0.0.1', () => { console.log(s.address().port); s.close(); })" > server.port`
    Verify: `grep -qE '^[0-9]+$' server.port`

27. Start the built server on that port, on loopback only, in the background, and keep its process id: `NITRO_HOST=127.0.0.1 NITRO_PORT="$(cat server.port)" node .output/server/index.mjs > server.log 2>&1 & echo $! > server.pid`
    Verify: `test -s server.pid`

28. Wait for it to say it is listening: `for attempt in $(seq 60); do grep -q "Listening on" server.log && break; sleep 1; done`
    Verify: `grep -q "Listening on http://127.0.0.1:$(cat server.port)" server.log`

29. Ask for the home page with a forged `Host` header, and keep the HTML: `curl -fsS -H "Host: attacker.invalid" -o page.html "http://127.0.0.1:$(cat server.port)/"`
    Verify: `grep -q '<link rel="canonical" href="https://example.com/"' page.html`

30. Confirm the title was rendered on the server rather than in the browser: `grep -q "<title>Nuxt app</title>" page.html`
    Verify: `grep -qE '<meta name="description" content="[^"]{20,}"' page.html`

31. Send the API a valid name with surrounding spaces, and keep the answer: `curl -fsS -X POST -H "Content-Type: application/json" -d '{"name":"  Ada  "}' -o greeting.json "http://127.0.0.1:$(cat server.port)/api/greeting"`
    Verify: `grep -q '"greeting":"Hello, Ada."' greeting.json`

32. Send the API an empty name and keep the status code: `curl -sS -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"name":""}' "http://127.0.0.1:$(cat server.port)/api/greeting" > invalid.code`
    Verify: `grep -qx 400 invalid.code`

33. Stop the server: `kill "$(cat server.pid)"`
    Verify: `sleep 2; ! kill -0 "$(cat server.pid)" 2>/dev/null`
