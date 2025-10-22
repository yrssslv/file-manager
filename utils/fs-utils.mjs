import fs from 'fs/promises';
import path from 'path';

export async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(path) {
  const stat = await fs.stat(path);
  return stat.isDirectory();
}

export async function isFile(path) {
  const stat = await fs.stat(path);
  return stat.isFile();
}

export async function getSize(path) {
  const stat = await fs.stat(path);
  return stat.size;
}

export async function safeUnlink(path) {
  try {
    await fs.unlink(path);
    return true;
  } catch {
    return false;
  }
}
export async function safeRmdir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export async function copyFile(src, dest) {
  try {
    await fs.copyFile(src, dest);
    return true;
  } catch {
    return false;
  }
}
export async function copyDir(src, dest) {
  try {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function readDir(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    return files;
  } catch {
    return [];
  }
}
