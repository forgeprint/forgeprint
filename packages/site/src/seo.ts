/**
 * What search engines and AI crawlers read.
 *
 * Every page carries an absolute canonical URL, Open Graph and Twitter tags,
 * and a JSON-LD description of what it is. Alongside the pages the build
 * publishes `sitemap.xml` and `llms.txt` (llmstxt.org): the second is the
 * catalog as a model would want it, one line per entry with its page and its
 * summary, and how to connect.
 *
 * All of it is derived from the index, so it cannot drift from the catalog,
 * and all of it is deterministic, so `build-site --check` can hold it.
 */
import type { IndexWithUnits } from './units.js';

/** Where Pages serves the site. The landing page's canonical says the same. */
export const SITE_URL = 'https://forgeprint.github.io/forgeprint/';

const IMAGE = `${SITE_URL}brand/forgeprint-avatar-512.png`;
const REPOSITORY = 'https://github.com/forgeprint/forgeprint';

function attribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * JSON-LD inside a script element. `<`, `>` and `&` are written as escapes, so
 * no summary can close the element or open another; a JSON parser reads them
 * back unchanged.
 */
function jsonLd(data: Record<string, unknown>): string {
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
  return `<script type="application/ld+json">${json}</script>`;
}

export interface HeadParts {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  /** schema.org fields for this page; `url` and `@context` are added here. */
  readonly data: Record<string, unknown>;
}

/** The tags a crawler reads, for one page. */
export function headTags({ path, title, description, data }: HeadParts): string {
  const url = `${SITE_URL}${path}`;
  const up = '../'.repeat(path.split('/').length - 1);
  return [
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" type="application/json" href="${up}index.json" title="The catalog as JSON" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Forgeprint" />`,
    `<meta property="og:title" content="${attribute(title)}" />`,
    `<meta property="og:description" content="${attribute(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${IMAGE}" />`,
    `<meta name="twitter:card" content="summary" />`,
    jsonLd({
      ...data,
      url,
      name: data.name ?? title,
      description: data.description ?? description,
    }),
  ]
    .map((line) => `    ${line}`)
    .join('\n');
}

const LICENCE = 'https://creativecommons.org/licenses/by/4.0/';
const people = (handles: readonly string[]): Record<string, string>[] =>
  handles.map((handle) => ({
    '@type': 'Person',
    name: `@${handle}`,
    url: `https://github.com/${handle}`,
  }));

/** A blueprint is source: files in a folder that a recipe turns into a project. */
export function blueprintData(entry: {
  slug: string;
  name: string;
  summary: string;
  version: string;
  maintainers: readonly string[];
  languages: readonly string[];
}): Record<string, unknown> {
  return {
    '@type': 'SoftwareSourceCode',
    name: entry.name,
    description: entry.summary,
    version: entry.version,
    programmingLanguage: entry.languages,
    codeRepository: `${REPOSITORY}/tree/main/blueprints/${entry.slug}`,
    license: LICENCE,
    author: people(entry.maintainers),
    isPartOf: { '@type': 'WebSite', name: 'Forgeprint', url: SITE_URL },
  };
}

/** An expert, crew or integration is a document about how to work, or what to install. */
export function unitData(
  kind: 'expert' | 'crew' | 'integration',
  entry: {
    slug: string;
    name: string;
    summary: string;
    version?: string;
    maintainers: readonly string[];
  },
): Record<string, unknown> {
  const folder = { expert: 'experts', crew: 'crews', integration: 'integrations' }[kind];
  return {
    '@type': 'TechArticle',
    headline: entry.name,
    name: entry.name,
    description: entry.summary,
    ...(entry.version === undefined ? {} : { version: entry.version }),
    genre: kind,
    license: LICENCE,
    author: people(entry.maintainers),
    sameAs: `${REPOSITORY}/tree/main/${folder}/${entry.slug}`,
    isPartOf: { '@type': 'WebSite', name: 'Forgeprint', url: SITE_URL },
  };
}

