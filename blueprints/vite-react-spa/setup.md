# Setup

Creates a client-only single-page application: React with client-side routing
through React Router, built by Vite, styled with Tailwind, strict TypeScript,
a typed API client that is the only code allowed to touch the network, Vitest
with Testing Library and axe-core, ESLint, and a CI workflow. There is no
server and no database in it; the build output is static files.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.22.2 or newer, the floor that jsdom 30 and React Router 8
declare, and npm.

1. `vitest` is pinned a second time under `overrides`, and npm refuses to install if the two ever differ. Vite's optional `@vitejs/devtools` peer leads to one that accepts any `vitest`; npm resolves that to the newest release instead of the pinned one, and npm 10 and 11 crash on the mismatch while building the tree ("Cannot read properties of null (reading 'edgesOut')"). None of those optional peers is installed. Create `package.json` with:

   ```json
   {
     "name": "app",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "engines": {
       "node": ">=22.22.2"
     },
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "typecheck": "tsc",
       "lint": "eslint .",
       "test": "vitest run"
     },
     "overrides": {
       "vitest": "5.0.1"
     },
     "dependencies": {
       "react": "19.3.0",
       "react-dom": "19.3.0",
       "react-router": "8.4.0"
     },
     "devDependencies": {
       "@eslint/js": "10.0.1",
       "@tailwindcss/vite": "4.3.3",
       "@testing-library/dom": "10.4.2",
       "@testing-library/jest-dom": "7.0.1",
       "@testing-library/react": "16.3.3",
       "@testing-library/user-event": "14.6.7",
       "@types/react": "19.3.0",
       "@types/react-dom": "19.3.0",
       "@vitejs/plugin-react": "6.1.1",
       "axe-core": "4.13.0",
       "eslint": "10.11.0",
       "eslint-plugin-react-hooks": "7.1.1",
       "globals": "17.12.0",
       "jsdom": "30.1.1",
       "tailwindcss": "4.3.3",
       "typescript": "6.0.3",
       "typescript-eslint": "8.70.1",
       "vite": "8.3.1",
       "vitest": "5.0.1"
     }
   }
   ```

   Verify: `test -f package.json`

2. Install the pinned dependencies. This writes `package-lock.json`, which is committed and is what CI installs from: `npm install --no-audit --no-fund`
   Verify: `npm ls react react-dom react-router vite vitest --depth=0`

3. Create `tsconfig.json` with:

   ```json
   {
     "compilerOptions": {
       "target": "es2023",
       "lib": ["dom", "dom.iterable", "es2023"],
       "module": "esnext",
       "moduleResolution": "bundler",
       "verbatimModuleSyntax": true,
       "allowImportingTsExtensions": true,
       "noEmit": true,
       "strict": true,
       "exactOptionalPropertyTypes": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "jsx": "react-jsx",
       "skipLibCheck": true,
       "types": ["vite/client"]
     },
     "include": ["src", "vite.config.ts"]
   }
   ```

   Verify: `test -f tsconfig.json`

4. Create `index.html` with:

   ```html
   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title>App</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```

   Verify: `test -f index.html`

5. Create `src/index.css` with:

   ```css
   @import 'tailwindcss';
   ```

   Verify: `test -f src/index.css`

6. Create `src/config.ts` with:

   ```typescript
   /**
    * The one place configuration is checked.
    *
    * Vite exposes variables prefixed `VITE_` to the browser by compiling them
    * into the bundle as plain text. Nothing here is secret: an API key in a
    * `VITE_` variable is published to every visitor. The only setting this app
    * has is where its API lives.
    */
   export interface Config {
     readonly apiBaseUrl: URL;
   }

   /** Hosts where plain `http` is acceptable: the developer's own machine. */
   const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

   export class ConfigError extends Error {
     override readonly name = 'ConfigError';
   }

   export function readConfig(env: Readonly<Record<string, unknown>>): Config {
     const raw = env['VITE_API_BASE_URL'];
     if (typeof raw !== 'string' || raw.trim() === '') {
       throw new ConfigError('VITE_API_BASE_URL is required, for example https://example.com/api');
     }

     let url: URL;
     try {
       url = new URL(raw);
     } catch {
       throw new ConfigError(`VITE_API_BASE_URL is not an absolute URL: ${raw}`);
     }

     // A page served over https cannot call an http API (mixed content), and an
     // http API anywhere but the developer's machine sends every response in
     // the clear.
     const loopbackHttp = url.protocol === 'http:' && LOOPBACK.has(url.hostname);
     if (url.protocol !== 'https:' && !loopbackHttp) {
       throw new ConfigError(`VITE_API_BASE_URL must use https outside localhost: ${raw}`);
     }

     // A trailing slash makes `new URL('notes', base)` append to the path rather
     // than replace its last segment, so a base ending in /api and one ending
     // in /api/ mean the same thing.
     if (!url.pathname.endsWith('/')) url.pathname += '/';
     return { apiBaseUrl: url };
   }
   ```

   Verify: `test -f src/config.ts`

