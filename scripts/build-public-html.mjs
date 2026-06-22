#!/usr/bin/env node
/**
 * Gera public_html/ pronto para upload manual na Hostinger (Gerenciador de Arquivos / FTP).
 * Build 100% local — não depende do deploy Git/Node.js Web App da Hostinger.
 */
import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = join(root, 'public_html');

/** Pastas/arquivos que ficam em public_html/ e não são apagados no rebuild do site raiz */
const WEB_ROOT_PRESERVE = new Set([
  'README_UPLOAD_HOSTINGER.md',
  'schema.sql',
  'admin',
  'api',
]);

const SITES = {
  web: {
    dir: outRoot,
    app: 'web',
    server: 'apps/web/server.js',
    envExample: 'deploy/hostinger-env-web.example',
    preserve: WEB_ROOT_PRESERVE,
    uploadHint: 'Envie o conteúdo diretamente para public_html/ de lardosanjos.online (sem subpasta).',
  },
  admin: {
    dir: join(outRoot, 'admin'),
    app: 'admin',
    server: 'apps/admin/server.js',
    envExample: 'deploy/hostinger-env-admin.example',
    uploadHint: 'Envie o conteúdo de public_html/admin/ para public_html de admin.lardosanjos.online.',
  },
  api: {
    dir: join(outRoot, 'api'),
    envExample: 'deploy/hostinger-env-api.example',
  },
};

function log(msg) {
  console.log(`[build-public-html] ${msg}`);
}

function loadEnvFile() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) {
    log('Aviso: .env não encontrado — use valores padrão de produção no build');
    return;
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function run(cmd, opts = {}) {
  execSync(cmd, {
    stdio: 'inherit',
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: opts.build ? 'production' : process.env.NODE_ENV || 'development',
      npm_config_production: 'false',
    },
  });
}

function writeStartScript(targetDir, serverRelPath) {
  const sh = `#!/bin/bash
# Lar dos Anjos Pet — iniciar app Node (SSH na Hostinger)
cd "$(dirname "$0")"
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=\${PORT:-3000}
exec node ${serverRelPath}
`;
  writeFileSync(join(targetDir, 'start.sh'), sh, { mode: 0o755 });

  const js = `#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || '3000';
const child = spawn(process.execPath, [join(dir, '${serverRelPath.replace(/\\/g, '/')}')], {
  cwd: dir,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production', HOSTNAME: '0.0.0.0', PORT: port },
});
child.on('exit', (code) => process.exit(code ?? 1));
`;
  writeFileSync(join(targetDir, 'start.mjs'), js);
}

function copyEnvExample(targetDir, relExample) {
  const src = join(root, relExample);
  if (existsSync(src)) {
    cpSync(src, join(targetDir, '.env.example'));
  }
}

function cleanDeployDir(dir, preserve = null) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  if (!preserve) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (preserve.has(entry.name)) continue;
    rmSync(join(dir, entry.name), { recursive: true, force: true });
  }
}

function packNextStandalone({ dir, app, server, envExample, preserve, uploadHint }) {
  const appDir = join(root, 'apps', app);
  const standalone = join(appDir, '.next', 'standalone');

  if (!existsSync(standalone)) {
    throw new Error(`Standalone não encontrado em apps/${app}/.next/standalone — rode next build`);
  }

  cleanDeployDir(dir, preserve ?? null);

  cpSync(standalone, dir, { recursive: true });
  cpSync(
    join(appDir, '.next', 'static'),
    join(dir, 'apps', app, '.next', 'static'),
    { recursive: true },
  );
  if (existsSync(join(appDir, 'public'))) {
    cpSync(join(appDir, 'public'), join(dir, 'apps', app, 'public'), {
      recursive: true,
    });
  }

  writeStartScript(dir, server);
  copyEnvExample(dir, envExample);

  writeFileSync(
    join(dir, 'LEIA-ME.txt'),
    [
      `Lar dos Anjos Pet — ${app === 'web' ? 'site principal' : 'admin'} (upload manual)`,
      '',
      `1. ${uploadHint}`,
      '2. Renomeie .env.example para .env e preencha as variáveis.',
      '3. Via SSH: chmod +x start.sh && ./start.sh',
      '   Ou: node start.mjs',
      '',
      'Requer Node.js 20+ em execução (SSH ou app Node manual no hPanel).',
    ].join('\n'),
  );
}

