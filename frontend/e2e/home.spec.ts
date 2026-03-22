import { test, expect } from '@playwright/test';

test.describe('홈', () => {
  test('메인 페이지 로드', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('LaceUp');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('헤더 네비게이션 링크', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: '경매' })).toBeVisible();
    await expect(page.getByRole('link', { name: '거래내역' })).toBeVisible();
    await expect(page.getByRole('link', { name: '랭킹' })).toBeVisible();
  });
});
