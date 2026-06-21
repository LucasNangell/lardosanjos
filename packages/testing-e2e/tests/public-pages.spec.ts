import { test, expect } from '@playwright/test';

test.describe('Páginas institucionais', () => {
  test('home carrega com CTA de doação', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /doar/i }).first()).toBeVisible();
  });

  test('FAQ e sobre existem', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.getByRole('heading', { name: /perguntas frequentes/i })).toBeVisible();

    await page.goto('/sobre');
    await expect(page.getByRole('heading', { name: /sobre/i })).toBeVisible();
  });

  test('404 customizado', async ({ page }) => {
    await page.goto('/pagina-inexistente-xyz');
    await expect(page.getByText(/não existe|404/i)).toBeVisible();
  });
});

test.describe('Transparência pública', () => {
  test('portal de transparência renderiza', async ({ page }) => {
    await page.goto('/transparencia');
    await expect(page.getByRole('heading', { name: /transparência/i })).toBeVisible();
  });
});

test.describe('Mural — privacidade', () => {
  test('mural não exibe valores monetários', async ({ page }) => {
    await page.goto('/mural');
    const body = await page.locator('main').innerText();
    expect(body).not.toMatch(/R\$\s*\d+[,.]\d{2}/);
  });
});

test.describe('PWA cache policy', () => {
  test('service worker bypassa rotas privadas', async ({ page }) => {
    const res = await page.goto('/sw.js');
    const text = await res!.text();
    expect(text).toMatch(/PRIVATE_PREFIXES|shouldBypassCache/);
    expect(text).toContain('/dashboard');
  });
});
