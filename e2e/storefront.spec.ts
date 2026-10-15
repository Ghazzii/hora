import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@hora.tn";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "HoraAdmin123!";

test("French storefront and catalog render", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Le temps vous appartient");
  await page.getByRole("link", { name: /Découvrir la collection/i }).click();
  await expect(page).toHaveURL(/\/fr\/montres/);
  await expect(page.locator("article").first()).toBeVisible();
});

test("catalog filters apply without a full page reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/fr/montres");
  await page.waitForLoadState("networkidle"); // instant filters need the page to be hydrated
  const total = await page.locator("article").count();
  await expect(page.locator('aside input[name="category"]')).toHaveCount(0);
  await expect(page.locator('aside input[name="movement"]')).toHaveCount(0);
  await page.locator("aside form").getByText("Homme", { exact: true }).click();
  await expect(page).toHaveURL(/gender=Homme/);
  await expect.poll(async () => page.locator("article").count()).toBeLessThan(total);
  await page.getByRole("button", { name: /Retirer le filtre Homme/ }).click();
  await expect(page).not.toHaveURL(/gender=/);
});

test("COD checkout persists an order that an admin can confirm", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/fr/montres");
  await page.locator("article").first().locator("h3 a").click();
  await page.getByRole("button", { name: "Ajouter au panier" }).click();

  // Adding opens the cart drawer.
  const drawer = page.getByRole("dialog", { name: "Votre panier" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Voir le panier complet" }).click();
  await expect(page.getByRole("heading", { name: "Votre panier" })).toBeVisible();
  await page.getByRole("link", { name: "Passer la commande" }).click();
  await expect(page.getByRole("heading", { name: "Finaliser la commande" })).toBeVisible();

  // Submitting empty shows localized field errors instead of sending the order.
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page.getByText("Le prénom est requis.")).toBeVisible();

  await page.getByLabel("Prénom").fill("Test");
  await page.getByLabel("Nom", { exact: true }).fill("Hora");
  await page.getByLabel("Téléphone tunisien").fill("22 555 666");
  await page.getByLabel("Gouvernorat").selectOption("Tunis");
  // Cities follow the governorate; the postal code is optional and left empty here.
  await page.getByLabel("Ville").selectOption("La Marsa");
  await page.getByLabel("Adresse", { exact: true }).fill("10 avenue Habib Bourguiba");
  await page.getByRole("checkbox", { name: /Je confirme que le paiement/ }).check();
  const orderResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/orders" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  const orderResponse = await orderResponsePromise;
  if (!orderResponse.ok()) {
    throw new Error(
      `Order API returned ${orderResponse.status()}: ${await orderResponse.text()}`,
    );
  }

  await expect(page.getByRole("heading", { name: "Commande bien reçue" })).toBeVisible();
  const orderNumber = (await page.getByTestId("order-number").textContent())?.trim();
  if (!orderNumber) throw new Error("The success page did not expose an order number");
  expect(orderNumber).toMatch(/^HORA-/);

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password", { exact: true }).fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto(`/admin/orders?q=${encodeURIComponent(orderNumber)}`);
  await page.getByRole("link", { name: orderNumber }).first().click();
  await expect(page.getByRole("heading", { name: orderNumber })).toBeVisible();
  await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /wa\.me\/21622555666/);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();

  await expect(page.getByRole("status").getByText(/is now confirmed/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Start preparing" })).toBeVisible();
});

test("English catalog and admin login are responsive on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/montres");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("All watches");
  await expect(page.locator("article").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "Watches" }).last()).toBeVisible();

  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Administration");
});

test("health endpoint verifies PostgreSQL", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({
    status: "ok",
    database: "connected",
  });
});
