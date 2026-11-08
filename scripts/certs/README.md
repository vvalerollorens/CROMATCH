# Supabase PostgreSQL CA

`supabase-root-2021.crt` is a public CA certificate, not a private key.

Source: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

Downloaded over HTTPS on 2026-11-08. Subject/issuer: Supabase Inc, Supabase Root 2021 CA. Valid through 2031-04-26.

SHA-256 fingerprint: `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`.

The migration connection includes this CA and Node's standard roots, with certificate and hostname validation enabled. It removes URL SSL overrides so `sslmode=require` cannot replace the explicit CA configuration. It never uses `rejectUnauthorized: false` or disables TLS verification globally. Review this CA before its expiry or if Supabase rotates its certificate authority.
