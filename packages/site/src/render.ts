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

import type { BlueprintRequest, CatalogIndex, IndexEntry, Taxonomy } from 'forgeprint';

export const REQUEST_URL =
  'https://github.com/forgeprint/forgeprint/issues/new?template=blueprint-request.yml';
export const REPOSITORY_URL = 'https://github.com/forgeprint/forgeprint';

export interface Page {
  /** Path under `docs/`, with forward slashes. */
  readonly path: string;
  readonly html: string;
}

/**
 * What the site shows besides the catalog: who wrote it, and what people have
 * asked for. Both are optional, so a checkout with neither still renders.
 */
export interface SiteContext {
  readonly requests: readonly BlueprintRequest[];
  /** The day the committed snapshot was taken, or '' when there is none. */
  readonly requestsFrom: string;
  /** GitHub logins credited on the front page. */
  readonly featured: readonly string[];
}

const NOTHING: SiteContext = { requests: [], requestsFrom: '', featured: [] };

/** Where the page reads the live list from. Public data, no token. */
export const REQUESTS_API =
  'https://api.github.com/repos/forgeprint/forgeprint/issues?labels=blueprint-request&state=open&per_page=50';

/** Issue links the page will follow. Anything else is somebody else's URL. */
const ISSUE_PREFIX = 'https://github.com/forgeprint/forgeprint/issues/';

export function renderSite(index: CatalogIndex, context: SiteContext = NOTHING): Page[] {
  return [
    { path: 'index.html', html: renderIndexPage(index, context) },
    ...index.blueprints.map((entry) => ({
      path: `b/${entry.slug}.html`,
      html: renderBlueprintPage(entry, index.taxonomy),
    })),
  ];
}

export function renderIndexPage(index: CatalogIndex, context: SiteContext = NOTHING): string {
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
        <p class="muted small">On Windows PowerShell, quote the separator: <code>claude mcp add forgeprint "--" npx -y forgeprint-mcp</code></p>
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
        ${requestList(context.requests, context.requestsFrom)}
      </section>

      ${contributors(context.featured)}
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

      // The requests come from the issues API, read by the browser with no
      // token: the alternative was a workflow with write access to this
      // repository, which is a large key for a small list (ADR 0007). The page
      // ships with a snapshot, so this only ever improves what is shown.
      (function () {
        const list = document.getElementById('requests');
        const empty = document.getElementById('requests-empty');
        const source = document.getElementById('requests-source');
        if (!list) return;
        const KEY = 'forgeprint.requests';
        const MAX_AGE = 10 * 60 * 1000;
        const API = ${JSON.stringify(REQUESTS_API)};
        const PREFIX = ${JSON.stringify(ISSUE_PREFIX)};

        function show(items) {
          list.textContent = '';
          for (const item of items) {
            const li = document.createElement('li');
            const link = document.createElement('a');
            // textContent, never innerHTML: an issue title is written by
            // whoever opened the issue.
            link.textContent = item.title;
            link.href = item.url;
            li.appendChild(link);
            if (item.author) {
              const by = document.createElement('span');
              by.className = 'muted';
              by.textContent = ' asked by @' + item.author;
              li.appendChild(by);
            }
            list.appendChild(li);
          }
          list.hidden = items.length === 0;
          if (empty) empty.hidden = items.length > 0;
          if (source) source.remove();
        }

        function cached() {
          try {
            const raw = sessionStorage.getItem(KEY);
            if (!raw) return null;
            const saved = JSON.parse(raw);
            return Date.now() - saved.at < MAX_AGE ? saved.items : null;
          } catch (error) {
            return null;
          }
        }

        const ready = cached();
        if (ready) {
          show(ready);
          return;
        }

        fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
          .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
          .then((issues) => {
            const items = issues
              // The issues endpoint returns pull requests too, and a link is
              // only followed when it points into this repository's issues.
              .filter((issue) => !issue.pull_request && String(issue.html_url).indexOf(PREFIX) === 0)
              .map((issue) => ({
                title: String(issue.title),
                url: String(issue.html_url),
                author: issue.user && issue.user.login ? String(issue.user.login) : '',
              }));
            try {
              sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), items: items }));
            } catch (error) {
              // A browser that refuses storage still gets the list.
            }
            show(items);
          })
          // Rate-limited, offline, blocked: the snapshot stays, and it is
          // dated, so nobody reads it as current.
          .catch(() => {});
      })();
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
        ${byline(entry.maintainers)}
        ${generatedNotice(entry.provenance)}
        ${derivedFrom(entry.derived_from)}
      </header>

      ${suggested(entry)}

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

/**
 * Who maintains this blueprint, with a face.
 *
 * A catalog entry is written by somebody, and the page says so where it cannot
 * be missed. The avatar comes from github.com/<login>.png, which needs no API
 * call at build time and no script in the page.
 */
