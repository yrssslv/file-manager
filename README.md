<div align="center">

# File Manager CLI

**A secure, interactive command-line file manager built with TypeScript and Node.js**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

_All filesystem operations are sandboxed within a designated root directory for enhanced security_

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Commands](#commands) • [Configuration](#configuration) • [Development](#development)

</div>

---

## Features

### Core Capabilities

- **Sandboxed Environment** — All operations are confined to `ALLOWED_ROOT_DIR` for maximum security
- **Full TypeScript Support** — Strict type checking with comprehensive type definitions
- **Modern ES Modules** — Native ESM with `.mts` source files compiled to `.mjs`
- **Interactive CLI** — Readline-based interface with command history and auto-completion
- **Colorized Output** — Enhanced readability with chalk-powered colored terminal output
- **Modular Architecture** — Clean separation of concerns with organized command structure

### Developer Experience

- **Hot Reload** — Development mode with automatic restart on file changes using `tsx`
- **Comprehensive Testing** — Smoke and edge-case tests using Node.js native test runner
- **Code Quality** — ESLint and Prettier configurations for consistent code style
- **Type Safety** — Strict TypeScript configuration with no implicit any
- **Build Pipeline** — Automated compilation with config file copying

---

## Installation

### Prerequisites

- **Node.js** version 18 or higher ([Download here](https://nodejs.org/))

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/yrssslv/file-manager.git
cd file-manager
npm install
npm run build
```

---

## Usage

### Quick Start

**Production Mode** — Build and run the compiled application:

```bash
npm start
```

**Windows Users** — Use the provided batch script for convenience:

```bash
start.bat
```

**Development Mode** — Run with automatic reload on file changes:

```bash
npm run dev
```

### Global Installation

For system-wide access to the `fm` command:

```bash
npm link
```

Then run from anywhere:

```bash
fm
```

---

## Commands

Once launched, you'll see the interactive prompt:

```
fm>
```

Type **`help`** to display all available commands with descriptions.

### Command Reference

<table>
  <thead>
    <tr>
      <th>Command</th>
      <th>Usage</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>help</strong></td>
      <td><code>help</code></td>
      <td>Display all available commands with descriptions</td>
    </tr>
    <tr>
      <td><strong>exit</strong></td>
      <td><code>exit</code></td>
      <td>Exit the file manager application</td>
    </tr>
    <tr>
      <td><strong>pwd</strong></td>
      <td><code>pwd</code></td>
      <td>Print the current working directory path</td>
    </tr>
    <tr>
      <td><strong>ls</strong></td>
      <td><code>ls [directory]</code></td>
      <td>List contents of current or specified directory</td>
    </tr>
    <tr>
      <td><strong>cd</strong></td>
      <td><code>cd &lt;directory&gt;</code></td>
      <td>Change to specified directory (within sandbox)</td>
    </tr>
    <tr>
      <td><strong>cat</strong></td>
      <td><code>cat &lt;file&gt;</code></td>
      <td>Display the contents of a file</td>
    </tr>
    <tr>
      <td><strong>touch</strong></td>
      <td><code>touch &lt;file&gt;</code></td>
      <td>Create a new empty file</td>
    </tr>
    <tr>
      <td><strong>rm</strong></td>
      <td><code>rm &lt;file&gt;</code></td>
      <td>Delete a file</td>
    </tr>
    <tr>
      <td><strong>mkdir</strong></td>
      <td><code>mkdir &lt;directory&gt;</code></td>
      <td>Create a new directory (recursive)</td>
    </tr>
    <tr>
      <td><strong>rmdir</strong></td>
      <td><code>rmdir &lt;directory&gt; [options]</code></td>
      <td>Remove a directory</td>
    </tr>
    <tr>
      <td><strong>cp</strong></td>
      <td><code>cp &lt;source&gt; &lt;destination&gt;</code></td>
      <td>Copy a file to destination</td>
    </tr>
    <tr>
      <td><strong>mv</strong></td>
      <td><code>mv &lt;source&gt; &lt;destination&gt;</code></td>
      <td>Move or rename a file</td>
    </tr>
  </tbody>
</table>

### rmdir Options

- **`-r, --recursive`** — Remove directory and all its contents
- **`-y, --yes`** — Skip confirmation prompt (useful for automation)

### Usage Examples

```bash
fm> ls
fm> mkdir projects
fm> cd projects
fm> touch README.md
fm> cat README.md
fm> cp file.txt backup.txt
fm> mv old-name.txt new-name.txt
fm> rmdir old-folder -r --yes
fm> cd ..
fm> pwd
```

---

## Configuration

### Environment Variables

Configure the file manager behavior using environment variables:

<table>
  <thead>
    <tr>
      <th>Variable</th>
      <th>Description</th>
      <th>Default Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>ALLOWED_ROOT_DIR</code></td>
      <td>Root directory for sandboxed operations</td>
      <td>Current working directory</td>
    </tr>
    <tr>
      <td><code>LOG_TO_FILE</code></td>
      <td>Enable logging to <code>app.log</code> file</td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>LOG_LEVEL</code></td>
      <td>Console logging verbosity level</td>
      <td><code>info</code></td>
    </tr>
  </tbody>
</table>

**Available LOG_LEVEL options:** `debug`, `info`, `warn`, `error`

### Setting Environment Variables

#### PowerShell (Windows)

```powershell
# Set sandbox directory
$env:ALLOWED_ROOT_DIR = "C:\workspace"

# Enable file logging with debug level
$env:LOG_TO_FILE = "true"
$env:LOG_LEVEL = "debug"

# Run the application
npm start
```

#### Bash (Linux/macOS)

```bash
# Set environment and run
ALLOWED_ROOT_DIR=/home/user/workspace LOG_LEVEL=debug npm start

# Or export for session
export ALLOWED_ROOT_DIR=/home/user/workspace
export LOG_TO_FILE=true
npm start
```

### Configuration File

Command metadata is defined in `config/config.json`:

```json
{
  "help": {
    "type": "meta",
    "description": "Usage: help - Show help"
  },
  "ls": {
    "type": "directory",
    "description": "Usage: ls [dir] - List directory contents"
  }
}
```

This file is used by the `help` command to generate the interactive menu with command grouping.

---

## Project Structure

```
file-manager/
├── app.mts                  # Main application entry point
├── bin/
│   └── fm.mjs               # Global CLI executable wrapper
├── commands/
│   ├── dir.mts              # Directory operations (ls, mkdir, rmdir)
│   ├── file.mts             # File operations (cat, touch, rm, cp, mv)
│   ├── meta.mts             # Meta commands (help, exit)
│   ├── navigation.mts       # Navigation commands (pwd, cd)
│   └── index.mts            # Command exports
├── config/
│   └── config.json          # Command definitions and metadata
├── utils/
│   ├── constants.mts        # Application constants
│   ├── format.mts           # Output formatting utilities
│   ├── fs-utils.mts         # Safe filesystem operations
│   ├── logger.mts           # Logging with level support
│   └── index.mts            # Utility exports
├── tests/
│   ├── smoke/               # End-to-end smoke tests
│   ├── edge-cases/          # Edge case tests
│   └── helpers/             # Test utilities and runners
├── dist/                    # Compiled JavaScript output
├── tsconfig.json            # TypeScript compiler configuration
├── eslint.config.mjs        # ESLint flat configuration
├── .prettierrc.json         # Prettier code formatter settings
└── start.bat                # Windows quick-start script
```

---

## Development

### Available Scripts

<table>
  <thead>
    <tr>
      <th>Script</th>
      <th>Command</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Build</td>
      <td><code>npm run build</code></td>
      <td>Compile TypeScript to JavaScript</td>
    </tr>
    <tr>
      <td>Start</td>
      <td><code>npm start</code></td>
      <td>Build and run the application</td>
    </tr>
    <tr>
      <td>Dev</td>
      <td><code>npm run dev</code></td>
      <td>Development mode with hot-reload</td>
    </tr>
    <tr>
      <td>Test</td>
      <td><code>npm test</code></td>
      <td>Run all test suites</td>
    </tr>
    <tr>
      <td>Smoke Tests</td>
      <td><code>npm run test:smoke</code></td>
      <td>Run smoke tests only</td>
    </tr>
    <tr>
      <td>Edge Cases</td>
      <td><code>npm run test:edge-cases</code></td>
      <td>Run edge case tests</td>
    </tr>
    <tr>
      <td>Type Check</td>
      <td><code>npm run typecheck</code></td>
      <td>Type-check without emitting files</td>
    </tr>
    <tr>
      <td>Lint</td>
      <td><code>npm run lint</code></td>
      <td>Check code with ESLint</td>
    </tr>
    <tr>
      <td>Lint Fix</td>
      <td><code>npm run lint:fix</code></td>
      <td>Auto-fix linting issues</td>
    </tr>
    <tr>
      <td>Format</td>
      <td><code>npm run format</code></td>
      <td>Format code with Prettier</td>
    </tr>
    <tr>
      <td>Format Check</td>
      <td><code>npm run format:check</code></td>
      <td>Verify code formatting</td>
    </tr>
    <tr>
      <td>Clean</td>
      <td><code>npm run clean</code></td>
      <td>Remove compiled output directory</td>
    </tr>
  </tbody>
</table>

### Testing

Run the test suite:

```bash
npm test
```

**Test Features:**

- **Isolated sandbox** environment per test
- **Sequential command execution** with realistic delays
- **Automatic cleanup** after test completion
- **Interactive prompt simulation** for realistic testing

Tests use Node.js native test runner (`node:test`) with no external dependencies.

### Code Quality

The project includes comprehensive linting and formatting:

```bash
# Check for issues
npm run lint

# Automatically fix issues
npm run lint:fix

# Format all files
npm run format

# Verify formatting
npm run format:check
```

---

## Architecture

### Sandboxing

All filesystem operations are validated against `ALLOWED_ROOT_DIR` using:

- **Path resolution** to prevent symlink escapes
- **Strict boundary checking** before any operation
- **Real path comparison** to catch manipulation attempts

### Type Safety

The project uses TypeScript with strict mode enabled:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noImplicitReturns: true`

All code is fully typed with no `any` types allowed.

### Error Handling

Comprehensive error handling with:

- **Typed error objects** for specific error cases
- **Descriptive error messages** for user guidance
- **Safe fallbacks** for unknown errors
- **Logging at appropriate levels** (debug, info, warn, error)

---

## Troubleshooting

### Common Issues

#### "Access denied: Cannot navigate outside the allowed root directory"

**Cause:** Attempting to navigate outside the configured `ALLOWED_ROOT_DIR`.

**Solution:** Set a different root directory:

```powershell
$env:ALLOWED_ROOT_DIR = "C:\your-desired-path"
npm start
```

#### rmdir fails with "Path is a directory" or "EISDIR"

**Cause:** Trying to remove a non-empty directory without the recursive flag.

**Solution:** Use the `-r` flag:

```bash
fm> rmdir folder-name -r
```

Add `-y` to skip the confirmation prompt:

```bash
fm> rmdir folder-name -r -y
```

#### After changing directory, rmdir cannot find the directory

**Cause:** After `cd test`, running `rmdir test` looks for `test/test`.

**Solution:** Navigate back first:

```bash
fm> cd ..
fm> rmdir test
```

#### Module not found errors

**Cause:** Missing build step or outdated dependencies.

**Solution:**

```bash
npm run clean
npm install
npm run build
```

---

## License

ISC

---

## Author

**[yrssslv](https://github.com/yrssslv)**

---

## Contributing

Contributions are welcome! Please ensure:

1. ✓ All tests pass: `npm test`
2. ✓ Code is properly formatted: `npm run format`
3. ✓ No linting errors: `npm run lint`
4. ✓ Types are correct: `npm run typecheck`

---

<div align="center">

**Built with TypeScript and Node.js**

</div>
