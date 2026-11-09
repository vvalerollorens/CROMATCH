"use client";
import { useState } from "react";
import type { Inventory, Sticker } from "@/lib/domain";

const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

export function OwnedCollectionList({
  stickers,
  inventory,
  collectionName,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  collectionName?: string;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const quantities = new Map(inventory.map((i) => [i.sticker_id, i.quantity]));
  const owned = stickers.filter((s) => (quantities.get(s.id) ?? 0) > 0);
  const groupOf = (s: Sticker) =>
    s.teams?.name ?? s.sticker_series?.name ?? "Otros cromos";
  const groups = [...new Set(owned.map(groupOf))];
  const rows = owned.filter(
    (s) =>
      (!group || groupOf(s) === group) &&
      normalized(
        `${s.official_code} ${s.name} ${groupOf(s)} ${s.sticker_series?.name ?? ""}`,
      ).includes(normalized(query.trim())),
  );
  async function exportPdf() {
    if (exporting || !rows.length) return;
    setExporting(true);
    setExportError("");
    try {
      const { ownedCollectionPdf, loadOwnedPdfFonts } =
        await import("@/lib/owned-pdf");
      const fonts = await loadOwnedPdfFonts();
      const pdf = ownedCollectionPdf(
        rows.map((s) => ({
          code: s.official_code,
          name: s.name,
          group: groupOf(s),
          edition: s.edition,
          variant: s.variant,
          quantity: quantities.get(s.id)!,
        })),
        fonts,
        collectionName,
        [query.trim(), group].filter(Boolean).join(" · "),
      );
      pdf.save("nexo-lo-que-tengo.pdf");
    } catch {
      setExportError(
        "No se ha podido crear el PDF. Puedes reintentarlo o consultar aquí toda la lista.",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <section
      className="panel owned-collection"
      aria-label="Lista compacta de cromos que tienes"
    >
      <div className="section-heading">
        <div>
          <h2>Lo que tengo</h2>
          <p>
            {owned.length}{" "}
            {owned.length === 1 ? "cromo distinto" : "cromos distintos"} ·{" "}
            {owned.reduce((total, s) => total + quantities.get(s.id)!, 0)}{" "}
            {owned.reduce((total, s) => total + quantities.get(s.id)!, 0) === 1
              ? "copia"
              : "copias"}
          </p>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={!rows.length || exporting}
          onClick={() => void exportPdf()}
        >
          {exporting ? "Preparando PDF…" : "Descargar PDF"}
        </button>
      </div>
      {exportError && <p role="alert">{exportError}</p>}
      <div className="toolbar">
        <label className="search-field">
          <input
            aria-label="Buscar en lo que tengo"
            placeholder="Número, nombre o equipo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar lo que tengo por equipo o apartado"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option value="">Todos los equipos y apartados</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>
      <p className="results-count">
        {rows.length} de {owned.length} cromos · Orden del álbum
      </p>
      {rows.length > 0 && (
        <p className="owned-scroll-hint">
          Desplázate para ver toda la lista. El PDF incluye los cromos de esta
          búsqueda.
        </p>
      )}
      {(query || group) && (
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setQuery("");
            setGroup("");
          }}
        >
          Ver todos mis cromos
        </button>
      )}
      {rows.length ? (
        <ul className="owned-compact-list">
          {rows.map((s) => (
            <li key={s.id}>
              <span className="owned-code">#{s.official_code}</span>
              <span className="owned-name">
                <strong>{s.name}</strong>
                <small>
                  {groupOf(s)}
                  {s.teams && s.sticker_series
                    ? ` · ${s.sticker_series.name}`
                    : ""}
                  {s.variant && s.variant !== "base" ? ` · ${s.variant}` : ""} ·{" "}
                  {s.edition}
                </small>
              </span>
              <span className="owned-copies">
                {quantities.get(s.id)}{" "}
                {quantities.get(s.id) === 1 ? "copia" : "copias"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {owned.length
            ? "No hay cromos con esta búsqueda o filtro."
            : "Todavía no tienes cromos marcados en esta colección."}
        </p>
      )}
    </section>
  );
}
