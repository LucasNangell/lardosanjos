#!/usr/bin/env node
/**
 * Start Hostinger — lê HOSTINGER_APP=web|admin|api
 * Next.js: next start na pasta do app (PORT vem do hPanel).
 */
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = process.env.HOSTINGER_APP || 'web';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT || '3000';

const env = { ...process.env, PORT: port, NODE_ENV: 'production' };

console.log(`[hostinger-start] app=${app} port=${port}`);

if (app === 'web') {
  execSync('npx --yes next start -H 0.0.0.0', {
    cwd: join(root, 'apps/web'),
    stdio: 'inherit',
    env,
  });
} else if (app === 'admin') {
  execSync('npx --yes next start -H 0.0.0.0', {
    cwd: join(root, 'apps/admin'),
    stdio: 'inherit',
    env,
  });
} else if (app === 'api') {
  execSync('node dist/main.js', {
    cwd: join(root, 'apps/api'),
    stdio: 'inherit',
    env,
  });
} else {
  console.error(`HOSTINGER_APP inválido: ${app}`);
  process.exit(1);
}
