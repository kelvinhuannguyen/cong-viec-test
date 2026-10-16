import { expect, test } from '@playwright/test';

test('thêm việc, hoàn thành, báo cáo hiện đúng tỉ lệ', async ({ page }) => {
  await page.goto('/');
  const quickAdd = page.getByLabel('Thêm nhanh công việc');
  await quickAdd.fill('Viết báo cáo quý');
  await quickAdd.press('Enter');
  await page.getByLabel('Đánh dấu "Viết báo cáo quý" đã xong').click();
  await page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Báo cáo' }).click();
  await expect(page.getByRole('group', { name: 'Tỉ lệ hoàn thành' })).toContainText('100%');
});

test('tải lại trang vẫn giữ dữ liệu và bộ lọc trên URL', async ({ page }) => {
  await page.goto('/');
  const quickAdd = page.getByLabel('Thêm nhanh công việc');
  await quickAdd.fill('Mua sữa');
  await quickAdd.press('Enter');
  await quickAdd.fill('Gọi điện cho mẹ');
  await quickAdd.press('Enter');
  await expect(page.getByRole('button', { name: 'Gọi điện cho mẹ', exact: true })).toBeVisible();

  await page.getByLabel('Tìm công việc').fill('sua');
  await expect(page).toHaveURL(/q=sua/);
  await page.reload();

  await expect(page.getByLabel('Tìm công việc')).toHaveValue('sua');
  await expect(page.getByRole('button', { name: 'Mua sữa', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gọi điện cho mẹ', exact: true })).toHaveCount(0);
});