/** The catalog page lists everything; its JSON-LD says how many of each. */
export function catalogData(index: IndexWithUnits): Record<string, unknown> {
  const entries = catalogEntries(index);
  return {
    '@type': 'CollectionPage',
    name: 'The Forgeprint catalog',
    isPartOf: { '@type': 'WebSite', name: 'Forgeprint', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, position) => ({
        '@type': 'ListItem',
        position: position + 1,
        name: entry.name,
        url: `${SITE_URL}${entry.path}`,
      })),
    },
  };
}

interface Listed {
  readonly kind: string;
  readonly name: string;
  readonly summary: string;
  readonly path: string;
}

function catalogEntries(index: IndexWithUnits): Listed[] {
  const live = <T extends { deprecated?: boolean; slug: string }>(
    list: readonly T[] | undefined,
  ): T[] =>
    [...(list ?? [])]
      .filter((entry) => entry.deprecated !== true)
      .sort((a, b) => a.slug.localeCompare(b.slug));
  return [
    ...live(index.blueprints).map((e) => ({
      kind: 'Blueprints',
      name: e.name,
      summary: e.summary,
      path: `b/${e.slug}.html`,
    })),
    ...live(index.experts).map((e) => ({
      kind: 'Experts',
      name: e.name,
      summary: e.summary,
      path: `e/${e.slug}.html`,
    })),
    ...live(index.crews).map((e) => ({
      kind: 'Crews',
      name: e.name,
      summary: e.summary,
      path: `c/${e.slug}.html`,
    })),
    ...live(index.integrations).map((e) => ({
      kind: 'Integrations',
      name: e.name,
      summary: e.summary,
      path: `i/${e.slug}.html`,
    })),
  ];
}

/** Every page, the landing page first. No dates: a sitemap that changes on every build is noise. */
export function sitemap(paths: readonly string[]): string {
  const urls = ['', ...paths.filter((path) => path.endsWith('.html'))]
    .map((path) => `  <url><loc>${attribute(`${SITE_URL}${path}`)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/** The catalog for a model: llmstxt.org, one line per entry. */
export function llmsText(index: IndexWithUnits): string {
  const entries = catalogEntries(index);
  const sections = ['Blueprints', 'Experts', 'Crews', 'Integrations']
    .map((kind) => {
      const lines = entries
        .filter((entry) => entry.kind === kind)
        .map((entry) => `- [${entry.name}](${SITE_URL}${entry.path}): ${entry.summary}`);
      return lines.length === 0 ? '' : `## ${kind}\n\n${lines.join('\n')}\n`;
    })
    .filter((section) => section !== '');

  return `# Forgeprint

> A catalog and MCP server for coding agents. Say what you know and what you are building; Forgeprint returns exactly one blueprint with a CI-tested, step-by-step setup recipe, and the experts, crews and integrations to work on it with. It installs nothing and runs nothing: every tool returns text.

Connect an agent over MCP with \`npx -y forgeprint-mcp\` (for example \`claude mcp add forgeprint -- npx -y forgeprint-mcp\`). Start with the \`resolve\` tool before writing code for a new project. The whole catalog is also published as JSON: ${SITE_URL}index.json

Blueprints answer what is being built, experts how the agent should work, integrations with which tools, and a crew packages experts and integrations under a name. Catalog content is English and CC BY 4.0.

${sections.join('\n')}
## Docs

- [How the MCP server behaves](${REPOSITORY}/blob/main/docs/mcp.md): the tools, how resolve decides, and how to connect each agent
- [README](${REPOSITORY}/blob/main/README.md): what Forgeprint is and how it differs
- [Contributing](${REPOSITORY}/blob/main/CONTRIBUTING.md): what each kind of entry has to contain

## Optional

- [Catalog index](${SITE_URL}index.json): every entry with its manifest fields, as JSON
- [Agent registry](${REPOSITORY}/blob/main/schema/agents.yaml): what each of the nine agents reads, and when it was last checked
`;
}
