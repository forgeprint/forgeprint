/**
 * The catalog as pages.
 *
 * Everything is generated from `docs/index.json` and written into `docs/`,
 * which GitHub Pages serves straight from the branch — no build service, and
 * nothing here that a browser has to fetch before it can show anything
 * (ADR 0002).
 *
 * The output is deterministic: no timestamps, no build ids. A generated file
 * that changes on every run cannot be checked for drift, and a site that is
 * quietly stale is worse than one that is obviously missing.
 */

import type { CatalogIndex, IndexEntry, Taxonomy } from 'forgeprint';

export const REQUEST_URL =
  'https://github.com/forgeprint/forgeprint/issues/new?template=blueprint-request.yml';
export const REPOSITORY_URL = 'https://github.com/forgeprint/forgeprint';

export interface Page {
  /** Path under `docs/`, with forward slashes. */
  readonly path: string;
  readonly html: string;
}

export function renderSite(index: CatalogIndex): Page[] {
  return [
    { path: 'index.html', html: renderIndexPage(index) },
    ...index.blueprints.map((entry) => ({
      path: `b/${entry.slug}.html`,
      html: renderBlueprintPage(entry, index.taxonomy),
    })),
  ];
}

export function renderIndexPage(index: CatalogIndex): string {
  const blueprints = [...index.blueprints].sort((a, b) => a.slug.localeCompare(b.slug));
  const cards = blueprints.map((entry) => card(entry, index.taxonomy)).join('\n');
  const empty = blueprints.length === 0;

  return page({
    title: 'Forgeprint',
    description:
      'Resolved, AI-ready project blueprints for coding agents. One MCP call returns the right context and a tested setup recipe.',
    depth: 0,
    body: `
      <header class="hero">
        <h1>Forgeprint</h1>
        <p class="tagline">
          Tell your agent who you are and what you are building — get back one blueprint
          and a setup recipe it can execute.
        </p>
        <pre class="install"><code>claude mcp add forgeprint -- npx -y forgeprint-mcp</code></pre>
      </header>

      <section class="points">
        <div><h2>One answer</h2><p>Describe yourself and your goal. The resolver returns a single blueprint, or the questions it still needs answered — never a list to sift through.</p></div>
        <div><h2>A recipe, not a description</h2><p>Every step is one command with a verification after it, versions pinned. CI runs the recipes; a blueprint whose setup fails is not merged.</p></div>
        <div><h2>Curated, not collected</h2><p>One blueprint per stack, project type and requirements. A better one replaces the old one instead of sitting next to it.</p></div>
      </section>

      <section class="catalog">
        <div class="catalog-head">
          <h2>${blueprints.length} blueprint${blueprints.length === 1 ? '' : 's'}</h2>
          <input id="filter" type="search" placeholder="Filter by language, stack, type…" autocomplete="off" aria-label="Filter blueprints" />
        </div>
        ${empty ? '<p class="muted">The catalog is empty.</p>' : `<div id="cards">\n${cards}\n</div>`}
        <p id="nothing" class="muted" hidden>Nothing matches that.</p>
      </section>

      <section class="ask">
        <h2>Nothing fits?</h2>
        <p>
          The catalog grows by demand. <a href="${REQUEST_URL}">Request a blueprint</a> and
          say what is missing — requests are public, and somebody may pick yours up.
        </p>
      </section>
    `,
    script: `
      const filter = document.getElementById('filter');
      const nothing = document.getElementById('nothing');
      if (filter) {
        filter.addEventListener('input', () => {
          const needle = filter.value.trim().toLowerCase();
          let shown = 0;
          for (const card of document.querySelectorAll('.card')) {
            const match = needle === '' || (card.dataset.terms || '').includes(needle);
            card.hidden = !match;
            if (match) shown += 1;
          }
          if (nothing) nothing.hidden = shown > 0;
        });
      }
    `,
  });
}

