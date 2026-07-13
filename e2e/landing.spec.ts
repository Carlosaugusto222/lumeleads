import { test, expect } from "@playwright/test";

test.describe("Landing", () => {
  test("home page renders and links to signup", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LumeLeads/i);
    // Ao menos um CTA de cadastro/entrar deve estar presente
    const cta = page.getByRole("link", { name: /come\u00e7ar|cadastrar|entrar|sign\s?up|login/i }).first();
    await expect(cta).toBeVisible();
  });

  test("auth page loads in signup mode via query", async ({ page }) => {
    await page.goto("/auth?mode=signup");
    await expect(page.getByRole("button", { name: /google/i }).first()).toBeVisible();
  });
});
