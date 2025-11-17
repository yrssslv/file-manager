import path from 'node:path';

export const ALLOWED_ROOT_DIR: string = process.env.ALLOWED_ROOT_DIR || process.cwd();

export const RESOLVED_ALLOWED_ROOT_DIR: string = path.resolve(ALLOWED_ROOT_DIR);
