import { test, expect } from '@playwright/test';
import { API_URL } from '../playwright.config';

test.describe('Segurança API', () => {
  test('login inválido retorna 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'invalid@test.com', password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
  });

  test('admin protegido sem token retorna 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/admin/pix/donations`);
    expect(res.status()).toBe(401);
  });

  test('webhook Asaas sem token retorna 401', async ({ request }) => {
    const res = await request.post(`${API_URL}/integration/asaas/webhook`, {
      data: { event: 'PAYMENT_CONFIRMED', id: 'evt_test' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('Pix público rejeita valor abaixo do mínimo', async ({ request }) => {
    const res = await request.post(`${API_URL}/public/donations/pix`, {
      data: {
        donor_name: 'Teste E2E',
        donor_email: 'e2e@test.com',
        amount: 0.5,
        accepts_terms: true,
        accepts_privacy: true,
      },
    });
    expect(res.status()).toBe(400);
  });
});