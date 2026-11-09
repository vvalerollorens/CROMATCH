import type { Sticker } from "./domain";
import { searchText } from "./scan-matching";
export class DuplicateEntryError extends Error {
  constructor(
    message: string,
    readonly retryRequired: boolean,
  ) {
    super(message);
  }
}

export function duplicateMatches(
  stickers: Sticker[],
  query: string,
  group: string,
) {
  if (!query.trim() && !group) return [];
  const text = searchText(query);
  const code = text.replace(/\s/g, "");
  const selected = stickers.filter(
    (s) =>
      !group ||
      group === `team:${s.teams?.name}` ||
      group === `series:${s.sticker_series?.name}`,
  );
  if (/^\d+(?:a|b|bis)?$/.test(code)) {
    const numeric = selected.filter((s) =>
      searchText(s.official_code).replace(/\s/g, "").startsWith(code),
    );
    const exact = numeric.filter(
      (s) => searchText(s.official_code).replace(/\s/g, "") === code,
    );
    return exact.length ? exact : numeric;
  }
  return selected.filter((s) =>
    searchText(
      `${s.name} ${s.official_code} ${s.teams?.name ?? ""} ${s.sticker_series?.name ?? ""} ${(s.catalog_sources ?? []).map((source) => source.nameInSource).join(" ")}`,
    ).includes(text),
  );
}

/** Repeated copies exclude the one kept in the album. */
export function duplicateAddition(quantity: number, extras: number) {
  if (!Number.isInteger(extras) || extras < 1 || extras > 99)
    throw new Error("Indica de 1 a 99 repetidos para añadir.");
  const delta = extras + (quantity === 0 ? 1 : 0);
  if (quantity + delta > 999)
    throw new Error("Con esta cantidad superarías las 999 copias del cromo.");
  return delta;
}
