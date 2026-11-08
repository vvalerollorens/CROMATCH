import { describe, expect, it } from "vitest";
import { isFeatured, cardFinish } from "../src/lib/album-art";
import { referenceStickers } from "../src/lib/catalogue";
import { seasonTeams, teamKey } from "../src/lib/teams";
describe("destacados de NEXO y acabados de las series", () => {
  it("todos los equipos tienen un jugador destacado sin alterar la serie impresa", () => {
    for (const team of seasonTeams) {
      const rows = referenceStickers.filter(
        (s) => s.teams && teamKey(s.teams.name) === team.id && isFeatured(s),
      );
      expect(rows.length, team.name).toBeGreaterThan(0);
      expect(rows.every((s) => s.sticker_series === null)).toBe(true);
      expect(rows.every((s) => cardFinish(s) === "featured")).toBe(true);
    }
  });
  it("distingue las series y conserva la numeración original", () => {
    expect(
      cardFinish(
        referenceStickers.find((s) => s.catalog_section === "extra-oro")!,
      ),
    ).toBe("gold");
    expect(
      cardFinish(
        referenceStickers.find(
          (s) => s.catalog_section === "ultimos-fichajes",
        )!,
      ),
    ).toBe("transfer");
    expect(
      referenceStickers.find((s) => s.catalog_section === "extra-oro")!
        .official_code,
    ).toBe("S/N");
  });
});
