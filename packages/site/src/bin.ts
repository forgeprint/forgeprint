#!/usr/bin/env node
import { findRepoRoot } from 'forgeprint';
import { buildSite } from './build.js';

const check = process.argv.includes('--check');
const root = findRepoRoot();

try {
  const result = buildSite(root, { check });
  if (!check) {
    console.log(`wrote  ${result.written.length} file(s) into ${root}/docs`);
  } else if (result.stale.length === 0 && result.drifted.length === 0) {
    console.log('ok  the published site matches the catalog');
  }

  if (result.stale.length > 0) {
    for (const path of result.stale) console.error(`error  docs/${path} is out of date`);
    console.error('\nRun `pnpm run build-site` and commit the result.');
    process.exitCode = 1;
  }

  // Reported in both modes, because no build can fix it: the counts are
  // written into a hand-written sentence, in each language.
  if (result.drifted.length > 0) {
    for (const path of result.drifted) {
      console.error(`error  docs/${path} claims counts the catalog does not`);
    }
    console.error(`\nThe catalog says: ${result.counts.join(' · ')}`);
    console.error('(blueprints, experts, crews, integrations, agents). Edit the status line.');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`error  ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
