"use client";
import { useRef, useState } from "react";
import type { Inventory, Sticker } from "@/lib/domain";
import { DuplicateEntryError } from "@/lib/duplicate-entry";
import { VisualAlbum } from "./visual-album";

export function DuplicateAlbum({
  stickers,
  inventory,
  busy,
  visitor,
  collectionName,
  onAdd,
  onRemove,
  onScan,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  busy: boolean;
  visitor: boolean;
  collectionName?: string;
  onAdd: (s: Sticker, extras: number, operation: string) => Promise<void>;
  onRemove: (s: Sticker) => Promise<void>;
  onScan: () => void;
}) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<{
    sticker: Sticker;
    operation: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function add(attempt: { sticker: Sticker; operation: string }) {
    if (lock.current || busy) return;
    lock.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      await onAdd(attempt.sticker, 1, attempt.operation);
      setFailed(null);
      setMessage(`${attempt.sticker.name}: un repetido añadido.`);
    } catch (e) {
      setFailed(
        e instanceof DuplicateEntryError && !e.retryRequired ? null : attempt,
      );
      setError(
        e instanceof Error
          ? e.message
          : "No se ha podido confirmar el guardado.",
      );
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <div className="duplicate-album-entry">
      <p className="duplicate-album-instructions">
        Toca una casilla para añadir un repetido. Usa − para quitarlo. Siempre
        conservas una copia para el álbum.
      </p>
      {error && (
        <div className="alert" role="alert">
          {error}
          {failed && (
            <button
              type="button"
              disabled={busy || pending}
              onClick={() => void add(failed)}
            >
              Reintentar repetido de {failed.sticker.name}
            </button>
          )}
        </div>
      )}
      <p role="status" className="duplicate-album-status">
        {pending ? "Guardando repetido…" : message}
      </p>
      <VisualAlbum
        stickers={stickers}
        inventory={inventory}
        busy={busy || pending || Boolean(failed)}
        visitor={visitor}
        local={visitor}
        collectionName={collectionName}
        duplicates
        onScan={onScan}
        onNavigate={() => {}}
        onQuantity={async (s, delta) => {
          if (failed || lock.current || busy) return;
          if (delta > 0)
            await add({ sticker: s, operation: crypto.randomUUID() });
          else {
            lock.current = true;
            setPending(true);
            setError("");
            setMessage("");
            try {
              await onRemove(s);
              setMessage(`${s.name}: un repetido menos.`);
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "No se ha podido quitar el repetido.",
              );
            } finally {
              lock.current = false;
              setPending(false);
            }
          }
        }}
      />
    </div>
  );
}
