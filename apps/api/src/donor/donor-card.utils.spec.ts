import { DonorPublicDisplayType } from '@lardosanjos/database';
import {
  cardStatusLabel,
  resolvePublicDisplayName,
} from './donor-card.utils';

describe('donor-card.utils', () => {
  it('returns anonymous label when profile is anonymous', () => {
    expect(
      resolvePublicDisplayName({
        fullName: 'Maria Silva',
        publicName: null,
        publicDisplayType: DonorPublicDisplayType.ANONYMOUS,
        wantsPublicProfile: false,
      }),
    ).toBe('Anjo anônimo');
  });

  it('uses custom public name for anonymous donors', () => {
    expect(
      resolvePublicDisplayName({
        fullName: 'Maria Silva',
        publicName: 'Mãe dos Peludos',
        publicDisplayType: DonorPublicDisplayType.ANONYMOUS,
        wantsPublicProfile: false,
      }),
    ).toBe('Mãe dos Peludos');
  });

  it('returns first name only when configured', () => {
    expect(
      resolvePublicDisplayName({
        fullName: 'Maria Silva Santos',
        publicName: null,
        publicDisplayType: DonorPublicDisplayType.FIRST_NAME_ONLY,
        wantsPublicProfile: true,
      }),
    ).toBe('Maria');
  });

  it('labels inactive card correctly', () => {
    expect(cardStatusLabel('INACTIVE', false)).toBe('Inativa');
    expect(cardStatusLabel('ACTIVE', true)).toBe('Membro ativo');
  });
});
