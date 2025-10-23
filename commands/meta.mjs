import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { error as logError } from '../utils/logger.mjs';
import { formatError } from '../utils/format.mjs';

const CONFIG_PATH = new URL('../config/config.json', import.meta.url);

async function help() {
  try {
    const configRaw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configRaw);

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
    console.log(chalk.bold.cyan('File Manager CLI — Help'));
    console.log(chalk.gray('Usage: ') + chalk.white('fm> <command> [args]'));
    console.log();

    for (const type of typeOrder) {
      const cmds = groups[type];
      if (!cmds || cmds.length === 0) continue;
      cmds.sort((a, b) => a.name.localeCompare(b.name));
      const maxName = cmds.reduce((m, c) => Math.max(m, c.name.length), 0);

      console.log(chalk.bold.magenta(`› ${typeLabels[type]} commands`));
      for (const c of cmds) {
        const name = chalk.cyan(c.name.padEnd(maxName, ' '));
        const desc = c.description
          ? chalk.gray(c.description)
          : chalk.gray('—');
        console.log(`  ${name}  ${desc}`);
      }
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
    logError(formatError(`Error reading config.json: ${err.message}`));
  }
}

function exit(context) {
  console.log(chalk.green('Exiting the program...'));
  if (context && context.rl && typeof context.rl.close === 'function') {
    context.rl.close();
  }
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

export { help, exit };
