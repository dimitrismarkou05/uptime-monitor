import { test, expect } from "@playwright/test";

test.describe("Monitor Detail", () => {
  test.beforeEach(async ({ context, page }) => {
    // IMPORTANT: Register catch-all FIRST so it has LOWEST precedence.
    // Playwright checks handlers in REVERSE order (last added = first checked).
    await context.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      console.log(
        `[TEST DEBUG] Unhandled API request: ${route.request().method()} ${url}`,
      );
      await route.abort("failed");
    });

    // Mock user sync endpoint (handles all methods: POST, GET, etc.)
    await context.route("**/api/v1/users/sync*", async (route) => {
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

    // Mock monitors list endpoint
    await context.route("**/api/v1/monitors/*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "mon-123",
                user_id: "test-user-id",
                url: "https://google.com/",
                interval_seconds: 300,
                is_active: true,
                alert_status: "UP",
                last_alerted_at: null,
                next_check_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
            total: 1,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock single monitor endpoint (GET only)
    await context.route("**/api/v1/monitors/mon-123", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "mon-123",
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
        await route.continue();
      }
    });

    // Mock pings stats endpoint
    await context.route(
      "**/api/v1/pings/monitor/mon-123/stats*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            total_checks: 100,
            uptime_count: 99,
            uptime_percent: 99.0,
            avg_response_ms: 150,
            last_24h: { checks: 24, uptime_percent: 100 },
          }),
        });
      },
    );

    // FIX: Add default mock for pings list endpoint.
    // This handles the limit=50 request that the monitor detail page makes.
    // Tests that need specific data (like pagination tests) can override this.
    await context.route(
      "**/api/v1/pings/monitor/mon-123?skip=0&limit=*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "ping-1",
                monitor_id: "mon-123",
                timestamp: new Date().toISOString(),
                status_code: 200,
                response_ms: 120,
                is_up: true,
                error_message: null,
              },
            ],
            total: 1,
          }),
        });
      },
    );

    // Set up auth token
    await page.goto("http://localhost:5173");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "fake-test-token");
    });

    // Navigate to dashboard (triggers API calls that should be mocked)
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("navigates to monitor detail and shows stats", async ({ page }) => {
    // This test uses the default pings mock from beforeEach
    // No need to add a separate mock

    await page.getByRole("button", { name: /google\.com/ }).click();
    await expect(page).toHaveURL("/monitor/mon-123");
    await expect(
      page.getByRole("heading", { name: /google\.com/ }),
    ).toBeVisible();
    await expect(page.getByText("99%")).toBeVisible();
    await expect(page.getByText("150ms")).toBeVisible();
  });

  test("shows back button to dashboard", async ({ page }) => {
    // This test uses the default pings mock from beforeEach
    // No need to add a separate mock

    await page.goto("/monitor/mon-123");
    await expect(
      page.getByRole("heading", { name: /google\.com/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: /back/i }).click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("shows not found for invalid monitor", async ({ page }) => {
    await page.route("**/api/v1/monitors/invalid-id*", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Monitor not found" }),
      });
    });

    await page.route(
      "**/api/v1/pings/monitor/invalid-id/stats*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      },
    );

    await page.route(
      "**/api/v1/pings/monitor/invalid-id?skip=0&limit=*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [], total: 0 }),
        });
      },
    );

    await page.goto("/monitor/invalid-id");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Monitor not found")).toBeVisible({
      timeout: 15000,
    });
  });

  test("shows pagination controls on monitor detail", async ({ page }) => {
    // Override the default pings mock with 25 total pings to trigger pagination
    await page.route(
      "**/api/v1/pings/monitor/mon-123?skip=0&limit=10*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: Array.from({ length: 10 }).map((_, i) => ({
              id: `ping-${i}`,
              monitor_id: "mon-123",
              timestamp: new Date().toISOString(),
              status_code: 200,
              response_ms: 120,
              is_up: true,
              error_message: null,
            })),
            total: 25,
          }),
        });
      },
    );

    await page.goto("/monitor/mon-123");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/25 total checks/i)).toBeVisible();
    await expect(page.getByText(/page 1 of 3/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /previous/i }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  test("navigates to next page of pings", async ({ page }) => {
    await page.route(
      "**/api/v1/pings/monitor/mon-123?skip=0&limit=10*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: Array.from({ length: 10 }).map((_, i) => ({
              id: `ping-${i}`,
              monitor_id: "mon-123",
              timestamp: new Date().toISOString(),
              status_code: 200,
              response_ms: 120,
              is_up: true,
              error_message: null,
            })),
            total: 25,
          }),
        });
      },
    );

    await page.route(
      "**/api/v1/pings/monitor/mon-123?skip=10&limit=10*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: Array.from({ length: 10 }).map((_, i) => ({
              id: `ping-${i + 10}`,
              monitor_id: "mon-123",
              timestamp: new Date().toISOString(),
              status_code: 200,
              response_ms: 120,
              is_up: true,
              error_message: null,
            })),
            total: 25,
          }),
        });
      },
    );

    await page.goto("/monitor/mon-123");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByText(/page 2 of 3/i)).toBeVisible();
  });
});
