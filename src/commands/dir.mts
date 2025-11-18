import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import {
  readDir,
  isDirectory,
  safeRmdir,
  resolveWithinRoot,
  ensureInsideRoot,
  ensureNotProtected,
} from '../utils/fs-utils.mjs';
import { formatList, formatError } from '../utils/format.mjs';
import { info, error } from '../utils/logger.mjs';
import { ALLOWED_ROOT_DIR } from '../utils/constants.mjs';

const ROOT_DIR: string = ALLOWED_ROOT_DIR;

function isArgEmpty(arg: string): boolean {
  return !arg || typeof arg !== 'string' || arg.trim() === '';
}

async function resolveDirPath(
  candidate: string,
  { mayNotExist = false }: { mayNotExist?: boolean } = {}
): Promise<string> {
  const resolved = await resolveWithinRoot(candidate, {
    allowNonexistent: mayNotExist,
  });
  ensureInsideRoot(resolved);
  return resolved;
}

async function ls(p: string = ROOT_DIR): Promise<void> {
  try {
    if (isArgEmpty(p)) p = ROOT_DIR;
    const candidate = path.resolve(p);
    const realDir = await resolveDirPath(candidate);

    const stats = await fs.stat(realDir);
    if (!stats.isDirectory()) {
      error(formatError('Path is not a directory.'));
      return;
    }

    const items = await readDir(realDir);
    if (!items.length) {
      info('Directory is empty.');
      return;
    }

    const flags = await Promise.all(
      items.map(async (item: string) => {
        const fullPath = path.join(realDir, item);
        return (await isDirectory(fullPath)) ? 'dir' : 'file';
      })
    );
    const result = items.map((item: string, idx: number) =>
      flags[idx] === 'dir' ? `${item}/` : item
    );
    info(formatList(result));
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      const errorWithCode = err as Error & { code: string };
      if (errorWithCode.code === 'ENOENT') {
        error(formatError('Directory does not exist.'));
      } else if (errorWithCode.code === 'EACCES') {
        error(formatError('Permission denied.'));
      } else if (errorWithCode.code === 'EOUTSIDE') {
        error(formatError('Operation outside allowed directory.'));
      } else {
        error(formatError(`Error reading directory: ${errorWithCode.message}`));
      }
    } else {
      error(
        formatError(
          `Error reading directory: ${err instanceof Error ? err.message : String(err)}`
        )
      );
    }
  }
}

async function mkdir(dirPath: string, context: any): Promise<void> {
  try {
    if (isArgEmpty(dirPath)) {
      const usage = context?.config?.mkdir?.description || 'Usage: mkdir <dir>';
      error(formatError(usage));
      return;
    }
    const candidate = path.resolve(dirPath);
    const safeTarget = await resolveDirPath(candidate, { mayNotExist: true });
    await ensureNotProtected(safeTarget);
    await fs.mkdir(safeTarget, { recursive: true });
    info(`Directory created: ${dirPath}`);
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      const errorWithCode = err as Error & { code: string };
      if (errorWithCode.code === 'EEXIST') {
        error(formatError('Directory already exists.'));
      } else if (errorWithCode.code === 'EACCES') {
        error(formatError('Permission denied.'));
      } else if (errorWithCode.code === 'EOUTSIDE') {
        error(formatError('Operation outside allowed directory.'));
      } else if (errorWithCode.code === 'EPROTECTED') {
        error(formatError('Cannot create directories in protected locations.'));
      } else {
        error(formatError(`Error creating directory: ${errorWithCode.message}`));
      }
    } else {
      error(
        formatError(
          `Error creating directory: ${err instanceof Error ? err.message : String(err)}`
        )
      );
    }
  }
}

