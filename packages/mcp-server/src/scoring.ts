/**
 * Matching a profile to a blueprint.
 *
 * Two rules shape everything here:
 *
 * - A language the user already knows outranks every other signal. Somebody who
 *   writes C# does not want an excellent TypeScript blueprint.
 * - Only criteria the profile actually states are scored. An unstated field is
 *   not a zero, it is a question — and a question is only worth asking when its
 *   answer would change which blueprint wins.
 */

import type { CatalogIndex, IndexEntry, Taxonomy } from '@forgeprint/cli';

export interface Profile {
  // `| undefined` is explicit because the server runs with
  // exactOptionalPropertyTypes and these arrive from parsed tool input, where a
  // field the caller omitted is present and undefined.
  readonly languages?: readonly string[] | undefined;
  readonly stack?: readonly string[] | undefined;
  readonly skills?: readonly string[] | undefined;
  readonly goal?: string | undefined;
  readonly project_type?: string | undefined;
  readonly platforms?: readonly string[] | undefined;
  readonly distribution?: readonly string[] | undefined;
  readonly requirements?: readonly string[] | undefined;
  readonly constraints?: readonly string[] | undefined;
  readonly locale?: string | undefined;
}

/** Criteria in the order CLAUDE.md fixes; the numbers only encode that order. */
export const WEIGHTS = {
  languages: 40,
  project_type: 25,
  /** Not in the documented ordering, because a profile does not carry a stack;
   *  `search_blueprints` does, and a stated stack is a strong signal. */
  stack: 15,
  distribution: 12,
  platforms: 10,
  requirements: 9,
  text: 4,
} as const;

export type Criterion = keyof typeof WEIGHTS;

export interface Score {
  readonly entry: IndexEntry;
  /** 0–1, normalized over the criteria the profile states. */
  readonly total: number;
  readonly parts: Readonly<Partial<Record<Criterion, number>>>;
  /** Why it fits, in plain English. */
  readonly reasons: readonly string[];
  /** Why it does not, in plain English. Empty means nothing is wrong with it. */
  readonly mismatches: readonly string[];
}

/** Below this, calling something a match would be a fabrication. */
export const MATCH_FLOOR = 0.45;

/** Within this, two candidates are close enough that the user should choose. */
export const CLOSE_MARGIN = 0.08;

/**
 * Whether two candidates are close enough to put the choice to the user.
 *
 * Closeness in total score is not enough. Requirements are the most specific
 * thing a user says — "it must be multi-tenant" is not a preference — and the
 * weighting that keeps languages on top makes one uncovered requirement worth
 * only a few points. So a candidate that covers more of what was actually asked
 * for wins outright rather than being offered as one of two.
 */
export function isGenuineTie(best: Score, runnerUp: Score): boolean {
  if (best.total - runnerUp.total >= CLOSE_MARGIN) return false;
  const bestCovers = best.parts.requirements;
  const runnerUpCovers = runnerUp.parts.requirements;
  if (bestCovers === undefined || runnerUpCovers === undefined) return true;
  return bestCovers <= runnerUpCovers;
}

export function scoreCatalog(index: CatalogIndex, profile: Profile): Score[] {
  return index.blueprints
    .filter((entry) => !entry.deprecated)
    .map((entry) => scoreEntry(entry, profile, index.taxonomy))
    .sort((a, b) => b.total - a.total || a.entry.slug.localeCompare(b.entry.slug));
}