function byline(maintainers: readonly string[]): string {
  if (maintainers.length === 0) return '';
  const people = maintainers
    .map(
      (handle) =>
        `<a class="person" href="https://github.com/${escape(handle)}">${avatar(handle)}<span>@${escape(handle)}</span></a>`,
    )
    .join('');
  return `<p class="byline">Blueprint by ${people}</p>`;
}

/**
 * Where the blueprint came from, when it came from somewhere.
 *
 * A blueprint carries somebody else's design decisions into other people's
 * projects, and the catalog cannot credit what it does not show (ADR 0008).
 * Absent for a blueprint written from scratch, which is most of them.
 */
/**
 * A generated blueprint says so, on its own page.
 *
 * Its recipe passed CI like every other, which is the part that can be
 * checked mechanically. What nobody did is sit with it and ask whether these
 * are the right steps — and a reader deciding whether to build on it is
 * entitled to know which kind of confidence they are getting (ADR 0011).
 */
/**
 * What a blueprint suggests installing alongside itself.
 *
 * Nothing rendered this, so a blueprint could name the MCP servers it expects
 * and a reader of its page would never see them. Absent rather than empty:
 * most blueprints suggest nothing, and an empty heading is worse than none.
 */
function suggested(entry: IndexEntry): string {
  const mcp = entry.provides.mcp;
  const skills = entry.provides.skills;
  if (mcp.length === 0 && skills.length === 0) return '';
  const row = (label: string, values: readonly string[]): string =>
    values.length === 0
      ? ''
      : `<dt>${label}</dt><dd>${values.map((value) => `<code>${escape(value)}</code>`).join(' · ')}</dd>`;
  return `<section>
        <h2>Suggested alongside</h2>
        <dl class="options">
          ${row('MCP servers', mcp)}
          ${row('Skills', skills)}
        </dl>
      </section>`;
}

function generatedNotice(provenance: IndexEntry['provenance']): string {
  if (provenance !== 'generated') return '';
  return `<p class="notice">Generated, CI-tested, not manually verified. The setup steps run; nobody has reviewed them by hand.</p>`;
}

function derivedFrom(source: IndexEntry['derived_from']): string {
  if (source === undefined) return '';
  const note = source.note === undefined ? '' : ` ${escape(source.note)}`;
  return `<p class="muted small">Derived from <a href="${escape(source.url)}">${escape(
    source.url.replace(/^https:\/\//, ''),
  )}</a> (${escape(source.license)}), read ${escape(source.verified_on)}.${note}</p>`;
}

function avatar(handle: string, size = 32): string {
  // Twice the displayed size, so it stays sharp on a dense screen.
  return `<img class="avatar" src="https://github.com/${escape(handle)}.png?size=${String(size * 2)}" width="${String(size)}" height="${String(size)}" loading="lazy" alt="" />`;
}

/**
 * The open requests.
 *
 * Rendered twice over: what is in the committed snapshot, and then whatever
 * the browser reads live from the issues API. The snapshot is what a reader
 * sees when the API is rate-limited or unreachable, and it says how old it is
 * rather than pretending to be current (ADR 0007).
 */
function requestList(requests: readonly BlueprintRequest[], from: string): string {
  const items = requests
    .map(
      (request) =>
        `<li><a href="${escape(request.url)}">${escape(request.title)}</a>${
          request.author === ''
            ? ''
            : ` <span class="muted">asked by @${escape(request.author)}</span>`
        }</li>`,
    )
    .join('\n          ');

  const empty = requests.length === 0;
  return `<h3>Requested blueprints</h3>
        <ul class="requests" id="requests"${empty ? ' hidden' : ''}>
          ${items}
        </ul>
        <p class="muted" id="requests-empty"${empty ? '' : ' hidden'}>No open requests right now.</p>
        ${from === '' ? '' : `<p class="muted small" id="requests-source">Snapshot from ${escape(from)}.</p>`}`;
}

function contributors(featured: readonly string[]): string {
  if (featured.length === 0) return '';
  const people = featured
    .map(
      (handle) =>
        `<a class="person" href="https://github.com/${escape(handle)}">${avatar(handle, 48)}<span>@${escape(handle)}</span></a>`,
    )
    .join('');
  return `<section class="contributors">
        <h2>Featured contributors</h2>
        <p class="muted">The catalog is written by people. These are the ones who wrote what is in it.</p>
        <div class="people">${people}</div>
      </section>`;
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
.small { font-size: 0.85rem; }
.byline { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; color: var(--muted); margin: 0 0 0.5rem; font-size: 0.95rem; }
.person { display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; color: var(--fg); }
.person:hover span { text-decoration: underline; }
.avatar { border-radius: 999px; border: 1px solid var(--line); display: block; }
.requests { list-style: none; padding: 0; margin: 0.75rem 0 0; }
.requests li { padding: 0.4rem 0; border-bottom: 1px solid var(--line); }
.people { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 0.75rem; }
.contributors .person { flex-direction: column; gap: 0.45rem; font-size: 0.9rem; }
footer { margin-top: 4rem; padding-top: 1.25rem; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.9rem; }
`;
