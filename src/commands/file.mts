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
  ensureNotProtected,
  safeWriteFile,
  safeRename,
  ensureNotProtectedDirectory,
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

    const parentDir = path.dirname(resolved);
    await ensureNotProtectedDirectory(parentDir);

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
    if (err instanceof Error && 'code' in err) {
      if (err.code === 'EOUTSIDE') {
        error(formatError('Access outside the allowed root directory is not permitted.'));
        return;
      }
      if (err.code === 'EPROTECTED_DIR') {
        error(formatError(err.message));
        return;
      }
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
    await ensureNotProtected(resolved);
    await safeWriteFile(resolved, '');
    info('File created successfully.');
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      if (err.code === 'EOUTSIDE') {
        error(formatError('Access outside the allowed root directory is not permitted.'));
        return;
      }
      if (err.code === 'EPROTECTED') {
        error(formatError('Cannot create files in protected directories.'));
        return;
      }
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
    await ensureNotProtected(resolved);
    const res: { success: boolean; error?: Error } = await safeUnlink(resolved);
    if (res.success) {
      info('File deleted successfully.');
    } else {
      const msg = res.error?.message || 'Unknown error';
      error(formatError(`Error deleting file: ${msg}`));
    }
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      if (err.code === 'EOUTSIDE') {
        error(formatError('Access outside the allowed root directory is not permitted.'));
        return;
      }
      if (err.code === 'EPROTECTED') {
        error(formatError('Cannot delete protected application files.'));
        return;
      }
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
    await ensureNotProtected(resolvedDest);
    await copyFile(resolvedSrc, resolvedDest);
    info('File copied successfully.');
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      if (err.code === 'EOUTSIDE') {
        error(formatError('Access outside the allowed root directory is not permitted.'));
        return;
      }
      if (err.code === 'EPROTECTED') {
        error(formatError('Cannot overwrite protected application files.'));
        return;
      }
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
    await ensureNotProtected(resolvedSrc);
    if (await exists(resolvedDest)) {
      error(formatError('Destination file already exists.'));
      return;
    }
    await ensureNotProtected(resolvedDest);
    await safeRename(resolvedSrc, resolvedDest);
    info('File moved successfully.');
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      if (err.code === 'EOUTSIDE') {
        error(formatError('Access outside the allowed root directory is not permitted.'));
        return;
      }
      if (err.code === 'EPROTECTED') {
        error(formatError('Cannot move protected application files.'));
        return;
      }
    }
    error(formatError('Error moving file', err));
  }
}

async function echo(...args: string[]): Promise<void> {
  const actualArgs = args.filter(
    (arg) =>
      typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean'
  );

  if (actualArgs.length === 0) {
    console.log('');
    return;
  }

  const redirectIndex = actualArgs.findIndex((arg) => arg === '>');

  if (redirectIndex !== -1) {
    const textParts = actualArgs.slice(0, redirectIndex);
    const filePath = actualArgs[redirectIndex + 1];

    if (!filePath) {
      error(formatError('No file specified for output redirection.'));
      return;
    }

    const text = textParts.join(' ');

    try {
      const resolved = await resolveWithinRoot(filePath, {
        allowNonexistent: true,
      });
      ensureInsideRoot(resolved);

      const parentDir = path.dirname(resolved);
      await ensureNotProtectedDirectory(parentDir);

      await ensureNotProtected(resolved);

      await safeWriteFile(resolved, text + '\n');
      info(`Text written to file: ${filePath}`);
    } catch (err: unknown) {
      if (err instanceof Error && 'code' in err) {
        if (err.code === 'EOUTSIDE') {
          error(
            formatError('Access outside the allowed root directory is not permitted.')
          );
          return;
        }
        if (err.code === 'EPROTECTED') {
          error(formatError('Cannot overwrite protected application files.'));
          return;
        }
        if (err.code === 'EPROTECTED_DIR') {
          error(formatError(err.message));
          return;
        }
      }
      error(formatError('Error writing to file', err));
    }
  } else {
    const text = actualArgs.join(' ');

    const hasEscapeFlag = actualArgs.includes('-e');

    if (hasEscapeFlag) {
      const textWithoutFlag = actualArgs.filter((arg) => arg !== '-e').join(' ');
      const processed = textWithoutFlag
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\');
      console.log(processed);
    } else {
      console.log(text);
    }
  }
}

export { cat, touch, rm, cp, mv, echo };
