"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Grid2X2,
  LockKeyhole,
  Minus,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { available, type Inventory, type Sticker } from "@/lib/domain";
import { seasonTeams, teamKey } from "@/lib/teams";
export function TeamBadge({ short }: { short: string }) {
  return (
    <span className="team-badge" aria-hidden="true">
      <svg viewBox="0 0 48 56" fill="none">
        <path
          d="M24 3 43 10v18c0 11-10 19-19 25C15 47 5 39 5 28V10L24 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12 16h24M13 38l11 8 11-8"
          stroke="currentColor"
          strokeWidth="1"
          opacity=".35"
        />
      </svg>
      <span>{short}</span>
    </span>
  );
}
export function VisualAlbum({
  stickers,
  inventory,
  visitor,
  busy,
  collectionName,
  onQuantity,
  onDetail,
  onNavigate,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  visitor: boolean;
  busy: boolean;
  collectionName?: string;
  onQuantity: (s: Sticker, d: number) => Promise<void>;
  onDetail: (s: Sticker) => void;
  onNavigate: (s: "repetidos" | "faltantes") => void;
}) {
  const teams = useMemo(() => {
    const roster =
      !collectionName || collectionName.includes("2026") ? seasonTeams : [];
    const result = [...roster];
    for (const s of stickers) {
      const name = s.teams?.name ?? "Series especiales";
      const id = teamKey(name);
      if (!result.some((t) => t.id === id))
        result.push({
          id,
          name,
          short: name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 3)
            .toUpperCase(),
        });
    }
    return result;
  }, [stickers, collectionName]);
  const [selected, setSelected] = useState(teams[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "missing" | "owned">("all");
  const [preview, setPreview] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    setSelected(teams[0]?.id ?? "");
    setQuery("");
    setMode("all");
    setPage(0);
    setPreview({});
  }, [collectionName, teams]);
  const team = teams.find((t) => t.id === selected);
  const own = new Map(inventory.map((i) => [i.sticker_id, i]));
  const rows = stickers.filter(
    (s) =>
      (s.teams?.name ? teamKey(s.teams.name) : "series especiales") ===
      selected,
  );
  const owned = rows.filter((s) => (own.get(s.id)?.quantity ?? 0) > 0).length;
  const visible = rows.filter(
    (s) =>
      (mode === "all" ||
        (mode === "missing"
          ? !own.get(s.id)?.quantity
          : (own.get(s.id)?.quantity ?? 0) > 0)) &&
      `${s.official_code} ${s.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const previewRows = Array.from(
    { length: 12 },
    (_, index) => `${selected}:${index}`,
  );
  const previewOwned = previewRows.filter((id) => preview[id]).length;
  const showPreview = visitor && rows.length === 0;
  const total = showPreview ? 12 : rows.length;
  const count = showPreview ? previewOwned : owned;
  const choose = (id: string) => {
    setSelected(id);
    setPage(0);
    setQuery("");
    setMode("all");
  };
  return (
    <section className="visual-album" aria-label="Álbum visual por equipos">
      <div className="album-topline">
        <span className="album-season">
          {collectionName ?? "Temporada 2026 / 27"}
        </span>
        <span className="album-dot" /> <span>Tu colección</span>
      </div>
      <div className="team-strip" role="group" aria-label="Equipos del álbum">
        {teams.map((t) => (
          <button
            className={`team-choice ${selected === t.id ? "selected" : ""}`}
            key={t.id}
            aria-label={`Ver ${t.name}`}
            aria-pressed={selected === t.id}
            onClick={() => choose(t.id)}
          >
            <TeamBadge short={t.short} />
            <span>
              {t.name
                .replace("RCD Espanyol de Barcelona", "Espanyol")
                .replace("Atlético de Madrid", "Atlético")
                .replace("Deportivo Alavés", "Alavés")
                .replace("Athletic Club", "Athletic")
                .replace("FC Barcelona", "Barcelona")
                .replace("R. Racing Club", "Racing")
                .replace("RC Deportivo", "Deportivo")}
            </span>
            <i />
          </button>
        ))}
      </div>
      <div className="album-team-heading">
        <div>
          <span className="eyebrow">TU EQUIPO, CROMO A CROMO</span>
          <h2>{team?.name ?? "Elige un equipo"}</h2>
          <p>
            {showPreview
              ? "Toca un casillero y prueba a desbloquearlo."
              : "Toca los que tienes para completar tu página."}
          </p>
        </div>
        {team && <TeamBadge short={team.short} />}
      </div>
      <div className="album-progress">
        <span>
          <strong>{count}</strong>
          <span> / {total}</span>{" "}
          {showPreview ? "abiertos en la prueba" : "conseguidos"}
        </span>
        <span>{total ? Math.round((count / total) * 100) : 0}%</span>
        <progress
          aria-label={
            showPreview
              ? "Casilleros abiertos en la prueba"
              : "Progreso del equipo"
          }
          max={Math.max(1, total)}
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
        {!showPreview && (
          <label className="album-search">
            <Search size={17} />
            <input
              aria-label="Buscar cromo"
              value={query}
              placeholder="Buscar número o nombre"
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
        )}
      </div>
      {showPreview && (
        <p className="album-preview-note">
          <Sparkles size={14} /> Prueba visual · Sin numeración oficial. Se
          reinicia al salir.
        </p>
      )}
      <div className="album-slots">
        {showPreview
          ? previewRows
              .filter(
                (id) =>
                  mode === "all" ||
                  (mode === "owned" ? preview[id] : !preview[id]),
              )
              .map((id) => {
                const index = previewRows.indexOf(id);
                const unlocked = Boolean(preview[id]);
                return (
                  <button
                    key={id}
                    className={`album-slot preview-slot ${unlocked ? "unlocked" : ""}`}
                    aria-label={`Casillero de prueba ${index + 1}, ${unlocked ? "desbloqueado" : "bloqueado"}`}
                    aria-pressed={unlocked}
                    onClick={() => {
                      setPreview((v) => ({ ...v, [id]: !v[id] }));
                      setAnnouncement(
                        unlocked
                          ? "Casillero de prueba bloqueado"
                          : "Casillero de prueba desbloqueado",
                      );
                    }}
                  >
                    <span className="slot-kicker">VISTA PREVIA</span>
                    <span className="slot-symbol">
                      {unlocked ? (
                        <TeamBadge short={team?.short ?? "CM"} />
                      ) : (
                        <LockKeyhole size={25} />
                      )}
                    </span>
                    <span className="slot-caption">
                      {unlocked ? "Lo tengo" : "Toca para abrir"}
                    </span>
                    <span className="slot-corner">
                      {unlocked ? <Check size={13} /> : <Plus size={13} />}
                    </span>
                  </button>
                );
              })
          : visible.slice(page * 48, (page + 1) * 48).map((s) => {
              const i = own.get(s.id);
              const q = i?.quantity ?? 0;
              return (
                <article
                  className={`album-slot real-slot ${q ? "unlocked" : ""}`}
                  key={s.id}
                >
                  <button
                    className="slot-main"
                    disabled={busy}
                    aria-label={
                      q
                        ? `Ver ${s.name}, ${q} unidades`
                        : `Desbloquear ${s.name}, código ${s.official_code}`
                    }
                    aria-pressed={q > 0}
                    onClick={() => {
                      if (q) onDetail(s);
                      else void onQuantity(s, 1);
                    }}
                  >
                    <span className="slot-kicker">{s.official_code}</span>
                    <span className="slot-symbol">
                      {q ? (
                        <TeamBadge short={team?.short ?? "CM"} />
                      ) : (
                        <LockKeyhole size={25} />
                      )}
                    </span>
                    <span className="slot-caption">{s.name}</span>
                    <span className="slot-corner">
                      {q ? <Check size={13} /> : <Plus size={13} />}
                    </span>
                  </button>
                  {q > 0 && (
                    <div className="slot-counter">
                      <button
                        disabled={
                          busy || (i?.reserved ?? 0) > Math.max(q - 2, 0)
                        }
                        onClick={() => void onQuantity(s, -1)}
                        aria-label={`Quitar una unidad de ${s.name}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span>
                        {q}
                        <small>
                          {q > 1 ? ` · ${available(i)} libres` : ""}
                        </small>
                      </span>
                      <button
                        disabled={busy}
                        onClick={() => void onQuantity(s, 1)}
                        aria-label={`Añadir una unidad de ${s.name}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
      </div>
      {!showPreview && !visible.length && (
        <div className="album-empty">
          <Shield size={30} />
          <h3>
            {rows.length
              ? "No hay cromos con estos filtros"
              : "El catálogo está esperando su primer cromo verificado"}
          </h3>
          <p>
            {rows.length
              ? "Prueba otra búsqueda."
              : "Los cromos publicados aparecerán aquí cuando se verifique el catálogo de este equipo."}
          </p>
        </div>
      )}
      {showPreview &&
        previewRows.filter(
          (id) =>
            mode === "all" || (mode === "owned" ? preview[id] : !preview[id]),
        ).length === 0 && (
          <p className="album-empty">
            {mode === "owned"
              ? "Toca un casillero en Todos para probar el álbum."
              : "Ya has abierto todos los casilleros de prueba de este equipo."}
          </p>
        )}
      {visible.length > 48 && !showPreview && (
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
      <div className="album-shortcuts">
        <button className="secondary" onClick={() => onNavigate("repetidos")}>
          Mis repetidos ·{" "}
          {inventory
            .filter((i) => stickers.some((s) => s.id === i.sticker_id))
            .reduce((sum, i) => sum + available(i), 0)}{" "}
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
