import { z } from 'zod';
import type { Taxonomy } from './taxonomy.js';
import { commonFields, refineCommon, slug, uniqueArray, vocabulary } from './unit.js';

/** ADR 0012: a crew is a team, not a catalogue with a title. */
export const MAX_CREW_MEMBERS = 6;

/**
 * The shape of an expert manifest, without the cross-field rules.
 *
 * An expert is a way of working, and the manifest is where that claim is made
 * checkable (ADR 0012). `deliverables` says what comes out, `checklists` says
 * what is applied, and both are refused if they are empty — an expert that
 * produces nothing and checks nothing is a job title.
 */
export function expertObjectSchema(taxonomy: Taxonomy) {
  return z
    .object({
      ...commonFields(taxonomy),
      role: vocabulary(taxonomy, 'roles'),
      domain: vocabulary(taxonomy, 'domains'),
      seniority: vocabulary(taxonomy, 'seniority'),
      /** Where the expert is fluent. Absent for a role that is not code-bound. */
      languages: uniqueArray(vocabulary(taxonomy, 'languages')).optional(),
      stack: uniqueArray(vocabulary(taxonomy, 'stack')).optional(),
      deliverables: uniqueArray(vocabulary(taxonomy, 'deliverables')),
      /** One per file in `checklists/`; validate refuses a name with no file. */
      checklists: uniqueArray(slug),
      /** Experts that answer a neighbouring question, for `recommend_experts`. */
      pairs_with: uniqueArray(slug).optional(),
    })
    .strict();
}

export function expertSchema(taxonomy: Taxonomy) {
  return expertObjectSchema(taxonomy).superRefine((expert, ctx) => {
    refineCommon(expert, ctx);
    if (expert.pairs_with?.includes(expert.slug) === true) {
      ctx.addIssue({
        code: 'custom',
        path: ['pairs_with'],
        message: 'an expert cannot pair with itself',
      });
    }
  });
}

export type Expert = z.infer<ReturnType<typeof expertObjectSchema>>;

/**
 * The combination that must be unique across the catalog (rule 9, extended by
 * ADR 0012): two experts may not claim the same role, domain and seniority.
 */
export function expertCombinationKey(expert: Expert): string {
  return `${expert.role}|${expert.domain}|${expert.seniority}`;
}
