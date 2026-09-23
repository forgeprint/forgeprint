import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { z } from 'zod';
import { repoPaths } from './paths.js';
import { describeError, SLUG_PATTERN, terms, type Taxonomy } from './taxonomy.js';

/** Calendar date, so an entry says when its vendor's docs were last read. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * How long an entry stays believable without being re-read.
 *
 * The same interval `docs/review-standards.md` uses, for the same reason: the
 * things being tracked move, and a record nobody has checked is a claim, not a
 * fact (§5c).
 */
export const STALE_AFTER_DAYS = 90;

/** How an agent receives a credential an integration needs. */
const secretChannel = z.enum(['env', 'headers', 'oauth', 'ui', 'file']);

const agentSchema = z
  .object({
    id: z.string().regex(SLUG_PATTERN, 'must be lower kebab-case'),
    name: z.string().min(2).max(60),
    vendor: z.string().min(2).max(60),
    /** A terminal agent can run a setup recipe; an editor asks its user to. */
    kind: z.enum(['cli', 'ide']),
    mcp: z.object({ stdio: z.boolean(), http: z.boolean(), sse: z.boolean() }).strict(),
    /**
     * The files this agent reads for project instructions, most preferred
     * first. `forgeprint render` writes the first one.
     */
    context_files: z.array(z.string().min(1)).min(1),
    context_note: z.string().min(1).max(400).optional(),
    /** The skill format this agent loads, when it loads one at all. */
    skill_format: z.literal('SKILL.md').nullable(),
    skill_path: z.string().min(1).nullable(),
    /** The command that registers an MCP server, or null where there is none. */
    install_mcp: z.string().min(1).nullable(),
    secrets_via: z.array(secretChannel).min(1),
    headless: z.boolean(),
    headless_command: z.string().min(1).nullable(),
    limits: z.string().min(1).max(400),
    docs: z.url({ protocol: /^https$/ }),
    last_checked: z.string().regex(ISO_DATE_PATTERN, 'must be an ISO date, YYYY-MM-DD'),
  })
  .strict()
  .superRefine((agent, ctx) => {
    // An agent that cannot be driven from a script has no headless command,
    // and one that can must say what it is. Either half alone is a record
    // nobody can act on.
    if (agent.headless !== (agent.headless_command !== null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['headless_command'],
        message: 'headless and headless_command must agree',
      });
    }
    if ((agent.skill_format === null) !== (agent.skill_path === null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['skill_path'],
        message: 'skill_format and skill_path must agree',
      });
    }
  });

export const agentRegistrySchema = z
  .object({
    version: z.literal(1),
    agents: z.array(agentSchema).min(1),
  })
  .strict()
  .superRefine((registry, ctx) => {
    const seen = new Set<string>();
    for (const [at, agent] of registry.agents.entries()) {
      if (seen.has(agent.id)) {
        ctx.addIssue({ code: 'custom', path: ['agents', at, 'id'], message: 'duplicate id' });
      }
      seen.add(agent.id);
    }
  });

export type AgentRegistry = z.infer<typeof agentRegistrySchema>;
export type Agent = AgentRegistry['agents'][number];

export function parseAgentRegistry(source: string): AgentRegistry {
  return agentRegistrySchema.parse(parse(source));
}

export function loadAgentRegistry(root: string): AgentRegistry {
  const file = repoPaths.agents(root);
  try {
    return parseAgentRegistry(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid agent registry at ${file}: ${describeError(error)}`, { cause: error });
  }
}

export function hasAgentRegistry(root: string): boolean {
  return existsSync(repoPaths.agents(root));
}

export function findAgent(registry: AgentRegistry, id: string): Agent | undefined {
  return registry.agents.find((agent) => agent.id === id);
}

/**
 * Where the registry and the taxonomy disagree.
 *
 * The `agents` vocabulary is what a manifest is allowed to claim, and the
 * registry is what the catalog knows about each of them. A value in one and
 * not the other means a blueprint can claim an agent nobody has described, or
 * that a described agent cannot be claimed — both are silent failures, so they
 * are a validation error rather than a convention (ADR 0013).
 */
export function vocabularyMismatches(registry: AgentRegistry, taxonomy: Taxonomy): string[] {
  const registered = new Set(registry.agents.map((agent) => agent.id));
  const vocabulary = new Set(terms(taxonomy, 'agents'));
  const problems: string[] = [];
  for (const id of [...registered].sort()) {
    if (!vocabulary.has(id)) {
      problems.push(`"${id}" is in schema/agents.yaml but not in the agents vocabulary`);
    }
  }
  for (const id of [...vocabulary].sort()) {
    if (!registered.has(id)) {
      problems.push(`"${id}" is in the agents vocabulary but has no schema/agents.yaml entry`);
    }
  }
  return problems;
}

/** Registry entries nobody has re-read inside the interval, oldest first. */
export function staleAgents(registry: AgentRegistry, today: Date): Agent[] {
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() - STALE_AFTER_DAYS);
  const cutoffDay = cutoff.toISOString().slice(0, 10);
  return registry.agents
    .filter((agent) => agent.last_checked < cutoffDay)
    .sort((a, b) => a.last_checked.localeCompare(b.last_checked));
}
