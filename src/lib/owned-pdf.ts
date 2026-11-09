import { jsPDF } from "jspdf";

export type OwnedPdfRow = {
  code: string;
  name: string;
  group: string;
  edition: string;
  variant: string;
  quantity: number;
};

// Generated locally from the visible list; no inventory is sent to a PDF service.
export function ownedCollectionPdf(
  rows: OwnedPdfRow[],
  collection?: string,
  filter?: string,
) {
  const pdf = new jsPDF();
  pdf.setProperties({
    title: "NEXO - Lo que tengo",
    subject: collection ?? "Mi colección",
    creator: "NEXO",
  });
  const header = () => {
    pdf.setTextColor(35, 25, 38);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("NEXO / Lo que tengo", 15, 19);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
      `${collection ?? "Mi colección"} · ${rows.length} cromos · ${rows.reduce((sum, row) => sum + row.quantity, 0)} copias`,
      15,
      27,
    );
    if (filter)
      pdf.text(
        pdf.splitTextToSize(`Filtro: ${filter}`, 180).slice(0, 2),
        15,
        33,
      );
    pdf.setFont("helvetica", "bold");
    pdf.text("Nº", 15, 46);
    pdf.text("Nombre / equipo o apartado", 39, 46);
    pdf.text("Copias", 195, 46, { align: "right" });
    pdf.setDrawColor(210, 200, 210);
    pdf.line(15, 49, 195, 49);
  };
  header();
  let y = 56;
  for (const row of rows) {
    pdf.setFont("helvetica", "normal");
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
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 90, 100);
    pdf.text("NEXO · Mi colección", 15, 288);
    pdf.text(`${page} / ${pages}`, 195, 288, { align: "right" });
  }
  return pdf;
}
