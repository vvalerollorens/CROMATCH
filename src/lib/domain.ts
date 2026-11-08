import { z } from "zod";
export type Sticker = {
  catalog_reference?: boolean;
  catalog_section?: string;
  catalog_review?: string;
  catalog_number_status?: string;
  catalog_notes?: string[];
  catalog_sources?: {
    name: string;
    url: string;
    number: string | null;
    nameInSource: string;
  }[];

  id: string;
  collection_id: string;
  official_code: string;
  name: string;
  edition: string;
  variant: string;
  album_position: string | null;
  source_url: string;
  corroboration_url: string;
  verified_at: string;
  teams: { name: string } | null;
  sticker_series: { name: string } | null;
};
export type Inventory = {
  user_id: string;
  sticker_id: string;
  quantity: number;
  reserved: number;
};
export type Profile = {
  id: string;
  username: string;
  display_name: string;
  is_admin: boolean;
};
export type Collection = {
  id: string;
  name: string;
  catalog_status: string;
  album_positions: number | null;
};
export type Trade = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};
export type TradeItem = {
  trade_id: string;
  giver_id: string;
  sticker_id: string;
  quantity: number;
};
export const available = (i?: Pick<Inventory, "quantity" | "reserved">) =>
  Math.max(0, (i?.quantity ?? 0) - 1 - (i?.reserved ?? 0));
export function compare(
  stickers: Sticker[],
  mine: Inventory[],
  theirs: Inventory[],
) {
  const a = new Map(mine.map((i) => [i.sticker_id, i]));
  const b = new Map(theirs.map((i) => [i.sticker_id, i]));
  return {
    offer: stickers.filter(
      (s) => available(a.get(s.id)) > 0 && !b.get(s.id)?.quantity,
    ),
    receive: stickers.filter(
      (s) => available(b.get(s.id)) > 0 && !a.get(s.id)?.quantity,
    ),
  };
}
export function statistics(stickers: Sticker[], inventory: Inventory[]) {
  const ids = new Set(stickers.map((s) => s.id));
  const rows = inventory.filter((i) => ids.has(i.sticker_id));
  const owned = rows.filter((i) => i.quantity > 0).length;
  return {
    owned,
    total: stickers.length,
    missing: stickers.length - owned,
    duplicates: rows.reduce((n, i) => n + Math.max(0, i.quantity - 1), 0),
    available: rows.reduce((n, i) => n + available(i), 0),
    reserved: rows.reduce((n, i) => n + i.reserved, 0),
    percent: stickers.length ? Math.round((owned / stickers.length) * 100) : 0,
    positions: new Set(
      stickers
        .filter(
          (s) =>
            s.album_position &&
            rows.some((i) => i.sticker_id === s.id && i.quantity > 0),
        )
        .map((s) => s.album_position),
    ).size,
  };
}
export const catalogRow = z
  .object({
    official_code: z.string().trim().min(1).max(40),
    name: z.string().trim().min(1).max(120),
    edition: z.string().trim().min(1).max(60),
    variant: z.string().trim().min(1).max(60).default("base"),
    team: z.string().max(100).optional(),
    series: z.string().max(100).optional(),
    sticker_type: z.string().max(60).default("normal"),
    album_position: z.string().max(60).nullable().optional(),
    source_url: z.url().startsWith("https://"),
    corroboration_url: z.url().startsWith("https://"),
    verified_at: z.iso
      .datetime({ offset: true })
      .refine(
        (v) => Date.parse(v) <= Date.now(),
        "La fecha no puede ser futura",
      ),
  })
  .refine(
    (r) => r.source_url !== r.corroboration_url,
    "Las fuentes deben ser distintas",
  );
export function parseCatalog(text: string) {
  const rows = z.array(catalogRow).min(1).max(2000).parse(JSON.parse(text));
  const ids = rows.map((r) =>
    JSON.stringify([r.official_code, r.edition, r.variant]),
  );
  if (new Set(ids).size !== ids.length)
    throw new Error("Hay códigos, ediciones y variantes duplicados.");
  return rows;
}
export const statusLabel: Record<string, string> = {
  proposed: "Propuesto",
  accepted: "Pendiente de entrega",
  completed: "Completado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};