function packApi({ dir, envExample }) {
  cleanDeployDir(dir);

  run(`npx --yes pnpm@9 deploy --filter api --prod "${dir}"`, { build: true });

  const prismaEngineSrc = join(root, 'node_modules', '.prisma');
  const prismaEngineDest = join(dir, 'node_modules', '.prisma');
  if (existsSync(prismaEngineSrc)) {
    log('Copiando Prisma Client gerado...');
    rmSync(prismaEngineDest, { recursive: true, force: true });
    cpSync(prismaEngineSrc, prismaEngineDest, { recursive: true });
  }

  writeFileSync(
    join(dir, 'start.sh'),
    `#!/bin/bash
cd "$(dirname "$0")"
export NODE_ENV=production
export PORT=\${PORT:-3000}
exec node dist/main.js
`,
    { mode: 0o755 },
  );

  writeFileSync(
    join(dir, 'start.mjs'),
    `#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const dir = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || '3000';
const child = spawn(process.execPath, [join(dir, 'dist/main.js')], {
  cwd: dir,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production', PORT: port },
});
child.on('exit', (code) => process.exit(code ?? 1));
`,
  );

  copyEnvExample(dir, envExample);

  writeFileSync(
    join(dir, 'LEIA-ME.txt'),
    [
      'Lar dos Anjos Pet — API NestJS (upload manual)',
      '',
      '1. Envie o conteúdo de public_html/api/ para public_html de api.lardosanjos.online',
      '2. Renomeie .env.example para .env (DATABASE_URL, REDIS_URL, JWT, etc.)',
      '3. Importe schema.sql no MySQL antes de iniciar (cópia incluída nesta pasta).',
      '4. Via SSH: chmod +x start.sh && ./start.sh',
      '',
      'Health: https://api.lardosanjos.online/api/v1/health/ready',
    ].join('\n'),
  );
}

function main() {
  loadEnvFile();

  process.env.NEXT_PUBLIC_API_URL ??=
    'https://api.lardosanjos.online/api/v1';
  process.env.NEXT_PUBLIC_APP_URL ??= 'https://lardosanjos.online';
  process.env.NEXT_PUBLIC_ADMIN_URL ??= 'https://admin.lardosanjos.online';
  process.env.NEXT_PUBLIC_SITE_NAME ??= 'Lar dos Anjos Pet';

  log('Instalando dependências...');
  run('npx --yes pnpm@9 install --frozen-lockfile');

  log('Gerando Prisma Client...');
  run('npx --yes pnpm@9 --filter @lardosanjos/database prisma:generate');

  log('Compilando pacotes workspace...');
  run('npx --yes pnpm@9 --filter @lardosanjos/types build');
  run('npx --yes pnpm@9 --filter @lardosanjos/validators build');
  run('npx --yes pnpm@9 --filter @lardosanjos/ui build');
  run('npx --yes pnpm@9 --filter @lardosanjos/database build', { build: true });

  log('Build Web...');
  run('npx --yes pnpm@9 --filter web build', { build: true });
  log('Build Admin...');
  run('npx --yes pnpm@9 --filter admin build', { build: true });
  log('Build API...');
  run('npx --yes pnpm@9 --filter api build', { build: true });

  mkdirSync(outRoot, { recursive: true });

  for (const legacy of [
    'lardosanjos.online',
    'admin.lardosanjos.online',
    'api.lardosanjos.online',
  ]) {
    rmSync(join(outRoot, legacy), { recursive: true, force: true });
  }

  log('Empacotando site raiz (public_html/)...');
  packNextStandalone(SITES.web);

  log('Empacotando admin (public_html/admin/)...');
  packNextStandalone(SITES.admin);

  log('Empacotando api (public_html/api/)...');
  packApi(SITES.api);

  const schemaSrc = join(root, 'deploy', 'schema.sql');
  if (existsSync(schemaSrc)) {
    cpSync(schemaSrc, join(outRoot, 'schema.sql'));
    cpSync(schemaSrc, join(outRoot, 'api', 'schema.sql'));
  }

  log('Concluído!');
  log('  public_html/          → arquivos na raiz de lardosanjos.online/public_html/');
  log('  public_html/admin/    → raiz de admin.lardosanjos.online/public_html/');
  log('  public_html/api/      → raiz de api.lardosanjos.online/public_html/');
}

main();
