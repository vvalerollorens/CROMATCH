import { afterAll, beforeAll, expect, it } from "vitest";
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
  expect(await applyMigrations(client, migrations)).toHaveLength(2);
  expect(await applyMigrations(client, migrations)).toEqual([]);
  await expect(
    applyMigrations(client, [{ ...migrations[0], checksum: "changed" }]),
  ).rejects.toThrow("MIGRATION_CHANGED");
  expect(
    (await db.query("select name from nexo_migrations.applied")).rows,
  ).toHaveLength(2);
  expect(
    (await db.query("select * from public.collections")).rows,
  ).toHaveLength(1);
});
