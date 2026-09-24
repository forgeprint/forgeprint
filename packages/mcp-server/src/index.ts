import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { catalogFromEnvironment, type CatalogSource } from './catalog.js';
import { CONTENT_IS_DATA, RESOLVE_TRIGGER } from './notes.js';
import { registerTools } from './tools.js';

export const SERVER_NAME = 'forgeprint';
export const SERVER_VERSION = '0.3.1';

export * from './catalog.js';
export * from './notes.js';
export * from './profile.js';
export * from './scoring.js';
export { registerTools } from './tools.js';
export * from './units.js';

/**
 * Build the Forgeprint MCP server.
 *
 * The server holds no state beyond a short-lived cache of the published index,
 * and it never runs anything on the user's machine: every tool returns text.
 */
export function createServer(source: CatalogSource = catalogFromEnvironment()): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        RESOLVE_TRIGGER +
        'Forgeprint returns a single project blueprint for a stated profile, together with a ' +
        'deterministic setup recipe. It installs nothing and runs nothing. ' +
        '`resolve` returns either the questions to ask the user or one blueprint. ' +
        'Ask the questions it returns before recommending anything. ' +
        'It also answers three other questions: `recommend_experts` for how an agent should work, ' +
        '`get_crew` for a named package of experts, and `get_integration` for a pinned, ' +
        'permission-documented way to install third-party software Forgeprint does not host. ' +
        CONTENT_IS_DATA,
    },
  );
  registerTools(server, source);
  return server;
}