export function renderBlueprintPage(entry: IndexEntry, taxonomy: Taxonomy): string {
  const label = (vocabulary: keyof Taxonomy, id: string): string =>
    (taxonomy[vocabulary] as Record<string, string>)[id] ?? id;
  const folder = `${REPOSITORY_URL}/tree/main/blueprints/${entry.slug}`;

  const options = Object.entries(entry.options);
  const rows = [
    ['Languages', entry.languages.map((id) => label('languages', id)).join(', ')],
    ['Project type', label('project_type', entry.project_type)],
    ['Stack', entry.stack.map((id) => label('stack', id)).join(', ')],
    ['Platforms', entry.platforms.map((id) => label('platforms', id)).join(', ')],
    ['Distribution', entry.distribution.map((id) => label('distribution', id)).join(', ')],
    ['Sets up', entry.requirements.map((id) => label('requirements', id)).join(', ')],
    ['Audience', entry.audience.map((id) => label('audience', id)).join(', ')],
    ['Tested with', entry.agents.map((id) => label('agents', id)).join(', ')],
    ['Needs', entry.requires_tools.join(', ') || '—'],
    ['Maintainers', entry.maintainers.map((handle) => `@${handle}`).join(', ')],
  ] as const;

  return page({
    title: `${entry.name} — Forgeprint`,
    description: entry.summary,
    depth: 1,
    body: `
      <p class="back"><a href="../index.html">← all blueprints</a></p>

      <header class="hero blueprint">
        <p class="slug">${escape(entry.slug)}</p>
        <h1>${escape(entry.name)} ${tier(entry.tier)}</h1>
        <p class="tagline">${escape(entry.summary)}</p>
        ${entry.deprecated ? '<p class="warn">Deprecated. It is no longer offered by the resolver.</p>' : ''}
        ${entry.supersedes === null ? '' : `<p class="muted">Supersedes <a href="${escape(entry.supersedes)}.html">${escape(entry.supersedes)}</a>.</p>`}
      </header>

      <section>
        <h2>Use it</h2>
        <p>Ask your agent for it by name, or let <code>resolve</code> find it from your profile.</p>
        <pre class="install"><code>get_blueprint { "slug": "${escape(entry.slug)}"${
          options.length === 0
            ? ''
            : `, "options": { ${options.map(([field, values]) => `"${escape(field)}": "${escape(values[0] ?? '')}"`).join(', ')} }`
        } }</code></pre>
      </section>

      ${
        options.length === 0
          ? ''
          : `<section>
        <h2>Options</h2>
        <dl class="options">
          ${options
            .map(
              ([field, values]) =>
                `<dt>${escape(field)}</dt><dd>${values.map((value) => `<code>${escape(value)}</code>`).join(' · ')}</dd>`,
            )
            .join('\n          ')}
        </dl>
      </section>`
      }

      <section>
        <h2>What it is</h2>
        <table class="facts">
          ${rows
            .filter(([, value]) => value.length > 0)
            .map(([name, value]) => `<tr><th>${name}</th><td>${escape(value)}</td></tr>`)
            .join('\n          ')}
        </table>
      </section>

      <section>
        <h2>Files</h2>
        <ul class="files">
          ${entry.files
            .map(
              (file) =>
                `<li><a href="${folder}/${escape(file)}"><code>${escape(file)}</code></a></li>`,
            )
            .join('\n          ')}
        </ul>
        <p class="muted">Version ${escape(entry.version)} · <a href="${folder}/CHANGELOG.md">changelog</a> · <a href="${folder}">folder on GitHub</a></p>
      </section>
    `,
  });
}

function card(entry: IndexEntry, taxonomy: Taxonomy): string {
  const terms = [
    entry.slug,
    entry.name,
    entry.summary,
    entry.project_type,
    ...entry.languages,
    ...entry.stack,
    ...entry.requirements,
    ...entry.platforms,
    ...entry.distribution,
  ]
    .join(' ')
    .toLowerCase();

  const tags = [
    ...entry.languages.map((id) => taxonomy.languages[id] ?? id),
    taxonomy.project_type[entry.project_type] ?? entry.project_type,
  ];

  return `        <article class="card${entry.deprecated ? ' deprecated' : ''}" data-terms="${escape(terms)}">
          <h3><a href="b/${escape(entry.slug)}.html">${escape(entry.name)}</a> ${tier(entry.tier)}</h3>
          <p>${escape(entry.summary)}</p>
          <p class="tags">${tags.map((tag) => `<span>${escape(tag)}</span>`).join('')}</p>
        </article>`;
}

