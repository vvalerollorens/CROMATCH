"use client";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Dialog } from "./dialog";
import { duplicateMatches } from "@/lib/duplicate-entry";
import { playerPhoto } from "@/lib/player-photos";
import { teamKey } from "@/lib/teams";
import type { Inventory, Sticker } from "@/lib/domain";

export function GlobalStickerSearch({
  stickers,
  inventory,
  close,
  onOpen,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  close: () => void;
  onOpen: (s: Sticker) => void;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(24);
  const results = duplicateMatches(stickers, query, "");
  const own = new Map(inventory.map((i) => [i.sticker_id, i.quantity]));
  return (
    <Dialog
      titleId="global-search-title"
      close={close}
      className="global-player-search"
    >
      <h2 id="global-search-title">Buscar en toda mi colección</h2>
      <label className="global-player-query">
        <Search size={20} />
        <input
          aria-label="Buscar jugador en toda la colección"
          autoComplete="off"
          placeholder="Jugador, entrenador, equipo o número…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(24);
          }}
        />
      </label>
      <button
        type="button"
        className="icon-button close"
        aria-label="Cerrar buscador global"
        onClick={close}
      >
        <X size={20} />
      </button>
      <p role="status">
        {query.trim()
          ? `${results.length} ${results.length === 1 ? "cromo encontrado" : "cromos encontrados"}`
          : "Busca también entrenadores y especiales. Abre un resultado para ir a su casilla."}
      </p>
      <ul className="global-player-results">
        {results.slice(0, limit).map((s) => {
          const q = own.get(s.id) ?? 0;
          const photo = playerPhoto(s);
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-label={`Abrir ${s.name}, ${s.official_code}, ${s.sticker_series?.name ?? s.teams?.name ?? "Especial"}`}
                onClick={() => onOpen(s)}
              >
                <span className="global-player-photo">
                  {photo ? (
                    <img src={photo.src} alt="" loading="lazy" />
                  ) : s.name === "Escudo" && s.teams ? (
                    <img
                      src={`/badges/${teamKey(s.teams.name)}-white.svg`}
                      alt=""
                    />
                  ) : (
                    <Search size={20} />
                  )}
                </span>
                <span>
                  <strong>{s.name}</strong>
                  <small>
                    #{s.official_code} ·{" "}
                    {s.teams?.name ?? s.sticker_series?.name} · {s.edition}
                    {s.sticker_series ? ` · ${s.sticker_series.name}` : ""}
                  </small>
                  <span>
                    {q
                      ? `En tu álbum${q > 1 ? ` · ${q - 1} ${q === 2 ? "repetido" : "repetidos"}` : ""}`
                      : "Te falta"}
                  </span>
                </span>
                <span className="global-player-open">Ver casilla</span>
              </button>
            </li>
          );
        })}
      </ul>
      {query.trim() && !results.length && (
        <p>
          No hay coincidencias. Prueba con el apellido, el equipo o el número.
        </p>
      )}
      {results.length > limit && (
        <button
          type="button"
          className="secondary"
          onClick={() => setLimit((n) => n + 24)}
        >
          Ver más resultados
        </button>
      )}
    </Dialog>
  );
}
