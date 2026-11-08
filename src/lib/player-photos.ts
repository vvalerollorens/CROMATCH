import data from "@/data/player-photos.json";
import { referenceStickers } from "./catalogue";
import type { Sticker } from "./domain";
import { teamKey } from "./teams";
export type PlayerPhoto = {
  src: string;
  player: string;
  playerId: string;
  source: string;
  season: string;
  club: string;
};
const photos: Record<string, PlayerPhoto> = data;
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const byIdentity = new Map<string, PlayerPhoto>();
for (const s of referenceStickers) {
  const photo = photos[s.id];
  if (photo && s.teams)
    byIdentity.set(`${teamKey(s.teams.name)}:${normalize(s.name)}`, photo);
}
/** No fuzzy name matching at runtime: missing and ambiguous portraits stay empty. */
export function playerPhoto(s: Sticker): PlayerPhoto | undefined {
  if (photos[s.id]) return photos[s.id];
  return s.teams
    ? byIdentity.get(`${teamKey(s.teams.name)}:${normalize(s.name)}`)
    : undefined;
}
