import { test, expect } from '@playwright/test';

test.describe('경매 목록', () => {
  test('경매 페이지 로드', async ({ page }) => {
    await page.goto('/auction');
    await expect(page.getByRole('heading', { name: '경매 탐색' })).toBeVisible();
  });

  test('경매 페이지에서 필터/정렬 UI 노출', async ({ page }) => {
    await page.goto('/auction');
    const filterBtn = page.getByRole('button', { name: '필터' });
    const sortText = page.getByText(/인기순|최신순|종료임박/i);
    await expect(filterBtn.or(sortText).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('경매 상세', () => {
  test('존재하지 않는 경매는 404', async ({ page }) => {
    const res = await page.goto('/auction/00000000-0000-0000-0000-000000000000');
    expect(res?.status()).toBe(404);
  });

  test('경매 목록에서 첫 항목 클릭 시 상세 이동', async ({ page }) => {
    await page.goto('/auction');
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('a[href^="/auction/"]').first();
    const count = await firstCard.count();
    if (count === 0) {
      throw new Error('No auctions found — backend or test data not available');
    }
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    await expect(page).toHaveURL(`http://localhost:3000${href}`);
  });
});
