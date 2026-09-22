/**
 * Structural and safety rules for `setup.md`.
 *
 * A setup recipe is executed by an agent on somebody else's machine, so it is
 * held to a script's standards rather than a document's: numbered steps, one
 * action each, a verification after each one, pinned versions, and no command
 * that reaches outside the project.
 */

export interface SetupProblem {
  readonly line: number;
  readonly rule: string;
  readonly message: string;
}

/** Marker that closes a step: the command that proves the step worked. */
const VERIFY_PATTERN = /^\s*(?:[-*]\s*)?Verify:\s*`[^`]+`/;

/** `1. Do the thing` — the start of a step. */
const STEP_PATTERN = /^(\d+)\.\s+(\S.*)$/;

const IF_PATTERN = /^<!--\s*if\s+options\.([a-z0-9-]+)\s*==\s*([a-z0-9-]+)\s*-->$/;
const ENDIF_PATTERN = /^<!--\s*endif\s*-->$/;
const ANY_GUARD_PATTERN = /^<!--\s*(if|endif)\b/;

/** Opening or closing line of a fenced code block. */
const FENCE_PATTERN = /^\s*(?:```|~~~)/;

/** Hosts a setup step may reach: package registries and the local machine. */
const ALLOWED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  'api.nuget.org',
  'nuget.org',
  'www.nuget.org',
  'registry.npmjs.org',
  'www.npmjs.com',
  'npmjs.com',
  'pypi.org',
  'files.pythonhosted.org',
  'crates.io',
  'static.crates.io',
  'proxy.golang.org',
  'repo.maven.apache.org',
  'rubygems.org',
  'packagist.org',
  'mcr.microsoft.com',
  'ghcr.io',
  'docker.io',
  'registry-1.docker.io',
]);

interface ForbiddenRule {
  readonly rule: string;
  readonly pattern: RegExp;
  readonly message: string;
}

