"use client";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Logo, Legal } from "./ui";
import {
  AlbumIcon as Album,
  SwapIcon as ArrowDownUp,
  CardsIcon as Copy,
  FriendsIcon as Users,
} from "./app-icons";
export function Landing({
  setAuth,
  enterVisitor,
  setLegal,
  legal,
  notices,
}: {
  setAuth: (v: "login" | "register") => void;
  enterVisitor: () => void;
  setLegal: (v: boolean) => void;
  legal: boolean;
  notices: React.ReactNode;
}) {
  return (
    <div className="landing dark-welcome">
      <header className="landing-header">
        <Logo />
        <button className="text-button" onClick={() => setAuth("login")}>
          Iniciar sesión <ArrowRight size={15} />
        </button>
      </header>
      <main>
        <section className="welcome-hero">
          <div className="welcome-art" aria-hidden="true">
            <div className="welcome-halo" />
            <span className="welcome-tile tile-back">
              <ArrowDownUp size={44} />
            </span>
            <span className="welcome-tile tile-front">
              <Album size={62} />
              <span>26 / 27</span>
            </span>
            <span className="welcome-star">✦</span>
            <span className="welcome-orbit" />
          </div>
          <div className="welcome-copy">
            <span className="eyebrow">TU ÁLBUM. TUS AMIGOS.</span>
            <h1>
              Ese cromo
              <br />
              que te falta.
              <br />
              <span>Más cerca.</span>
            </h1>
            <p>
              Marca los que tienes.
              <br />
              Encuentra los que te faltan.
              <br />
              Cámbialos con tu gente.
            </p>
            <button className="glow-cta" onClick={enterVisitor}>
              Ver por dentro sin cuenta <ArrowRight size={19} />
            </button>
            <button
              className="text-button welcome-register"
              onClick={() => setAuth("register")}
            >
              Empieza tu colección <ArrowRight size={15} />
            </button>
            <span className="welcome-privacy">
              <ShieldCheck size={14} /> Tu colección es privada por defecto.
            </span>
          </div>
        </section>
        <section className="welcome-features" id="como-funciona">
          <span>
            <Album size={18} /> Tu álbum
          </span>
          <span>
            <ArrowDownUp size={18} /> Tus cambios
          </span>
          <span>
            <Users size={18} /> Tu gente
          </span>
        </section>
        <details className="welcome-catalog" id="coleccion">
          <summary>
            LaLiga ESTE 2026–27 <span>Sobre el catálogo</span>
          </summary>
          <p>
            Catálogo pendiente de verificación. Puedes consultar nombres y
            números contrastados en listados de coleccionismo, con las
            incidencias señaladas. Falta cotejar el PDF de Panini de la cuarta
            edición. El álbum sin cuenta se guarda únicamente en este navegador;
            no se sincroniza con otros dispositivos.
          </p>
        </details>
        {notices}
      </main>
      <footer className="site-footer">
        <span>Cada cromo cuenta.</span>
        <button className="text-button" onClick={() => setLegal(true)}>
          Privacidad y condiciones
        </button>
      </footer>
      {legal && <Legal close={() => setLegal(false)} />}
    </div>
  );
}
