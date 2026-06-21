#!/usr/bin/env node
/**
 * Falha se encontrar padrões de secrets em arquivos rastreados pelo Git.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

const SKIP_FILES = new Set(['scripts/check-no-secrets.mjs']);

function getTrackedFiles() {
  try {
    return execSync('git ls-files', { encoding: 'utf8', cwd: ROOT })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    console.warn('git não disponível — validação limitada.');
    return [];
  }
}

const CONFIG_LIKE = /\.(env(\..+)?|ya?ml|json|ts|js|tsx|jsx|sh)$/i;

const checks = [
  {
    name: 'senha local docker em config',
    regex: /CreativeStudio@2026/,
    filter: (file) => CONFIG_LIKE.test(file) && !file.endsWith('.example'),
  },
  {
    name: 'Asaas key live',
    regex: /\$aact_prod_[A-Za-z0-9]+/,
    filter: (file) => !file.endsWith('.mjs') && !file.endsWith('.md'),
  },
  {
    name: 'arquivo .env real versionado',
    regex: /.*/,
    filter: (file) =>
      (file === '.env' || file.endsWith('/.env') || file.endsWith('.env.production')) &&
      !file.endsWith('.example'),
  },
];

const violations = [];

for (const file of getTrackedFiles()) {
  if (SKIP_FILES.has(file)) continue;

  for (const check of checks) {
    if (check.filter && !check.filter(file)) continue;

    if (check.name === 'arquivo .env real versionado') {
      violations.push({ file, reason: check.name });
      continue;
    }

    let content;
    try {
      content = readFileSync(join(ROOT, file), 'utf8');
    } catch {
      continue;
    }

    if (check.regex.test(content)) {
      violations.push({ file, reason: check.name });
    }
  }
}

if (violations.length > 0) {
  console.error('Secrets ou padrões proibidos detectados (arquivos versionados):');
  for (const v of violations) {
    console.error(`  - ${v.file}: ${v.reason}`);
  }
  process.exit(1);
}

console.log('OK: nenhum secret proibido detectado em arquivos versionados.');
