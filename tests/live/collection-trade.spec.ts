import {
  test,
  expect,
  request as requestFactory,
  type Page,
} from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";

test.beforeAll(async ({ request }) => {
  const expectedRevision = process.env.GITHUB_SHA;
  if (!expectedRevision) return;
  test.setTimeout(180000);
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `https://cromatch-six.vercel.app/?check-version=${Date.now()}`,
          { timeout: 10000, headers: { "Cache-Control": "no-cache" } },
        );
        if (!response.ok()) return `HTTP ${response.status()}`;
        return (
          (await response.text()).match(
            /<meta name="nexo-revision" content="([^"]+)"/,
          )?.[1] ?? "sin versión publicada"
        );
      },
      {
        timeout: 150000,
        intervals: [1000, 3000, 5000],
        message:
          "Las pruebas alojadas requieren el mismo commit publicado, no una versión anterior",
      },
    )
    .toBe(expectedRevision);
});

// No secrets or service keys: use the same public config and APIs as the app.
// Only temporary accounts; no fixture cards are inserted into the catalogue.
test("álbum, repetidos y cambio confirmado por dos cuentas reales", async ({
  page,
  browser,
  request,
}, info) => {
  const api = "https://ycvfqbbohvyabibvxnib.supabase.co";
  const site = "https://cromatch-six.vercel.app";
  const html = await (await request.get(site)).text();
  const paths = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^\"]*)"/g)].map(
    (m) => m[1],
  );
  const chunks = await Promise.all(
    paths.map(async (p) => (await request.get(new URL(p, site).href)).text()),
  );
  const keys =
    chunks
      .join("\n")
      .match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [];
  const key = keys.find((k) => {
    try {
      return (
        JSON.parse(Buffer.from(k.split(".")[1], "base64url").toString())
          .role === "anon"
      );
    } catch {
      return false;
    }
  });
  expect(Boolean(key)).toBe(true);
  const accounts: {
    name: string;
    password: string;
    token: string;
    id: string;
  }[] = [];
  let tradeId: string | undefined;
  let releaseDelayedRead = () => {};
  const second = await browser.newContext({
    viewport: page.viewportSize() ?? undefined,
    isMobile: info.project.name === "mobile",
    hasTouch: info.project.name === "mobile",
  });
  const partnerPage = await second.newPage();
  async function call(path: string, token?: string, data?: unknown) {
    const response = await request.fetch(api + path, {
      timeout: 15000,
      method: data === undefined ? "GET" : "POST",
      headers: {
        apikey: key!,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(data !== undefined ? { data } : {}),
    });
    expect(response.status(), `HTTP for ${path.split("?")[0]}`).toBeLessThan(
      300,
    );
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  const rpc = (who: number, name: string, data: unknown) =>
    call(`/rest/v1/rpc/${name}`, accounts[who].token, data);
  async function refreshVisible(p: Page = page) {
    await p.bringToFront();
    await expect
      .poll(() => p.evaluate(() => document.visibilityState))
      .toBe("visible");
    await p.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
  }
  async function login(p: Page, who: number) {
    await p.goto(site);
    await p
      .getByRole("button", { name: "Iniciar sesión", exact: true })
      .click();
    await p
      .getByLabel("Nombre de usuario", { exact: true })
      .fill(accounts[who].name);
    await p
      .getByLabel("Contraseña", { exact: true })
      .fill(accounts[who].password);
    await p.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Tu colección, en juego.", exact: true }),
    ).toBeVisible();
  }
  const nav = (p: Page, name: string) =>
    (["Inicio", "Mi álbum", "Repetidos", "Amigos", "Mi perfil"].includes(name)
      ? p.getByRole("navigation")
      : p
    )
      .getByRole("button", { name, exact: true })
      .click({ noWaitAfter: true }); // Sections use history.replaceState, not document navigation.
  async function trades(p: Page) {
    await nav(p, "Inicio");
    await nav(p, "Intercambios");
  }
  try {
    for (let i = 0; i < 2; i++) {
      const name = `qa_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
      const password = randomBytes(24).toString("base64url");
      const data = await call("/auth/v1/signup", undefined, {
        email: `${name}@accounts.nexo.invalid`,
        password,
        data: {
          display_name: name,
          nexo_test: true,
          test_run: process.env.GITHUB_RUN_ID ?? "manual",
        },
      });
      expect(Boolean(data.access_token)).toBe(true);
      accounts.push({
        name,
        password,
        token: data.access_token,
        id: data.user.id,
      });
    }
    await mkdir("test-results", { recursive: true });
    await page.goto(site);
    await expect(
      page.getByRole("button", { name: "Crear cuenta", exact: true }),
    ).toHaveClass(/glow-cta/);
    await page.screenshot({
      path: `test-results/live-${info.project.name}-welcome.png`,
    });
    await login(page, 0);
    await login(partnerPage, 1);
    const rows = await call(
      "/rest/v1/stickers?select=id,name,collection_id,catalog_section,official_code&order=catalog_order",
      accounts[0].token,
    );
    expect(rows).toHaveLength(655);
    const elche13b = rows.find(
      (s: { catalog_section: string; official_code: string }) =>
        s.catalog_section === "elche" && s.official_code === "13B",
    );
    expect(elche13b).toMatchObject({
      id: "e600bc74-6af8-5347-a43e-2816737a1090",
      name: "John Chetauya",
    });
    const sivera = rows.find(
      (s: { name: string; catalog_section: string }) =>
        s.catalog_section === "alaves" && s.name === "Sivera",
    );
    const tenaglia = rows.find(
      (s: { name: string; catalog_section: string }) =>
        s.catalog_section === "alaves" && s.name === "Tenaglia",
    );
    await nav(page, "Mi álbum");
    await nav(page, "Ver Elche CF");
    await expect(
      page.getByRole("button", {
        name: "Desbloquear John Chetauya, código 13B",
        exact: true,
      }),
    ).toBeVisible();
    await nav(page, "Ver Deportivo Alavés");
    const mark = page.getByRole("button", {
      name: "Desbloquear Sivera, código 3",
      exact: true,
    });
    await expect(mark.locator(".slot-club-badge img")).toHaveAttribute(
      "src",
      "/badges/alaves-white.svg",
    );
    await mark.scrollIntoViewIfNeeded();
    const markBox = await mark.boundingBox();
    const scrollBeforeMark = await page.evaluate(() => window.scrollY);
    let capturedRead = () => {};
    let deliveredRead = () => {};
    let delayed = false;
    const captured = new Promise<void>((resolve) => {
      capturedRead = resolve;
    });
    const delivered = new Promise<void>((resolve) => {
      deliveredRead = resolve;
    });
    const released = new Promise<void>((resolve) => {
      releaseDelayedRead = resolve;
    });
    await page.route("**/rest/v1/user_inventory?**", async (route) => {
      const url = new URL(route.request().url());
      if (
        delayed ||
        route.request().method() !== "GET" ||
        !url.searchParams.get("user_id")?.includes(accounts[0].id)
      )
        return route.continue();
      delayed = true;
      const response = await route.fetch();
      capturedRead();
      await released;
      await route.fulfill({ response });
      deliveredRead();
    });
    await refreshVisible();
    await captured;
    await mark.click();
    const unmark = page.getByRole("button", {
      name: "Desmarcar Sivera, código 3",
      exact: true,
    });
    await expect(unmark).toHaveAttribute("aria-pressed", "true");
    const savedBox = await unmark.boundingBox();
    expect(
      Math.abs(savedBox!.y - markBox!.y),
      "La casilla no salta al guardar",
    ).toBeLessThan(2);
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - scrollBeforeMark),
      "Conserva el desplazamiento al guardar",
    ).toBeLessThan(2);
    releaseDelayedRead();
    await delivered;
    await page.waitForLoadState("networkidle");
    await expect(unmark).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.unroute("**/rest/v1/user_inventory?**");
    await unmark.click();
    await expect(mark).toHaveAttribute("aria-pressed", "false");
    // First duplicate adds two copies atomically, including the album copy.
    await nav(page, "Repetidos");
    await nav(page, "Añadir repetidos");
    await page.getByLabel("Buscar para añadir", { exact: true }).fill("Sivera");
    await page
      .getByRole("button", {
        name: "Añadir un repetido de Sivera, 3",
        exact: true,
      })
      .click();
    await expect(
      page
        .getByRole("dialog")
        .getByLabel("Repetidos de Sivera, 3", { exact: true }),
    ).toHaveText("1");
    await nav(page, "Cerrar búsqueda");
    await page.reload();
    await nav(page, "Repetidos");
    await expect(
      page
        .getByLabel("Repetidos de Sivera, 3", { exact: true })
        .locator("strong"),
    ).toHaveText("1");
    const privateRows = await call(
      `/rest/v1/user_inventory?select=*&user_id=eq.${accounts[0].id}`,
      accounts[1].token,
    );
    expect(privateRows).toEqual([]);
    await page.getByLabel("Buscar cromo", { exact: true }).fill("alaves");
    await expect(
      page.getByLabel("Repetidos de Sivera, 3", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Buscar cromo", { exact: true }).fill("");
    await nav(page, "Mi álbum");
    await nav(page, "Ver lista de lo que tengo");
    const compact = page.getByRole("region", {
      name: "Lista compacta de cromos que tienes",
    });
    await expect(compact.locator("li")).toHaveCount(1);
    await expect(compact.locator("li")).toContainText("Sivera");
    await expect(compact.locator("li")).toContainText("2 copias");
    // Two refreshes may return out of order, without a local quantity write.
    let releaseOlder = () => {};
    let captureOlder = () => {};
    let deliverOlder = () => {};
    let olderHeld = false;
    const olderCaptured = new Promise<void>((resolve) => {
      captureOlder = resolve;
    });
    const olderReleased = new Promise<void>((resolve) => {
      releaseOlder = resolve;
      releaseDelayedRead = resolve;
    });
    const olderDelivered = new Promise<void>((resolve) => {
      deliverOlder = resolve;
    });
    await page.route("**/rest/v1/user_inventory?**", async (route) => {
      const url = new URL(route.request().url());
      if (
        olderHeld ||
        !url.searchParams.get("user_id")?.includes(accounts[0].id)
      )
        return route.continue();
      olderHeld = true;
      const response = await route.fetch();
      captureOlder();
      await olderReleased;
      await route.fulfill({ response });
      deliverOlder();
    });
    await refreshVisible();
    await olderCaptured;
    await rpc(0, "change_quantity", {
      p_sticker: sivera.id,
      p_delta: 1,
      p_operation: randomUUID(),
    });
    await refreshVisible();
    await expect(compact.locator("li")).toContainText("3 copias");
    releaseOlder();
    await olderDelivered;
    await page.waitForLoadState("networkidle");
    await expect(compact.locator("li")).toContainText("3 copias");
    await page.unroute("**/rest/v1/user_inventory?**");
    await rpc(0, "change_quantity", {
      p_sticker: sivera.id,
      p_delta: -1,
      p_operation: randomUUID(),
    });
    await refreshVisible();
    await expect(compact.locator("li")).toContainText("2 copias");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page
      .getByLabel("Buscar en lo que tengo", { exact: true })
      .fill("Tenaglia");
    await expect(compact.locator("li")).toHaveCount(0);
    await page
      .getByLabel("Buscar en lo que tengo", { exact: true })
      .fill("Sivera");
    await expect(compact.locator("li")).toHaveCount(1);
    await compact
      .getByRole("button", { name: "Ver todos mis cromos", exact: true })
      .click();
    await expect(
      page.getByLabel("Buscar en lo que tengo", { exact: true }),
    ).toHaveValue("");
    await page.route("**/fonts/manrope-pdf-*.ttf", (route) =>
      route.abort("failed"),
    );
    await compact
      .getByRole("button", { name: "Descargar PDF", exact: true })
      .click();
    await expect(compact.getByRole("alert")).toContainText(
      "No se ha podido crear el PDF",
    );
    await page.unroute("**/fonts/manrope-pdf-*.ttf");
    const downloaded = page.waitForEvent("download");
    await compact
      .getByRole("button", { name: "Descargar PDF", exact: true })
      .click();
    const pdf = await downloaded;
    expect(pdf.suggestedFilename()).toBe("nexo-lo-que-tengo.pdf");
    expect(await pdf.failure()).toBeNull();
    const pdfBytes = await readFile((await pdf.path())!);
    expect(pdfBytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdfBytes.toString("latin1")).toContain("/ToUnicode");
    await page.screenshot({
      path: `test-results/live-${info.project.name}-owned-list.png`,
      fullPage: true,
    });
    await nav(page, "Por equipos");
    console.info("Lista, PDF y lecturas desordenadas comprobados");
    console.info("Abriendo perfil");
    await nav(page, "Mi perfil");
    console.info("Perfil abierto");
    const saveCheck = page.getByRole("region", {
      name: "Revisión de guardado",
    });
    await expect(saveCheck).toContainText("1 cromo distinto");
    await expect(saveCheck).toContainText("no tiene marcas pendientes");
    console.info("Diagnóstico de guardado recibido");
    const privacy = page.getByLabel("Visibilidad de tu colección", {
      exact: true,
    });
    await privacy.selectOption("friends");
    console.info("Privacidad seleccionada");
    const refreshedPrivacy = page.waitForResponse(
      (r) =>
        r.url().includes("/rest/v1/user_privacy_settings?") &&
        r.request().method() === "GET",
      { timeout: 10000 },
    );
    await refreshVisible();
    await refreshedPrivacy;
    console.info("Respuesta de privacidad recibida");
    await expect(page.locator(".loading-note")).toBeHidden({ timeout: 15000 });
    await expect(privacy).toHaveValue("friends");
    await expect(
      page.getByText("Tu privacidad tiene cambios sin guardar.", {
        exact: true,
      }),
    ).toBeVisible();
    await privacy.selectOption("private");
    await nav(page, "Guardar cambios");
    await expect(
      page.getByText("Perfil guardado", { exact: true }),
    ).toBeVisible();
    console.info("Privacidad pendiente comprobada");
    await rpc(1, "change_quantity", {
      p_sticker: tenaglia.id,
      p_delta: 2,
      p_operation: randomUUID(),
    });
    // Opening a searched profile must leave search, never submit it a second time.
    await nav(page, "Inicio");
    await nav(page, "Intercambios");
    await nav(page, "Buscar compañeros");
    let searches = 0;
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (
        url.pathname === "/rest/v1/profiles" &&
        url.searchParams.get("username")?.startsWith("like.")
      )
        searches++;
    });
    await page
      .getByLabel("Nombre de usuario", { exact: true })
      .fill(accounts[1].name);
    await nav(page, "Buscar");
    await expect(
      page.getByRole("button", { name: "Ver perfil", exact: true }),
    ).toBeVisible();
    const searchesBefore = searches;
    await nav(page, "Ver perfil");
    await expect(
      page.getByRole("heading", { name: "Perfil y cambio", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".comparison h2")).toHaveText(accounts[1].name);
    await expect(
      page.getByRole("button", { name: "Buscar", exact: true }),
    ).toHaveCount(0);
    expect(searches).toBe(searchesBefore);
    await rpc(0, "friend_action", {
      p_other: accounts[1].id,
      p_action: "request",
    });
    await rpc(1, "friend_action", {
      p_other: accounts[0].id,
      p_action: "accept",
    });
    for (let i = 0; i < 2; i++)
      await rpc(i, "update_profile", {
        p_username: accounts[i].name,
        p_display_name: accounts[i].name,
        p_visibility: "friends",
        p_matches: false,
      });
    await page.reload();
    const homeMatches = page.getByRole("region", {
      name: "Cambios con tus amigos",
    });
    await expect(homeMatches).toContainText("Ya tenéis cromos para cambiar");
    await expect(homeMatches).toContainText(accounts[1].name);
    await page.screenshot({
      path: `test-results/live-${info.project.name}-home-match.png`,
    });
    await nav(page, `Preparar cambio con @${accounts[1].name}`);
    await expect(
      page.getByRole("heading", { name: "Perfil y cambio", exact: true }),
    ).toBeVisible();
    await nav(page, "Ver colección");
    await expect(
      page.getByRole("button", {
        name: `Tiene Tenaglia, código ${tenaglia.official_code}`,
        exact: true,
      }),
    ).toBeDisabled();
    await page.screenshot({
      path: `test-results/live-${info.project.name}-friend-album.png`,
      fullPage: true,
    });
    await nav(page, "Repetidos");
    await nav(page, "Cambiar con amigos");
    await page
      .getByLabel("Amigo para intercambiar", { exact: true })
      .selectOption(accounts[1].id);
    const suggestion = page.getByRole("region", {
      name: "Preparar intercambio automático",
    });
    await expect(suggestion).toContainText("Sivera");
    await expect(suggestion).toContainText("Tenaglia");
    await expect(
      page.getByRole("button", { name: "Solicitar intercambio", exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/live-${info.project.name}-automatic-trade.png`,
      fullPage: true,
    });
    // Commit the proposal, but lose the HTTP reply. The retry must confirm the
    // same immutable payload even if available copies changed in the meantime.
    const proposalPayloads: unknown[] = [];
    let loseReply = true;
    await page.route("**/rest/v1/rpc/propose_trade", async (route) => {
      const payload = route.request().postDataJSON();
      proposalPayloads.push(payload);
      if (!loseReply) return route.continue();
      loseReply = false;
      tradeId = payload.p_id;
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("failed");
    });
    await nav(page, "Solicitar intercambio");
    await expect(
      page.getByRole("button", { name: "Reintentar envío", exact: true }),
    ).toBeEnabled();
    await rpc(0, "change_quantity", {
      p_sticker: sivera.id,
      p_delta: -1,
      p_operation: randomUUID(),
    });
    const refreshedStock = page.waitForResponse(
      (r) =>
        r.url().includes("/rest/v1/user_inventory?") &&
        r.url().includes(accounts[0].id),
      { timeout: 10000 },
    );
    await refreshVisible();
    await refreshedStock;
    await expect(page.locator(".loading-note")).toBeHidden({ timeout: 15000 });
    await expect(suggestion).not.toContainText("Sivera");
    await nav(page, "Reintentar envío");
    await expect(suggestion).toContainText("Solicitud enviada");
    expect(proposalPayloads).toHaveLength(2);
    expect(proposalPayloads[1]).toEqual(proposalPayloads[0]);
    await page.unroute("**/rest/v1/rpc/propose_trade");
    await rpc(0, "change_quantity", {
      p_sticker: sivera.id,
      p_delta: 1,
      p_operation: randomUUID(),
    });
    await expect(page.locator(".trade-panel")).toHaveCount(1);
    tradeId =
      (await page.locator(".trade-panel").getAttribute("data-trade-id")) ??
      undefined;
    expect(Boolean(tradeId)).toBe(true);
    await expect(page.locator(".trade-panel h2")).toHaveText(
      `Cambio con @${accounts[1].name}`,
    );
    await partnerPage.reload();
    await trades(partnerPage);
    await nav(partnerPage, "Aceptar propuesta");
    await expect(
      partnerPage.getByRole("button", {
        name: "Ya he hecho el cambio",
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await trades(page);
    await expect(
      page.getByRole("button", { name: "Ya he hecho el cambio", exact: true }),
    ).toBeVisible();
    for (const p of [page, partnerPage]) p.on("dialog", (d) => d.accept());
    await nav(page, "Ya he hecho el cambio");
    await expect(page.locator(".trade-next")).toContainText(
      "Tu cambio está confirmado",
    );
    await expect(
      page.getByRole("button", { name: "Ya he hecho el cambio", exact: true }),
    ).toHaveCount(0);
    const before = await call(
      `/rest/v1/user_inventory?select=quantity,reserved&user_id=eq.${accounts[0].id}&sticker_id=eq.${sivera.id}`,
      accounts[0].token,
    );
    expect(before[0]).toMatchObject({ quantity: 2, reserved: 1 });
    await nav(partnerPage, "Ya he hecho el cambio");
    await expect(partnerPage.locator(".trade-next")).toContainText(
      "Los dos álbumes ya están actualizados",
    );
    await page.reload();
    await trades(page);
    await expect(page.locator(".trade-next")).toContainText(
      "Los dos álbumes ya están actualizados",
    );
    for (let i = 0; i < 2; i++) {
      const inventory = await call(
        `/rest/v1/user_inventory?select=sticker_id,quantity,reserved&user_id=eq.${accounts[i].id}`,
        accounts[i].token,
      );
      expect(inventory).toHaveLength(2);
      expect(
        inventory.every(
          (r: { quantity: number; reserved: number }) =>
            r.quantity === 1 && r.reserved === 0,
        ),
      ).toBe(true);
    }
    await expect(
      page
        .locator(".trade-panel")
        .getByText(new RegExp(`#${sivera.official_code} · Sivera`)),
    ).toBeVisible();
    await expect(
      page
        .locator(".trade-panel")
        .getByText(new RegExp(`#${tenaglia.official_code} · Tenaglia`)),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/live-${info.project.name}-completed.png`,
    });
  } finally {
    const cleanupRequest = await requestFactory.newContext({ timeout: 20000 });
    releaseDelayedRead();
    if (info.status !== info.expectedStatus)
      await page
        .screenshot({
          path: `test-results/live-${info.project.name}-failure.png`,
        })
        .catch(() => {});
    // Keep cleanup independent of fixtures already closed by a test timeout.
    if (tradeId && accounts[0])
      await cleanupRequest.post(api + "/rest/v1/rpc/trade_action", {
        headers: { apikey: key!, Authorization: `Bearer ${accounts[0].token}` },
        data: { p_trade: tradeId, p_action: "cancel" },
      });
    for (const a of accounts) {
      const cleanup = await cleanupRequest.post(
        api + "/rest/v1/rpc/delete_my_account",
        {
          headers: { apikey: key!, Authorization: `Bearer ${a.token}` },
          data: {},
        },
      );
      expect(cleanup.ok(), "Delete temporary account").toBe(true);
    }
    await cleanupRequest.dispose();
    await second.close();
  }
});
