/** Serialize a generated artifact: 2-space JSON with a trailing newline. */
export function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Normalize line endings so drift checks do not fire on checkout differences. */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n');
}
