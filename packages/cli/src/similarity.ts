/**
 * Duplicate report (rule 10).
 *
 * The catalog is curated, so the question asked of every new blueprint is not
 * "is it good" but "is it already here". This compares one blueprint against
 * every other by tag overlap and by the wording of its `AGENTS.md` and
 * `setup.md`, and names the closest match.
 */

import { readBlueprintFile, type Blueprint } from './catalog.js';
import type { Manifest } from './manifest.js';

/** Above this, a reviewer is asked to justify the blueprint's existence. */
export const DEFAULT_THRESHOLD = 0.7;

export interface SimilarityScore {
  readonly slug: string;
  readonly name: string;
  /** Jaccard overlap of the tag sets, 0–1. */
  readonly tags: number;
  /** Cosine similarity of the TF-IDF vectors of AGENTS.md, 0–1. */
  readonly agents: number;
  /** Cosine similarity of the TF-IDF vectors of setup.md, 0–1. */
  readonly setup: number;
  /** The highest of the three: what the threshold is applied to. */
  readonly highest: number;
  /** Tags only the subject has, and tags only the other one has. */
  readonly onlyHere: readonly string[];
  readonly onlyThere: readonly string[];
  /** True when the two claim the same stack, project type and requirements. */
  readonly sameCombination: boolean;
}

export interface SimilarityReport {
  readonly slug: string;
  readonly threshold: number;
  /** Every other blueprint, most similar first. */
  readonly scores: readonly SimilarityScore[];
  readonly closest: SimilarityScore | undefined;
  /** True when the closest blueprint is above the threshold. */
  readonly flagged: boolean;
}

export function compareBlueprints(
  subject: Blueprint,
  others: readonly Blueprint[],
  threshold: number = DEFAULT_THRESHOLD,
): SimilarityReport {
  const corpus = [subject, ...others];
  const agentsIdf = inverseDocumentFrequency(corpus.map((b) => tokens(fileOf(b, 'AGENTS.md'))));
  const setupIdf = inverseDocumentFrequency(corpus.map((b) => tokens(fileOf(b, 'setup.md'))));

  const subjectAgents = vector(tokens(fileOf(subject, 'AGENTS.md')), agentsIdf);
  const subjectSetup = vector(tokens(fileOf(subject, 'setup.md')), setupIdf);
  const subjectTags = tagSet(subject.manifest);

  const scores = others
    .map((other): SimilarityScore => {
      const otherTags = tagSet(other.manifest);
      const tags = jaccard(subjectTags, otherTags);
      const agents = cosine(subjectAgents, vector(tokens(fileOf(other, 'AGENTS.md')), agentsIdf));
      const setup = cosine(subjectSetup, vector(tokens(fileOf(other, 'setup.md')), setupIdf));
      return {
        slug: other.slug,
        name: other.manifest.name,
        tags,
        agents,
        setup,
        highest: Math.max(tags, agents, setup),
        onlyHere: [...subjectTags].filter((tag) => !otherTags.has(tag)).sort(),
        onlyThere: [...otherTags].filter((tag) => !subjectTags.has(tag)).sort(),
        sameCombination: combination(subject.manifest) === combination(other.manifest),
      };
    })
    .sort((a, b) => b.highest - a.highest || a.slug.localeCompare(b.slug));

  const closest = scores[0];
  return {
    slug: subject.slug,
    threshold,
    scores,
    closest,
    flagged: closest !== undefined && closest.highest > threshold,
  };
}

