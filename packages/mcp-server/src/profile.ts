import { aliasesFor, type Taxonomy, type Vocabulary } from 'forgeprint';
import type { Profile } from './scoring.js';

/**
 * Taking the profile as the user's agent actually writes it.
 *
 * The taxonomy has an identifier and a label for every value: `csharp` and
 * "C#", `dotnet` and ".NET", `api` and "API service". An agent relaying a
 * person who said "I know C#" writes `C#`, which is the right answer in the
 * wrong alphabet — and the resolver scored it as a language the user does not
 * know, which is the single heaviest criterion. "I know C#" came back as
 * "nothing in the catalog fits".
 *
 * So the ids are what the catalog stores, and both are what the server
 * accepts. Anything it still cannot place is left alone and reported, because
 * a value nobody recognised is worth saying out loud rather than scoring as a
 * silent zero.
 */

/** The profile fields that carry controlled values, and their vocabularies. */
const VOCABULARIES = {
  languages: 'languages',
  stack: 'stack',
  project_type: 'project_type',
  platforms: 'platforms',
  distribution: 'distribution',
  requirements: 'requirements',
} as const satisfies Partial<Record<keyof Profile, keyof Taxonomy>>;

type ControlledField = keyof typeof VOCABULARIES;

export interface NormalizedProfile {
  readonly profile: Profile;
  /** `field: value` for everything that matched nothing in the taxonomy. */
  readonly unrecognised: readonly string[];
  /** Requirement ids read out of the goal sentence rather than stated. */
  readonly inferred: readonly string[];
  /** Values that belonged to another field, and were scored from there. */
  readonly corrections: readonly Correction[];
}

export interface Correction {
  /** Where the caller put it, spelled the way they spelled it. */
  readonly from: string;
  /** Where it belongs, as `field: id`. */
  readonly to: string;
}

/**
 * Compare on: lower case, and without the characters people vary on. `C#`,
 * `c#` and `C #` all reach `c#`; `Node.js`, `node-js` and `nodejs` all reach
 * `nodejs`; `.NET` reaches `net`. Kept deliberately narrow — it folds
 * separators and case, never words, so `db-per-tenant` can never become
 * `per-tenant`, and it keeps `#` and `+` because `C#` and `C++` are not `c`.
 */
function key(value: string): string {
  return value.toLowerCase().replace(/[\s_.-]+/g, '');
}

/** id → id, label → id, alias → id, for one vocabulary. */
function lookupTable(taxonomy: Taxonomy, vocabulary: Vocabulary): Map<string, string> {
  const table = new Map<string, string>();
  for (const [alias, id] of Object.entries(aliasesFor(taxonomy, vocabulary))) {
    table.set(key(alias), id);
  }
  for (const [id, label] of Object.entries(taxonomy[vocabulary])) {
    // An identifier outranks a label, and a label outranks an alias: the
    // catalog is written in identifiers.
    table.set(key(id), id);
    if (!table.has(key(label))) table.set(key(label), id);
  }
  return table;
}

/**
 * The field a value belongs to, when it is not in the one it was put in.
 *
 * "SaaS" arrived as a requirement, which is a reasonable mistake — it is a
 * distribution model — and the resolver scored it as a requirement nothing
 * covers. Rather than fail or ignore it, the value is scored from the field it
 * actually belongs to and the caller is told where it went. Only an
 * unambiguous claim counts: a spelling two vocabularies both recognise is
 * left where it was, because moving it would be a guess.
 */
function fieldFor(
  value: string,
  except: ControlledField,
  taxonomy: Taxonomy,
): { field: ControlledField; id: string } | undefined {
  const claims: { field: ControlledField; id: string }[] = [];
  for (const [field, vocabulary] of entries()) {
    if (field === except) continue;
    const id = lookupTable(taxonomy, vocabulary).get(key(value));
    if (id !== undefined) claims.push({ field, id });
  }
  return claims.length === 1 ? claims[0] : undefined;
}

function entries(): [ControlledField, Vocabulary][] {
  return Object.entries(VOCABULARIES) as [ControlledField, Vocabulary][];
}

/**
 * Rewrite every controlled value the caller sent into the identifier the
 * catalog uses, and collect the ones that matched nothing.
 */
