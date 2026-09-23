import { z } from 'zod';
import { SLUG_PATTERN, terms, type Taxonomy } from './taxonomy.js';

/** https://semver.org — the official recommended pattern, anchored. */
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** GitHub login, as GitHub itself validates it. */
export const GITHUB_HANDLE_PATTERN = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

/** Calendar date, so a provenance record says when it was last checked. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
      /**
       * Who wrote this: a person, or a tool.
       *
       * A generated blueprint is one an agent drafted from the catalog's own
       * research. It can be correct — CI runs its recipe like any other — but
       * nobody has sat with it, and the difference between "the steps execute"
       * and "the steps are the right steps" is exactly what a reader is
       * trusting the catalog for. So it is said out loud, in the manifest, in
       * the index, and in what the MCP server returns (ADR 0011).
       *
       * Absent means `human`. Every blueprint written before this field
       * existed was written by a person, and a default that assumed otherwise
       * would be a lie about all of them.
       */
      provenance: z
        .enum(['human', 'generated'])
        .default('human')
        .describe('Who produced this blueprint. A generated one cannot be tier: official.'),
      /**
       * Where the blueprint came from, when it came from somewhere.
       *
       * Most blueprints are derived from a project that already exists —
       * `blueprint-author` exists to do exactly that — and the result is
       * handed to strangers under CC BY 4.0. A catalog cannot credit what it
       * did not write down (ADR 0008).
       */
      derived_from: z
        .object({
          url: z
            .url({ protocol: /^https$/ })
            .describe('The project this was derived from, as an https URL.'),
          license: z
            .string()
            .min(2)
            .max(60)
            .describe('The licence that project is under, SPDX where there is one.'),
          verified_on: z
            .string()
            .regex(ISO_DATE_PATTERN, 'must be an ISO date, YYYY-MM-DD')
            .describe('When the source was last read.'),
          note: z.string().min(1).max(300).optional(),
        })
        .strict()
        .optional(),
      /**
       * Who to work with, and what to install alongside it (ADR 0012).
       *
       * These are suggestions and nothing in a setup recipe may depend on
       * them: a recipe that needed an expert to exist would stop being
       * deterministic, which is the one property the recipe format sells.
       * `validate` checks that what is named exists; `get_blueprint` returns
       * it as a recommendation, not a requirement.
       */
      recommended_experts: uniqueArray(slug).optional(),
      recommended_crew: slug.nullable().default(null),
      integrations: uniqueArray(slug).optional(),
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
    // `official` is the catalog saying a person stands behind this. A tool
    // drafted it and CI ran it is a different claim, and it has its own tier
    // (ADR 0011). The schema refuses the combination rather than trusting
    // every future reviewer to notice it.
    if (manifest.provenance === 'generated' && manifest.tier === 'official') {
      ctx.addIssue({
        code: 'custom',
        path: ['tier'],
        message:
          'a generated blueprint cannot be tier: official — nobody has verified it by hand (ADR 0011)',
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
