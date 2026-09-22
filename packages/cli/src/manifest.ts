import { z } from 'zod';
import { SLUG_PATTERN, terms, type Taxonomy } from './taxonomy.js';

/** https://semver.org — the official recommended pattern, anchored. */
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** GitHub login, as GitHub itself validates it. */
export const GITHUB_HANDLE_PATTERN = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

/** A tool with an optional version constraint, for example `dotnet>=9`. */
const REQUIRED_TOOL_PATTERN =
  /^[a-z0-9][a-z0-9.+-]*(?:\s*(?:>=|<=|==|>|<|~|\^)\s*[0-9][0-9a-zA-Z.-]*)?$/;

/** ADR 0001: variation is limited so the option matrix stays testable. */
export const MAX_OPTION_FIELDS = 3;
export const MAX_OPTION_VALUES = 3;
export const MIN_OPTION_VALUES = 2;

const slug = z.string().regex(SLUG_PATTERN, 'must be lower kebab-case');

function vocabulary(taxonomy: Taxonomy, name: Parameters<typeof terms>[1]) {
  const values = terms(taxonomy, name);
  if (values.length === 0) throw new Error(`Taxonomy vocabulary "${name}" is empty`);
  return z.enum(values as [string, ...string[]]);
}

function uniqueArray<T extends z.ZodType>(item: T, min = 1) {
  return z
    .array(item)
    .min(min)
    .refine((values) => new Set(values).size === values.length, 'must not contain duplicates');
}

/**
 * The manifest shape without cross-field rules, so that it can be rendered as
 * JSON Schema. `manifestSchema` adds the rules that JSON Schema cannot express.
 */
export function manifestObjectSchema(taxonomy: Taxonomy) {
  return z
    .object({
      schema: z.literal(1),
      slug,
      name: z.string().min(3).max(80),
      version: z.string().regex(SEMVER_PATTERN, 'must be a semantic version'),
      tier: vocabulary(taxonomy, 'tier'),
      maintainers: uniqueArray(z.string().regex(GITHUB_HANDLE_PATTERN, 'must be a GitHub login')),
      summary: z.string().min(20).max(200),
      stack: uniqueArray(vocabulary(taxonomy, 'stack')),
      languages: uniqueArray(vocabulary(taxonomy, 'languages')),
      platforms: uniqueArray(vocabulary(taxonomy, 'platforms')),
      distribution: uniqueArray(vocabulary(taxonomy, 'distribution')),
      project_type: vocabulary(taxonomy, 'project_type'),
      audience: uniqueArray(vocabulary(taxonomy, 'audience')),
      requirements: uniqueArray(vocabulary(taxonomy, 'requirements')),
      agents: uniqueArray(vocabulary(taxonomy, 'agents')),
      options: z
        .record(slug, uniqueArray(slug, MIN_OPTION_VALUES).max(MAX_OPTION_VALUES))
        .optional(),
      provides: z
        .object({
          mcp: uniqueArray(slug).optional(),
          skills: uniqueArray(slug).optional(),
        })
        .strict()
        .optional(),
      requires_tools: uniqueArray(
        z.string().regex(REQUIRED_TOOL_PATTERN, 'must be a tool name with an optional version'),
      ).optional(),
      deprecated: z.boolean().default(false),
      supersedes: slug.nullable().default(null),
    })
    .strict();
}

/** Runtime validation schema: the object shape plus cross-field rules. */
export function manifestSchema(taxonomy: Taxonomy) {
  return manifestObjectSchema(taxonomy).superRefine((manifest, ctx) => {
    const fields = Object.keys(manifest.options ?? {});
    if (fields.length > MAX_OPTION_FIELDS) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: `at most ${MAX_OPTION_FIELDS} option fields are allowed, found ${fields.length} (ADR 0001)`,
      });
    }
    if (manifest.supersedes === manifest.slug) {
      ctx.addIssue({
        code: 'custom',
        path: ['supersedes'],
        message: 'a blueprint cannot supersede itself',
      });
    }
  });
}

export type Manifest = z.infer<ReturnType<typeof manifestObjectSchema>>;

/**
 * The combination that must be unique across the catalog (rule 9): two
 * blueprints may not claim the same stack, project type and requirements.
 */
export function combinationKey(manifest: Manifest): string {
  const stack = [...manifest.stack].sort().join(',');
  const requirements = [...manifest.requirements].sort().join(',');
  return `${stack}|${manifest.project_type}|${requirements}`;
}
