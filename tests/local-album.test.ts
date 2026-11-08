import { describe, expect, it } from "vitest";
import { readLocalAlbum, changeLocalQuantity } from "../src/lib/local-album";
import { statistics } from "../src/lib/domain";
import type { Sticker } from "../src/lib/domain";
describe("cantidades locales", () => {
  const ids = new Set(["a", "b"]);
  it("conserva la primera copia y cuenta las siguientes como repetidos", () => {
    let album = readLocalAlbum(null, ids);
    album = changeLocalQuantity(album, "a", 1, ids);
    album = changeLocalQuantity(album, "a", 2, ids);
    const restored = readLocalAlbum(JSON.stringify(album), ids);
    expect(restored.quantities.a).toBe(3);
    const stats = statistics(
      [{ id: "a" } as Sticker],
      [{ user_id: "local", sticker_id: "a", quantity: 3, reserved: 0 }],
    );
    expect(stats.owned).toBe(1);
    expect(stats.duplicates).toBe(2);
    expect(changeLocalQuantity(restored, "a", -3, ids).quantities).toEqual({});
  });
  it("descarta datos ajenos al catálogo y rechaza cantidades corruptas", () => {
    expect(
      readLocalAlbum(
        '{"version":1,"quantities":{"a":2,"b":-1,"foreign":9}}',
        ids,
      ).quantities,
    ).toEqual({ a: 2 });
    expect(readLocalAlbum("not json", ids).quantities).toEqual({});
    expect(() =>
      changeLocalQuantity({ version: 1, quantities: {} }, "a", -1, ids),
    ).toThrow();
    expect(() =>
      changeLocalQuantity({ version: 1, quantities: {} }, "unknown", 1, ids),
    ).toThrow();
    expect(() =>
      changeLocalQuantity({ version: 1, quantities: { a: 999 } }, "a", 1, ids),
    ).toThrow();
  });
});
