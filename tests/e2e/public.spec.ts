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
    page.getByText("Guardado en este dispositivo · Catálogo de consulta."),
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
    name: "Marcar Escudo, número 1",
    exact: true,
  });
  await slot.click();
  await expect(
    page.getByRole("button", {
      name: "Desmarcar Escudo, número 1",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("progressbar", { name: "Progreso del equipo" }),
  ).toHaveAttribute("value", "1");
  await page.getByRole("button", { name: "Los tengo", exact: true }).click();
  await expect(page.locator(".reference-slot")).toHaveCount(1);
  await teams
    .getByRole("button", { name: "Ver Real Madrid CF", exact: true })
    .click();
  await expect(page.locator(".reference-slot")).toHaveCount(26);
  await expect(
    page.getByRole("progressbar", { name: "Progreso del equipo" }),
  ).toHaveAttribute("value", "0");
  await teams
    .getByRole("button", { name: "Ver FC Barcelona", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Desmarcar Escudo, número 1",
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
      name: "Desmarcar Escudo, número 1",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("progressbar", { name: "Progreso del equipo" }),
  ).toHaveAttribute("value", "0");
  expect(requests).toEqual([]);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mi álbum", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "Progreso del equipo" }),
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
    name: "Marcar Escudo, número 1",
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

test("índice completo de consulta, numeración y fuentes visibles", async ({
  page,
}) => {
  await page.goto("/visita#album");
  const group = page.getByRole("group", { name: "Equipos del álbum" });
  await expect(group.getByRole("button").first()).toHaveAccessibleName(
    "Ver Deportivo Alavés",
  );
  await expect(
    page.getByRole("button", { name: "Marcar Sivera, número 3", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Especiales 9", exact: true }).click();
  const series = page.getByRole("group", {
    name: "Series especiales del álbum",
  });
  await expect(series.getByRole("button")).toHaveCount(9);
  await series
    .getByRole("button", { name: "Ver Últimos Fichajes", exact: true })
    .click();
  await expect(
    page.getByRole("progressbar", { name: "Progreso del equipo" }),
  ).toHaveAttribute("max", "66");
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Marcar Jonathan David, número UF66",
      exact: true,
    }),
  ).toBeVisible();
  await series
    .getByRole("button", { name: "Ver Top Fichajes", exact: true })
    .click();
  await expect(page.locator(".needs-review")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Ver fuentes de Rodri", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "pendiente de confirmar",
  );
  await expect(page.getByRole("dialog")).toContainText("Qué dice cada fuente");
  await page.keyboard.press("Escape");
  await series
    .getByRole("button", { name: "Ver Extra Sticker Oro", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Marcar Lamine Yamal, número S/N",
      exact: true,
    }),
  ).toBeVisible();
});

test("retratos locales de FootyLogos: desenfocados al faltar y nítidos al conseguir", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/visita#album");
  const missing = page.getByRole("button", {
    name: "Marcar Sivera, número 3",
    exact: true,
  });
  const photo = missing.locator(".slot-portrait img");
  await expect(photo).toHaveCount(1);
  await expect(photo).toHaveAttribute("src", /^\/players\/[a-f0-9]+\.webp$/);
  await expect
    .poll(() => photo.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await expect
    .poll(() => photo.evaluate((img) => getComputedStyle(img).filter))
    .toMatch(/blur\([57]px\)/);
  await page.screenshot({
    path: testInfo.outputPath("album-fotos-faltantes.png"),
  });
  await missing.click();
  const owned = page.getByRole("button", {
    name: "Desmarcar Sivera, número 3",
    exact: true,
  });
  await expect(owned).toHaveAttribute("aria-pressed", "true");
  await expect(owned.locator(".slot-portrait img")).toHaveCSS(
    "filter",
    "blur(0px) saturate(1)",
  );
  await expect(owned.locator(".slot-number")).toHaveText("3");
  await expect(owned.locator(".slot-caption")).toHaveText("Sivera");
  await page.screenshot({
    path: testInfo.outputPath("album-foto-conseguida.png"),
  });
  await page
    .getByRole("button", { name: "Ver fuentes de Sivera", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Foto: FootyLogos");
  await expect(page.getByRole("dialog")).toContainText("Antonio Sivera");
  await page.keyboard.press("Escape");
  await owned.click();
  await expect(photo).toHaveCSS("opacity", "0.55");
  await expect(
    page.getByRole("progressbar", { name: "Progreso del equipo" }),
  ).toHaveAttribute("value", "0");
});

test("añadir por nombre, repetidos y conservación en el dispositivo", async ({
  page,
}) => {
  await page.goto("/visita#album");
  await page.getByRole("button", { name: "Añadir cromos por nombre" }).click();
  await page.getByLabel("Buscar para añadir").fill("sivera");
  await page
    .getByRole("button", {
      name: "Añadir una unidad de Sivera, 3",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Cantidad de Sivera, 3", { exact: true }),
  ).toHaveText("1");
  await page
    .getByRole("button", {
      name: "Añadir una unidad de Sivera, 3",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Cantidad de Sivera, 3", { exact: true }),
  ).toHaveText("2");
  await expect(page.getByRole("dialog")).toContainText(
    "2 en total · 1 repetidos",
  );
  await page.getByRole("button", { name: "Cerrar búsqueda" }).click();
  await page
    .getByRole("button", { name: "Mis repetidos · 1", exact: true })
    .click();
  await expect(page.locator(".sticker-card")).toHaveCount(1);
  await expect(page.locator(".sticker-card")).toContainText("Sivera");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mis repetidos", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".sticker-card")).toHaveCount(1);
  await expect(page.getByLabel("2 unidades", { exact: true })).toBeVisible();
});

test("colores por equipo, campo sutil y una carta especial al conseguirla", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/visita#album");
  const before = await page
    .locator(".visual-album")
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--club-a"));
  await page
    .getByRole("button", { name: "Ver FC Barcelona", exact: true })
    .click();
  const after = await page
    .locator(".visual-album")
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--club-a"));
  expect(after).not.toBe(before);
  await expect(page.locator(".team-pitch")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Buscar en este apartado", exact: true })
    .click();
  await page.getByLabel("Buscar cromo", { exact: true }).fill("Lamine");
  const featured = page.locator(".album-slot.finish-featured");
  await expect(featured).toHaveCount(1);
  await featured.locator(".slot-main").click();
  await expect(page.getByRole("dialog")).toContainText("Destacado NEXO");
  await page.getByRole("button", { name: "Seguir coleccionando" }).click();
  await page.getByRole("button", { name: "Especiales 9", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver Extra Sticker Oro", exact: true })
    .click();
  await expect(page.locator(".finish-gold.album-slot")).toHaveCount(7);
  await page
    .getByRole("button", {
      name: "Marcar Lamine Yamal, número S/N",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Una pieza especial. Tuya.",
  );
  await expect(page.locator(".premium-card.finish-gold")).toBeVisible();
  await page.getByRole("button", { name: "Seguir coleccionando" }).click();
});

test("completar un equipo ilumina su página y no se celebra al recargar", async ({
  page,
}) => {
  await page.goto("/visita#album");
  const { default: catalogue } =
    await import("../../src/data/catalogue-2026-27.json");
  const team = catalogue.sections.find((s) => s.id === "alaves")!.entries;
  await page.evaluate(
    (ids) =>
      localStorage.setItem(
        "nexo.album.v1",
        JSON.stringify({
          version: 1,
          quantities: Object.fromEntries(ids.map((id) => [id, 1])),
        }),
      ),
    team.slice(1).map((s) => s.id),
  );
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Marcar Escudo, número 1", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "El equipo está completo.",
  );
  await expect(page.getByRole("dialog")).toContainText("23 de 23");
  await page.getByRole("button", { name: "Seguir coleccionando" }).click();
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("OCR real de tres cartas y confirmación antes de actualizar el álbum", async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(90000);
  const fixture = await context.newPage();
  await fixture.setViewportSize({ width: 1000, height: 460 });
  await fixture.setContent(
    '<main style="display:flex;gap:30px;padding:30px;background:#ddd;font-family:Arial">' +
      ["SIVERA", "TENAGLIA", "PADILLA"]
        .map(
          (name, i) =>
            `<article style="width:270px;height:320px;background:white;border:3px solid black;display:flex;flex-direction:column;justify-content:space-between;padding:20px;box-sizing:border-box"><b style="font-size:25px">${i + 3}</b><span style="font-size:31px;font-weight:700">${name}</span></article>`,
        )
        .join("") +
      "</main>",
  );
  const buffer = await fixture.locator("main").screenshot();
  await fixture.close();
  const uploads: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.postDataBuffer()?.length)
      uploads.push(r.url());
  });
  await page.goto("/visita#escaner");
  await expect(
    page.getByRole("heading", { name: "Tus cromos. En una foto." }),
  ).toBeVisible();
  await page
    .getByLabel("Elegir foto de cromos")
    .setInputFiles({ name: "tres-cartas.png", mimeType: "image/png", buffer });
  await page
    .getByRole("button", { name: "Analizar foto", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Analizar foto", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await expect(
    page.getByRole("heading", { name: "Revisa lo que hemos leído" }),
  ).toBeVisible();
  await expect(page.locator(".scan-match")).toHaveCount(3);
  const first = page.locator(".scan-match").filter({ hasText: "Sivera" });
  await expect(first).toContainText("Te falta");
  const teamFirst = await first
    .locator("select option")
    .nth(1)
    .getAttribute("value");
  await first.getByRole("combobox").selectOption(teamFirst!);
  await page.getByRole("button", { name: /Confirmar y añadir/ }).click();
  await expect(
    page.getByRole("status").filter({ hasText: /copias añadidas/ }),
  ).toBeVisible();
  expect(uploads).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("ocr-tres-cartas.png"),
    fullPage: true,
  });
  await expect(first).toContainText("Ahora tienes 1");
});
