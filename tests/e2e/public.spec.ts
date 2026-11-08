import { test, expect } from "@playwright/test";
test("bienvenida en español y sin datos ficticios", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ese cromo",
  );
  await expect(
    page.getByText("Catálogo pendiente de verificación."),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("registro accesible y conexión pendiente explícita", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Empieza tu colección" }).click();
  await expect(
    page.getByRole("heading", { name: "Únete al equipo." }),
  ).toBeVisible();
  await page.getByLabel("Tu nombre").fill("Persona de prueba");
  await page.getByLabel("Correo electrónico").fill("fixture@example.test");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("SoloUnaPrueba123!");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("diálogo de privacidad retiene foco y cierra con Escape", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Privacidad y condiciones", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Privacidad y uso responsable" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Cerrar", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Entendido" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
test("inicio de sesión y recuperación", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page.getByRole("button", { name: "He olvidado mi contraseña" }).click();
  await expect(
    page.getByRole("heading", { name: "Recupera tu cuenta." }),
  ).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toHaveAttribute(
    "type",
    "email",
  );
  await expect(
    page.getByRole("button", { name: "Enviar instrucciones" }),
  ).toBeVisible();
});

test("visita sin correo recorre pantallas sin peticiones de datos", async ({
  page,
}) => {
  const dataRequests: string[] = [];
  page.on("request", (request) => {
    if (/supabase\.co.*\/(rest|auth)\//.test(request.url()))
      dataRequests.push(request.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Ver por dentro sin cuenta" }).click();
  await expect(
    page.getByText("Modo visita · Sin cuenta", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tu colección, en juego." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ir a mi álbum", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mi álbum", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("El catálogo está esperando su primer cromo verificado"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mis repetidos · 0", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mis repetidos", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Crear enlace compartido", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Estás en modo visita");
  expect(dataRequests).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Salir de la visita", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ese cromo",
  );
});
