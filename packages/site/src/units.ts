/**
 * The catalog's other three kinds, as pages.
 *
 * Same rules as `render.ts`: everything comes from `docs/index.json`, the
 * output is deterministic, and nothing is fetched before the page can show
 * something (ADR 0002).
 */

import type { CatalogIndex, Taxonomy } from 'forgeprint';
import { attr, t } from './chrome.js';
import { unitData } from './seo.js';

export interface ExpertEntry {
  slug: string;
  name: string;
  summary: string;
  role: string;
  domain: string;
  seniority: string;
  languages?: readonly string[];
  stack?: readonly string[];
  deliverables: readonly string[];
  checklists: readonly string[];
  pairs_with?: readonly string[];
  agents: readonly string[];
  tier: string;
  provenance?: 'human' | 'generated';
  maintainers: readonly string[];
  deprecated: boolean;
  files: readonly string[];
}

export interface CrewEntry {
  slug: string;
  name: string;
  summary: string;
  byline: string;
  members: readonly string[];
  integrations?: readonly string[];
  for_what: string;
  not_for: string;
  agents: readonly string[];
  tier: string;
  maintainers: readonly string[];
  deprecated: boolean;
}

export interface IntegrationEntry {
  slug: string;
  name: string;
  summary: string;
  kind: string;
  upstream: string;
  upstream_version: string;
  verified_on: string;
  install: Record<string, string>;
  needs_secrets?: readonly string[];
  permissions_summary: string;
  fits: readonly string[];
  agents: readonly string[];
  tier: string;
  maintainers: readonly string[];
  deprecated: boolean;
}

export interface AgentEntry {
  id: string;
  name: string;
  kind: 'cli' | 'ide';
  headless: boolean;
  docs: string;
}

export type IndexWithUnits = CatalogIndex & {
  agents?: readonly AgentEntry[];
  experts?: readonly ExpertEntry[];
  crews?: readonly CrewEntry[];
  integrations?: readonly IntegrationEntry[];
};

/**
 * Agent badges.
 *
 * Two states and only two: tested, or unknown. There is deliberately no third
 * colour meaning "probably works", because `agents[]` in a manifest means
 * somebody verified it and nothing weaker (ADR 0013).
 *
 * The state is carried by a mark and by the label as well as by the colour —
 * colour alone is not information a reader can rely on.
 */
export function agentBadges(claimed: readonly string[], agents: readonly AgentEntry[]): string {
  if (agents.length === 0) return '';
  const tested = new Set(claimed);
  const chips = agents
    .map((agent) => {
      const yes = tested.has(agent.id);
      const title = attr('title', yes ? 'testedWith' : 'notTested', { agent: agent.name });
      return `<span class="agent${yes ? ' tested' : ''}"${title}><span aria-hidden="true">${yes ? '✓' : '·'}</span> ${escape(agent.name)}</span>`;
    })
    .join('');
  return `<p class="agents"${attr('aria-label', 'agentVerification')}>${chips}</p>`;
}

/** Cards for one kind, for the catalog page. */
export function expertCards(index: IndexWithUnits): string {
  const agents = index.agents ?? [];
  return [...(index.experts ?? [])]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((entry) => {
      const terms = [
        entry.slug,
        entry.name,
        entry.summary,
        entry.role,
        entry.domain,
        entry.seniority,
        ...(entry.languages ?? []),
        ...(entry.stack ?? []),
        ...entry.deliverables,
      ]
        .join(' ')
        .toLowerCase();
      const tags = [entry.domain, entry.seniority, ...(entry.languages ?? [])];
      return `        <article class="card${entry.deprecated ? ' deprecated' : ''}" data-terms="${escape(terms)}">
          <h3><a href="e/${escape(entry.slug)}.html">${escape(entry.name)}</a> ${tier(entry.tier)}</h3>
          <p lang="en">${escape(entry.summary)}</p>
          <p class="tags">${tags.map((tag) => `<span>${escape(tag)}</span>`).join('')}</p>
          ${agentBadges(entry.agents, agents)}
        </article>`;
    })
    .join('\n');
}

