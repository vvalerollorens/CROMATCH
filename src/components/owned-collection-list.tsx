"use client";
import { useState } from "react";
import type { Inventory, Sticker } from "@/lib/domain";
import { download } from "@/lib/supabase";

const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");

export function OwnedCollectionList({
  stickers,
  inventory,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
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
          disabled={!rows.length}
          onClick={() =>
            download(
              "nexo-lo-que-tengo.txt",
              rows
                .map(
                  (s) =>
                    `#${s.official_code} · ${s.name} · ${groupOf(s)} · ${quantities.get(s.id)} copias · ${s.edition} · ${s.variant}`,
                )
                .join("\n"),
            )
          }
        >
          Exportar lista
        </button>
      </div>
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
