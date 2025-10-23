import fs from 'fs/promises';
import {
  isFile,
  exists,
  safeUnlink,
  copyFile,
  isDirectory,
} from '../utils/fs-utils.mjs';
import { info, error } from '../utils/logger.mjs';
import { formatError } from '../utils/format.mjs';

async function cat(filePath) {
  if (!filePath) {
    error('File path is not specified.');
    return;
  }
  try {
    if (!(await exists(filePath))) {
      error('File not found.');
      return;
    }
    if (await isDirectory(filePath)) {
      error('The specified path is a directory, not a file.');
      return;
    }
    if (!(await isFile(filePath))) {
      error('The specified path is not a file.');
      return;
    }
    const content = await fs.readFile(filePath, 'utf-8');
    info(content);
  } catch (err) {
    error(formatError('Error reading file', err));
  }
}

async function touch(filePath) {
  if (!filePath) {
    error('File path is not specified.');
    return;
  }
  try {
    if (await exists(filePath)) {
      error('File already exists.');
      return;
    }
    await fs.writeFile(filePath, '');
    info('File created successfully.');
  } catch (err) {
    error(formatError('Error creating file', err));
  }
}

async function rm(filePath) {
  if (!filePath) {
    error('File path is not specified.');
    return;
  }
  try {
    if (!(await exists(filePath))) {
      error('File not found.');
      return;
    }
    if (await isDirectory(filePath)) {
      error('The specified path is a directory, not a file.');
      return;
    }
    if (!(await isFile(filePath))) {
      error('The specified path is not a file.');
      return;
    }
    const res = await safeUnlink(filePath);
    if (res && res.success) {
      info('File deleted successfully.');
    } else {
      const msg = res && res.error ? res.error.message : 'Unknown error';
      error(formatError(`Error deleting file: ${msg}`));
    }
  } catch (err) {
    error(formatError('Error deleting file', err));
  }
}

async function cp(srcPath, destPath) {
  if (!srcPath || !destPath) {
    error('Source and destination paths must be specified.');
    return;
  }
  try {
    if (!(await exists(srcPath))) {
      error('Source file not found.');
      return;
    }
    if (await isDirectory(srcPath)) {
      error('Source path is a directory, not a file.');
      return;
    }
    if (!(await isFile(srcPath))) {
      error('Source path is not a file.');
      return;
    }
    if (await exists(destPath)) {
      error('Destination file already exists.');
      return;
    }
    await copyFile(srcPath, destPath);
    info('File copied successfully.');
  } catch (err) {
    error(formatError('Error copying file', err));
  }
}

async function mv(srcPath, destPath) {
  if (!srcPath || !destPath) {
    error('Source and destination paths must be specified.');
    return;
  }
  try {
    if (!(await exists(srcPath))) {
      error('Source file not found.');
      return;
    }
    if (await isDirectory(srcPath)) {
      error('Source path is a directory, not a file.');
      return;
    }
    if (!(await isFile(srcPath))) {
      error('Source path is not a file.');
      return;
    }
    if (await exists(destPath)) {
      error('Destination file already exists.');
      return;
    }
    await fs.rename(srcPath, destPath);
    info('File moved successfully.');
  } catch (err) {
    error(formatError('Error moving file', err));
  }
}

export { cat, touch, rm, cp, mv };
