"use client";
import type { ReactNode } from "react";
import { ArrowLeftRight, Check, Plus } from "lucide-react";
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
}: {
  mineName: string;
  otherName: string;
  mineCount: number;
  otherCount: number;
  mine: ReactNode;
  other: ReactNode;
}) {
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
        },
        {
          side: "theirs",
          name: otherName,
          count: otherCount,
          label: "Tú recibes",
          content: other,
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
          <div className="trade-stack" aria-hidden="true">
            <span />
            <span />
            <div>
              <b>{part.count}</b>
              <small>{part.count === 1 ? "cromo" : "cromos"}</small>
            </div>
          </div>
          <p className="sr-only">
            {part.count} {part.count === 1 ? "cromo" : "cromos"} en este lado
          </p>
          <div className="trade-pile-cards">{part.content}</div>
        </section>
      ))}
    </div>
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
        {photo ? (
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
        {club && (
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
          {selected ? "Incluido" : "Añadir"}
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
