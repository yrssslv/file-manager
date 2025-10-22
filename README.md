# File Manager (Node.js CLI)

## Overview

This is a command-line file manager application built with Node.js (ES6 modules). It provides a convenient interface for navigating, managing, and inspecting files and directories directly from the terminal.

## Features

- List files and directories
- Navigate the filesystem (cd, pwd)
- Create, read, and delete files and folders
- View file contents
- Display help and configuration info
- Safe operations within a restricted root directory
- Colorful, user-friendly output

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher

### Installation

1. Clone or download this repository.
2. Install dependencies (if any):
   ```sh
   npm install
   ```
3. Start the file manager:
   ```sh
   node app.mjs
   ```

## Usage

Once started, you will see a prompt:

```
fm>
```

Type commands to interact with the file system. Type `help` to see available commands.

### Example Commands

| Command        | Description             |
| -------------- | ----------------------- |
| `help`         | Show help/config info   |
| `exit`         | Exit the application    |
| `pwd`          | Show current directory  |
| `ls [dir]`     | List files in directory |
| `cd <dir>`     | Change directory        |
| `cat <file>`   | Show file contents      |
| `touch <file>` | Create a new file       |
| `rm <file>`    | Delete a file           |
| `mkdir <dir>`  | Create a new directory  |
| `rmdir <dir>`  | Delete a directory      |

## Configuration

The `config/config.json` file defines available commands and their descriptions. You can customize or extend commands as needed.

## Project Structure

- `app.mjs` — Main entry point
- `commands/` — Command implementations (dir, file, meta, navigation)
- `config/` — Configuration files
- `utils/` — Utility modules (formatting, file system, logging)

## Author

Chereshnya

## License

ISC
