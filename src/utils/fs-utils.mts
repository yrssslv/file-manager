import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ALLOWED_ROOT_DIR,
  RESOLVED_ALLOWED_ROOT_DIR,
  APP_ROOT_DIR,
} from './constants.mjs';

interface ProtectionConfig {
  protectedPaths: string[];
}

let protectionConfig: ProtectionConfig | null = null;

async function loadProtectionConfig(): Promise<ProtectionConfig> {
  if (protectionConfig) {
    return protectionConfig;
  }
  try {
    const configPath = path.join(APP_ROOT_DIR, 'src', 'config', 'protection.json');
    const content = await fs.readFile(configPath, 'utf-8');
    protectionConfig = JSON.parse(content);
    return protectionConfig!;
  } catch {
    protectionConfig = { protectedPaths: [] };
    return protectionConfig;
  }
}

let cachedAppRootReal: string | null = null;

async function getAppRootReal(): Promise<string> {
  if (cachedAppRootReal) {
    return cachedAppRootReal;
  }
  try {
    cachedAppRootReal = await fs.realpath(APP_ROOT_DIR);
    return cachedAppRootReal;
  } catch {
    cachedAppRootReal = path.resolve(APP_ROOT_DIR);
    return cachedAppRootReal;
  }
}

function normalizePathForComparison(p: string): string {
  return p.toLowerCase().replace(/\\/g, '/');
}

export async function isProtectedPath(targetPath: string): Promise<boolean> {
  try {
    const config = await loadProtectionConfig();
    const appRoot = await getAppRootReal();
    const absoluteTarget = path.resolve(targetPath);

    let realTarget: string;
    try {
      realTarget = await fs.realpath(absoluteTarget);
    } catch {
      const parentDir = path.dirname(absoluteTarget);
      try {
        const realParent = await fs.realpath(parentDir);
        realTarget = path.join(realParent, path.basename(absoluteTarget));
      } catch {
        realTarget = absoluteTarget;
      }
    }

    const normalizedAppRoot = normalizePathForComparison(appRoot);
    const normalizedTarget = normalizePathForComparison(realTarget);

    if (normalizedTarget === normalizedAppRoot) {
      return true;
    }

    if (!normalizedTarget.startsWith(normalizedAppRoot + '/')) {
      return false;
    }

    const relativePath = path.relative(appRoot, realTarget);

    if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return false;
    }

    const normalizedRelPath = relativePath.replace(/\\/g, '/');

    for (const protectedPath of config.protectedPaths) {
      const normalizedProtected = protectedPath.replace(/\\/g, '/');

      if (normalizedRelPath === normalizedProtected) {
        return true;
      }

      if (normalizedRelPath.startsWith(normalizedProtected + '/')) {
        return true;
      }
    }

    return false;
  } catch (err) {
    return true;
  }
}

export async function ensureNotProtected(targetPath: string): Promise<void> {
  const isProtected = await isProtectedPath(targetPath);
  if (isProtected) {
    const protectedErr = Object.assign(
      new Error('Cannot modify protected application files or directories.'),
      { code: 'EPROTECTED' as const }
    );
    throw protectedErr;
  }
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
    await ensureNotProtected(filePath);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

async function recursiveProtectionCheck(dirPath: string): Promise<void> {
  await ensureNotProtected(dirPath);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    await ensureNotProtected(fullPath);
    if (entry.isDirectory()) {
      await recursiveProtectionCheck(fullPath);
    }
  }
}

export async function safeRmdir(
  dirPath: string,
  options: { recursive?: boolean; force?: boolean } = {}
): Promise<{ success: boolean; error?: Error }> {
  try {
    validatePath(dirPath);
    await ensureNotProtected(dirPath);

    if (options.recursive) {
      // Рекурсивно проверяем все файлы и папки внутри
      await recursiveProtectionCheck(dirPath);
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
  await ensureNotProtected(dest);
  await fs.copyFile(src, dest);
}

export async function safeWriteFile(filePath: string, content: string): Promise<void> {
  validatePath(filePath);
  await ensureNotProtected(filePath);
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function safeRename(oldPath: string, newPath: string): Promise<void> {
  validatePath(oldPath);
  validatePath(newPath);
  await ensureNotProtected(oldPath);
  await ensureNotProtected(newPath);
  await fs.rename(oldPath, newPath);
}

export async function copyDir(
  src: string,
  dest: string
): Promise<{ success: boolean; error?: Error }> {
  try {
    validatePath(src);
    validatePath(dest);
    await ensureNotProtected(dest);
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      await ensureNotProtected(destPath);
      if (entry.isDirectory()) {
        const result = await copyDir(srcPath, destPath);
        if (!result.success) {
          return result;
        }
      } else {
        await ensureNotProtected(destPath);
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
