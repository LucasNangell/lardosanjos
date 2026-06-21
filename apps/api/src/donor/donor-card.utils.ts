import { Donor, DonorPublicDisplayType } from '@lardosanjos/database';

export function resolvePublicDisplayName(donor: Pick<Donor, 'fullName' | 'publicName' | 'publicDisplayType' | 'wantsPublicProfile'>): string {
  if (
    donor.publicDisplayType === DonorPublicDisplayType.ANONYMOUS ||
    !donor.wantsPublicProfile
  ) {
    return donor.publicName?.trim() || 'Anjo anônimo';
  }

  if (donor.publicDisplayType === DonorPublicDisplayType.FIRST_NAME_ONLY) {
    const source = donor.publicName?.trim() || donor.fullName.trim();
    return source.split(/\s+/)[0] || 'Anjo';
  }

  return donor.publicName?.trim() || donor.fullName.trim();
}

export function cardStatusLabel(
  cardStatus: string,
  subscriptionActive: boolean,
): string {
  if (cardStatus === 'ACTIVE' && subscriptionActive) {
    return 'Membro ativo';
  }
  if (cardStatus === 'SUSPENDED') {
    return 'Suspensa';
  }
  return 'Inativa';
}
