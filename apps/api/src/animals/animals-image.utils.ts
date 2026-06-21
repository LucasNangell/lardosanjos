import { BadRequestException } from '@nestjs/common';

export const ANIMAL_IMAGE_MAX_BYTES = 3 * 1024 * 1024;

export const ANIMAL_IMAGE_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 3) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  if (
    buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
    buffer.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export function assertValidAnimalImage(buffer: Buffer, declaredMime: string) {
  if (buffer.length > ANIMAL_IMAGE_MAX_BYTES) {
    throw new BadRequestException('Imagem excede 3MB');
  }

  const detected = detectImageMime(buffer);
  if (!detected) {
    throw new BadRequestException('Arquivo não é uma imagem válida');
  }

  if (!ANIMAL_IMAGE_ALLOWED_MIMES.includes(detected)) {
    throw new BadRequestException('Formato de imagem não permitido');
  }

  if (declaredMime !== detected && !declaredMime.startsWith('image/')) {
    throw new BadRequestException('Tipo MIME inválido');
  }

  return detected;
}

export const ANIMAL_STATUS_OPTIONS = [
  'Disponível para adoção',
  'Em tratamento',
  'Acolhido',
  'Adotado',
] as const;
