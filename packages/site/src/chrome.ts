/**
 * The words around the catalog, and the switch that translates them.
 *
 * CLAUDE.md §9: the catalog is English only, and the site translates its
 * chrome — headings, labels, buttons, notes — so a reader can move around in
 * their own language while every entry stays as it was written. This file is
 * the English for that chrome. The page is rendered in English, so it reads
 * with the script blocked; `site.js` swaps each marked element for the
 * reader's language from `docs/i18n/<lang>.json` (the `site` section), and
 * puts the English back when they switch again.
 *
 * A key used on a page and missing from a dictionary is a test failure, not a
 * page that silently stays half in English.
 */

export const CHROME = {
  home: 'Forgeprint',
  catalog: 'Catalog',
  language: 'Language',
  languageHint: 'Interface language. Catalog entries stay in English.',
  repository: 'Repository',
  contribute: 'Contribute',
  licence:
    'Source-available, not OSI open source: tooling under PolyForm Shield 1.0.0, catalog content under CC BY 4.0.',

  // The catalog page.
  tagline:
    'Tell your agent who you are and what you are building — get back one blueprint and a setup recipe it can execute.',
  installOther: 'Using another agent? The home page has the command for each of the nine.',
  windows: 'On Windows PowerShell, quote the separator:',
  pointOneTitle: 'One answer',
  pointOne:
    'Describe yourself and your goal. The resolver returns a single blueprint, or the questions it still needs answered — never a list to sift through.',
  pointTwoTitle: 'A recipe, not a description',
  pointTwo:
    'Every step is one command with a verification after it, versions pinned. CI runs the recipes; a blueprint whose setup fails is not merged.',
  pointThreeTitle: 'Curated, not collected',
  pointThree:
    'One blueprint per stack, project type and requirements. A better one replaces the old one instead of sitting next to it.',
  tabsLabel: 'What to browse',
  tabBlueprint: 'Blueprints',
  tabExpert: 'Experts',
  tabCrew: 'Crews',
  tabIntegration: 'Integrations',
  filterPlaceholder: 'Filter by language, stack, role…',
  filterLabel: 'Filter the catalog',
  catalogEmpty: 'The catalog is empty.',
  nothingMatches: 'Nothing matches that.',
  nothingFits: 'Nothing fits?',
  growsByDemand: 'The catalog grows by demand.',
  requestBlueprint: 'Request a blueprint',
  requestRest: 'and say what is missing — requests are public, and somebody may pick yours up.',
  requestedBlueprints: 'Requested blueprints',
  askedBy: 'asked by @{who}',
  noRequests: 'No open requests right now.',
  snapshotFrom: 'Snapshot from {date}.',
  featuredTitle: 'Featured contributors',
  featuredBody: 'The catalog is written by people. These are the ones who wrote what is in it.',
  rolesOpen: '{n} roles with no expert yet',
  rolesBody:
    'The role list is wider than the catalog on purpose. Every name below is a slot somebody could fill —',
  rolesWrite: 'write one',
  rolesRest: 'and it appears here instead.',
  pinned: 'pinned {version}',
  hosted: 'hosted, checked {date}',
  hostedCannotPin: 'Hosted by the vendor: it cannot be pinned, and can change at any time.',
  needsSecret: 'needs 1 secret',
  needsSecrets: 'needs {n} secrets',
  agentVerification: 'Agent verification',
  testedWith: 'Tested with {agent}',
  notTested: '{agent}: not tested',

  // Every entry page.
  allBlueprints: '← all blueprints',
  allExperts: '← all experts',
  allCrews: '← all crews',
  allIntegrations: '← all integrations',
  whatItIs: 'What it is',
  useIt: 'Use it',
  readIt: 'Read it',
  maintainers: 'Maintainers',
  languages: 'Languages',
  stack: 'Stack',
  generatedShort: 'Generated, not manually verified.',
  communityShort: 'Community entry: read it before you rely on it.',

  // A blueprint page.
  deprecated: 'Deprecated. It is no longer offered by the resolver.',
  supersedes: 'Supersedes',
  blueprintBy: 'Blueprint by',
  generatedNotice:
    'Generated, CI-tested, not manually verified. The setup steps run; nobody has reviewed them by hand.',
  derivedFrom: 'Derived from',
  read: 'read {date}.',
  suggestedAlongside: 'Suggested alongside',
  mcpServers: 'MCP servers',
  skills: 'Skills',
  useBlueprint: 'Ask your agent for it by name, or let resolve find it from your profile.',
  options: 'Options',
  projectType: 'Project type',
  platforms: 'Platforms',
  distribution: 'Distribution',
  setsUp: 'Sets up',
  audience: 'Audience',
  testedWithRow: 'Tested with',
  needs: 'Needs',
  files: 'Files',
  version: 'Version {version}',
  changelog: 'changelog',
  folder: 'folder on GitHub',

  // An expert page.
  role: 'Role',
  domain: 'Domain',
  seniority: 'Seniority',
  produces: 'What it produces',
  checks: 'What it checks',
  pairsWith: 'Pairs with',
  useExpert: 'Or ask an agent connected to the Forgeprint MCP for get_expert.',

  // A crew page.
  forWhat: 'What it is for',
  whereWrong: 'Where it is wrong',
  members: 'Members',
  integrations: 'Integrations',
  useCrew:
    'Ask an agent connected to the Forgeprint MCP for get_crew with this slug. A crew is a recommendation with a name on it, not a requirement.',

  // An integration page.
  thirdPartyTitle: 'Third-party software.',
  thirdParty:
    'Forgeprint hosts none of this code: it is an installation recipe for a project somebody else publishes and maintains. Review the permissions below before installing.',
  upstream: 'Upstream',
  project: 'Project',
  pinnedAt: 'Pinned at',
  verifiedOn: 'Verified on',
  reach: 'What it can reach',
  noSecret: 'It needs no secret.',
  needsIntro: 'It needs',
  secretRest:
    'Create it at the upstream with the narrowest scope that works and put it in your environment — an agent never enters a secret for you.',
  install: 'Install',
  contentNote: 'Catalog entries are written once, in English. Your browser can translate them.',
  installNote:
    'Only agents whose command syntax has been verified are listed. A missing agent is one nobody has confirmed, not one that does not work.',
} as const;

