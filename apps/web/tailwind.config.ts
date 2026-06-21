import type { Config } from 'tailwindcss';
import shared from '../../packages/ui/tailwind.config';

const config: Config = {
  ...shared,
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
