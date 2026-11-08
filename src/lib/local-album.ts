export const LOCAL_ALBUM_KEY = "nexo.album.v1";
export type LocalAlbum = { version: 1; quantities: Record<string, number> };
export function readLocalAlbum(
  raw: string | null,
  ids: Set<string>,
): LocalAlbum {
  const empty: LocalAlbum = { version: 1, quantities: {} };
  if (!raw) return empty;
  try {
    const value = JSON.parse(raw);
    if (
      value.version !== 1 ||
      !value.quantities ||
      typeof value.quantities !== "object"
    )
      return empty;
    for (const [id, q] of Object.entries(value.quantities))
      if (
        ids.has(id) &&
        typeof q === "number" &&
        Number.isInteger(q) &&
        q > 0 &&
        q <= 999
      )
        empty.quantities[id] = q;
    return empty;
  } catch {
    return empty;
  }
}
export function changeLocalQuantity(
  current: LocalAlbum,
  id: string,
  delta: number,
  ids: Set<string>,
): LocalAlbum {
  if (!ids.has(id) || !Number.isInteger(delta))
    throw new Error("Cromo o cantidad no válidos.");
  const q = (current.quantities[id] ?? 0) + delta;
  if (q < 0 || q > 999)
    throw new Error("La cantidad debe estar entre 0 y 999.");
  const quantities = { ...current.quantities };
  if (q) quantities[id] = q;
  else delete quantities[id];
  return { version: 1, quantities };
}
