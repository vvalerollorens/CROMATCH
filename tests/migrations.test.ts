import { afterAll, beforeAll, expect, it } from "vitest";
import source from "../src/data/catalogue-2026-27.json";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations, migrationsFrom } from "../scripts/migrations.mjs";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;",
  );
});
afterAll(async () => {
  await db.close();
});
it("aplica el esquema real una sola vez y rechaza cambios retroactivos sin modificar datos", async () => {
  const migrations = await migrationsFrom(
    new URL("../supabase/migrations/", import.meta.url),
  );
  const client = {
    query: (sql: string, args?: unknown[]) =>
      !args && sql.includes(";") ? db.exec(sql) : db.query(sql, args),
  };
  expect(await applyMigrations(client, migrations)).toHaveLength(9);
  expect(await applyMigrations(client, migrations)).toEqual([]);
  await expect(
    applyMigrations(client, [{ ...migrations[0], checksum: "changed" }]),
  ).rejects.toThrow("MIGRATION_CHANGED");
  expect(
    (await db.query("select name from nexo_migrations.applied")).rows,
  ).toHaveLength(9);
  expect(
    (await db.query("select * from public.collections")).rows,
  ).toHaveLength(1);
});

it("publica 655 fichas contrastadas y el 67 confirmado por el usuario, con IDs estables", async () => {
  const rows = (
    await db.query<{
      id: string;
      catalog_review: string;
      catalog_sources: unknown[];
      verification_method: string;
    }>(
      "select id,catalog_review,catalog_sources,verification_method from public.stickers",
    )
  ).rows;
  const eligible = source.sections
    .flatMap<{ id: string; review_status: string }>((s) => s.entries)
    .filter((e) =>
      ["cross_checked", "user_confirmed"].includes(e.review_status),
    );
  expect(new Set(rows.map((s) => s.id))).toEqual(
    new Set(eligible.map((s) => s.id)),
  );
  expect(rows).toHaveLength(656);
  expect(
    rows.every(
      (s) =>
        s.catalog_sources.length >= 2 &&
        ((s.catalog_review === "cross_checked" &&
          s.verification_method === "cross_checked_sources") ||
          (s.id === "d66911f6-46e3-5db3-9eec-eb89bbae427c" &&
            s.catalog_review === "user_confirmed" &&
            s.verification_method === "user_confirmation")),
    ),
  ).toBe(true);
  expect(
    (
      await db.query(
        "select id from public.stickers where official_code='1' and team_id is not null",
      )
    ).rows,
  ).toHaveLength(20);
  expect(
    (await db.query("select id from public.stickers where official_code='S/N'"))
      .rows,
  ).toHaveLength(21);
  expect(
    (await db.query("select id from public.sticker_series")).rows,
  ).toHaveLength(9);
  expect(
    (await db.query("select id from public.sticker_catalog_revisions")).rows,
  ).toHaveLength(656);
  expect(
    (
      await db.query<{ catalog_status: string }>(
        "select catalog_status from public.collections",
      )
    ).rows[0].catalog_status,
  ).toBe("partial");
  expect(
    (await db.query("select id from public.profiles where deleted_at is null"))
      .rows,
  ).toEqual([]);
});

it("incluye Elche 13B con el UUID original y conserva John/Jon en las fuentes", async () => {
  const rows = (
    await db.query<{
      id: string;
      name: string;
      catalog_order: number;
      published: boolean;
      catalog_sources: { nameInSource: string }[];
    }>(
      "select id,name,catalog_order,published,catalog_sources from public.stickers where catalog_section='elche' and official_code='13B'",
    )
  ).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    id: "e600bc74-6af8-5347-a43e-2816737a1090",
    name: "John Chetauya",
    catalog_order: 188,
    published: true,
  });
  expect(rows[0].catalog_sources.map((s) => s.nameInSource)).toEqual([
    "John Chetauya",
    "Jon Chetauya",
    "Jon Chetauya",
  ]);
});

it("activa Cucurella 67 en Top Fichajes sin crear otra identidad", async () => {
  const rows = (
    await db.query(
      "select id,official_code,name,published,catalog_review,verification_method from public.stickers where catalog_section='top-fichajes'",
    )
  ).rows;
  expect(rows).toEqual([
    expect.objectContaining({
      id: "d66911f6-46e3-5db3-9eec-eb89bbae427c",
      official_code: "67",
      name: "Cucurella",
      published: true,
      catalog_review: "user_confirmed",
      verification_method: "user_confirmation",
    }),
  ]);
});
