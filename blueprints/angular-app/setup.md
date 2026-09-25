# Setup

Creates an Angular single-page application with standalone components,
zoneless change detection, signals for state, a lazily loaded feature behind a
functional route guard, one HTTP interceptor every request passes through, and
a production build per locale that fails when the initial bundle passes its
budget or a message has no translation.

Run every step from an empty directory that will hold the project. Each step is
one action and ends with the command that proves it worked. Stop at the first
verification that fails.

Requires Node.js 22.22.3 or newer (Angular 22's floor on the 22 line; 24.15 or
newer also works) and npm. No browser download, no Docker, no account.

1. Generate the workspace with the pinned Angular CLI: standalone components, zoneless change detection, Tailwind, no server rendering, no git repository (create one yourself afterwards), and no install yet, because the next step pins every version the generator would have left as a range: `NG_CLI_ANALYTICS=false npx --yes @angular/cli@22.2.0 new app --directory . --style tailwind --ssr=false --zoneless --skip-git --skip-install --package-manager npm --ai-config none --defaults`
   Verify: `test -f angular.json && test -f src/main.ts`

2. Pin every version exactly instead of the generator's ranges, add `@angular/localize` for i18n and angular-eslint for lint, and drop `@angular/forms`, which nothing here uses. `vitest` is pinned a second time under `overrides`, and npm refuses to install if the two ever differ. Vite's optional `@vitejs/devtools` peer leads to one that accepts any `vitest`; npm resolves that to the newest release instead of the pinned one, and npm 10 and 11 crash on the mismatch while building the tree ("Cannot read properties of null (reading 'edgesOut')"). None of those optional peers is installed. Replace `package.json` with:

   ```json
   {
     "name": "app",
     "version": "0.0.0",
     "private": true,
     "engines": {
       "node": "^22.22.3 || ^24.15.0 || >=26.0.0"
     },
     "scripts": {
       "ng": "ng",
       "start": "ng serve",
       "build": "ng build",
       "test": "ng test --watch=false",
       "lint": "ng lint",
       "typecheck": "tsc -p tsconfig.spec.json --noEmit",
       "extract-i18n": "ng extract-i18n --output-path src/locale"
     },
     "overrides": {
       "vitest": "5.0.1"
     },
     "dependencies": {
       "@angular/common": "22.2.0",
       "@angular/compiler": "22.2.0",
       "@angular/core": "22.2.0",
       "@angular/platform-browser": "22.2.0",
       "@angular/router": "22.2.0",
       "rxjs": "7.8.2",
       "tslib": "2.8.1"
     },
     "devDependencies": {
       "@angular/build": "22.2.0",
       "@angular/cli": "22.2.0",
       "@angular/compiler-cli": "22.2.0",
       "@angular/localize": "22.2.0",
       "@eslint/js": "10.0.1",
       "@tailwindcss/postcss": "4.3.3",
       "angular-eslint": "22.5.0",
       "eslint": "10.11.0",
       "jsdom": "30.1.1",
       "postcss": "8.5.28",
       "prettier": "3.9.9",
       "tailwindcss": "4.3.3",
       "typescript": "6.0.3",
       "typescript-eslint": "8.70.1",
       "vitest": "5.0.1"
     }
   }
   ```

   Verify: `test -f package.json`

3. Install the pinned dependencies. This writes `package-lock.json`, which is committed and is what CI installs from. There is no zone.js: change detection is zoneless: `npm install --no-audit --no-fund`
   Verify: `npm ls @angular/core @angular/build @angular/localize angular-eslint vitest jsdom --depth=0 && test ! -d node_modules/zone.js`

4. State strict TypeScript and strict templates rather than inheriting them from a default that can move. Replace `tsconfig.json` with:

   ```json
   {
     "compileOnSave": false,
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "noPropertyAccessFromIndexSignature": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true,
       "skipLibCheck": true,
       "isolatedModules": true,
       "experimentalDecorators": true,
       "importHelpers": true,
       "target": "ES2022",
       "module": "preserve"
     },
     "angularCompilerOptions": {
       "strictTemplates": true,
       "strictInjectionParameters": true,
       "strictInputAccessModifiers": true,
       "enableI18nLegacyMessageIdFormat": false
     },
     "files": [],
     "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.spec.json" }]
   }
   ```

   Verify: `test -f tsconfig.json`

5. Give application code the `$localize` global. Replace `tsconfig.app.json` with:

   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "types": ["@angular/localize"]
     },
     "include": ["src/**/*.ts"],
     "exclude": ["src/**/*.spec.ts"]
   }
   ```

   Verify: `test -f tsconfig.app.json`

6. Give the tests the Vitest globals and `$localize`. Replace `tsconfig.spec.json` with:

   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "types": ["vitest/globals", "@angular/localize"]
     },
     "include": ["src/**/*.d.ts", "src/**/*.spec.ts"]
   }
   ```

   Verify: `test -f tsconfig.spec.json`

