import fs from 'node:fs/promises';
import path from 'node:path';
import {
  isFile,
  exists,
  safeUnlink,
  copyFile,
  isDirectory,
  resolveWithinRoot,
  ensureInsideRoot,
} from '../utils/fs-utils.mjs';
import { info, error } from '../utils/logger.mjs';
import { formatError } from '../utils/format.mjs';

/**
 * Real path of the allowed root directory.
 * Using realpath ensures symlinks are resolved, preventing bypass via symlink tricks.
 * @type {string}
 */
// Path validation helpers are centralized in utils/fs-utils.mjs

/**
 * Output the content of a file.
 * Enforces that the file is within the allowed root directory.
 * @param {string} filePath - Path to the file to read.
 * @returns {Promise<void>}
 */
async function cat(filePath) {
  if (!filePath) {
    error(formatError('File path is not specified.'));
    return;
  }
  try {
    const resolved = await resolveWithinRoot(filePath);
    ensureInsideRoot(resolved);
    if (!(await exists(resolved))) {
      error(formatError('File not found.'));
      return;
    }
    if (await isDirectory(resolved)) {
      error(formatError('The specified path is a directory, not a file.'));
      return;
    }
    if (!(await isFile(resolved))) {
      error(formatError('The specified path is not a file.'));
      return;
    }
    const content = await fs.readFile(resolved, 'utf-8');
    info(content);
  } catch (err) {
    if (err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error reading file', err));
  }
}

/**
 * Create an empty file if it does not already exist.
 * Enforces that the file is within the allowed root directory.
 * @param {string} filePath - Path to the file to create.
 * @returns {Promise<void>}
 */
async function touch(filePath) {
  if (!filePath) {
    error(formatError('File path is not specified.'));
    return;
  }
  try {
    const resolved = await resolveWithinRoot(filePath, {
      allowNonexistent: true,
    });
    ensureInsideRoot(resolved);
    if (await exists(resolved)) {
      error(formatError('File already exists.'));
      return;
    }
    await fs.writeFile(resolved, '');
    info('File created successfully.');
  } catch (err) {
    if (err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error creating file', err));
  }
}

/**
 * Remove a file.
 * Enforces that the file is within the allowed root directory.
 * @param {string} filePath - Path to the file to remove.
 * @returns {Promise<void>}
 */
async function rm(filePath) {
  if (!filePath) {
    error(formatError('File path is not specified.'));
    return;
  }
  try {
    const resolved = await resolveWithinRoot(filePath);
    ensureInsideRoot(resolved);
    if (!(await exists(resolved))) {
      error(formatError('File not found.'));
      return;
    }
    if (await isDirectory(resolved)) {
      error(formatError('The specified path is a directory, not a file.'));
      return;
    }
    if (!(await isFile(resolved))) {
      error(formatError('The specified path is not a file.'));
      return;
    }
    const res = await safeUnlink(resolved);
    if (res && res.success) {
      info('File deleted successfully.');
    } else {
      const msg = res && res.error ? res.error.message : 'Unknown error';
      error(formatError(`Error deleting file: ${msg}`));
    }
  } catch (err) {
    if (err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error deleting file', err));
  }
}

/**
 * Copy a file from source to destination.
 * Enforces that both source and destination are within the allowed root directory.
 * @param {string} srcPath - Path to the source file.
 * @param {string} destPath - Path to the destination file.
 * @returns {Promise<void>}
 */
async function cp(srcPath, destPath) {
  if (!srcPath || !destPath) {
    error(formatError('Source and destination paths must be specified.'));
    return;
  }
  try {
    const resolvedSrc = await resolveWithinRoot(srcPath);
    const resolvedDest = await resolveWithinRoot(destPath, {
      allowNonexistent: true,
    });
    ensureInsideRoot(resolvedSrc);
    ensureInsideRoot(resolvedDest);

    if (!(await exists(resolvedSrc))) {
      error(formatError('Source file not found.'));
      return;
    }
    if (await isDirectory(resolvedSrc)) {
      error(formatError('Source path is a directory, not a file.'));
      return;
    }
    if (!(await isFile(resolvedSrc))) {
      error(formatError('Source path is not a file.'));
      return;
    }
    if (await exists(resolvedDest)) {
      error(formatError('Destination file already exists.'));
      return;
    }
    await copyFile(resolvedSrc, resolvedDest);
    info('File copied successfully.');
  } catch (err) {
    if (err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error copying file', err));
  }
}

/**
 * Move (rename) a file from source to destination.
 * Enforces that both source and destination are within the allowed root directory.
 * @param {string} srcPath - Path to the source file.
 * @param {string} destPath - Path to the destination file.
 * @returns {Promise<void>}
 */
async function mv(srcPath, destPath) {
  if (!srcPath || !destPath) {
    error(formatError('Source and destination paths must be specified.'));
    return;
  }
  try {
    const resolvedSrc = await resolveWithinRoot(srcPath);
    const resolvedDest = await resolveWithinRoot(destPath, {
      allowNonexistent: true,
    });
    ensureInsideRoot(resolvedSrc);
    ensureInsideRoot(resolvedDest);

    if (!(await exists(resolvedSrc))) {
      error(formatError('Source file not found.'));
      return;
    }
    if (await isDirectory(resolvedSrc)) {
      error(formatError('Source path is a directory, not a file.'));
      return;
    }
    if (!(await isFile(resolvedSrc))) {
      error(formatError('Source path is not a file.'));
      return;
    }
    if (await exists(resolvedDest)) {
      error(formatError('Destination file already exists.'));
      return;
    }
    await fs.rename(resolvedSrc, resolvedDest);
    info('File moved successfully.');
  } catch (err) {
    if (err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error moving file', err));
  }
}

export { cat, touch, rm, cp, mv };
