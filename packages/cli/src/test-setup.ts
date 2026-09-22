/**
 * Running a recipe for real.
 *
 * A fresh directory, the declared tools checked first, every step followed by
 * its verification, and a stop at the first failure with enough output to fix
 * it. The environment is a precondition, not something this provides: nothing
 * here installs anything (ADR 0005).
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { RecipeStep } from './recipe.js';

/** A step that runs longer than this has hung; the run fails rather than waits. */
export const STEP_TIMEOUT_MS = 15 * 60 * 1000;

/** Commands are POSIX shell, so they read the same on every platform. */
export const SHELL = 'bash';

export interface StepOutcome {
  readonly step: RecipeStep;
  /** Which half of the step this is: the action, or its verification. */
  readonly phase: 'action' | 'verify';
  readonly ok: boolean;
  readonly exitCode: number | null;
  readonly output: string;
  readonly ms: number;
}

export interface RunOptions {
  readonly dir: string;
  /** Called before each step, for progress output: step, position, total. */
  readonly onStep?: (step: RecipeStep, position: number, total: number) => void;
  readonly timeoutMs?: number;
  readonly env?: NodeJS.ProcessEnv;
}

export interface RunResult {
  readonly ok: boolean;
  readonly dir: string;
  readonly outcomes: readonly StepOutcome[];
  /** The first failure, which is where the run stopped. */
  readonly failure: StepOutcome | undefined;
}

export async function runRecipe(
  steps: readonly RecipeStep[],
  options: RunOptions,
): Promise<RunResult> {
  const outcomes: StepOutcome[] = [];
  await mkdir(options.dir, { recursive: true });

  for (const [index, step] of steps.entries()) {
    options.onStep?.(step, index + 1, steps.length);

    const action =
      step.action.kind === 'run'
        ? await execute(step.action.command, step, 'action', options)
        : await write(step.action.path, step.action.contents, step, options);
    outcomes.push(action);
    if (!action.ok) return { ok: false, dir: options.dir, outcomes, failure: action };

    const verify = await execute(step.verify, step, 'verify', options);
    outcomes.push(verify);
    if (!verify.ok) return { ok: false, dir: options.dir, outcomes, failure: verify };
  }

  return { ok: true, dir: options.dir, outcomes, failure: undefined };
}

async function write(
  path: string,
  contents: string,
  step: RecipeStep,
  options: RunOptions,
): Promise<StepOutcome> {
  const started = Date.now();
  const target = resolve(options.dir, path);
  // A recipe may not write outside its own directory. lint-setup rejects the
  // paths that would; this is the second lock on the same door.
  if (!target.startsWith(resolve(options.dir))) {
    return {
      step,
      phase: 'action',
      ok: false,
      exitCode: null,
      output: `refusing to write outside the project directory: ${path}`,
      ms: Date.now() - started,
    };
  }
  try {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents, 'utf8');
    return { step, phase: 'action', ok: true, exitCode: 0, output: '', ms: Date.now() - started };
  } catch (error) {
    return {
      step,
      phase: 'action',
      ok: false,
      exitCode: null,
      output: error instanceof Error ? error.message : String(error),
      ms: Date.now() - started,
    };
  }
}

