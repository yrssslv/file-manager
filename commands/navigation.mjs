import { formatPath } from '../utils/format.mjs';
import { info, error as logError } from '../utils/logger.mjs';
import { formatError } from '../utils/format.mjs';

const ROOT_DIR = process.env.ALLOWED_ROOT_DIR || process.cwd();

function pwd() {
  const currentDir = process.cwd();
  const absolutePath = formatPath(currentDir, '/'); // покажем абсолютный путь
  info(`Current directory: ${absolutePath}`);
}

function cd(p) {
  if (!p) {
    logError(formatError('No path provided. Usage: cd <directory>'));
    return;
  }
  const targetPath = formatPath(p);
  const rootPath = formatPath(ROOT_DIR, '/');

  if (!targetPath.startsWith(rootPath)) {
    logError(
      formatError(
        'Access denied: Cannot navigate outside the allowed root directory.'
      )
    );
    return;
  }

  try {
    process.chdir(targetPath);
    pwd();
  } catch (err) {
    if (err.code === 'ENOENT') {
      logError(formatError(`Directory does not exist: ${p}`));
    } else if (err.code === 'EACCES') {
      logError(formatError(`Permission denied: ${p}`));
    } else if (err.code === 'ENOTDIR') {
      logError(formatError(`Not a directory: ${p}`));
    } else {
      logError(formatError(`Error changing directory: ${err.message}`));
    }
  }
}

export { pwd, cd };
