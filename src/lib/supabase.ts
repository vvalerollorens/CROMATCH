import { createClient, type SupabaseClient } from "@supabase/supabase-js";
export const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
let instance: SupabaseClient | undefined;
export function database() {
  if (!configured)
    throw new Error(
      "Configura Supabase para activar las cuentas y los datos. Consulta el README.",
    );
  instance ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "pkce", detectSessionInUrl: true } },
  );
  return instance;
}
export function download(name: string, value: unknown) {
  const blob = new Blob(
    [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
    {
      type:
        typeof value === "string"
          ? "text/plain;charset=utf-8"
          : "application/json",
    },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// PostgREST defaults to 1000 rows. Never silently truncate an album inventory.
export async function inventoryFor(userId: string) {
  const rows: import("./domain").Inventory[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await database()
      .from("user_inventory")
      .select("*")
      .eq("user_id", userId)
      .order("sticker_id")
      .range(offset, offset + 499);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 500) break;
  }
  return rows;
}
