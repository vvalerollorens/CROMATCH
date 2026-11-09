import { expect, it } from "vitest";
import { ownedCollectionPdf } from "../src/lib/owned-pdf";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

it("genera un PDF con varias páginas sin perder las últimas filas y con las copias", () => {
  const rows = Array.from({ length: 120 }, (_, i) => ({
    code: String(i + 1),
    name:
      i === 60
        ? "Wojciech Szczęsny / Luka Sučić"
        : `Player${String(i).padStart(3, "0")}`,
    group:
      "Deportivo Alavés / Un apartado con nombre largo para comprobar ajuste de línea",
    edition: "Cuarta edición",
    variant: "base",
    quantity: 2,
  }));
  const pdf = ownedCollectionPdf(
    rows,
    {
      regular: readFileSync("public/fonts/manrope-pdf-regular.ttf").toString(
        "base64",
      ),
      bold: readFileSync("public/fonts/manrope-pdf-bold.ttf").toString(
        "base64",
      ),
    },
    "LaLiga ESTE 2026-27",
  );
  const content = pdf.output();
  const extracted = spawnSync("pdftotext", ["-layout", "-", "-"], {
    input: Buffer.from(pdf.output("arraybuffer")),
    encoding: "utf8",
  });
  expect(
    extracted.error,
    "Instala poppler-utils para comprobar el texto real del PDF",
  ).toBeUndefined();
  expect(extracted.status).toBe(0);
  expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  expect(content.startsWith("%PDF-")).toBe(true);
  expect(extracted.stdout).toContain("Player000");
  expect(extracted.stdout).toContain("Player119");
  expect(extracted.stdout).toContain("Szczęsny");
  expect(extracted.stdout).toContain("Sučić");
  expect(extracted.stdout).toContain("120 cromos");
  expect(extracted.stdout).toContain("240 copias");
  expect(extracted.stdout.replace(/\s+/g, "")).toContain(
    `${pdf.getNumberOfPages()}/${pdf.getNumberOfPages()}`,
  );
  expect(content.trimEnd().endsWith("%%EOF")).toBe(true);
});