7. Add the i18n locales, a production build that fails when the initial bundle passes 350 kB or a message has no translation, and the `lint` and `extract-i18n` targets. Replace `angular.json` with:

   ```json
   {
     "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
     "version": 1,
     "cli": {
       "packageManager": "npm",
       "analytics": false
     },
     "newProjectRoot": "projects",
     "projects": {
       "app": {
         "projectType": "application",
         "root": "",
         "sourceRoot": "src",
         "prefix": "app",
         "i18n": {
           "sourceLocale": "en-US",
           "locales": {
             "en-GB": {
               "translation": "src/locale/messages.en-GB.xlf"
             }
           }
         },
         "architect": {
           "build": {
             "builder": "@angular/build:application",
             "options": {
               "browser": "src/main.ts",
               "tsConfig": "tsconfig.app.json",
               "polyfills": ["@angular/localize/init"],
               "assets": [{ "glob": "**/*", "input": "public" }],
               "styles": ["src/styles.css"],
               "i18nMissingTranslation": "error"
             },
             "configurations": {
               "production": {
                 "localize": true,
                 "sourceMap": false,
                 "outputHashing": "all",
                 "budgets": [
                   { "type": "initial", "maximumWarning": "300kB", "maximumError": "350kB" },
                   { "type": "anyComponentStyle", "maximumWarning": "2kB", "maximumError": "4kB" }
                 ]
               },
               "development": {
                 "optimization": false,
                 "extractLicenses": false,
                 "sourceMap": true
               }
             },
             "defaultConfiguration": "production"
           },
           "serve": {
             "builder": "@angular/build:dev-server",
             "configurations": {
               "production": { "buildTarget": "app:build:production" },
               "development": { "buildTarget": "app:build:development" }
             },
             "defaultConfiguration": "development"
           },
           "extract-i18n": {
             "builder": "@angular/build:extract-i18n"
           },
           "test": {
             "builder": "@angular/build:unit-test"
           },
           "lint": {
             "builder": "@angular-eslint/builder:lint",
             "options": {
               "lintFilePatterns": ["src/**/*.ts", "src/app/**/*.html"]
             }
           }
         }
       }
     }
   }
   ```

   Verify: `test -f angular.json`

8. Create `eslint.config.js` with:

   ```javascript
   // @ts-check
   const eslint = require('@eslint/js');
   const { defineConfig } = require('eslint/config');
   const tseslint = require('typescript-eslint');
   const angular = require('angular-eslint');

   module.exports = defineConfig([
     {
       files: ['**/*.ts'],
       extends: [
         eslint.configs.recommended,
         tseslint.configs.recommended,
         tseslint.configs.stylistic,
         angular.configs.tsRecommended,
       ],
       processor: angular.processInlineTemplates,
       rules: {
         '@angular-eslint/directive-selector': [
           'error',
           { type: 'attribute', prefix: 'app', style: 'camelCase' },
         ],
         '@angular-eslint/component-selector': [
           'error',
           { type: 'element', prefix: 'app', style: 'kebab-case' },
         ],
         // Zoneless change detection re-renders a component when a signal it
         // reads changes. OnPush says that is the only reason it re-renders.
         '@angular-eslint/prefer-on-push-component-change-detection': 'error',
         // One way out to the network: HttpClient, through the interceptor.
         'no-restricted-globals': [
           'error',
           { name: 'fetch', message: 'Use HttpClient, so the API interceptor sees the request.' },
           { name: 'XMLHttpRequest', message: 'Use HttpClient.' },
         ],
       },
     },
     {
       // Components render state; stores fetch it.
       files: ['src/app/**/*-page.ts', 'src/app/app.ts'],
       rules: {
         'no-restricted-imports': [
           'error',
           {
             paths: [
               {
                 name: '@angular/common/http',
                 importNames: ['HttpClient'],
                 message: 'Inject a store; only stores talk to HttpClient.',
               },
             ],
           },
         ],
       },
     },
     {
       files: ['**/*.html'],
       extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
       rules: {
         // Every piece of text a user reads goes through i18n with a stable ID,
         // or the translation file silently falls behind the templates.
         '@angular-eslint/template/i18n': [
           'error',
           { checkId: true, checkText: true, checkAttributes: false, requireDescription: false },
         ],
       },
     },
   ]);
   ```

   Verify: `test -f eslint.config.js`

