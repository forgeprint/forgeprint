# Setup

Creates a static content site in Astro with Tailwind, a typed content
collection, and tests that assert the built HTML carries the SEO and
accessibility work.

Run every step from the directory that will hold the project. Each step is one
action and ends with the command that proves it worked. Stop at the first
verification that fails.

Step numbers are shared across option branches, so the branch you did not pick
can leave a gap in the numbering. That is expected; follow the steps in order.

Requires Node.js 22.12 or newer, which is what Astro 7 requires.

<!-- if options.content == markdown -->

1. Create `package.json` with:

   ```json
   {
     "name": "content-site",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "scripts": {
       "build": "astro build",
       "dev": "astro dev",
       "test": "astro build && node --test tests/*.test.mjs"
     },
     "dependencies": {
       "astro": "7.3.4",
       "@astrojs/sitemap": "3.7.4",
       "@tailwindcss/vite": "4.3.3",
       "tailwindcss": "4.3.3"
     }
   }
   ```

   Verify: `test -f package.json`

<!-- endif -->

<!-- if options.content == mdx -->

1. Create `package.json` with:

   ```json
   {
     "name": "content-site",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "scripts": {
       "build": "astro build",
       "dev": "astro dev",
       "test": "astro build && node --test tests/*.test.mjs"
     },
     "dependencies": {
       "astro": "7.3.4",
       "@astrojs/mdx": "8.0.2",
       "@astrojs/sitemap": "3.7.4",
       "@tailwindcss/vite": "4.3.3",
       "tailwindcss": "4.3.3"
     }
   }
   ```

   Verify: `test -f package.json`

<!-- endif -->

2. Install the pinned dependencies: `npm install --no-audit --no-fund`
   Verify: `node -e "require.resolve('astro/package.json')"`

<!-- if options.content == markdown -->

3. Create `astro.config.mjs` with:

   ```javascript
   import { defineConfig } from 'astro/config';
   import sitemap from '@astrojs/sitemap';
   import tailwindcss from '@tailwindcss/vite';

   // `site` is not decoration. The canonical URL on every page and every entry
   // in the sitemap is built from it, so a crawler believes whatever is here.
   // Change it to the real domain before the first deploy.
   export default defineConfig({
     site: 'https://example.com',
     integrations: [sitemap()],
     vite: { plugins: [tailwindcss()] },
   });
   ```

   Verify: `test -f astro.config.mjs`

<!-- endif -->

<!-- if options.content == mdx -->

3. Create `astro.config.mjs` with:

   ```javascript
   import { defineConfig } from 'astro/config';
   import mdx from '@astrojs/mdx';
   import sitemap from '@astrojs/sitemap';
   import tailwindcss from '@tailwindcss/vite';

   // `site` is not decoration. The canonical URL on every page and every entry
   // in the sitemap is built from it, so a crawler believes whatever is here.
   // Change it to the real domain before the first deploy.
   export default defineConfig({
     site: 'https://example.com',
     integrations: [mdx(), sitemap()],
     vite: { plugins: [tailwindcss()] },
   });
   ```

   Verify: `test -f astro.config.mjs`

<!-- endif -->

4. Create `src/styles.css` with:

   ```css
   @import 'tailwindcss';
   ```

   Verify: `test -f src/styles.css`

5. Create `src/layouts/Page.astro` with:

   ```astro
   ---
   import '../styles.css';

   // The only place in the project that writes <head>. Every page goes through
   // here and has to pass both props, so a page with no description fails to
   // type-check rather than shipping an empty meta tag.
   interface Props {
     title: string;
     description: string;
   }

   const { title, description } = Astro.props;
   // Absolute, from `site`. A relative canonical tells a crawler nothing.
   const canonical = new URL(Astro.url.pathname, Astro.site);
   ---

   <!doctype html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title>{title}</title>
       <meta name="description" content={description} />
       <link rel="canonical" href={canonical} />
       <meta property="og:title" content={title} />
       <meta property="og:description" content={description} />
       <meta property="og:url" content={canonical} />
     </head>
     <body>
       <!-- First focusable element on the page: a keyboard user can jump past
            the navigation instead of tabbing through it on every page. -->
       <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
       <main id="main">
         <slot />
       </main>
     </body>
   </html>
   ```

   Verify: `test -f src/layouts/Page.astro`

6. Create `src/content.config.ts` with:

   ```typescript
   import { defineCollection, z } from 'astro:content';
   import { glob } from 'astro/loaders';

   // The schema is the contract. An entry missing a description fails the
   // build, which is the only moment anybody is paying attention — a page that
   // ships with an empty meta tag is noticed months later, by somebody else.
   const posts = defineCollection({
     loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
     schema: z.object({
       title: z.string(),
       description: z.string().min(20),
       published: z.date(),
     }),
   });

   export const collections = { posts };
   ```

   Verify: `test -f src/content.config.ts`

<!-- if options.content == markdown -->

7. Create `src/content/posts/first.md` with:

   ```markdown
   ---
   title: The first post
   description: A post that exists so the collection has something to render, and so the tests have a page to read.
   published: 2026-01-01
   ---

   Replace this with yours. The frontmatter above is validated at build time by
   `src/content.config.ts`; add a field there before using it in a template.
   ```

   Verify: `test -f src/content/posts/first.md`

<!-- endif -->

<!-- if options.content == mdx -->