7. Create `src/api/client.ts` with:

   ```typescript
   /**
    * The only module that talks to the network.
    *
    * What arrives from the API is `unknown` until a guard in this file has
    * checked it. A type annotation on `response.json()` is a claim, not a check:
    * the server can change shape without the compiler ever finding out.
    */
   export interface Note {
     readonly id: number;
     readonly body: string;
   }

   export interface ApiClient {
     listNotes(signal?: AbortSignal): Promise<Note[]>;
   }

   export class ApiError extends Error {
     override readonly name = 'ApiError';
     readonly status: number | null;

     constructor(message: string, status: number | null) {
       super(message);
       this.status = status;
     }
   }

   function isNote(value: unknown): value is Note {
     if (typeof value !== 'object' || value === null) return false;
     const candidate = value as Record<string, unknown>;
     return typeof candidate['id'] === 'number' && typeof candidate['body'] === 'string';
   }

   /**
    * Resolves a path against the API base and refuses anything that lands
    * elsewhere. A path that starts with a scheme or `//` — easy to produce by
    * interpolating a value from the URL bar — would otherwise leave the
    * configured API with whatever the request carries.
    */
   export function resolveApiUrl(baseUrl: URL, path: string): URL {
     const url = new URL(path, baseUrl);
     if (url.origin !== baseUrl.origin) {
       throw new ApiError(`refusing to leave the API origin: ${path}`, null);
     }
     return url;
   }

   export function createApiClient(
     baseUrl: URL,
     fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
   ): ApiClient {
     async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
       const url = resolveApiUrl(baseUrl, path);
       const response = await fetchImpl(url, {
         headers: { accept: 'application/json' },
         // No cookies to another origin. If the API needs credentials, that is a
         // decision made here, on purpose, with the API's CORS set to match.
         credentials: 'same-origin',
         ...(signal === undefined ? {} : { signal }),
       });
       if (!response.ok) {
         throw new ApiError(
           `GET ${url.pathname} failed with ${String(response.status)}`,
           response.status,
         );
       }
       return response.json();
     }

     return {
       async listNotes(signal) {
         const body = await getJson('notes', signal);
         if (!Array.isArray(body) || !body.every(isNote)) {
           throw new ApiError('GET notes returned something that is not a list of notes', null);
         }
         return body;
       },
     };
   }
   ```

   Verify: `test -f src/api/client.ts`

8. Create `src/pages/notes.tsx` with:

   ```tsx
   import { useLoaderData } from 'react-router';

   import type { Note } from '../api/client';

   export function NotesPage() {
     // Checked by the API client's guard before it got here, so the type is
     // earned rather than asserted.
     const notes = useLoaderData<Note[]>();

     return (
       <>
         {/* React hoists <title> into <head>, so every route names itself. */}
         <title>Notes · App</title>
         <h1 className="text-2xl font-semibold">Notes</h1>
         {notes.length === 0 ? (
           <p className="mt-4">No notes yet.</p>
         ) : (
           <ul className="mt-4 space-y-2">
             {notes.map((note) => (
               <li key={note.id} className="rounded border p-3">
                 {note.body}
               </li>
             ))}
           </ul>
         )}
       </>
     );
   }
   ```

   Verify: `test -f src/pages/notes.tsx`

9. Create `src/pages/about.tsx` with:

   ```tsx
   export function AboutPage() {
     return (
       <>
         <title>About · App</title>
         <h1 className="text-2xl font-semibold">About</h1>
         <p className="mt-4">
           A single-page application. Everything here runs in the browser; the data comes from an
           API this project does not contain.
         </p>
       </>
     );
   }
   ```

   Verify: `test -f src/pages/about.tsx`

10. Create `src/routes.tsx` with:

    ```tsx
    import { useEffect, useRef } from 'react';
    import {
      isRouteErrorResponse,
      NavLink,
      Outlet,
      useLocation,
      useRouteError,
      type RouteObject,
    } from 'react-router';

    import { ApiError, type ApiClient } from './api/client';
    import { AboutPage } from './pages/about';
    import { NotesPage } from './pages/notes';

    /**
     * Every route the app has, built around the API client it is given.
     *
     * The client is a parameter rather than an import so that a test can hand in
     * a fake one and render the real routes, loaders included.
     */
    export function createRoutes(api: ApiClient): RouteObject[] {
      return [
        {
          path: '/',
          element: <Layout />,
          errorElement: <RouteError />,
          hydrateFallbackElement: <p>Loading…</p>,
          children: [
            {
              index: true,
              // The loader runs before the page renders, and the router aborts
              // the signal when the user navigates away before it resolves.
              loader: ({ request }) => api.listNotes(request.signal),
              element: <NotesPage />,
              errorElement: <RouteError />,
            },
            { path: 'about', element: <AboutPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ];
    }

    function Layout() {
      const { pathname } = useLocation();
      const main = useRef<HTMLElement>(null);
      const firstRender = useRef(true);

      // A client-side navigation replaces the page without the browser knowing:
      // focus stays on the link that was clicked, and a screen reader announces
      // nothing. Moving focus to the main landmark after every navigation (but
      // not on first load, where the browser has already done its job) is what a
      // full page load would have given the reader for free.
      useEffect(() => {
        if (firstRender.current) {
          firstRender.current = false;
          return;
        }
        main.current?.focus();
      }, [pathname]);

      return (
        <>
          <a href="#main" className="sr-only focus:not-sr-only">
            Skip to content
          </a>
          <header className="border-b p-4">
            <nav aria-label="Main">
              <ul className="flex gap-4">
                <li>
                  <NavLink to="/" end>
                    Notes
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/about">About</NavLink>
                </li>
              </ul>
            </nav>
          </header>
          <main id="main" ref={main} tabIndex={-1} className="mx-auto max-w-2xl p-8 outline-none">
            <Outlet />
          </main>
        </>
      );
    }

    function RouteError() {
      const error = useRouteError();
      const message = isRouteErrorResponse(error)
        ? `${String(error.status)} ${error.statusText}`
        : error instanceof ApiError
          ? 'The notes could not be loaded. Try again in a moment.'
          : 'Something went wrong.';

      return (
        <>
          <title>Error · App</title>
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p role="alert">{message}</p>
        </>
      );
    }

    function NotFoundPage() {
      return (
        <>
          <title>Not found · App</title>
          <h1 className="text-2xl font-semibold">Page not found</h1>
        </>
      );
    }
    ```

    Verify: `test -f src/routes.tsx`

11. Create `src/main.tsx` with:

    ```tsx
    import { StrictMode } from 'react';
    import { createRoot } from 'react-dom/client';
    import { createBrowserRouter } from 'react-router';
    import { RouterProvider } from 'react-router/dom';

    import { createApiClient } from './api/client';
    import { ConfigError, readConfig } from './config';
    import { createRoutes } from './routes';
    import './index.css';

    const root = document.getElementById('root');
    if (root === null) throw new Error('index.html has no #root element');

    // The only line in the app that reads import.meta.env; the lint config
    // refuses it anywhere else, so configuration has exactly one way in.
    let config;
    try {
      config = readConfig(import.meta.env);
    } catch (error) {
      // Only reachable in development: `vite build` runs the same check and
      // refuses to produce a bundle without a valid API URL.
      if (error instanceof ConfigError) root.textContent = error.message;
      throw error;
    }

    const router = createBrowserRouter(createRoutes(createApiClient(config.apiBaseUrl)));

    createRoot(root).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
    ```

    Verify: `test -f src/main.tsx`

12. Create `vite.config.ts` with:

    ```typescript
    import tailwindcss from '@tailwindcss/vite';
    import react from '@vitejs/plugin-react';
    import { loadEnv } from 'vite';
    import { defineConfig } from 'vitest/config';

    // With the extension: Vite loads this file natively in a future major, and
    // native ESM does not guess extensions.
    import { readConfig } from './src/config.ts';

    export default defineConfig(({ command, mode }) => {
      // The same check the app runs at startup, run here so that a missing or
      // plain-http API URL fails the build instead of the first visitor.
      if (command === 'build') readConfig(loadEnv(mode, '.', 'VITE_'));

      return {
        plugins: [react(), tailwindcss()],
        // Source maps publish the original source to anybody who opens the
        // developer tools. Turn them on deliberately, or upload them to an error
        // tracker instead of shipping them.
        build: { sourcemap: false },
        test: {
          environment: 'jsdom',
          setupFiles: ['./src/setup-tests.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
        },
      };
    });
    ```

    Verify: `test -f vite.config.ts`

13. Create `eslint.config.js` with:

    ```javascript
    import js from '@eslint/js';
    import reactHooks from 'eslint-plugin-react-hooks';
    import { defineConfig, globalIgnores } from 'eslint/config';
    import globals from 'globals';
    import tseslint from 'typescript-eslint';

    export default defineConfig([
      globalIgnores(['dist']),
      {
        files: ['**/*.{ts,tsx}'],
        extends: [
          js.configs.recommended,
          tseslint.configs.strictTypeChecked,
          reactHooks.configs.flat.recommended,
        ],
        languageOptions: {
          globals: globals.browser,
          parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
        },
        rules: {
          // The two boundaries in AGENTS.md, enforced rather than remembered.
          'no-restricted-syntax': [
            'error',
            {
              selector: "MemberExpression[object.type='MetaProperty'][property.name='env']",
              message: 'Configuration is read once, in src/main.tsx, through src/config.ts.',
            },
          ],
          'no-restricted-globals': [
            'error',
            { name: 'fetch', message: 'Network calls go through src/api/client.ts.' },
          ],
        },
      },
      { files: ['src/main.tsx'], rules: { 'no-restricted-syntax': 'off' } },
      { files: ['src/api/**'], rules: { 'no-restricted-globals': 'off' } },
    ]);
    ```

    Verify: `test -f eslint.config.js`

14. Create `src/setup-tests.ts` with:

    ```typescript
    import '@testing-library/jest-dom/vitest';
    import { cleanup } from '@testing-library/react';
    import { afterEach } from 'vitest';

    // Vitest runs without globals here, so Testing Library cannot register its own
    // cleanup; without this, every test renders on top of the previous one.
    afterEach(() => {
      cleanup();
    });
    ```

    Verify: `test -f src/setup-tests.ts`

15. Create `src/config.test.ts` with:

    ```typescript
    import { describe, expect, it } from 'vitest';

    import { ConfigError, readConfig } from './config';

    describe('readConfig', () => {
      it('refuses to start without an API URL', () => {
        expect(() => readConfig({})).toThrow(ConfigError);
        expect(() => readConfig({ VITE_API_BASE_URL: '  ' })).toThrow(/required/);
      });

      it('refuses a relative URL', () => {
        expect(() => readConfig({ VITE_API_BASE_URL: '/api' })).toThrow(/absolute/);
      });

      it('refuses plain http anywhere but the local machine', () => {
        expect(() => readConfig({ VITE_API_BASE_URL: 'http://example.com' })).toThrow(/https/);
        expect(readConfig({ VITE_API_BASE_URL: 'http://localhost:8787' }).apiBaseUrl.host).toBe(
          'localhost:8787',
        );
      });

      it('treats a base path with and without a trailing slash the same', () => {
        const withSlash = readConfig({ VITE_API_BASE_URL: 'https://example.com/api/' });
        const without = readConfig({ VITE_API_BASE_URL: 'https://example.com/api' });
        expect(without.apiBaseUrl.href).toBe(withSlash.apiBaseUrl.href);
        expect(new URL('notes', without.apiBaseUrl).pathname).toBe('/api/notes');
      });
    });
    ```

    Verify: `test -f src/config.test.ts`

16. Create `src/api/client.test.ts` with:

    ```typescript
    import { describe, expect, it, vi } from 'vitest';

    import { ApiError, createApiClient, resolveApiUrl } from './client';

    const base = new URL('https://example.com/api/');

    function respondWith(body: unknown, status = 200) {
      return vi.fn<typeof fetch>(() =>
        Promise.resolve(
          new Response(JSON.stringify(body), {
            status,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      );
    }

    describe('the API client', () => {
      it('asks the configured API, and returns what it checked', async () => {
        const fetchImpl = respondWith([{ id: 1, body: 'first' }]);

        const notes = await createApiClient(base, fetchImpl).listNotes();

        expect(notes).toEqual([{ id: 1, body: 'first' }]);
        expect(fetchImpl.mock.calls[0]?.[0]).toEqual(new URL('https://example.com/api/notes'));
      });

      it('turns a failed response into an ApiError carrying the status', async () => {
        const client = createApiClient(base, respondWith({ error: 'boom' }, 503));

        await expect(client.listNotes()).rejects.toMatchObject({ name: 'ApiError', status: 503 });
      });

      it('refuses a response that is not the shape the types promise', async () => {
        const client = createApiClient(base, respondWith([{ id: '1', text: 'wrong field' }]));

        await expect(client.listNotes()).rejects.toBeInstanceOf(ApiError);
      });

      it('never resolves a path to another origin', () => {
        expect(() => resolveApiUrl(base, '//example.net/steal')).toThrow(ApiError);
        expect(() => resolveApiUrl(base, 'https://example.net/')).toThrow(ApiError);
        expect(resolveApiUrl(base, 'notes/1').href).toBe('https://example.com/api/notes/1');
      });
    });
    ```

    Verify: `test -f src/api/client.test.ts`

17. Create `src/routes.test.tsx` with:

    ```tsx
    import { render, screen } from '@testing-library/react';
    import userEvent from '@testing-library/user-event';
    import axe from 'axe-core';
    import { createMemoryRouter } from 'react-router';
    import { RouterProvider } from 'react-router/dom';
    import { describe, expect, it } from 'vitest';

    import { ApiError, type ApiClient, type Note } from './api/client';
    import { createRoutes } from './routes';

    function fakeApi(result: Note[] | ApiError): ApiClient {
      return {
        listNotes: () =>
          result instanceof ApiError ? Promise.reject(result) : Promise.resolve(result),
      };
    }

    function renderAt(path: string, api: ApiClient = fakeApi([{ id: 1, body: 'first' }])) {
      const router = createMemoryRouter(createRoutes(api), { initialEntries: [path] });
      return render(<RouterProvider router={router} />);
    }

    /**
     * axe-core against the rendered DOM, with no browser.
     *
     * jsdom does no layout, so the rules that need it — colour contrast above all —
     * come back "incomplete" rather than failing. What this catches is structure:
     * names, roles, landmarks, labels, duplicate ids. It is not an audit.
     */
    async function violations(): Promise<string[]> {
      // Contrast is switched off by name rather than left to come back
      // "incomplete", so nobody reads a green run as a contrast check.
      const results = await axe.run(document.body, {
        rules: { 'color-contrast': { enabled: false } },
      });
      return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
    }

    describe('routes', () => {
      it('renders the notes the API returned, and names the page', async () => {
        renderAt('/');

        expect(await screen.findByRole('heading', { level: 1, name: 'Notes' })).toBeInTheDocument();
        expect(screen.getByText('first')).toBeInTheDocument();
        expect(document.title).toBe('Notes · App');
      });

      it('keeps the navigation when the API fails, and says what happened', async () => {
        renderAt('/', fakeApi(new ApiError('down', 503)));

        expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
        expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
      });

      it('navigates without a page load, and moves focus to the new page', async () => {
        renderAt('/');
        await screen.findByRole('heading', { name: 'Notes' });

        await userEvent.click(screen.getByRole('link', { name: 'About' }));

        expect(await screen.findByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument();
        expect(document.title).toBe('About · App');
        expect(screen.getByRole('main')).toHaveFocus();
      });

      it('answers an unknown path with a not-found page inside the layout', async () => {
        renderAt('/no-such-page');

        expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
        expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
      });
    });

    describe('accessibility, as far as a DOM without layout can see', () => {
      it.each(['/', '/about', '/no-such-page'])('%s has no axe violations', async (path) => {
        renderAt(path);
        await screen.findByRole('heading', { level: 1 });

        expect(await violations()).toEqual([]);
      });
    });
    ```

    Verify: `test -f src/routes.test.tsx`

18. Create `.gitignore` with:

    ```text
    node_modules/
    dist/
    *.tsbuildinfo
    # Vite loads .env files into the build. Anything VITE_-prefixed in one is
    # published in the bundle, and anything else in one has no business here.
    .env*
    *.local
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

    jobs:
      check:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          # npm ci, not npm install: the committed lock file is what gets built,
          # byte for byte, and a lock file that disagrees with package.json fails.
          - run: npm ci
          - run: npm run lint
          - run: npm run typecheck
          - run: npm test
          - run: npm run build
            env:
              # A placeholder that satisfies the build's own check. A deploy job
              # sets the real URL, from a repository variable rather than a secret:
              # everything VITE_-prefixed ends up in the bundle anyway.
              VITE_API_BASE_URL: https://example.com/api
          - name: No source maps in the output
            run: test -z "$(find dist -name '*.map')"
    ```

    Verify: `test -f .github/workflows/ci.yml`

20. Create `README.md` with:

    ```markdown
    # app

    A single-page React application, built by Vite into static files.

    ## Run it

    Install with `npm ci`, then start the development server with
    `VITE_API_BASE_URL=http://localhost:8787 npm run dev`, pointing at wherever
    the API runs.

    `VITE_API_BASE_URL` is required, in development and in the build. It must be
    https anywhere but localhost, and it is compiled into the bundle, so it is
    public. Nothing secret goes in a `VITE_` variable.

    ## Deploy it

    `npm run build` writes `dist/`. Any static host serves it, with one rule the
    host has to be told: **every path that is not a file serves `index.html`**.
    Routing happens in the browser, so `/about` exists only after `index.html`
    has loaded; without the rewrite a reload on `/about` is a 404.

    ## Change it

    Read `AGENTS.md` first.
    ```

    Verify: `test -f README.md`

21. Type-check the whole project, tests and config included: `npm run typecheck`
    Verify: `npm run typecheck`

22. Lint, which also enforces the two boundaries in `AGENTS.md`: `import.meta.env` only in `src/main.tsx`, `fetch` only under `src/api/`: `npm run lint`
    Verify: `npm run lint`

23. Run the tests: the configuration rules, the API boundary, the routes, focus after navigation, and axe-core against every route: `npm test`
    Verify: `npm test`

24. Confirm the build refuses to run without an API URL, and writes nothing when it refuses: `env -u VITE_API_BASE_URL npm run build > build-refused.log 2>&1 || true`
    Verify: `grep -q "VITE_API_BASE_URL is required" build-refused.log && test ! -e dist`

25. Build for production, with a placeholder API URL: `VITE_API_BASE_URL=https://example.com/api npm run build`
    Verify: `test -f dist/index.html`

26. Confirm no source map was shipped, because a map publishes the original source to anybody with developer tools: `find dist -name '*.map'`
    Verify: `test -z "$(find dist -name '*.map')"`

27. Confirm the API URL was compiled into the bundle, which is what "configured at build time" means for a static app: `grep -rl "https://example.com/api" dist/assets`
    Verify: `grep -rq "https://example.com/api" dist/assets`

28. Confirm the built page declares its language, which a screen reader needs to pronounce anything and which the jsdom tests cannot see: `grep -o '<html lang="[a-z-]*">' dist/index.html`
    Verify: `grep -q '<html lang="en">' dist/index.html`

29. Confirm Tailwind generated the classes the components use, rather than an empty stylesheet: `grep -l "sr-only" dist/assets/*.css`
    Verify: `grep -q "sr-only" dist/assets/*.css`
