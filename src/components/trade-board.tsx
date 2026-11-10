"use client";
import { useId, useState, type ReactNode } from "react";
import { ArrowLeftRight, Check, ChevronDown, Plus } from "lucide-react";
import type { Sticker } from "@/lib/domain";
import { playerPhoto } from "@/lib/player-photos";
import { seasonTeams, teamKey } from "@/lib/teams";

export function TradeBoard({
  mineName,
  otherName,
  mineCount,
  otherCount,
  mine,
  other,
  mineSelected,
  otherSelected,
  minePreview = [],
  otherPreview = [],
}: {
  mineName: string;
  otherName: string;
  mineCount: number;
  otherCount: number;
  mine: ReactNode;
  other: ReactNode;
  mineSelected?: number;
  otherSelected?: number;
  minePreview?: Sticker[];
  otherPreview?: Sticker[];
}) {
  const id = useId();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <div
      className="trade-board"
      role="group"
      aria-label="Cromos de los dos coleccionistas"
    >
      <span className="trade-board-arrow" aria-hidden="true">
        <ArrowLeftRight size={24} />
      </span>
      {[
        {
          side: "mine",
          name: mineName,
          count: mineCount,
          label: "Tú das",
          content: mine,
          preview: minePreview,
          chosen: mineSelected,
          hint:
            mineSelected === undefined
              ? "Incluidos en el cambio"
              : `Le faltan a ${otherName}`,
        },
        {
          side: "theirs",
          name: otherName,
          count: otherCount,
          label: "Tú recibes",
          content: other,
          preview: otherPreview,
          chosen: otherSelected,
          hint:
            otherSelected === undefined
              ? "Incluidos en el cambio"
              : "Son los que te faltan",
        },
      ].map((part) => (
        <section
          className={`trade-pile trade-pile-${part.side}`}
          key={part.side}
          aria-label={part.label}
        >
          <div className="trade-person">
            <strong>{part.name}</strong>
            <span>{part.label}</span>
          </div>
          <button
            type="button"
            className="trade-stack-toggle"
            aria-label={`Ver cromos de ${part.name}`}
            aria-expanded={Boolean(expanded[part.side])}
            aria-controls={`${id}-${part.side}`}
            onClick={() =>
              setExpanded((v) => ({ ...v, [part.side]: !v[part.side] }))
            }
          >
            <TradePilePreview stickers={part.preview} />
            <span className="trade-stack-action">
              <span>
                {part.count} {part.count === 1 ? "cromo" : "cromos"} ·{" "}
                {expanded[part.side] ? "Cerrar" : "Ver"}
              </span>
              <ChevronDown size={16} />
            </span>
          </button>
          <p className="trade-pile-hint">{part.hint}</p>
          {part.chosen !== undefined && (
            <p className="trade-pile-selected">{part.chosen} elegidos</p>
          )}
          <div
            id={`${id}-${part.side}`}
            className="trade-pile-content"
            hidden={!expanded[part.side]}
          >
            {expanded[part.side] && (
              <div className="trade-pile-cards">{part.content}</div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function TradePilePreview({ stickers }: { stickers: Sticker[] }) {
  return (
    <span className="trade-photo-stack" aria-hidden="true">
      {stickers.length ? (
        stickers.slice(0, 3).map((s, index) => {
          const photo = playerPhoto(s);
          const club =
            s.teams && seasonTeams.find((t) => t.id === teamKey(s.teams!.name));
          const crest =
            s.name === "Escudo" && club ? `/badges/${club.id}-white.svg` : null;
          return (
            <span
              className={`trade-stack-photo photo-layer-${index}${crest ? " is-crest" : ""}`}
              key={s.id}
            >
              {crest || photo ? (
                <img
                  src={crest ?? photo!.src}
                  alt=""
                  width={128}
                  height={168}
                  decoding="async"
                  draggable={false}
                  style={{
                    objectFit:
                      crest || photo?.fit !== "cover" ? "contain" : "cover",
                    objectPosition: photo?.position ?? "center bottom",
                  }}
                />
              ) : (
                <span className="trade-stack-no-photo">
                  #{s.official_code}
                  <small>Sin retrato</small>
                </span>
              )}
              <span className="trade-stack-player">
                <small>#{s.official_code}</small>
                <strong>{s.name}</strong>
              </span>
            </span>
          );
        })
      ) : (
        <span className="trade-stack-empty">Sin cromos útiles</span>
      )}
    </span>
  );
}

export function TradeSticker({
  sticker,
  fallback,
  quantity = 1,
  selected,
  disabled,
  onToggle,
  label,
}: {
  sticker?: Sticker;
  fallback?: { name: string; official_code: string };
  quantity?: number;
  selected?: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  label?: string;
}) {
  const name = sticker?.name ?? fallback?.name ?? "Cromo no disponible";
  const code = sticker?.official_code ?? fallback?.official_code ?? "—";
  const photo = sticker && playerPhoto(sticker);
  const club =
    sticker?.teams &&
    seasonTeams.find((t) => t.id === teamKey(sticker.teams!.name));
  const content = (
    <>
      <span className="trade-card-portrait">
        {name === "Escudo" && club ? (
          <img
            className="trade-card-large-crest"
            src={`/badges/${club.id}-white.svg`}
            alt=""
            width={160}
            height={176}
            decoding="async"
            draggable={false}
          />
        ) : photo ? (
          <img
            src={photo.src}
            alt=""
            width={160}
            height={176}
            loading="lazy"
            decoding="async"
            draggable={false}
            style={{
              objectFit: photo.fit === "cover" ? "cover" : "contain",
              objectPosition: photo.position ?? "center bottom",
            }}
          />
        ) : (
          <span className="trade-card-placeholder" aria-hidden="true">
            {code}
          </span>
        )}
        {club && name !== "Escudo" && (
          <img
            className="trade-card-crest"
            src={`/badges/${club.id}-white.svg`}
            alt=""
            width={24}
            height={28}
          />
        )}
        <span className="trade-card-quantity">×{quantity}</span>
        {sticker?.sticker_series && (
          <span className="trade-card-special">Especial</span>
        )}
      </span>
      <span className="trade-card-caption">
        <small>#{code}</small>
        <strong>{name}</strong>
        <span>
          {sticker?.teams?.name ?? sticker?.sticker_series?.name ?? "Sin ficha"}
        </span>
      </span>
      {onToggle && (
        <span className="trade-card-selection">
          {selected ? <Check size={16} /> : <Plus size={16} />}
          {selected ? "Elegido" : "Elegir"}
        </span>
      )}
    </>
  );
  const className = `trade-visual-card${sticker?.sticker_series ? " is-special" : ""}`;
  return onToggle ? (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
    >
      {content}
    </button>
  ) : (
    <article className={className} aria-label={`${quantity} × ${name}`}>
      {content}
    </article>
  );
}
