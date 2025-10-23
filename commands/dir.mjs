import fs from 'fs/promises';
import path from 'path';
import { readDir, isDirectory, safeRmdir } from '../utils/fs-utils.mjs';
import { formatList, formatError } from '../utils/format.mjs';
import { info, error } from '../utils/logger.mjs';

const ROOT_DIR = process.env.ALLOWED_ROOT_DIR || process.cwd();

function isPathAllowed(target, root = ROOT_DIR) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  return resolvedTarget.startsWith(resolvedRoot);
}

function isArgEmpty(arg) {
  return !arg || typeof arg !== 'string' || arg.trim() === '';
}

function checkPathAllowed(p) {
  if (!isPathAllowed(p, ROOT_DIR)) {
    throw Object.assign(new Error('Operation outside allowed directory.'), {
      code: 'EOUTSIDE',
    });
  }
}

export async function ls(p = ROOT_DIR) {
  try {
    if (isArgEmpty(p)) p = ROOT_DIR;
    checkPathAllowed(p);

    const items = await readDir(p);
    if (!items.length) {
      info('Directory is empty.');
      return;
    }

    const result = [];
    for (const item of items) {
      const fullPath = path.join(p, item);
      const isDir = await isDirectory(fullPath);
      result.push(isDir ? `${item}/` : item);
    }
    console.log(formatList(result));
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

export async function mkdir(dirPath) {
  try {
    if (isArgEmpty(dirPath)) {
      error(formatError('Directory path is required.'));
      return;
    }
    checkPathAllowed(dirPath);
    await fs.mkdir(dirPath, { recursive: true });
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

export async function rmdir(dirPath) {
  try {
    if (isArgEmpty(dirPath)) {
      error(formatError('Directory path is required.'));
      return;
    }
    checkPathAllowed(dirPath);
    const res = await safeRmdir(dirPath);
    if (!res || res.success !== true) {
      const msg = res && res.error ? res.error.message : 'Unknown error';
      error(formatError(`Failed to remove directory: ${msg}`));
      return;
    }
    info(`Directory removed: ${dirPath}`);
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
