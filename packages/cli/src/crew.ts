import { z } from 'zod';
import { MAX_CREW_MEMBERS } from './expert.js';
import type { Taxonomy } from './taxonomy.js';
import { commonFields, refineCommon, slug, uniqueArray } from './unit.js';

/**
 * The shape of a crew manifest.
 *
 * A crew composes and never copies (ADR 0012): it names experts and
 * integrations by slug and holds no content of its own. That is what keeps it
 * on the right side of ADR 0001 — nothing inherits, nothing is forked, and
 * editing an expert changes every crew that names it.
 */
export function crewObjectSchema(taxonomy: Taxonomy) {
  return z
    .object({
      ...commonFields(taxonomy),
      /**
       * The contributor's name for it, shown on the crew's page.
       *
       * A crew is the one unit here that is somebody's opinion about who
       * belongs together, so it is published under their name rather than the
       * catalog's.
       */
      byline: z.string().min(2).max(80),
      members: uniqueArray(slug).max(MAX_CREW_MEMBERS),
      integrations: uniqueArray(slug).optional(),
      /** What this crew is assembled for, in one sentence a reader can refuse. */
      for_what: z.string().min(20).max(300),
      /** Where it is the wrong team. An answer of "nothing" is not an answer. */
      not_for: z.string().min(20).max(300),
    })
    .strict();
}

export function crewSchema(taxonomy: Taxonomy) {
  return crewObjectSchema(taxonomy).superRefine(refineCommon);
}

export type Crew = z.infer<ReturnType<typeof crewObjectSchema>>;

/**
 * The set that must be unique across the catalog: two crews with the same
 * members and the same integrations are the same crew under two names.
 */
export function crewCombinationKey(crew: Crew): string {
  const members = [...crew.members].sort().join(',');
  const integrations = [...(crew.integrations ?? [])].sort().join(',');
  return `${members}|${integrations}`;
}
