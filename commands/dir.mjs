import fs from 'node:fs/promises';
import path from 'node:path';
import {
  readDir,
  isDirectory,
  safeRmdir,
  resolveWithinRoot,
  ensureInsideRoot,
} from '../utils/fs-utils.mjs';
import { formatList, formatError } from '../utils/format.mjs';
import { info, error } from '../utils/logger.mjs';
import { ALLOWED_ROOT_DIR } from '../utils/constants.mjs';

const ROOT_DIR = ALLOWED_ROOT_DIR;

/**
 * Checks whether a provided argument is empty or consists of whitespace.
 * @param {string} arg - Argument to validate.
 * @returns {boolean} True when the argument is missing or blank.
 */
function isArgEmpty(arg) {
  return !arg || typeof arg !== 'string' || arg.trim() === '';
}

/**
 * Validates the provided path against the allowed root directory.
 * @param {string} p - Path to verify.
 * @throws {Error & {code: string}} Throws when the path escapes the allowed root.
 */
/**
 * Ensures a given absolute path remains within the allowed root sandbox.
 * Accepts both existing and not-yet-existing targets (for mkdir):
 * - Existing: validate realpath(target)
 * - Non-existing: validate join(realpath(dirname(target)), basename(target))
 * @param {string} targetAbs - Absolute target path to validate.
 * @param {object} [opts]
 * @param {boolean} [opts.mayNotExist=false] - Set true when the final node may not exist yet.
 * @returns {Promise<string>} Returns absolute path that was validated (may be normalized).
 * @throws {Error & {code: string}}
 */
async function resolveDirPath(candidate, { mayNotExist = false } = {}) {
  const resolved = await resolveWithinRoot(candidate, {
    allowNonexistent: mayNotExist,
  });
  ensureInsideRoot(resolved);
  return resolved;
}

/**
 * Outputs the contents of the specified directory.
 * @param {string} [p=ROOT_DIR] - Directory to list.
 * @returns {Promise<void>} Resolves when listing is complete.
 */
export async function ls(p = ROOT_DIR) {
  try {
    if (isArgEmpty(p)) p = ROOT_DIR;
    const candidate = path.resolve(p);
    const realDir = await resolveDirPath(candidate);

    const stats = await fs.stat(realDir);
    if (!stats.isDirectory()) {
      error(formatError('Path is not a directory.'));
      return;
    }

    const items = await readDir(realDir);
    if (!items.length) {
      info('Directory is empty.');
      return;
    }

    const flags = await Promise.all(
      items.map(async (item) => {
        const fullPath = path.join(realDir, item);
        return (await isDirectory(fullPath)) ? 'dir' : 'file';
      })
    );
    const result = items.map((item, idx) => (flags[idx] === 'dir' ? `${item}/` : item));
    info(formatList(result));
  } catch (err) {
    if (err.code === 'ENOENT') {
      error(formatError('Directory does not exist.'));
    } else if (err.code === 'EACCES') {
      error(formatError('Permission denied.'));
    } else if (err.code === 'EOUTSIDE') {
      error(formatError('Operation outside allowed directory.'));
    } else {
      error(formatError(`Error reading directory: ${err.message}`));
    }
  }
}

/**
 * Creates a directory at the provided path.
 * @param {string} dirPath - Target directory path.
 * @returns {Promise<void>} Resolves when the directory is created.
 */
export async function mkdir(dirPath, context) {
  try {
    if (isArgEmpty(dirPath)) {
      const usage = context?.config?.mkdir?.description || 'Usage: mkdir <dir>';
      error(formatError(usage));
      return;
    }
    const candidate = path.resolve(dirPath);
    const safeTarget = await resolveDirPath(candidate, { mayNotExist: true });
    await fs.mkdir(safeTarget, { recursive: true });
    info(`Directory created: ${dirPath}`);
  } catch (err) {
    if (err.code === 'EEXIST') {
      error(formatError('Directory already exists.'));
    } else if (err.code === 'EACCES') {
      error(formatError('Permission denied.'));
    } else if (err.code === 'EOUTSIDE') {
      error(formatError('Operation outside allowed directory.'));
    } else {
      error(formatError(`Error creating directory: ${err.message}`));
    }
  }
}

/**
 * Removes the directory at the provided path, optionally recursively.
 * Supports the flags -r or --recursive to confirm recursive deletion.
 * @param {...string|object} inputs - Path, optional flags, and trailing context object.
 * @returns {Promise<void>} Resolves when the directory is removed or an error is logged.
 */
export async function rmdir(...inputs) {
  let args = inputs;
  const maybeContext = args.at(-1);
  if (maybeContext && typeof maybeContext === 'object' && !Array.isArray(maybeContext)) {
    args = args.slice(0, -1);
  }
  const context =
    typeof maybeContext === 'object' && !Array.isArray(maybeContext)
      ? maybeContext
      : undefined;
  let dirPath;
  let recursive = false;
  let autoYes = false;

  for (const arg of args) {
    if (typeof arg !== 'string') continue;
    if (arg === '-r' || arg === '--recursive') {
      recursive = true;
      continue;
    }
    if (arg === '-y' || arg === '--yes') {
      autoYes = true;
      continue;
    }
    if (!dirPath) {
      dirPath = arg;
    } else {
      error(formatError('Too many arguments provided to rmdir.'));
      return;
    }
  }

  try {
    if (isArgEmpty(dirPath)) {
      const usage =
        context?.config?.rmdir?.description ||
        'Usage: rmdir <dir> [-r|--recursive] [-y|--yes]';
      error(formatError(usage));
      return;
    }
    const targetPath = path.resolve(dirPath);
    const realTarget = await resolveDirPath(targetPath);

    if (!recursive) {
      await fs.rm(realTarget, { recursive: false, force: false });
      info(`Directory removed: ${dirPath}`);
      return;
    }

    // If recursive deletion requested, confirm unless explicitly auto-approved
    if (!autoYes && context?.rl) {
      const answer = await new Promise((resolve) => {
        context.rl.question(
          `This will recursively delete "${dirPath}" and all its contents. Proceed? [y/N] `,
          (ans) => resolve(String(ans || '').trim())
        );
      });
      const ok = /^(y|yes)$/i.test(answer);
      if (!ok) {
        info('Recursive deletion cancelled.');
        return;
      }
    }

    const res = await safeRmdir(realTarget, { recursive: true, force: true });
    if (!res || res.success !== true) {
      const msg = res && res.error ? res.error.message : 'Unknown error';
      error(formatError(`Failed to remove directory: ${msg}`));
      return;
    }
    info(`Directory removed recursively: ${dirPath}`);
  } catch (err) {
    if (err.code === 'ENOTEMPTY') {
      error(formatError('Directory is not empty.'));
    } else if (err.code === 'ENOENT') {
      error(formatError('Directory does not exist.'));
    } else if (err.code === 'EACCES' || err.code === 'EPERM') {
      error(formatError('Permission denied.'));
    } else if (err.code === 'EOUTSIDE') {
      error(formatError('Operation outside allowed directory.'));
    } else {
      error(formatError(`Error removing directory: ${err.message}`));
    }
  }
}
