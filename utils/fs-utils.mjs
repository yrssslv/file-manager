import fs from 'fs/promises';
import path from 'path';

function validatePath(p) {
  if (typeof p !== 'string' || p.trim() === '') {
    throw new Error('Invalid path: Path must be a non-empty string');
  }
}

export async function exists(filePath) {
  try {
    validatePath(filePath);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(filePath) {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.isDirectory();
}

export async function isFile(filePath) {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.isFile();
}

export async function getSize(filePath) {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.size;
}

export async function safeUnlink(filePath) {
  try {
    validatePath(filePath);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function safeRmdir(dirPath) {
  try {
    validatePath(dirPath);
    await fs.rm(dirPath, { recursive: true, force: true });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function copyFile(src, dest) {
  validatePath(src);
  validatePath(dest);
  await fs.copyFile(src, dest);
}

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

export async function readDir(dirPath) {
  try {
    validatePath(dirPath);
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}
