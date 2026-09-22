import { z } from 'zod';
import { manifestObjectSchema } from './manifest.js';
import { stableJson } from './json.js';
import type { Taxonomy } from './taxonomy.js';

const HEADER = {
  title: 'Forgeprint blueprint manifest',
  description:
    'Generated from schema/taxonomy.yaml by `forgeprint build-schema`. Do not edit by hand. ' +
    'Rules that JSON Schema cannot express — the option field limit, the uniqueness of the ' +
    'stack/project_type/requirements combination, and CHANGELOG consistency — are enforced by ' +
    '`forgeprint validate`.',
};

/** Render the manifest schema as JSON Schema text, for editors and other tools. */
export function buildManifestJsonSchema(taxonomy: Taxonomy): string {
  const generated = z.toJSONSchema(manifestObjectSchema(taxonomy), {
    target: 'draft-2020-12',
  }) as Record<string, unknown>;
  const { $schema, ...rest } = generated;
  return stableJson({
    $schema: $schema ?? 'https://json-schema.org/draft/2020-12/schema',
    ...HEADER,
    ...(markArraysUnique(rest) as Record<string, unknown>),
  });
}

/**
 * Every array field in a manifest rejects duplicates. That rule lives in a Zod
 * refinement, which has no JSON Schema equivalent, so it is restored here.
 */
function markArraysUnique(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(markArraysUnique);
  if (node === null || typeof node !== 'object') return node;
  const entries = Object.entries(node as Record<string, unknown>).map(
    ([key, value]) => [key, markArraysUnique(value)] as const,
  );
  const result = Object.fromEntries(entries);
  if (result['type'] === 'array') result['uniqueItems'] = true;
  return result;
}
