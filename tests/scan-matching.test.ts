import { describe, expect, it } from "vitest";
import { referenceStickers } from "../src/lib/catalogue";
import { matchScanText } from "../src/lib/scan-matching";
describe("lectura y revisión de varias cartas", () => {
  it("encuentra tres nombres y no identifica cartas solo por números", () => {
    const found = matchScanText(
      "3\nSIVERA\nTENAGLIA\nPADILLA",
      referenceStickers,
    );
    expect(found.map((m) => m.name)).toEqual(
      expect.arrayContaining(["Sivera", "Tenaglia", "Padilla"]),
    );
    expect(
      matchScanText("3 9 22\n2026 2027\nLALIGA", referenceStickers),
    ).toEqual([]);
  });
  it("mantiene las variantes como opciones para que el usuario elija", () => {
    const match = matchScanText("LAMINE YAMAL", referenceStickers).find(
      (m) => m.name === "Lamine Yamal",
    )!;
    expect(match.candidates.length).toBeGreaterThan(1);
    expect(
      new Set(match.candidates.map((s) => s.official_code)).size,
    ).toBeGreaterThan(1);
    expect(match.exact).toBe(true);
  });
  it("señala una lectura aproximada para revisión y admite tildes", () => {
    const found = matchScanText("Tenaglla\nPABLO IBANEZ", referenceStickers);
    expect(found.find((m) => m.name === "Tenaglia")?.exact).toBe(false);
    expect(found.find((m) => m.name === "Pablo Ibáñez")?.exact).toBe(true);
  });
});