9. The API base URL and the one interceptor every request passes through. Create `src/app/core/api.ts` with:

   ```typescript
   import { HttpInterceptorFn } from '@angular/common/http';
   import { InjectionToken, inject } from '@angular/core';
   import { throwError, timeout } from 'rxjs';

   /**
    * Where the API lives. Relative by default: the API is served from the same
    * origin as the app (a reverse proxy in front of both), so there is no CORS
    * policy to get wrong and no URL baked into the bundle. Override it in
    * `app.config.ts` when the API really is elsewhere.
    */
   export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
     providedIn: 'root',
     factory: () => '/api',
   });

   /** How long a request may take before the caller is told it failed. */
   export const API_TIMEOUT_MS = 10_000;

   /** `https:`, `mailto:`, `//host` — anything that names its own destination. */
   const ABSOLUTE = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

   /**
    * The one place a request's destination is decided.
    *
    * Services pass a path relative to the API (`'notes'`); this prefixes the base
    * URL. A request that names its own host, or climbs out of the API with `..`,
    * is refused before it is sent: whatever this app attaches to its requests is
    * meant for its API and for nobody else.
    *
    * Every request also gets a deadline. Without one, a hung API leaves the page
    * saying "Loading" forever and nothing ever reports an error.
    */
   export const apiInterceptor: HttpInterceptorFn = (req, next) => {
     const path = req.url.replace(/^[/\\]+/, '');
     // The browser resolves `..`, `%2e%2e` and a backslash the same way, so all
     // three are checked; only the path, not the query, can climb.
     const segments = (path.split(/[?#]/)[0] ?? '')
       .split(/[/\\]/)
       .map((segment) => segment.replace(/%2e/gi, '.'));
     if (ABSOLUTE.test(req.url) || segments.includes('..')) {
       return throwError(() => new Error(`Refusing a request outside the API: ${req.url}`));
     }
     const base = inject(API_BASE_URL).replace(/\/+$/, '');
     return next(
       req.clone({ url: `${base}/${path}`, setHeaders: { Accept: 'application/json' } }),
     ).pipe(timeout(API_TIMEOUT_MS));
   };
   ```

   Verify: `test -f src/app/core/api.ts`

10. The notes feature's state, as signals. Create `src/app/notes/notes.store.ts` with:

    ```typescript
    import { HttpClient } from '@angular/common/http';
    import { Injectable, computed, inject, signal } from '@angular/core';
    import { Observable, map, tap } from 'rxjs';

    export interface Note {
      readonly id: number;
      readonly body: string;
    }

    function isNote(value: unknown): value is Note {
      if (typeof value !== 'object' || value === null) return false;
      const candidate = value as Record<string, unknown>;
      return typeof candidate['id'] === 'number' && typeof candidate['body'] === 'string';
    }

    /**
     * `http.get<Note[]>()` is a cast, not a check: the type parameter tells the
     * compiler what to believe and tells the runtime nothing. The response is
     * checked here, once, so every signal below holds what its type says.
     */
    export function parseNotes(value: unknown): readonly Note[] {
      if (!Array.isArray(value) || !value.every(isNote)) {
        throw new Error('The API returned something that is not a list of notes');
      }
      return value;
    }

    export function parseNote(value: unknown): Note {
      if (!isNote(value)) throw new Error('The API returned something that is not a note');
      return value;
    }

    export type NotesStatus = 'idle' | 'loading' | 'ready' | 'error';

    /**
     * The notes feature's state, as signals.
     *
     * Provided by the feature's route (`notes.routes.ts`), not in root: the store
     * is created when somebody first opens the feature, and nothing outside the
     * feature can inject it. Components read signals and call methods; only this
     * class talks to `HttpClient`.
     */
    @Injectable()
    export class NotesStore {
      private readonly http = inject(HttpClient);

      private readonly state = signal<{ status: NotesStatus; notes: readonly Note[] }>({
        status: 'idle',
        notes: [],
      });

      readonly status = computed(() => this.state().status);
      readonly notes = computed(() => this.state().notes);
      readonly count = computed(() => this.notes().length);

      load(): void {
        this.state.update((state) => ({ ...state, status: 'loading' }));
        this.http
          .get<unknown>('notes')
          .pipe(map(parseNotes))
          .subscribe({
            next: (notes) => this.state.set({ status: 'ready', notes }),
            // Keep what was already shown; say that it could not be refreshed.
            error: () => this.state.update((state) => ({ ...state, status: 'error' })),
          });
      }

      add(body: string): Observable<Note> {
        return this.http.post<unknown>('notes', { body }).pipe(
          map(parseNote),
          tap((note) =>
            this.state.update((state) => ({ ...state, notes: [...state.notes, note] })),
          ),
        );
      }
    }
    ```

    Verify: `test -f src/app/notes/notes.store.ts`

11. A functional route guard. Create `src/app/notes/unsaved-changes.guard.ts` with:

    ```typescript
    import { Injectable, inject } from '@angular/core';
    import { CanDeactivateFn } from '@angular/router';

    export interface HasUnsavedChanges {
      hasUnsavedChanges(): boolean;
    }

    /**
     * Asking the user is a dependency, so it is injected: the guard stays a pure
     * decision, and a test replaces the dialog instead of clicking it.
     */
    @Injectable({ providedIn: 'root' })
    export class DiscardConfirmation {
      confirm(): boolean {
        return window.confirm($localize`:@@discardDraft:Discard the note you have not saved?`);
      }
    }

    /** Leaving a page with typed, unsaved text asks first. Nothing else does. */
    export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
      !component.hasUnsavedChanges() || inject(DiscardConfirmation).confirm();
    ```

    Verify: `test -f src/app/notes/unsaved-changes.guard.ts`

12. Create `src/app/notes/notes-page.ts` with:

    ```typescript
    import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

    import { NotesStore } from './notes.store';
    import { HasUnsavedChanges } from './unsaved-changes.guard';

    @Component({
      selector: 'app-notes-page',
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <h1 class="text-2xl font-semibold" i18n="@@notesHeading">Notes</h1>

        @switch (store.status()) {
          @case ('loading') {
            <p role="status" i18n="@@notesLoading">Loading notes...</p>
          }
          @case ('error') {
            <p role="alert" class="text-red-800" i18n="@@notesLoadError">
              The notes could not be loaded.
            </p>
          }
        }

        <ul class="mt-4 space-y-2">
          @for (note of store.notes(); track note.id) {
            <li class="rounded border p-3">{{ note.body }}</li>
          } @empty {
            <li i18n="@@notesEmpty">No notes yet.</li>
          }
        </ul>

        <form class="mt-6 space-y-2" (submit)="save($event)">
          <label class="block font-medium" for="draft" i18n="@@draftLabel">New note</label>
          <textarea
            #box
            id="draft"
            class="block w-full rounded border p-2"
            [value]="draft()"
            (input)="draft.set(box.value)"
          ></textarea>
          @if (saveFailed()) {
            <p role="alert" class="text-red-800" i18n="@@notesSaveError">
              The note could not be saved.
            </p>
          }
          <button
            type="submit"
            class="rounded bg-blue-800 px-4 py-2 text-white disabled:opacity-50"
            [disabled]="!canSave()"
            i18n="@@saveNote"
          >
            Save
          </button>
        </form>
      `,
    })
    export class NotesPage implements HasUnsavedChanges {
      protected readonly store = inject(NotesStore);
      protected readonly draft = signal('');
      protected readonly saving = signal(false);
      protected readonly saveFailed = signal(false);
      protected readonly canSave = computed(() => this.draft().trim() !== '' && !this.saving());

      constructor() {
        this.store.load();
      }

      hasUnsavedChanges(): boolean {
        return this.draft().trim() !== '';
      }

      protected save(event: Event): void {
        event.preventDefault();
        if (!this.canSave()) return;
        this.saving.set(true);
        this.saveFailed.set(false);
        this.store.add(this.draft().trim()).subscribe({
          next: () => {
            this.draft.set('');
            this.saving.set(false);
          },
          // The draft stays, so nothing the user typed is lost to a failed request.
          error: () => {
            this.saveFailed.set(true);
            this.saving.set(false);
          },
        });
      }
    }
    ```

    Verify: `test -f src/app/notes/notes-page.ts`

13. The lazily loaded feature's routes. Create `src/app/notes/notes.routes.ts` with:

    ```typescript
    import { Routes } from '@angular/router';

    import { NotesPage } from './notes-page';
    import { NotesStore } from './notes.store';
    import { unsavedChangesGuard } from './unsaved-changes.guard';

    /**
     * Loaded on first navigation to `/notes`, so none of this is in the initial
     * bundle. The store is provided here, which scopes it to the feature.
     */
    export const NOTES_ROUTES: Routes = [
      {
        path: '',
        providers: [NotesStore],
        component: NotesPage,
        canDeactivate: [unsavedChangesGuard],
        title: $localize`:@@notesTitle:Notes`,
      },
    ];
    ```

    Verify: `test -f src/app/notes/notes.routes.ts`

14. Create `src/app/home-page.ts` with:

    ```typescript
    import { ChangeDetectionStrategy, Component } from '@angular/core';
    import { RouterLink } from '@angular/router';

    @Component({
      selector: 'app-home-page',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [RouterLink],
      template: `
        <h1 class="text-2xl font-semibold" i18n="@@homeHeading">Welcome</h1>
        <p class="mt-2" i18n="@@homeIntro">Organize your notes in one place.</p>
        <a class="mt-4 inline-block underline" routerLink="/notes" i18n="@@homeOpenNotes">
          Open your notes
        </a>
      `,
    })
    export class HomePage {}
    ```

    Verify: `test -f src/app/home-page.ts`

15. Replace `src/app/app.routes.ts` with:

    ```typescript
    import { Routes } from '@angular/router';

    import { HomePage } from './home-page';

    export const routes: Routes = [
      { path: '', pathMatch: 'full', component: HomePage, title: $localize`:@@homeTitle:Home` },
      {
        path: 'notes',
        // A function returning an import: the bundler splits the feature into its
        // own chunk, and the budget in angular.json only counts what loads first.
        loadChildren: () => import('./notes/notes.routes').then((m) => m.NOTES_ROUTES),
      },
      { path: '**', redirectTo: '' },
    ];
    ```

    Verify: `test -f src/app/app.routes.ts`

16. Replace `src/app/app.config.ts` with:

    ```typescript
    import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
    import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
    import { provideRouter } from '@angular/router';

    import { routes } from './app.routes';
    import { apiInterceptor } from './core/api';

    /**
     * Everything the application provides, in one list. There is no
     * `provideZoneChangeDetection` and no zone.js: change detection is zoneless,
     * driven by signals and by the events Angular already knows about.
     */
    export const appConfig: ApplicationConfig = {
      providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(withFetch(), withInterceptors([apiInterceptor])),
      ],
    };
    ```

    Verify: `test -f src/app/app.config.ts`

17. The shell every page renders inside. Replace `src/app/app.html` with:

    ```html
    <a
      class="sr-only focus:not-sr-only focus:absolute focus:p-2"
      href="#main"
      i18n="@@skipToContent"
      >Skip to content</a
    >
    <header class="border-b p-4">
      <nav class="mx-auto flex max-w-2xl gap-4" aria-label="Main" i18n-aria-label="@@navLabel">
        <a
          routerLink="/"
          routerLinkActive="font-semibold"
          [routerLinkActiveOptions]="{ exact: true }"
          ariaCurrentWhenActive="page"
          i18n="@@navHome"
          >Home</a
        >
        <a
          routerLink="/notes"
          routerLinkActive="font-semibold"
          ariaCurrentWhenActive="page"
          i18n="@@navNotes"
          >Notes</a
        >
      </nav>
    </header>
    <main id="main" class="mx-auto max-w-2xl p-4">
      <router-outlet />
    </main>
    ```

    Verify: `test -f src/app/app.html`

18. Replace `src/app/app.ts` with:

    ```typescript
    import { ChangeDetectionStrategy, Component } from '@angular/core';
    import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

    @Component({
      selector: 'app-root',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [RouterLink, RouterLinkActive, RouterOutlet],
      templateUrl: './app.html',
      styleUrl: './app.css',
    })
    export class App {}
    ```

    Verify: `test -f src/app/app.ts`

19. The British English translation: every marked message has a target, and the build refuses to run if one is missing. Create `src/locale/messages.en-GB.xlf` with:

    ```xml
    <?xml version="1.0" encoding="UTF-8" ?>
    <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
      <file source-language="en-US" target-language="en-GB" datatype="plaintext" original="ng2.template">
        <body>
          <trans-unit id="skipToContent" datatype="html">
            <source>Skip to content</source>
            <target>Skip to content</target>
          </trans-unit>
          <trans-unit id="navLabel" datatype="html">
            <source>Main</source>
            <target>Main</target>
          </trans-unit>
          <trans-unit id="navHome" datatype="html">
            <source>Home</source>
            <target>Home</target>
          </trans-unit>
          <trans-unit id="navNotes" datatype="html">
            <source>Notes</source>
            <target>Notes</target>
          </trans-unit>
          <trans-unit id="homeTitle" datatype="html">
            <source>Home</source>
            <target>Home</target>
          </trans-unit>
          <trans-unit id="homeHeading" datatype="html">
            <source>Welcome</source>
            <target>Welcome</target>
          </trans-unit>
          <trans-unit id="homeIntro" datatype="html">
            <source>Organize your notes in one place.</source>
            <target>Organise your notes in one place.</target>
          </trans-unit>
          <trans-unit id="homeOpenNotes" datatype="html">
            <source> Open your notes </source>
            <target> Open your notes </target>
          </trans-unit>
          <trans-unit id="notesHeading" datatype="html">
            <source>Notes</source>
            <target>Notes</target>
          </trans-unit>
          <trans-unit id="notesLoading" datatype="html">
            <source>Loading notes...</source>
            <target>Loading notes...</target>
          </trans-unit>
          <trans-unit id="notesLoadError" datatype="html">
            <source> The notes could not be loaded. </source>
            <target> The notes could not be loaded. </target>
          </trans-unit>
          <trans-unit id="notesEmpty" datatype="html">
            <source>No notes yet.</source>
            <target>No notes yet.</target>
          </trans-unit>
          <trans-unit id="draftLabel" datatype="html">
            <source>New note</source>
            <target>New note</target>
          </trans-unit>
          <trans-unit id="notesSaveError" datatype="html">
            <source> The note could not be saved. </source>
            <target> The note could not be saved. </target>
          </trans-unit>
          <trans-unit id="saveNote" datatype="html">
            <source> Save </source>
            <target> Save </target>
          </trans-unit>
          <trans-unit id="notesTitle" datatype="html">
            <source>Notes</source>
            <target>Notes</target>
          </trans-unit>
          <trans-unit id="discardDraft" datatype="html">
            <source>Discard the note you have not saved?</source>
            <target>Discard the note you have not saved?</target>
          </trans-unit>
        </body>
      </file>
    </xliff>
    ```

    Verify: `test -f src/locale/messages.en-GB.xlf`

20. Create `src/app/core/api.spec.ts` with:

    ```typescript
    import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
    import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
    import { TestBed } from '@angular/core/testing';

    import { API_BASE_URL, API_TIMEOUT_MS, apiInterceptor } from './api';

    function setUp(baseUrl?: string) {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([apiInterceptor])),
          provideHttpClientTesting(),
          ...(baseUrl === undefined ? [] : [{ provide: API_BASE_URL, useValue: baseUrl }]),
        ],
      });
      return { http: TestBed.inject(HttpClient), backend: TestBed.inject(HttpTestingController) };
    }

    describe('apiInterceptor', () => {
      afterEach(() => {
        // Nothing unexpected reached the network. For the refusals below, this is
        // the assertion that matters: the request was never sent.
        TestBed.inject(HttpTestingController).verify();
        vi.useRealTimers();
      });

      it('sends a path relative to the API to the API', () => {
        const { http, backend } = setUp();
        http.get('notes').subscribe();

        const req = backend.expectOne('/api/notes');
        expect(req.request.headers.get('Accept')).toBe('application/json');
        req.flush([]);
      });

      it('uses the configured base URL, with or without a trailing slash', () => {
        const { http, backend } = setUp('https://example.com/api/v1/');
        http.get('/notes').subscribe();

        backend.expectOne('https://example.com/api/v1/notes').flush([]);
      });

      it.each([
        'https://example.com/steal',
        '//example.com/steal',
        'data:application/json,[]',
        'notes/../admin',
        'notes/%2E%2e/admin',
        'notes\\..\\admin',
      ])('refuses %s without sending it', (url) => {
        const { http } = setUp();
        const error = vi.fn();

        http.get(url).subscribe({ error });

        expect(error).toHaveBeenCalledOnce();
      });

      it('fails a request the API never answers, and cancels it', () => {
        vi.useFakeTimers();
        const { http, backend } = setUp();
        const error = vi.fn();

        http.get('notes').subscribe({ error });
        const req = backend.expectOne('/api/notes');
        vi.advanceTimersByTime(API_TIMEOUT_MS);

        expect(error).toHaveBeenCalledWith(expect.objectContaining({ name: 'TimeoutError' }));
        expect(req.cancelled).toBe(true);
      });
    });
    ```

    Verify: `test -f src/app/core/api.spec.ts`

21. Create `src/app/notes/notes.store.spec.ts` with:

    ```typescript
    import { provideHttpClient, withInterceptors } from '@angular/common/http';
    import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
    import { TestBed } from '@angular/core/testing';

    import { apiInterceptor } from '../core/api';
    import { NotesStore } from './notes.store';

    describe('NotesStore', () => {
      let store: NotesStore;
      let backend: HttpTestingController;

      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            NotesStore,
            provideHttpClient(withInterceptors([apiInterceptor])),
            provideHttpClientTesting(),
          ],
        });
        store = TestBed.inject(NotesStore);
        backend = TestBed.inject(HttpTestingController);
      });

      afterEach(() => backend.verify());

      it('holds the notes the API returns', () => {
        store.load();
        expect(store.status()).toBe('loading');

        backend.expectOne('/api/notes').flush([{ id: 1, body: 'first' }]);

        expect(store.status()).toBe('ready');
        expect(store.notes()).toEqual([{ id: 1, body: 'first' }]);
        expect(store.count()).toBe(1);
      });

      it('refuses a response that is not a list of notes', () => {
        store.load();

        backend.expectOne('/api/notes').flush([{ id: '1', body: 'first' }]);

        expect(store.status()).toBe('error');
        expect(store.notes()).toEqual([]);
      });

      it('reports a failed request as an error', () => {
        store.load();

        backend.expectOne('/api/notes').flush('unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });

        expect(store.status()).toBe('error');
      });

      it('posts a new note and appends what the API saved', () => {
        store.add('second').subscribe();

        const req = backend.expectOne({ method: 'POST', url: '/api/notes' });
        expect(req.request.body).toEqual({ body: 'second' });
        req.flush({ id: 2, body: 'second' });

        expect(store.notes()).toEqual([{ id: 2, body: 'second' }]);
      });
    });
    ```

    Verify: `test -f src/app/notes/notes.store.spec.ts`

22. Create `src/app/notes/unsaved-changes.guard.spec.ts` with:

    ```typescript
    import { TestBed } from '@angular/core/testing';
    import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

    import { DiscardConfirmation, unsavedChangesGuard } from './unsaved-changes.guard';

    describe('unsavedChangesGuard', () => {
      const confirm = vi.fn<() => boolean>();

      beforeEach(() => {
        confirm.mockReset();
        TestBed.configureTestingModule({
          providers: [{ provide: DiscardConfirmation, useValue: { confirm } }],
        });
      });

      function leave(dirty: boolean) {
        return TestBed.runInInjectionContext(() =>
          unsavedChangesGuard(
            { hasUnsavedChanges: () => dirty },
            {} as ActivatedRouteSnapshot,
            {} as RouterStateSnapshot,
            {} as RouterStateSnapshot,
          ),
        );
      }

      it('lets a page with nothing unsaved go without asking', () => {
        expect(leave(false)).toBe(true);
        expect(confirm).not.toHaveBeenCalled();
      });

      it('keeps a page with an unsaved draft when the user declines', () => {
        confirm.mockReturnValue(false);
        expect(leave(true)).toBe(false);
        expect(confirm).toHaveBeenCalledOnce();
      });

      it('lets a page with an unsaved draft go when the user confirms', () => {
        confirm.mockReturnValue(true);
        expect(leave(true)).toBe(true);
      });
    });
    ```

    Verify: `test -f src/app/notes/unsaved-changes.guard.spec.ts`

23. Tests that drive the real routes, the real interceptor, a fake backend and a fake dialog. Replace `src/app/app.spec.ts` with:

    ```typescript
    import { provideHttpClient, withInterceptors } from '@angular/common/http';
    import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
    import { TestBed } from '@angular/core/testing';
    import { Router, provideRouter } from '@angular/router';
    import { RouterTestingHarness } from '@angular/router/testing';

    import { routes } from './app.routes';
    import { apiInterceptor } from './core/api';
    import { DiscardConfirmation } from './notes/unsaved-changes.guard';

    /** The real routes, the real interceptor, a fake backend and a fake dialog. */
    describe('routes', () => {
      const confirm = vi.fn<() => boolean>();

      beforeEach(() => {
        confirm.mockReset();
        TestBed.configureTestingModule({
          providers: [
            provideRouter(routes),
            provideHttpClient(withInterceptors([apiInterceptor])),
            provideHttpClientTesting(),
            { provide: DiscardConfirmation, useValue: { confirm } },
          ],
        });
      });

      afterEach(() => TestBed.inject(HttpTestingController).verify());

      async function openNotes(notes: object) {
        const harness = await RouterTestingHarness.create();
        await harness.navigateByUrl('/notes');
        TestBed.inject(HttpTestingController).expectOne('/api/notes').flush(notes);
        await harness.fixture.whenStable();
        return harness;
      }

      it('renders the home page at /', async () => {
        const harness = await RouterTestingHarness.create('/');

        expect(harness.routeNativeElement?.textContent).toContain('Organize your notes');
      });

      it('loads the notes feature and lists what the API returns', async () => {
        const harness = await openNotes([{ id: 1, body: 'first' }]);

        expect(harness.routeNativeElement?.querySelector('li')?.textContent).toContain('first');
      });

      it('says so when the notes cannot be loaded', async () => {
        const harness = await openNotes({ not: 'a list' });

        expect(harness.routeNativeElement?.querySelector('[role="alert"]')).not.toBeNull();
      });

      it('keeps the user on a page with an unsaved draft when they decline to leave', async () => {
        const harness = await openNotes([]);
        const box = harness.routeNativeElement?.querySelector('textarea');
        if (!box) throw new Error('no textarea');
        box.value = 'half a thought';
        box.dispatchEvent(new Event('input'));
        confirm.mockReturnValue(false);

        const left = await TestBed.inject(Router).navigateByUrl('/');

        expect(left).toBe(false);
        expect(confirm).toHaveBeenCalledOnce();
        expect(TestBed.inject(Router).url).toBe('/notes');
      });

      it('redirects an unknown path home', async () => {
        const harness = await RouterTestingHarness.create('/nowhere');

        expect(TestBed.inject(Router).url).toBe('/');
        expect(harness.routeNativeElement?.textContent).toContain('Welcome');
      });
    });
    ```

    Verify: `test -f src/app/app.spec.ts`

24. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      build:
        runs-on: ubuntu-latest
        env:
          NG_CLI_ANALYTICS: 'false'
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version: '22'
          - run: npm ci --no-audit --no-fund
          - run: npm run lint
          - run: npm run typecheck
          - run: npm test
          # Every extracted message must have an en-GB translation; the build
          # itself also refuses a missing one (i18nMissingTranslation: error).
          - run: npm run extract-i18n
          - run: test "$(grep -c '<trans-unit' src/locale/messages.xlf)" = "$(grep -c '<trans-unit' src/locale/messages.en-GB.xlf)"
          - run: npm run build
    ```

    Verify: `test -f .github/workflows/ci.yml`

25. Replace `README.md` with:

    ```markdown
    # app

    An Angular single-page application: standalone components, zoneless change
    detection, signals for state, and every request through one interceptor.

    ## Commands

    - `npm start` — development server, source locale only.
    - `npm test` — unit tests in Vitest with jsdom. No browser is downloaded.
    - `npm run lint` — angular-eslint, including the template accessibility and
      i18n rules.
    - `npm run build` — production build, one folder per locale under
      `dist/app/browser/`. Fails if the initial bundle passes its budget in
      `angular.json`, or if a message has no translation.

    ## Translations

    Mark text with `i18n="@@someId"` (or `$localize` in TypeScript), run
    `npm run extract-i18n`, and copy the new `<trans-unit>` into every
    `src/locale/messages.<locale>.xlf` with a `<target>`.

    ## Deploying

    The build is static files, one directory per locale. The host must serve
    `index.html` for any path it does not know, per locale, or reloading a deep
    link returns 404. The API is expected at `/api` on the same origin; see
    `src/app/core/api.ts`.
    ```

    Verify: `test -f README.md`

26. Type-check the application and the tests: `npm run typecheck`
    Verify: `npm run typecheck`

27. Lint: the angular-eslint recommended and accessibility rules, i18n IDs on every text node, OnPush on every component, no `fetch`, and no `HttpClient` in a component: `npm run lint`
    Verify: `npm run lint`

28. Run the unit tests in Vitest with jsdom: the interceptor's refusals and deadline, the store against a fake backend, the guard, and the real routes: `npm test`
    Verify: `npm test`

29. Extract the messages the templates and `$localize` calls mark for translation: `npm run extract-i18n`
    Verify: `test "$(grep -c '<trans-unit' src/locale/messages.xlf)" = "$(grep -c '<trans-unit' src/locale/messages.en-GB.xlf)"`

30. Keep a copy of `angular.json` before the next two steps prove that the budget is enforced: `cp angular.json angular.json.orig`
    Verify: `cmp angular.json angular.json.orig`

31. Shrink the initial-bundle error budget to 1 kB, which no Angular application can meet: `node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('angular.json','utf8'));j.projects.app.architect.build.configurations.production.budgets[0].maximumError='1kB';fs.writeFileSync('angular.json',JSON.stringify(j,null,2))"`
    Verify: `grep -q '"maximumError": "1kB"' angular.json`

32. Confirm the production build refuses to finish when the budget is exceeded, and writes nothing: `npm run build > budget-refused.log 2>&1 || true`
    Verify: `grep -q "exceeded maximum budget" budget-refused.log && test ! -d dist/app/browser`

33. Put the real `angular.json` back: `mv angular.json.orig angular.json`
    Verify: `grep -q '"maximumError": "350kB"' angular.json`

34. Remove the log of the refused build: `rm budget-refused.log`
    Verify: `test ! -e budget-refused.log`

35. Build for production: one output folder per locale: `npm run build`
    Verify: `test -f dist/app/browser/en-US/index.html && test -f dist/app/browser/en-GB/index.html`

36. Confirm the en-GB build carries the translation and the en-US build does not: `grep -l "Organise your notes" dist/app/browser/en-GB/main-*.js`
    Verify: `grep -q "Organise your notes" dist/app/browser/en-GB/main-*.js && ! grep -q "Organise your notes" dist/app/browser/en-US/main-*.js`

37. Confirm each locale's page declares its own language, which a screen reader needs to pronounce anything: `grep -o '<html lang="[A-Za-z-]*"' dist/app/browser/en-GB/index.html`
    Verify: `grep -q '<html lang="en-GB"' dist/app/browser/en-GB/index.html && grep -q '<html lang="en-US"' dist/app/browser/en-US/index.html`

38. Confirm the notes feature is a separate chunk: its text is not in the initial bundle: `grep -l "No notes yet" dist/app/browser/en-US/chunk-*.js`
    Verify: `! grep -q "No notes yet" dist/app/browser/en-US/main-*.js && grep -q "No notes yet" dist/app/browser/en-US/chunk-*.js`

39. Confirm no source map was shipped, because a map publishes the original source to anybody with developer tools: `find dist -name '*.map'`
    Verify: `test -z "$(find dist -name '*.map')"`

40. Confirm Tailwind generated the classes the templates use, rather than an empty stylesheet: `grep -l "sr-only" dist/app/browser/en-US/styles-*.css`
    Verify: `grep -q "sr-only" dist/app/browser/en-US/styles-*.css`
