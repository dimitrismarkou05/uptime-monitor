import { test, expect } from "@playwright/test";

test.describe("Monitor Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Mock ALL backend API calls before any navigation
    await page.route(
      "http://localhost:8000/api/v1/users/sync",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "test-user-id",
            email: "test@example.com",
            created_at: new Date().toISOString(),
          }),
        });
      },
    );

    await page.route(
      "http://localhost:8000/api/v1/monitors/",
      async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([]),
          });
        } else if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              id: "new-monitor-id",
              user_id: "test-user-id",
              url: "https://google.com",
              interval_seconds: 300,
              is_active: true,
              alert_status: "UP",
              last_alerted_at: null,
              next_check_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          });
        }
      },
    );

    // Set fake token and navigate to login first (so localStorage is set for domain)
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "fake-test-token");
    });
  });

  test("shows dashboard with add monitor button", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Monitors" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "+ Add Monitor" }),
    ).toBeVisible();
  });

  test("opens monitor form when clicking add", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "+ Add Monitor" }).click();
    await expect(
      page.getByRole("heading", { name: "New Monitor" }),
    ).toBeVisible();
  });

  test("validates URL field is required", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "+ Add Monitor" }).click();
    await page.getByRole("button", { name: "Save Monitor" }).click();

    // HTML5 validation should prevent submission
    await expect(
      page.getByRole("heading", { name: "New Monitor" }),
    ).toBeVisible();
  });
});
