#!/usr/bin/env node
import { createProgram } from './cli.js';

try {
  createProgram().parse(process.argv);
} catch (error) {
  console.error(`error  ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
