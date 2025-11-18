import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

export const ALLOWED_ROOT_DIR: string = process.env.ALLOWED_ROOT_DIR || process.cwd();

export const RESOLVED_ALLOWED_ROOT_DIR: string = path.resolve(ALLOWED_ROOT_DIR);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const APP_ROOT_DIR: string = path.resolve(__dirname, '..', '..');
