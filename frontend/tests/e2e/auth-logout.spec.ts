import { test, expect } from "@playwright/test";

test("logout clears session and redirects", async ({ page }) => {
  await page.route("http://localhost:8000/api/v1/users/sync", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "test-user-id",
        email: "test@example.com",
        created_at: new Date().toISOString(),
      }),
    });
  });

  await page.route("http://localhost:8000/api/v1/monitors/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.setItem("access_token", "fake-test-token");
  });
  await page.goto("/dashboard");

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL("/login");
  const token = await page.evaluate(() => localStorage.getItem("access_token"));
  expect(token).toBeNull();
});