7. Create `src/content/posts/first.mdx` with:

   ```markdown
   ---
   title: The first post
   description: A post that exists so the collection has something to render, and so the tests have a page to read.
   published: 2026-01-01
   ---

   export const answer = 42;

   Replace this with yours. The frontmatter above is validated at build time by
   `src/content.config.ts`. This is MDX, so an expression like {answer} is
   evaluated — that is the whole reason to choose this option over Markdown.
   ```

   Verify: `test -f src/content/posts/first.mdx`

<!-- endif -->

8. Create `src/pages/index.astro` with:

   ```astro
   ---
   import { getCollection } from 'astro:content';
   import Page from '../layouts/Page.astro';

   const posts = await getCollection('posts');
   posts.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
   ---

   <Page
     title="Content site"
     description="A content site with the SEO and accessibility work already done and tested."
   >
     <h1>Content site</h1>
     <ul>
       {
         posts.map((post) => (
           <li>
             <a href={`/posts/${post.id}/`}>{post.data.title}</a>
           </li>
         ))
       }
     </ul>
   </Page>
   ```

   Verify: `test -f src/pages/index.astro`

9. Create `src/pages/posts/[...slug].astro` with:

   ```astro
   ---
   import { getCollection, render } from 'astro:content';
   import Page from '../../layouts/Page.astro';

   export async function getStaticPaths() {
     const posts = await getCollection('posts');
     return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
   }

   const { post } = Astro.props;
   const { Content } = await render(post);
   ---

   <Page title={post.data.title} description={post.data.description}>
     <h1>{post.data.title}</h1>
     <Content />
   </Page>
   ```

   Verify: `test -f "src/pages/posts/[...slug].astro"`

10. Create `tests/built-html.test.mjs` with:

    ```javascript
    import assert from 'node:assert/strict';
    import { readFileSync } from 'node:fs';
    import { describe, it } from 'node:test';

    // Read what was built, not what the templates say. A template can be
    // correct and the output wrong — a missing `site`, an integration that did
    // not run — and the output is what a crawler and a screen reader get.
    const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');

    describe('what a crawler reads', () => {
      it('has one title, and it is not a placeholder', () => {
        const titles = html.match(/<title>(.*?)<\/title>/g) ?? [];
        assert.equal(titles.length, 1);
        assert.doesNotMatch(titles[0], /Astro|Document/);
      });

      it('has a description long enough to be one', () => {
        assert.match(html, /<meta name="description" content="[^"]{20,}"/);
      });

      it('has an absolute canonical URL', () => {
        // Relative tells a crawler nothing, and it is what you get when
        // `site` is missing from the config.
        assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+"/);
      });

      it('has the Open Graph tags a link preview needs', () => {
        for (const property of ['og:title', 'og:description', 'og:url']) {
          assert.match(html, new RegExp(`property="${property}"`), property);
        }
      });
    });

    describe('what a screen reader gets', () => {
      // These are the mechanical checks. They cannot see contrast, focus order
      // or whether any alt text describes anything — run a real audit in a
      // browser for that. These exist so the easy failures never reach it.
      it('declares the language', () => {
        assert.match(html, /<html lang="[a-z]{2}(-[A-Z]{2})?"/);
      });

      it('has exactly one h1', () => {
        assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
      });

      it('offers a skip link to the main landmark', () => {
        assert.match(html, /href="#main"/);
        assert.match(html, /<main id="main"/);
      });

      it('gives every image alternative text', () => {
        // alt="" is a decision ("skip this"); a missing attribute makes the
        // screen reader read the file name aloud.
        for (const img of html.match(/<img[^>]*>/g) ?? []) {
          assert.match(img, /\salt="/, img);
        }
      });
    });
    ```

    Verify: `test -f tests/built-html.test.mjs`

11. Create `.gitignore` with:

    ```text
    node_modules/
    dist/
    .astro/
    ```

    Verify: `test -f .gitignore`

12. Create `.github/workflows/ci.yml` with:

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
        steps:
          - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
          - uses: actions/setup-node@2028fbc5c25fe9cf00d9f06a71cc4710d4507903 # v5.0.0
            with:
              node-version: '22.12'
          - run: npm install --no-audit --no-fund
          # `test` builds first, because the assertions read dist/ and would
          # otherwise be checking the previous build.
          - run: npm test
    ```

    Verify: `test -f .github/workflows/ci.yml`

13. Create `README.md` with:

    ```markdown
    # Content site

    A static site on Astro, with the SEO and accessibility basics enforced by
    tests that read the built HTML.

    ## Before the first deploy

    Set `site` in `astro.config.mjs` to the real domain. The canonical URL on
    every page and every entry in the sitemap comes from it.

    ## Add a page

    See `AGENTS.md`. Every page goes through `Page.astro` and passes a title
    and a description; content goes in `src/content/posts/` and is rendered by
    the dynamic route.
    ```

    Verify: `test -f README.md`

14. Build the site: `npm run build`
    Verify: `test -f dist/index.html`

15. Confirm the sitemap was generated, because a content site without one is
    the mistake this blueprint exists to prevent: `test -f dist/sitemap-index.xml`
    Verify: `grep -q "sitemap" dist/sitemap-index.xml`

16. Confirm the post was rendered from the collection, which is the part that
    proves the schema and the dynamic route agree: `test -f dist/posts/first/index.html`
    Verify: `grep -q "The first post" dist/posts/first/index.html`

17. Run the tests: `npm test`
    Verify: `npm test`
