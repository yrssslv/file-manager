import fs from 'node:fs/promises';
import path from 'node:path';
import { ALLOWED_ROOT_DIR, RESOLVED_ALLOWED_ROOT_DIR } from './constants.mjs';

const APP_PROTECTED_DIRS = ['src', 'bin', 'tests', 'node_modules'];
const APP_PROTECTED_FILES = ['package.json', 'tsconfig.json', 'eslint.config.mjs', 'README.md'];

export function isProtectedPath(targetPath: string): boolean {
  const rootDir = RESOLVED_ALLOWED_ROOT_DIR;
  const resolvedTarget = path.resolve(targetPath);
  const relativePath = path.relative(rootDir, resolvedTarget);

  if (!relativePath || relativePath.startsWith('..')) {
    return false;
  }

  const parts = relativePath.split(path.sep);
  const firstPart = parts[0];

  if (APP_PROTECTED_DIRS.includes(firstPart || '')) {
    return true;
  }

  if (parts.length === 1 && APP_PROTECTED_FILES.includes(firstPart || '')) {
    return true;
  }

  return false;
}

function validatePath(p: unknown): void {
  if (typeof p !== 'string' || p.trim() === '') {
    throw new Error('Invalid path: Path must be a non-empty string');
  }
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    validatePath(filePath);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(filePath: string): Promise<boolean> {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.isDirectory();
}

export async function isFile(filePath: string): Promise<boolean> {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.isFile();
}

export async function getSize(filePath: string): Promise<number> {
  validatePath(filePath);
  const stat = await fs.stat(filePath);
  return stat.size;
}

export async function safeUnlink(
  filePath: string
): Promise<{ success: boolean; error?: Error }> {
  try {
    validatePath(filePath);
    if (isProtectedPath(filePath)) {
      return {
        success: false,
        error: new Error('Cannot delete protected application files'),
      };
    }
    await fs.unlink(filePath);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function safeRmdir(
  dirPath: string,
  options: { recursive?: boolean; force?: boolean } = {}
): Promise<{ success: boolean; error?: Error }> {
  try {
    validatePath(dirPath);
    if (isProtectedPath(dirPath)) {
      return {
        success: false,
        error: new Error('Cannot delete protected application directories'),
      };
    }
    const { recursive = false, force = false } = options;
    await fs.rm(dirPath, { recursive, force });
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function copyFile(src: string, dest: string): Promise<void> {
  validatePath(src);
  validatePath(dest);
  await fs.copyFile(src, dest);
}

export async function copyDir(
  src: string,
  dest: string
): Promise<{ success: boolean; error?: Error }> {
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
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function readDir(dirPath: string): Promise<string[]> {
  try {
    validatePath(dirPath);
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

export function isInsideRoot(root: string, target: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const rel = path.relative(resolvedRoot, resolvedTarget);
  return (
    resolvedTarget === resolvedRoot ||
    (rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel))
  );
}

export const ROOT_REAL: string = await (async (): Promise<string> => {
  try {
    return await fs.realpath(ALLOWED_ROOT_DIR);
  } catch {
    return RESOLVED_ALLOWED_ROOT_DIR;
  }
})();

export function ensureInsideRoot(targetAbs: string): void {
  if (isInsideRoot(ROOT_REAL, targetAbs)) return;
  const outsideErr = Object.assign(
    new Error('Path is outside the allowed root directory.'),
    { code: 'EOUTSIDE' as const }
  );
  throw outsideErr;
}

export async function resolveWithinRoot(
  userPath: string,
  { allowNonexistent = false }: { allowNonexistent?: boolean } = {}
): Promise<string> {
  const candidateAbs = path.isAbsolute(userPath)
    ? userPath
    : path.resolve(process.cwd(), userPath);

  if (allowNonexistent) {
    const parentReal = await fs.realpath(path.dirname(candidateAbs));
    const finalAbs = path.join(parentReal, path.basename(candidateAbs));
    ensureInsideRoot(finalAbs);
    return finalAbs;
  }

  const real = await fs.realpath(candidateAbs);
  ensureInsideRoot(real);
  return real;
}
