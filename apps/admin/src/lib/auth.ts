'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, getMe } from './api';

export function useAuthGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    permissions: string[];
  } | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  return { loading, user };
}

export function hasPermission(
  user: { permissions: string[] } | null,
  permission: string,
) {
  return user?.permissions.includes(permission) ?? false;
}
