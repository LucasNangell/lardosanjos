import { maskCpfCnpj } from './donor.utils';

describe('donor.utils', () => {
  it('masks cpf', () => {
    expect(maskCpfCnpj('24971563792')).toBe('***.***.***-92');
  });
});
