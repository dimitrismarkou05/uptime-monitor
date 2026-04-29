import { test, expect } from "@playwright/test";

test.describe("Monitor Creation", () => {
  test.beforeEach(async ({ page }) => {
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

    // Use pathname matcher so query params (skip/limit) don't break the mock
    await page.route(
      (url) => url.pathname === "/api/v1/monitors/",
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
              url: "https://google.com/",
              interval_seconds: 300,
              is_active: true,
              alert_status: "UP",
              last_alerted_at: null,
              next_check_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          });
        } else {
          await route.fallback();
        }
      },
    );

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

    // Ensure form is stable before attempting click
    await expect(
      page.getByRole("heading", { name: "New Monitor" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Save Monitor" }).click();

    // HTML5 validation should prevent submission — form should still be visible
    await expect(
      page.getByRole("heading", { name: "New Monitor" }),
    ).toBeVisible();
  });
});
