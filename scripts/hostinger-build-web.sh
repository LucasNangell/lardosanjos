#!/bin/sh
set -eu
# Hostinger: evita corepack (quebrado no alt-nodejs). Instala pnpm via npx.
npx pnpm@9 install --frozen-lockfile
pnpm run build:web
