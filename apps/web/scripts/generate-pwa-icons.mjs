/**
 * Gera PNGs PWA a partir do SVG de marca (requer sharp).
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svg = readFileSync(join(root, 'public/icons/icon.svg'));
const outDir = join(root, 'public/icons');

mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(join(outDir, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}
