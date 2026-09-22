import type { Taxonomy } from 'forgeprint';
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
}

/**
 * Compare on: lower case, and without the characters people vary on. `C#`,
 * `c#` and `C #` all reach `c#`; `API service` reaches `apiservice`. Kept
 * deliberately narrow — it folds punctuation and case, never words, so
 * `db-per-tenant` can never become `per-tenant`.
 */
function key(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '');
}

/** id → id, label → id, for one vocabulary. */
function lookupTable(taxonomy: Taxonomy, vocabulary: keyof Taxonomy): Map<string, string> {
  const table = new Map<string, string>();
  for (const [id, label] of Object.entries(taxonomy[vocabulary] as Record<string, string>)) {
    table.set(key(id), id);
    // An id never loses to a label: two vocabularies could disagree, and the
    // id is what the catalog is written in.
    if (!table.has(key(label))) table.set(key(label), id);
  }
  return table;
}

/**
 * Rewrite every controlled value the caller sent into the identifier the
 * catalog uses, and collect the ones that matched nothing.
 */
export function normalizeProfile(profile: Profile, taxonomy: Taxonomy): NormalizedProfile {
  const unrecognised: string[] = [];
  const result: Record<string, unknown> = { ...profile };

  for (const [field, vocabulary] of Object.entries(VOCABULARIES) as [
    ControlledField,
    keyof Taxonomy,
  ][]) {
    const stated = profile[field];
    if (stated === undefined) continue;
    const table = lookupTable(taxonomy, vocabulary);

    const translate = (value: string): string => {
      const found = table.get(key(value));
      if (found !== undefined) return found;
      unrecognised.push(`${field}: ${value}`);
      // Left as it was: it still counts as text, and the caller is told.
      return value;
    };

    result[field] = typeof stated === 'string' ? translate(stated) : stated.map(translate);
  }

  const stated = (result['requirements'] as string[] | undefined) ?? [];
  const inferred = requirementsIn(profile.goal, taxonomy).filter((id) => !stated.includes(id));
  if (inferred.length > 0) result['requirements'] = [...stated, ...inferred];

  return { profile: result, unrecognised, inferred };
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
