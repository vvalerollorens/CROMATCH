"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Info,
  LockKeyhole,
  Minus,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { available, type Inventory, type Sticker } from "@/lib/domain";
import { seasonTeams, teamKey } from "@/lib/teams";
import {
  albumSections,
  albumSectionKey,
  catalogueSummary,
  referenceStickers,
} from "@/lib/catalogue";
import { playerPhoto } from "@/lib/player-photos";
import { PlayerPortrait } from "./player-portrait";
import type { CSSProperties } from "react";
import { clubColours, cardFinish, isFeatured } from "@/lib/album-art";

export function TeamBadge({
  short,
  teamId,
}: {
  short: string;
  teamId?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [teamId]);
  const crest = seasonTeams.some((t) => t.id === teamId)
    ? `/badges/${teamId}-white.svg`
    : null;
  if (crest && !failed)
    return (
      <span className="team-badge real-team-badge" aria-hidden="true">
        <img
          className="club-crest"
          src={crest}
          alt=""
          width={48}
          height={56}
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
        />
      </span>
    );
  return (
    <span className="team-badge" aria-hidden="true">
      {teamId &&
      albumSections.some((s) => s.id === teamId && s.kind === "series") ? (
        <Sparkles size={28} />
      ) : (
        <>
          <svg viewBox="0 0 48 56" fill="none">
            <path
              d="M24 3 43 10v18c0 11-10 19-19 25C15 47 5 39 5 28V10L24 3Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <span>{short}</span>
        </>
      )}
    </span>
  );
}
const sectionOf = (s: Sticker) =>
  s.catalog_section ??
  (s.sticker_series && albumSectionKey(s.sticker_series.name)) ??
  (s.teams ? teamKey(s.teams.name) : (s.sticker_series?.name ?? "especiales"));
