import { test, expect } from '@playwright/test';

test.describe('로그인', () => {
  test('로그인 페이지 로드', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#main-content').getByRole('heading', { name: /LaceUp/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Google로 시작하기/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /카카오로 시작하기/i })).toBeVisible();
  });

  test('비로그인 시 로그인 버튼 노출', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
  });
});
