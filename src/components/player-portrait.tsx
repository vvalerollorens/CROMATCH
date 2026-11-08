"use client";
import { useState } from "react";
import type { PlayerPhoto } from "@/lib/player-photos";
export function PlayerPortrait({ photo }: { photo: PlayerPhoto }) {
  const [failed, setFailed] = useState<string | null>(null);
  return failed === photo.src ? (
    <span className="slot-photo-pending" aria-hidden="true">
      Retrato pendiente
    </span>
  ) : (
    <span
      className={`slot-portrait ${photo.fit === "cover" ? "article-portrait" : ""}`}
      aria-hidden="true"
    >
      <img
        src={photo.src}
        style={{
          objectFit: photo.fit === "cover" ? "cover" : "contain",
          objectPosition: photo.position ?? "center bottom",
        }}
        width={512}
        height={512}
        loading="lazy"
        decoding="async"
        alt=""
        draggable={false}
        onError={() => setFailed(photo.src)}
      />
    </span>
  );
}
