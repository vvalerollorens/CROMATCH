import pg from "pg";
import { applyMigrations, migrationsFrom } from "./migrations.mjs";
import { postgresTLS } from "./postgres-tls.mjs";

if (process.env.NEXO_APPLY_MIGRATIONS !== "true") {
  console.log(
    "Migraciones alojadas desactivadas (requieren activación explícita).",
  );
} else {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("Falta POSTGRES_URL para aplicar las migraciones.");
    process.exit(1);
  }
  const client = new pg.Client({
    ...postgresTLS(connectionString),
    connectionTimeoutMillis: 20000,
    statement_timeout: 60000,
  });
  try {
    await client.connect();
    const added = await applyMigrations(
      client,
      await migrationsFrom(new URL("../supabase/migrations/", import.meta.url)),
    );
    console.log(
      `Migraciones de NEXO aplicadas: ${added.length}. Esquema actualizado.`,
    );
    const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (authUrl && anonKey) {
      const response = await fetch(new URL("/auth/v1/settings", authUrl), {
        headers: { apikey: anonKey },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("AUTH_SETTINGS_UNAVAILABLE");
      const settings = await response.json();
      console.log(
        `Auth de NEXO: contraseña=${Boolean(settings.external?.email)}; acceso sin confirmación=${settings.mailer_autoconfirm === true}.`,
      );
    }
  } catch (error) {
    // Never print driver messages/causes: they can contain connection details.
    console.error(
      ["BASELINE_REQUIRED", "MIGRATION_CHANGED"].includes(error.message)
        ? `Migración detenida para revisión: ${error.message}.`
        : `No se pudo aplicar el esquema. Código: ${/^[A-Z0-9_]{2,30}$/.test(error.code ?? "") ? error.code : "CONNECTION_OR_SCHEMA_ERROR"}.`,
    );
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}
