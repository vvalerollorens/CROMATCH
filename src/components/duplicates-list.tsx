"use client";
import { Minus, Plus } from "lucide-react";
import { available, type Inventory, type Sticker } from "@/lib/domain";
import { playerPhoto } from "@/lib/player-photos";
export function DuplicatesList({
  stickers,
  inventory,
  busy,
  onChange,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  busy: boolean;
  onChange: (s: Sticker, delta: number) => Promise<void>;
}) {
  const own = new Map(inventory.map((i) => [i.sticker_id, i]));
  return (
    <div className="duplicates-list">
      {stickers.map((s) => {
        const row = own.get(s.id);
        const q = row?.quantity ?? 0;
        const photo = playerPhoto(s);
        return (
          <article className="duplicate-row" key={s.id}>
            <div className="duplicate-portrait">
              {photo ? (
                <img
                  src={photo.src}
                  width={70}
                  height={85}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <span>{s.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="duplicate-name">
              <strong>{s.name}</strong>
              <small>
                #{s.official_code} · {s.teams?.name ?? s.sticker_series?.name}
              </small>
              <span>
                {row?.reserved
                  ? `${available(row)} disponibles · ${row.reserved} reservados`
                  : "Una copia permanece en tu álbum"}
              </span>
            </div>
            <div className="duplicate-stepper">
              <button
                className="secondary"
                aria-label={`Quitar un repetido de ${s.name}, ${s.official_code}`}
                disabled={busy || available(row) < 1}
                onClick={() => void onChange(s, -1).catch(() => {})}
              >
                <Minus size={16} />
              </button>
              <output aria-label={`Repetidos de ${s.name}, ${s.official_code}`}>
                <strong>{Math.max(0, q - 1)}</strong>
                <small>{q === 2 ? "repetido" : "repetidos"}</small>
              </output>
              <button
                aria-label={`Añadir un repetido de ${s.name}, ${s.official_code}`}
                disabled={busy || q >= 999}
                onClick={() => void onChange(s, 1).catch(() => {})}
              >
                <Plus size={16} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
