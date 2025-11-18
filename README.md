<div align="center">

# File Manager CLI

A secure, interactive command-line file manager built with TypeScript and Node.js

[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

</div>

## Features

**Security**

- Multi-level protection of application files from deletion and modification
- Sandboxed environment confined to `ALLOWED_ROOT_DIR`
- Cross-platform file protection (Windows, Linux, macOS)

**Architecture**

- Full TypeScript support with strict type checking
- Modern ES Modules (`.mts` source, `.mjs` compiled)
- Interactive readline-based CLI
- Modular codebase with clean separation
- Centralized error handling

**Developer Experience**

- Hot reload in development mode
- Comprehensive test suite
- ESLint and Prettier integration
- Automated build pipeline

## Installation

### Pre-built Executables

Download from [Releases](https://github.com/yrssslv/file-manager/releases):

**Windows**

```cmd
file-manager-win.exe
```

**Linux/macOS**

```bash
chmod +x file-manager-linux
./file-manager-linux
```

### Build from Source

```bash
git clone https://github.com/yrssslv/file-manager.git
cd file-manager
npm install
```

**Windows**

```cmd
build.bat
```

**Linux/macOS**

```bash
chmod +x build.sh
./build.sh
```

## Usage

**From source**

```bash
npm start
```

**Development mode**

```bash
npm run dev
```

**Run tests**

```bash
npm test
npm run test:protection
```

## Commands

### Navigation

- `pwd` - Print working directory
- `cd <path>` - Change directory
- `ls [path]` - List directory contents
- `tree [path] [depth]` - Display directory tree

### File Operations

- `cat <file>` - Display file contents
- `touch <file>` - Create empty file
- `rm <file>` - Remove file
- `cp <source> <dest>` - Copy file
- `mv <source> <dest>` - Move/rename file
- `echo [text] [> file]` - Print text or write to file

### Directory Operations

- `mkdir <dir>` - Create directory
- `rmdir <dir> [-r] [-y]` - Remove directory

### System

- `clear` - Clear screen
- `help [command]` - Show help
- `exit` - Exit application

## File Protection

Application files are automatically protected from all modification commands:

**Protected Directories**

- `src/`, `dist/`, `build/`, `tests/`
- `node_modules/`, `.git/`, `.vscode/`

**Protected Files**

- Package management: `package.json`, `package-lock.json`
- TypeScript: `tsconfig.json`
- Linting: `eslint.config.mjs`, `.eslintrc.*`, `.eslintignore`
- Formatting: `.prettierrc`, `.prettierrc.json`, `.prettierignore`
- Git: `.gitignore`, `.gitattributes`
- NPM: `.npmignore`
- Scripts: `build.bat`, `build.sh`, `start.bat`, `start.sh`
- Documentation: `README.md`, `LICENSE`, `CHANGELOG.md`
- Environment: `.env`, `.env.local`, `.env.production`, `.env.development`
- All dotfiles starting with `.` in root directory

**Protected Patterns**

- Configuration files: `config.json`, `*.config.json`
- RC files: `.*rc`, `.*rc.json`
- Script files in root: `*.bat`, `*.sh`, `*.cmd`, `*.ps1`

**Protected Extensions**

- Executables: `.exe`, `.app`, `.bin`
- Source: `.ts`, `.mts`, `.mjs`

**Protection Levels**

1. **SafeFs Module** - Validates all file operations
2. **Command Layer** - Blocks protected paths before execution
3. **Recursive Validation** - Checks nested files in directory operations

**Examples**

```bash
fm> rm src/app.mts
Error: Cannot delete protected application files.

fm> rmdir -r src
Error: Cannot modify protected application files or directories.

fm> echo "test" > package.json
Error: Cannot overwrite protected application files.
```

User files outside protected paths work normally:

```bash
fm> touch myfile.txt
File created successfully.

fm> rm myfile.txt
File deleted successfully.
```

## Build

**Targets**

- `node18-win-x64` - Windows x64
- `node18-linux-x64` - Linux x64
- `node18-macos-x64` - macOS x64

**Configuration**

- Brotli compression enabled
- All dependencies bundled
- Config files included

**Scripts**

```bash
npm run build           # Compile TypeScript
npm run build:exe       # Create all executables
npm run build:exe:win   # Windows only
npm run build:exe:linux # Linux only
npm run build:exe:mac   # macOS only
npm run build:all       # Clean build all
npm run clean           # Remove dist/
```

## Development

**Setup**

```bash
npm install
npm run build
```

**Testing**

```bash
npm test                # All tests
npm run test:smoke      # Smoke tests
npm run test:edge-cases # Edge case tests
npm run test:unit       # Unit tests
npm run test:protection # Protection tests
```

**Code Quality**

```bash
npm run lint            # Check linting
npm run lint:fix        # Fix linting issues
npm run format          # Format code
npm run format:check    # Check formatting
npm run typecheck       # TypeScript validation
```

## Configuration

Set allowed root directory:

```bash
set ALLOWED_ROOT_DIR=C:\Projects\workspace
```

Edit `src/config/config.json` for command customization.

## Plugin System

**Available Plugins**

- `SafeFs` - Protected filesystem operations
- `EventBus` - Event management
- `PluginLoader` - Dynamic plugin loading
- `DependencyResolver` - Plugin dependency handling
- `PluginValidator` - Plugin validation
- `Sandbox` - Isolated plugin execution

**Create Custom Plugin**

```typescript
import type { Plugin } from './types.mjs';

export const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',

  async initialize(context) {
    // Setup code
  },

  async cleanup() {
    // Cleanup code
  },
};
```

## Architecture

```
src/
├── app.mts              # Main application
├── commands/            # Command implementations
│   ├── dir.mts         # Directory commands
│   ├── file.mts        # File commands
│   ├── meta.mts        # Meta commands
│   └── navigation.mts  # Navigation commands
├── config/             # Configuration
│   └── config.json
├── plugins/            # Plugin system
│   ├── safe-fs.mts     # Protected filesystem
│   ├── event-bus.mts   # Event handling
│   ├── loader.mts      # Plugin loading
│   └── types.mts       # Plugin types
├── types/              # Type definitions
│   └── index.mts
└── utils/              # Utilities
    ├── constants.mts   # Constants
    ├── format.mts      # Formatting
    ├── fs-utils.mts    # Filesystem utilities
    ├── logger.mts      # Logging
    └── tokenizer.mts   # Input tokenization
```

## License

ISC License - see [LICENSE](LICENSE) file

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Create Pull Request

## Requirements

**Runtime**

- Node.js >= 18

**Build**

- npm >= 9
- TypeScript 5.x

**Executables**

- No dependencies required
