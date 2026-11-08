import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  albumSections,
  catalogueSummary,
  referenceStickers,
} from "../src/lib/catalogue";
import { seasonTeams } from "../src/lib/teams";
import source from "../public/badges/sources.json";
describe("catálogo de consulta y escudos", () => {
  it("ordena los veinte clubes como los listados del álbum", () => {
    expect(seasonTeams.map((t) => t.id)).toEqual([
      "alaves",
      "athletic",
      "atletico",
      "barcelona",
      "betis",
      "celta",
      "deportivo",
      "elche",
      "espanyol",
      "getafe",
      "levante",
      "madrid",
      "malaga",
      "osasuna",
      "racing",
      "rayo",
      "sociedad",
      "sevilla",
      "valencia",
      "villarreal",
    ]);
    expect(
      albumSections.filter((s) => s.kind === "team").map((s) => s.id),
    ).toEqual(seasonTeams.map((s) => s.id));
  });
  it("incluye las nueve series y todos los registros de las fuentes consultadas sin declarar completitud oficial", () => {
    expect(albumSections).toHaveLength(29);
    expect(referenceStickers).toHaveLength(661);
    expect(new Set(referenceStickers.map((s) => s.id)).size).toBe(661);
    expect(catalogueSummary.officiallyComplete).toBe(false);
    expect(catalogueSummary.review).toBe(7);
    expect(
      referenceStickers.filter((s) => s.catalog_section === "ultimos-fichajes"),
    ).toHaveLength(66);
    expect(
      referenceStickers.every(
        (s) => s.name.trim() && !/pendiente|por anunciar/i.test(s.name),
      ),
    ).toBe(true);
  });
  it("no inventa números de Extras ni elige entre números de Top Fichajes que se contradicen", () => {
    expect(
      referenceStickers
        .filter((s) => s.catalog_section?.startsWith("extra-"))
        .every((s) => s.official_code === "S/N"),
    ).toBe(true);
    expect(
      referenceStickers
        .filter((s) => s.catalog_section === "top-fichajes")
        .every(
          (s) => s.official_code === "?" && s.catalog_review === "needs_review",
        ),
    ).toBe(true);
    expect(
      referenceStickers
        .filter(
          (s) =>
            s.catalog_section === "rayo" && s.official_code.startsWith("11"),
        )
        .map((s) => s.name),
    ).toEqual(["Pedro Díaz", "Nteka"]);
  });
  it("los 20 SVG descargados son locales, verificables y no contienen recursos activos", () => {
    expect(Object.keys(source)).toHaveLength(20);
    for (const team of seasonTeams) {
      const metadata = source[team.id as keyof typeof source];
      const path = `public${metadata.file}`;
      expect(existsSync(path)).toBe(true);
      const data = readFileSync(path);
      expect(createHash("sha256").update(data).digest("hex")).toBe(
        metadata.sha256,
      );
      expect(data.toString()).not.toMatch(
        /<script|<foreignObject|<iframe|<image|javascript:|onload=/i,
      );
    }
  });
});
