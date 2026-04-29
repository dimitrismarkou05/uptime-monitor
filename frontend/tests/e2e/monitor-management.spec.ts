import { test, expect } from "@playwright/test";

test.describe("Monitor Management", () => {
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

    let monitors = [
      {
        id: "mon-123",
        user_id: "test-user-id",
        url: "https://example.com/",
        interval_seconds: 300,
        is_active: true,
        alert_status: "UP",
        last_alerted_at: null,
        next_check_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    await page.route(
      (url) =>
        url.pathname === "/api/v1/monitors/" ||
        url.pathname === "/api/v1/monitors/mon-123",
      async (route) => {
        const method = route.request().method();
        const url = new URL(route.request().url());

        if (url.pathname === "/api/v1/monitors/" && method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(monitors),
          });
        } else if (
          url.pathname === "/api/v1/monitors/mon-123" &&
          method === "PATCH"
        ) {
          const body = await route.request().postDataJSON();
          monitors[0] = { ...monitors[0], ...body };
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(monitors[0]),
          });
        } else if (
          url.pathname === "/api/v1/monitors/mon-123" &&
          method === "DELETE"
        ) {
          monitors = [];
          await route.fulfill({ status: 204 });
        } else {
          await route.continue();
        }
      },
    );

    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "fake-test-token");
    });
    await page.goto("/dashboard");
  });

  test("deletes monitor", async ({ page }) => {
    page.on("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("No monitors yet")).toBeVisible({
      timeout: 10000,
    });
  });

  test("opens edit monitor form", async ({ page }) => {
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Monitor" }),
    ).toBeVisible();
    await expect(
      page.locator('input[value="https://example.com/"]'),
    ).toBeVisible();
  });
});
