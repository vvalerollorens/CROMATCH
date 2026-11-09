"use client";
import { useEffect, useRef, useState } from "react";
import { compare, type Inventory, type Sticker } from "@/lib/domain";
import { database, inventoryFor } from "@/lib/supabase";
import { ArrowRight, Check, Plus } from "lucide-react";
import type { HomeFriend } from "./home-overview";
export function QuickTrade({
  userId,
  friends,
  stickers,
  inventory,
  collection,
  onProfile,
  onSent,
  onViewTrades,
  initialFriendId = "",
}: {
  userId: string;
  friends: HomeFriend[];
  stickers: Sticker[];
  inventory: Inventory[];
  collection: string;
  onProfile: (friend: HomeFriend) => void;
  onSent: () => Promise<void>;
  onViewTrades?: () => void;
  initialFriendId?: string;
}) {
  const [friendId, setFriendId] = useState(initialFriendId);
  const [theirs, setTheirs] = useState<Inventory[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [choices, setChoices] = useState<Record<string, boolean>>({});
  const [refreshRevision, setRefreshRevision] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const operation = useRef<{
    p_id: string;
    p_receiver: string;
    p_collection: string;
    p_items: { giver_id: string; sticker_id: string; quantity: number }[];
  } | null>(null);
  useEffect(() => {
    let active = true;
    setTheirs([]);
    setAllowed(null);
    setChoices({});
    operation.current = null;
    setError("");
    setMessage("");
    if (!friendId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const permission = await database().rpc("can_view_inventory", {
          owner_id: friendId,
        });
        if (permission.error) throw permission.error;
        const rows = permission.data ? await inventoryFor(friendId) : [];
        if (!active) return;
        setAllowed(Boolean(permission.data));
        setTheirs(rows);
        const matched = compare(stickers, inventory, rows);
        setChoices(
          Object.fromEntries([
            ...matched.offer.slice(0, 50).map((s) => [`give:${s.id}`, true]),
            ...matched.receive
              .slice(0, 50)
              .map((s) => [`receive:${s.id}`, true]),
          ]),
        );
      } catch {
        if (active)
          setError(
            "No se ha podido leer su colección. Pulsa Actualizar coincidencias para reintentar.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [friendId, collection, userId, refreshRevision]);
  const friend = friends.find((f) => f.user_id === friendId);
  const matched = compare(stickers, inventory, theirs);
  const gives = matched.offer.filter((s) => choices[`give:${s.id}`]);
  const receives = matched.receive.filter((s) => choices[`receive:${s.id}`]);
  async function send() {
    if (
      !friend ||
      (!operation.current && (!gives.length || !receives.length)) ||
      sending
    )
      return;
    setSending(true);
    setError("");
    try {
      const { data: session } = await database().auth.getSession();
      if (!session.session || session.session.user.id !== userId)
        throw new Error();
      const me = userId;
      operation.current ??= {
        p_id: crypto.randomUUID(),
        p_receiver: friendId,
        p_collection: collection,
        p_items: [
          ...gives.map((s) => ({
            giver_id: me,
            sticker_id: s.id,
            quantity: 1,
          })),
          ...receives.map((s) => ({
            giver_id: friendId,
            sticker_id: s.id,
            quantity: 1,
          })),
        ],
      };
      const { error, status } = await database().rpc(
        "propose_trade",
        operation.current,
      );
      if (error) {
        // A rejected transaction is safe to edit. A lost response may already
        // have committed: preserve its exact ID and items for confirmation.
        if (status >= 400 && status < 500) {
          operation.current = null;
          setError(
            "No se ha podido enviar la propuesta. Actualiza las coincidencias: algún cromo o permiso puede haber cambiado.",
          );
          return;
        }
        throw error;
      }
      operation.current = null;
      setMessage(
        `Solicitud enviada a @${friend.username}. Las copias de ambos se reservarán cuando la acepte.`,
      );
      await onSent().catch(() =>
        setError(
          "La solicitud está enviada, pero no se ha podido actualizar la lista de cambios.",
        ),
      );
    } catch {
      setError(
        "No se pudo confirmar el envío. Pulsa Reintentar envío para comprobar la misma solicitud sin duplicarla.",
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <section
      className="panel quick-trade"
      aria-label="Preparar intercambio automático"
    >
      <span className="eyebrow">
        1 · ELIGE AMIGO · 2 · REVISA · 3 · SOLICITA
      </span>
      <h2>¿Con quién quieres cambiar?</h2>
      <p>Elige un amigo. Preparamos los cromos que os faltan a los dos.</p>
      <div
        className="trade-friend-buttons"
        role="group"
        aria-label="Elegir amigo para intercambiar"
      >
        {friends.map((f) => (
          <div
            className={`trade-friend-card ${friendId === f.user_id ? "selected" : ""}`}
            key={f.user_id}
          >
            <div>
              <strong>{f.display_name}</strong>
              <small>@{f.username}</small>
            </div>
            <button
              type="button"
              aria-label={`Intercambiar con @${f.username}`}
              aria-pressed={friendId === f.user_id}
              disabled={sending || Boolean(operation.current) || refreshing}
              onClick={() => setFriendId(f.user_id)}
            >
              {friendId === f.user_id ? (
                <Check size={18} />
              ) : (
                <ArrowRight size={18} />
              )}
              {friendId === f.user_id ? "Seleccionado" : "Intercambiar"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => onProfile(f)}
              disabled={sending || Boolean(operation.current)}
              aria-label={`Ver colección de @${f.username}`}
            >
              Ver colección
            </button>
          </div>
        ))}
      </div>
      {!friends.length && (
        <p>Añade primero un amigo para preparar vuestro cambio.</p>
      )}
      {error && <p role="alert">{error}</p>}
      {message && (
        <div className="trade-sent-notice">
          <p role="status">{message}</p>
          {onViewTrades && (
            <button type="button" onClick={onViewTrades}>
              Ver solicitud enviada <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}
      {loading && <p role="status">Comparando vuestros álbumes…</p>}
      {friend && (
        <button
          type="button"
          className="text-button"
          disabled={
            sending || refreshing || loading || Boolean(operation.current)
          }
          onClick={() => {
            setRefreshing(true);
            void onSent()
              .then(() => setRefreshRevision((v) => v + 1))
              .catch(() =>
                setError("No se han podido actualizar las coincidencias."),
              )
              .finally(() => setRefreshing(false));
          }}
        >
          {refreshing ? "Actualizando…" : "Actualizar coincidencias"}
        </button>
      )}
      {friend && !loading && (
        <>
          {allowed === false ? (
            <p>
              Su colección es privada. Necesita compartirla contigo para
              detectar las coincidencias.
            </p>
          ) : allowed === true ? (
            <>
              <div
                className="trade-send-summary"
                aria-label="Resumen del intercambio"
              >
                <h3>Tu propuesta para @{friend.username}</h3>
                <p>
                  <strong>{gives.length}</strong> para dar{" "}
                  <span aria-hidden="true">↔</span>{" "}
                  <strong>{receives.length}</strong> para recibir
                </p>
                <button
                  type="button"
                  disabled={
                    sending ||
                    (!operation.current &&
                      (!gives.length || !receives.length)) ||
                    Boolean(message)
                  }
                  onClick={() => void send()}
                >
                  {sending
                    ? "Enviando…"
                    : operation.current
                      ? "Reintentar envío"
                      : "Solicitar intercambio"}
                </button>
                <small>
                  No se mueve ningún cromo hasta que ambos confirméis el cambio.
                </small>
              </div>
              <p className="trade-selection-hint">
                Los cromos ya están seleccionados. Pulsa una carta para quitarla
                o añadirla.
              </p>
              <div className="compare-columns">
                {[
                  { key: "give", label: "Tú das", rows: matched.offer },
                  {
                    key: "receive",
                    label: "Tú recibes",
                    rows: matched.receive,
                  },
                ].map((part) => (
                  <div key={part.key}>
                    <h3>
                      {part.label} ·{" "}
                      {part.key === "give" ? gives.length : receives.length}
                    </h3>
                    {part.rows.length === 0 && (
                      <p>
                        No hay repetidos disponibles que os falten en este lado.
                      </p>
                    )}
                    {part.rows.slice(0, 50).map((s) => (
                      <button
                        type="button"
                        className="suggested-sticker trade-sticker-choice"
                        key={s.id}
                        aria-label={`${part.key === "give" ? "Dar" : "Recibir"} ${s.name}, ${s.official_code}`}
                        aria-pressed={Boolean(choices[`${part.key}:${s.id}`])}
                        disabled={
                          sending ||
                          Boolean(message) ||
                          Boolean(operation.current)
                        }
                        onClick={() =>
                          setChoices((v) => ({
                            ...v,
                            [`${part.key}:${s.id}`]: !v[`${part.key}:${s.id}`],
                          }))
                        }
                      >
                        {choices[`${part.key}:${s.id}`] ? (
                          <Check size={20} />
                        ) : (
                          <Plus size={20} />
                        )}
                        <span>
                          #{s.official_code} · {s.name}
                          <small>
                            {s.teams?.name ?? s.sticker_series?.name}
                            {s.sticker_series ? " · Especial" : ""}
                          </small>
                        </span>
                        <small>
                          {choices[`${part.key}:${s.id}`]
                            ? "Incluido"
                            : "Añadir"}
                        </small>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              {(matched.offer.length > 50 || matched.receive.length > 50) && (
                <p>
                  Esta propuesta muestra hasta 50 cartas por lado. Puedes
                  preparar otro cambio después.
                </p>
              )}
              <p>
                Una copia por cromo. Revisa las cartas especiales; no se
                presupone que tengan el mismo valor.
              </p>
              {!operation.current && (!gives.length || !receives.length) && (
                <p>
                  Para solicitar el cambio, selecciona al menos un cromo en cada
                  lado.
                </p>
              )}
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
