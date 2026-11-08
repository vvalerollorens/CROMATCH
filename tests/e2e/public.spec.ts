import { test, expect } from "@playwright/test";
test("bienvenida en español y sin datos ficticios", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ese cromo",
  );
  await page.locator(".welcome-catalog summary").click();
  await expect(
    page.getByText(/Catálogo pendiente de verificación\./),
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
    page.getByText(
      "Prueba visual · Sin numeración oficial. Se reinicia al salir.",
    ),
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
  await expect(
    page.getByRole("alert").filter({ hasText: "Estás en modo visita" }),
  ).toContainText("Estás en modo visita");
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

test("ruta directa de visita abre el interior sin formulario", async ({
  page,
}) => {
  await page.goto("/visita");
  await expect(
    page.getByText("Modo visita · Sin cuenta", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tu colección, en juego." }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  if (await nav.isVisible()) {
    await nav.getByRole("button", { name: "Mi álbum", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Mi álbum", exact: true }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("álbum por equipos: casilleros táctiles y estado separado por club", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/supabase\.co.*\/(rest|auth)\//.test(r.url())) requests.push(r.url());
  });
  await page.goto("/visita");
  await page
    .getByRole("button", { name: "Ir a mi álbum", exact: true })
    .click();
  const teams = page.getByRole("group", { name: "Equipos del álbum" });
  await expect(teams.getByRole("button")).toHaveCount(20);
  await teams
    .getByRole("button", { name: "Ver FC Barcelona", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "FC Barcelona", exact: true }),
  ).toBeVisible();
  const slot = page.getByRole("button", {
    name: "Casillero de prueba 1, bloqueado",
    exact: true,
  });
  await slot.click();
  await expect(
    page.getByRole("button", {
      name: "Casillero de prueba 1, desbloqueado",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("progressbar", { name: "Casilleros abiertos en la prueba" }),
  ).toHaveAttribute("value", "1");
  await page.getByRole("button", { name: "Los tengo", exact: true }).click();
  await expect(page.locator(".preview-slot")).toHaveCount(1);
  await teams
    .getByRole("button", { name: "Ver Real Madrid", exact: true })
    .click();
  await expect(page.locator(".preview-slot")).toHaveCount(12);
  await expect(
    page.getByRole("progressbar", { name: "Casilleros abiertos en la prueba" }),
  ).toHaveAttribute("value", "0");
  await teams
    .getByRole("button", { name: "Ver FC Barcelona", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Casillero de prueba 1, desbloqueado",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("album.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Casillero de prueba 1, desbloqueado",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("progressbar", { name: "Casilleros abiertos en la prueba" }),
  ).toHaveAttribute("value", "0");
  expect(requests).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mi álbum", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Casilleros abiertos en la prueba" }),
  ).toHaveAttribute("value", "0");
});
test("diseño móvil: inicio oscuro y navegación sin desbordamiento", async ({
  page,
}, testInfo) => {
  await page.goto("/visita");
  await expect(page.locator(".glow-hero")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mis amigos", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe("rgb(255, 255, 255)");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("inicio.png"),
    fullPage: true,
  });
});

test("entrada al álbum y primer casillero visibles en móvil", async ({
  page,
}, testInfo) => {
  await page.goto("/visita#album");
  await expect(
    page.getByRole("heading", { name: "Mi álbum", exact: true }),
  ).toBeVisible();
  const slot = page.getByRole("button", {
    name: "Casillero de prueba 1, bloqueado",
    exact: true,
  });
  await expect(slot).toBeVisible();
  if (testInfo.project.name === "mobile") {
    const b = await slot.boundingBox();
    const nav = await page
      .getByRole("navigation", { name: "Navegación principal" })
      .boundingBox();
    expect(b!.y + b!.height).toBeLessThan(nav!.y);
  }
  await page.screenshot({
    path: testInfo.outputPath("album-primer-pantalla.png"),
  });
});