export function scoreEntry(entry: IndexEntry, profile: Profile, taxonomy: Taxonomy): Score {
  const parts: Partial<Record<Criterion, number>> = {};
  const reasons: string[] = [];
  const mismatches: string[] = [];
  const label = (vocabulary: keyof Taxonomy, id: string): string =>
    (taxonomy[vocabulary] as Record<string, string>)[id] ?? id;

  if (nonEmpty(profile.languages)) {
    const known = new Set(profile.languages);
    const matched = entry.languages.filter((language) => known.has(language));
    parts.languages = matched.length / entry.languages.length;
    if (matched.length === entry.languages.length) {
      reasons.push(
        `written in ${list(entry.languages.map((id) => label('languages', id)))}, which you know`,
      );
    } else if (matched.length > 0) {
      mismatches.push(
        `also needs ${list(
          entry.languages.filter((id) => !known.has(id)).map((id) => label('languages', id)),
        )}`,
      );
    } else {
      mismatches.push(
        `written in ${list(entry.languages.map((id) => label('languages', id)))}, which you did not list`,
      );
    }
  }

  if (isSet(profile.project_type)) {
    parts.project_type = entry.project_type === profile.project_type ? 1 : 0;
    if (entry.project_type === profile.project_type) {
      reasons.push(`builds ${withArticle(label('project_type', entry.project_type))}`);
    } else {
      mismatches.push(
        `builds ${withArticle(label('project_type', entry.project_type))}, not ${withArticle(
          label('project_type', profile.project_type),
        )}`,
      );
    }
  }

  coverage('stack', profile.stack, entry.stack);
  coverage('distribution', profile.distribution, entry.distribution);
  coverage('platforms', profile.platforms, entry.platforms);
  coverage('requirements', profile.requirements, entry.requirements);

  const text = profileText(profile);
  if (text.length > 0) {
    parts.text = overlap(tokenize(text), tokenize(`${entry.name} ${entry.summary}`));
  }

  return { entry, total: normalize(parts), parts, reasons, mismatches };

  function coverage(
    criterion: Extract<Criterion, 'stack' | 'distribution' | 'platforms' | 'requirements'>,
    wanted: readonly string[] | undefined,
    provided: readonly string[],
  ): void {
    if (!nonEmpty(wanted)) return;
    const has = new Set(provided);
    const covered = wanted.filter((value) => has.has(value));
    parts[criterion] = covered.length / wanted.length;
    const missing = wanted.filter((value) => !has.has(value));
    if (covered.length > 0) {
      reasons.push(`covers ${list(covered.map((id) => label(criterion, id)))}`);
    }
    if (missing.length > 0) {
      mismatches.push(`does not cover ${list(missing.map((id) => label(criterion, id)))}`);
    }
  }
}

function normalize(parts: Readonly<Partial<Record<Criterion, number>>>): number {
  let earned = 0;
  let possible = 0;
  for (const [criterion, value] of Object.entries(parts) as [Criterion, number][]) {
    earned += WEIGHTS[criterion] * value;
    possible += WEIGHTS[criterion];
  }
  return possible === 0 ? 0 : earned / possible;
}

export interface Question {
  /** Profile field the answer fills in. */
  readonly field: string;
  readonly question: string;
  /** Values that would actually change the result, with their labels. */
  readonly choices?: readonly { readonly id: string; readonly label: string }[];
  readonly why: string;
}

const REQUIRED_FIRST: readonly Question[] = [
  {
    field: 'languages',
    question: 'Which programming languages do you already write comfortably?',
    why: 'It is the heaviest matching criterion: a blueprint in a language you do not know is the wrong answer however good it is.',
  },
  {
    field: 'goal',
    question: 'What are you building, in a sentence or two?',
    why: 'It decides the project type, which is the second heaviest criterion.',
  },
];

/**
 * The questions worth asking for this profile.
 *
 * Asked in rounds. The two that always matter come first, on their own: piling
 * discriminating questions on top of "what are you building?" asks the user to
 * answer things they cannot answer yet.
 *
 * After those, a field is only asked about when two candidates are still close
 * enough that the answer could change which one wins. A clear leader means
 * there is nothing left to ask, and asking anyway wastes the user's turn.
 */
