"use client";
import { useEffect, useRef, useState } from "react";
import type { Inventory, Sticker } from "./domain";
import { cardFinish } from "./album-art";
import { seasonTeams, teamKey } from "./teams";
import type { Celebration } from "@/components/collection-celebration";
export function useCollectionCelebration(
  stickers: Sticker[],
  inventory: Inventory[],
  scope: string,
  ready: boolean,
) {
  const [event, setEvent] = useState<Celebration | null>(null);
  const previous = useRef<{ key: string; owned: Set<string> } | null>(null);
  useEffect(() => {
    if (!ready) return;
    const key = `${scope}:${stickers.map((s) => s.id).join(",")}`;
    const owned = new Set(
      inventory.filter((i) => i.quantity > 0).map((i) => i.sticker_id),
    );
    const last = previous.current;
    previous.current = { key, owned };
    if (!last || last.key !== key) return;
    for (const team of seasonTeams) {
      const rows = stickers.filter(
        (s) => s.teams && teamKey(s.teams.name) === team.id,
      );
      if (
        rows.length &&
        rows.every((s) => owned.has(s.id)) &&
        !rows.every((s) => last.owned.has(s.id))
      ) {
        setEvent({
          type: "team",
          name: team.name,
          short: team.short,
          total: rows.length,
        });
        return;
      }
    }
    const special = stickers.find(
      (s) =>
        cardFinish(s) !== "base" && owned.has(s.id) && !last.owned.has(s.id),
    );
    if (special)
      setEvent((current) =>
        current?.type === "team"
          ? current
          : { type: "special", sticker: special },
      );
  }, [stickers, inventory, scope, ready]);
  return { event, close: () => setEvent(null) };
}
