"use client";
import { useRef, useState } from "react";
import type { Inventory, Sticker } from "@/lib/domain";
import { DuplicateEntryError } from "@/lib/duplicate-entry";
import { VisualAlbum, type AlbumTarget } from "./visual-album";

export function DuplicateAlbum({
  stickers,
  inventory,
  busy,
  visitor,
  collectionName,
  onAdd,
  onRemove,
  onScan,
  duplicates = true,
  onQuantity,
  onNavigate,
  onOwnedList,
  target,
  viewKey,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  busy: boolean;
  visitor: boolean;
  collectionName?: string;
  onAdd: (s: Sticker, extras: number, operation: string) => Promise<void>;
  onRemove: (s: Sticker) => Promise<void>;
  onScan: () => void;
  duplicates?: boolean;
  onQuantity?: (s: Sticker, delta: number) => Promise<void>;
  onNavigate?: (s: "repetidos" | "faltantes") => void;
  onOwnedList?: () => void;
  target?: AlbumTarget | null;
  viewKey?: string;
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
    <div
      className={
        duplicates ? "duplicate-album-entry" : "collection-album-entry"
      }
    >
      {duplicates && (
        <p className="duplicate-album-instructions">
          Toca una casilla para añadir un repetido. Usa − para quitarlo. Siempre
          conservas una copia para el álbum.
        </p>
      )}
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
      <p
        role="status"
        className={duplicates ? "duplicate-album-status" : "sr-only"}
      >
        {pending ? "Guardando repetido…" : message}
      </p>
      <VisualAlbum
        stickers={stickers}
        inventory={inventory}
        busy={busy || pending || Boolean(failed)}
        visitor={visitor}
        local={visitor}
        collectionName={collectionName}
        duplicates={duplicates}
        target={target}
        viewKey={viewKey}
        onOwnedList={onOwnedList}
        onAddDuplicate={
          duplicates
            ? undefined
            : (s) => add({ sticker: s, operation: crypto.randomUUID() })
        }
        onScan={onScan}
        onNavigate={onNavigate ?? (() => {})}
        onQuantity={async (s, delta) => {
          if (!duplicates && onQuantity) {
            await onQuantity(s, delta);
            return;
          }
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
