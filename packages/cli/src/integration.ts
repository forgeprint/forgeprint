import { z } from 'zod';
import { terms, type Taxonomy } from './taxonomy.js';
import { commonFields, refineCommon, uniqueArray, vocabulary } from './unit.js';

/** Environment variable name, as a shell would accept it. */
const ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * A moving target dressed as a version.
 *
 * `latest` is refused in a setup recipe for the reason it is refused here: a
 * recipe that resolves differently tomorrow is not a recipe (§3.2, rule 20).
 */
const FLOATING_VERSIONS = new Set(['latest', 'main', 'master', 'head', 'stable', 'edge', '*']);

/**
 * The shape of an integration manifest.
 *
 * Forgeprint hosts no code here. An integration is a pinned,
 * permission-documented way to install something somebody else publishes
 * (ADR 0012), which makes the fields below the whole of the product: if the
 * upstream, the pin and the permissions are not right, there is nothing else
 * to be right.
 */
export function integrationObjectSchema(taxonomy: Taxonomy) {
  return z
    .object({
      ...commonFields(taxonomy),
      kind: vocabulary(taxonomy, 'integration_kind'),
      /** The project being installed, as its own maintainers publish it. */
      upstream: z.url({ protocol: /^https$/ }),
      /** The pinned upstream release. Not this recipe's `version`. */
      upstream_version: z
        .string()
        .min(1)
        .max(60)
        .refine(
          (value) => !FLOATING_VERSIONS.has(value.trim().toLowerCase()),
          'must be a pinned version, not a moving tag (rule 20)',
        ),
      /** When somebody last opened `upstream` and confirmed all of this. */
      verified_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date, YYYY-MM-DD'),
      /**
       * The install command per agent, keyed by an id from the registry.
       *
       * Not every agent installs an MCP server from a command — several are
       * configured by editing a file — so this is a partial map, and
       * `get_integration` says so rather than inventing one.
       */
      install: z.record(z.string(), z.string().min(3).max(400)),
      /** Secrets the user has to supply. The agent never enters one (rule 21). */
      needs_secrets: uniqueArray(
        z.string().regex(ENV_NAME_PATTERN, 'must be an environment variable name'),
      ).optional(),
      /** What those secrets let it reach, in one sentence, in plain words. */
      permissions_summary: z.string().min(20).max(300),
      /** Domains this integration is useful in, for matching. */
      fits: uniqueArray(vocabulary(taxonomy, 'domains')),
    })
    .strict();
}

export function integrationSchema(taxonomy: Taxonomy) {
  const knownAgents = new Set(terms(taxonomy, 'agents'));
  return integrationObjectSchema(taxonomy).superRefine((integration, ctx) => {
    refineCommon(integration, ctx);
    if (Object.keys(integration.install).length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['install'],
        message: 'name at least one agent this can be installed into',
      });
    }
    // The map is partial on purpose: an agent whose syntax nobody has
    // confirmed gets no entry rather than a guessed one (ADR 0013). What it
    // may not contain is a key that is not an agent at all.
    for (const agent of Object.keys(integration.install)) {
      if (!knownAgents.has(agent)) {
        ctx.addIssue({
          code: 'custom',
          path: ['install', agent],
          message: `"${agent}" is not an agent in the taxonomy`,
        });
      }
    }
    // A secret in the install command is a secret in a public repository, and
    // it is also a lie about where the value comes from (§5b, rule 21).
    for (const [agent, command] of Object.entries(integration.install)) {
      for (const secret of integration.needs_secrets ?? []) {
        if (command.includes(`=${secret}=`) || / [A-Za-z0-9_-]{20,}/.test(command)) {
          ctx.addIssue({
            code: 'custom',
            path: ['install', agent],
            message: 'the install command must reference a variable, never a value',
          });
          break;
        }
      }
    }
  });
}

export type Integration = z.infer<ReturnType<typeof integrationObjectSchema>>;

/**
 * What must be unique: one recipe per upstream. A second integration for the
 * same project is a competing set of install instructions, which is the
 * problem rule 9 exists to prevent.
 */
export function integrationCombinationKey(integration: Integration): string {
  return integration.upstream.replace(/\/+$/, '').toLowerCase();
}
