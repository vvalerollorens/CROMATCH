"use client";
import { useRef, type CSSProperties } from "react";
import { X } from "lucide-react";
import type { Sticker } from "@/lib/domain";
import { playerPhoto } from "@/lib/player-photos";
import { cardFinish, finishLabel, clubColours } from "@/lib/album-art";
import { teamKey } from "@/lib/teams";
import { Dialog } from "./dialog";
export type Celebration =
  | { type: "team"; name: string; short: string; total: number }
  | { type: "special"; sticker: Sticker };
export function CollectionCelebration({
  event,
  close,
}: {
  event: Celebration;
  close: () => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const special = event.type === "special" ? event.sticker : null;
  const photo = special ? playerPhoto(special) : undefined;
  const colourName = event.type === "team" ? event.name : special?.teams?.name;
  const colours = colourName ? clubColours[teamKey(colourName)] : undefined;
  return (
    <Dialog
      titleId="celebration-title"
      close={close}
      style={
        {
          "--award-a": colours?.[0] ?? "#eaa13f",
          "--award-b": colours?.[1] ?? "#b64374",
          "--club-a": colours?.[0] ?? "#bc759b",
          "--club-b": colours?.[1] ?? "#e7bf8c",
        } as CSSProperties
      }
      className={`collection-celebration celebration-${event.type}`}
    >
      <div className="celebration-aura" aria-hidden="true" />
      <button
        className="icon-button close"
        aria-label="Cerrar celebración"
        onClick={close}
      >
        <X />
      </button>
      <span className="eyebrow">Cada pieza te acerca</span>
      <h2 id="celebration-title">
        {event.type === "team"
          ? "Una página para recordar."
          : "Una pieza especial. Tuya."}
      </h2>
      {event.type === "team" ? (
        <div className="completed-page">
          <div className="completed-pitch" aria-hidden="true">
            <i />
            <span>{event.short}</span>
          </div>
          <strong>{event.name}</strong>
          <span>
            {event.total} de {event.total} cromos conseguidos
          </span>
          <p>El equipo está completo.</p>
        </div>
      ) : (
        <>
          <div
            ref={card}
            className={`premium-card finish-${cardFinish(event.sticker)}`}
            tabIndex={0}
            aria-label={`Carta conseguida de ${event.sticker.name}`}
            onPointerMove={(e) => {
              const b = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty(
                "--tilt-x",
                `${(e.clientY - b.top - b.height / 2) / -16}deg`,
              );
              e.currentTarget.style.setProperty(
                "--tilt-y",
                `${(e.clientX - b.left - b.width / 2) / 16}deg`,
              );
            }}
            onPointerLeave={() => {
              card.current?.style.setProperty("--tilt-x", "0deg");
              card.current?.style.setProperty("--tilt-y", "0deg");
            }}
          >
            <div className="premium-foil" aria-hidden="true" />
            <span className="premium-series">{finishLabel(event.sticker)}</span>
            <strong className="premium-code">
              {event.sticker.official_code}
            </strong>
            {photo && <img src={photo.src} alt="" width={512} height={512} />}
            <div className="premium-name">
              <small>En tu colección</small>
              <strong>{event.sticker.name}</strong>
            </div>
          </div>
          <p className="celebration-hint">
            Mueve la carta para ver sus reflejos.
          </p>
        </>
      )}
      <button className="glow-cta" onClick={close}>
        Seguir coleccionando
      </button>
    </Dialog>
  );
}
