/**
 * The one claim on the hand-written landing page that the catalog can falsify.
 *
 * `docs/index.html` is not generated (ADR 0002 keeps the site buildable
 * without a workflow, and the landing page is written by hand), so
 * `build-site --check` never saw its status line: "Pre-release · N blueprints
 * · N experts · …". JavaScript replaces that line with live counts from
 * `index.json`; without JavaScript the written numbers are what a visitor —
 * or a crawler that does not run scripts — reads.
 *
 * They drifted, by a lot: the page said 17 blueprints and 8 experts while the
 * catalog held 45 and 45. Nothing was wrong with the page; nothing was
 * checking it. This module is the check, and it compares numbers rather than
 * sentences so a translation stays free to word the line its own way.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IndexWithUnits } from './units.js';

/** The files that write the counts by hand, relative to `docs/`. */
export const LANDING_FILES = ['index.html', 'i18n/en.json', 'i18n/tr.json'] as const;

/**
 * What the status line should say, in the order it says it. Deprecated entries
 * are left out, because that is what the live counter in `assets/promo.js`
 * does — a check that disagreed with the page's own script would be worse than
 * no check.
 */
export function landingCounts(index: IndexWithUnits): number[] {
  const live = (list: readonly { deprecated?: boolean }[] | undefined): number =>
    (list ?? []).filter((entry) => entry.deprecated !== true).length;
  return [
    live(index.blueprints),
    live(index.experts),
    live(index.crews),
    live(index.integrations),
    (index.agents ?? []).length,
  ];
}

/**
 * The numbers in one file's status line, or `undefined` when the file has no
 * status line at all — which is itself a failure, since the line is what is
 * being checked.
 */
export function statusNumbers(file: string, text: string): number[] | undefined {
  const line = file.endsWith('.json')
    ? /"status":\s*"([^"]*)"/.exec(text)?.[1]
    : /id="status"[^>]*>([^<]*)</.exec(text)?.[1];
  if (line === undefined) return undefined;
  return [...line.matchAll(/\d+/g)].map((match) => Number(match[0]));
}

/**
 * The landing files whose counts disagree with the catalog. A file that cannot
 * be read, or that has lost its status line, is reported too.
 */
export function staleLandingFiles(root: string, index: IndexWithUnits): string[] {
  const want = landingCounts(index).join(' · ');
  return LANDING_FILES.filter((file) => {
    let text: string;
    try {
      text = readFileSync(join(root, 'docs', ...file.split('/')), 'utf8');
    } catch {
      return true;
    }
    return statusNumbers(file, text)?.join(' · ') !== want;
  });
}