function tier(name: string): string {
  return name === 'community' ? '' : `<span class="tier ${escape(name)}">${escape(name)}</span>`;
}

interface PageParts {
  readonly title: string;
  readonly description: string;
  /** How deep the page sits, so the stylesheet link resolves. */
  readonly depth: number;
  readonly body: string;
  readonly script?: string;
}

function page({ title, description, depth, body, script }: PageParts): string {
  const up = '../'.repeat(depth);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <link rel="stylesheet" href="${up}forgeprint.css" />
  </head>
  <body>
    <main>
${body.trim()}
    </main>
    <footer>
      <a href="${REPOSITORY_URL}">Repository</a> ·
      <a href="${REPOSITORY_URL}/blob/main/CONTRIBUTING.md">Contribute</a> ·
      <a href="${up}index.json">index.json</a>
      <p class="muted">
        Source-available, not OSI open source: tooling under PolyForm Shield 1.0.0,
        catalog content under CC BY 4.0.
      </p>
    </footer>${
      script === undefined
        ? ''
        : `
    <script>
${script.trim()}
    </script>`
    }
  </body>
</html>
`;
}

export function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const STYLESHEET = `:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --panel: #fafafa;
  --fg: #1b1b1f;
  --muted: #5a5a66;
  --line: #e3e3e8;
  --accent: #b8541a;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #15151a;
    --panel: #1c1c22;
    --fg: #e9e9ee;
    --muted: #a0a0ad;
    --line: #2c2c34;
    --accent: #ff9f57;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 3rem 1rem 4rem;
  background: var(--bg);
  color: var(--fg);
  font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
main, footer { max-width: 54rem; margin: 0 auto; }
h1 { font-size: 2.1rem; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
h2 { font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin: 2.5rem 0 0.75rem; }
h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
a { color: var(--accent); }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; }
.tagline { color: var(--muted); margin: 0 0 1.5rem; font-size: 1.05rem; }
.muted { color: var(--muted); }
.install { background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 0.8rem 1rem; overflow-x: auto; }
.points { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); margin-top: 2.5rem; }
.points h2 { margin: 0 0 0.35rem; text-transform: none; letter-spacing: 0; font-size: 1rem; color: var(--fg); }
.points p { margin: 0; color: var(--muted); font-size: 0.95rem; }
.catalog-head { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
.catalog-head h2 { margin-bottom: 0; }
#filter { flex: 1 1 14rem; padding: 0.5rem 0.7rem; border: 1px solid var(--line); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; font-size: 0.95rem; }
#cards { display: grid; gap: 0.9rem; margin-top: 1rem; }
.card { border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 6px; padding: 1rem 1.1rem; background: var(--panel); }
.card p { margin: 0.35rem 0 0; color: var(--muted); }
.card.deprecated { opacity: 0.6; }
.tags span { display: inline-block; font-size: 0.8rem; border: 1px solid var(--line); border-radius: 999px; padding: 0.05rem 0.55rem; margin: 0.4rem 0.35rem 0 0; color: var(--fg); }
.tier { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid var(--accent); color: var(--accent); border-radius: 999px; padding: 0.05rem 0.5rem; vertical-align: middle; }
.slug { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); margin: 0 0 0.25rem; font-size: 0.9rem; }
.back { margin: 0 0 1.5rem; }
.warn { border-left: 3px solid var(--accent); padding-left: 0.8rem; color: var(--muted); }
.facts { border-collapse: collapse; width: 100%; }
.facts th { text-align: left; font-weight: 600; padding: 0.35rem 1rem 0.35rem 0; vertical-align: top; white-space: nowrap; width: 10rem; }
.facts td { padding: 0.35rem 0; border-bottom: 1px solid var(--line); }
.options dt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; }
.options dd { margin: 0 0 0.6rem; color: var(--muted); }
.files { list-style: none; padding: 0; columns: 2; }
.files li { margin: 0.2rem 0; break-inside: avoid; }
footer { margin-top: 4rem; padding-top: 1.25rem; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.9rem; }
`;
