/**
 * Turning a `setup.md` into something executable.
 *
 * The recipe is written for a reader, and it has to run. Both work because a
 * step is exactly one action: either a command, or a file written from a fenced
 * block. `lint-setup` enforces that shape, so this parser can be strict rather
 * than clever — anything ambiguous is reported, never guessed.
 */

export type RecipeAction =
  | { readonly kind: 'run'; readonly command: string }
  | { readonly kind: 'write'; readonly path: string; readonly contents: string };

export interface RecipeStep {
  readonly number: number;
  /** Line in `setup.md`, for error messages. */
  readonly line: number;
  /** The step's own words, for progress output. */
  readonly title: string;
  readonly action: RecipeAction;
  /** The command that proves the step worked. */
  readonly verify: string;
}

export interface RecipeProblem {
  readonly line: number;
  readonly message: string;
}

export interface Recipe {
  readonly steps: readonly RecipeStep[];
  /** Reasons the recipe could not be read as a script. */
  readonly problems: readonly RecipeProblem[];
}

const STEP_PATTERN = /^(\d+)\.\s+(\S.*)$/;
const VERIFY_PATTERN = /^\s*(?:[-*]\s*)?Verify:\s*`([^`]+)`/;
const FENCE_PATTERN = /^(\s*)(?:```|~~~)(.*)$/;
const GUARD_PATTERN = /^\s*<!--\s*(?:if|endif)\b/;
/** A heading ends the step above it; the prose after a recipe is not a step. */
const HEADING_PATTERN = /^\s{0,3}#{1,6}\s/;

/**
 * Parse an option-resolved `setup.md`.
 *
 * Guards must already be resolved; one left in place means the caller did not
 * choose an option, and a recipe with branches in it is not a script.
 */
export function parseRecipe(markdown: string): Recipe {
  const lines = markdown.split(/\r?\n/);
  const steps: RecipeStep[] = [];
  const problems: RecipeProblem[] = [];

  let current: { number: number; line: number; body: string[] } | null = null;
  let inFence = false;

  const finish = (): void => {
    if (current === null) return;
    const step = readStep(current);
    if ('message' in step) problems.push({ line: current.line, message: step.message });
    else steps.push(step);
    current = null;
  };

  lines.forEach((text, index) => {
    if (FENCE_PATTERN.test(text)) {
      inFence = !inFence;
      current?.body.push(text);
      return;
    }
    if (inFence) {
      current?.body.push(text);
      return;
    }
    if (GUARD_PATTERN.test(text)) {
      finish();
      problems.push({
        line: index + 1,
        message: 'an option guard is still in the recipe; resolve the options first',
      });
      return;
    }
    if (HEADING_PATTERN.test(text)) {
      finish();
      return;
    }
    const start = STEP_PATTERN.exec(text);
    if (start !== null) {
      finish();
      current = { number: Number(start[1]), line: index + 1, body: [start[2] ?? ''] };
      return;
    }
    current?.body.push(text);
  });
  finish();

  if (steps.length === 0 && problems.length === 0) {
    problems.push({ line: 1, message: 'the recipe has no numbered steps' });
  }
  return { steps, problems };
}

function readStep(raw: {
  number: number;
  line: number;
  body: string[];
}): RecipeStep | { message: string } {
  const verifyLine = raw.body.find((text) => VERIFY_PATTERN.test(text));
  const verify = verifyLine === undefined ? undefined : VERIFY_PATTERN.exec(verifyLine)?.[1];
  if (verify === undefined) {
    return { message: `step ${raw.number} has no "Verify: \`command\`" line` };
  }

  const body = raw.body.filter((text) => !VERIFY_PATTERN.test(text));
  const fence = readFence(body);

  if (fence === undefined) {
    const command = lastCodeSpan(body.join('\n'));
    if (command === undefined) {
      return { message: `step ${raw.number} states no command` };
    }
    return {
      number: raw.number,
      line: raw.line,
      title: summarize(body),
      action: { kind: 'run', command },
      verify,
    };
  }

  const path = lastCodeSpan(body.slice(0, fence.start).join('\n'));
  if (path === undefined) {
    return {
      message: `step ${raw.number} writes a file but does not name it; put the path in backticks before the block`,
    };
  }
  return {
    number: raw.number,
    line: raw.line,
    title: summarize(body.slice(0, fence.start)),
    action: { kind: 'write', path, contents: fence.contents },
    verify,
  };
}

interface Fence {
  readonly start: number;
  readonly contents: string;
}

/** The first fenced block in a step body, dedented to the fence's own indent. */
function readFence(body: readonly string[]): Fence | undefined {
  const start = body.findIndex((text) => FENCE_PATTERN.test(text));
  if (start === -1) return undefined;
  const indent = FENCE_PATTERN.exec(body[start] ?? '')?.[1]?.length ?? 0;
  const end = body.findIndex((text, at) => at > start && FENCE_PATTERN.test(text));
  const inner = body.slice(start + 1, end === -1 ? undefined : end);
  const contents = inner
    .map((text) => (text.slice(0, indent).trim().length === 0 ? text.slice(indent) : text))
    .join('\n')
    .replace(/\s+$/, '');
  return { start, contents: `${contents}\n` };
}

/** Code spans are how a recipe names a command or a path. The last one wins. */
function lastCodeSpan(text: string): string | undefined {
  const spans = [...text.matchAll(/`([^`]+)`/g)];
  return spans.length === 0 ? undefined : spans[spans.length - 1]?.[1];
}

function summarize(body: readonly string[]): string {
  const first = body.join(' ').replace(/\s+/g, ' ').trim();
  return first.length > 100 ? `${first.slice(0, 97)}...` : first;
}
