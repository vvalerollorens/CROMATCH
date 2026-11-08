import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { playerPhoto } from "../src/lib/player-photos";
import { referenceStickers } from "../src/lib/catalogue";
import provenance from "../public/players/sources.json";
import additional from "../public/players/additional-sources.json";
import type { Sticker } from "../src/lib/domain";
describe("identidad y disponibilidad de retratos", () => {
  it("no reutiliza un retrato por coincidencia parcial o entre clubes", () => {
    const sivera = referenceStickers.find((s) => s.name === "Sivera")!;
    expect(playerPhoto(sivera)?.player).toBe("Antonio Sivera");
    expect(playerPhoto({ ...sivera, id: "published-id" })?.player).toBe(
      "Antonio Sivera",
    );
    expect(
      playerPhoto({
        ...sivera,
        id: "other-id",
        teams: { name: "FC Barcelona" },
      }),
    ).toBeUndefined();
    expect(
      playerPhoto({
        id: "unknown",
        name: "Siver",
        teams: { name: "Deportivo Alavés" },
      } as Sticker),
    ).toBeUndefined();
    expect(
      playerPhoto(referenceStickers.find((s) => s.name === "Escudo")!),
    ).toBeUndefined();
    const abde = referenceStickers.filter((s) => s.name === "Abde");
    expect(abde.map((s) => playerPhoto(s)?.player)).toEqual([
      "Abde Rebbach",
      "Abde Ezzalzouli",
    ]);
  });
  it("sirve imágenes locales íntegras de la fuente solicitada", () => {
    const checked = new Set<string>();
    for (const [id, p] of Object.entries(provenance.photos)) {
      expect(referenceStickers.some((s) => s.id === id)).toBe(true);
      expect(p.source).toBe("https://www.footylogos.com/es/player-pngs/laliga");
      expect(p.url).toMatch(
        /^https:\/\/assets\.footylogos\.com\/player-pngs\/previews\/v1\/[a-f0-9]+\.webp$/,
      );
      if (checked.has(p.src)) continue;
      checked.add(p.src);
      const bytes = readFileSync(`public${p.src}`);
      expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(p.sha256);
    }
    expect(checked.size).toBeGreaterThan(400);
  });
  it("completa jugadores y entrenadores con archivos de fuentes identificadas", () => {
    const people = referenceStickers.filter((s) => s.name !== "Escudo");
    expect(people).toHaveLength(641);
    expect(people.every((s) => !!playerPhoto(s))).toBe(true);
    for (const p of Object.values(additional.photos)) {
      const bytes = readFileSync(`public${p.src}`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(p.sha256);
      expect(p.source.startsWith("https://")).toBe(true);
      expect(p.player.length).toBeGreaterThan(3);
    }
  });
});