export function normalizeProfile(profile: Profile, taxonomy: Taxonomy): NormalizedProfile {
  const unrecognised: string[] = [];
  const corrections: Correction[] = [];
  const moved = new Map<ControlledField, string[]>();
  const result: Record<string, unknown> = { ...profile };

  for (const [field, vocabulary] of entries()) {
    const stated = profile[field];
    if (stated === undefined) continue;
    const table = lookupTable(taxonomy, vocabulary);

    const translate = (value: string): string | undefined => {
      const found = table.get(key(value));
      if (found !== undefined) return found;

      const elsewhere = fieldFor(value, field, taxonomy);
      if (elsewhere !== undefined) {
        corrections.push({ from: `${field}: ${value}`, to: `${elsewhere.field}: ${elsewhere.id}` });
        moved.set(elsewhere.field, [...(moved.get(elsewhere.field) ?? []), elsewhere.id]);
        // Removed from here: scoring it against this vocabulary is what made
        // a multi-tenant blueprint "not cover" SaaS.
        return undefined;
      }

      unrecognised.push(`${field}: ${value}`);
      // Left as it was: it still counts as text, and the caller is told.
      return value;
    };

    if (typeof stated === 'string') {
      // undefined rather than delete: the field was moved elsewhere, and an
      // absent value and a deleted key mean the same thing to every reader.
      result[field] = translate(stated);
    } else {
      result[field] = stated.map(translate).filter((value) => value !== undefined);
    }
  }

  for (const [field, ids] of moved) {
    const existing = result[field];
    if (typeof existing === 'string' || (existing === undefined && field === 'project_type')) {
      // One value per field: an explicit answer is not overwritten by a
      // correction, so a stated project type wins.
      if (existing === undefined) result[field] = ids[0];
      continue;
    }
    const before = (existing as string[] | undefined) ?? [];
    result[field] = [...before, ...ids.filter((id) => !before.includes(id))];
  }

  const stated = (result['requirements'] as string[] | undefined) ?? [];
  const inferred = requirementsIn(profile.goal, taxonomy).filter((id) => !stated.includes(id));
  if (inferred.length > 0) result['requirements'] = [...stated, ...inferred];

  return { profile: result, unrecognised, inferred, corrections };
}

/** Words that turn a requirement in a sentence into its opposite. */
const NEGATIONS = new Set(['no', 'not', 'without', 'never', 'skip', 'avoid', 'dont', 'doesnt']);

/** How far back a negation still applies: "not going to be multi-tenant". */
const NEGATION_WINDOW = 4;

/**
 * The requirements a sentence names.
 *
 * "I'm building a multi-tenant SaaS API" says the decisive thing in the
 * weakest field: free text is worth four points against forty for a language,
 * so the resolver put two blueprints within three points of each other and
 * asked the user to choose between them — over a word they had already said.
 *
 * Only `requirements` is read this way. It is the vocabulary people actually
 * put in a sentence, and the one that separates blueprints that are otherwise
 * the same shape. Guessing a language or a platform from prose would be
 * guessing.
 */
export function requirementsIn(goal: string | undefined, taxonomy: Taxonomy): string[] {
  if (goal === undefined || goal.trim() === '') return [];
  const table = lookupTable(taxonomy, 'requirements');
  const words = goal
    .toLowerCase()
    .split(/[^a-z0-9#+.-]+/)
    .filter((word) => word !== '');
  const found: string[] = [];

  for (let at = 0; at < words.length; at += 1) {
    for (let span = 1; span <= 3 && at + span <= words.length; span += 1) {
      const id = table.get(key(words.slice(at, at + span).join('')));
      if (id === undefined || found.includes(id)) continue;
      // "not multi-tenant" is not a requirement for multi-tenancy.
      const before = words.slice(Math.max(0, at - NEGATION_WINDOW), at);
      if (before.some((word) => NEGATIONS.has(word.replace(/[^a-z]/g, '')))) continue;
      found.push(id);
    }
  }
  return found;
}

/** Fewer words than this says nothing, unless one of them is a catalog term. */
const MIN_GOAL_WORDS = 3;

/**
 * Whether a goal is worth scoring, or is really an unanswered question.
 *
 * "hi" and "an app" are not project descriptions. Treated as stated they let
 * the resolver normalise a score over one criterion and hand back whatever
 * blueprint happens to be written in the right language — a fabricated match,
 * which is the one thing the resolver must never produce. Treated as missing,
 * they become the question they always were.
 *
 * A short sentence that names something the catalog knows — "a CLI",
 * "multi-tenant" — is a real answer and counts.
 */
export function goalSaysSomething(goal: string | undefined, taxonomy: Taxonomy): boolean {
  if (goal === undefined) return false;
  const words = goal
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '');
  if (words.length >= MIN_GOAL_WORDS) return true;
  if (words.length === 0) return false;
  return entries().some(([, vocabulary]) => {
    const table = lookupTable(taxonomy, vocabulary);
    return words.some((word) => table.has(key(word)));
  });
}
