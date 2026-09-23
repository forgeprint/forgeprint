import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { repoPaths } from './paths.js';

/** Identifiers used in manifests: lower kebab-case, ASCII only. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const termMap = z.record(z.string().regex(SLUG_PATTERN), z.string().min(1));

/**
 * Spellings that mean an existing identifier.
 *
 * Not new values — the vocabularies stay closed (rule 8 and §3.1). These are
 * the words people write for a value that is already there: `golang` for `go`,
 * `k8s` for `kubernetes`. The key is free text because the whole point is the
 * spellings that are not identifiers; the value has to be one.
 */
const aliasMap = z.record(z.string().min(1), z.string().regex(SLUG_PATTERN));

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
    domains: termMap,
    roles: termMap,
    seniority: termMap,
    deliverables: termMap,
    integration_kind: termMap,
    agents: termMap,
    tier: termMap,
    aliases: z.record(z.string().min(1), aliasMap).optional(),
  })
  .strict()
  .superRefine((taxonomy, context) => {
    for (const [vocabulary, aliases] of Object.entries(taxonomy.aliases ?? {})) {
      const terms: Record<string, string> | undefined = (
        taxonomy as unknown as Record<string, Record<string, string> | undefined>
      )[vocabulary];
      if (terms === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['aliases', vocabulary],
          message: `"${vocabulary}" is not a vocabulary`,
        });
        continue;
      }
      for (const [alias, id] of Object.entries(aliases)) {
        if (!(id in terms)) {
          context.addIssue({
            code: 'custom',
            path: ['aliases', vocabulary, alias],
            message: `"${id}" is not in ${vocabulary}`,
          });
        }
        if (alias in terms) {
          // An alias that is already an identifier is either a mistake or a
          // rename in disguise, and either way it can only cause confusion.
          context.addIssue({
            code: 'custom',
            path: ['aliases', vocabulary, alias],
            message: `"${alias}" is already an identifier in ${vocabulary}`,
          });
        }
      }
    }
  });

export type Taxonomy = z.infer<typeof taxonomySchema>;

/** Vocabulary names a manifest field can draw from. */
export type Vocabulary = Exclude<keyof Taxonomy, 'version' | 'aliases'>;

/** Every vocabulary, in a fixed order, for code that has to walk them all. */
export const VOCABULARIES = [
  'languages',
  'stack',
  'platforms',
  'distribution',
  'project_type',
  'audience',
  'requirements',
  'domains',
  'roles',
  'seniority',
  'deliverables',
  'integration_kind',
  'agents',
  'tier',
] as const satisfies readonly Vocabulary[];

/** The spellings declared for one vocabulary: alias to identifier. */
export function aliasesFor(taxonomy: Taxonomy, vocabulary: Vocabulary): Record<string, string> {
  return taxonomy.aliases?.[vocabulary] ?? {};
}

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
