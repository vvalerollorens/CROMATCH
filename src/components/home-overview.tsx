"use client";
import { ArrowRight, Camera } from "lucide-react";
import {
  AlbumIcon as Album,
  SwapIcon as ArrowDownUp,
  CardsIcon as Copy,
  FriendsIcon as Users,
} from "./app-icons";
export type HomeFriend = {
  user_id: string;
  username: string;
  display_name: string;
  offer_count?: number;
  receive_count?: number;
};
export function HomeOverview({
  owned,
  total,
  duplicates,
  friends,
  opportunities,
  busy,
  prepareTrade,
  go,
}: {
  owned: number;
  total: number;
  duplicates: number;
  friends: number;
  opportunities: HomeFriend[];
  busy: boolean;
  prepareTrade: (friend: HomeFriend) => void;
  go: (
    section: "album" | "intercambios" | "amigos" | "repetidos" | "escaner",
  ) => void;
}) {
  return (
    <div className="simple-home">
      {friends > 0 && (
        <section className="home-matches" aria-label="Cambios con tus amigos">
          <span className="eyebrow">TU PRÓXIMO CAMBIO</span>
          <h2>
            {opportunities.some(
              (f) => (f.offer_count ?? 0) > 0 && (f.receive_count ?? 0) > 0,
            )
              ? "Ya tenéis cromos para cambiar."
              : "Tu próximo cambio empieza aquí."}
          </h2>
          {opportunities.slice(0, 3).map((friend) => {
            const known =
              friend.offer_count !== undefined &&
              friend.receive_count !== undefined;
            const reciprocal =
              (friend.offer_count ?? 0) > 0 && (friend.receive_count ?? 0) > 0;
            return (
              <div className="home-match" key={friend.user_id}>
                <div>
                  <strong>{friend.display_name}</strong>
                  <small>@{friend.username}</small>
                </div>
                {known ? (
                  <p className="home-match-counts">
                    <span>
                      Tú das <b>{friend.offer_count}</b>
                    </span>
                    <span>
                      Tú recibes <b>{friend.receive_count}</b>
                    </span>
                  </p>
                ) : (
                  <p>
                    Compartid vuestros álbumes con «Solo amigos» en Mi perfil
                    para ver coincidencias.
                  </p>
                )}
                {known &&
                  friend.offer_count === 0 &&
                  friend.receive_count === 0 && (
                    <p>
                      Aún no hay coincidencias. Registrad vuestros repetidos
                      para encontrarlas.
                    </p>
                  )}
                <button
                  type="button"
                  className={reciprocal ? "glow-cta" : "secondary"}
                  disabled={busy}
                  aria-label={`${reciprocal ? "Preparar cambio" : "Ver coincidencias"} con @${friend.username}`}
                  onClick={() => prepareTrade(friend)}
                >
                  {reciprocal ? "Preparar cambio" : "Ver coincidencias"}
                  <ArrowRight size={17} />
                </button>
              </div>
            );
          })}
          {!opportunities.length && (
            <p>
              Tu amigo ya está en tu equipo. Abre sus coincidencias para
              preparar vuestro primer cambio.
            </p>
          )}
          <button
            type="button"
            className="text-button"
            onClick={() => go("amigos")}
          >
            Ver mis amigos <ArrowRight size={15} />
          </button>
        </section>
      )}
      <section className="glow-hero">
        <div className="glow-orbit" aria-hidden="true">
          <div />
          <span className="orbit-card orbit-one">
            <Album size={35} />
          </span>
          <span className="orbit-card orbit-two">
            <ArrowDownUp size={28} />
          </span>
          <span className="orbit-star">✦</span>
        </div>
        <span className="eyebrow">TU ÁLBUM. TU GENTE.</span>
        <h2>
          Uno menos
          <br />
          para <span>completarlo.</span>
        </h2>
        <p>
          Los que tienes. Los que te faltan.
          <br />Y los amigos con quienes cambiarlos.
        </p>
        <button className="glow-cta" onClick={() => go("album")}>
          Ir a mi álbum <ArrowRight size={19} />
        </button>
        <button className="text-button home-scan" onClick={() => go("escaner")}>
          <Camera size={17} /> Reconocer una foto
        </button>
        <div className="home-collection-total">
          <span>
            <strong>{owned}</strong>{" "}
            {total ? `de ${total} cromos` : "cromos registrados"}
          </span>
          <span>
            {total
              ? `${Math.round((owned / total) * 100)}% de la colección`
              : "Todo empieza aquí"}
          </span>
          <progress
            max={Math.max(1, total)}
            value={owned}
            aria-label="Progreso de la colección"
          />
        </div>
      </section>
      <div className="home-actions">
        <button
          aria-label="Mi álbum"
          className="glow-card glow-blue"
          onClick={() => go("album")}
        >
          <span className="glow-card-icon">
            <Album size={22} />
          </span>
          <strong>Mi álbum</strong>
          <span>
            Equipo a equipo.
            <br />
            Cromo a cromo.
          </span>
          <ArrowRight size={17} />
        </button>
        <button
          aria-label="Intercambios"
          className="glow-card glow-orange"
          onClick={() => go("intercambios")}
        >
          <span className="glow-card-icon">
            <ArrowDownUp size={22} />
          </span>
          <strong>Intercambios</strong>
          <span>
            Ese repetido puede
            <br />
            ser tu próximo match.
          </span>
          <ArrowRight size={17} />
        </button>
        <button
          aria-label="Mis amigos"
          className="glow-card glow-green"
          onClick={() => go("amigos")}
        >
          <span className="glow-card-icon">
            <Users size={22} />
          </span>
          <strong>Mis amigos</strong>
          <span>
            {friends ? `${friends} en tu equipo.` : "Coleccionar juntos"}
            <br />
            sabe mejor.
          </span>
          <ArrowRight size={17} />
        </button>
      </div>
      <button className="home-duplicates" onClick={() => go("repetidos")}>
        <span className="glow-card-icon">
          <Copy size={21} />
        </span>
        <span>
          <strong>{duplicates} repetidos disponibles</strong>
          <small>Encuentra a quien los necesita.</small>
        </span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
