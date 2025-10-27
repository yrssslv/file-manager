import path from 'node:path';

/**
 * Root directory that bounds all user-facing filesystem operations.
 * Defaults to the current working directory when not overridden via environment.
 * @type {string}
 */
export const ALLOWED_ROOT_DIR = process.env.ALLOWED_ROOT_DIR || process.cwd();

/**
 * Absolute version of the sandbox root, cached to avoid repeated resolution.
 * @type {string}
 */
export const RESOLVED_ALLOWED_ROOT_DIR = path.resolve(ALLOWED_ROOT_DIR);
