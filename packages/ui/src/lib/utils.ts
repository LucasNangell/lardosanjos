import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const brandColors = {
  primary: '#2AA98C',
  primaryLight: '#D1EDE5',
  secondary: '#7BBAA9',
  accent: '#B9895D',
  beige: '#DEB88F',
  brown: '#6A4F36',
  text: '#263238',
  background: '#F7FBF9',
} as const;
