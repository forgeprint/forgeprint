/**
 * Resolving `setup.md` option guards.
 *
 * A recipe is written with every branch present:
 *
 * ```markdown
 * <!-- if options.database == postgres -->
 * ...
 * <!-- endif -->
 * ```
 *
 * A caller who has chosen `database: postgres` should receive the recipe with
 * that branch inlined and the others gone, because a step list with branches in
 * it is a document, and the point of `setup.md` is that it is a script.
 */

import type { Manifest } from './manifest.js';

const IF_PATTERN = /^\s*<!--\s*if\s+options\.([a-z0-9-]+)\s*==\s*([a-z0-9-]+)\s*-->\s*$/;
const ENDIF_PATTERN = /^\s*<!--\s*endif\s*-->\s*$/;

export interface ResolveOptionsResult {
  readonly markdown: string;
  /** Option fields that appear in guards but were not chosen by the caller. */
  readonly unresolved: readonly string[];
}

export class UnknownOptionError extends Error {}

/**
 * Validate a caller's option selection against what the manifest declares.
 * Throws rather than guessing: a typo that silently selects the default would
 * hand somebody a recipe for a database they did not ask for.
 */
export function checkOptions(manifest: Manifest, chosen: Readonly<Record<string, string>>): void {
  const declared = manifest.options ?? {};
  for (const [field, value] of Object.entries(chosen)) {
    const values = declared[field];
    if (values === undefined) {
      const known = Object.keys(declared);
      throw new UnknownOptionError(
        known.length === 0
          ? `Blueprint "${manifest.slug}" declares no options, but "${field}" was given`
          : `"${field}" is not an option of "${manifest.slug}" (${known.join(', ')})`,
      );
    }
    if (!values.includes(value)) {
      throw new UnknownOptionError(
        `"${value}" is not a value of ${manifest.slug}.options.${field} (${values.join(', ')})`,
      );
    }
  }
}

/**
 * Inline the chosen branches and drop the rest.
 *
 * A guard on a field the caller did not choose is left exactly as written, and
 * the field is reported in `unresolved`, so the caller can be asked rather than
 * handed a recipe with a branch silently removed.
 */
export function resolveSetupOptions(
  markdown: string,
  chosen: Readonly<Record<string, string>> = {},
): ResolveOptionsResult {
  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];
  const unresolved = new Set<string>();

  let skipping = false;
  let keepingGuarded = false;
  let inFence = false;

  for (const line of lines) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      if (!skipping) output.push(line);
      continue;
    }

    if (inFence) {
      if (!skipping) output.push(line);
      continue;
    }

    const guard = IF_PATTERN.exec(line);
    if (guard !== null) {
      const [, field = '', value = ''] = guard;
      const selection = chosen[field];
      if (selection === undefined) {
        // Not chosen: leave the guard intact and say so.
        unresolved.add(field);
        output.push(line);
        keepingGuarded = false;
        skipping = false;
      } else if (selection === value) {
        keepingGuarded = true;
        skipping = false;
      } else {
        skipping = true;
        keepingGuarded = false;
      }
      continue;
    }

    if (ENDIF_PATTERN.test(line)) {
      if (!skipping && !keepingGuarded) output.push(line);
      skipping = false;
      keepingGuarded = false;
      continue;
    }

    if (!skipping) output.push(line);
  }

  return {
    markdown: collapseBlankRuns(output).join('\n'),
    unresolved: [...unresolved].sort(),
  };
}

/** Removing a branch leaves blank lines behind; two in a row is enough. */
function collapseBlankRuns(lines: readonly string[]): string[] {
  const result: string[] = [];
  let blanks = 0;
  for (const line of lines) {
    if (line.trim().length === 0) {
      blanks += 1;
      if (blanks > 1) continue;
    } else {
      blanks = 0;
    }
    result.push(line);
  }
  while (result.length > 0 && result[result.length - 1]?.trim().length === 0) result.pop();
  return result;
}

/** Option fields a caller still has to choose, given what they have chosen. */
export function missingOptions(
  manifest: Manifest,
  chosen: Readonly<Record<string, string>> = {},
): { field: string; values: readonly string[] }[] {
  return Object.entries(manifest.options ?? {})
    .filter(([field]) => chosen[field] === undefined)
    .map(([field, values]) => ({ field, values }));
}
