import { test, expect } from "@playwright/test";

// Test logowania dla konta testowego pies@pies.pl / piespies

test.describe("Logowanie", () => {
  test("powinno zalogować użytkownika i przekierować do listy projektów", async ({ page }) => {
    // 1. Otwórz stronę główną
    await page.goto("/");

    // 2. Kliknij przycisk otwierający modal logowania
    await page.getByTestId("login-register-button").click();

    // 3. Poczekaj aż modal i pola formularza będą widoczne
    await page.waitForSelector('[data-test-id="login-email"]');

    // 4. Wypełnij dane logowania
    await page.getByTestId("login-email").fill("pies@pies.pl");
    await page.getByTestId("login-password").fill("piespies");

    // 5. Wyślij formularz
    await page.getByTestId("login-submit").click();

    // 6. Oczekuj przekierowania do /app/projects
    await page.waitForURL(/\/app\/projects/);

    // 7. Walidacja: poprawny URL i nagłówek
    await expect(page).toHaveURL(/\/app\/projects/);
    await expect(page.getByRole("heading", { name: /twoje projekty/i })).toBeVisible();
  });
});
