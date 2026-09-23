import { z } from 'zod';
import { SLUG_PATTERN, terms, type Taxonomy } from './taxonomy.js';

/** https://semver.org — the official recommended pattern, anchored. */
export const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/** GitHub login, as GitHub itself validates it. */
export const GITHUB_HANDLE_PATTERN = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

export const slug = z.string().regex(SLUG_PATTERN, 'must be lower kebab-case');

export function vocabulary(taxonomy: Taxonomy, name: Parameters<typeof terms>[1]) {
  const values = terms(taxonomy, name);
  if (values.length === 0) throw new Error(`Taxonomy vocabulary "${name}" is empty`);
  return z.enum(values as [string, ...string[]]);
}

export function uniqueArray<T extends z.ZodType>(item: T, min = 1) {
  return z
    .array(item)
    .min(min)
    .refine((values) => new Set(values).size === values.length, 'must not contain duplicates');
}

/**
 * The fields every catalogued thing carries, whatever kind it is.
 *
 * Blueprints, experts, crews and integrations are four different answers to
 * four different questions (ADR 0012), but they are governed by the same
 * rules: a semantic version that moves with every change (rule 16), a
 * CHANGELOG entry behind it (rule 17), a maintainer who owns it (rule 15), a
 * tier that says how much the catalog is claiming (rule 14), and a record of
 * whether a person wrote it (ADR 0011).
 */
export function commonFields(taxonomy: Taxonomy) {
  return {
    schema: z.literal(1),
    slug,
    name: z.string().min(3).max(80),
    version: z.string().regex(SEMVER_PATTERN, 'must be a semantic version'),
    tier: vocabulary(taxonomy, 'tier'),
    maintainers: uniqueArray(z.string().regex(GITHUB_HANDLE_PATTERN, 'must be a GitHub login')),
    summary: z.string().min(20).max(200),
    agents: uniqueArray(vocabulary(taxonomy, 'agents')),
    provenance: z
      .enum(['human', 'generated'])
      .default('human')
      .describe('Who produced this. A generated one cannot be tier: official.'),
    deprecated: z.boolean().default(false),
    supersedes: slug.nullable().default(null),
  };
}

/**
 * The cross-field rules every kind shares.
 *
 * `official` is the catalog saying a person stands behind this; a tool drafted
 * it and CI ran it is a different claim, and it has its own tier (ADR 0011).
 */
export function refineCommon(
  unit: { slug: string; tier: string; provenance: string; supersedes: string | null },
  ctx: z.RefinementCtx,
): void {
  if (unit.supersedes === unit.slug) {
    ctx.addIssue({ code: 'custom', path: ['supersedes'], message: 'cannot supersede itself' });
  }
  if (unit.provenance === 'generated' && unit.tier === 'official') {
    ctx.addIssue({
      code: 'custom',
      path: ['tier'],
      message:
        'a generated entry cannot be tier: official — nobody has verified it by hand (ADR 0011)',
    });
  }
}

/** The four kinds of thing the catalog holds, and where each one lives. */
export const UNIT_KINDS = ['blueprint', 'expert', 'crew', 'integration'] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

export const UNIT_DIRECTORY: Record<UnitKind, string> = {
  blueprint: 'blueprints',
  expert: 'experts',
  crew: 'crews',
  integration: 'integrations',
};

/**
 * Files each kind must contain.
 *
 * An expert carries `references.md` because an expert with no sources is an
 * assertion, and `overview.md` because `compare` is generated from it. A crew
 * and an integration carry a README because that is the whole of what they
 * are: a crew composes and an integration installs; neither holds content.
 */
export const REQUIRED_FILES: Record<UnitKind, readonly string[]> = {
  blueprint: ['manifest.yaml', 'AGENTS.md', 'overview.md', 'setup.md', 'CHANGELOG.md'],
  expert: ['manifest.yaml', 'SKILL.md', 'overview.md', 'references.md', 'CHANGELOG.md'],
  crew: ['manifest.yaml', 'README.md', 'CHANGELOG.md'],
  integration: ['manifest.yaml', 'README.md', 'CHANGELOG.md'],
};
