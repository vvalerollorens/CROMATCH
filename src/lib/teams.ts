// Club names checked against LaLiga's 2026/27 club directory on 2026-11-08.
// https://www.laliga.com/es-NG/laliga-easports/clubes
// Original monochrome shield/monogram artwork; these are not official club logos.
export const seasonTeams = [
  ["athletic", "Athletic Club", "ATH"],
  ["atletico", "Atlético de Madrid", "ATM"],
  ["osasuna", "CA Osasuna", "OSA"],
  ["celta", "Celta", "CEL"],
  ["alaves", "Deportivo Alavés", "ALA"],
  ["elche", "Elche CF", "ELC"],
  ["barcelona", "FC Barcelona", "FCB"],
  ["getafe", "Getafe CF", "GET"],
  ["levante", "Levante UD", "LEV"],
  ["malaga", "Málaga CF", "MAL"],
  ["racing", "R. Racing Club", "RAC"],
  ["rayo", "Rayo Vallecano", "RAY"],
  ["deportivo", "RC Deportivo", "DEP"],
  ["espanyol", "RCD Espanyol de Barcelona", "ESP"],
  ["betis", "Real Betis", "BET"],
  ["madrid", "Real Madrid", "RMA"],
  ["sociedad", "Real Sociedad", "RSO"],
  ["sevilla", "Sevilla FC", "SEV"],
  ["valencia", "Valencia CF", "VAL"],
  ["villarreal", "Villarreal CF", "VIL"],
].map(([id, name, short]) => ({ id, name, short }));
const aliases: Record<string, string> = {
  "rc celta": "celta",
  "rc celta de vigo": "celta",
  "celta de vigo": "celta",
  "atletico madrid": "atletico",
  "club atletico de madrid": "atletico",
  "athletic club de bilbao": "athletic",
  "athletic bilbao": "athletic",
  osasuna: "osasuna",
  alaves: "alaves",
  "real madrid cf": "madrid",
  "real racing club": "racing",
  "racing de santander": "racing",
  "racing santander": "racing",
  "deportivo de la coruna": "deportivo",
  "rc deportivo de la coruna": "deportivo",
  espanyol: "espanyol",
  "rcd espanyol": "espanyol",
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
