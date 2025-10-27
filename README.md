<div align="center">

# File Manager CLI

Sandboxed, modular, and tested file‑manager for Node.js (ESM).

</div>

## Highlights

- Node 18+, modern ESM modules
- Sandboxed filesystem access (safe operations inside `ALLOWED_ROOT_DIR`)
- Clean, colorized logging with levels
- Helpful, aligned help menu from `config/config.json`
- Safe recursive deletion with confirmation (`rmdir -r`, `--yes` to skip prompt)
- Packaged CLI entry (`fm`) and direct `node app.mjs` run
- Smoke tests with `node:test`; ESLint/Prettier configs

## Quick start

Prerequisite: [Node.js](https://nodejs.org/) v18 or newer

Local run (no install required):

```powershell
node app.mjs
```

Development (auto‑restart on changes, Node 18+):

```powershell
npm run dev
```

CLI binary options:

- Link locally for the `fm` command during development:

  ```powershell
  npm link
  fm
  ```

- Or after publishing to npm, you can install globally and run anywhere:

  ```powershell
  npm i -g file-manager-app
  fm
  ```

## Using the CLI

You’ll see the prompt:

```
fm>
```

Type `help` to see commands. Quotes and escaping are supported in arguments.

### Commands

- help
  - Usage: `help`
  - Prints grouped list of commands from `config/config.json` with aligned columns.

- exit
  - Usage: `exit`
  - Gracefully ends the session.

- pwd
  - Usage: `pwd`
  - Shows the absolute current working directory inside the sandbox.

- ls
  - Usage: `ls [dir]`
  - Lists entries in a directory (defaults to CWD). Directories are shown with trailing `/`.

- cd
  - Usage: `cd <dir>`
  - Changes directory. All paths are validated to remain within `ALLOWED_ROOT_DIR`.

- cat
  - Usage: `cat <file>`
  - Prints file contents.

- touch
  - Usage: `touch <file>`
  - Creates an empty file if it doesn’t exist.

- rm
  - Usage: `rm <file>`
  - Deletes a file (directories are not allowed).

- mkdir
  - Usage: `mkdir <dir>`
  - Creates a directory recursively.

- rmdir
  - Usage: `rmdir <dir> [-r|--recursive] [-y|--yes]`
  - Removes an empty directory by default.
  - With `-r|--recursive`, removes a non‑empty directory tree. Asks for confirmation:
    - `Proceed? [y/N]` — type `y`/`yes` to continue.
    - Use `--yes`/`-y` to skip the prompt (for scripts/automation).

- cp
  - Usage: `cp <src> <dest>`
  - Copies a file (fails if `<dest>` exists).

- mv
  - Usage: `mv <src> <dest>`
  - Moves/renames a file (fails if `<dest>` exists).

## Configuration

`config/config.json` defines the command catalog used by the help menu (command name → type, description/usage). Keep descriptions succinct—usage hints live here, while formatting/alignment happens in code (`utils/format.mjs`).

## Environment variables

- `ALLOWED_ROOT_DIR`
  - Sandbox root that bounds all operations. Defaults to the process CWD at startup.
- `LOG_TO_FILE=true`
  - Enables writing logs to `app.log` in the current directory.
- `LOG_LEVEL=debug|info|warn|error`
  - Controls console verbosity (default: `info`).

Windows PowerShell examples:

```powershell
# Run inside a specific sandbox
$env:ALLOWED_ROOT_DIR = "C:\\temp\\playground"; node app.mjs

# Enable file logging and verbose console logs
$env:LOG_TO_FILE = "true"; $env:LOG_LEVEL = "debug"; node app.mjs

# Clear variables (restore defaults)
Remove-Item Env:ALLOWED_ROOT_DIR -ErrorAction SilentlyContinue
Remove-Item Env:LOG_TO_FILE -ErrorAction SilentlyContinue
Remove-Item Env:LOG_LEVEL -ErrorAction SilentlyContinue
```

## Project structure

```
app.mjs
bin/
commands/
config/
utils/
tests/
```

- `app.mjs` — CLI entrypoint and dispatcher (readline loop)
- `commands/` — Command implementations: directory, file, meta, navigation
- `config/` — Help/config JSON
- `utils/` — Logging, formatting, fs helpers, constants, barrel exports
- `bin/` — CLI wrapper for `fm`
- `tests/` — Smoke tests and a CLI runner helper

## Testing

Run all tests:

```powershell
node --test
```

Notes:

- Smoke tests use a tiny runner that feeds commands sequentially with a small delay, so interactive prompts (like `rmdir -r`) work reliably.
- Tests set `ALLOWED_ROOT_DIR` to a temporary directory to ensure isolation.

## Linting & formatting

```powershell
npm run lint
npm run format
```

ESLint (flat config) and Prettier configs are included.

## Troubleshooting

- “Access denied: Cannot navigate outside the allowed root directory.”
  - You attempted `cd` outside `ALLOWED_ROOT_DIR`. Use an allowed path or adjust the env var.

- `rmdir <dir>` fails with “Path is a directory / EISDIR”.
  - Use `rmdir -r <dir>` to delete non‑empty directories (confirmation required unless `--yes`).

- After `cd test`, `rmdir test` says “Directory does not exist.”
  - You’re now in `…/test` and trying to remove `…/test/test`. Go `cd ..` then `rmdir test`.

## License

ISC

## Author

yrssslv
