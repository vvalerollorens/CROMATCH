export type AlbumView = {
  version: 1;
  sectionId: string;
  query: string;
  searchOpen: boolean;
  mode: "all" | "missing" | "owned";
  page: number;
  scrollY: number;
};
export function readAlbumView(
  key: string | undefined,
  sections: { id: string }[],
): AlbumView {
  const fallback: AlbumView = {
    version: 1,
    sectionId: sections[0]?.id ?? "",
    query: "",
    searchOpen: false,
    mode: "all",
    page: 0,
    scrollY: 0,
  };
  if (!key || typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) ?? "null");
    if (
      !saved ||
      saved.version !== 1 ||
      !sections.some((s) => s.id === saved.sectionId)
    )
      return fallback;
    return {
      ...fallback,
      sectionId: saved.sectionId,
      query: typeof saved.query === "string" ? saved.query.slice(0, 200) : "",
      searchOpen: saved.searchOpen === true,
      mode: ["all", "missing", "owned"].includes(saved.mode)
        ? saved.mode
        : "all",
      page: Number.isInteger(saved.page) && saved.page >= 0 ? saved.page : 0,
      scrollY:
        Number.isFinite(saved.scrollY) && saved.scrollY >= 0
          ? saved.scrollY
          : 0,
    };
  } catch {
    return fallback;
  }
}
export function saveAlbumView(key: string, value: AlbumView) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browser storage is optional. */
  }
}
