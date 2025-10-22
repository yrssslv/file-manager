import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

async function help() {
  const configPath = path.join(process.cwd(), 'config', 'config.json');
  try {
    const configRaw = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configRaw);

    function colorize(obj, indent = 2) {
      const json = JSON.stringify(obj, null, indent);
      return json.replace(/"([^"]+)":|"([^"]*)"/g, (match, key, value) => {
        if (key) return chalk.cyan(`"${key}"`) + ':';
        if (value !== undefined) return chalk.yellow(`"${value}"`);
        return match;
      });
    }

    console.log(colorize(config));
  } catch (err) {
    console.error(chalk.red('Error reading config.json:'), err.message);
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
