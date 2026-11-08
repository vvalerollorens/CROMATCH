import type { Sticker } from "./domain";
import { albumSectionKey } from "./catalogue";
export const clubColours: Record<string, [string, string]> = {
  alaves: ["#2774d8", "#f5f5f5"],
  athletic: ["#e74450", "#f7f0e4"],
  atletico: ["#df4355", "#4771da"],
  barcelona: ["#b83874", "#3c6ce1"],
  betis: ["#32b883", "#e5f2de"],
  celta: ["#81c8ee", "#f1e3d8"],
  deportivo: ["#4b8ae1", "#e6edf4"],
  elche: ["#2dad75", "#e2eedc"],
  espanyol: ["#428be0", "#ede9e0"],
  getafe: ["#3978df", "#d9dfeb"],
  levante: ["#b5466d", "#3266be"],
  madrid: ["#e9e3db", "#cfad6a"],
  malaga: ["#71bce8", "#e8eceb"],
  osasuna: ["#d84553", "#334d86"],
  racing: ["#38ae90", "#f4f0df"],
  rayo: ["#e14a50", "#efece6"],
  sociedad: ["#4d92df", "#f1f0e7"],
  sevilla: ["#dc4858", "#f4efdf"],
  valencia: ["#ef945a", "#f0eee4"],
  villarreal: ["#f0d54a", "#4295ca"],
};
export function cardFinish(s: Sticker) {
  const section =
    s.catalog_section ??
    (s.sticker_series ? albumSectionKey(s.sticker_series.name) : "") ??
    "";
  if (section.includes("extra-oro")) return "gold";
  if (section.includes("extra-plata")) return "silver";
  if (section.includes("extra-bronce")) return "bronze";
  if (section.includes("draft-kromix")) return "kromix";
  if (section.includes("adn")) return "prime";
  if (section.includes("fantasy")) return "fantasy";
  if (section.includes("draft")) return "draft";
  if (section.includes("top-fichajes")) return "signing";
  return "base";
}
export function finishLabel(s: Sticker) {
  return s.sticker_series?.name ?? "NEXO · LaLiga";
}
