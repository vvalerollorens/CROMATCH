"use client";
import {
  Album,
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Logo, Legal } from "./ui";
export function Landing({
  setAuth,
  enterVisitor,
  setLegal,
  legal,
  notices,
}: {
  enterVisitor: () => void;
  setAuth: (v: "login" | "register") => void;
  setLegal: (v: boolean) => void;
  legal: boolean;
  notices: React.ReactNode;
}) {
  return (
    <div className="landing">
      <header className="landing-header">
        <Logo />
        <nav>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#coleccion">La colección</a>
          <button className="secondary" onClick={() => setAuth("login")}>
            Iniciar sesión
          </button>
          <button onClick={() => setAuth("register")}>
            Crear cuenta <ArrowRight size={16} />
          </button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              <span className="live-dot" /> EL FÚTBOL SE COLECCIONA. LA PASIÓN
              SE COMPARTE.
            </span>
            <h1>
              Ese cromo
              <br />
              que te falta.
              <br />
              <span>
                Ese match
                <br className="mobile-break" /> que te une.
              </span>
            </h1>
            <p>
              Tu álbum, tus repetidos y gente que comparte tu afición. Todo en
              un mismo equipo.
            </p>
            <div className="hero-actions">
              <button onClick={() => setAuth("register")}>
                Empieza tu colección <ArrowRight size={19} />
              </button>
              <a className="how-link" href="#como-funciona">
                Así funciona <ChevronRight size={17} />
              </a>
            </div>
            <button className="secondary visitor-entry" onClick={enterVisitor}>
              Ver por dentro sin cuenta <ArrowRight size={17} />
            </button>
            <div className="hero-trust">
              <ShieldCheck size={18} />
              <span>
                Tu colección es privada. Tú decides con quién compartirla.
              </span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="art-label">TEMPORADA 2026 — 27</span>
            <div className="pitch">
              <div className="pitch-circle" />
              <div className="pitch-line" />
            </div>
            <div className="art-card card-one">
              <span>CROMATCH / CLUB</span>
              <div className="jersey">10</div>
              <strong>
                LA PASIÓN
                <br />
                NO SE REPITE.
              </strong>
              <small>SE COMPARTE.</small>
            </div>
            <div className="art-card card-two">
              <span>TU PRÓXIMO FICHAJE</span>
              <div className="star-art">✦</div>
              <strong>
                EL QUE
                <br />
                TE FALTA.
              </strong>
              <small>JUNTOS COMPLETAMOS EL ÁLBUM.</small>
            </div>
            <div className="match-stamp">
              <ArrowDownUp size={24} />
              <div>
                HAY MATCH<strong>Una afición. Mil conexiones.</strong>
              </div>
              <Check size={18} />
            </div>
            <span className="art-note">Cada cromo cuenta una historia.</span>
          </div>
        </section>
        <div className="feature-ribbon">
          <span>
            <Album size={20} /> Tu álbum, siempre contigo
          </span>
          <span>
            <ArrowDownUp size={20} /> Repetidos que encuentran equipo
          </span>
          <span>
            <ShieldCheck size={20} /> Tú controlas tu colección
          </span>
        </div>
        <section className="how-section" id="como-funciona">
          <div>
            <span className="eyebrow">MENOS LISTAS. MÁS FÚTBOL.</span>
            <h2>
              Del «lo tengo»
              <br />
              al «lo cambiamos».
            </h2>
          </div>
          <div className="how-grid">
            {[
              {
                n: "01",
                title: "Pon tu álbum al día",
                text: "Registra tus cromos y sus cantidades. Tus repetidos y faltantes se organizan solos.",
                icon: Album,
              },
              {
                n: "02",
                title: "Encuentra tu equipo",
                text: "Conecta con amigos y compara las colecciones que decidan compartir contigo.",
                icon: Users,
              },
              {
                n: "03",
                title: "Haz el intercambio",
                text: "Elige qué ofreces y qué recibes. Confirma la entrega cuando esté todo en tus manos.",
                icon: ArrowDownUp,
              },
            ].map((x) => (
              <article key={x.n}>
                <span className="step-number">{x.n}</span>
                <x.icon size={27} />
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="collection-banner" id="coleccion">
          <div className="collection-emblem">
            <Album size={46} />
            <span>26/27</span>
          </div>
          <div>
            <span className="eyebrow">LA PRIMERA TEMPORADA DE MUCHAS</span>
            <h2>LaLiga ESTE 2026–27</h2>
            <p>
              Un lugar para cada cromo publicado, con ediciones y variantes
              diferenciadas.
            </p>
            <span className="catalog-note">
              Catálogo pendiente de verificación. No se muestran cromos ni
              cifras sin confirmar.
            </span>
          </div>
          <button className="secondary" onClick={() => setAuth("register")}>
            Preparar mi álbum <ArrowRight size={17} />
          </button>
        </section>
        {notices}
      </main>
      <footer className="site-footer">
        <Logo />
        <p>Hecho para quienes todavía dicen: «¿Tienes este?»</p>
        <button className="text-button" onClick={() => setLegal(true)}>
          Privacidad y condiciones
        </button>
        <a href="https://github.com/vvalerollorens/CROMATCH">
          Código del proyecto ↗
        </a>
      </footer>
      {legal && <Legal close={() => setLegal(false)} />}
    </div>
  );
}
