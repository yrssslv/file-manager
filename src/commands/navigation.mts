import path from 'node:path';
import { info, error as logError } from '../utils/logger.mjs';
import { formatError } from '../utils/format.mjs';
import {
  resolveWithinRoot,
  ensureInsideRoot,
  ensureNotProtectedDirectory,
} from '../utils/fs-utils.mjs';

function pwd(): void {
  const currentDir = process.cwd();
  const absolutePath = path.resolve(currentDir);
  info(`Current directory: ${absolutePath}`);
}

async function cd(p: string): Promise<void> {
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
    await ensureNotProtectedDirectory(realTarget);
    process.chdir(realTarget);
    pwd();
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      if (err.code === 'ENOENT') {
        logError(formatError(`Directory does not exist: ${p}`));
      } else if (err.code === 'EACCES') {
        logError(formatError(`Permission denied: ${p}`));
      } else if (err.code === 'ENOTDIR') {
        logError(formatError(`Not a directory: ${p}`));
      } else if (err.code === 'EOUTSIDE') {
        logError(
          formatError(
            'Access denied: Cannot navigate outside the allowed root directory.'
          )
        );
      } else if (err.code === 'EPROTECTED_DIR') {
        logError(formatError(err.message));
      } else {
        logError(formatError(`Error changing directory: ${err.message}`));
      }
    } else {
      logError(formatError('Unknown error changing directory'));
    }
  }
}

export { pwd, cd };