async function rmdir(...inputs: any[]): Promise<void> {
  let args = inputs;
  const maybeContext = args.slice(-1)[0];
  if (maybeContext && typeof maybeContext === 'object' && !Array.isArray(maybeContext)) {
    args = args.slice(0, -1);
  }
  const context =
    typeof maybeContext === 'object' && !Array.isArray(maybeContext)
      ? maybeContext
      : undefined;
  let dirPath: string | undefined;
  let recursive = false;
  let autoYes = false;

  for (const arg of args) {
    if (typeof arg !== 'string') continue;
    if (arg === '-r' || arg === '--recursive') {
      recursive = true;
      continue;
    }
    if (arg === '-y' || arg === '--yes') {
      autoYes = true;
      continue;
    }
    if (!dirPath) {
      dirPath = arg;
    } else {
      error(formatError('Too many arguments provided to rmdir.'));
      return;
    }
  }

  try {
    if (!dirPath || isArgEmpty(dirPath)) {
      const usage =
        context?.config?.rmdir?.description ||
        'Usage: rmdir <dir> [-r|--recursive] [-y|--yes]';
      error(formatError(usage));
      return;
    }
    const targetPath = path.resolve(dirPath);
    const realTarget = await resolveDirPath(targetPath);

    await ensureNotProtected(realTarget);

    if (!recursive) {
      await ensureNotProtected(realTarget);
      await fs.rm(realTarget, { recursive: false, force: false });
      info(`Directory removed: ${dirPath}`);
      return;
    }

    if (!autoYes && context?.rl) {
      if (context.setInQuestion) context.setInQuestion(true);
      const answer = await new Promise<string>((resolve) => {
        context.rl.question(
          `This will recursively delete "${dirPath}" and all its contents. Proceed? [y/N] `,
          (ans: any) => {
            if (context.setInQuestion) context.setInQuestion(false);
            resolve(String(ans || '').trim());
          }
        );
      });
      const ok = /^(y|yes)$/i.test(answer);
      if (!ok) {
        info('Recursive deletion cancelled.');
        return;
      }
    }

    const res = await safeRmdir(realTarget, { recursive: true, force: true });
    if (!res || res.success !== true) {
      const msg = res && res.error ? res.error.message : 'Unknown error';
      error(formatError(`Failed to remove directory: ${msg}`));
      return;
    }
    info(`Directory removed recursively: ${dirPath}`);
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      const errorWithCode = err as Error & { code: string };
      if (errorWithCode.code === 'ENOTEMPTY') {
        error(formatError('Directory is not empty.'));
      } else if (errorWithCode.code === 'ENOENT') {
        error(formatError('Directory does not exist.'));
      } else if (errorWithCode.code === 'EACCES' || errorWithCode.code === 'EPERM') {
        error(formatError('Permission denied.'));
      } else if (errorWithCode.code === 'EOUTSIDE') {
        error(formatError('Operation outside allowed directory.'));
      } else if (errorWithCode.code === 'EPROTECTED') {
        error(formatError('Cannot delete protected application directories.'));
      } else {
        error(formatError(`Error removing directory: ${errorWithCode.message}`));
      }
    } else {
      error(
        formatError(
          `Error removing directory: ${err instanceof Error ? err.message : String(err)}`
        )
      );
    }
  }
}

async function tree(...inputs: any[]): Promise<void> {
  let args = inputs;
  const maybeContext = args.slice(-1)[0];
  if (maybeContext && typeof maybeContext === 'object' && !Array.isArray(maybeContext)) {
    args = args.slice(0, -1);
  }

  let dirPath: string | undefined;
  let maxDepth: number | null = null;
  let directoriesOnly = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg !== 'string') continue;

    if (arg === '-d' || arg === '--directories') {
      directoriesOnly = true;
      continue;
    }

    if (arg === '-L' || arg === '--level') {
      const nextArg = args[i + 1];
      if (nextArg && typeof nextArg === 'string') {
        const depth = parseInt(nextArg, 10);
        if (!isNaN(depth) && depth > 0) {
          maxDepth = depth;
          i++;
          continue;
        }
      }
      error(formatError('Invalid depth value for -L option'));
      return;
    }

    if (!dirPath && !arg.startsWith('-')) {
      dirPath = arg;
    }
  }

  try {
    const targetPath = dirPath ? path.resolve(dirPath) : process.cwd();
    const realDir = await resolveDirPath(targetPath);

    const stats = await fs.stat(realDir);
    if (!stats.isDirectory()) {
      error(formatError('Path is not a directory.'));
      return;
    }

    const treeLines: string[] = [chalk.cyan(dirPath || '.')];
    await buildTree(realDir, '', true, maxDepth, 0, directoriesOnly, treeLines);

    for (const line of treeLines) {
      info(line);
    }
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err) {
      const errorWithCode = err as Error & { code: string };
      if (errorWithCode.code === 'ENOENT') {
        error(formatError('Directory does not exist.'));
      } else if (errorWithCode.code === 'EACCES') {
        error(formatError('Permission denied.'));
      } else if (errorWithCode.code === 'EOUTSIDE') {
        error(formatError('Operation outside allowed directory.'));
      } else {
        error(formatError(`Error displaying tree: ${errorWithCode.message}`));
      }
    } else {
      error(
        formatError(
          `Error displaying tree: ${err instanceof Error ? err.message : String(err)}`
        )
      );
    }
  }
}

async function buildTree(
  dirPath: string,
  prefix: string,
  _isLast: boolean,
  maxDepth: number | null,
  currentDepth: number,
  directoriesOnly: boolean,
  output: string[]
): Promise<void> {
  if (maxDepth !== null && currentDepth >= maxDepth) {
    return;
  }

  try {
    const items = await readDir(dirPath);

    const itemsWithTypes = await Promise.all(
      items.map(async (item: string) => {
        const fullPath = path.join(dirPath, item);
        const isDir = await isDirectory(fullPath);
        return { name: item, isDir, fullPath };
      })
    );

    const filteredItems = directoriesOnly
      ? itemsWithTypes.filter((item) => item.isDir)
      : itemsWithTypes;

    filteredItems.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < filteredItems.length; i++) {
      const item = filteredItems[i]!;
      const isLastItem = i === filteredItems.length - 1;
      const connector = isLastItem ? '└── ' : '├── ';
      const itemPrefix = prefix + connector;

      const displayName = item.isDir
        ? chalk.blue(item.name + '/')
        : chalk.white(item.name);

      output.push(itemPrefix + displayName);

      if (item.isDir) {
        const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
        await buildTree(
          item.fullPath,
          newPrefix,
          isLastItem,
          maxDepth,
          currentDepth + 1,
          directoriesOnly,
          output
        );
      }
    }
  } catch (err: unknown) {
    return;
  }
}

export { ls, mkdir, rmdir, tree };
