/*
 * The landing page's behaviour: language, the agent picker, the two
 * diagrams, the example conversations, the catalog preview, copy buttons and
 * the scroll reveal.
 *
 * No framework and no build step. The page is readable and usable with this
 * file blocked — English text ships in the HTML, and what genuinely needs
 * JavaScript (the live catalog, the diagrams, the picker) is either hidden
 * without it or says so when it cannot load.
 */
(() => {
  'use strict';

  document.documentElement.classList.remove('no-js');

  const STORE_KEY = 'forgeprint.lang';
  const AGENT_KEY = 'forgeprint.agent';
  const LANGS = ['en', 'tr'];
  const KINDS = ['blueprint', 'expert', 'crew', 'integration'];
  const INDEX_KEYS = {
    blueprint: 'blueprints',
    expert: 'experts',
    crew: 'crews',
    integration: 'integrations',
  };
  const PAGE_DIRS = { blueprint: 'b', expert: 'e', crew: 'c', integration: 'i' };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const dictionaries = Object.create(null);
  let current = 'en';
  let index = null; // null while loading, 'error' when unreadable
  let agentId = 'claude-code';
  let catalogKind = 'blueprint';
  let exampleKind = 'project';

  /* ── Small helpers ─────────────────────────────────────────────────── */

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const dict = () => dictionaries[current] || {};

  /** Read a dotted path out of the dictionary; undefined rather than throwing. */
  function lookup(source, path) {
    return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), source);
  }

  /** A dictionary string, or the fallback when the dictionary has not loaded. */
  function t(path, fallback = '') {
    const value = lookup(dict(), path);
    return typeof value === 'string' ? value : fallback;
  }

  /** Fill {name} placeholders. */
  function fill(template, values) {
    return String(template).replace(/\{(\w+)\}/g, (match, key) =>
      key in values ? String(values[key]) : match,
    );
  }

  /** Browser storage can throw in a private window; a remembered choice is a
      convenience, never a requirement. */
  function remember(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
  function recall(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
    );
  }

  /* ── Agents ────────────────────────────────────────────────────────── */

  // Used until the index arrives, and if it never does. The same facts as
  // schema/agents.yaml; the index replaces them as soon as it is read.
  const AGENTS_FALLBACK = [
    ['claude-code', 'Claude Code', 'Anthropic', 'CLAUDE.md', null, 'stdio/http/sse'],
    ['codex', 'Codex CLI', 'OpenAI', 'AGENTS.md', null, 'stdio/http'],
    ['gemini-cli', 'Gemini CLI', 'Google', 'GEMINI.md', null, 'stdio/http/sse'],
    [
      'copilot-cli',
      'GitHub Copilot CLI',
      'GitHub',
      '.github/copilot-instructions.md',
      null,
      'stdio/http',
    ],
    ['cursor', 'Cursor', 'Anysphere', '.cursor/rules/{slug}.mdc', null, 'stdio/http/sse'],
    ['windsurf', 'Windsurf', 'Cognition', '.windsurf/rules/{slug}.md', 12000, 'stdio/http/sse'],
    ['cline', 'Cline', 'Cline', '.clinerules/{slug}.md', null, 'stdio/http/sse'],
    ['opencode', 'OpenCode', 'SST', 'AGENTS.md', null, 'stdio/http'],
    ['kiro', 'Kiro', 'AWS', '.kiro/steering/{slug}.md', null, 'stdio/http'],
  ].map(([id, name, vendor, path, maxChars, mcp]) => ({
    id,
    name,
    vendor,
    last_checked: '2026-09-23',
    render: { path, max_chars: maxChars },
    mcp: Object.fromEntries(mcp.split('/').map((transport) => [transport, true])),
  }));

  // An agent that has run a whole recipe through Forgeprint, with the result
  // recorded in docs/dogfood.md. Nothing is added here on the strength of
  // documentation alone.
  const TESTED = new Set(['claude-code']);

  // How each agent adds the server. Commands follow the `install_mcp` shape in
  // schema/agents.yaml; agents with no add command take the configuration
  // object their documentation describes.
  const SERVER_JSON = JSON.stringify(
    { mcpServers: { forgeprint: { command: 'npx', args: ['-y', 'forgeprint-mcp'] } } },
    null,
    2,
  );
  const OPENCODE_JSON = JSON.stringify(
    { mcp: { forgeprint: { type: 'local', command: ['npx', '-y', 'forgeprint-mcp'] } } },
    null,
    2,
  );
  const INSTALL = {
    'claude-code': 'claude mcp add forgeprint -- npx -y forgeprint-mcp',
    codex: 'codex mcp add forgeprint -- npx -y forgeprint-mcp',
    'gemini-cli': 'gemini mcp add forgeprint npx -y forgeprint-mcp',
    'copilot-cli': SERVER_JSON,
    cursor: SERVER_JSON,
    windsurf: SERVER_JSON,
    cline: SERVER_JSON,
    opencode: OPENCODE_JSON,
    kiro: SERVER_JSON,
  };

  function agents() {
    const live = index && index !== 'error' && Array.isArray(index.agents) ? index.agents : [];
    return live.length > 0 ? live : AGENTS_FALLBACK;
  }

  function agent(id = agentId) {
    return agents().find((entry) => entry.id === id) || agents()[0];
  }

  function formatDate(iso) {
    const date = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(current, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  function setAgent(id, { store = true } = {}) {
    if (!(id in INSTALL)) return;
    agentId = id;
    if (store) remember(AGENT_KEY, id);
    const picker = $('#agent-pick');
    if (picker && picker.value !== id) picker.value = id;
    renderInstall();
    renderExample(false);
    renderTargets();
    renderGetCode();
  }

  function renderInstall() {
    const entry = agent();
    const code = $('#install-code');
    if (code) code.textContent = INSTALL[entry.id] || INSTALL['claude-code'];
    const note = $('#install-note');
    if (note) note.textContent = t(`hero.notes.${entry.id}`, note.textContent);
    const status = $('#install-status');
    if (status) {
      const tested = TESTED.has(entry.id);
      status.dataset.state = tested ? 'tested' : 'docs';
      const text = tested
        ? t('hero.tested', 'Tested end to end.')
        : fill(t('hero.fromDocs', 'From {vendor} documentation, read {date}.'), {
            vendor: entry.vendor,
            date: formatDate(entry.last_checked),
          });
      status.innerHTML = `<span>${escapeHtml(text)}</span>`;
    }
  }

  function renderStatus() {
    const status = $('#status');
    if (!status) return;
    if (!index || index === 'error') {
      status.textContent = t('hero.status', status.textContent);
      return;
    }
    status.textContent = fill(t('hero.statusLive', status.textContent), {
      b: entries('blueprint').length,
      e: entries('expert').length,
      c: entries('crew').length,
      i: entries('integration').length,
      a: agents().length,
    });
  }

  /* ── Language ──────────────────────────────────────────────────────── */

  function preferredLanguage() {
    const stored = recall(STORE_KEY);
    if (stored && LANGS.includes(stored)) return stored;
    const navigatorLanguages = navigator.languages || [navigator.language || 'en'];
    for (const tag of navigatorLanguages) {
      const base = String(tag).toLowerCase().split('-')[0];
      if (LANGS.includes(base)) return base;
    }
    return 'en';
  }

  async function loadDictionary(lang) {
    if (dictionaries[lang]) return dictionaries[lang];
    const response = await fetch(`i18n/${lang}.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`i18n/${lang}.json: ${response.status}`);
    dictionaries[lang] = await response.json();
    return dictionaries[lang];
  }

  function applyDictionary(source) {
    // Plain text.
    $$('[data-i18n]').forEach((element) => {
      const value = lookup(source, element.dataset.i18n);
      if (typeof value === 'string') element.textContent = value;
    });

    // Text with inline markup, from the dictionary only — never from user input.
    $$('[data-i18n-html]').forEach((element) => {
      const value = lookup(source, element.dataset.i18nHtml);
      if (typeof value === 'string') element.innerHTML = value;
    });

    // Attributes: "attr:key;attr:key".
    $$('[data-i18n-attr]').forEach((element) => {
      element.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attribute, key] = pair.split(':');
        const value = lookup(source, key);
        if (typeof value === 'string') element.setAttribute(attribute, value);
      });
    });

    // Repeating structures.
    $$('[data-i18n-list]').forEach((element) => {
      const items = lookup(source, element.dataset.i18nList);
      if (!Array.isArray(items)) return;
      element.innerHTML = items.map((text) => `<li>${escapeHtml(text)}</li>`).join('');
    });

    $$('[data-i18n-steps]').forEach((element) => {
      const items = lookup(source, element.dataset.i18nSteps);
      if (!Array.isArray(items)) return;
      element.innerHTML = items
        .map((step) => `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p></li>`)
        .join('');
    });

    $$('[data-i18n-cards]').forEach((element) => {
      const items = lookup(source, element.dataset.i18nCards);
      if (!Array.isArray(items)) return;
      const icons = (element.dataset.icons || '').split(',');
      element.innerHTML = items
        .map(
          (card, position) =>
            `<article class="card-lift">${icon(icons[position])}<h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.body)}</p></article>`,
        )
        .join('');
    });

    $$('[data-i18n-tools]').forEach((element) => {
      const groups = lookup(source, element.dataset.i18nTools);
      if (!Array.isArray(groups)) return;
      element.innerHTML = groups
        .map(
          (group) => `<div class="tool-group">
            <h3>${escapeHtml(group.title)}</h3>
            <dl>${group.tools
              .map((tool) => `<dt>${escapeHtml(tool.name)}</dt><dd>${escapeHtml(tool.does)}</dd>`)
              .join('')}</dl>
          </div>`,
        )
        .join('');
    });

    $$('[data-i18n-tree]').forEach((element) => {
      const rows = lookup(source, element.dataset.i18nTree);
      if (!Array.isArray(rows)) return;
      element.innerHTML = rows
        .map((row) => `<dt>${escapeHtml(row.path)}</dt><dd>${escapeHtml(row.body)}</dd>`)
        .join('');
    });

    $$('[data-i18n-faq]').forEach((element) => {
      const items = lookup(source, element.dataset.i18nFaq);
      if (!Array.isArray(items)) return;
      element.innerHTML = items
        .map(
          (item) =>
            `<details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`,
        )
        .join('');
    });

    const title = lookup(source, 'meta.title');
    if (typeof title === 'string') document.title = title;
  }

  async function setLanguage(lang, { store = true } = {}) {
    let source;
    try {
      source = await loadDictionary(lang);
    } catch {
      // A missing translation must not empty the page: English is already in
      // the HTML, so the honest failure is to stay where we are.
      return;
    }
    current = lang;
    document.documentElement.lang = lookup(source, 'meta.lang') || lang;
    applyDictionary(source);
    $$('.lang button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });
    if (store) remember(STORE_KEY, lang);
    renderAll();
  }

  function renderAll() {
    renderStatus();
    renderInstall();
    renderUnits();
    drawUnits();
    renderFlow();
    renderExample(false);
    renderTargets();
    renderGetCode();
    renderCatalog();
    watchReveals();
  }

  /* ── Icons ─────────────────────────────────────────────────────────── */

  const ICONS = {
    target:
      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
    plug: '<path d="M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0V9ZM12 18v3"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>',
    repeat:
      '<path d="M4 9a5 5 0 0 1 5-5h11M20 15a5 5 0 0 1-5 5H4"/><path d="M17 1l3 3-3 3M7 17l-3 3 3 3"/>',
    book: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z"/><path d="M20 4h-3a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h4V4Z"/>',
    hammer: '<path d="M14 7l-8 8 3 3 8-8"/><path d="M12 5l4-2 5 5-2 4-7-7Z"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    inbox: '<path d="M3 13h5l1 3h6l1-3h5"/><path d="M4 13l2-8h12l2 8v6H4v-6Z"/>',
    layers: '<path d="M12 3 21 8 12 13 3 8Z"/><path d="M3 13l9 5 9-5"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5Z"/>',
    users:
      '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.4c1.8.8 3 2.7 3 5.6"/>',
  };
  const KIND_ICONS = { blueprint: 'layers', expert: 'compass', integration: 'plug', crew: 'users' };

  function icon(name, size = 26) {
    const path = ICONS[String(name || '').trim()];
    if (!path) return '';
    return `<svg class="card-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
  }

  /* ── Copy buttons ──────────────────────────────────────────────────── */

  // Delegated, because some code blocks are drawn after the page loads.
  function wireCopyButtons() {
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-code] .copy');
      if (!button) return;
      const text = $('pre', button.closest('[data-code]')).innerText;
      const label = button.querySelector('span');
      let state = 'done';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Blocked clipboard, or an insecure origin. Say so rather than
        // showing "Copied" over nothing.
        state = 'failed';
      }
      button.dataset.state = state;
      label.textContent =
        state === 'done' ? t('hero.copied', 'Copied') : t('hero.copyFailed', 'Could not copy');
      setTimeout(() => {
        delete button.dataset.state;
        label.textContent = t('hero.copy', 'Copy');
      }, 2200);
    });
  }

  function codeBlock(text) {
    return `<div class="code" data-code><pre><code>${escapeHtml(text)}</code></pre><button class="copy" type="button" aria-label="${escapeHtml(t('hero.copy', 'Copy'))}"><span>${escapeHtml(t('hero.copy', 'Copy'))}</span></button></div>`;
  }

  /* ── Tabs ──────────────────────────────────────────────────────────── */

  /** WAI-ARIA tabs: arrows move between tabs, Home and End jump, and only the
      selected tab is in the tab order. */
  function wireTabs(list, onSelect) {
    if (!list) return;
    const tabs = $$('[role="tab"]', list);
    const select = (tab, focus) => {
      tabs.forEach((other) => {
        const on = other === tab;
        other.setAttribute('aria-selected', String(on));
        other.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      onSelect(tab);
    };
    tabs.forEach((tab, position) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (event) => {
        const moves = {
          ArrowRight: position + 1,
          ArrowLeft: position - 1,
          Home: 0,
          End: tabs.length - 1,
        };
        if (!(event.key in moves)) return;
        event.preventDefault();
        select(tabs[(moves[event.key] + tabs.length) % tabs.length], true);
      });
    });
    return (value, attribute) => {
      const tab = tabs.find((candidate) => candidate.dataset[attribute] === value);
      if (tab) select(tab, false);
    };
  }

  /* ── Units ─────────────────────────────────────────────────────────── */

  function entries(kind) {
    if (!index || index === 'error') return [];
    const list = index[INDEX_KEYS[kind]];
    return Array.isArray(list) ? list.filter((entry) => entry && !entry.deprecated) : [];
  }

  function renderUnits() {
    const container = $('[data-i18n-units]');
    if (!container) return;
    const items = lookup(dict(), container.dataset.i18nUnits);
    if (!Array.isArray(items)) return;
    const loaded = index && index !== 'error';
    container.innerHTML = items
      .map((item, position) => {
        const count = loaded ? entries(item.kind).length : '';
        return `<article class="unit" data-kind="${escapeHtml(item.kind)}" style="--i:${position}">
          <div class="unit-top">${icon(KIND_ICONS[item.kind], 28)}<span class="unit-count" aria-hidden="true">${count}</span></div>
          <p class="unit-q">${escapeHtml(item.q)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.body)}</p>
          <a class="unit-link" href="#catalog" data-open-kind="${escapeHtml(item.kind)}">${escapeHtml(item.link)}${count === '' ? '' : ` (${count})`}</a>
        </article>`;
      })
      .join('');
  }

  /** The composition, drawn from the catalog itself: the first blueprint that
      recommends a crew, and what that crew names. */
  function drawUnits() {
    const frame = $('#units-diagram');
    if (!frame) return;
    const figure = frame.closest('figure');
    const blueprints = entries('blueprint');
    const blueprint = blueprints.find((entry) => entry.recommended_crew);
    const crew =
      blueprint && entries('crew').find((entry) => entry.slug === blueprint.recommended_crew);
    if (!crew) {
      // Nothing to draw without the index; the cards above carry the idea.
      if (figure) figure.hidden = index !== null;
      frame.innerHTML = '';
      return;
    }
    if (figure) figure.hidden = false;

    const chip = { w: 228, h: 34, gap: 10 };
    const experts = crew.members || [];
    const integrations = crew.integrations || [];
    const columnX = 548;
    let y = 30;
    const placed = [];
    const place = (kind, slug) => {
      placed.push({ kind, slug, x: columnX, y });
      y += chip.h + chip.gap;
    };
    const expertLabelY = y - 10;
    experts.forEach((slug) => place('expert', slug));
    y += 26;
    const integrationLabelY = y - 10;
    integrations.forEach((slug) => place('integration', slug));
    const height = Math.max(y + 34, 240);
    const midY = (30 + y - chip.gap) / 2;

    const bp = { x: 16, y: midY - 34, w: 210, h: 68 };
    const cr = { x: 322, y: midY - 34, w: 184, h: 68 };
    const alt = escapeHtml(t('units.diagramAlt'));

    const links = placed
      .map((node, position) => {
        const x1 = cr.x + cr.w;
        const y1 = midY;
        const x2 = node.x;
        const y2 = node.y + chip.h / 2;
        const bend = (x1 + x2) / 2;
        return `<path class="draw" pathLength="1" style="--d:${position}" d="M${x1} ${y1} C${bend} ${y1} ${bend} ${y2} ${x2} ${y2}" fill="none" stroke="var(--accent-line)" stroke-width="1.4"/>`;
      })
      .join('');

    const chips = placed
      .map(
        (
          node,
          position,
        ) => `<a href="${PAGE_DIRS[node.kind]}/${encodeURIComponent(node.slug)}.html" class="chip" style="--d:${position}">
          <rect x="${node.x}" y="${node.y}" width="${chip.w}" height="${chip.h}" rx="8" fill="var(--panel)" stroke="var(--line)"/>
          <text x="${node.x + 12}" y="${node.y + 22}" class="u-mono">${escapeHtml(node.slug)}</text>
        </a>`,
      )
      .join('');

    frame.innerHTML = `
      <svg viewBox="0 0 792 ${height}" role="img" aria-label="${alt}">
        <defs>
          <marker id="u-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/>
          </marker>
        </defs>
        <a href="b/${encodeURIComponent(blueprint.slug)}.html" class="node">
          <rect x="${bp.x}" y="${bp.y}" width="${bp.w}" height="${bp.h}" rx="10" fill="var(--panel)" stroke="var(--line)"/>
          <text x="${bp.x + 14}" y="${bp.y + 26}" class="u-kind">${escapeHtml(t('units.items.0.title', 'Blueprint'))}</text>
          <text x="${bp.x + 14}" y="${bp.y + 48}" class="u-mono">${escapeHtml(blueprint.slug)}</text>
        </a>
        <path class="draw" pathLength="1" style="--d:0" d="M${bp.x + bp.w + 4} ${midY} L${cr.x - 6} ${midY}" stroke="var(--accent)" stroke-width="1.6" stroke-dasharray="4 4" marker-end="url(#u-arrow)" fill="none"/>
        <text x="${(bp.x + bp.w + cr.x) / 2}" y="${midY - 12}" text-anchor="middle" class="u-note">${escapeHtml(t('units.recommends', 'recommends'))}</text>
        <a href="c/${encodeURIComponent(crew.slug)}.html" class="node">
          <rect x="${cr.x}" y="${cr.y}" width="${cr.w}" height="${cr.h}" rx="10" fill="var(--accent-wash)" stroke="var(--accent)"/>
          <text x="${cr.x + 14}" y="${cr.y + 26}" class="u-kind">${escapeHtml(t('units.items.3.title', 'Crew'))}</text>
          <text x="${cr.x + 14}" y="${cr.y + 48}" class="u-mono">${escapeHtml(crew.slug)}</text>
        </a>
        ${links}
        <text x="${columnX}" y="${expertLabelY}" class="u-label">${escapeHtml(t('units.experts', 'Experts'))}</text>
        <text x="${columnX}" y="${integrationLabelY}" class="u-label">${escapeHtml(t('units.integrations', 'Integrations'))}</text>
        ${chips}
        <text x="${cr.x}" y="${height - 10}" class="u-note">${escapeHtml(t('units.bySlug', ''))}</text>
      </svg>`;
  }

  /* ── The flow, step by step ────────────────────────────────────────── */

  // [from lane, to lane] for each step; the words are in the dictionary.
  const FLOW = [
    [0, 1],
    [1, 2],
    [2, 1],
    [1, 0],
    [0, 1],
    [1, 2],
    [2, 1],
    [1, 3],
  ];
  const STEP_MS = 1900;
  const HOLD_MS = 3200;
  const flow = { step: -1, timer: null, playing: false, userPaused: false, visible: false };

  function renderFlow() {
    const list = $('#flow-steps');
    const frame = $('#flow-diagram');
    const steps = lookup(dict(), 'how.steps');
    if (list && Array.isArray(steps)) {
      list.innerHTML = steps
        .map(
          (step, position) => `<li>
            <button type="button" data-step="${position}">
              <span class="fs-num" aria-hidden="true">${position + 1}</span>
              <span class="fs-text"><span class="fs-title">${escapeHtml(step.title)}</span><span class="fs-body">${escapeHtml(step.body)}</span></span>
            </button>
          </li>`,
        )
        .join('');
    }
    if (!frame) return;

    const lanes = lookup(dict(), 'how.lanes') || [
      'You',
      'Your agent',
      'Forgeprint MCP',
      'Your project',
    ];
    const labels = Array.isArray(steps) ? steps.map((step) => step.label) : FLOW.map(() => '');
    const laneX = [90, 270, 450, 630];
    const top = 70;
    const row = 54;
    const height = top + FLOW.length * row + 16;

    const heads = lanes
      .map(
        (name, lane) => `<g class="fl-lane" data-lane="${lane}">
          <rect x="${laneX[lane] - 78}" y="8" width="156" height="34" rx="17"/>
          <text x="${laneX[lane]}" y="30" text-anchor="middle">${escapeHtml(name)}</text>
          <path d="M${laneX[lane]} 46 V${height - 8}" class="fl-life"/>
        </g>`,
      )
      .join('');

    const arrows = FLOW.map(([from, to], position) => {
      const y = top + position * row + 30;
      const x1 = laneX[from] + (to > from ? 6 : -6);
      const x2 = laneX[to] + (to > from ? -8 : 8);
      const mid = (laneX[from] + laneX[to]) / 2;
      return `<g class="fl-step" data-step="${position}">
        <text x="${mid}" y="${y - 17}" text-anchor="middle" class="fl-label">${escapeHtml(labels[position] || '')}</text>
        <path d="M${x1} ${y} L${x2} ${y}" pathLength="1" class="fl-arrow" marker-end="url(#fl-head)"/>
        <circle cx="${laneX[from]}" cy="${y}" r="9" class="fl-dot"/>
        <text x="${laneX[from]}" y="${y + 4}" text-anchor="middle" class="fl-num">${position + 1}</text>
      </g>`;
    }).join('');

    frame.innerHTML = `
      <svg viewBox="0 0 720 ${height}" role="img" aria-label="${escapeHtml(t('how.diagramAlt'))}">
        <defs>
          <marker id="fl-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/>
          </marker>
        </defs>
        ${heads}
        ${arrows}
      </svg>`;

    showFlowStep(flow.step < 0 && !canAnimate() ? FLOW.length - 1 : flow.step, { announce: false });
    renderPlayButton();
  }

  function canAnimate() {
    return !reducedMotion.matches;
  }

  function showFlowStep(step, { announce }) {
    flow.step = step;
    $$('#flow-diagram .fl-step').forEach((group) => {
      const position = Number(group.dataset.step);
      group.classList.toggle('is-on', position <= step);
      group.classList.toggle('is-now', position === step);
    });
    const [from, to] = FLOW[step] || [];
    $$('#flow-diagram .fl-lane').forEach((lane) => {
      const position = Number(lane.dataset.lane);
      lane.classList.toggle('is-now', step >= 0 && (position === from || position === to));
    });
    $$('#flow-steps button').forEach((button) => {
      const position = Number(button.dataset.step);
      const now = position === step;
      button.classList.toggle('is-past', position < step);
      if (now) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const pos = $('#flow-pos');
    if (pos && step >= 0) {
      const text = fill(t('how.stepOf', 'Step {n} of {total}'), {
        n: step + 1,
        total: FLOW.length,
      });
      // Announced only when somebody moved it, so autoplay does not talk over
      // the rest of the page.
      pos.setAttribute('aria-live', announce ? 'polite' : 'off');
      pos.textContent = text;
    }
  }

  function renderPlayButton() {
    const button = $('#flow-play');
    if (!button) return;
    button.setAttribute('aria-pressed', String(flow.playing));
    const label = $('#flow-play-label');
    if (label) label.textContent = flow.playing ? t('how.pause', 'Pause') : t('how.play', 'Play');
  }

  function scheduleFlow() {
    clearTimeout(flow.timer);
    if (!flow.playing) return;
    const atEnd = flow.step >= FLOW.length - 1;
    flow.timer = setTimeout(
      () => {
        showFlowStep(atEnd ? 0 : flow.step + 1, { announce: false });
        scheduleFlow();
      },
      atEnd ? HOLD_MS : flow.step < 0 ? 400 : STEP_MS,
    );
  }

  function playFlow() {
    flow.playing = true;
    if (flow.step >= FLOW.length - 1) showFlowStep(-1, { announce: false });
    renderPlayButton();
    scheduleFlow();
  }

  function pauseFlow() {
    flow.playing = false;
    clearTimeout(flow.timer);
    renderPlayButton();
  }

  function wireFlow() {
    const frame = $('#flow-diagram');
    if (!frame) return;
    $('#flow-play')?.addEventListener('click', () => {
      if (flow.playing) {
        flow.userPaused = true;
        pauseFlow();
      } else {
        flow.userPaused = false;
        playFlow();
      }
    });
    const step = (delta) => {
      flow.userPaused = true;
      pauseFlow();
      const next = Math.min(FLOW.length - 1, Math.max(0, flow.step + delta));
      showFlowStep(next, { announce: true });
    };
    $('#flow-prev')?.addEventListener('click', () => step(-1));
    $('#flow-next')?.addEventListener('click', () => step(1));
    $('#flow-steps')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-step]');
      if (!button) return;
      flow.userPaused = true;
      pauseFlow();
      showFlowStep(Number(button.dataset.step), { announce: true });
    });

    // Plays only while it can be seen, and never on its own when motion is
    // reduced: then the whole sequence is shown at once and the buttons step
    // through it.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (seen) => {
          flow.visible = seen.some((entry) => entry.isIntersecting);
          if (flow.visible && canAnimate() && !flow.userPaused) playFlow();
          if (!flow.visible && flow.playing) pauseFlow();
        },
        { threshold: 0.35 },
      ).observe(frame);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && flow.playing) pauseFlow();
    });
  }

  /* ── Example conversations ─────────────────────────────────────────── */

  function sentryInstall() {
    const sentry = entries('integration').find((entry) => entry.slug === 'sentry-mcp');
    return sentry && sentry.install ? sentry.install[agentId] : undefined;
  }

  function renderExample(animate) {
    const panel = $('#ex-panel');
    if (!panel) return;
    const turns = lookup(dict(), `examples.${exampleKind}`);
    if (!Array.isArray(turns)) return;
    const who = agent();
    const you = t('examples.you', 'You');
    panel.innerHTML = turns
      .map((turn, position) => {
        const style = `style="--i:${position}"`;
        const text = String(turn.text).replaceAll('{agent}', who.id);
        if (turn.who === 'tool') {
          return `<p class="turn tool" ${style}><span class="tool-arrow" aria-hidden="true">→</span><code>${escapeHtml(text)}</code></p>`;
        }
        if (turn.who === 'code') {
          const command = sentryInstall();
          if (command) return `<div class="turn code-turn" ${style}>${codeBlock(command)}</div>`;
          return `<p class="turn gap" ${style}>${escapeHtml(fill(t('examples.noInstall'), { agent: who.name }))}</p>`;
        }
        const agentTurn = turn.who === 'agent';
        return `<p class="turn ${agentTurn ? 'agent' : 'you'}" ${style}><span class="who">${escapeHtml(agentTurn ? who.name : you)}</span>${escapeHtml(text)}</p>`;
      })
      .join('');
    panel.setAttribute('aria-labelledby', `ex-tab-${exampleKind}`);
    panel.classList.remove('play');
    if (animate && canAnimate()) {
      void panel.offsetWidth; // restart the staggered entrance
      panel.classList.add('play');
    }
    const note = $('#ex-note');
    if (note) note.textContent = fill(t('examples.agentNote'), { agent: who.name });
  }

  /* ── Agents: what each one gets ────────────────────────────────────── */

  function renderTargets() {
    const list = $('#agent-targets');
    if (!list) return;
    list.innerHTML = agents()
      .map((entry, position) => {
        const tested = TESTED.has(entry.id);
        const transports = Object.entries(entry.mcp || {})
          .filter(([, on]) => on)
          .map(([name]) => name)
          .join(' · ');
        const status = tested
          ? t('agents.tested', 'tested end to end')
          : fill(t('agents.docs', 'vendor docs · {date}'), { date: entry.last_checked });
        const cap =
          entry.render && entry.render.max_chars
            ? `<span class="t-cap">${escapeHtml(fill(t('agents.cap', 'cut at {n} characters'), { n: entry.render.max_chars.toLocaleString(current) }))}</span>`
            : '';
        const picked = entry.id === agentId;
        return `<li style="--i:${position}">
          <button type="button" class="target${picked ? ' is-picked' : ''}" data-agent="${escapeHtml(entry.id)}" aria-pressed="${picked}" title="${escapeHtml(fill(t('agents.pick', 'Use {agent}'), { agent: entry.name }))}">
            <span class="t-name">${escapeHtml(entry.name)}</span>
            <code class="t-path">${escapeHtml(entry.render ? entry.render.path : '')}</code>
            <span class="t-meta">MCP ${escapeHtml(transports)}${cap ? ' · ' : ''}${cap}</span>
            <span class="t-status ${tested ? 'tested' : 'docs'}">${escapeHtml(status)}</span>
          </button>
        </li>`;
      })
      .join('');
  }

  function renderGetCode() {
    const code = $('#get-code');
    if (!code) return;
    code.textContent = [
      fill(t('agents.noMcpCmd', 'pnpm forgeprint get dotnet-web-api --agent {agent}'), {
        agent: agentId,
      }),
      'npx skills add forgeprint/forgeprint',
      'gh skill install forgeprint/forgeprint blueprint-author',
    ].join('\n');
  }

  /* ── The catalog preview ───────────────────────────────────────────── */

  function badges(entry) {
    const tierLabel = t(`catalog.tier.${entry.tier}`, entry.tier);
    const tierHint = t(`catalog.tierHint.${entry.tier}`);
    const parts = [
      `<span class="badge tier-${escapeHtml(entry.tier)}" title="${escapeHtml(tierHint)}">${escapeHtml(tierLabel)}</span>`,
    ];
    if (entry.provenance === 'generated') {
      parts.push(
        `<span class="badge generated" title="${escapeHtml(t('catalog.generatedHint'))}">${escapeHtml(t('catalog.generated', 'Generated'))}</span>`,
      );
    }
    return parts.join('');
  }

  function agentName(id) {
    const found = agents().find((entry) => entry.id === id);
    return found ? found.name : id;
  }

  /** Per kind: the tags on the card, the note at its foot, and the words the
      filter searches. */
  function describe(kind, entry) {
    switch (kind) {
      case 'expert':
        return {
          tags: [entry.domain, entry.seniority, entry.role],
          extra: fill(t('catalog.checklists', '{n} checklists'), {
            n: (entry.checklists || []).length,
          }),
          terms: [
            entry.role,
            entry.domain,
            entry.seniority,
            ...(entry.stack || []),
            ...(entry.deliverables || []),
          ],
        };
      case 'crew':
        return {
          tags: entry.members || [],
          extra: fill(t('catalog.members', '{n} experts · {m} integrations'), {
            n: (entry.members || []).length,
            m: (entry.integrations || []).length,
          }),
          terms: [...(entry.members || []), ...(entry.integrations || []), entry.for_what],
        };
      case 'integration': {
        const verified = Object.keys(entry.install || {}).map(agentName);
        return {
          tags: [entry.kind, entry.upstream_version, ...(entry.fits || [])],
          extra: `${escapeHtml(t('catalog.installFor', 'Install verified for'))}: ${escapeHtml(verified.join(', '))}`,
          secret: (entry.needs_secrets || []).length > 0,
          terms: [entry.kind, ...(entry.fits || []), ...verified],
          rawExtra: true,
        };
      }
      default:
        return {
          tags: [
            ...(entry.languages || []),
            entry.project_type,
            ...(entry.stack || []).slice(0, 3),
          ],
          extra:
            Object.keys(entry.options || {}).length === 0
              ? ''
              : `${t('catalog.options', 'Options')}: ${Object.keys(entry.options).join(', ')}`,
          terms: [...(entry.languages || []), ...(entry.stack || []), entry.project_type],
        };
    }
  }

  function card(kind, entry) {
    const about = describe(kind, entry);
    const extra = about.extra
      ? `<span class="tpl-opts">${about.rawExtra ? about.extra : escapeHtml(about.extra)}</span>`
      : '';
    const secret = about.secret
      ? `<span class="badge secret">${escapeHtml(t('catalog.needsSecret', 'needs a token'))}</span>`
      : '';
    return `<article class="tpl kind-${kind}">
      <div class="tpl-badges">${badges(entry)}${secret}</div>
      <p class="tpl-slug">${escapeHtml(entry.slug)}</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <p class="tpl-summary">${escapeHtml(entry.summary)}</p>
      <div class="tpl-tags">${about.tags
        .filter(Boolean)
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join('')}</div>
      <p class="tpl-foot">
        <a href="${PAGE_DIRS[kind]}/${encodeURIComponent(entry.slug)}.html">${escapeHtml(t(`catalog.cardLink.${kind}`, 'Read more'))}</a>
        ${extra}
      </p>
    </article>`;
  }

  function stateBlock(message, actionLabel, actionHref) {
    const action = actionHref
      ? `<p><a class="btn-quiet" href="${actionHref}">${escapeHtml(actionLabel)}</a></p>`
      : `<p><button class="btn-quiet" type="button" id="tpl-clear">${escapeHtml(actionLabel)}</button></p>`;
    return `<div class="state"><p>${escapeHtml(message)}</p>${actionLabel ? action : ''}</div>`;
  }

  function renderCatalog() {
    const list = $('#tpl-list');
    const countEl = $('#tpl-count');
    const statusEl = $('#tpl-status');
    if (!list) return;

    if (index === null) return; // still loading; skeletons stay
    list.removeAttribute('aria-busy');
    list.setAttribute('aria-labelledby', `cat-tab-${catalogKind}`);
    // The full catalog opens on the same tab.
    const full = $('.templates-foot a');
    if (full) full.setAttribute('href', `catalog.html#${catalogKind}s`);

    if (index === 'error') {
      list.innerHTML = stateBlock(
        t('catalog.error', 'The catalog index could not be read.'),
        t('catalog.errorAction', 'Open the catalog'),
        'catalog.html',
      );
      if (countEl) countEl.textContent = '';
      if (statusEl) statusEl.textContent = t('catalog.error');
      return;
    }

    KINDS.forEach((kind) => {
      const badge = $(`[data-count="${kind}"]`);
      if (badge) badge.textContent = String(entries(kind).length);
    });

    const all = entries(catalogKind)
      .slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (all.length === 0) {
      list.innerHTML = stateBlock(
        t('catalog.empty', 'Nothing here yet.'),
        t('catalog.errorAction'),
        'catalog.html',
      );
      if (countEl) countEl.textContent = '';
      return;
    }

    const query = ($('#tpl-filter')?.value || '').trim().toLowerCase();
    const matches = all.filter((entry) => {
      if (query === '') return true;
      const about = describe(catalogKind, entry);
      return [entry.slug, entry.name, entry.summary, ...about.terms]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    if (matches.length === 0) {
      list.innerHTML = stateBlock(
        t('catalog.noMatch', 'Nothing matches.'),
        t('catalog.noMatchAction', 'Clear the filter'),
      );
      $('#tpl-clear')?.addEventListener('click', () => {
        const input = $('#tpl-filter');
        if (input) input.value = '';
        renderCatalog();
        input?.focus();
      });
    } else {
      list.innerHTML = matches.map((entry) => card(catalogKind, entry)).join('');
    }

    if (countEl) {
      countEl.textContent =
        matches.length === 1
          ? t('catalog.countOne', '1 shown')
          : fill(t('catalog.count', '{n} shown'), { n: matches.length });
    }
  }

  async function loadIndex() {
    try {
      const response = await fetch('index.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      index = data && typeof data === 'object' ? data : 'error';
    } catch {
      index = 'error';
    }
    renderAll();
  }

  /* ── Reveal on scroll ──────────────────────────────────────────────── */

  let observer = null;
  function watchReveals() {
    const targets = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((element) => element.classList.add('in'));
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(
        (seen) => {
          seen.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
      );
    }
    targets.forEach((element) => observer.observe(element));
  }

  /* ── Start ─────────────────────────────────────────────────────────── */

  function start() {
    $$('.lang button').forEach((button) => {
      button.addEventListener('click', () => {
        void setLanguage(button.dataset.lang);
      });
    });

    const stored = recall(AGENT_KEY);
    if (stored && stored in INSTALL) agentId = stored;
    const picker = $('#agent-pick');
    if (picker) {
      picker.value = agentId;
      picker.addEventListener('change', () => setAgent(picker.value));
    }
    $('#agent-targets')?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-agent]');
      if (button) setAgent(button.dataset.agent);
    });

    wireTabs($('.ex-tabs'), (tab) => {
      exampleKind = tab.dataset.example;
      renderExample(true);
    });
    const selectCatalogTab = wireTabs($('.cat-tabs'), (tab) => {
      catalogKind = tab.dataset.kind;
      renderCatalog();
    });
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-open-kind]');
      if (link && selectCatalogTab) selectCatalogTab(link.dataset.openKind, 'kind');
    });

    $('#tpl-filter')?.addEventListener('input', renderCatalog);

    // The examples play their entrance the first time they come into view.
    const examples = $('#examples');
    if (examples && 'IntersectionObserver' in window) {
      const once = new IntersectionObserver(
        (seen) => {
          if (!seen.some((entry) => entry.isIntersecting)) return;
          renderExample(true);
          once.disconnect();
        },
        { threshold: 0.3 },
      );
      once.observe(examples);
    }

    wireCopyButtons();
    wireFlow();
    renderAll();
    void setLanguage(preferredLanguage(), { store: false });
    void loadIndex();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
