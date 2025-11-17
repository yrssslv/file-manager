import chalk from 'chalk';
import { error as logError } from '../utils/logger.mjs';
import { formatError, formatNameDesc } from '../utils/format.mjs';

async function help(context: {
  config?: Record<string, { type?: string; description?: string }>;
}): Promise<void> {
  try {
    const config = context?.config || {};

    const entries = Object.entries(config).map(([name, meta]) => ({
      name,
      type: meta?.type || 'other',
      description: meta?.description || '',
    }));

    const groups = entries.reduce(
      (
        acc: Record<string, Array<{ name: string; type: string; description: string }>>,
        cmd
      ) => {
        (acc[cmd.type] ||= []).push(cmd);
        return acc;
      },
      {} as Record<string, Array<{ name: string; type: string; description: string }>>
    );

    const typeOrder: readonly ['meta', 'navigation', 'directory', 'file', 'other'] = [
      'meta',
      'navigation',
      'directory',
      'file',
      'other',
    ];
    const typeLabels: Record<(typeof typeOrder)[number], string> = {
      meta: 'Meta',
      navigation: 'Navigation',
      directory: 'Directory',
      file: 'File',
      other: 'Other',
    };

    console.log();
    console.log(chalk.bold.cyan('File Manager CLI - Help'));
    console.log(chalk.gray('Usage: ') + chalk.white('fm> <command> [args]'));
    console.log();

    const globalMax = entries.reduce((m, c) => Math.max(m, (c?.name || '').length), 0);

    for (const type of typeOrder) {
      const cmds: Array<{ name: string; type: string; description: string }> | undefined =
        groups[type];
      if (!cmds || cmds.length === 0) continue;
      cmds.sort((a, b) => a.name.localeCompare(b.name));

      console.log(chalk.bold.magenta(`› ${typeLabels[type]} commands`));
      console.log(
        formatNameDesc(
          cmds.map((c) => ({
            name: c.name,
            description: c.description || '—',
          })),
          { minWidth: globalMax }
        )
      );
      console.log();
    }

    console.log(
      chalk.gray('Tip: type ') +
        chalk.yellow('help') +
        chalk.gray(' to show this menu again, or ') +
        chalk.yellow('exit') +
        chalk.gray(' to quit.')
    );
    console.log();
  } catch (err: unknown) {
    if (err instanceof Error) {
      logError(formatError(`Error rendering help: ${err.message}`));
    }
  }
}

function exit(context: { rl?: { close(): void } }): void {
  console.log(chalk.green('Exiting the program...'));
  if (context && context.rl && typeof context.rl.close === 'function') {
    context.rl.close();
  }
}

function clear(): void {
  console.clear();
}

export { help, exit, clear };
