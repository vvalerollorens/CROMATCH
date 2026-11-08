import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";

export async function migrationsFrom(directory) {
  return Promise.all(
    (await readdir(directory))
      .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
      .sort()
      .map(async (name) => {
        const sql = await readFile(new URL(name, directory), "utf8");
        return {
          name,
          sql,
          checksum: createHash("sha256").update(sql).digest("hex"),
        };
      }),
  );
}
export async function applyMigrations(client, migrations) {
  await client.query("begin");
  try {
    await client.query("select pg_advisory_xact_lock(830251196)");
    await client.query("create schema if not exists nexo_migrations");
    await client.query(
      "revoke all on schema nexo_migrations from public, anon, authenticated",
    );
    await client.query(
      "create table if not exists nexo_migrations.applied (name text primary key, checksum text not null, applied_at timestamptz not null default now())",
    );
    const applied = new Map(
      (
        await client.query("select name,checksum from nexo_migrations.applied")
      ).rows.map((row) => [row.name, row.checksum]),
    );
    if (
      !applied.size &&
      (await client.query("select to_regclass('public.profiles') as existing"))
        .rows[0].existing
    )
      throw new Error("BASELINE_REQUIRED");
    const added = [];
    for (const migration of migrations) {
      if (applied.has(migration.name)) {
        if (applied.get(migration.name) !== migration.checksum)
          throw new Error("MIGRATION_CHANGED");
        continue;
      }
      await client.query(migration.sql);
      await client.query(
        "insert into nexo_migrations.applied(name,checksum) values($1,$2)",
        [migration.name, migration.checksum],
      );
      added.push(migration.name);
    }
    await client.query("commit");
    return added;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
