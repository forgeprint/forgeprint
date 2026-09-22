import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { describeError } from './taxonomy.js';

/**
 * Repository-level settings that the tooling cannot infer. Optional: every
 * command that needs a value also accepts it as a flag.
 */
export const configSchema = z
  .object({
    /** GitHub login that owns the repository root in CODEOWNERS (rule 12). */
    core_maintainer: z.string().min(1),
    /** `owner/repo`, used in generated links. */
    repository: z.string().regex(/^[^/\s]+\/[^/\s]+$/),
  })
  .partial()
  .strict();

export type Config = z.infer<typeof configSchema>;

export const CONFIG_FILE = 'forgeprint.json';

export function loadConfig(root: string): Config {
  const file = join(root, CONFIG_FILE);
  if (!existsSync(file)) return {};
  try {
    return configSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  } catch (error) {
    throw new Error(`Invalid ${CONFIG_FILE}: ${describeError(error)}`, { cause: error });
  }
}
