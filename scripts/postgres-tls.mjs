import { readFileSync } from "node:fs";
import { rootCertificates } from "node:tls";

// Official Supabase CA, downloaded over HTTPS; see certs/README.md.
const supabaseCA = readFileSync(
  new URL("./certs/supabase-root-2021.crt", import.meta.url),
  "utf8",
);
export function postgresTLS(connectionString) {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("INVALID_DATABASE_URL");
  // pg parses these URL parameters after the SSL object and would replace it.
  // Use one explicit policy: trust the official CA, verify chain and hostname.
  for (const key of [
    "ssl",
    "sslmode",
    "sslrootcert",
    "sslcert",
    "sslkey",
    "uselibpqcompat",
  ])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: { ca: [...rootCertificates, supabaseCA], rejectUnauthorized: true },
  };
}
