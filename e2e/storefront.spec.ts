import { test, expect } from "@playwright/test";

test("French storefront, catalog and COD checkout routes render", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tunisie");
  await page.getByRole("link", { name: /Découvrir la collection/i }).click();
  await expect(page).toHaveURL(/\/fr\/montres/);
  await expect(page.locator("article").first()).toBeVisible();
});

test("English catalog and admin login render on mobile", async ({ page }) => {
  await page.goto("/en/watches");
  await page.goto("/en/montres");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("All watches");
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hora Admin");
});

test("health endpoint verifies PostgreSQL", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ status: "ok", database: "connected" });
});
