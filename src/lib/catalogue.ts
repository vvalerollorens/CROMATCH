import data from "@/data/catalogue-2026-27.json";
type ReferenceEntry = {
  id: string;
  number: string | null;
  number_status: string;
  name: string;
  edition: number | null;
  variant: string;
  review_status: string;
  notes: string[];
  sources: { source: number; number: string | null; name: string }[];
};
type ReferenceCatalogue = {
  total: number;
  officially_complete: boolean;
  consulted_at: string;
  official_checklist_url: string;
  sources: { name: string; url: string }[];
  sections: {
    id: string;
    label: string;
    kind: string;
    entries: ReferenceEntry[];
  }[];
};
const reference: ReferenceCatalogue = data;
import type { Sticker } from "./domain";
export const albumSections = reference.sections.map((s) => ({
  id: s.id,
  name: s.label,
  kind: s.kind,
}));
export const catalogueSummary = {
  total: reference.total,
  sections: reference.sections.length,
  review: reference.sections
    .flatMap((s) => s.entries)
    .filter((e) => e.review_status === "needs_review").length,
  officiallyComplete: reference.officially_complete,
  consultedAt: reference.consulted_at,
  officialUrl: reference.official_checklist_url,
};
export const referenceStickers: Sticker[] = reference.sections.flatMap(
  (section) =>
    section.entries.map((e) => ({
      id: e.id,
      collection_id: "reference-laliga-este-2026-27",
      official_code:
        e.number ?? (e.number_status === "unnumbered" ? "S/N" : "?"),
      name: e.name,
      edition: e.edition ? `${e.edition}ª edición` : "Edición por confirmar",
      variant: e.variant,
      album_position: null,
      source_url: reference.sources[0].url,
      corroboration_url: reference.sources[1].url,
      verified_at: reference.consulted_at,
      teams: section.kind === "team" ? { name: section.label } : null,
      sticker_series:
        section.kind === "series" ? { name: section.label } : null,
      catalog_reference: true,
      catalog_section: section.id,
      catalog_review: e.review_status,
      catalog_number_status: e.number_status,
      catalog_notes: e.notes,
      catalog_sources: e.sources.map((r) => ({
        name: reference.sources[r.source].name,
        url: reference.sources[r.source].url,
        number: r.number,
        nameInSource: r.name,
      })),
    })),
);

export function albumSectionKey(name: string) {
  const clean = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  return albumSections.find((s) => clean(s.name) === clean(name))?.id;
}
