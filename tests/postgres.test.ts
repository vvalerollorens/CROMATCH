import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
const url = process.env.TEST_DATABASE_URL;
const A = "20000000-0000-4000-a000-000000000001",
  B = "20000000-0000-4000-a000-000000000002";
let pool: Pool,
  c: string,
  s1: string,
  s2: string,
  t1: string,
  t2: string,
  accepted: string;
const id = () => crypto.randomUUID();
async function asUser(u: string, query: string, args: unknown[] = []) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role authenticated");
    await client.query("select set_config('request.jwt.claim.sub',$1,true)", [
      u,
    ]);
    const result = await client.query(query, args);
    await client.query("commit");
    return result;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}
describe.skipIf(!url)(
  "PostgreSQL real: carreras entre conexiones independientes",
  () => {
    beforeAll(async () => {
      if (new URL(url!).pathname !== "/cromatch_test")
        throw new Error(
          "Usa exclusivamente una base desechable llamada cromatch_test",
        );
      pool = new Pool({ connectionString: url, max: 8 });
      await pool.query(
        `drop schema if exists public cascade;drop schema if exists auth cascade;create schema public;create schema auth;do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin;end if;end $$;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email text unique);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
      );
      await pool.query(
        readFileSync("supabase/migrations/202611080001_core.sql", "utf8") +
          "\n" +
          readFileSync(
            "supabase/migrations/202611080002_username_accounts.sql",
            "utf8",
          ) +
          "\n" +
          readFileSync(
            "supabase/migrations/202611080003_catalogue_identity.sql",
            "utf8",
          ) +
          "\n" +
          readFileSync(
            "supabase/migrations/202611080005_bulk_quantities.sql",
            "utf8",
          ) +
          "\n" +
          readFileSync(
            "supabase/migrations/202611090006_album_recovery.sql",
            "utf8",
          ),
      );
      await pool.query("insert into auth.users(id) values($1),($2)", [A, B]);
      c = (await pool.query("select id from public.collections")).rows[0].id;
      for (const code of ["CONCURRENCY-ONLY-A", "CONCURRENCY-ONLY-B"]) {
        const s = (
          await pool.query(
            `insert into public.stickers(collection_id,official_code,name,edition,source_url,corroboration_url,verified_at,verified_by) values($1,$2,'Test fixture','TEST','https://official.example/test','https://second.example/test',now(),$3) returning id`,
            [c, code, A],
          )
        ).rows[0].id;
        if (!s1) s1 = s;
        else s2 = s;
      }
      await asUser(
        A,
        "select public.update_profile('concurrent_a','A','friends',false)",
      );
      await asUser(
        B,
        "select public.update_profile('concurrent_b','B','friends',false)",
      );
      await asUser(A, "select public.friend_action($1,'request')", [B]);
      await asUser(B, "select public.friend_action($1,'accept')", [A]);
      for (const [u, s] of [
        [A, s1],
        [B, s2],
      ])
        for (let k = 0; k < 2; k++)
          await asUser(u, "select public.change_quantity($1,1,$2)", [s, id()]);
    });
    afterAll(async () => {
      await pool?.end();
    });
    it("dos aceptaciones simultáneas no reservan la misma unidad", async () => {
      const items = JSON.stringify([
        { giver_id: A, sticker_id: s1, quantity: 1 },
        { giver_id: B, sticker_id: s2, quantity: 1 },
      ]);
      t1 = id();
      t2 = id();
      for (const t of [t1, t2])
        await asUser(A, "select public.propose_trade($1,$2,$3,$4)", [
          B,
          c,
          items,
          t,
        ]);
      const results = await Promise.allSettled([
        asUser(B, "select public.trade_action($1,'accept')", [t1]),
        asUser(B, "select public.trade_action($1,'accept')", [t2]),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
      accepted = results[0].status === "fulfilled" ? t1 : t2;
      const rows = (
        await pool.query(
          "select quantity,reserved from public.user_inventory order by user_id",
        )
      ).rows;
      expect(rows).toEqual([
        { quantity: 2, reserved: 1 },
        { quantity: 2, reserved: 1 },
      ]);
    });
    it("confirmaciones simultáneas completan una sola transacción de intercambio", async () => {
      await Promise.all([
        asUser(A, "select public.trade_action($1,'confirm')", [accepted]),
        asUser(B, "select public.trade_action($1,'confirm')", [accepted]),
      ]);
      expect(
        (
          await pool.query(
            "select status from public.trade_proposals where id=$1",
            [accepted],
          )
        ).rows[0].status,
      ).toBe("completed");
      expect(
        (
          await pool.query(
            "select * from public.inventory_transactions where trade_id=$1",
            [accepted],
          )
        ).rows,
      ).toHaveLength(4);
      expect(
        (
          await pool.query(
            "select sum(quantity)::int as quantity,sum(reserved)::int as reserved from public.user_inventory",
          )
        ).rows[0],
      ).toEqual({ quantity: 4, reserved: 0 });
      await Promise.all([
        asUser(A, "select public.trade_action($1,'confirm')", [accepted]),
        asUser(B, "select public.trade_action($1,'confirm')", [accepted]),
      ]);
      expect(
        (
          await pool.query(
            "select * from public.inventory_transactions where trade_id=$1",
            [accepted],
          )
        ).rows,
      ).toHaveLength(4);
    });
    it("dos escrituras con el mismo ID de operación suman una sola unidad", async () => {
      const operation = id();
      await Promise.all([
        asUser(A, "select public.change_quantity($1,1,$2)", [s1, operation]),
        asUser(A, "select public.change_quantity($1,1,$2)", [s1, operation]),
      ]);
      expect(
        (
          await pool.query(
            "select quantity from public.user_inventory where user_id=$1 and sticker_id=$2",
            [A, s1],
          )
        ).rows[0].quantity,
      ).toBe(2);
    });
    it("incrementos diferentes concurrentes no pierden actualizaciones", async () => {
      await Promise.all(
        Array.from({ length: 8 }, () =>
          asUser(A, "select public.change_quantity($1,1,$2)", [s1, id()]),
        ),
      );
      expect(
        (
          await pool.query(
            "select quantity from public.user_inventory where user_id=$1 and sticker_id=$2",
            [A, s1],
          )
        ).rows[0].quantity,
      ).toBe(10);
    });
  },
);
