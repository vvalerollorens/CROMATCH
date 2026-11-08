import type { Sticker } from "./domain";
export const searchText = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
export type ScanMatch = {
  name: string;
  line: string;
  exact: boolean;
  candidates: Sticker[];
};
function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++)
      next.push(
        Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1)),
      );
    row = next;
  }
  return row[b.length];
}
/** Names drive recognition. A shirt number or a lone album number never identifies a card. */
export function matchScanText(text: string, stickers: Sticker[]): ScanMatch[] {
  const lines = text
    .slice(0, 20000)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 400);
  const names = new Map<string, Sticker[]>();
  for (const s of stickers) {
    const name = searchText(s.name);
    if (name.length < 4 || /^(escudo|entrenador|draft|fantasy)$/.test(name))
      continue;
    names.set(name, [...(names.get(name) ?? []), s]);
  }
  const found: ScanMatch[] = [];
  for (const [name, candidates] of names) {
    const exact = lines.find((line) =>
      ` ${searchText(line)} `.includes(` ${name} `),
    );
    const fuzzy =
      !exact && name.length >= 6
        ? lines.find((line) => {
            const v = searchText(line);
            return (
              Math.abs(v.length - name.length) <= 2 &&
              distance(v, name) <= Math.min(2, Math.floor(name.length * 0.15))
            );
          })
        : undefined;
    if (exact || fuzzy)
      found.push({
        name: candidates[0].name,
        line: exact || fuzzy!,
        exact: !!exact,
        candidates,
      });
    if (found.length >= 24) break;
  }
  return found;
}
