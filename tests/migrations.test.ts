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
  expect(await applyMigrations(client, migrations)).toHaveLength(6);
  expect(await applyMigrations(client, migrations)).toEqual([]);
  await expect(
    applyMigrations(client, [{ ...migrations[0], checksum: "changed" }]),
  ).rejects.toThrow("MIGRATION_CHANGED");
  expect(
    (await db.query("select name from nexo_migrations.applied")).rows,
  ).toHaveLength(6);
  expect(
    (await db.query("select * from public.collections")).rows,
  ).toHaveLength(1);
});

it("publica únicamente las 654 fichas contrastadas, con fuentes, IDs estables y números por equipo", async () => {
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
    .filter((e) => e.review_status === "cross_checked");
  expect(new Set(rows.map((s) => s.id))).toEqual(
    new Set(eligible.map((s) => s.id)),
  );
  expect(rows).toHaveLength(654);
  expect(
    rows.every(
      (s) =>
        s.catalog_review === "cross_checked" &&
        s.catalog_sources.length >= 2 &&
        s.verification_method === "cross_checked_sources",
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
  ).toHaveLength(654);
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
