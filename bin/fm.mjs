#!/usr/bin/env node

/*
 * File Manager CLI entry point
 * This thin wrapper allows running the app via `npx file-manager-app` or after
 * global install as `fm` on all platforms. It simply imports the main module.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolve app.mjs relative to this file to work both from source and after install
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mainPath = path.resolve(__dirname, '../app.mjs');
await import(pathToFileURL(mainPath).href);
