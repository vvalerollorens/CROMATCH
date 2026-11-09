import { jsPDF } from "jspdf";

export type OwnedPdfRow = {
  code: string;
  name: string;
  group: string;
  edition: string;
  variant: string;
  quantity: number;
};
export type OwnedPdfFonts = { regular: string; bold: string };
let fontsRequest: Promise<OwnedPdfFonts> | undefined;
export function loadOwnedPdfFonts(): Promise<OwnedPdfFonts> {
  fontsRequest ??= Promise.all(
    ["regular", "bold"].map(async (weight) => {
      const response = await fetch(`/fonts/manrope-pdf-${weight}.ttf`);
      if (!response.ok)
        throw new Error("No se ha podido cargar la fuente del PDF.");
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 32768)
        binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
      return btoa(binary);
    }),
  )
    .then(([regular, bold]) => ({ regular, bold }))
    .catch((error) => {
      fontsRequest = undefined;
      throw error;
    });
  return fontsRequest;
}

// Generated locally from the visible list; no inventory is sent to a PDF service.
export function ownedCollectionPdf(
  rows: OwnedPdfRow[],
  fonts: OwnedPdfFonts,
  collection?: string,
  filter?: string,
) {
  const pdf = new jsPDF({ putOnlyUsedFonts: true });
  pdf.addFileToVFS("Nexo-Regular.ttf", fonts.regular);
  pdf.addFont("Nexo-Regular.ttf", "Nexo", "normal");
  pdf.addFileToVFS("Nexo-Bold.ttf", fonts.bold);
  pdf.addFont("Nexo-Bold.ttf", "Nexo", "bold");
  const copies = rows.reduce((sum, row) => sum + row.quantity, 0);
  pdf.setProperties({
    title: "NEXO - Lo que tengo",
    subject: collection ?? "Mi colección",
    creator: "NEXO",
  });
  const header = () => {
    pdf.setTextColor(35, 25, 38);
    pdf.setFont("Nexo", "bold");
    pdf.setFontSize(20);
    pdf.text("NEXO / Lo que tengo", 15, 19);
    pdf.setFont("Nexo", "normal");
    pdf.setFontSize(9);
    pdf.text(
      `${collection ?? "Mi colección"} · ${rows.length} ${rows.length === 1 ? "cromo" : "cromos"} · ${copies} ${copies === 1 ? "copia" : "copias"}`,
      15,
      27,
    );
    if (filter)
      pdf.text(
        pdf.splitTextToSize(`Filtro: ${filter}`, 180).slice(0, 2),
        15,
        33,
      );
    pdf.setFont("Nexo", "bold");
    pdf.text("Nº", 15, 46);
    pdf.text("Nombre / equipo o apartado", 39, 46);
    pdf.text("Copias", 195, 46, { align: "right" });
    pdf.setDrawColor(210, 200, 210);
    pdf.line(15, 49, 195, 49);
  };
  header();
  let y = 56;
  for (const row of rows) {
    pdf.setFont("Nexo", "normal");
    pdf.setFontSize(10);
    const names: string[] = pdf.splitTextToSize(row.name, 128);
    const codes: string[] = pdf.splitTextToSize(row.code, 20);
    pdf.setFontSize(8);
    const details: string[] = pdf.splitTextToSize(
      [row.group, row.edition, row.variant !== "base" ? row.variant : ""]
        .filter(Boolean)
        .join(" · "),
      128,
    );
    const height =
      Math.max(codes.length * 5, names.length * 5 + details.length * 4) + 5;
    if (y + height > 278) {
      pdf.addPage();
      header();
      y = 56;
    }
    pdf.setTextColor(35, 25, 38);
    pdf.setFont("Nexo", "normal");
    pdf.setFontSize(10);
    pdf.text(codes, 15, y);
    pdf.text(names, 39, y);
    pdf.text(String(row.quantity), 195, y, { align: "right" });
    pdf.setTextColor(100, 90, 100);
    pdf.setFontSize(8);
    pdf.text(details, 39, y + names.length * 5);
    pdf.setDrawColor(235, 230, 235);
    pdf.line(15, y + height - 4, 195, y + height - 4);
    y += height;
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFont("Nexo", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 90, 100);
    pdf.text("NEXO · Mi colección", 15, 288);
    pdf.text(`${page} / ${pages}`, 195, 288, { align: "right" });
  }
  return pdf;
}