export function questionsFor(index: CatalogIndex, profile: Profile): Question[] {
  const required: Question[] = [];
  if (!nonEmpty(profile.languages)) required.push(REQUIRED_FIRST[0] as Question);
  if (!isSet(profile.project_type) && !isSet(profile.goal)) {
    required.push(REQUIRED_FIRST[1] as Question);
  }
  if (required.length > 0) return required;

  const questions: Question[] = [];
  const scored = scoreCatalog(index, profile);
  const best = scored[0];
  if (best === undefined) return questions;
  const candidates = scored.filter((score) => score === best || isGenuineTie(best, score));
  if (candidates.length < 2) return questions;

  const discriminators: {
    field: 'project_type' | 'distribution' | 'platforms' | 'requirements';
    vocabulary: keyof Taxonomy;
    question: string;
    why: string;
  }[] = [
    {
      field: 'project_type',
      vocabulary: 'project_type',
      question:
        'What kind of thing is it — an API, a web application, a mobile app, a game, a command-line tool, a library, an agent, or infrastructure?',
      why: 'The candidates build different kinds of thing.',
    },
    {
      field: 'distribution',
      vocabulary: 'distribution',
      question:
        'How will it reach its users — free, ad-supported, paid, in-app purchase, open source, SaaS, or internal only?',
      why: 'The candidates target different distribution models, and that changes what the setup wires up.',
    },
    {
      field: 'platforms',
      vocabulary: 'platforms',
      question: 'Where will it run?',
      why: 'The candidates target different platforms.',
    },
    {
      field: 'requirements',
      vocabulary: 'requirements',
      question: 'Which of these does the project actually need?',
      why: 'The candidates differ on exactly these capabilities, so the answer picks between them.',
    },
  ];

  for (const { field, vocabulary, question, why } of discriminators) {
    const stated = profile[field];
    if (isSet(stated) || nonEmpty(stated)) continue;
    const values = differingValues(candidates, field);
    if (values.length < 2) continue;
    questions.push({
      field,
      question,
      choices: values.map((id) => ({
        id,
        label: (index.taxonomy[vocabulary] as Record<string, string>)[id] ?? id,
      })),
      why,
    });
  }

  return questions;
}

/** Values of a field that the candidates do not agree on. */
function differingValues(
  candidates: readonly Score[],
  field: 'project_type' | 'distribution' | 'platforms' | 'requirements',
): string[] {
  const perCandidate = candidates.map((candidate) => {
    const value = candidate.entry[field];
    return new Set(typeof value === 'string' ? [value] : value);
  });
  const all = new Set(perCandidate.flatMap((values) => [...values]));
  // A value shared by every candidate cannot separate them.
  return [...all].filter((value) => !perCandidate.every((values) => values.has(value))).sort();
}

function profileText(profile: Profile): string {
  return [profile.goal ?? '', ...(profile.skills ?? []), ...(profile.constraints ?? [])]
    .join(' ')
    .trim();
}

const STOPWORDS = new Set(
  'a an the and or to of in on for with from by as it is are be want need build building make making using use my our new project app'.split(
    ' ',
  ),
);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9.+#-]+/)
      .map((token) => token.replace(/^[.+#-]+|[.+#-]+$/g, ''))
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function overlap(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

function nonEmpty(values: readonly string[] | undefined): values is readonly string[] {
  return values !== undefined && values.length > 0;
}

function isSet(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * "API service" -> "an API service", "Web application" -> "a web application".
 * An all-capitals first word is an acronym and keeps its case.
 */
function withArticle(label: string): string {
  const [first = '', ...rest] = label.split(' ');
  const isAcronym = first.length > 1 && first === first.toUpperCase();
  const phrase = [isAcronym ? first : first.toLowerCase(), ...rest].join(' ');
  const article = /^[aeiou]/i.test(phrase) ? 'an' : 'a';
  return `${article} ${phrase}`;
}

function list(values: readonly string[]): string {
  if (values.length <= 1) return values[0] ?? '';
  return `${values.slice(0, -1).join(', ')} and ${values[values.length - 1]}`;
}
