import fs from 'node:fs/promises';
import path from 'node:path';
import { info, error as logError } from '../utils/logger.mjs';
import { formatError } from '../utils/format.mjs';
import { resolveWithinRoot, ensureInsideRoot } from '../utils/fs-utils.mjs';
import { ALLOWED_ROOT_DIR } from '../utils/constants.mjs';

const ROOT_DIR = ALLOWED_ROOT_DIR;

/**
 * Prints the current working directory as an absolute path.
 */
function pwd() {
  const currentDir = process.cwd();
  const absolutePath = path.resolve(currentDir);
  info(`Current directory: ${absolutePath}`);
}

/**
 * Changes the current working directory with root sandbox enforcement.
 * @param {string} p - Target directory path provided by the user.
 */
async function cd(p) {
  if (!p) {
    logError(formatError('No path provided. Usage: cd <directory>'));
    return;
  }
  const targetPath = path.resolve(process.cwd(), p);

  try {
    const realTarget = await resolveWithinRoot(targetPath);
    ensureInsideRoot(realTarget);
    if (!realTarget) {
      logError(
        formatError('Access denied: Cannot navigate outside the allowed root directory.')
      );
      return;
    }
    process.chdir(realTarget);
    pwd();
  } catch (err) {
    if (err.code === 'ENOENT') {
      logError(formatError(`Directory does not exist: ${p}`));
    } else if (err.code === 'EACCES') {
      logError(formatError(`Permission denied: ${p}`));
    } else if (err.code === 'ENOTDIR') {
      logError(formatError(`Not a directory: ${p}`));
    } else if (err.code === 'EOUTSIDE') {
      logError(
        formatError('Access denied: Cannot navigate outside the allowed root directory.')
      );
    } else {
      logError(formatError(`Error changing directory: ${err.message}`));
    }
  }
}

export { pwd, cd };