const FORBIDDEN: readonly ForbiddenRule[] = [
  {
    rule: 'no-pipe-to-shell',
    pattern: /(?:curl|wget|iwr|invoke-webrequest)[^`\n]*\|[^`\n]*\b(?:ba|z|fi)?sh\b/i,
    message: 'piping a download into a shell is not allowed',
  },
  {
    rule: 'no-sudo',
    pattern: /(?:^|[\s`(])sudo\s/i,
    message: 'sudo is not allowed: a setup step may not need elevated privileges',
  },
  {
    rule: 'no-recursive-delete',
    pattern: /(?:\brm\s+-[a-zA-Z]*r[a-zA-Z]*f|\bRemove-Item\b[^`\n]*-Recurse[^`\n]*-Force)/,
    message: 'recursive force deletes are not allowed',
  },
  {
    rule: 'no-open-permissions',
    pattern: /\bchmod\s+(?:-R\s+)?777\b/,
    message: 'chmod 777 is not allowed',
  },
  {
    rule: 'no-system-paths',
    pattern: /(?:^|[\s`"'(])(?:\/usr\/|\/etc\/|\/opt\/|\/var\/|C:\\Windows|C:\\Program Files)/i,
    message: 'a setup step may not write outside the project directory',
  },
];

interface PinRule {
  readonly rule: string;
  readonly detect: RegExp;
  readonly pinned: RegExp;
  readonly message: string;
}

const PINNING: readonly PinRule[] = [
  {
    rule: 'pin-nuget',
    detect: /\bdotnet\s+add\s+package\s+\S+/i,
    pinned: /--version\s+\S+/i,
    message: 'dotnet add package needs an explicit --version',
  },
  {
    rule: 'pin-npm',
    detect: /\bnpm\s+(?:install|i|add)\s+(?!-)[@\w][^\s`]*/i,
    pinned: /\bnpm\s+(?:install|i|add)\s+(?:-\S+\s+)*@?[^\s`@]+(?:\/[^\s`@]+)?@\S+/i,
    message: 'npm install needs an explicit version, for example package@1.2.3',
  },
  {
    rule: 'pin-pip',
    detect: /\bpip\s+install\s+(?!-)[^\s`]+/i,
    pinned: /\bpip\s+install\s+(?:-\S+\s+)*[^\s`]+==\S+/i,
    message: 'pip install needs an explicit ==version',
  },
  {
    rule: 'pin-image',
    detect: /^\s*FROM\s+\S+/,
    pinned: /^\s*FROM\s+\S+:(?!latest\b)\S+/,
    message: 'a Dockerfile FROM needs an explicit tag that is not "latest"',
  },
  {
    rule: 'pin-image',
    detect: /\bdocker\s+(?:run|pull)\b/i,
    // An image reference starts with a letter, which is what separates it from
    // a port mapping such as `-p 8080:8080`.
    pinned: /\bdocker\s+(?:run|pull)\b[^`\n]*\s[a-z][\w./-]*:(?!latest\b)[\w.-]+/i,
    message: 'container images need an explicit tag that is not "latest"',
  },
];

/** A step, and everything written under it until the next one. */
interface Step {
  readonly number: number;
  readonly line: number;
  readonly body: readonly string[];
}

export interface LintOptions {
  /** Option fields and values declared in the manifest, for guard checking. */
  readonly options?: Readonly<Record<string, readonly string[]>>;
}

export function lintSetup(source: string, { options = {} }: LintOptions = {}): SetupProblem[] {
  const problems: SetupProblem[] = [];
  const lines = source.split(/\r?\n/);
  const add = (line: number, rule: string, message: string): void => {
    problems.push({ line, rule, message });
  };

  const steps: Step[] = [];
  let current: { number: number; line: number; body: string[] } | null = null;

  // Guard state: at most one level, because a nested branch is a variant in
  // disguise (ADR 0001).
  // Held on an object so that narrowing does not leak out of the loop below.
  const guardState: { open: { field: string; value: string; line: number } | null } = {
    open: null,
  };
  let expected = 1;
  let guardEntry = 1;
  let afterGuard: number | null = null;
  /** The option field of the guard group being read, if any. */
  let groupField: string | null = null;

  const closeStep = (): void => {
    if (current !== null) steps.push(current);
    current = null;
  };

  // A fenced block is content, not structure: a line inside one that looks like
  // a step or a guard is neither.
  let inFence = false;

  lines.forEach((text, index) => {
    const line = index + 1;
    const isFence = FENCE_PATTERN.test(text);
    if (isFence) inFence = !inFence;
    if (inFence || isFence) {
      if (current !== null) current.body.push(text);
      return;
    }

    const guard = IF_PATTERN.exec(text.trim());
    const isEndif = ENDIF_PATTERN.test(text.trim());

    if (guard !== null) {
      closeStep();
      if (guardState.open !== null) {
        add(line, 'no-nested-guards', `guard opened at line ${guardState.open.line} is still open`);
      }
      const [, field = '', value = ''] = guard;
      const declared = options[field];
      if (declared === undefined) {
        add(line, 'unknown-option', `options.${field} is not declared in manifest.yaml`);
      } else if (!declared.includes(value)) {
        add(
          line,
          'unknown-option-value',
          `"${value}" is not a declared value of options.${field} (${declared.join(', ')})`,
        );
      }
      if (afterGuard !== null && field === groupField) {
        // A sibling branch of the same group: it repeats, not continues.
        expected = guardEntry;
      } else {
        if (afterGuard !== null) {
          expected = afterGuard;
          afterGuard = null;
        }
        guardEntry = expected;
        groupField = field;
      }
      guardState.open = { field, value, line };
      return;
    }

    if (isEndif) {
      closeStep();
      if (guardState.open === null) {
        add(line, 'unmatched-endif', 'endif without a matching if');
      } else {
        afterGuard = Math.max(afterGuard ?? 0, expected);
        expected = guardEntry;
        guardState.open = null;
      }
      return;
    }

    if (ANY_GUARD_PATTERN.test(text.trim())) {
      add(
        line,
        'guard-syntax',
        'a guard must read exactly `<!-- if options.<field> == <value> -->` or `<!-- endif -->`',
      );
      return;
    }

    const step = STEP_PATTERN.exec(text);
    if (step !== null) {
      closeStep();
      const number = Number(step[1]);
      if (guardState.open === null && afterGuard !== null) {
        expected = afterGuard;
        afterGuard = null;
      }
      if (number !== expected) {
        add(
          line,
          'step-numbering',
          `step is numbered ${number}, expected ${expected}${
            guardState.open === null
              ? ''
              : ' (a guarded branch continues the numbering it opened at)'
          }`,
        );
        expected = number;
      }
      expected += 1;
      current = { number, line, body: [step[2] ?? ''] };
      return;
    }

    if (current !== null && text.trim().length > 0) {
      current.body.push(text);
    } else if (current !== null && text.trim().length === 0) {
      current.body.push('');
    }
  });
  closeStep();

  if (guardState.open !== null) {
    add(guardState.open.line, 'unclosed-guard', 'guard is never closed by `<!-- endif -->`');
  }

  if (steps.length === 0) {
    add(1, 'no-steps', 'setup.md has no numbered steps');
  }

  for (const step of steps) {
    // The verification line does not count: the action itself must name a
    // command or a file, or the step is prose telling someone to figure it out.
    const action = step.body.filter((text) => !VERIFY_PATTERN.test(text)).join('\n');
    if (!/`[^`]+`/.test(action)) {
      add(
        step.line,
        'step-needs-command',
        `step ${step.number} states no command or file path; a step is one concrete action`,
      );
    }
    if (!step.body.some((text) => VERIFY_PATTERN.test(text))) {
      add(
        step.line,
        'step-needs-verification',
        `step ${step.number} has no "Verify: \`command\`" line`,
      );
    }
  }

  // Only commands are linted. Prose that mentions `sudo` to warn against it is
  // not a violation; a code span that runs it is.
  let inCodeFence = false;
  lines.forEach((text, index) => {
    const line = index + 1;
    if (FENCE_PATTERN.test(text)) {
      inCodeFence = !inCodeFence;
      return;
    }
    const code = inCodeFence ? text : inlineCode(text);
    if (code.trim().length === 0) return;

    for (const { rule, pattern, message } of FORBIDDEN) {
      if (pattern.test(code)) add(line, rule, message);
    }
    for (const { rule, detect, pinned, message } of PINNING) {
      if (detect.test(code) && !pinned.test(code)) add(line, rule, message);
    }
    for (const host of hostsIn(code)) {
      if (!ALLOWED_HOSTS.has(host)) {
        add(line, 'registry-only', `${host} is not a package registry or the local machine`);
      }
    }
  });

  return problems.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

/** The contents of every `code span` on a line, joined by newlines. */
function inlineCode(text: string): string {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? '').join('\n');
}

/** Hosts of every http(s) URL on a line. */
function hostsIn(text: string): string[] {
  const hosts: string[] = [];
  const urls = text.matchAll(/https?:\/\/([^\s/`)"'>]+)/gi);
  for (const match of urls) {
    const authority = match[1];
    if (authority === undefined) continue;
    const host = authority.split('@').pop() ?? authority;
    hosts.push(host.replace(/:\d+$/, '').toLowerCase());
  }
  return hosts;
}