export function VisualAlbum({
  stickers,
  inventory,
  visitor,
  busy,
  collectionName,
  local = false,
  onScan,
  onQuantity,
  onNavigate,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  visitor: boolean;
  busy: boolean;
  collectionName?: string;
  local?: boolean;
  onScan?: () => void;
  onQuantity: (s: Sticker, d: number) => Promise<void>;
  onNavigate: (s: "repetidos" | "faltantes") => void;
}) {
  const reference =
    (stickers.length === 0 || stickers.every((s) => s.catalog_reference)) &&
    (!collectionName || collectionName.includes("2026"));
  const entries = stickers.length
    ? stickers
    : reference
      ? referenceStickers
      : [];
  const sections = useMemo(() => {
    const base =
      !collectionName || collectionName.includes("2026")
        ? albumSections.map((s) => ({
            ...s,
            short:
              seasonTeams.find((t) => t.id === s.id)?.short ??
              {
                "adn-prime": "ADN",
                fantasy: "FAN",
                draft: "D23",
                "draft-kromix": "K23",
                "extra-bronce": "BR",
                "extra-plata": "PL",
                "extra-oro": "OR",
                "ultimos-fichajes": "UF",
                "top-fichajes": "TF",
              }[s.id as string] ??
              "CM",
          }))
        : [];
    for (const s of entries) {
      const id = sectionOf(s);
      if (!base.some((t) => t.id === id))
        base.push({
          id,
          name: s.teams?.name ?? s.sticker_series?.name ?? "Especiales",
          kind: s.teams ? "team" : "series",
          short: s.teams?.name.slice(0, 3).toUpperCase() ?? "CM",
        });
    }
    return base;
  }, [entries, collectionName]);
  const [selected, setSelected] = useState(sections[0]?.id ?? "");
  const [group, setGroup] = useState<"team" | "series">("team");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mode, setMode] = useState<"all" | "missing" | "owned">("all");
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    setSelected(sections[0]?.id ?? "");
    setGroup("team");
    setQuery("");
    setMode("all");
    setPage(0);
    setMarked({});
  }, [collectionName, sections]);
  const section = sections.find((t) => t.id === selected);
  const own = new Map(inventory.map((i) => [i.sticker_id, i]));
  const quantity = (s: Sticker) =>
    reference && !local
      ? marked[s.id]
        ? 1
        : 0
      : (own.get(s.id)?.quantity ?? 0);
  const rows = entries.filter((s) => sectionOf(s) === selected);
  const count = rows.filter((s) => quantity(s) > 0).length;
  const albumOwned = entries.filter((s) => quantity(s) > 0).length;
  const visible = rows.filter(
    (s) =>
      (mode === "all" ||
        (mode === "missing" ? quantity(s) === 0 : quantity(s) > 0)) &&
      `${s.official_code} ${s.name}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  const colours = clubColours[selected] ?? ["#e1795c", "#df6e9e"];
  const choose = (id: string) => {
    setSelected(id);
    setSearchOpen(false);
    setPage(0);
    setQuery("");
    setMode("all");
  };
  const open = (s: Sticker) => {
    if (local) {
      const q = quantity(s);
      if (q > 1) onNavigate("repetidos");
      else void onQuantity(s, q ? -1 : 1).catch(() => {});
      return;
    }
    if (reference) {
      if (!visitor) {
        setAnnouncement(
          "Espera a que termine de cargar el álbum de tu cuenta.",
        );
        return;
      }
      setMarked((v) => ({ ...v, [s.id]: !v[s.id] }));
      setAnnouncement(
        `${s.name}: ${marked[s.id] ? "sin marcar" : "marcado en esta visita"}`,
      );
    } else if (quantity(s) > 1) onNavigate("repetidos");
    else void onQuantity(s, quantity(s) ? -1 : 1).catch(() => {});
  };
  return (
    <section
      className={`visual-album ${group === "team" ? "team-page" : "specials-page"}`}
      aria-label="Álbum visual por equipos"
      style={
        { "--club-a": colours[0], "--club-b": colours[1] } as CSSProperties
      }
    >
      {group === "team" && (
        <div className="team-pitch" aria-hidden="true">
          <div className="pitch-perimeter">
            <i className="pitch-half" />
            <i className="pitch-circle" />
            <i className="pitch-box top" />
            <i className="pitch-box bottom" />
          </div>
        </div>
      )}
      <div className="album-topline">
        <span className="album-season">
          {collectionName ?? "LaLiga ESTE · 2026 / 27"}
        </span>
        <span className="album-dot" />
        <span>{reference ? "Catálogo de consulta" : "Tu colección"}</span>
      </div>
      <div
        className="album-groups"
        role="group"
        aria-label="Apartados del álbum"
      >
        {[
          { id: "team", label: "Equipos" },
          { id: "series", label: "Especiales" },
        ].map((g) => (
          <button
            key={g.id}
            aria-label={`${g.label} ${sections.filter((s) => s.kind === g.id).length}`}
            aria-pressed={group === g.id}
            className={group === g.id ? "selected" : ""}
            onClick={() => {
              setGroup(g.id as typeof group);
              choose(sections.find((s) => s.kind === g.id)?.id ?? "");
            }}
          >
            {g.label}
            <span>{sections.filter((s) => s.kind === g.id).length}</span>
          </button>
        ))}
      </div>
      <div
        className="team-strip"
        role="group"
        aria-label={
          group === "team" ? "Equipos del álbum" : "Series especiales del álbum"
        }
      >
        {sections
          .filter((t) => t.kind === group)
          .map((t) => (
            <button
              className={`team-choice ${selected === t.id ? "selected" : ""}`}
              key={t.id}
              aria-label={`Ver ${t.name}`}
              aria-pressed={selected === t.id}
              onClick={() => choose(t.id)}
            >
              {group === "team" ? (
                <TeamBadge short={t.short} teamId={t.id} />
              ) : (
                <span
                  className={`series-icon finish-${t.id.replace("extra-oro", "gold").replace("extra-plata", "silver").replace("extra-bronce", "bronze").replace("adn-prime", "prime").replace("draft-kromix", "kromix").replace("top-fichajes", "signing")}`}
                  aria-hidden="true"
                >
                  <i />
                  <strong>{t.short}</strong>
                </span>
              )}
              <span>
                {t.name
                  .replace("Atlético de Madrid", "Atlético")
                  .replace("Deportivo Alavés", "Alavés")
                  .replace("Athletic Club", "Athletic")
                  .replace("FC Barcelona", "Barcelona")
                  .replace("Racing de Santander", "Racing")
                  .replace("Extra Sticker ", "Extra ")
                  .replace("Draft 23 Kromix", "Kromix")}
              </span>
              <i />
            </button>
          ))}
      </div>
      <div className="album-team-heading">
        <div>
          <span className="eyebrow">
            {group === "team"
              ? "TU EQUIPO, CROMO A CROMO"
              : "LAS SERIES DEL ÁLBUM"}
          </span>
          <h2>{section?.name ?? "Elige un apartado"}</h2>
          <p>
            {reference
              ? "Nombres y numeración de los listados consultados."
              : "Toca los que tienes para completar tu página."}
          </p>
        </div>
        {section && <TeamBadge short={section.short} teamId={section.id} />}
      </div>
      <p className="album-total-progress">
        Tu colección: {albumOwned} de {entries.length} cromos ·{" "}
        {entries.length ? Math.round((albumOwned / entries.length) * 100) : 0}%
        del total
      </p>
      <div className="album-progress">
        <span>
          <strong>{count}</strong>
          <span> / {rows.length}</span>{" "}
          {local
            ? "cromos en tu álbum"
            : reference
              ? "marcados en esta visita"
              : "conseguidos"}
        </span>
        <span>
          {rows.length ? Math.round((count / rows.length) * 100) : 0}%
          {group === "team" ? " del equipo" : " de esta serie"}
        </span>
        <progress
          aria-label={
            local
              ? "Progreso del equipo"
              : reference
                ? "Cromos marcados en esta visita"
                : "Progreso del equipo"
          }
          max={Math.max(1, rows.length)}
          value={count}
        />
      </div>
      <div className="album-controls">
        <div className="album-segments" aria-label="Filtrar casilleros">
          {[
            { id: "all", label: "Todos" },
            { id: "missing", label: "Me faltan" },
            { id: "owned", label: "Los tengo" },
          ].map((m) => (
            <button
              key={m.id}
              aria-pressed={mode === m.id}
              className={mode === m.id ? "selected" : ""}
              onClick={() => {
                setMode(m.id as typeof mode);
                setPage(0);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          className="album-search-toggle secondary"
          aria-label="Buscar en este apartado"
          aria-expanded={searchOpen}
          onClick={() => {
            setSearchOpen((v) => !v);
            setQuery("");
            setPage(0);
          }}
        >
          <Search size={18} />
        </button>
        {onScan && (
          <button
            className="album-camera-button secondary"
            aria-label="Reconocer cromos con la cámara"
            onClick={onScan}
          >
            <Camera size={18} />
          </button>
        )}
        {searchOpen && (
          <label className="album-search">
            <Search size={17} />
            <input
              aria-label="Buscar cromo"
              value={query}
              placeholder="Número o nombre"
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
        )}
      </div>
      {reference && (
        <p className="album-preview-note">
          <Info size={14} />
          {local
            ? "Guardado en este dispositivo · Catálogo de consulta."
            : visitor
              ? "Prueba del catálogo · Tus marcas no se guardan."
              : "Catálogo de consulta · Aún sin activar el inventario."}
        </p>
      )}
      {!reference && collectionName?.includes("2026") && (
        <p className="album-preview-note">
          <Info size={14} />
          Guardado en tu cuenta · Catálogo parcial: 7 cromos pendientes de
          revisión.
        </p>
      )}
      <div className="album-slots">
        {visible.slice(page * 48, (page + 1) * 48).map((s) => {
          const i = own.get(s.id);
          const q = quantity(s);
          const review = s.catalog_review === "needs_review";
          const photo = playerPhoto(s);
          return (
            <article
              className={`album-slot finish-${cardFinish(s)} real-slot ${reference ? "reference-slot" : ""} ${q ? "unlocked" : ""} ${review ? "needs-review" : ""}`}
              key={s.id}
            >
              <button
                className="slot-main"
                disabled={busy && (!reference || local)}
                aria-label={
                  reference
                    ? q > 1
                      ? `Gestionar repetidos de ${s.name}`
                      : `${q ? "Desmarcar" : "Marcar"} ${s.name}, número ${s.official_code}`
                    : q > 1
                      ? `Gestionar repetidos de ${s.name}`
                      : q === 1
                        ? `Desmarcar ${s.name}, código ${s.official_code}`
                        : `Desbloquear ${s.name}, código ${s.official_code}`
                }
                aria-pressed={q > 0}
                onClick={() => open(s)}
              >
                <span className="slot-kicker">
                  {isFeatured(s) && (
                    <span className="slot-series">Destacado NEXO</span>
                  )}
                  {s.sticker_series?.name ? (
                    <span className="slot-series">{s.sticker_series.name}</span>
                  ) : null}
                  {s.edition
                    .replace(" edición", "")
                    .replace("Edición por confirmar", "ED. ?")}
                </span>
                <strong className="slot-number">{s.official_code}</strong>
                {photo ? (
                  <PlayerPortrait photo={photo} />
                ) : (
                  <span className="slot-symbol">
                    <TeamBadge
                      short={section?.short ?? "CM"}
                      teamId={section?.id}
                    />
                    {s.name !== "Escudo" && (
                      <span className="slot-photo-pending">
                        Retrato pendiente
                      </span>
                    )}
                  </span>
                )}
                {s.teams && s.name !== "Escudo" && (
                  <span className="slot-club-badge">
                    <TeamBadge
                      teamId={teamKey(s.teams.name)}
                      short={s.teams.name.slice(0, 3).toUpperCase()}
                    />
                  </span>
                )}
                <span className="slot-caption">{s.name}</span>
                <span className="slot-corner">
                  {q ? (
                    <Check size={13} />
                  ) : (
                    <span className="slot-empty-dot" />
                  )}
                </span>
                {review && <span className="slot-review">Revisar</span>}
              </button>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="album-empty">
          <Sparkles size={28} />
          <h3>
            {rows.length
              ? "No hay cromos con estos filtros"
              : "Este apartado está pendiente de revisión"}
          </h3>
          <p>
            {rows.length
              ? "Prueba otra búsqueda o vuelve a Todos."
              : "Este apartado todavía no tiene cromos publicados en la base de datos."}
          </p>
        </div>
      )}
      {visible.length > 48 && (
        <div className="pagination">
          <button
            className="secondary"
            disabled={page === 0}
            onClick={() => setPage((v) => v - 1)}
          >
            <ArrowLeft size={16} /> Anterior
          </button>
          <span>
            {page + 1}/{Math.ceil(visible.length / 48)}
          </span>
          <button
            className="secondary"
            disabled={(page + 1) * 48 >= visible.length}
            onClick={() => setPage((v) => v + 1)}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}
      {reference && (
        <details className="catalogue-review">
          <summary>
            Sobre el listado · {catalogueSummary.total} registros /{" "}
            {catalogueSummary.sections} apartados <ChevronRight size={14} />
          </summary>
          <p>
            Listado de consulta contrastado en Cromolista, Stickers.app y De
            Cromos con JR. {catalogueSummary.review} registros necesitan
            revisión. Las fuentes discrepan en algunos sufijos y en Top
            Fichajes; no asignamos números definitivos a esos casos. Los Extra
            Sticker sin número impreso aparecen como S/N.
          </p>
          <p>
            <a
              href={catalogueSummary.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir el listado de Panini · 4ª edición ↗
            </a>
          </p>
          <p>
            El PDF oficial de Panini no ha podido comprobarse. No se garantiza
            todavía que el catálogo oficial esté completo y no se ha publicado
            en los inventarios. Los huecos sin jugador no se cuentan como
            cromos.
          </p>
          <p>
            Retratos de FootyLogos, LaLiga y las webs oficiales de los clubes.
            Algunas fotos corresponden a temporadas anteriores; puedes consultar
            la temporada de cada retrato en su detalle. Si no hay una imagen
            identificada, el casillero muestra «Retrato pendiente».
          </p>
          <p>
            {local
              ? "Las cantidades se conservan en este navegador. No se sincronizan con otros dispositivos ni con cuentas de amigos."
              : "Las marcas de esta visita solo sirven para probar el diseño y se reinician al salir del álbum."}
          </p>
        </details>
      )}
      <div className="album-shortcuts">
        <button className="secondary" onClick={() => onNavigate("repetidos")}>
          Mis repetidos ·{" "}
          {inventory
            .filter((i) => stickers.some((s) => s.id === i.sticker_id))
            .reduce((sum, i) => sum + available(i), 0)}
          <ChevronRight size={15} />
        </button>
        <button className="secondary" onClick={() => onNavigate("faltantes")}>
          Ver todos mis faltantes <ChevronRight size={15} />
        </button>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}
