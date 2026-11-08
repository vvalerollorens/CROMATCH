import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
let db: PGlite;
const A = "00000000-0000-4000-a000-000000000001",
  B = "00000000-0000-4000-a000-000000000002",
  C = "00000000-0000-4000-a000-000000000003";
const S1 = "10000000-0000-4000-a000-000000000001",
  S2 = "10000000-0000-4000-a000-000000000002";
let collection: string;
const uuid = () => crypto.randomUUID();
async function user(id: string | null) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? "",
  ]);
  if (id) await db.exec("set role authenticated");
  else await db.exec("set role anon");
}
async function owner() {
  await db.exec("reset role");
}
async function rpc(name: string, args: unknown[] = []) {
  const marks = args.map((_, i) => `$${i + 1}`).join(",");
  return (
    await db.query<Record<string, unknown>>(
      `select public.${name}(${marks}) as result`,
      args,
    )
  ).rows[0]?.result;
}
async function qty(id: string, s: string) {
  await owner();
  return (
    await db.query<{ quantity: number; reserved: number }>(
      "select quantity,reserved from public.user_inventory where user_id=$1 and sticker_id=$2",
      [id, s],
    )
  ).rows[0];
}
async function propose(n = 1) {
  await user(A);
  return (await rpc("propose_trade", [
    B,
    collection,
    JSON.stringify([
      { giver_id: A, sticker_id: S1, quantity: n },
      { giver_id: B, sticker_id: S2, quantity: 1 },
    ]),
    uuid(),
  ])) as string;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
  );
  await db.exec(
    readFileSync("supabase/migrations/202611080001_core.sql", "utf8"),
  );
  for (const id of [A, B, C])
    await db.query("insert into auth.users(id) values($1)", [id]);
  collection = (
    await db.query<{ id: string }>("select id from public.collections")
  ).rows[0].id;
  await db.query("update public.profiles set is_admin=true where id=$1", [A]);
  for (const [s, code] of [
    [S1, "FIXTURE-A"],
    [S2, "FIXTURE-B"],
  ])
    await db.query(
      `insert into public.stickers(id,collection_id,official_code,name,edition,source_url,corroboration_url,verified_at,verified_by) values($1,$2,$3,'Solo pruebas','TEST','https://official.example/test','https://secondary.example/test',now(),$4)`,
      [s, collection, code, A],
    );
});
afterAll(async () => {
  await db.close();
});
describe("PostgreSQL, RLS y flujo completo", () => {
  it("crea perfiles privados por defecto sin correo público", async () => {
    await user(A);
    const rows = await db.query<{ visibility: string }>(
      "select visibility from public.user_privacy_settings",
    );
    expect(rows.rows).toEqual([{ visibility: "private" }]);
    const columns = (
      await db.query<{ column_name: string }>(
        "select column_name from information_schema.columns where table_name='profiles'",
      )
    ).rows;
    expect(columns.map((x) => x.column_name)).not.toContain("email");
  });
  it("autorización: anónimo y escritura directa denegados", async () => {
    await user(null);
    await expect(rpc("change_quantity", [S1, 1, uuid()])).rejects.toThrow();
    await user(A);
    await expect(
      db.query(
        "insert into public.user_inventory(user_id,sticker_id,quantity) values($1,$2,50)",
        [A, S1],
      ),
    ).rejects.toThrow(/permission denied/);
  });
  it("cantidades exactas e idempotencia de reintentos", async () => {
    await user(A);
    const op = uuid();
    expect(await rpc("change_quantity", [S1, 1, op])).toBe(1);
    expect(await rpc("change_quantity", [S1, 1, op])).toBe(1);
    await expect(rpc("change_quantity", [S2, 1, op])).rejects.toThrow(
      /ya usado/,
    );
    expect(await rpc("change_quantity", [S1, 1, uuid()])).toBe(2);
    await user(B);
    await rpc("change_quantity", [S2, 1, uuid()]);
    await rpc("change_quantity", [S2, 1, uuid()]);
  });
  it("no expone inventarios privados ni mediante consultas directas", async () => {
    await user(B);
    expect(
      (
        await db.query("select * from public.user_inventory where user_id=$1", [
          A,
        ])
      ).rows,
    ).toHaveLength(0);
    await user(C);
    expect(
      (await db.query("select * from public.user_inventory")).rows,
    ).toHaveLength(0);
  });
  it("solo destinatario puede aceptar amistad y visibilidad requiere permiso", async () => {
    await user(A);
    await rpc("friend_action", [B, "request"]);
    await expect(rpc("friend_action", [B, "accept"])).rejects.toThrow();
    await user(B);
    await rpc("friend_action", [A, "accept"]);
    expect(
      (
        await db.query("select * from public.user_inventory where user_id=$1", [
          A,
        ])
      ).rows,
    ).toHaveLength(0);
    await user(A);
    await rpc("update_profile", ["fixture_a", "Persona A", "friends", false]);
    await user(B);
    await rpc("update_profile", ["fixture_b", "Persona B", "friends", false]);
    expect(
      (
        await db.query("select * from public.user_inventory where user_id=$1", [
          A,
        ])
      ).rows,
    ).toHaveLength(1);
  });
  it("propone, reserva, impide saldos inválidos y cancela liberando unidades", async () => {
    const id = await propose();
    await user(C);
    await expect(rpc("trade_action", [id, "accept"])).rejects.toThrow(
      /autorizado/,
    );
    expect(
      (
        await db.query("select * from public.trade_items where trade_id=$1", [
          id,
        ])
      ).rows,
    ).toHaveLength(0);
    await user(B);
    await rpc("trade_action", [id, "accept"]);
    expect(await qty(A, S1)).toEqual({ quantity: 2, reserved: 1 });
    await user(A);
    await expect(rpc("change_quantity", [S1, -1, uuid()])).rejects.toThrow(
      /reservadas/,
    );
    await rpc("trade_action", [id, "cancel"]);
    expect(await qty(A, S1)).toEqual({ quantity: 2, reserved: 0 });
  });
  it("aceptar no mueve inventarios; ambas confirmaciones completan exactamente una vez", async () => {
    const id = await propose();
    await user(B);
    await rpc("trade_action", [id, "accept"]);
    expect(await qty(B, S2)).toEqual({ quantity: 2, reserved: 1 });
    await user(A);
    expect(await rpc("trade_action", [id, "confirm"])).toBe("accepted");
    expect(await qty(A, S1)).toEqual({ quantity: 2, reserved: 1 });
    await user(B);
    expect(await rpc("trade_action", [id, "confirm"])).toBe("completed");
    expect(await rpc("trade_action", [id, "confirm"])).toBe("completed");
    expect(await qty(A, S1)).toEqual({ quantity: 1, reserved: 0 });
    expect(await qty(A, S2)).toEqual({ quantity: 1, reserved: 0 });
    expect(await qty(B, S1)).toEqual({ quantity: 1, reserved: 0 });
    expect(await qty(B, S2)).toEqual({ quantity: 1, reserved: 0 });
    await owner();
    const moves = await db.query(
      "select * from public.inventory_transactions where trade_id=$1",
      [id],
    );
    expect(moves.rows).toHaveLength(4);
  });
  it("no se alteran historiales ni se completan propuestas sin aceptar", async () => {
    await user(A);
    await expect(
      db.exec("update public.inventory_transactions set delta=999"),
    ).rejects.toThrow(/permission denied/);
    await expect(db.exec("delete from public.trade_proposals")).rejects.toThrow(
      /permission denied/,
    );
    await rpc("change_quantity", [S1, 1, uuid()]);
    await user(B);
    await rpc("change_quantity", [S2, 1, uuid()]);
    const id = await propose();
    await expect(rpc("trade_action", [id, "confirm"])).rejects.toThrow(
      /aceptarse/,
    );
    await rpc("trade_action", [id, "cancel"]);
  });
  it("revalida existencias y revierte toda reserva si otro intercambio consumió unidades", async () => {
    const t1 = await propose();
    const t2 = await propose();
    await user(B);
    await rpc("trade_action", [t1, "accept"]);
    await expect(rpc("trade_action", [t2, "accept"])).rejects.toThrow(
      /disponible/,
    );
    await owner();
    expect(
      (
        await db.query(
          "select * from public.trade_reservations where trade_id=$1",
          [t2],
        )
      ).rows,
    ).toHaveLength(0);
    await user(A);
    await rpc("trade_action", [t1, "cancel"]);
    await rpc("trade_action", [t2, "cancel"]);
  });
  it("ordena coincidencias recíprocas y respeta la colección y los permisos", async () => {
    await user(A);
    const rows = await db.query<{
      user_id: string;
      offer_count: number;
      receive_count: number;
    }>("select * from public.find_matches($1)", [collection]);
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].user_id).toBe(B);
    expect(Number(rows.rows[0].offer_count)).toBe(0);
    await user(C);
    expect(
      (await db.query("select * from public.find_matches($1)", [collection]))
        .rows,
    ).toHaveLength(0);
  });
  it("bloqueo revoca la lectura de colecciones", async () => {
    await user(B);
    await rpc("friend_action", [A, "block"]);
    await user(A);
    expect(
      (
        await db.query("select * from public.user_inventory where user_id=$1", [
          B,
        ])
      ).rows,
    ).toHaveLength(0);
    await expect(rpc("friend_action", [B, "request"])).rejects.toThrow(
      /permitida/,
    );
    await user(B);
    await rpc("friend_action", [A, "unblock"]);
  });
  it("enlaces compartidos son específicos, revocables y no públicos anónimos", async () => {
    await user(A);
    const token = await rpc("create_shared_list", [collection, "duplicates"]);
    await user(C);
    expect(await rpc("read_shared_list", [token])).toBeDefined();
    await user(A);
    await rpc("revoke_shared_list", [token]);
    await user(C);
    await expect(rpc("read_shared_list", [token])).rejects.toThrow(
      /disponible/,
    );
  });
  it("catálogo protegido, trazable y estable en correcciones", async () => {
    const row = {
      official_code: "TEST-IMPORT",
      name: "Solo fixture de prueba",
      edition: "TEST",
      variant: "base",
      source_url: "https://official.example/test",
      corroboration_url: "https://secondary.example/test",
      verified_at: "2026-01-01T00:00:00Z",
    };
    await user(B);
    await expect(
      rpc("import_catalog", [collection, JSON.stringify([row])]),
    ).rejects.toThrow(/Administración/);
    await user(A);
    expect(
      await rpc("import_catalog", [collection, JSON.stringify([row])]),
    ).toBe(1);
    const original = (
      await db.query<{ id: string }>(
        "select id from public.stickers where official_code='TEST-IMPORT'",
      )
    ).rows[0].id;
    await rpc("import_catalog", [
      collection,
      JSON.stringify([{ ...row, name: "Corrección de fixture" }]),
    ]);
    expect(
      (
        await db.query<{ id: string }>(
          "select id from public.stickers where official_code='TEST-IMPORT'",
        )
      ).rows[0].id,
    ).toBe(original);
    expect(
      (
        await db.query(
          "select * from public.sticker_catalog_revisions where sticker_id=$1",
          [original],
        )
      ).rows,
    ).toHaveLength(2);
  });
  it("elimina acceso y datos personales conservando historial seudonimizado", async () => {
    await user(C);
    await rpc("delete_my_account");
    await owner();
    expect(
      (await db.query("select * from auth.users where id=$1", [C])).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query<{ display_name: string }>(
          "select display_name from public.profiles where id=$1",
          [C],
        )
      ).rows[0].display_name,
    ).toBe("Cuenta eliminada");
    await user(C);
    await expect(rpc("change_quantity", [S1, 1, uuid()])).rejects.toThrow(
      /Sesión/,
    );
  });
});
