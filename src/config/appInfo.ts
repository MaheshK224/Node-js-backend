import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Name and version from package.json (shown in health check and API docs). */
const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
  name: string;
  version: string;
};

export const appInfo = Object.freeze({ name: pkg.name, version: pkg.version });
