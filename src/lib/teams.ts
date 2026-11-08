// Club names checked against LaLiga's 2026/27 club directory on 2026-11-08.
// https://www.laliga.com/es-NG/laliga-easports/clubes
// White club crests: FootyLogos, requested by the user. Provenance: public/badges/sources.json.
// Album order corroborated in JR, Cromolista and Stickers.app.
export const seasonTeams = [
  ["alaves", "Deportivo Alavés", "ALA"],
  ["athletic", "Athletic Club", "ATH"],
  ["atletico", "Atlético de Madrid", "ATM"],
  ["barcelona", "FC Barcelona", "FCB"],
  ["betis", "Real Betis", "BET"],
  ["celta", "RC Celta", "CEL"],
  ["deportivo", "RC Deportivo", "DEP"],
  ["elche", "Elche CF", "ELC"],
  ["espanyol", "RCD Espanyol", "ESP"],
  ["getafe", "Getafe CF", "GET"],
  ["levante", "Levante UD", "LEV"],
  ["madrid", "Real Madrid CF", "RMA"],
  ["malaga", "Málaga CF", "MAL"],
  ["osasuna", "CA Osasuna", "OSA"],
  ["racing", "Racing de Santander", "RAC"],
  ["rayo", "Rayo Vallecano", "RAY"],
  ["sociedad", "Real Sociedad", "RSO"],
  ["sevilla", "Sevilla FC", "SEV"],
  ["valencia", "Valencia CF", "VAL"],
  ["villarreal", "Villarreal CF", "VIL"],
].map(([id, name, short]) => ({ id, name, short }));
const aliases: Record<string, string> = {
  "rc celta de vigo": "celta",
  "celta de vigo": "celta",
  "atletico madrid": "atletico",
  "club atletico de madrid": "atletico",
  "athletic club de bilbao": "athletic",
  "athletic bilbao": "athletic",
  osasuna: "osasuna",
  celta: "celta",
  "real madrid": "madrid",

  "ca osasuna": "osasuna",
  "c a osasuna": "osasuna",
  "real sociedad": "sociedad",
  "rc celta": "celta",
  "rcd espanyol": "espanyol",
  alaves: "alaves",
  "real madrid cf": "madrid",
  "real racing club": "racing",
  "racing de santander": "racing",
  "racing santander": "racing",
  "deportivo de la coruna": "deportivo",
  "rc deportivo de la coruna": "deportivo",
  espanyol: "espanyol",

  "real betis balompie": "betis",
  barcelona: "barcelona",
  valencia: "valencia",
  sevilla: "sevilla",
  villarreal: "villarreal",
  malaga: "malaga",
  elche: "elche",
  getafe: "getafe",
  levante: "levante",
};
const clean = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
export function teamKey(name: string) {
  const normalized = clean(name);
  return (
    seasonTeams.find((t) => clean(t.name) === normalized)?.id ??
    aliases[normalized] ??
    normalized
  );
}
