import { describe, it, expect } from "vitest";
import {
  available,
  compare,
  statistics,
  parseCatalog,
  type Sticker,
} from "../src/lib/domain";
const sticker = (id: string, position: string | null = null) =>
  ({ id, collection_id: "collection-a", album_position: position }) as Sticker;
describe("inventario y coincidencias", () => {
  it("descuenta el ejemplar del álbum y las reservas", () => {
    expect(available()).toBe(0);
    expect(available({ quantity: 1, reserved: 0 })).toBe(0);
    expect(available({ quantity: 4, reserved: 2 })).toBe(1);
  });
  it("compara por ID exacto y excluye reservas, variantes distintas y otras colecciones", () => {
    const rows = [sticker("a"), sticker("b"), sticker("variant")];
    const mine = [
      { user_id: "a", sticker_id: "a", quantity: 3, reserved: 1 },
      { user_id: "a", sticker_id: "variant", quantity: 2, reserved: 1 },
    ];
    const theirs = [
      { user_id: "b", sticker_id: "b", quantity: 2, reserved: 0 },
      { user_id: "b", sticker_id: "outside", quantity: 3, reserved: 0 },
    ];
    const result = compare(rows, mine, theirs);
    expect(result.offer.map((s) => s.id)).toEqual(["a"]);
    expect(result.receive.map((s) => s.id)).toEqual(["b"]);
  });
  it("separa cromos publicados y posiciones físicas", () => {
    const rows = [sticker("a", "1"), sticker("b", "1"), sticker("c", "2")];
    const st = statistics(rows, [
      { user_id: "a", sticker_id: "a", quantity: 2, reserved: 1 },
      { user_id: "a", sticker_id: "b", quantity: 1, reserved: 0 },
    ]);
    expect(st).toMatchObject({
      owned: 2,
      total: 3,
      missing: 1,
      duplicates: 1,
      available: 0,
      reserved: 1,
      percent: 67,
      positions: 1,
    });
  });
});
describe("importación del catálogo", () => {
  const row = {
    official_code: "TEST",
    name: "Fixture, nunca catálogo real",
    edition: "test",
    source_url: "https://official.example/fixture",
    corroboration_url: "https://secondary.example/fixture",
    verified_at: "2026-01-01T00:00:00Z",
  };
  it("exige fuentes distintas y fecha", () => {
    expect(() =>
      parseCatalog(
        JSON.stringify([{ ...row, corroboration_url: row.source_url }]),
      ),
    ).toThrow();
    expect(() =>
      parseCatalog(JSON.stringify([{ ...row, verified_at: undefined }])),
    ).toThrow();
  });
  it("rechaza duplicados antes de publicar", () => {
    expect(() => parseCatalog(JSON.stringify([row, row]))).toThrow(
      /duplicados/,
    );
  });
  it("acepta un documento trazable", () => {
    expect(parseCatalog(JSON.stringify([row]))).toHaveLength(1);
  });
});