function execute(
  command: string,
  step: RecipeStep,
  phase: 'action' | 'verify',
  options: RunOptions,
): Promise<StepOutcome> {
  const started = Date.now();
  return new Promise((resolvePromise) => {
    const child = spawn(SHELL, ['-c', command], {
      cwd: options.dir,
      env: { ...process.env, ...options.env },
      windowsHide: true,
    });

    let output = '';
    const collect = (chunk: Buffer): void => {
      output += chunk.toString('utf8');
      if (output.length > 200_000) output = output.slice(-200_000);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    const timer = setTimeout(() => {
      output += `\n[timed out after ${(options.timeoutMs ?? STEP_TIMEOUT_MS) / 1000}s]`;
      child.kill('SIGKILL');
    }, options.timeoutMs ?? STEP_TIMEOUT_MS);

    const done = (exitCode: number | null, failure?: Error): void => {
      clearTimeout(timer);
      resolvePromise({
        step,
        phase,
        ok: exitCode === 0 && failure === undefined,
        exitCode,
        output: failure === undefined ? output : `${output}\n${failure.message}`,
        ms: Date.now() - started,
      });
    };

    child.on('error', (error) => {
      done(null, error);
    });
    child.on('close', (code) => {
      done(code);
    });
  });
}

export interface ToolProblem {
  readonly tool: string;
  readonly message: string;
}

/** How to ask a tool for its version, when `--version` is not what it takes. */
const VERSION_FLAG: Readonly<Record<string, string>> = {
  go: 'version',
  java: '-version',
};

const REQUIREMENT_PATTERN =
  /^([a-z0-9][a-z0-9.+-]*)\s*(>=|<=|==|>|<|~|\^)?\s*([0-9][0-9a-z.-]*)?$/i;

/**
 * Check the tools a blueprint declares. Nothing is installed: a missing tool is
 * a refusal naming the tool and the version, because a run that quietly used a
 * different toolchain would be worse than no run at all.
 */
export async function checkTools(requires: readonly string[]): Promise<ToolProblem[]> {
  const problems: ToolProblem[] = [];

  const shell = await probe(SHELL, '--version');
  if (shell === undefined) {
    problems.push({
      tool: SHELL,
      message: `${SHELL} is required: recipe commands are POSIX shell. On Windows, Git Bash provides it.`,
    });
  }

  for (const requirement of requires) {
    const parsed = REQUIREMENT_PATTERN.exec(requirement.trim());
    if (parsed === null) {
      problems.push({ tool: requirement, message: `cannot read the requirement "${requirement}"` });
      continue;
    }
    const [, tool = '', operator, wanted] = parsed;
    const flag = VERSION_FLAG[tool] ?? '--version';
    const reported = await probe(tool, flag);
    if (reported === undefined) {
      problems.push({ tool, message: `${tool} is not installed, or not on PATH` });
      continue;
    }
    if (wanted === undefined || operator === undefined) continue;

    const found = firstVersion(reported);
    if (found === undefined) {
      problems.push({ tool, message: `could not read a version from "${reported.trim()}"` });
      continue;
    }
    if (!satisfies(found, operator, wanted)) {
      problems.push({ tool, message: `${tool} ${found} does not satisfy ${operator}${wanted}` });
    }
  }

  return problems;
}

async function probe(tool: string, flag: string): Promise<string | undefined> {
  return await new Promise((resolvePromise) => {
    const child = spawn(tool, [flag], { windowsHide: true, shell: process.platform === 'win32' });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString('utf8')));
    child.on('error', () => {
      resolvePromise(undefined);
    });
    child.on('close', (code) => {
      // Exit code, not output: with a shell, a missing command still prints
      // something, and treating that as "installed" is how a run ends up using
      // a toolchain nobody declared.
      resolvePromise(code === 0 ? output : undefined);
    });
  });
}

function firstVersion(text: string): string | undefined {
  return /(\d+(?:\.\d+)*)/.exec(text)?.[1];
}

/** Numeric comparison, part by part. Enough for the constraints a tool takes. */
export function satisfies(found: string, operator: string, wanted: string): boolean {
  const order = compareVersions(found, wanted);
  switch (operator) {
    case '>=':
      return order >= 0;
    case '>':
      return order > 0;
    case '<=':
      return order <= 0;
    case '<':
      return order < 0;
    case '==':
      return order === 0;
    // `~` and `^` allow anything at or above the stated version that does not
    // change the part they pin.
    case '~':
    case '^': {
      if (order < 0) return false;
      const index = operator === '^' ? 0 : 1;
      return part(found, index) === part(wanted, index);
    }
    default:
      return false;
  }
}

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let at = 0; at < Math.max(left.length, right.length); at += 1) {
    const difference = (left[at] ?? 0) - (right[at] ?? 0);
    if (difference !== 0) return difference < 0 ? -1 : 1;
  }
  return 0;
}

function part(version: string, index: number): number {
  return Number(version.split('.')[index] ?? 0);
}

/** A directory name for a run, stable enough to recognise in a temp folder. */
export function runDirectoryName(slug: string, options: Readonly<Record<string, string>>): string {
  const suffix = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([field, value]) => `${field}-${value}`)
    .join('_');
  return suffix.length === 0 ? `forgeprint-${slug}` : `forgeprint-${slug}-${suffix}`;
}

export { join as joinPath };
