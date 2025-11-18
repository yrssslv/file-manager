import fs from 'node:fs/promises';
import path from 'node:path';
import type { SafeFsOperations } from './types.mjs';
import {
  resolveWithinRoot,
  ensureInsideRoot,
  exists,
  isFile,
  isDirectory,
} from '../utils/fs-utils.mjs';

export class SafeFs implements SafeFsOperations {
  cwd(): string {
    return process.cwd();
  }

  async chdir(p: string): Promise<void> {
    const targetPath = path.resolve(process.cwd(), p);
    const resolved = await resolveWithinRoot(targetPath);
    ensureInsideRoot(resolved);

    const stats = await fs.stat(resolved);
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    process.chdir(resolved);
  }

  async readDir(p: string): Promise<string[]> {
    const resolved = await this.resolveSafePath(p);
    const stats = await fs.stat(resolved);

    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    return await fs.readdir(resolved);
  }

  async readFile(p: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    const resolved = await this.resolveSafePath(p);

    if (!(await isFile(resolved))) {
      throw new Error('Path is not a file');
    }

    return await fs.readFile(resolved, encoding);
  }

  async writeFile(p: string, content: string): Promise<void> {
    const resolved = await this.resolveSafePath(p, { allowNonexistent: true });
    await fs.writeFile(resolved, content, 'utf-8');
  }

  async unlink(p: string): Promise<void> {
    const resolved = await this.resolveSafePath(p);

    if (!(await isFile(resolved))) {
      throw new Error('Path is not a file');
    }

    await fs.unlink(resolved);
  }

  async mkdir(p: string, options?: { recursive?: boolean }): Promise<void> {
    const resolved = await this.resolveSafePath(p, { allowNonexistent: true });
    await fs.mkdir(resolved, { recursive: options?.recursive ?? false });
  }

  async rmdir(p: string, options?: { recursive?: boolean }): Promise<void> {
    const resolved = await this.resolveSafePath(p);

    if (!(await isDirectory(resolved))) {
      throw new Error('Path is not a directory');
    }

    await fs.rm(resolved, { recursive: options?.recursive ?? false, force: false });
  }

  async exists(p: string): Promise<boolean> {
    try {
      const resolved = await this.resolveSafePath(p);
      return await exists(resolved);
    } catch {
      return false;
    }
  }

  async stat(p: string): Promise<{
    isFile: () => boolean;
    isDirectory: () => boolean;
    size: number;
    mtime: Date;
  }> {
    const resolved = await this.resolveSafePath(p);
    const stats = await fs.stat(resolved);

    return {
      isFile: () => stats.isFile(),
      isDirectory: () => stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime,
    };
  }

  async copyFile(source: string, destination: string): Promise<void> {
    const resolvedSource = await this.resolveSafePath(source);
    const resolvedDest = await this.resolveSafePath(destination, {
      allowNonexistent: true,
    });

    if (!(await isFile(resolvedSource))) {
      throw new Error('Source is not a file');
    }

    await fs.copyFile(resolvedSource, resolvedDest);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const resolvedOld = await this.resolveSafePath(oldPath);
    const resolvedNew = await this.resolveSafePath(newPath, { allowNonexistent: true });

    await fs.rename(resolvedOld, resolvedNew);
  }

  private async resolveSafePath(
    p: string,
    options?: { allowNonexistent?: boolean }
  ): Promise<string> {
    const candidate = path.resolve(p);
    const resolved = await resolveWithinRoot(candidate, {
      allowNonexistent: options?.allowNonexistent ?? false,
    });
    ensureInsideRoot(resolved);
    return resolved;
  }
}
