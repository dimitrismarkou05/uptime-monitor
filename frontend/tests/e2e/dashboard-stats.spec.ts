import { test, expect } from "@playwright/test";

test("shows aggregate stats on dashboard", async ({ page }) => {
  await page.route("http://localhost:8000/api/v1/users/sync", async (route) => {
    await route.fulfill({
      status: 200,
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
      body: JSON.stringify([
        {
          id: "1",
          user_id: "test-user-id",
          url: "https://up1.com",
          interval_seconds: 300,
          is_active: true,
          alert_status: "UP",
          last_alerted_at: null,
          next_check_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          user_id: "test-user-id",
          url: "https://up2.com",
          interval_seconds: 300,
          is_active: true,
          alert_status: "UP",
          last_alerted_at: null,
          next_check_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "3",
          user_id: "test-user-id",
          url: "https://down.com",
          interval_seconds: 300,
          is_active: true,
          alert_status: "DOWN",
          last_alerted_at: null,
          next_check_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]),
    });
  });

  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.setItem("access_token", "fake-test-token");
  });
  await page.goto("/dashboard");

  await expect(page.getByText("3", { exact: true }).first()).toBeVisible(); // Total
  await expect(page.getByText("2", { exact: true })).toBeVisible(); // Up
  await expect(page.getByText("1", { exact: true })).toBeVisible(); // Down
});
