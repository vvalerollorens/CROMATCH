"use client";
import { useRef, useState, type FormEvent } from "react";
import { Camera, Check, Search, X } from "lucide-react";
import type { Inventory, Sticker } from "@/lib/domain";
import {
  duplicateAddition,
  duplicateMatches,
  DuplicateEntryError,
} from "@/lib/duplicate-entry";
import { playerPhoto } from "@/lib/player-photos";

type Attempt = { sticker: Sticker; extras: number; operation: string };
export function DuplicateEntry({
  stickers,
  inventory,
  busy,
  onAdd,
  onScan,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  busy: boolean;
  onAdd: (sticker: Sticker, extras: number, operation: string) => Promise<void>;
  onScan: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const saving = useRef(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [amount, setAmount] = useState("1");
  const [limit, setLimit] = useState(12);
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState<Attempt | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const own = new Map(inventory.map((row) => [row.sticker_id, row]));
  const teams = [
    ...new Set(stickers.flatMap((s) => (s.teams ? [s.teams.name] : []))),
  ];
  const series = [
    ...new Set(
      stickers.flatMap((s) =>
        s.sticker_series ? [s.sticker_series.name] : [],
      ),
    ),
  ];
  const matches = duplicateMatches(stickers, query, group);
  const extras = Number(amount);
  const valid = Number.isInteger(extras) && extras >= 1 && extras <= 99;

  async function save(attempt: Attempt) {
    if (saving.current || busy) return;
    saving.current = true;
    setPending(attempt.sticker.id);
    setError("");
    setMessage("");
    const submittedQuery = query;
    try {
      await onAdd(attempt.sticker, attempt.extras, attempt.operation);
      setAmount((value) => (Number(value) === attempt.extras ? "1" : value));
      setMessage(
        `${attempt.sticker.name}: +${attempt.extras} ${attempt.extras === 1 ? "repetido guardado" : "repetidos guardados"}.`,
      );
      setFailed((v) => (v?.sticker.id === attempt.sticker.id ? null : v));
      setRecent((v) =>
        [
          attempt.sticker.id,
          ...v.filter((id) => id !== attempt.sticker.id),
        ].slice(0, 4),
      );
      // Enter keeps the keyboard ready for the next number without moving focus.
      if (
        document.activeElement === input.current &&
        input.current?.value === submittedQuery
      )
        input.current.select();
    } catch (e) {
      const retry = !(e instanceof DuplicateEntryError) || e.retryRequired;
      setFailed(retry ? attempt : null);
      setError(
        retry
          ? `No se ha podido confirmar ${attempt.sticker.name} (+${attempt.extras}). Reintenta esta misma entrada para comprobar su guardado.`
          : (e as Error).message,
      );
    } finally {
      saving.current = false;
      setPending(null);
    }
  }
  function add(sticker: Sticker) {
    if (failed?.sticker.id === sticker.id) return void save(failed);
    try {
      duplicateAddition(own.get(sticker.id)?.quantity ?? 0, extras);
      void save({ sticker, extras, operation: crypto.randomUUID() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revisa la cantidad.");
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (failed) {
      setMessage(
        `Confirma antes la entrada pendiente de ${failed.sticker.name}.`,
      );
      return;
    }
    if (saving.current || busy) {
      setMessage(
        "Se está guardando la entrada anterior. Tu búsqueda se mantiene para continuar.",
      );
      return;
    }
    if (matches.length === 1 && valid) add(matches[0]);
    else if (matches.length > 1)
      setMessage(
        "Hay varias coincidencias: elige el equipo o el cromo que quieres añadir.",
      );
  }
  return (
    <section
      className="panel duplicate-entry"
      aria-label="Entrada rápida de repetidos"
    >
      <div className="section-heading">
        <div>
          <h2>Añadir repetidos</h2>
          <p>Busca, indica cuántos añades y sigue con el siguiente.</p>
        </div>
        <button type="button" className="text-button" onClick={onScan}>
          <Camera size={16} /> Foto
        </button>
      </div>
      <form onSubmit={submit} className="duplicate-entry-controls">
        <label>
          Equipo o apartado
          <select
            aria-label="Equipo para añadir repetidos"
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setLimit(12);
            }}
          >
            <option value="">Todos los equipos y especiales</option>
            <optgroup label="Equipos">
              {teams.map((team) => (
                <option key={team} value={`team:${team}`}>
                  {team}
                </option>
              ))}
            </optgroup>
            <optgroup label="Especiales">
              {series.map((name) => (
                <option key={name} value={`series:${name}`}>
                  {name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="duplicate-entry-search">
          Nombre o número
          <span className="search-field">
            <Search size={18} />
            <input
              ref={input}
              aria-label="Buscar repetido por nombre o número"
              value={query}
              placeholder="Ej. Sivera, 13B, 5 Bis…"
              autoComplete="off"
              enterKeyHint="go"
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(12);
              }}
            />
            {query && (
              <button
                type="button"
                className="icon-button"
                aria-label="Limpiar búsqueda de repetidos"
                onClick={() => {
                  setQuery("");
                  input.current?.focus({ preventScroll: true });
                }}
              >
                <X size={16} />
              </button>
            )}
          </span>
        </label>
        <label className="duplicate-entry-amount">
          Repetidos a añadir
          <input
            type="number"
            aria-label="Repetidos a añadir"
            inputMode="numeric"
            min={1}
            max={99}
            step={1}
            value={amount}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <button type="submit" className="sr-only" tabIndex={-1}>
          Añadir coincidencia única
        </button>
      </form>
      <p className="duplicate-entry-hint">
        Son copias extra: siempre conservas una para tu álbum. Si hay una sola
        coincidencia, puedes añadirla pulsando Intro.
      </p>
      {matches.length > 0 && (
        <p className="results-count">
          {matches.length}{" "}
          {matches.length === 1 ? "coincidencia" : "coincidencias"}
        </p>
      )}
      <div className="duplicate-entry-results">
        {matches.slice(0, limit).map((sticker) => {
          const row = own.get(sticker.id);
          const q = row?.quantity ?? 0;
          const photo = playerPhoto(sticker);
          return (
            <article className="duplicate-entry-row" key={sticker.id}>
              <div className="quick-avatar">
                {photo ? (
                  <img
                    src={photo.src}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                ) : (
                  <span>{sticker.name.slice(0, 1)}</span>
                )}
              </div>
              <div className="duplicate-entry-name">
                <strong>{sticker.name}</strong>
                <small>
                  #{sticker.official_code} ·{" "}
                  {[
                    sticker.teams?.name,
                    sticker.sticker_series?.name,
                    sticker.edition,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                <span>
                  {q
                    ? `${Math.max(0, q - 1)} repetidos${row?.reserved ? ` · ${row.reserved} reservados` : ""}`
                    : "También se guardará tu copia del álbum"}
                </span>
              </div>
              <button
                type="button"
                disabled={
                  busy ||
                  pending !== null ||
                  !valid ||
                  q >= 999 ||
                  Boolean(failed)
                }
                aria-label={`Añadir ${extras} ${extras === 1 ? "repetido" : "repetidos"} de ${sticker.name}, ${sticker.official_code}`}
                onClick={() => add(sticker)}
              >
                {pending === sticker.id
                  ? "Guardando…"
                  : `+${valid ? extras : "?"}`}
              </button>
            </article>
          );
        })}
        {matches.length > limit && (
          <button
            type="button"
            className="text-button"
            onClick={() => setLimit((v) => v + 20)}
          >
            Ver más coincidencias
          </button>
        )}
        {!matches.length && (
          <p>
            {query.trim() || group
              ? "Sin coincidencias. Prueba otro nombre, número o equipo."
              : "Elige equipo o escribe un nombre o número para empezar."}
          </p>
        )}
      </div>
      <p role="status" aria-live="polite" className="duplicate-entry-status">
        {message && (
          <>
            <Check size={15} /> {message}
          </>
        )}
      </p>
      {error && (
        <div className="duplicate-entry-error" role="alert">
          <p>{error}</p>
          {failed && (
            <button
              type="button"
              className="secondary"
              disabled={busy || pending !== null}
              onClick={() => void save(failed)}
            >
              Reintentar +{failed.extras} de {failed.sticker.name}
            </button>
          )}
        </div>
      )}
      {recent.length > 0 && (
        <div className="duplicate-entry-recent">
          <span>Últimos añadidos</span>
          {recent.map((id) => {
            const sticker = stickers.find((s) => s.id === id);
            return sticker ? (
              <button
                type="button"
                key={id}
                className="secondary"
                onClick={() => {
                  setGroup(
                    sticker.teams
                      ? `team:${sticker.teams.name}`
                      : sticker.sticker_series
                        ? `series:${sticker.sticker_series.name}`
                        : "",
                  );
                  setQuery(sticker.official_code);
                  setLimit(12);
                  input.current?.focus({ preventScroll: true });
                }}
              >
                #{sticker.official_code} · {sticker.name}
              </button>
            ) : null;
          })}
        </div>
      )}
    </section>
  );
}
