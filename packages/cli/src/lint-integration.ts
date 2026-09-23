/**
 * Safety rules for an integration recipe.
 *
 * An integration is the one unit that points at somebody else's code, and the
 * install command is the one thing a user will paste into a shell without
 * reading it twice. The manifest schema already refuses an unpinned upstream,
 * a non-https URL and a missing permissions summary; these are the rules that
 * need the command text rather than the field (ADR 0012, rule 20).
 */

export interface IntegrationProblem {
  readonly agent: string;
  readonly rule: string;
  readonly message: string;
}

/** Piping a download into a shell. Refused in a recipe, refused here. */
const PIPE_TO_SHELL =
  /\b(?:curl|wget|iwr|invoke-webrequest)\b[^|;&]*\|\s*(?:sudo\s+)?(?:ba|z|k|)sh\b/i;

/** Commands that reach outside the project the user is setting up. */
const ESCALATION = /(^|[\s;&|(])(?:sudo|doas|runas)\s/i;
const DESTRUCTIVE = /(^|[\s;&|(])rm\s+-[a-z]*[rf]/i;

/** A moving tag where a pin belongs, inside the command rather than the field. */
const FLOATING_TAG = /[:@](?:latest|main|master|edge|stable)(?:\s|$|['"])/i;

/**
 * Something shaped like a credential rather than a reference to one.
 *
 * Deliberately blunt: a long opaque run of characters next to a word like
 * token or key. It will occasionally be wrong, and being wrong here costs a
 * contributor one sentence in a pull request, while being silent costs a
 * reader their credentials (§5b).
 */
const LITERAL_SECRET =
  /(?:token|key|secret|password|pat|bearer)["'\s:=]+(?![$%{<])[A-Za-z0-9_\-.]{20,}/i;

export function lintIntegration(integration: {
  install: Readonly<Record<string, string>>;
  needs_secrets?: readonly string[] | undefined;
}): IntegrationProblem[] {
  const problems: IntegrationProblem[] = [];
  const secrets = integration.needs_secrets ?? [];

  for (const [agent, command] of Object.entries(integration.install)) {
    const report = (rule: string, message: string): void =>
      void problems.push({ agent, rule, message });

    if (PIPE_TO_SHELL.test(command)) {
      report('pipe-to-shell', 'downloads and executes in one step; install from a registry');
    }
    if (ESCALATION.test(command)) {
      report('escalation', 'asks for elevated privileges; an integration installs into a project');
    }
    if (DESTRUCTIVE.test(command)) {
      report('destructive', 'removes files recursively or forcibly');
    }
    if (FLOATING_TAG.test(command)) {
      report('unpinned', 'installs a moving tag; pin the version the manifest declares');
    }
    if (LITERAL_SECRET.test(command)) {
      report('literal-secret', 'contains something shaped like a credential; reference a variable');
    }

    // A declared secret the command never mentions is a user staring at an
    // environment variable with nowhere to put it.
    for (const secret of secrets) {
      if (!command.includes(secret)) {
        report('unused-secret', `needs_secrets lists ${secret}, which this command never uses`);
      }
    }
  }

  return problems;
}
