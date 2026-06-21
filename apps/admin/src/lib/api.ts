const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let memoryToken: string | null = null;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return memoryToken;
  return memoryToken || localStorage.getItem('access_token');
}

export function setAccessToken(token: string | null) {
  memoryToken = token;
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

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
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export async function loginAdmin(email: string, password: string) {
  const result = await apiFetch<{
    accessToken?: string;
    requiresMfa?: boolean;
    mfaSessionToken?: string;
    user: { id: string; name: string; email: string; permissions: string[] };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result.requiresMfa && result.mfaSessionToken) {
    return { requiresMfa: true as const, mfaSessionToken: result.mfaSessionToken, user: result.user };
  }

  if (result.accessToken) {
    setAccessToken(result.accessToken);
  }
  return { requiresMfa: false as const, accessToken: result.accessToken!, user: result.user };
}

export async function completeMfaLogin(mfaSessionToken: string, code: string) {
  const result = await apiFetch<{
    accessToken: string;
    user: { id: string; name: string; email: string; permissions: string[] };
  }>('/auth/mfa/complete-login', {
    method: 'POST',
    body: JSON.stringify({ mfa_session_token: mfaSessionToken, code }),
  });
  setAccessToken(result.accessToken);
  return result;
}

export async function mfaStepUp(code: string): Promise<string> {
  const result = await apiFetch<{ step_up_token: string }>('/auth/mfa/step-up', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return result.step_up_token;
}

export async function apiFetchWithMfa<T>(
  path: string,
  options: RequestInit & { mfaStepUpToken?: string } = {},
): Promise<T> {
  const headers = {
    ...(options.headers as Record<string, string>),
    ...(options.mfaStepUpToken ? { 'X-Mfa-Step-Up': options.mfaStepUpToken } : {}),
  };
  const { mfaStepUpToken: _, ...rest } = options;
  return apiFetch<T>(path, { ...rest, headers });
}

export async function logoutAdmin() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
  }
}

export async function getMe() {
  return apiFetch<{
    id: string;
    name: string;
    email: string;
    permissions: string[];
  }>('/auth/me');
}

export interface AnimalFormData {
  name: string;
  species: string;
  gender: string;
  age?: string;
  size?: string;
  status: string;
  story: string;
  needs?: string;
  internalNotes?: string;
  isPublic?: boolean;
  coverImageId?: string;
  images?: { uploadedFileId: string; displayOrder?: number }[];
}

export interface CampaignFormData {
  title: string;
  slug?: string;
  description: string;
  goalAmount: number;
  status?: string;
  animalId?: string;
  startsAt?: string;
  endsAt?: string;
  coverImageId?: string;
}

export const adminFetch = apiFetch;

export async function apiUpload<T>(
  path: string,
  file: File,
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<T>(path, {
    method: 'POST',
    body: formData,
  });
}
