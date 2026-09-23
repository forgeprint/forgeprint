/*
 * The landing page's behaviour: language, copy buttons, the template list, the
 * diagram, and the scroll reveal.
 *
 * No framework and no build step. The page is readable and usable with this
 * file blocked — English text ships in the HTML, and the only thing that
 * genuinely needs JavaScript is the live template list, which says so when it
 * cannot load.
 */
(() => {
  'use strict';

  document.documentElement.classList.remove('no-js');

  const STORE_KEY = 'forgeprint.lang';
  const LANGS = ['en', 'tr'];
  const dictionaries = Object.create(null);
  let current = 'en';
  let catalog = null;

  /* ── Small helpers ─────────────────────────────────────────────────── */

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /** Read a dotted path out of the dictionary; undefined rather than throwing. */
  function lookup(dict, path) {
    return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), dict);
  }

  /** Browser storage can throw in a private window; a remembered language is
      a convenience, never a requirement. */
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

  async function dictionary(lang) {
    if (dictionaries[lang]) return dictionaries[lang];
    const response = await fetch(`i18n/${lang}.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`i18n/${lang}.json: ${response.status}`);
    dictionaries[lang] = await response.json();
    return dictionaries[lang];
  }

  function applyDictionary(dict) {
    // Plain text.
    $$('[data-i18n]').forEach((element) => {
      const value = lookup(dict, element.dataset.i18n);
      if (typeof value === 'string') element.textContent = value;
    });

    // Text with inline markup, from the dictionary only — never from user input.
    $$('[data-i18n-html]').forEach((element) => {
      const value = lookup(dict, element.dataset.i18nHtml);
      if (typeof value === 'string') element.innerHTML = value;
    });

    // Attributes: "attr:key;attr:key".
    $$('[data-i18n-attr]').forEach((element) => {
      element.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attribute, key] = pair.split(':');
        const value = lookup(dict, key);
        if (typeof value === 'string') element.setAttribute(attribute, value);
      });
    });

    // Repeating structures.
    $$('[data-i18n-list]').forEach((element) => {
      const items = lookup(dict, element.dataset.i18nList);
      if (!Array.isArray(items)) return;
      element.innerHTML = items.map((text) => `<li>${escapeHtml(text)}</li>`).join('');
    });

    $$('[data-i18n-steps]').forEach((element) => {
      const items = lookup(dict, element.dataset.i18nSteps);
      if (!Array.isArray(items)) return;
      element.innerHTML = items
        .map((step) => `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.body)}</p></li>`)
        .join('');
    });

    $$('[data-i18n-cards]').forEach((element) => {
      const items = lookup(dict, element.dataset.i18nCards);
      if (!Array.isArray(items)) return;
      const icons = (element.dataset.icons || '').split(',');
      element.innerHTML = items
        .map(
          (card, index) =>
            `<article class="card-lift">${icon(icons[index])}<h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.body)}</p></article>`,
        )
        .join('');
    });

    $$('[data-i18n-chat]').forEach((element) => {
      const turns = lookup(dict, element.dataset.i18nChat);
      if (!Array.isArray(turns)) return;
      const labels = { you: lookup(dict, 'use.sampleYou'), agent: lookup(dict, 'use.sampleAgent') };
      element.innerHTML = turns
        .map(
          (turn) =>
            `<p class="turn ${turn.who === 'agent' ? 'agent' : 'you'}"><span class="who">${escapeHtml(labels[turn.who] || '')}</span>${escapeHtml(turn.text)}</p>`,
        )
        .join('');
    });

    $$('[data-i18n-tree]').forEach((element) => {
      const rows = lookup(dict, element.dataset.i18nTree);
      if (!Array.isArray(rows)) return;
      element.innerHTML = rows
        .map((row) => `<dt>${escapeHtml(row.path)}</dt><dd>${escapeHtml(row.body)}</dd>`)
        .join('');
    });

    $$('[data-i18n-faq]').forEach((element) => {
      const items = lookup(dict, element.dataset.i18nFaq);
      if (!Array.isArray(items)) return;
      element.innerHTML = items
        .map(
          (item) =>
            `<details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`,
        )
        .join('');
    });

    const title = lookup(dict, 'meta.title');
    if (typeof title === 'string') document.title = title;
  }

  async function setLanguage(lang, { store = true } = {}) {
    let dict;
    try {
      dict = await dictionary(lang);
    } catch {
      // A missing translation must not empty the page: English is already in
      // the HTML, so the honest failure is to stay where we are.
      return;
    }
    current = lang;
    document.documentElement.lang = lookup(dict, 'meta.lang') || lang;
    applyDictionary(dict);
    $$('.lang button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });
    if (store) remember(STORE_KEY, lang);
    drawDiagram();
    renderTemplates();
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
  };

  function icon(name) {
    const path = ICONS[String(name || '').trim()];
    if (!path) return '';
    return `<svg class="card-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
  }

  /* ── Copy buttons ──────────────────────────────────────────────────── */

  function wireCopyButtons() {
    $$('[data-code] .copy').forEach((button) => {
      button.addEventListener('click', async () => {
        const text = $('pre', button.closest('[data-code]')).innerText;
        const label = button.querySelector('span');
        const dict = dictionaries[current] || {};
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
          lookup(dict, state === 'done' ? 'hero.copied' : 'hero.copyFailed') ||
          (state === 'done' ? 'Copied' : 'Could not copy');
        setTimeout(() => {
          delete button.dataset.state;
          label.textContent = lookup(dict, 'hero.copy') || 'Copy';
        }, 2200);
      });
    });
  }

  /* ── Templates, from the catalog index ─────────────────────────────── */

  function badges(entry, dict) {
    const tierLabel = lookup(dict, `templates.tier.${entry.tier}`) || entry.tier;
    const tierHint = lookup(dict, `templates.tierHint.${entry.tier}`) || '';
    const parts = [
      `<span class="badge tier-${escapeHtml(entry.tier)}" title="${escapeHtml(tierHint)}">${escapeHtml(tierLabel)}</span>`,
    ];
    if (entry.provenance === 'generated') {
      const label = lookup(dict, 'templates.generated') || 'Generated';
      const hint = lookup(dict, 'templates.generatedHint') || '';
      parts.push(
        `<span class="badge generated" title="${escapeHtml(hint)}">${escapeHtml(label)}</span>`,
      );
    }
    return parts.join('');
  }

  function templateCard(entry, dict) {
    const tags = [...entry.languages, entry.project_type, ...entry.stack.slice(0, 3)];
    const optionFields = Object.keys(entry.options || {});
    const optionText =
      optionFields.length === 0
        ? ''
        : `<span class="tpl-opts">${escapeHtml(lookup(dict, 'templates.options') || 'Options')}: ${escapeHtml(optionFields.join(', '))}</span>`;
    return `<article class="tpl reveal">
      <div class="tpl-badges">${badges(entry, dict)}</div>
      <p class="tpl-slug">${escapeHtml(entry.slug)}</p>
      <h3>${escapeHtml(entry.name)}</h3>
      <p class="tpl-summary">${escapeHtml(entry.summary)}</p>
      <div class="tpl-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      <p class="tpl-foot">
        <a href="b/${encodeURIComponent(entry.slug)}.html">${escapeHtml(lookup(dict, 'templates.cardLink') || 'Read the blueprint')}</a>
        ${optionText}
      </p>
    </article>`;
  }

  function stateBlock(message, actionLabel, actionHref) {
    const action = actionHref
      ? `<p><a class="btn-quiet" href="${actionHref}">${escapeHtml(actionLabel)}</a></p>`
      : `<p><button class="btn-quiet" type="button" id="tpl-clear">${escapeHtml(actionLabel)}</button></p>`;
    return `<div class="state"><p>${escapeHtml(message)}</p>${actionLabel ? action : ''}</div>`;
  }

  function renderTemplates() {
    const list = $('#tpl-list');
    const countEl = $('#tpl-count');
    const statusEl = $('#tpl-status');
    if (!list) return;
    const dict = dictionaries[current] || {};

    if (catalog === null) return; // still loading; skeletons stay
    list.removeAttribute('aria-busy');

    if (catalog === 'error') {
      list.innerHTML = stateBlock(
        lookup(dict, 'templates.error') || 'The catalog index could not be read.',
        lookup(dict, 'templates.errorAction') || 'Open the catalog',
        'catalog.html',
      );
      if (countEl) countEl.textContent = '';
      if (statusEl) statusEl.textContent = lookup(dict, 'templates.error') || '';
      return;
    }

    if (catalog.length === 0) {
      list.innerHTML = stateBlock(
        lookup(dict, 'templates.empty') || 'No blueprints.',
        lookup(dict, 'templates.errorAction') || 'Open the catalog',
        'catalog.html',
      );
      if (countEl) countEl.textContent = '';
      return;
    }

    const query = ($('#tpl-filter')?.value || '').trim().toLowerCase();
    const matches = catalog.filter((entry) => {
      if (query === '') return true;
      return [
        entry.slug,
        entry.name,
        entry.summary,
        ...entry.languages,
        ...entry.stack,
        entry.project_type,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    if (matches.length === 0) {
      list.innerHTML = stateBlock(
        lookup(dict, 'templates.noMatch') || 'Nothing matches that filter.',
        lookup(dict, 'templates.noMatchAction') || 'Clear the filter',
      );
      $('#tpl-clear')?.addEventListener('click', () => {
        const input = $('#tpl-filter');
        if (input) input.value = '';
        renderTemplates();
        input?.focus();
      });
    } else {
      list.innerHTML = matches.map((entry) => templateCard(entry, dict)).join('');
    }

    if (countEl) {
      const template =
        matches.length === 1
          ? lookup(dict, 'templates.countOne') || '1 template'
          : (lookup(dict, 'templates.count') || '{n} templates').replace('{n}', matches.length);
      countEl.textContent = template;
    }
    watchReveals();
  }

  async function loadCatalog() {
    try {
      const response = await fetch('index.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      const blueprints = Array.isArray(data.blueprints) ? data.blueprints : [];
      catalog = blueprints
        .filter((entry) => entry && !entry.deprecated)
        .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } catch {
      catalog = 'error';
    }
    renderTemplates();
  }

  /* ── Diagram ───────────────────────────────────────────────────────── */

  function drawDiagram() {
    const frame = $('#diagram');
    if (!frame) return;
    const dict = dictionaries[current] || {};
    const d = (key, fallback) => escapeHtml(lookup(dict, `how.diagram.${key}`) || fallback);
    const alt = escapeHtml(lookup(dict, 'how.diagramAlt') || '');

    const node = (x, y, w, title, sub, accent) => `
      <rect x="${x}" y="${y}" width="${w}" height="56" rx="10"
            fill="${accent ? 'var(--accent-wash)' : 'var(--panel)'}"
            stroke="${accent ? 'var(--accent)' : 'var(--line)'}"/>
      <text x="${x + 14}" y="${y + 24}" class="n-title">${title}</text>
      <text x="${x + 14}" y="${y + 42}" class="n-sub">${sub}</text>`;

    const arrow = (x1, y1, x2, y2) =>
      `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="var(--accent)" stroke-width="1.6" marker-end="url(#fp-arrow)"/>`;

    frame.innerHTML = `
      <svg viewBox="0 0 560 330" role="img" aria-label="${alt}">
        <defs>
          <marker id="fp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/>
          </marker>
          <style>
            .n-title { font: 600 13px ui-sans-serif, system-ui, sans-serif; fill: var(--fg); }
            .n-sub { font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; fill: var(--muted); }
          </style>
        </defs>
        ${node(10, 14, 170, d('you', 'You'), d('youSub', ''), false)}
        ${arrow(95, 74, 95, 100)}
        ${node(10, 104, 240, d('agent', 'Your agent'), d('agentSub', ''), false)}
        ${arrow(254, 132, 296, 132)}
        ${node(300, 104, 250, d('server', 'Forgeprint MCP'), d('serverSub', ''), true)}
        ${arrow(425, 100, 425, 74)}
        ${node(300, 14, 250, d('catalog', 'The catalog'), d('catalogSub', ''), false)}
        ${arrow(296, 160, 254, 160)}
        ${node(300, 194, 250, d('package', 'Your package'), d('packageSub', ''), true)}
        ${arrow(296, 222, 254, 222)}
        ${node(10, 194, 240, d('project', 'Your project'), d('projectSub', ''), false)}
        <text x="10" y="290" class="n-sub">${d('note', '')}</text>
      </svg>`;
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
        (entries) => {
          entries.forEach((entry) => {
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

    const filter = $('#tpl-filter');
    if (filter) filter.addEventListener('input', renderTemplates);

    wireCopyButtons();
    drawDiagram();
    watchReveals();
    void setLanguage(preferredLanguage(), { store: false });
    void loadCatalog();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
