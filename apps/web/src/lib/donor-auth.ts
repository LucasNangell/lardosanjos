const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let memoryToken: string | null = null;

export function getDonorAccessToken(): string | null {
  if (typeof window === 'undefined') return memoryToken;
  return memoryToken || localStorage.getItem('donor_access_token');
}

export function setDonorAccessToken(token: string | null) {
  memoryToken = token;
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('donor_access_token', token);
  } else {
    localStorage.removeItem('donor_access_token');
  }
}

export class DonorApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'DonorApiError';
  }
}

export async function donorApiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getDonorAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Erro ${response.status}`;
    throw new DonorApiError(message, response.status);
  }

  return data as T;
}

export async function donorLogin(email: string, password: string) {
  const result = await donorApiFetch<{
    accessToken: string;
    donor: { id: string; full_name: string; email: string };
  }>('/auth/donor/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setDonorAccessToken(result.accessToken);
  return result;
}

export async function donorLogout() {
  try {
    await donorApiFetch('/auth/logout', { method: 'POST' });
  } finally {
    setDonorAccessToken(null);
  }
}
