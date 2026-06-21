#!/usr/bin/env node
/**
 * Build Hostinger — monorepo Lar dos Anjos Pet
 * Usa npx pnpm@9 (Corepack quebra na Hostinger).
 * Defina HOSTINGER_APP=web|admin|api nas variáveis do hPanel.
 */
import { execSync } from 'node:child_process';

const app = process.argv[2] || process.env.HOSTINGER_APP || 'web';

if (!['web', 'admin', 'api'].includes(app)) {
  console.error(`HOSTINGER_APP inválido: ${app}. Use web, admin ou api.`);
  process.exit(1);
}

const env = {
  ...process.env,
  npm_config_production: 'false',
  NODE_ENV: 'development',
};

function pnpmInstall(args) {
  execSync(`npx --yes pnpm@9 ${args}`, { stdio: 'inherit', env });
}

function pnpm(args) {
  const buildEnv = {
    ...process.env,
    NODE_ENV: 'production',
  };
  execSync(`npx --yes pnpm@9 ${args}`, { stdio: 'inherit', env: buildEnv });
}

console.log(`[hostinger-build] app=${app}`);

pnpmInstall('install --frozen-lockfile --prod=false');

pnpm('--filter @lardosanjos/types build');
pnpm('--filter @lardosanjos/validators build');
pnpm('--filter @lardosanjos/ui build');
pnpm('--filter @lardosanjos/database build');

if (app === 'web') {
  pnpm('--filter web build');
} else if (app === 'admin') {
  pnpm('--filter admin build');
} else {
  pnpm('--filter api build');
}

console.log(`[hostinger-build] concluído: ${app}`);
