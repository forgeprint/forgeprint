import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { repoPaths } from './paths.js';

/** Identifiers used in manifests: lower kebab-case, ASCII only. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const termMap = z.record(z.string().regex(SLUG_PATTERN), z.string().min(1));

export const taxonomySchema = z
  .object({
    version: z.literal(1),
    languages: termMap,
    stack: termMap,
    platforms: termMap,
    distribution: termMap,
    project_type: termMap,
    audience: termMap,
    requirements: termMap,
    agents: termMap,
    tier: termMap,
  })
  .strict();

export type Taxonomy = z.infer<typeof taxonomySchema>;

/** Vocabulary names a manifest field can draw from. */
export type Vocabulary = Exclude<keyof Taxonomy, 'version'>;

export function parseTaxonomy(source: string): Taxonomy {
  return taxonomySchema.parse(parse(source));
}

export function loadTaxonomy(root: string): Taxonomy {
  const file = repoPaths.taxonomy(root);
  try {
    return parseTaxonomy(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid taxonomy at ${file}: ${describeError(error)}`, { cause: error });
  }
}

/** Sorted identifiers of one vocabulary. Sorted so generated output is stable. */
export function terms(taxonomy: Taxonomy, vocabulary: Vocabulary): string[] {
  return Object.keys(taxonomy[vocabulary]).sort();
}

export function describeError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
  }
  return error instanceof Error ? error.message : String(error);
}
