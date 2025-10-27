import fs from 'node:fs/promises';
import path from 'node:path';
import { ALLOWED_ROOT_DIR, RESOLVED_ALLOWED_ROOT_DIR } from './constants.mjs';

/**
 * Ensures a provided path-like argument is a non-empty string.
 * @param {unknown} p - Value to validate as filesystem path.
 * @throws {Error} If the value is not a usable path string.
 */
function validatePath(p) {
  if (typeof p !== 'string' || p.trim() === '') {
    throw new Error('Invalid path: Path must be a non-empty string');
  }
}

/**
 * Checks whether the given path exists.
 * @param {string} filePath - Filesystem path to probe.
 * @returns {Promise<boolean>} True when the path is accessible.
 */
export async function exists(filePath) {
  try {
    validatePath(filePath);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Determines whether the path points to a directory.
 * @param {string} filePath - Filesystem path to inspect.
 * @returns {Promise<boolean>} True when the path is a directory.
 */
export async function isDirectory(filePath) {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.isDirectory();
}

/**
 * Determines whether the path points to a regular file.
 * @param {string} filePath - Filesystem path to inspect.
 * @returns {Promise<boolean>} True when the path is a file.
 */
export async function isFile(filePath) {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.isFile();
}

/**
 * Retrieves the size of a file in bytes.
 * @param {string} filePath - Filesystem path to inspect.
 * @returns {Promise<number>} Size of the file in bytes.
 */
export async function getSize(filePath) {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.size;
}

/**
 * Attempts to unlink a file without throwing.
 * @param {string} filePath - Path to the file to delete.
 * @returns {Promise<{success: boolean, error?: Error}>} Result of the deletion attempt.
 */
export async function safeUnlink(filePath) {
  try {
    validatePath(filePath);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Removes a directory with configurable recursion semantics.
 * @param {string} dirPath - Directory path to remove.
 * @param {{recursive?: boolean, force?: boolean}} [options] - Removal behavior flags.
 * @returns {Promise<{success: boolean, error?: Error}>} Result of the removal attempt.
 */
export async function safeRmdir(dirPath, options = {}) {
  try {
    validatePath(dirPath);
    const { recursive = false, force = false } = options;
    await fs.rm(dirPath, { recursive, force });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Copies a file between two paths.
 * @param {string} src - Source file path.
 * @param {string} dest - Destination file path.
 * @returns {Promise<void>} Resolves when the copy completes.
 */
export async function copyFile(src, dest) {
  validatePath(src);
  validatePath(dest);
  await fs.copyFile(src, dest);
}

/**
 * Recursively copies a directory into a destination tree.
 * @param {string} src - Source directory path.
 * @param {string} dest - Destination directory path.
 * @returns {Promise<{success: boolean, error?: Error}>} Result of the copy operation.
 */
export async function copyDir(src, dest) {
  try {
    validatePath(src);
    validatePath(dest);
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        const result = await copyDir(srcPath, destPath);
        if (!result.success) {
          return result;
        }
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Reads a directory and returns its entries, swallowing errors.
 * @param {string} dirPath - Directory path to read.
 * @returns {Promise<string[]>} Array of entry names or empty array when inaccessible.
 */
export async function readDir(dirPath) {
  try {
    validatePath(dirPath);
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

/**
 * Determines whether a target path resides inside a root sandbox.
 * @param {string} root - Base directory representing the sandbox boundary.
 * @param {string} target - Path to validate.
 * @returns {boolean} True when the target stays within the root.
 */
export function isInsideRoot(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  return (
    resolvedTarget === resolvedRoot ||
    (rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel))
  );
}

/**
 * Resolved real path of the allowed root directory.
 * Symlinks are collapsed to prevent escape via symlink tricks.
 */
export const ROOT_REAL = await (async () => {
  try {
    return await fs.realpath(ALLOWED_ROOT_DIR);
  } catch {
    return RESOLVED_ALLOWED_ROOT_DIR;
  }
})();

/**
 * Ensures that a target absolute path stays within the allowed root directory.
 * @param {string} targetAbs - Absolute path to validate.
 * @throws {Error & {code: string}} When the target escapes the root boundary.
 */
export function ensureInsideRoot(targetAbs) {
  if (isInsideRoot(ROOT_REAL, targetAbs)) return;
  const outsideErr = Object.assign(
    new Error('Path is outside the allowed root directory.'),
    { code: 'EOUTSIDE' }
  );
  throw outsideErr;
}

/**
 * Resolve a user-supplied path and ensure it remains inside the allowed root.
 * - If the path exists (allowNonexistent=false), resolve with fs.realpath to collapse symlinks.
 * - If the path may not exist yet (allowNonexistent=true), resolve the parent directory with realpath
 *   and safely join the final segment, then validate against the root.
 * @param {string} userPath - User-provided path (absolute or relative).
 * @param {{allowNonexistent?: boolean}} opts
 * @returns {Promise<string>} Resolved absolute path.
 */
export async function resolveWithinRoot(userPath, { allowNonexistent = false } = {}) {
  const candidateAbs = path.isAbsolute(userPath)
    ? userPath
    : path.resolve(process.cwd(), userPath);

  if (allowNonexistent) {
    const parentReal = await fs.realpath(path.dirname(candidateAbs));
    const finalAbs = path.join(parentReal, path.basename(candidateAbs));
    ensureInsideRoot(finalAbs);
    return finalAbs;
  }

  const real = await fs.realpath(candidateAbs);
  ensureInsideRoot(real);
  return real;
}
