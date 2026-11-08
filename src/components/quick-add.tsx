"use client";
import { useMemo, useState } from "react";
import { Camera, Minus, Plus, Search, X } from "lucide-react";
import { available, type Inventory, type Sticker } from "@/lib/domain";
import { Dialog } from "./dialog";
import { playerPhoto } from "@/lib/player-photos";
const clean = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function QuickAdd({
  stickers,
  inventory,
  onAdd,
  close,
  scan,
  duplicates = false,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  onAdd: (s: Sticker, delta: number) => Promise<void>;
  close: () => void;
  scan: () => void;
  duplicates?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const rows = new Map(inventory.map((i) => [i.sticker_id, i]));
  const own = new Map(inventory.map((i) => [i.sticker_id, i.quantity]));
  const results = useMemo(
    () =>
      stickers
        .filter((s) =>
          clean(
            `${s.name} ${s.official_code} ${s.teams?.name ?? ""} ${s.sticker_series?.name ?? ""}`,
          ).includes(clean(query.trim())),
        )
        .slice(0, 40),
    [query, stickers],
  );
  async function add(s: Sticker, delta: number) {
    setPending(s.id);
    setMessage("");
    try {
      await onAdd(s, delta);
      setMessage(`${s.name}: cantidad actualizada.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setPending(null);
    }
  }
  return (
    <Dialog
      titleId="quick-add-title"
      close={close}
      className="quick-add-dialog"
    >
      <button
        className="icon-button close"
        aria-label="Cerrar búsqueda"
        onClick={close}
      >
        <X />
      </button>
      <span className="eyebrow">Tu próxima pieza</span>
      <h2 id="quick-add-title">
        {duplicates ? "Añadir repetidos" : "Añadir cromos"}
      </h2>
      <p>
        {duplicates
          ? "Busca el nombre y registra las copias que tienes para cambiar. Tu copia del álbum se conserva."
          : "Busca el nombre. La primera copia va al álbum; las siguientes son repetidos."}
      </p>
      <label className="quick-search">
        <Search size={19} />
        <input
          autoFocus
          aria-label="Buscar para añadir"
          placeholder="Jugador, entrenador, número o equipo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <button className="secondary quick-scan" onClick={scan}>
        <Camera size={18} /> Reconocer una foto
      </button>
      <p role="status" aria-live="polite" className="quick-status">
        {message}
      </p>
      <div className="quick-results">
        {results.map((s) => {
          const q = own.get(s.id) ?? 0;
          const photo = playerPhoto(s);
          return (
            <article className="quick-row" key={s.id}>
              <div className="quick-avatar">
                {photo ? (
                  <img
                    src={photo.src}
                    alt=""
                    loading="lazy"
                    width={48}
                    height={48}
                  />
                ) : (
                  <span>{s.name.slice(0, 1)}</span>
                )}
              </div>
              <div>
                <strong>{s.name}</strong>
                <small>
                  #{s.official_code} · {s.teams?.name ?? s.sticker_series?.name}
                </small>
                <span>
                  {q
                    ? `${q} en total · ${Math.max(0, q - 1)} repetidos`
                    : duplicates
                      ? "Se guardará 1 para el álbum y 1 repetido"
                      : "Te falta"}
                </span>
              </div>
              <div className="quick-stepper">
                <button
                  className="secondary"
                  aria-label={`${duplicates ? "Quitar un repetido" : "Quitar una unidad"} de ${s.name}, ${s.official_code}`}
                  disabled={
                    pending !== null ||
                    (duplicates ? available(rows.get(s.id)) < 1 : !q)
                  }
                  onClick={() => void add(s, -1)}
                >
                  <Minus size={16} />
                </button>
                <output
                  aria-label={`${duplicates ? "Repetidos" : "Cantidad"} de ${s.name}, ${s.official_code}`}
                >
                  {duplicates ? Math.max(0, q - 1) : q}
                </output>
                <button
                  aria-label={`${duplicates ? "Añadir un repetido" : "Añadir una unidad"} de ${s.name}, ${s.official_code}`}
                  disabled={pending !== null || q >= 999}
                  onClick={() => void add(s, duplicates && !q ? 2 : 1)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </article>
          );
        })}
        {!results.length && (
          <p>No hay coincidencias. Prueba otro nombre o número.</p>
        )}
      </div>
    </Dialog>
  );
}
