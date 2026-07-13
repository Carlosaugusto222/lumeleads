import { test, expect } from "@playwright/test";

/**
 * Fluxo completo do wizard: Lead/Manual → Cores → Fotos → Redes → Gerar.
 *
 * Requer credenciais reais de teste:
 *   E2E_EMAIL, E2E_PASSWORD apontando para uma conta existente.
 *
 * O passo final ("Gerar") NÃO é acionado — apenas verificamos que o botão
 * está visível — para não gastar créditos de IA em cada execução.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("Wizard de sites", () => {
  test.skip(!email || !password, "Defina E2E_EMAIL e E2E_PASSWORD para rodar este teste.");

  test("percorre os 5 passos em modo manual", async ({ page }) => {
    // 1) Login por e-mail/senha
    await page.goto("/auth?mode=signin");
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/senha/i).fill(password!);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL(/\/app(\/|$)/, { timeout: 15_000 });

    // 2) Abrir wizard
    await page.goto("/app/new");
    await expect(page.getByRole("heading", { name: /novo site/i })).toBeVisible();

    // Passo 0 — Lead (usar modo manual)
    await page.getByRole("button", { name: /manual/i }).click();
    await page.getByLabel(/nome/i).first().fill("Trattoria Nonna E2E");
    await page.getByLabel(/setor|segmento/i).first().fill("gastronomia");
    await page.getByLabel(/p\u00fablico|audi\u00eancia/i).first().fill("fam\u00edlias do bairro");
    await page.getByLabel(/oferta|diferencial/i).first().fill("massas artesanais");
    await page.getByRole("button", { name: /avan\u00e7ar|pr\u00f3ximo|continuar/i }).click();

    // Passo 1 — Cores
    await expect(page.getByRole("heading", { name: /paleta/i })).toBeVisible();
    // Seleciona a primeira paleta sugerida (aguarda render)
    const palette = page.locator('[data-palette], button:has-text("Selecionar")').first();
    await palette.click({ trial: false }).catch(() => {});
    await page.getByRole("button", { name: /avan\u00e7ar|pr\u00f3ximo|continuar/i }).click();

    // Passo 2 — Fotos
    await expect(page.getByRole("heading", { name: /fotos/i })).toBeVisible();
    await page.getByRole("button", { name: /avan\u00e7ar|pr\u00f3ximo|continuar/i }).click();

    // Passo 3 — Redes
    await expect(page.getByRole("heading", { name: /redes/i })).toBeVisible();
    await page.getByRole("button", { name: /avan\u00e7ar|pr\u00f3ximo|continuar/i }).click();

    // Passo 4 — Gerar
    await expect(page.getByRole("heading", { name: /revisar|gerar/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /gerar/i })).toBeVisible();
  });
});
