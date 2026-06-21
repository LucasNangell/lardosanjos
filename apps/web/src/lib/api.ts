const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  gender: string;
  age: string | null;
  size: string | null;
  status: string;
  story: string;
  needs: string | null;
  coverImageUrl: string | null;
  images: { id: string; displayOrder: number; url: string | null }[];
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  progressPercent: number;
  status: string;
  coverImageUrl: string | null;
  animal?: { id: string; name: string; species: string } | null;
}

export interface MuralEntry {
  id: string;
  displayName: string;
  planName: string | null;
  impactMonths: number | null;
  message: string | null;
  badges?: Array<{ id: string; name: string; icon: string | null }>;
  createdAt: string;
}

export const SPECIES_LABELS: Record<string, string> = {
  DOG: 'Cachorro',
  CAT: 'Gato',
  OTHER: 'Outro',
};

export const SIZE_LABELS: Record<string, string> = {
  SMALL: 'Pequeno',
  MEDIUM: 'Médio',
  LARGE: 'Grande',
};

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Macho',
  FEMALE: 'Fêmea',
  UNKNOWN: 'Não informado',
};
