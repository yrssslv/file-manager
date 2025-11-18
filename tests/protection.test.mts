import { isProtectedPath } from '../src/utils/fs-utils.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const protectedPaths: string[] = [
  'src',
  'src/app.mts',
  'tests',
  'node_modules',
  'dist',
  'build',
  '.git',
  '.vscode',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'eslint.config.mjs',
  'build.bat',
  'build.sh',
  'start.bat',
  'start.sh',
  '.gitignore',
  '.npmrc',
  '.editorconfig',
  '.prettierrc',
  'README.md',
  'src/config/config.json',
  'src/config/protection.json',
];

const unprotectedPaths: string[] = [
  'testfile.txt',
  'mydir',
  'data/myfile.json',
  'loh/allah.exe',
  'temp/app.mts',
  'myproject/package.json',
];

async function runTests(): Promise<void> {
  console.log('\nProtection Test\n');

  let passed = 0;
  let failed = 0;

  console.log('Protected paths:');
  for (const testPath of protectedPaths) {
    const fullPath = path.join(projectRoot, testPath);
    const isProtected = await isProtectedPath(fullPath);

    if (isProtected) {
      console.log(`${GREEN}✓${RESET} ${testPath}`);
      passed++;
    } else {
      console.log(`${RED}✗${RESET} ${testPath} (not protected)`);
      failed++;
    }
  }

  console.log('\nUnprotected paths:');
  for (const testPath of unprotectedPaths) {
    const fullPath = path.join(projectRoot, testPath);
    const isProtected = await isProtectedPath(fullPath);

    if (!isProtected) {
      console.log(`${GREEN}✓${RESET} ${testPath}`);
      passed++;
    } else {
      console.log(`${RED}✗${RESET} ${testPath} (should not be protected)`);
      failed++;
    }
  }

  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log(`\n${GREEN}All tests passed${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n${RED}Some tests failed${RESET}\n`);
    process.exit(1);
  }
}

runTests().catch((err: Error) => {
  console.error(`\n${RED}Test error:${RESET}`, err);
  process.exit(1);
});
