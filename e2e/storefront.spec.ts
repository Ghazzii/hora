import { expect, test } from "@playwright/test";

test("French storefront and catalog render", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tunisie");
  await page.getByRole("link", { name: /Découvrir la collection/i }).click();
  await expect(page).toHaveURL(/\/fr\/montres/);
  await expect(page.locator("article").first()).toBeVisible();
});

test("COD checkout persists an order that an admin can confirm", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/fr/montres");
  await page.locator("article").first().locator("a").filter({ hasText: /.+/ }).first().click();
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(page.getByRole("button", { name: "Ajoutée au panier" })).toBeVisible();

  await page.getByRole("link", { name: "Panier" }).click();
  await expect(page.getByRole("heading", { name: "Votre panier" })).toBeVisible();
  await page.getByRole("link", { name: "Passer la commande" }).click();
  await expect(page.getByRole("heading", { name: "Finaliser la commande" })).toBeVisible();

  await page.getByLabel("Prénom").fill("Test");
  await page.getByLabel("Nom", { exact: true }).fill("Hora");
  await page.getByLabel("Téléphone tunisien").fill("+216 22 555 666");
  await page.getByLabel("Gouvernorat").selectOption("Tunis");
  await page.getByLabel("Ville").fill("La Marsa");
  await page.getByLabel("Code postal").fill("2070");
  await page.getByLabel("Adresse", { exact: true }).fill("10 avenue Habib Bourguiba");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmer la commande" }).click();

  await expect(page.getByRole("heading", { name: "Commande bien reçue" })).toBeVisible();
  const orderNumber = (await page.locator("p.eyebrow").textContent())?.trim();
  if (!orderNumber) throw new Error("The success page did not expose an order number");
  expect(orderNumber).toMatch(/^HORA-/);

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@hora.tn");
  await page.getByLabel("Mot de passe").fill("HoraAdmin123!");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto(`/admin/orders?q=${encodeURIComponent(orderNumber)}`);
  await page.getByRole("link", { name: orderNumber }).click();
  await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();
  await page.locator('select[name="toStatus"]').selectOption("CONFIRMED");
  await page.getByRole("button", { name: "Update status" }).click();

  await expect(page.locator("span").filter({ hasText: /^CONFIRMED$/ }).first()).toBeVisible();
  await expect(page.locator('select[name="toStatus"]')).toContainText("PREPARING");
});

test("English catalog and admin login are responsive on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/montres");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("All watches");
  await expect(page.locator("article").first()).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "Watches" }).last()).toBeVisible();

  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hora Admin");
});

test("health endpoint verifies PostgreSQL", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    status: "ok",
    database: "connected",
  });
});