export function crewCards(index: IndexWithUnits): string {
  const agents = index.agents ?? [];
  return [...(index.crews ?? [])]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((entry) => {
      const terms = [
        entry.slug,
        entry.name,
        entry.summary,
        entry.for_what,
        ...entry.members,
        ...(entry.integrations ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return `        <article class="card${entry.deprecated ? ' deprecated' : ''}" data-terms="${escape(terms)}">
          <h3><a href="c/${escape(entry.slug)}.html">${escape(entry.name)}</a> ${tier(entry.tier)}</h3>
          <p class="byline-small">${escape(entry.byline)}</p>
          <p lang="en">${escape(entry.summary)}</p>
          <p class="tags">${entry.members.map((member) => `<span>${escape(member)}</span>`).join('')}</p>
          ${agentBadges(entry.agents, agents)}
        </article>`;
    })
    .join('\n');
}

export function integrationCards(index: IndexWithUnits): string {
  return [...(index.integrations ?? [])]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((entry) => {
      const terms = [entry.slug, entry.name, entry.summary, entry.kind, ...entry.fits]
        .join(' ')
        .toLowerCase();
      const secrets = (entry.needs_secrets ?? []).length;
      return `        <article class="card${entry.deprecated ? ' deprecated' : ''}" data-terms="${escape(terms)}">
          <h3><a href="i/${escape(entry.slug)}.html">${escape(entry.name)}</a> <span class="tier">${escape(entry.kind)}</span></h3>
          <p lang="en">${escape(entry.summary)}</p>
          <p class="tags">${t('pinned', { version: entry.upstream_version })}${entry.fits.map((fit) => `<span>${escape(fit)}</span>`).join('')}${secrets === 0 ? '' : secrets === 1 ? t('needsSecret').replace('<span ', '<span class="needs-secret" ') : t('needsSecrets', { n: secrets }).replace('<span ', '<span class="needs-secret" ')}</p>
        </article>`;
    })
    .join('\n');
}

/**
 * The roles nobody has filled.
 *
 * The role list is deliberately wider than the catalog, and this is why: an
 * empty role is a contribution call rather than a gap to be embarrassed about
 * (ADR 0012). Publishing it is the mechanism by which the non-software domains
 * get contributors at all.
 */
export function requestedExperts(index: IndexWithUnits): string {
  const roles: Record<string, string> = index.taxonomy.roles;
  const filled = new Set((index.experts ?? []).map((expert) => expert.role));
  const open = Object.entries(roles)
    .filter(([id]) => !filled.has(id))
    .map(([, label]) => label)
    .sort();
  if (open.length === 0) return '';

  return `
      <section class="ask">
        ${t('rolesOpen', { n: open.length }, 'h2')}
        <p>
          ${t('rolesBody')} <a href="https://github.com/forgeprint/forgeprint/blob/main/CONTRIBUTING.md">${t('rolesWrite')}</a>
          ${t('rolesRest')}
        </p>
        <p class="tags open-roles">${open.map((role) => `<span>${escape(role)}</span>`).join('')}</p>
      </section>`;
}

/** Pages for the three kinds, keyed by their path under `docs/`. */
export function unitPages(
  index: IndexWithUnits,
  page: (parts: {
    title: string;
    description: string;
    path: string;
    data: Record<string, unknown>;
    body: string;
  }) => string,
): { path: string; html: string }[] {
  const agents = index.agents ?? [];
  const pages: { path: string; html: string }[] = [];

  for (const expert of index.experts ?? []) {
    pages.push({
      path: `e/${expert.slug}.html`,
      html: page({
        title: `${expert.name} — Forgeprint`,
        description: expert.summary,
        path: `e/${expert.slug}.html`,
        data: unitData('expert', expert),
        body: expertBody(expert, agents, index.taxonomy),
      }),
    });
  }

  for (const crew of index.crews ?? []) {
    pages.push({
      path: `c/${crew.slug}.html`,
      html: page({
        title: `${crew.name} — Forgeprint`,
        description: crew.summary,
        path: `c/${crew.slug}.html`,
        data: unitData('crew', crew),
        body: crewBody(crew, agents),
      }),
    });
  }

  for (const integration of index.integrations ?? []) {
    pages.push({
      path: `i/${integration.slug}.html`,
      html: page({
        title: `${integration.name} — Forgeprint`,
        description: integration.summary,
        path: `i/${integration.slug}.html`,
        data: unitData('integration', integration),
        body: integrationBody(integration, agents),
      }),
    });
  }

  return pages;
}

const SOURCE = 'https://github.com/forgeprint/forgeprint/tree/main';

function expertBody(entry: ExpertEntry, agents: readonly AgentEntry[], taxonomy: Taxonomy): string {
  const label = (vocabulary: Record<string, string> | undefined, id: string): string =>
    vocabulary?.[id] ?? id;
  const languages = entry.languages ?? [];
  const stack = entry.stack ?? [];
  const pairs = entry.pairs_with ?? [];
  return `
      <p class="back"><a href="../catalog.html#experts">${t('allExperts')}</a></p>
      <p class="slug">experts/${escape(entry.slug)}</p>
      <h1>${escape(entry.name)} ${tier(entry.tier)}</h1>
      <p class="tagline" lang="en">${escape(entry.summary)}</p>
      ${provenanceNote(entry.provenance, entry.tier)}
      ${agentBadges(entry.agents, agents)}

      <h2>${t('whatItIs')}</h2>
      <table class="facts">
        <tr><th>${t('role')}</th><td>${escape(label(taxonomy.roles, entry.role))}</td></tr>
        <tr><th>${t('domain')}</th><td>${escape(label(taxonomy.domains, entry.domain))}</td></tr>
        <tr><th>${t('seniority')}</th><td>${escape(label(taxonomy.seniority, entry.seniority))}</td></tr>
        ${languages.length === 0 ? '' : `<tr><th>${t('languages')}</th><td>${languages.map((id) => escape(label(taxonomy.languages, id))).join(', ')}</td></tr>`}
        ${stack.length === 0 ? '' : `<tr><th>${t('stack')}</th><td>${stack.map((id) => escape(label(taxonomy.stack, id))).join(', ')}</td></tr>`}
        <tr><th>${t('maintainers')}</th><td>${entry.maintainers.map((who) => `<a href="https://github.com/${escape(who)}">@${escape(who)}</a>`).join(', ')}</td></tr>
      </table>

      <h2>${t('produces')}</h2>
      <p class="tags">${entry.deliverables.map((one) => `<span>${escape(label(taxonomy.deliverables, one))}</span>`).join('')}</p>

      <h2>${t('checks')}</h2>
      <ul class="files">${entry.checklists.map((one) => `<li><a href="${SOURCE}/experts/${escape(entry.slug)}/checklists/${escape(one)}.md">${escape(one)}</a></li>`).join('')}</ul>

      ${pairs.length === 0 ? '' : `<h2>${t('pairsWith')}</h2>\n      <p class="tags">${pairs.map((one) => `<span><a href="${escape(one)}.html">${escape(one)}</a></span>`).join('')}</p>`}

      <h2>${t('readIt')}</h2>
      <p><a href="${SOURCE}/experts/${escape(entry.slug)}/SKILL.md">SKILL.md</a> ·
         <a href="${SOURCE}/experts/${escape(entry.slug)}/overview.md">overview.md</a> ·
         <a href="${SOURCE}/experts/${escape(entry.slug)}/references.md">references.md</a></p>

      <h2>${t('useIt')}</h2>
      <pre class="install"><code>npx forgeprint get ${escape(entry.slug)} --expert --agent claude-code</code></pre>
      <p class="muted small">${t('useExpert')}</p>`;
}

function crewBody(entry: CrewEntry, agents: readonly AgentEntry[]): string {
  const integrations = entry.integrations ?? [];
  return `
      <p class="back"><a href="../catalog.html#crews">${t('allCrews')}</a></p>
      <p class="slug">crews/${escape(entry.slug)}</p>
      <h1>${escape(entry.name)} ${tier(entry.tier)}</h1>
      <p class="byline">${escape(entry.byline)}</p>
      <p class="tagline" lang="en">${escape(entry.summary)}</p>
      ${agentBadges(entry.agents, agents)}

      <h2>${t('forWhat')}</h2>
      <p lang="en">${escape(entry.for_what)}</p>

      <h2>${t('whereWrong')}</h2>
      <p class="warn" lang="en">${escape(entry.not_for)}</p>

      <h2>${t('members')}</h2>
      <ul class="files">${entry.members.map((member) => `<li><a href="../e/${escape(member)}.html">${escape(member)}</a></li>`).join('')}</ul>

      ${integrations.length === 0 ? '' : `<h2>${t('integrations')}</h2>\n      <ul class="files">${integrations.map((one) => `<li><a href="../i/${escape(one)}.html">${escape(one)}</a></li>`).join('')}</ul>`}

      <h2>${t('readIt')}</h2>
      <p><a href="${SOURCE}/crews/${escape(entry.slug)}/README.md">README.md</a></p>

      <h2>${t('useIt')}</h2>
      <p class="muted">${t('useCrew')} <code>get_crew { "slug": "${escape(entry.slug)}" }</code></p>`;
}

function integrationBody(entry: IntegrationEntry, agents: readonly AgentEntry[]): string {
  const nameOf = (id: string): string => agents.find((agent) => agent.id === id)?.name ?? id;
  const secrets = entry.needs_secrets ?? [];
  const commands = Object.entries(entry.install)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([agent, command]) =>
        `<h3>${escape(nameOf(agent))}</h3>\n      <pre class="install"><code>${escape(command)}</code></pre>`,
    )
    .join('\n      ');

  return `
      <p class="back"><a href="../catalog.html#integrations">${t('allIntegrations')}</a></p>
      <p class="slug">integrations/${escape(entry.slug)}</p>
      <h1>${escape(entry.name)} <span class="tier">${escape(entry.kind)}</span></h1>
      <p class="tagline" lang="en">${escape(entry.summary)}</p>

      <p class="warn">
        ${t('thirdPartyTitle', {}, 'strong')} ${t('thirdParty')}
      </p>

      <h2>${t('upstream')}</h2>
      <table class="facts">
        <tr><th>${t('project')}</th><td><a href="${escape(entry.upstream)}">${escape(entry.upstream.replace('https://github.com/', ''))}</a></td></tr>
        <tr><th>${t('pinnedAt')}</th><td><code>${escape(entry.upstream_version)}</code></td></tr>
        <tr><th>${t('verifiedOn')}</th><td>${escape(entry.verified_on)}</td></tr>
      </table>

      <h2>${t('reach')}</h2>
      <p lang="en">${escape(entry.permissions_summary)}</p>
      ${
        secrets.length === 0
          ? `<p class="muted">${t('noSecret')}</p>`
          : `<p>${t('needsIntro')} ${secrets.map((secret) => `<code>${escape(secret)}</code>`).join(', ')}. ${t('secretRest')}</p>`
      }

      <h2>${t('install')}</h2>
      ${commands}
      <p class="muted small">${t('installNote')}</p>

      <h2>${t('readIt')}</h2>
      <p><a href="${SOURCE}/integrations/${escape(entry.slug)}/README.md">README.md</a></p>`;
}

function provenanceNote(provenance: string | undefined, tierName: string): string {
  const notes: string[] = [];
  if (provenance === 'generated') notes.push(t('generatedShort'));
  if (tierName === 'community') notes.push(t('communityShort'));
  return notes.length === 0 ? '' : `<p class="warn">${notes.join(' ')}</p>`;
}

function tier(name: string): string {
  return name === 'community' ? '' : `<span class="tier ${escape(name)}">${escape(name)}</span>`;
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