/** Render the report the way a reviewer reads it. */
export function renderReport(report: SimilarityReport): string {
  const lines: string[] = [`similarity report for ${report.slug}`];
  if (report.scores.length === 0) {
    lines.push('  no other blueprint in the catalog to compare against');
    return lines.join('\n');
  }

  lines.push('');
  lines.push('  blueprint                        tags   AGENTS.md   setup.md');
  for (const score of report.scores) {
    lines.push(
      `  ${score.slug.padEnd(30)}  ${percent(score.tags)}  ${percent(score.agents).padStart(9)}  ${percent(
        score.setup,
      ).padStart(8)}`,
    );
  }

  const closest = report.closest;
  if (closest === undefined) return lines.join('\n');

  lines.push('');
  lines.push(`  closest: ${closest.slug} (${closest.name})`);
  lines.push(`  only in ${report.slug}: ${closest.onlyHere.join(', ') || '(nothing)'}`);
  lines.push(`  only in ${closest.slug}: ${closest.onlyThere.join(', ') || '(nothing)'}`);

  if (closest.sameCombination) {
    lines.push('');
    lines.push(
      `  REJECTED: ${closest.slug} claims the same stack + project_type + requirements (rule 9).`,
    );
    lines.push('           Improve it, add an option to it, or supersede it.');
  } else if (report.flagged) {
    lines.push('');
    lines.push(
      `  RED FLAG: ${percent(closest.highest)} similar to ${closest.slug}, over the ${percent(
        report.threshold,
      )} threshold.`,
    );
    lines.push('           State in the pull request what is different and why this is not a');
    lines.push('           change to that blueprint instead.');
  }
  return lines.join('\n');
}

function percent(value: number): string {
  return `${(value * 100).toFixed(0).padStart(3)}%`;
}

function fileOf(blueprint: Blueprint, file: string): string {
  return blueprint.files.includes(file) ? readBlueprintFile(blueprint, file) : '';
}

function combination(manifest: Manifest): string {
  return [
    [...manifest.stack].sort().join(','),
    manifest.project_type,
    [...manifest.requirements].sort().join(','),
  ].join('|');
}

/** Every tag, namespaced so that `docker` as a platform and as a stack differ. */
function tagSet(manifest: Manifest): Set<string> {
  const tags = new Set<string>([`type:${manifest.project_type}`]);
  const add = (prefix: string, values: readonly string[]): void => {
    for (const value of values) tags.add(`${prefix}:${value}`);
  };
  add('stack', manifest.stack);
  add('lang', manifest.languages);
  add('platform', manifest.platforms);
  add('dist', manifest.distribution);
  add('req', manifest.requirements);
  return tags;
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/**
 * Words worth comparing: markdown syntax, code punctuation and the most common
 * English filler are dropped, because every blueprint contains them.
 */
const STOPWORDS = new Set(
  (
    'a an the and or but if then than that this these those is are was were be been being ' +
    'to of in on at for with from by as it its use uses using you your we our they them ' +
    'not no yes do does done can may will shall should would could there here when while ' +
    'each every any all one two some more most other same such only also just into out up ' +
    'down over under again further once about after before between during'
  ).split(' '),
);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9.+#-]+/)
    .map((token) => token.replace(/^[.+#-]+|[.+#-]+$/g, ''))
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function inverseDocumentFrequency(documents: readonly (readonly string[])[]): Map<string, number> {
  const count = new Map<string, number>();
  for (const document of documents) {
    for (const token of new Set(document)) {
      count.set(token, (count.get(token) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  const total = documents.length;
  for (const [token, seen] of count) {
    idf.set(token, Math.log((total + 1) / (seen + 1)) + 1);
  }
  return idf;
}

function vector(
  document: readonly string[],
  idf: ReadonlyMap<string, number>,
): Map<string, number> {
  const frequency = new Map<string, number>();
  for (const token of document) frequency.set(token, (frequency.get(token) ?? 0) + 1);
  const weighted = new Map<string, number>();
  for (const [token, count] of frequency) {
    weighted.set(token, (count / document.length) * (idf.get(token) ?? 1));
  }
  return weighted;
}

function cosine(a: ReadonlyMap<string, number>, b: ReadonlyMap<string, number>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let dot = 0;
  for (const [token, weight] of a) dot += weight * (b.get(token) ?? 0);
  const magnitude = (vec: ReadonlyMap<string, number>): number =>
    Math.sqrt([...vec.values()].reduce((sum, value) => sum + value * value, 0));
  const scale = magnitude(a) * magnitude(b);
  return scale === 0 ? 0 : Math.min(1, dot / scale);
}
