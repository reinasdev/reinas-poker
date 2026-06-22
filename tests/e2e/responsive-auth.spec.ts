import { expect, test } from "@playwright/test";

test("exibe o login por email sem overflow horizontal", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Planning Poker" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Enviar código/i })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();

  const bodyContrast = await page.evaluate(() => {
    const parse = (value: string) => value.match(/\d+/g)!.slice(0, 3).map(Number);
    const luminance = (rgb: number[]) => rgb.map(value => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const style = getComputedStyle(document.body);
    const foreground = luminance(parse(style.color));
    const background = luminance(parse(style.backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(bodyContrast).toBeGreaterThanOrEqual(4.5);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
