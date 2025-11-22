import { test, expect, type Page } from '@playwright/test';

test.describe('Responsive navigation layout', () => {
  test('navigation buttons remain visible on narrow screens', async ({ page }: { page: Page }) => {
    const viewport = { width: 360, height: 720 };
    await page.setViewportSize(viewport);

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    const buttons = page.locator('button.nav-button');
    await expect(buttons).toHaveCount(7);

    const boundingBoxes = await buttons.evaluateAll((elements: Element[]) =>
      elements.map((el: Element) => {
        const rect = el.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        };
      })
    );

    for (const box of boundingBoxes) {
      expect.soft(box.x).toBeGreaterThanOrEqual(0);
      expect.soft(box.y).toBeGreaterThanOrEqual(0);
      expect.soft(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect.soft(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  });
});
