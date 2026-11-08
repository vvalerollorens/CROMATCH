"use client";
import { Album, ArrowDownUp, ArrowRight, Copy, Users } from "lucide-react";
export function HomeOverview({
  owned,
  total,
  duplicates,
  friends,
  go,
}: {
  owned: number;
  total: number;
  duplicates: number;
  friends: number;
  go: (section: "album" | "intercambios" | "amigos" | "repetidos") => void;
}) {
  return (
    <div className="simple-home">
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
        <div className="home-collection-total">
          <span>
            <strong>{owned}</strong>{" "}
            {total ? `de ${total} cromos` : "cromos registrados"}
          </span>
          <span>
            {total
              ? `${Math.round((owned / total) * 100)}%`
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
