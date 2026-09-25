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
import { attr, languageSwitch, t } from './chrome.js';
import { blueprintData, catalogData, headTags } from './seo.js';
import {
  crewCards,
  expertCards,
  integrationCards,
  requestedExperts,
  unitPages,
  type IndexWithUnits,
} from './units.js';

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
    // `catalog.html`, not `index.html`: the root of the Pages site is the
    // hand-written landing page, and this is the catalog it links into.
    { path: 'catalog.html', html: renderIndexPage(index, context) },
    ...index.blueprints.map((entry) => ({
      path: `b/${entry.slug}.html`,
      html: renderBlueprintPage(entry, index.taxonomy),
    })),
    ...unitPages(index as IndexWithUnits, page),
  ];
}

export function renderIndexPage(index: CatalogIndex, context: SiteContext = NOTHING): string {
  const blueprints = [...index.blueprints].sort((a, b) => a.slug.localeCompare(b.slug));
  const cards = blueprints.map((entry) => card(entry, index.taxonomy)).join('\n');
  const empty = blueprints.length === 0;
  const units = index as IndexWithUnits;
  const counts = {
    blueprint: blueprints.length,
    expert: (units.experts ?? []).length,
    crew: (units.crews ?? []).length,
    integration: (units.integrations ?? []).length,
  };

  return page({
    title: 'Forgeprint catalog: blueprints, experts, crews and integrations',
    description:
      'Resolved, AI-ready project blueprints for coding agents. One MCP call returns the right context and a tested setup recipe.',
    path: 'catalog.html',
    data: catalogData(units),
    body: `
      <header class="hero">
        <h1>Forgeprint</h1>
        <p class="tagline">${t('tagline')}</p>
        <pre class="install"><code>claude mcp add forgeprint -- npx -y forgeprint-mcp</code></pre>
        <p class="muted small">${t('windows')} <code>claude mcp add forgeprint "--" npx -y forgeprint-mcp</code></p>
        <p class="muted small"><a href="./#what">${t('installOther')}</a></p>
      </header>

      <section class="points">
        <div><h2>${t('pointOneTitle')}</h2><p>${t('pointOne')}</p></div>
        <div><h2>${t('pointTwoTitle')}</h2><p>${t('pointTwo')}</p></div>
        <div><h2>${t('pointThreeTitle')}</h2><p>${t('pointThree')}</p></div>
      </section>

      <section class="catalog">
        <div class="catalog-head">
          <div class="tabs" role="tablist"${attr('aria-label', 'tabsLabel')} hidden>
${tabs(counts)}
          </div>
          <input id="filter" type="search"${attr('placeholder', 'filterPlaceholder')} autocomplete="off"${attr('aria-label', 'filterLabel')} hidden />
        </div>
        ${
          empty
            ? `<p class="muted">${t('catalogEmpty')}</p>`
            : `<div class="cards" id="blueprints" data-kind="blueprint" role="tabpanel" aria-labelledby="tab-blueprints" tabindex="0">
${cards}
</div>`
        }
${panel('expert', expertCards(units))}
${panel('crew', crewCards(units))}
${panel('integration', integrationCards(units))}
        <p id="nothing" class="muted" hidden>${t('nothingMatches')}</p>
      </section>

      <section class="ask">
        <h2>${t('nothingFits')}</h2>
        <p>
          ${t('growsByDemand')} <a href="${REQUEST_URL}">${t('requestBlueprint')}</a>
          ${t('requestRest')}
        </p>
        ${requestList(context.requests, context.requestsFrom)}
      </section>

      ${requestedExperts(units)}

      ${contributors(context.featured)}
    `,
    script: `
      const filter = document.getElementById('filter');
      const nothing = document.getElementById('nothing');
      const panels = Array.from(document.querySelectorAll('.cards'));
      const tablist = document.querySelector('[role="tablist"]');
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

      // One kind at a time. Without JavaScript every panel is visible and the
      // tabs and the filter, which would do nothing, stay hidden: a longer
      // page, not a broken one. They are shown here, once they can work.
      function apply() {
        const active = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
        const kind = active ? active.dataset.kind : 'blueprint';
        const needle = filter ? filter.value.trim().toLowerCase() : '';
        let shown = 0;
        for (const panel of panels) {
          const visible = panel.dataset.kind === kind;
          panel.hidden = !visible;
          if (!visible) continue;
          for (const card of panel.querySelectorAll('.card')) {
            const match = needle === '' || (card.dataset.terms || '').includes(needle);
            card.hidden = !match;
            if (match) shown += 1;
          }
        }
        if (nothing) nothing.hidden = shown > 0;
      }

      function select(kind) {
        const tab = tabs.find((candidate) => candidate.dataset.kind === kind);
        if (!tab) return false;
        for (const other of tabs) {
          other.setAttribute('aria-selected', String(other === tab));
          // Roving tabindex: only the selected tab is in the tab order, and
          // the arrow keys move between the others (WAI-ARIA APG, Tabs).
          other.tabIndex = other === tab ? 0 : -1;
        }
        apply();
        return true;
      }

      const KEYS = { ArrowRight: 1, ArrowLeft: -1 };
      tabs.forEach((tab, position) => {
        tab.addEventListener('keydown', (event) => {
          let next = -1;
          if (event.key in KEYS) next = (position + KEYS[event.key] + tabs.length) % tabs.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = tabs.length - 1;
          if (next < 0) return;
          event.preventDefault();
          const target = tabs[next];
          select(target.dataset.kind);
          history.replaceState(null, '', '#' + target.dataset.kind + 's');
          target.focus();
        });
      });

      // The address names the tab (catalog.html#experts), so a unit page can
      // link back to where its reader came from, and a tab can be shared.
      function fromAddress() {
        select(location.hash.slice(1).replace(/s$/, ''));
      }

      for (const tab of tabs) {
        tab.addEventListener('click', () => {
          select(tab.dataset.kind);
          history.replaceState(null, '', '#' + tab.dataset.kind + 's');
        });
      }
      window.addEventListener('hashchange', fromAddress);
      if (tabs.length > 0) {
        if (tablist) tablist.hidden = false;
        if (filter) filter.hidden = false;
        apply();
        fromAddress();
      }
      if (filter) filter.addEventListener('input', apply);

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
              by.setAttribute('data-i18n', 'site.askedBy');
              by.setAttribute('data-arg-who', item.author);
              by.textContent = 'asked by @' + item.author;
              li.appendChild(document.createTextNode(' '));
              li.appendChild(by);
            }
            list.appendChild(li);
          }
          list.hidden = items.length === 0;
          if (empty) empty.hidden = items.length > 0;
          if (source) source.remove();
          if (window.forgeprintI18n) window.forgeprintI18n.translate(list);
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
    ['languages', entry.languages.map((id) => label('languages', id)).join(', ')],
    ['projectType', label('project_type', entry.project_type)],
    ['stack', entry.stack.map((id) => label('stack', id)).join(', ')],
    ['platforms', entry.platforms.map((id) => label('platforms', id)).join(', ')],
    ['distribution', entry.distribution.map((id) => label('distribution', id)).join(', ')],
    ['setsUp', entry.requirements.map((id) => label('requirements', id)).join(', ')],
    ['audience', entry.audience.map((id) => label('audience', id)).join(', ')],
    ['testedWithRow', entry.agents.map((id) => label('agents', id)).join(', ')],
    ['needs', entry.requires_tools.join(', ') || '—'],
  ] as const;

  return page({
    title: `${entry.name} — Forgeprint`,
    description: entry.summary,
    path: `b/${entry.slug}.html`,
    data: blueprintData(entry),
    body: `
      <p class="back"><a href="../catalog.html#blueprints">${t('allBlueprints')}</a></p>

      <header class="hero blueprint">
        <p class="slug">${escape(entry.slug)}</p>
        <h1>${escape(entry.name)} ${tier(entry.tier)}</h1>
        <p class="tagline" lang="en">${escape(entry.summary)}</p>
        ${entry.deprecated ? `<p class="warn">${t('deprecated')}</p>` : ''}
        ${entry.supersedes === null ? '' : `<p class="muted">${t('supersedes')} <a href="${escape(entry.supersedes)}.html">${escape(entry.supersedes)}</a>.</p>`}
        ${byline(entry.maintainers)}
        ${generatedNotice(entry.provenance)}
        ${derivedFrom(entry.derived_from)}
      </header>

      ${suggested(entry)}

      <section>
        <h2>${t('useIt')}</h2>
        <p>${t('useBlueprint')}</p>
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
        <h2>${t('options')}</h2>
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
        <h2>${t('whatItIs')}</h2>
        <table class="facts">
          ${rows
            .filter(([, value]) => value.length > 0)
            .map(([name, value]) => `<tr><th>${t(name)}</th><td>${escape(value)}</td></tr>`)
            .join('\n          ')}
        </table>
      </section>

      <section>
        <h2>${t('files')}</h2>
        <ul class="files">
          ${entry.files
            .map(
              (file) =>
                `<li><a href="${folder}/${escape(file)}"><code>${escape(file)}</code></a></li>`,
            )
            .join('\n          ')}
        </ul>
        <p class="muted">${t('version', { version: entry.version })} · <a href="${folder}/CHANGELOG.md">${t('changelog')}</a> · <a href="${folder}">${t('folder')}</a></p>
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
  return `<p class="byline">${t('blueprintBy')} ${people}</p>`;
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
        <h2>${t('suggestedAlongside')}</h2>
        <dl class="options">
          ${row(t('mcpServers'), mcp)}
          ${row(t('skills'), skills)}
        </dl>
      </section>`;
}

function generatedNotice(provenance: IndexEntry['provenance']): string {
  if (provenance !== 'generated') return '';
  return `<p class="notice">${t('generatedNotice')}</p>`;
}

function derivedFrom(source: IndexEntry['derived_from']): string {
  if (source === undefined) return '';
  const note = source.note === undefined ? '' : ` ${escape(source.note)}`;
  return `<p class="muted small">${t('derivedFrom')} <a href="${escape(source.url)}">${escape(
    source.url.replace(/^https:\/\//, ''),
  )}</a> (${escape(source.license)}), ${t('read', { date: source.verified_on })}${note}</p>`;
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
            : ` ${t('askedBy', { who: request.author }).replace('<span ', '<span class="muted" ')}`
        }</li>`,
    )
    .join('\n          ');

  const empty = requests.length === 0;
  return `<h3>${t('requestedBlueprints')}</h3>
        <ul class="requests" id="requests"${empty ? ' hidden' : ''}>
          ${items}
        </ul>
        <p class="muted" id="requests-empty"${empty ? '' : ' hidden'}>${t('noRequests')}</p>
        ${from === '' ? '' : `<p class="muted small" id="requests-source">${t('snapshotFrom', { date: from })}</p>`}`;
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
        <h2>${t('featuredTitle')}</h2>
        <p class="muted">${t('featuredBody')}</p>
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
          <p lang="en">${escape(entry.summary)}</p>
          <p class="tags">${tags.map((tag) => `<span>${escape(tag)}</span>`).join('')}</p>
        </article>`;
}

/** One tab per kind. A kind with nothing in it does not get a tab. */
function tabs(counts: Record<string, number>): string {
  const labels = {
    blueprint: 'tabBlueprint',
    expert: 'tabExpert',
    crew: 'tabCrew',
    integration: 'tabIntegration',
  } as const;
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(
      ([kind, count], at) =>
        `            <button type="button" role="tab" id="tab-${escape(kind)}s" aria-controls="${escape(kind)}s" data-kind="${escape(kind)}" aria-selected="${at === 0 ? 'true' : 'false'}" tabindex="${at === 0 ? '0' : '-1'}">${kind in labels ? t(labels[kind as keyof typeof labels]) : escape(kind)} <span class="count">${String(count)}</span></button>`,
    )
    .join('\n');
}

function panel(kind: string, cards: string): string {
  if (cards.trim() === '') return '';
  return `        <div class="cards" id="${escape(kind)}s" data-kind="${escape(kind)}" role="tabpanel" aria-labelledby="tab-${escape(kind)}s" tabindex="0">
${cards}
        </div>`;
}

function tier(name: string): string {
  return name === 'community' ? '' : `<span class="tier ${escape(name)}">${escape(name)}</span>`;
}

interface PageParts {
  readonly title: string;
  readonly description: string;
  /** Where the page is published under docs/, e.g. `e/some-expert.html`. */
  readonly path: string;
  /** schema.org fields for the page's JSON-LD. */
  readonly data: Record<string, unknown>;
  readonly body: string;
  readonly script?: string;
}

function page({ title, description, path, data, body, script }: PageParts): string {
  const up = '../'.repeat(path.split('/').length - 1);
  return `<!doctype html>
<html lang="en" class="no-js">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <link rel="icon" href="${up}brand/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${up}forgeprint.css" />
${headTags({ path, title, description, data })}
  </head>
  <body>
    <header class="topbar">
      <a class="home" href="${up === '' ? './' : up}">${MARK}<span>Forgeprint</span></a>
      <nav class="topnav">
        <a href="${up}catalog.html">${t('catalog')}</a>
        ${languageSwitch()}
      </nav>
    </header>
    ${t('contentNote', {}, 'p class="lang-note"')}
    <main>
${body.trim()}
    </main>
    <footer>
      <a href="${REPOSITORY_URL}">${t('repository')}</a> ·
      <a href="${REPOSITORY_URL}/blob/main/CONTRIBUTING.md">${t('contribute')}</a> ·
      <a href="${up}index.json">index.json</a>
      <p class="muted">${t('licence')}</p>
    </footer>
    <script src="${up}site.js"></script>${
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

/** The mark from brand/forgeprint-mark.svg, inline so it takes the accent colour. */
const MARK =
  '<svg class="mark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M12 10.5 22 16 12 21.5 2 16Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" opacity="0.55"/><path d="M12 2 22 7.5 12 13 2 7.5Z" fill="currentColor"/></svg>';

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
/* The bar every generated page shares: home, catalog, language. */
.topbar { max-width: 54rem; margin: -1.5rem auto 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.topbar .home { display: inline-flex; align-items: center; gap: 0.45rem; min-height: 44px; color: var(--fg); font-weight: 650; text-decoration: none; }
.topbar .mark { color: var(--accent); }
.topnav { display: flex; align-items: center; gap: 1rem; }
.topnav > a { display: inline-flex; align-items: center; min-height: 44px; color: var(--muted); text-decoration: none; }
.topnav > a:hover { color: var(--fg); }
.lang { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; }
.lang button { font: inherit; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; min-width: 44px; min-height: 44px; padding: 0 0.75rem; border: 0; background: transparent; color: var(--muted); cursor: pointer; transition: background 140ms ease-out, color 140ms ease-out; }
.lang button:hover { color: var(--fg); }
.lang button[aria-pressed=true] { background: var(--accent); color: #fff; }
.topbar a:focus-visible, .lang button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
/* In any language but English, say once that entries stay in English. */
.lang-note { display: none; max-width: 54rem; margin: -1.25rem auto 2rem; font-size: 0.9rem; color: var(--muted); border-left: 3px solid var(--accent); padding-left: 0.8rem; }
html:not([lang="en"]) .lang-note { display: block; }
/* The switch needs its script; without it, it is not offered. */
.no-js .lang { display: none; }
@media (prefers-reduced-motion: reduce) { .lang button { transition: none; } }
/* Author display rules (.cards is a grid) beat the browser's own [hidden], so
   without this a hidden panel stays on screen and the tabs do nothing. */
[hidden] { display: none !important; }
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

/* Tabs. One kind at a time; without JavaScript every panel shows, which is a
   longer page and not a broken one. */
.tabs { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.tabs button {
  font: inherit; font-size: 0.9rem; color: var(--muted); cursor: pointer;
  background: none; border: 1px solid transparent; border-radius: 999px;
  padding: 0.35rem 0.8rem; min-height: 2.75rem;
  transition: color 150ms ease-out, border-color 150ms ease-out;
}
.tabs button:hover { color: var(--fg); }
.tabs button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tabs button[aria-selected='true'] { color: var(--fg); border-color: var(--accent); }
.tabs .count { color: var(--muted); font-variant-numeric: tabular-nums; }
.tabs button[aria-selected='true'] .count { color: var(--accent); }
.cards { display: grid; gap: 0.9rem; margin-top: 1rem; }

/* Agent badges. Two states only — tested, or unknown — and the state is
   carried by the mark and the label as well as by the colour. */
.agents { display: flex; flex-wrap: wrap; gap: 0.3rem; margin: 0.6rem 0 0; }
.agent {
  font-size: 0.75rem; border-radius: 999px; padding: 0.05rem 0.5rem;
  border: 1px solid var(--line); color: var(--muted);
}
.agent.tested { border-color: var(--accent); color: var(--accent); }
.byline-small { color: var(--muted); font-size: 0.85rem; margin: 0 0 0.3rem; }
.needs-secret { border-color: var(--accent) !important; color: var(--accent) !important; }
.open-roles span { font-size: 0.75rem; color: var(--muted); }
`;
