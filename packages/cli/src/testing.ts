import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { loadBlueprints, renderIndex } from './build-index.js';
import { buildManifestJsonSchema } from './build-schema.js';
import type { Blueprint } from './catalog.js';
import { repoPaths } from './paths.js';
import { loadTaxonomy } from './taxonomy.js';

/** A taxonomy small enough to read in a test failure message. */
export const TEST_TAXONOMY = `
version: 1
languages:
  csharp: C#
  typescript: TypeScript
  go: Go
  python: Python
stack:
  aspnetcore: ASP.NET Core
  postgres: PostgreSQL
  node: Node.js
platforms:
  linux: Linux
  docker: Docker
distribution:
  saas: SaaS
  free: Free
  open-source: Open source
project_type:
  api: API service
  cli: Command-line tool
audience:
  intermediate: Intermediate
requirements:
  auth: Authentication
  ci: Continuous integration
  multi-tenant: Multi-tenancy
domains:
  software: Software engineering
  security: Security
roles:
  software-architect: Software architect
  security-reviewer: Security reviewer
seniority:
  senior: Senior
  principal: Principal
deliverables:
  adr: Architecture decision record
  threat-model: Threat model
integration_kind:
  mcp: MCP server
agents:
  claude-code: Claude Code
tier:
  community: Community
  official: Official
aliases:
  languages:
    golang: go
    ts: typescript
  requirements:
    multitenancy: multi-tenant
`;

export interface ManifestFields {
  [key: string]: unknown;
}

/** A manifest that passes validation, so a test only states what it changes. */
export function validManifest(overrides: ManifestFields = {}): ManifestFields {
  return {
    schema: 1,
    slug: 'sample-api',
    name: 'Sample API',
    version: '1.0.0',
    tier: 'community',
    maintainers: ['octocat'],
    summary: 'A sample API blueprint used by the Forgeprint test suite.',
    stack: ['aspnetcore', 'postgres'],
    languages: ['csharp'],
    platforms: ['linux'],
    distribution: ['saas'],
    project_type: 'api',
    audience: ['intermediate'],
    requirements: ['auth', 'ci'],
    agents: ['claude-code'],
    ...overrides,
  };
}

export interface BlueprintFixture {
  readonly slug: string;
  readonly manifest?: ManifestFields | null;
  /** Extra or replacement files, keyed by path relative to the folder. */
  readonly files?: Record<string, string>;
  /** Required files to leave out, to exercise the missing-file check. */
  readonly omit?: readonly string[];
}

/**
 * Create a throwaway repository on disk. Generated artifacts are written too,
 * so that `validateCatalog` starts from a clean state.
 */
export function makeRepo(blueprints: readonly BlueprintFixture[] = []): string {
  const root = mkdtempSync(join(tmpdir(), 'forgeprint-test-'));
  mkdirSync(join(root, 'schema'), { recursive: true });
  writeFileSync(repoPaths.taxonomy(root), TEST_TAXONOMY.trimStart(), 'utf8');

  for (const fixture of blueprints) {
    const dir = repoPaths.blueprintDir(root, fixture.slug);
    mkdirSync(dir, { recursive: true });
    const manifest =
      fixture.manifest === undefined ? validManifest({ slug: fixture.slug }) : fixture.manifest;
    const omit = new Set(fixture.omit ?? []);
    const version = typeof manifest?.['version'] === 'string' ? manifest['version'] : '1.0.0';
    const files: Record<string, string> = {
      ...(manifest === null ? {} : { 'manifest.yaml': stringify(manifest) }),
      'AGENTS.md': `# ${fixture.slug}\n`,
      'overview.md': `# ${fixture.slug} overview\n`,
      'setup.md': '1. Do nothing.\n',
      'CHANGELOG.md': `## ${version}\n`,
      ...fixture.files,
    };
    for (const [name, contents] of Object.entries(files)) {
      if (omit.has(name)) continue;
      const file = join(dir, ...name.split('/'));
      mkdirSync(join(file, '..'), { recursive: true });
      writeFileSync(file, contents, 'utf8');
    }
  }

  regenerate(root);
  return root;
}

/** Write the generated artifacts so drift checks pass. */
export function regenerate(root: string): void {
  const taxonomy = loadTaxonomy(root);
  writeFileSync(repoPaths.manifestSchema(root), buildManifestJsonSchema(taxonomy), 'utf8');
  mkdirSync(join(root, 'docs'), { recursive: true });
  let blueprints: Blueprint[];
  try {
    blueprints = loadBlueprints(root, taxonomy);
  } catch {
    blueprints = [];
  }
  writeFileSync(repoPaths.index(root), renderIndex(blueprints, taxonomy), 'utf8');
}
