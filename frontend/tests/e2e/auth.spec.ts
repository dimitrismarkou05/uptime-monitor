import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Sign in to your account/i }),
    ).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("toggles between sign in and sign up", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(
      page.getByRole("heading", { name: /Create your account/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByRole("heading", { name: /Sign in to your account/i }),
    ).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    // Intercept the Supabase auth request and force a 400 error
    await page.route("**/auth/v1/token*", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "invalid_grant",
          error_description: "Invalid login credentials",
        }),
      });
    });

    await page.goto("/login");

    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(
      page.getByText(/Authentication failed|invalid|error/i),
    ).toBeVisible();
  });
});
