"use client";
import { useEffect, useState } from "react";
import { database, download } from "@/lib/supabase";
import type { Inventory } from "@/lib/domain";
type SaveStatus = {
  saved_stickers: number;
  saved_copies: number;
  movements: number;
  last_saved: string | null;
  recoverable_stickers: number;
  outside_catalogue: number;
};
export function AlbumSaveCheck({
  userId,
  username,
  localInventory,
  onRecovered,
}: {
  userId: string;
  username: string;
  localInventory: Inventory[];
  onRecovered: () => Promise<void>;
}) {
  const [status, setStatus] = useState<SaveStatus | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setStatus(null);
    setError("");
    void database()
      .rpc("album_save_status")
      .then(({ data, error }) => {
        if (!active) return;
        if (error)
          setError(
            "No se ha podido comprobar el guardado. Tus datos no se han modificado.",
          );
        else setStatus(data);
      });
    return () => {
      active = false;
    };
  }, [userId]);
  return (
    <section
      className="panel album-save-check"
      aria-label="Revisión de guardado"
    >
      <span className="eyebrow">TU CUENTA · @{username}</span>
      <h2>Revisar mi guardado</h2>
      {!status && !error && (
        <p role="status">Comprobando las marcas guardadas en tu cuenta…</p>
      )}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {status && (
        <>
          <p>
            <strong>
              {status.saved_stickers}{" "}
              {status.saved_stickers === 1
                ? "cromo distinto"
                : "cromos distintos"}
            </strong>{" "}
            · {status.saved_copies} copias guardadas en tu cuenta.
          </p>
          <p>
            {status.movements
              ? `${status.movements} movimientos registrados. Último guardado: ${new Date(status.last_saved!).toLocaleString("es-ES")}.`
              : "Esta cuenta no tiene movimientos de cromos registrados en el servidor."}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() =>
              void navigator.clipboard
                .writeText(
                  JSON.stringify(
                    {
                      cuenta: username,
                      ...status,
                      marcas_en_este_navegador: localInventory.filter(
                        (i) => i.quantity > 0,
                      ).length,
                    },
                    null,
                    2,
                  ),
                )
                .then(() =>
                  setMessage(
                    "Resumen copiado. No contiene contraseñas ni claves de acceso.",
                  ),
                )
                .catch(() =>
                  setError(
                    "No se ha podido copiar el resumen. Puedes consultar las cifras en esta pantalla.",
                  ),
                )
            }
          >
            Copiar resumen del guardado
          </button>
          {status.outside_catalogue > 0 && (
            <p>
              {status.outside_catalogue} cromos se conservan en la cuenta aunque
              no estén en el catálogo visible.
            </p>
          )}
          {status.recoverable_stickers > 0 ? (
            <>
              <p>
                El historial conserva marcas de {status.recoverable_stickers}{" "}
                cromos que no aparecen completas en tu inventario. Puedes
                recuperarlas conservando las cantidades actuales.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void (async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const { data, error } = await database().rpc(
                        "recover_album_from_history",
                      );
                      if (error) throw error;
                      await onRecovered();
                      const next = await database().rpc("album_save_status");
                      if (next.error) throw next.error;
                      setStatus(next.data);
                      setMessage(
                        `${data.recovered_stickers} cromos recuperados desde tu historial.`,
                      );
                    } catch {
                      setError(
                        "No se pudo completar la recuperación. Puedes volver a intentarlo; no se duplicarán las marcas.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                {busy ? "Recuperando…" : "Recuperar marcas del historial"}
              </button>
            </>
          ) : (
            <p>
              El inventario no tiene marcas pendientes de recuperar desde el
              historial.
            </p>
          )}
        </>
      )}
      {localInventory.some((i) => i.quantity > 0) && (
        <div className="device-album-backup">
          <h3>También hay marcas en este navegador</h3>
          <p>
            {localInventory.filter((i) => i.quantity > 0).length} cromos del
            modo visita se conservan en este dispositivo. Son independientes de
            la cuenta y no se han borrado.
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() =>
              download("nexo-marcas-dispositivo.json", {
                version: 1,
                quantities: Object.fromEntries(
                  localInventory.map((i) => [i.sticker_id, i.quantity]),
                ),
              })
            }
          >
            Guardar copia de esas marcas
          </button>
        </div>
      )}
    </section>
  );
}
