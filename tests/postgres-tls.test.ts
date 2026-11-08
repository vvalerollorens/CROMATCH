import { expect, it } from "vitest";
import { X509Certificate } from "node:crypto";
import pg from "pg";
import { postgresTLS } from "../scripts/postgres-tls.mjs";

it("pg conserva la CA oficial y verifica TLS aunque la URL incluya opciones SSL", () => {
  const options = postgresTLS(
    "postgresql://fixture:unused@db.example.test:5432/postgres?sslmode=require&sslrootcert=ignored&ssl=false&uselibpqcompat=true&application_name=nexo",
  );
  const client = new pg.Client(options);
  const ssl = (
    client as pg.Client & { connectionParameters: { ssl: typeof options.ssl } }
  ).connectionParameters.ssl;
  expect(ssl).toEqual(options.ssl);
  expect(typeof ssl === "object" && ssl.rejectUnauthorized).toBe(true);
  const cert = new X509Certificate(options.ssl.ca.at(-1)!);
  expect(cert.fingerprint256).toBe(
    "80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA",
  );
  expect(
    new URL(options.connectionString).searchParams.get("application_name"),
  ).toBe("nexo");
});
