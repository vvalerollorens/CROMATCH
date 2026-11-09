import { test, expect, type Page } from "@playwright/test";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";

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
  const second = await browser.newContext({
    viewport: page.viewportSize() ?? undefined,
    isMobile: info.project.name === "mobile",
    hasTouch: info.project.name === "mobile",
  });
  const partnerPage = await second.newPage();
  async function call(path: string, token?: string, data?: unknown) {
    const response = await request.fetch(api + path, {
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
      .click();
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
        data: { display_name: name },
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
    expect(rows).toHaveLength(654);
    const sivera = rows.find(
      (s: { name: string; catalog_section: string }) =>
        s.catalog_section === "alaves" && s.name === "Sivera",
    );
    const tenaglia = rows.find(
      (s: { name: string; catalog_section: string }) =>
        s.catalog_section === "alaves" && s.name === "Tenaglia",
    );
    await nav(page, "Mi álbum");
    const mark = page.getByRole("button", {
      name: "Desbloquear Sivera, código 3",
      exact: true,
    });
    await mark.click();
    const unmark = page.getByRole("button", {
      name: "Desmarcar Sivera, código 3",
      exact: true,
    });
    await expect(unmark).toHaveAttribute("aria-pressed", "true");
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
    await rpc(1, "change_quantity", {
      p_sticker: tenaglia.id,
      p_delta: 2,
      p_operation: randomUUID(),
    });
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
    await nav(page, "Amigos");
    await nav(page, "Ver colección y comparar");
    await page
      .getByLabel("Unidades de Sivera para Tú das", { exact: true })
      .fill("1");
    await page
      .getByLabel("Unidades de Tenaglia para Tú recibes", { exact: true })
      .fill("1");
    await nav(page, "Proponer este cambio");
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
    if (info.status !== info.expectedStatus)
      await page
        .screenshot({
          path: `test-results/live-${info.project.name}-failure.png`,
        })
        .catch(() => {});
    // A failed UI assertion must not leave reservations or active test accounts.
    if (tradeId && accounts[0])
      await request.post(api + "/rest/v1/rpc/trade_action", {
        headers: { apikey: key!, Authorization: `Bearer ${accounts[0].token}` },
        data: { p_trade: tradeId, p_action: "cancel" },
      });
    for (const a of accounts) {
      const cleanup = await request.post(
        api + "/rest/v1/rpc/delete_my_account",
        {
          headers: { apikey: key!, Authorization: `Bearer ${a.token}` },
          data: {},
        },
      );
      expect(cleanup.ok(), "Delete temporary account").toBe(true);
    }
    await second.close();
  }
});
