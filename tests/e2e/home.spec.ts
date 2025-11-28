import { test, expect } from "@playwright/test";

test.describe("GuessNumber landing", () => {
  test("shows wallet and FHE states", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("hero-title")).toHaveText(/Guess the Number/i);
    await expect(page.getByText(/Not Connected/i)).toBeVisible();
    await expect(page.getByText(/FHE Not Ready/i)).toBeVisible();
  });
});