export type ChromeKey = keyof typeof CHROME;
type Values = Readonly<Record<string, string | number>>;

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fill(template: string, values: Values): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

/** The value of each placeholder, carried on the element for the script. */
function args(values: Values): string {
  return Object.entries(values)
    .map(([name, value]) => ` data-arg-${name}="${escapeText(String(value))}"`)
    .join('');
}

/**
 * Translatable text: an element the script can swap, English inside. `tag` may
 * carry attributes (`p class="note"`); the closing tag uses the name alone.
 */
export function t(key: ChromeKey, values: Values = {}, tag = 'span'): string {
  const name = tag.split(' ')[0] ?? 'span';
  return `<${tag} data-i18n="site.${key}"${args(values)}>${escapeText(fill(CHROME[key], values))}</${name}>`;
}

/** A translatable attribute, English as its value, e.g. placeholder or title. */
export function attr(name: string, key: ChromeKey, values: Values = {}): string {
  return ` ${name}="${escapeText(fill(CHROME[key], values))}" data-i18n-${name}="site.${key}"${args(values)}`;
}

/** Every chrome key a page uses, for the test that holds the dictionaries to it. */
export function keysIn(html: string): string[] {
  return [...html.matchAll(/data-i18n(?:-[a-z-]+)?="site\.(\w+)"/g)].map((match) => match[1] ?? '');
}

/** The switch, the same on every page. */
export function languageSwitch(): string {
  return `<div class="lang" role="group"${attr('aria-label', 'language')}${attr('title', 'languageHint')}>
          <button type="button" data-lang="en" aria-pressed="true">EN</button>
          <button type="button" data-lang="tr" aria-pressed="false">TR</button>
        </div>`;
}

/**
 * The script behind the switch. Published as `docs/site.js`, next to the
 * dictionaries the landing page already reads, and under the same storage key,
 * so a language chosen on one page is the language of the next.
 */
export const SITE_SCRIPT = `/* Generated by packages/site (chrome.ts). Do not edit by hand. */
(function () {
  'use strict';
  var KEY = 'forgeprint.lang';
  var LANGS = ['en', 'tr'];
  var ATTRS = ['placeholder', 'aria-label', 'title'];
  var base = new URL('.', document.currentScript.src);
  var english = new Map();
  var dictionary = {};
  var current = 'en';

  document.documentElement.classList.remove('no-js');

  function recall() {
    try { return localStorage.getItem(KEY); } catch (error) { return null; }
  }
  function remember(lang) {
    try { localStorage.setItem(KEY, lang); } catch (error) { /* a convenience only */ }
  }
  function preferred() {
    var stored = recall();
    if (stored && LANGS.indexOf(stored) >= 0) return stored;
    var tags = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < tags.length; i++) {
      var baseTag = String(tags[i]).toLowerCase().split('-')[0];
      if (LANGS.indexOf(baseTag) >= 0) return baseTag;
    }
    return 'en';
  }
  function fill(template, element) {
    return String(template).replace(/\\{(\\w+)\\}/g, function (match, name) {
      var value = element.getAttribute('data-arg-' + name);
      return value === null ? match : value;
    });
  }
  function saved(element) {
    if (!english.has(element)) {
      var original = { text: element.textContent };
      ATTRS.forEach(function (name) { original[name] = element.getAttribute(name); });
      english.set(element, original);
    }
    return english.get(element);
  }
  function word(key) {
    var name = String(key).replace(/^site\\./, '');
    return Object.prototype.hasOwnProperty.call(dictionary, name) ? dictionary[name] : null;
  }

  // Also called by a page's own script for text it adds after loading.
  function translate(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (element) {
      var original = saved(element);
      var value = current === 'en' ? null : word(element.getAttribute('data-i18n'));
      element.textContent = value === null ? original.text : fill(value, element);
    });
    ATTRS.forEach(function (name) {
      (root || document).querySelectorAll('[data-i18n-' + name + ']').forEach(function (element) {
        var original = saved(element);
        var value = current === 'en' ? null : word(element.getAttribute('data-i18n-' + name));
        element.setAttribute(name, value === null ? original[name] : fill(value, element));
      });
    });
  }

  function show(lang) {
    current = lang;
    document.documentElement.lang = lang;
    translate(document);
    document.querySelectorAll('.lang button').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-lang') === lang));
    });
  }

  function setLanguage(lang, store) {
    if (store) remember(lang);
    if (lang === 'en') { dictionary = {}; show('en'); return; }
    fetch(new URL('i18n/' + lang + '.json', base), { cache: 'no-cache' })
      .then(function (response) { return response.ok ? response.json() : Promise.reject(response.status); })
      .then(function (data) { dictionary = (data && data.site) || {}; show(lang); })
      // No dictionary: the English already on the page stays, which is the
      // honest failure.
      .catch(function () {});
  }

  window.forgeprintI18n = { translate: translate };

  document.querySelectorAll('.lang button').forEach(function (button) {
    button.addEventListener('click', function () { setLanguage(button.getAttribute('data-lang'), true); });
  });
  var first = preferred();
  if (first !== 'en') setLanguage(first, false);
})();
`;
