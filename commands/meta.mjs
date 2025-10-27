import chalk from 'chalk';
import { error as logError } from '../utils/logger.mjs';
import { formatError, formatNameDesc } from '../utils/format.mjs';

/**
 * Displays a formatted help menu for the File Manager CLI, listing available commands
 * grouped by type (meta, navigation, directory, file, other) with their descriptions.
 *
 * @async
 * @function
 * @param {Object} context - The execution context containing configuration.
 * @param {Object} [context.config] - The configuration object mapping command names to their metadata.
 * @returns {Promise<void>} Prints the help menu to the console.
 */
async function help(context) {
  try {
    const config = context?.config || {};

    const entries = Object.entries(config).map(([name, meta]) => ({
      name,
      type: meta?.type || 'other',
      description: meta?.description || '',
    }));

    const groups = entries.reduce((acc, cmd) => {
      (acc[cmd.type] ||= []).push(cmd);
      return acc;
    }, {});

    const typeOrder = ['meta', 'navigation', 'directory', 'file', 'other'];
    const typeLabels = {
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

    // Compute global max command name length for consistent alignment across groups
    const globalMax = entries.reduce((m, c) => Math.max(m, (c?.name || '').length), 0);

    for (const type of typeOrder) {
      const cmds = groups[type];
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
  } catch (err) {
    logError(formatError(`Error rendering help: ${err.message}`));
  }
}

function exit(context) {
  console.log(chalk.green('Exiting the program...'));
  if (context && context.rl && typeof context.rl.close === 'function') {
    context.rl.close();
  }
}

export { help, exit };
