import { PixKeyType } from '@lardosanjos/database';
import { maskPixKey } from './pix-settings.utils';

describe('pix-settings.utils', () => {
  it('masks email pix keys', () => {
    expect(maskPixKey('contato@lardosanjos.online', PixKeyType.EMAIL)).toBe(
      'co•••••@lardosanjos.online',
    );
  });

  it('masks cpf pix keys', () => {
    expect(maskPixKey('12345678901', PixKeyType.CPF)).toBe('•••••••8901');
  });
});
