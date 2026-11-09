import { expect, it } from "vitest";
import { ownedCollectionPdf } from "../src/lib/owned-pdf";

it("genera un PDF con varias páginas sin perder las últimas filas y con las copias", () => {
  const rows = Array.from({ length: 120 }, (_, i) => ({
    code: String(i + 1),
    name: `Player${String(i).padStart(3, "0")}`,
    group:
      "Deportivo Alavés / Un apartado con nombre largo para comprobar ajuste de línea",
    edition: "Cuarta edición",
    variant: "base",
    quantity: 2,
  }));
  const pdf = ownedCollectionPdf(rows, "LaLiga ESTE 2026-27");
  const content = pdf.output();
  expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  expect(content.startsWith("%PDF-")).toBe(true);
  expect(content).toContain("Player000");
  expect(content).toContain("Player119");
  expect(content).toContain("120 cromos");
  expect(content).toContain("240 copias");
  expect(content).toContain(
    `${pdf.getNumberOfPages()} / ${pdf.getNumberOfPages()}`,
  );
  expect(content.trimEnd().endsWith("%%EOF")).toBe(true);
});
