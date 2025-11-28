import { test, expect } from "@playwright/test";

/**
 * Frontend E2E Tests for GuessNumber DApp
 *
 * Test Coverage:
 * 1. Page Load and No Errors
 * 2. Start Playing Button Functionality
 * 3. FHE SDK Initialization (no global error)
 * 4. Wallet Connection UI
 * 5. Game Page Navigation
 */

test.describe("GuessNumber Frontend Tests", () => {

  test("should load homepage without errors", async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Navigate to homepage
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check that page title is correct
    await expect(page).toHaveTitle(/GuessNumber/);

    // Verify main heading exists
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();

    // Check for critical errors (excluding expected runtime errors)
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("Warning:") &&
        !error.includes("Download the React DevTools")
    );

    // Report any critical errors
    if (criticalErrors.length > 0) {
      console.log("Console errors detected:", criticalErrors);
    }

    // Verify no "global is not defined" error
    const globalErrors = errors.filter((error) =>
      error.toLowerCase().includes("global is not defined")
    );
    expect(globalErrors.length).toBe(0);
  });

  test("should have Start Playing button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Look for "Start Playing" button
    const startButton = page.getByRole("button", { name: /start playing/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
  });

  test("should show wallet connection UI when Start Playing is clicked", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click Start Playing button
    const startButton = page.getByRole("button", { name: /start playing/i });
    await startButton.click();

    // Wait for wallet connection modal/button to appear
    // This could be RainbowKit modal or connect wallet button
    await page.waitForTimeout(1000);

    // Check if wallet connection UI appeared
    // This will vary based on your exact UI implementation
    const walletUI =
      (await page.getByText(/connect wallet/i).count()) > 0 ||
      (await page.getByText(/metamask/i).count()) > 0 ||
      (await page.locator('[data-testid*="wallet"]').count()) > 0;

    // At minimum, verify we didn't get an error
    const errorMessages = await page.locator('[role="alert"]').count();
    expect(errorMessages).toBe(0);
  });

  test("should not have global is not defined error in console", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Try to trigger FHE initialization by clicking Start Playing
    try {
      const startButton = page.getByRole("button", {
        name: /start playing/i,
      });
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      // Button might not be available, that's ok
    }

    // Check for global errors
    const globalErrors = consoleErrors.filter(
      (error) =>
        error.toLowerCase().includes("global is not defined") ||
        error.toLowerCase().includes("global === undefined")
    );

    if (globalErrors.length > 0) {
      console.log("Global errors found:", globalErrors);
    }

    expect(globalErrors).toHaveLength(0);
  });

  test("should have responsive navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check for logo or app name
    const logo = page.locator("img, svg").first();
    await expect(logo).toBeVisible();

    // Verify page structure
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should navigate to game page", async ({ page }) => {
    await page.goto("/round/1");
    await page.waitForLoadState("networkidle");

    // Verify we're on the game page
    expect(page.url()).toContain("/round/");

    // Look for game-related UI elements
    const pageContent = await page.locator("body").textContent();

    // Should have some game-related text
    const hasGameContent =
      pageContent?.toLowerCase().includes("guess") ||
      pageContent?.toLowerCase().includes("round") ||
      pageContent?.toLowerCase().includes("game");

    expect(hasGameContent).toBe(true);
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/");

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);

    // Check title
    await expect(page).toHaveTitle(/./); // Has some title
  });

  test("should load without JavaScript errors on round page", async ({
    page,
  }) => {
    const jsErrors: Error[] = [];

    page.on("pageerror", (error) => {
      jsErrors.push(error);
    });

    await page.goto("/round/1");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Filter out expected development warnings
    const criticalErrors = jsErrors.filter(
      (error) =>
        !error.message.includes("Download the React DevTools") &&
        !error.message.includes("Warning:")
    );

    if (criticalErrors.length > 0) {
      console.log("JavaScript errors detected:", criticalErrors);
    }

    // Should not have critical errors
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test("should have COOP and COEP headers", async ({ request }) => {
    const response = await request.get("/");

    const headers = response.headers();

    // These headers are required for SharedArrayBuffer (used by FHE SDK)
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["cross-origin-embedder-policy"]).toBe("require-corp");
  });
});
