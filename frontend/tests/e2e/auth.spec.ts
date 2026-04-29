import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("toggles between sign in and sign up", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByRole("button", { name: "Need an account? Sign up" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Create Account" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Already have an account? Sign in" })
      .click();
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/invalid|error/i)).toBeVisible();
  });
});
