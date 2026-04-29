import { test, expect } from "@playwright/test";

test.describe("Monitor Detail", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication routes
    await page.route("**/api/v1/users/sync*", async (route) => {
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

    // Set up monitor list route
    await page.route("**/api/v1/monitors/", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "mon-123",
              user_id: "test-user-id",
              url: "https://google.com",
              interval_seconds: 300,
              is_active: true,
              alert_status: "UP",
              last_alerted_at: null,
              next_check_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]),
        });
      } else {
        await route.fallback();
      }
    });

    // Set up specific monitor route (added wildcard to catch trailing slashes)
    await page.route("**/api/v1/monitors/mon-123*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "mon-123",
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
    });

    // Set up ping stats route
    await page.route(
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

    // Set up ping history route
    await page.route(
      "**/api/v1/pings/monitor/mon-123?limit=10*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "ping-1",
              monitor_id: "mon-123",
              timestamp: new Date().toISOString(),
              status_code: 200,
              response_ms: 120,
              is_up: true,
              error_message: null,
            },
          ]),
        });
      },
    );

    // First navigate to a page to establish a valid origin, then set localStorage
    await page.goto("http://localhost:5173");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "fake-test-token");
    });

    // Navigate to dashboard to initialize the app state
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("navigates to monitor detail and shows stats", async ({ page }) => {
    await page.getByText("https://google.com").click();
    await expect(page).toHaveURL("/monitor/mon-123");
    await expect(
      page.getByRole("heading", { name: "https://google.com" }),
    ).toBeVisible();
    await expect(page.getByText("99%")).toBeVisible();
    await expect(page.getByText("150ms")).toBeVisible();
  });

  test("shows back button to dashboard", async ({ page }) => {
    // Ensure we are logged in on this fresh load
    await page.goto("/");
    await page.evaluate(() =>
      localStorage.setItem("access_token", "fake-test-token"),
    );

    await page.goto("/monitor/mon-123");
    await expect(
      page.getByRole("heading", { name: "https://google.com" }),
    ).toBeVisible();

    await page.locator('button:has-text("Back"):visible').click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("shows not found for invalid monitor", async ({ page }) => {
    // Override the monitor route for invalid-id
    await page.route("**/api/v1/monitors/invalid-id*", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Monitor not found" }),
      });
    });

    // Mock both ping endpoints explicitly for invalid-id
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
      "**/api/v1/pings/monitor/invalid-id?limit=10*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      },
    );

    await page.goto("/monitor/invalid-id");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Monitor not found")).toBeVisible({
      timeout: 15000,
    });
  });
});
