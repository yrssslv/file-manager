import fs from 'node:fs/promises';
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

async function cat(filePath: string): Promise<void> {
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
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error reading file', err));
  }
}

async function touch(filePath: string): Promise<void> {
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
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error creating file', err));
  }
}

async function rm(filePath: string): Promise<void> {
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
    const res: { success: boolean; error?: Error } = await safeUnlink(resolved);
    if (res.success) {
      info('File deleted successfully.');
    } else {
      const msg = res.error?.message || 'Unknown error';
      error(formatError(`Error deleting file: ${msg}`));
    }
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error deleting file', err));
  }
}

async function cp(srcPath: string, destPath: string): Promise<void> {
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
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error copying file', err));
  }
}

async function mv(srcPath: string, destPath: string): Promise<void> {
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
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'EOUTSIDE') {
      error(formatError('Access outside the allowed root directory is not permitted.'));
      return;
    }
    error(formatError('Error moving file', err));
  }
}

export { cat, touch, rm, cp, mv };
