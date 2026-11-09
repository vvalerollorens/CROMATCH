"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Album,
  ArrowDownUp,
  ArrowRight,
  Bell,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  Filter,
  Flag,
  Grid2X2,
  Home,
  LayoutList,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { configured, database, download, inventoryFor } from "@/lib/supabase";
import {
  usernameEmail,
  loginEmail,
  accountUsername,
} from "@/lib/username-auth";
import {
  available,
  compare,
  parseCatalog,
  statistics,
  statusLabel,
  type Collection,
  type Inventory,
  type Profile,
  type Sticker,
  type Trade,
  type TradeItem,
} from "@/lib/domain";
type Section =
  | "inicio"
  | "album"
  | "intercambios"
  | "amigos"
  | "perfil"
  | "repetidos"
  | "faltantes"
  | "estadisticas"
  | "notificaciones"
  | "escaner"
  | "comparar"
  | "admin";
import {
  HomeIcon,
  AlbumIcon,
  SwapIcon,
  FriendsIcon,
  ProfileIcon,
  CardsIcon,
} from "./app-icons";
const nav = [
  { id: "inicio", label: "Inicio", icon: HomeIcon },
  { id: "album", label: "Mi álbum", icon: AlbumIcon },
  { id: "repetidos", label: "Repetidos", icon: CardsIcon },
  { id: "amigos", label: "Amigos", icon: FriendsIcon },
  { id: "perfil", label: "Mi perfil", icon: ProfileIcon },
] as const;
const titles: Record<Section, string> = {
  inicio: "Tu colección, en juego.",
  album: "Mi álbum",
  intercambios: "Intercambios",
  amigos: "Tu equipo de coleccionistas",
  perfil: "Tu espacio",
  repetidos: "Mis repetidos",
  faltantes: "Me faltan",
  estadisticas: "Así va tu colección",
  notificaciones: "Notificaciones",
  escaner: "Añade tus cromos",
  comparar: "Perfil y cambio",
  admin: "Administración del catálogo",
};
import { Empty, Logo, Legal } from "./ui";
import { Landing } from "./landing";
import { TradeProgress } from "./trade-progress";
import { AlbumSaveCheck } from "./album-save-check";
import { QuickTrade } from "./quick-trade";
import { OwnedCollectionList } from "./owned-collection-list";
import { searchText } from "@/lib/scan-matching";
import { VisualAlbum } from "./visual-album";
import { HomeOverview, type HomeFriend } from "./home-overview";
import { referenceStickers } from "@/lib/catalogue";
import { useLocalAlbum } from "@/lib/use-local-album";
import { QuickAdd } from "./quick-add";
import { DuplicatesList } from "./duplicates-list";
import { DuplicateEntry } from "./duplicate-entry";
import { DuplicateEntryError } from "@/lib/duplicate-entry";
import { useCollectionCelebration } from "@/lib/use-collection-celebration";
import { CollectionCelebration } from "./collection-celebration";
import dynamic from "next/dynamic";
const ScanAlbum = dynamic(
  () => import("./scan-album").then((m) => m.ScanAlbum),
  { loading: () => <p role="status">Preparando el escáner…</p> },
);
function ListOptions({
  collapsed,
  activeFilters,
  children,
}: {
  collapsed: boolean;
  activeFilters: boolean;
  children: ReactNode;
}) {
  return collapsed ? (
    <details className="duplicate-list-options">
      <summary>
        Filtrar o exportar mis repetidos
        {activeFilters ? " · Filtros activos" : ""}
      </summary>
      {children}
    </details>
  ) : (
    <>{children}</>
  );
}

export function Cromatch({
  initialVisitor = false,
}: {
  initialVisitor?: boolean;
}) {
  useEffect(() => {
    if (initialVisitor) {
      const target = window.location.hash.slice(1);
      if (Object.hasOwn(titles, target)) setSection(target as Section);
    }
  }, [initialVisitor]);
  const activeUser = useRef<string | null>(null);
  const pendingQuantity = useRef<
    Record<string, { operation: string; delta: number }>
  >({});
  const inventoryRevision = useRef(0);
  const loadSequence = useRef(0);
  const privacyDraftRevision = useRef(0);
  const privacySavedRevision = useRef(0);
  const [rankedMatches, setRankedMatches] = useState<
    {
      user_id: string;
      username: string;
      display_name: string;
      offer_count: number;
      receive_count: number;
    }[]
  >([]);
  const [visitor, setVisitor] = useState(initialVisitor);
  const [session, setSession] = useState<Session | null>(null);
  const [boot, setBoot] = useState(configured);
  const [section, setSection] = useState<Section>("inicio");
  const [auth, setAuth] = useState<
    "login" | "register" | "recover" | "reset" | null
  >(null);
  const [legal, setLegal] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message || auth || (!session && !visitor)) return;
    const timer = window.setTimeout(
      () => setMessage((value) => (value === message ? "" : value)),
      4000,
    );
    return () => window.clearTimeout(timer);
  }, [message, auth, session, visitor]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collection, setCollection] = useState("");
  const [publishedStickers, setStickers] = useState<Sticker[]>([]);
  const [loadedCatalogue, setLoadedCatalogue] = useState("");
  const [remoteInventory, setInventory] = useState<Inventory[]>([]);
  const localAlbum = useLocalAlbum();
  const stickers = visitor ? referenceStickers : publishedStickers;
  const inventory = visitor ? localAlbum.inventory : remoteInventory;
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const award = useCollectionCelebration(
    stickers,
    inventory,
    visitor ? "local" : (session?.user.id ?? ""),
    visitor ? localAlbum.ready : !!session && publishedStickers.length > 0,
  );
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeItems, setTradeItems] = useState<TradeItem[]>([]);
  const [tradePeople, setTradePeople] = useState<
    Record<string, Pick<Profile, "username" | "display_name">>
  >({});
  const [tradeConfirmations, setTradeConfirmations] = useState<
    { trade_id: string; user_id: string; confirmed_at: string | null }[]
  >([]);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      message: string;
      read_at: string | null;
      created_at: string;
    }[]
  >([]);
  const [friends, setFriends] = useState<
    { requester_id: string; recipient_id: string; status: string }[]
  >([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("");
  const [series, setSeries] = useState("");
  const [edition, setEdition] = useState("");
  const [list, setList] = useState(false);
  const [other, setOther] = useState<Profile | null>(null);
  const [theirInventory, setTheirInventory] = useState<Inventory[]>([]);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [visibility, setVisibility] = useState("private");
  const [matchNotify, setMatchNotify] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [validated, setValidated] = useState<ReturnType<
    typeof parseCatalog
  > | null>(null);
  const [shared, setShared] = useState<
    { id: string; kind: string; expires_at: string }[]
  >([]);
  const [sharedRows, setSharedRows] = useState<
    { official_code: string; name: string; quantity: number }[] | null
  >(null);
  const [tradeFilter, setTradeFilter] = useState("all");
  const [repeatView, setRepeatView] = useState<"copies" | "trades">("copies");
  const [albumView, setAlbumView] = useState<"pages" | "owned">("pages");
  const [profileTab, setProfileTab] = useState<"collection" | "trade">(
    "collection",
  );
  const [theirAllowed, setTheirAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<{ blocked_id: string }[]>([]);
  const [history, setHistory] = useState<
    { created_at: string; delta: number }[]
  >([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number> | null>(null);
  const go = (s: Section) => {
    if (s === "repetidos") setRepeatView("copies");
    setSection(s);
    setOther(null);
    setSearch("");
    setMessage("");
    setError("");
    window.history.replaceState(null, "", `#${s}`);
  };
  const act = async (fn: () => Promise<void>, success?: string) => {
    if (visitor) {
      setError(
        "Estás en modo visita. Inicia sesión para consultar o guardar datos reales.",
      );
      return;
    }
    const requestedBy = activeUser.current;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      if (success && requestedBy === activeUser.current) setMessage(success);
      return true;
    } catch (e) {
      if (requestedBy !== activeUser.current) return;
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo guardar. Vuelve a intentarlo.",
      );
      return false;
    } finally {
      if (requestedBy === activeUser.current) setBusy(false);
    }
  };
  const rpc = async (name: string, args: Record<string, unknown> = {}) => {
    if (visitor) throw new Error("El modo visita es de solo lectura.");
    const changesInventory = [
      "change_quantity",
      "trade_action",
      "recover_album_from_history",
      "add_duplicates",
    ].includes(name);
    const requestedBy = activeUser.current;
    if (changesInventory) inventoryRevision.current++;
    try {
      const { data, error, status } = await database().rpc(name, args);
      if (error) throw Object.assign(new Error(error.message), { status });
      return data;
    } finally {
      if (changesInventory && requestedBy === activeUser.current)
        inventoryRevision.current++;
    }
  };
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (!configured) return;
    const db = database();
    const acceptSession = (next: Session | null) => {
      const id = next?.user.id ?? null;
      if (activeUser.current !== id) {
        inventoryRevision.current++;
        loadSequence.current++;
        privacyDraftRevision.current = 0;
        privacySavedRevision.current = 0;
        setLoading(false);
        setBusy(false);
        setProfile(null);
        setCollections([]);
        setCollection("");
        setStickers([]);
        setLoadedCatalogue("");
        setInventory([]);
        setTrades([]);
        setTradeItems([]);
        setTradePeople({});
        setTradeConfirmations([]);
        setNotifications([]);
        setFriends([]);
        setPeople([]);
        setOther(null);
        setTheirInventory([]);
        setSelection({});
        setShared([]);
        setSharedRows(null);
        setBlocks([]);
        setHistory([]);
        setRankedMatches([]);
        setDraft(null);
        setDraftId(null);
        setAdminInput("");
        setValidated(null);
        setVisibility("private");
        setMatchNotify(false);
        setMessage("");
        setError("");
        setSection("inicio");
        pendingQuantity.current = {};
      }
      activeUser.current = id;
      setSession(next);
    };
    db.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      acceptSession(data.session);
      setBoot(false);
    });
    const { data } = db.auth.onAuthStateChange((event, s) => {
      acceptSession(s);
      if (event === "PASSWORD_RECOVERY") setAuth("reset");
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const load = useCallback(async () => {
    if (!session || visitor) return;
    const sequence = ++loadSequence.current;
    const isCurrent = () =>
      activeUser.current === session.user.id &&
      loadSequence.current === sequence;
    setLoading(true);
    const db = database();
    const revisionAtStart = inventoryRevision.current;
    try {
      const [p, c, inv, f, t, ti, n, pr, sh, b, h] = await Promise.all([
        db
          .from("profiles")
          .select("id,username,display_name,is_admin")
          .eq("id", session.user.id)
          .single(),
        db.from("collections").select("*").order("name"),
        inventoryFor(session.user.id).then((data) => ({ data, error: null })),
        db.from("friendships").select("*"),
        db
          .from("trade_proposals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        db
          .from("trade_items")
          .select("*,stickers(id,official_code,name,collection_id)")
          .limit(10000),
        db
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        db
          .from("user_privacy_settings")
          .select("*")
          .eq("user_id", session.user.id)
          .single(),
        db.from("shared_lists").select("*").is("revoked_at", null),
        db.from("user_blocks").select("*"),
        db
          .from("inventory_transactions")
          .select("delta,created_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      if (!isCurrent()) return;
      for (const res of [p, c, inv, f, t, ti, n, pr, sh, b, h])
        if (res.error) throw new Error(res.error.message);
      const tradeIds = (t.data ?? []).map((row) => row.id);
      const partnerIds = [
        ...new Set([
          ...(t.data ?? []).map((row) =>
            row.sender_id === session.user.id ? row.receiver_id : row.sender_id,
          ),
          ...(f.data ?? [])
            .filter((row) => row.status === "accepted")
            .map((row) =>
              row.requester_id === session.user.id
                ? row.recipient_id
                : row.requester_id,
            ),
        ]),
      ];
      const [participants, partners] = await Promise.all([
        tradeIds.length
          ? db
              .from("trade_participants")
              .select("trade_id,user_id,confirmed_at")
              .in("trade_id", tradeIds)
          : Promise.resolve({ data: [], error: null }),
        partnerIds.length
          ? db
              .from("profiles")
              .select("id,username,display_name")
              .in("id", partnerIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!isCurrent()) return;
      for (const res of [participants, partners])
        if (res.error) throw new Error(res.error.message);
      setTradeConfirmations(participants.data ?? []);
      setTradePeople(
        Object.fromEntries((partners.data ?? []).map((row) => [row.id, row])),
      );
      setProfile(p.data);
      setCollections(c.data ?? []);
      if (revisionAtStart === inventoryRevision.current)
        setInventory(inv.data ?? []);
      setFriends(f.data ?? []);
      setTrades(t.data ?? []);
      setTradeItems(ti.data ?? []);
      setNotifications(n.data ?? []);
      setShared(sh.data ?? []);
      setBlocks(b.data ?? []);
      setHistory(h.data ?? []);
      if (privacyDraftRevision.current === privacySavedRevision.current) {
        setVisibility(pr.data.visibility);
        setMatchNotify(pr.data.match_notifications);
      }
      setCollection((v) => v || c.data?.[0]?.id || "");
    } catch (e) {
      if (!isCurrent()) return;
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los datos",
      );
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [session, visitor]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!session || visitor || !collection) return;
    let alive = true;
    setStickers([]);
    (async () => {
      let all: Sticker[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await database()
          .from("stickers")
          .select("*,teams(name),sticker_series(name)")
          .eq("collection_id", collection)
          .eq("published", true)
          .order("official_code")
          .order("id")
          .range(offset, offset + 499);
        if (error) {
          if (alive) setError(error.message);
          return;
        }
        all = all.concat(data as unknown as Sticker[]);
        if (data.length < 500) break;
      }
      if (alive) {
        setStickers(
          all.sort(
            (a, b) =>
              (a.catalog_order ?? Number.MAX_SAFE_INTEGER) -
                (b.catalog_order ?? Number.MAX_SAFE_INTEGER) ||
              a.official_code.localeCompare(b.official_code, "es", {
                numeric: true,
              }) ||
              a.id.localeCompare(b.id),
          ),
        );
        setLoadedCatalogue(collection);
      }
    })();
    return () => {
      alive = false;
    };
  }, [session, collection, visitor]);
  useEffect(() => {
    if (!session || visitor) return;
    const channel = database()
      .channel(`inventory-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_inventory",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          void load();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", refresh);
    const interval = setInterval(refresh, 30000);
    return () => {
      void database().removeChannel(channel);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(interval);
    };
  }, [session, load, visitor]);
  useEffect(() => {
    if (!session || visitor) return;
    const token = new URLSearchParams(window.location.search).get("lista");
    if (token)
      void act(async () => {
        const data = await rpc("read_shared_list", { p_id: token });
        if (activeUser.current === session.user.id) setSharedRows(data);
      });
  }, [session, visitor]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!session || visitor || !collection) return;
    let active = true;
    void database()
      .rpc("find_matches", { p_collection: collection })
      .then(({ data, error }) => {
        if (active && activeUser.current === session.user.id) {
          if (error) setError(error.message);
          else setRankedMatches(data ?? []);
        }
      });
    return () => {
      active = false;
    };
  }, [session, collection, inventory, friends, visitor]);
  const current = collections.find((c) => c.id === collection);
  const stats = statistics(stickers, inventory);
  const own = new Map(inventory.map((i) => [i.sticker_id, i]));
  const their = new Map(theirInventory.map((i) => [i.sticker_id, i]));
  const matches = compare(stickers, inventory, theirInventory);
  const homeFriends: HomeFriend[] = friends
    .filter((f) => f.status === "accepted")
    .flatMap((f) => {
      const id =
        f.requester_id === session?.user.id ? f.recipient_id : f.requester_id;
      const person = tradePeople[id];
      if (!person) return [];
      const opportunity = rankedMatches.find((m) => m.user_id === id);
      return [
        {
          user_id: id,
          ...person,
          ...(opportunity
            ? {
                offer_count: opportunity.offer_count,
                receive_count: opportunity.receive_count,
              }
            : {}),
        },
      ];
    })
    .sort(
      (a, b) =>
        Math.min(b.offer_count ?? 0, b.receive_count ?? 0) -
          Math.min(a.offer_count ?? 0, a.receive_count ?? 0) ||
        (b.offer_count ?? 0) +
          (b.receive_count ?? 0) -
          ((a.offer_count ?? 0) + (a.receive_count ?? 0)) ||
        a.display_name.localeCompare(b.display_name, "es"),
    );
  const unread = notifications.filter((n) => !n.read_at).length;
  const filtered = stickers.filter(
    (s) =>
      searchText(
        `${s.official_code} ${s.name} ${s.teams?.name ?? ""} ${s.sticker_series?.name ?? ""}`,
      ).includes(searchText(search)) &&
      (!team || s.teams?.name === team) &&
      (!series || s.sticker_series?.name === series) &&
      (!edition || s.edition === edition) &&
      (section !== "repetidos" || (own.get(s.id)?.quantity ?? 0) > 1) &&
      (section !== "faltantes" || !own.get(s.id)?.quantity),
  );
  const [page, setPage] = useState(0);
  const listHasFilters = Boolean(search || team || series || edition);
  useEffect(
    () =>
      setPage((p) =>
        Math.min(p, Math.max(0, Math.ceil(filtered.length / 48) - 1)),
      ),
    [filtered.length],
  );
  useEffect(
    () => setPage(0),
    [search, team, series, edition, section, collection],
  );
  async function quantity(s: Sticker, delta: number) {
    if (visitor) {
      try {
        localAlbum.change(s.id, delta);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
        throw e;
      }
      return;
    }
    const requestedBy = activeUser.current;
    const saved = await act(async () => {
      const pending = pendingQuantity.current[s.id];
      if (pending && pending.delta !== delta)
        throw new Error(
          "Reintenta primero el mismo cambio pendiente para confirmar su guardado.",
        );
      const operation = pending?.operation ?? crypto.randomUUID();
      pendingQuantity.current[s.id] = { operation, delta };
      let q: number;
      try {
        q = await rpc("change_quantity", {
          p_sticker: s.id,
          p_delta: delta,
          p_operation: operation,
        });
      } catch (e) {
        if (requestedBy !== activeUser.current) return;
        if (
          e instanceof Error &&
          !/fetch|network|connection|timeout|failed/i.test(e.message)
        )
          delete pendingQuantity.current[s.id];
        throw e;
      }
      if (requestedBy !== activeUser.current) return;
      delete pendingQuantity.current[s.id];
      setInventory((v) => [
        ...v.filter((i) => i.sticker_id !== s.id),
        {
          user_id: session!.user.id,
          sticker_id: s.id,
          quantity: q,
          reserved: v.find((i) => i.sticker_id === s.id)?.reserved ?? 0,
        },
      ]);
    }, "Cantidad guardada");
    if (!saved)
      throw new Error(
        "No se pudo guardar la cantidad. Reintenta para confirmar el cambio.",
      );
  }
  async function findPeople(query: string) {
    await act(async () => {
      if (query.trim().length < 3)
        throw new Error("Escribe al menos 3 caracteres.");
      const safe = query.replace(/[^a-z0-9_]/gi, "");
      if (safe.length < 3) throw new Error("Busca por nombre de usuario.");
      const { data, error } = await database()
        .from("profiles")
        .select("id,username,display_name,is_admin")
        .like("username", `${safe.toLowerCase().replace(/_/g, "\\_")}%`)
        .neq("id", session!.user.id)
        .limit(30);
      if (error) throw error;
      setPeople(data ?? []);
    });
  }
  async function addDuplicates(s: Sticker, extras: number, operation: string) {
    if (visitor) {
      localAlbum.addDuplicates(s.id, extras);
      return;
    }
    const requestedBy = activeUser.current;
    let failure: unknown;
    const saved = await act(async () => {
      const q = await rpc("add_duplicates", {
        p_sticker: s.id,
        p_extras: extras,
        p_operation: operation,
      }).catch((e) => {
        failure = e;
        throw e;
      });
      if (requestedBy !== activeUser.current) return;
      setInventory((v) => [
        ...v.filter((i) => i.sticker_id !== s.id),
        {
          user_id: requestedBy!,
          sticker_id: s.id,
          quantity: q,
          reserved: v.find((i) => i.sticker_id === s.id)?.reserved ?? 0,
        },
      ]);
    }, "Repetidos guardados");
    if (!saved) {
      const rejectedMessage =
        failure instanceof Error &&
        "status" in failure &&
        failure.status === 400
          ? failure.message
          : null;
      throw new DuplicateEntryError(
        rejectedMessage ?? "No se ha podido confirmar la entrada de repetidos.",
        rejectedMessage === null,
      );
    }
  }

  async function openComparison(
    p: Profile,
    intent: "collection" | "trade" = "collection",
  ) {
    await act(async () => {
      const requestedBy = activeUser.current;
      const permission = await database().rpc("can_view_inventory", {
        owner_id: p.id,
      });
      if (permission.error) throw permission.error;
      const data = permission.data ? await inventoryFor(p.id) : [];
      if (activeUser.current !== requestedBy) return;
      go("comparar");
      setTheirAllowed(Boolean(permission.data));
      setProfileTab(intent);
      setTheirInventory(data ?? []);
      setOther(p);
      setSelection({});
      setDraft(null);
      setDraftId(null);
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  async function friendAction(id: string, action: string) {
    await act(async () => {
      await rpc("friend_action", { p_other: id, p_action: action });
      await load();
    }, "Solicitud actualizada");
  }
  async function authenticate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await act(async () => {
      if (!configured)
        throw new Error(
          "La conexión con Supabase todavía no está configurada.",
        );
      const db = database();
      const email = String(f.get("email") ?? "");
      const password = String(f.get("password") ?? "");
      if (auth === "recover") {
        if (accountUsername(email.trim()))
          throw new Error(
            "Las cuentas sin correo no tienen recuperación automática en esta versión.",
          );
        const { error } = await db.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage("Si la cuenta existe, recibirás instrucciones por correo.");
      } else if (auth === "reset") {
        const { error } = await db.auth.updateUser({ password });
        if (error) throw error;
        setAuth(null);
        setMessage("Contraseña actualizada.");
      } else if (auth === "register") {
        const username = String(f.get("username") ?? "")
          .trim()
          .toLowerCase();
        const { data, error } = await db.auth.signUp({
          email: usernameEmail(username),
          password,
          options: {
            data: { display_name: username },
          },
        });
        if (error)
          throw new Error(
            "No se ha podido crear la cuenta. Prueba otro usuario o inténtalo de nuevo más tarde.",
          );
        if (!data.session)
          throw new Error(
            "No se ha podido abrir la cuenta. El administrador debe revisar que Supabase permite el registro sin confirmación de correo.",
          );
        setAuth(null);
        setMessage("Tu cuenta está lista.");
      } else {
        const { error } = await db.auth.signInWithPassword({
          email: loginEmail(String(f.get("username") ?? "")),
          password,
        });
        if (error)
          throw new Error(
            "No se ha podido entrar. Revisa tu usuario y contraseña o inténtalo de nuevo.",
          );
        setAuth(null);
      }
    });
  }
  const notices = (
    <>
      {!configured && !visitor && (
        <div className="notice">
          <ShieldCheck size={18} />
          <span>
            Conexión pendiente: configura Supabase para activar cuentas,
            catálogo y guardado.
          </span>
        </div>
      )}
      {error && (
        <div className="alert error" role="alert">
          {error}
          <button
            className="icon-button"
            onClick={() => setError("")}
            aria-label="Cerrar error"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {message && (
        <div className="alert success" role="status">
          <Check size={18} />
          {message}
        </div>
      )}
    </>
  );
  if (boot && !visitor)
    return (
      <main className="auth-page" role="status">
        <Logo />
        <p>Conectando con tu colección…</p>
      </main>
    );
  if (auth)
    return (
      <main className="auth-page">
        <a href="#inicio" onClick={() => setAuth(null)}>
          <Logo />
        </a>
        <form className="auth-card" onSubmit={authenticate}>
          <span className="eyebrow">TU PRÓXIMO CROMO EMPIEZA AQUÍ</span>
          <h1>
            {auth === "register"
              ? "Únete al equipo."
              : auth === "recover"
                ? "Recupera tu cuenta."
                : auth === "reset"
                  ? "Nueva contraseña."
                  : "Qué bien verte de nuevo."}
          </h1>
          {notices}
          {auth === "register" && (
            <p>
              Elige tu usuario y una contraseña. No necesitas correo. Guarda
              bien tu contraseña: esta versión todavía no ofrece recuperación
              automática para cuentas sin correo.
            </p>
          )}
          {auth !== "reset" && auth !== "recover" && (
            <label>
              Nombre de usuario
              <input
                name="username"
                aria-label="Nombre de usuario"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={auth === "register" ? 24 : 254}
                pattern={auth === "register" ? "[a-zA-Z0-9_]{3,24}" : undefined}
                title="Entre 3 y 24 caracteres: letras, números y guion bajo"
              />
              {auth === "register" && (
                <small>
                  Entre 3 y 24 caracteres. No podrás cambiar tu usuario de
                  acceso.
                </small>
              )}
            </label>
          )}
          {auth === "recover" && (
            <p>
              Las cuentas creadas solo con usuario no tienen recuperación
              automática por ahora. Si tenías una cuenta anterior con correo,
              puedes solicitar instrucciones aquí.
            </p>
          )}
          {auth === "recover" && (
            <label>
              Correo electrónico
              <input name="email" type="email" required autoComplete="email" />
            </label>
          )}
          {auth !== "recover" && (
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete={
                  auth === "login" ? "current-password" : "new-password"
                }
              />
            </label>
          )}
          {auth === "register" && (
            <label className="checkbox">
              <input type="checkbox" required />
              He leído la información de privacidad y acepto las condiciones de
              uso.
            </label>
          )}
          <button disabled={busy}>
            {busy
              ? "Un momento…"
              : auth === "login"
                ? "Entrar"
                : auth === "register"
                  ? "Crear mi cuenta"
                  : auth === "recover"
                    ? "Enviar instrucciones"
                    : "Guardar contraseña"}
            <ArrowRight size={18} />
          </button>
          {auth === "login" && (
            <>
              <button
                type="button"
                className="text-button"
                onClick={() => setAuth("recover")}
              >
                He olvidado mi contraseña
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setAuth("register")}
              >
                Crear una cuenta
              </button>
            </>
          )}
          {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" &&
            auth === "login" && (
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  void act(async () => {
                    const { error } = await database().auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: window.location.origin },
                    });
                    if (error) throw error;
                  })
                }
              >
                Continuar con Google
              </button>
            )}
          <button
            type="button"
            className="text-button"
            onClick={() => setLegal(true)}
          >
            Privacidad y condiciones
          </button>
        </form>
        {legal && <Legal close={() => setLegal(false)} />}
      </main>
    );
  if (!session && !visitor)
    return (
      <Landing
        setAuth={setAuth}
        enterVisitor={() => {
          setVisitor(true);
          setSection("inicio");
          setError("");
          setMessage("");
        }}
        setLegal={setLegal}
        legal={legal}
        notices={notices}
      />
    );
  if (
    session &&
    !visitor &&
    (!profile || !collection || loadedCatalogue !== collection)
  )
    return (
      <main className="auth-page">
        <Logo />
        <p role="status">Cargando el álbum guardado de tu cuenta…</p>
        {notices}
        {error && (
          <button type="button" onClick={() => window.location.reload()}>
            Volver a cargar mi álbum
          </button>
        )}
      </main>
    );
  const viewerId = session?.user.id ?? "";
  const card = (s: Sticker) => {
    const i = own.get(s.id);
    const q = i?.quantity ?? 0;
    return (
      <article key={s.id} className={`sticker-card ${list ? "compact" : ""}`}>
        <button
          className="sticker-open"
          disabled={busy}
          onClick={() => void quantity(s, q ? -1 : 1).catch(() => {})}
        >
          <div className={`sticker-visual ${q ? "owned" : ""}`}>
            <span>{s.teams?.name ?? "Serie especial"}</span>
            <span className="card-symbol">
              {q ? <Check size={34} /> : <Album size={34} />}
            </span>
            <strong>#{s.official_code}</strong>
            <small>{q ? "LO TENGO" : "ME FALTA"}</small>
          </div>
          <div className="sticker-info">
            <span className="eyebrow">
              {s.edition} · {s.variant}
            </span>
            <h3>{s.name}</h3>
            <p>{s.sticker_series?.name ?? "Colección general"}</p>
          </div>
        </button>
        <div className="quantity">
          <button
            className="secondary"
            aria-label={`Quitar una unidad de ${s.name}`}
            disabled={
              busy || q === 0 || (i?.reserved ?? 0) > Math.max(q - 2, 0)
            }
            onClick={() => void quantity(s, -1).catch(() => {})}
          >
            −
          </button>
          <span aria-label={`${q} unidades`}>
            <strong>{q}</strong> unidades
          </span>
          <button
            className="secondary"
            aria-label={`Añadir una unidad de ${s.name}`}
            disabled={busy}
            onClick={() => void quantity(s, 1).catch(() => {})}
          >
            +
          </button>
        </div>
        {q > 1 && (
          <p className="inventory-detail">
            {available(i)} disponibles · {i?.reserved ?? 0} reservados
          </p>
        )}
      </article>
    );
  };
  return (
    <div className={`app-shell section-${section}`}>
      <aside className="sidebar">
        <a href="#inicio" onClick={() => go("inicio")}>
          <Logo />
        </a>
        <span className="sidebar-label">TU ZONA DE JUEGO</span>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={section === n.id ? "nav-active" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={20} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-season">
          <div className="season-ball">✦</div>
          <span>TEMPORADA</span>
          <strong>2026 / 27</strong>
          <p>
            La ilusión de siempre.
            <br />
            Una nueva forma de coleccionar.
          </p>
        </div>
        <button className="sidebar-help" onClick={() => setLegal(true)}>
          <CircleHelp size={18} /> Ayuda y privacidad
        </button>
        <button className="sidebar-user" onClick={() => go("perfil")}>
          <span className="avatar">
            {profile?.display_name.slice(0, 1) ?? "N"}
          </span>
          <span>
            <strong>
              {profile?.display_name ??
                (visitor ? "Visitante sin cuenta" : "Coleccionista")}
            </strong>
            <small>
              {visitor ? "En este dispositivo" : `@${profile?.username ?? ""}`}
            </small>
          </span>
          <Settings size={17} />
        </button>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div className="breadcrumb">
            <span className="header-brand">
              <Logo />
            </span>
            <ChevronRight size={14} />{" "}
            <strong>{section === "inicio" ? "Inicio" : titles[section]}</strong>
          </div>
          <div className="header-actions">
            {!visitor && (
              <select
                aria-label="Colección activa"
                value={collection}
                onChange={(e) => {
                  setCollection(e.target.value);
                  setOther(null);
                }}
              >
                {visitor && <option value="">Vista de pantallas</option>}
                {collections.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <button
              className="icon-button notification-button"
              aria-label={`Notificaciones: ${unread} pendientes`}
              onClick={() => go("notificaciones")}
            >
              <Bell size={21} />
              {unread > 0 && <span>{unread}</span>}
            </button>
            <button
              className="avatar"
              onClick={() => go("perfil")}
              aria-label="Mi perfil"
            >
              {profile?.display_name.slice(0, 1) ?? "N"}
            </button>
          </div>
        </header>
        <main className="workspace" id="contenido">
          {visitor && (
            <div className="notice visitor-banner" role="status">
              <ShieldCheck size={20} />
              <div>
                <strong>Modo visita · Sin cuenta</strong>
                <p>Tu álbum se guarda en este navegador.</p>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setVisitor(false);
                  setSection("inicio");
                  setError("");
                }}
              >
                Salir de la visita
              </button>
            </div>
          )}
          <div
            className="workspace-notices"
            aria-label="Avisos de tu colección"
          >
            {notices}
            {visitor && localAlbum.error && (
              <p role="alert">{localAlbum.error}</p>
            )}
            {loading && (
              <div role="status" className="loading-note">
                Sincronizando tu colección…
              </div>
            )}
          </div>
          <div
            className={`page-heading ${section === "album" ? "album-page-heading" : ""}`}
          >
            <div>
              <span className="eyebrow">
                {section === "inicio"
                  ? `HOLA, ${profile?.display_name?.toUpperCase() ?? "COLECCIONISTA"}`
                  : "NEXO / TU COLECCIÓN"}
              </span>
              <h1>{titles[section]}</h1>
              <p>
                {section === "inicio"
                  ? "Cada cromo te acerca a completar tu historia. ¿Seguimos?"
                  : current?.name}
              </p>
            </div>
          </div>
          {sharedRows && (
            <section className="panel">
              <div className="section-heading">
                <h2>Lista compartida contigo</h2>
                <button
                  className="text-button"
                  onClick={() => {
                    setSharedRows(null);
                    window.history.replaceState(
                      null,
                      "",
                      window.location.pathname,
                    );
                  }}
                >
                  Cerrar
                </button>
              </div>
              {sharedRows.map((r, i) => (
                <p key={i}>
                  #{r.official_code} · {r.name} ·{" "}
                  {r.quantity === 0 ? "Falta" : `${r.quantity} disponibles`}
                </p>
              ))}
              {!sharedRows.length && <p>La lista está vacía.</p>}
            </section>
          )}
          {section === "inicio" && (
            <HomeOverview
              owned={stats.owned}
              total={stats.total}
              duplicates={stats.available}
              friends={friends.filter((f) => f.status === "accepted").length}
              opportunities={homeFriends}
              busy={busy}
              prepareTrade={(friend) =>
                void openComparison(
                  {
                    id: friend.user_id,
                    username: friend.username,
                    display_name: friend.display_name,
                    is_admin: false,
                  },
                  "trade",
                )
              }
              go={go}
            />
          )}
          {section === "album" && (
            <>
              {albumView === "owned" && (
                <div
                  className="tabs"
                  role="group"
                  aria-label="Vista de mi álbum"
                >
                  <button type="button" onClick={() => setAlbumView("pages")}>
                    Por equipos
                  </button>
                  <button
                    type="button"
                    className="active"
                    onClick={() => setAlbumView("owned")}
                  >
                    Ver lista de lo que tengo
                  </button>
                </div>
              )}
              {albumView === "owned" ? (
                <OwnedCollectionList
                  key={collection}
                  stickers={stickers}
                  inventory={inventory}
                  collectionName={current?.name}
                />
              ) : (
                <VisualAlbum
                  stickers={stickers}
                  inventory={inventory}
                  visitor={visitor}
                  busy={busy || (visitor && !localAlbum.ready)}
                  local={visitor}
                  onScan={() => go("escaner")}
                  onOwnedList={() => setAlbumView("owned")}
                  collectionName={current?.name}
                  onQuantity={quantity}
                  onNavigate={go}
                />
              )}
            </>
          )}
          {section === "repetidos" && (
            <div
              className="tabs"
              role="group"
              aria-label="Repetidos e intercambios"
            >
              <button
                type="button"
                className={repeatView === "copies" ? "active" : ""}
                onClick={() => setRepeatView("copies")}
              >
                Mis repetidos
              </button>
              <button
                type="button"
                className={repeatView === "trades" ? "active" : ""}
                onClick={() => setRepeatView("trades")}
              >
                Cambiar con amigos
              </button>
            </div>
          )}
          {(section === "faltantes" ||
            (section === "repetidos" && repeatView === "copies")) && (
            <>
              {section === "repetidos" ? (
                <DuplicateEntry
                  key={`${viewerId}:${collection}`}
                  stickers={stickers}
                  inventory={inventory}
                  busy={busy || (visitor && !localAlbum.ready)}
                  onAdd={addDuplicates}
                  onScan={() => go("escaner")}
                />
              ) : (
                <div className="collection-add-actions">
                  <button
                    className="glow-cta"
                    onClick={() => setQuickAddOpen(true)}
                  >
                    <Plus size={18} /> Añadir cromos
                  </button>
                  <button className="secondary" onClick={() => go("escaner")}>
                    <Camera size={18} /> Escanear foto
                  </button>
                </div>
              )}
              <ListOptions
                collapsed={section === "repetidos"}
                activeFilters={listHasFilters}
              >
                <div className="tabs">
                  {[
                    { id: "album", label: "Todos los cromos" },
                    {
                      id: "repetidos",
                      label: `Mis repetidos · ${stats.duplicates}`,
                    },
                    { id: "faltantes", label: `Me faltan · ${stats.missing}` },
                  ].map((x) => (
                    <button
                      key={x.id}
                      className={section === x.id ? "active" : ""}
                      onClick={() => go(x.id as Section)}
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
                <div className="toolbar">
                  <label className="search-field">
                    <Search size={18} />
                    <input
                      aria-label="Buscar cromo"
                      placeholder="Número, jugador o equipo…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filtrar por equipo"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                  >
                    <option value="">Todos los equipos</option>
                    {Array.from(
                      new Set(
                        stickers.map((s) => s.teams?.name).filter(Boolean),
                      ),
                    ).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Filtrar por serie"
                    value={series}
                    onChange={(e) => setSeries(e.target.value)}
                  >
                    <option value="">Todas las series</option>
                    {Array.from(
                      new Set(
                        stickers
                          .map((s) => s.sticker_series?.name)
                          .filter(Boolean),
                      ),
                    ).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Filtrar por edición"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                  >
                    <option value="">Todas las ediciones</option>
                    {Array.from(new Set(stickers.map((s) => s.edition))).map(
                      (x) => (
                        <option key={x}>{x}</option>
                      ),
                    )}
                  </select>
                  <button
                    className="icon-button"
                    aria-label={
                      list ? "Mostrar cuadrícula" : "Mostrar lista rápida"
                    }
                    onClick={() => setList(!list)}
                  >
                    {list ? <Grid2X2 size={20} /> : <LayoutList size={20} />}
                  </button>
                </div>
                <div className="export-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        `nexo-${section}.txt`,
                        filtered
                          .map(
                            (s) =>
                              `#${s.official_code} ${s.name}${section === "repetidos" ? ` · ${available(own.get(s.id))} disponibles` : ""}`,
                          )
                          .join("\n"),
                      )
                    }
                  >
                    <Download size={16} /> Exportar lista
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      void act(async () => {
                        const token = await rpc("create_shared_list", {
                          p_collection: collection,
                          p_kind:
                            section === "repetidos" ? "duplicates" : "missing",
                        });
                        const url = `${location.origin}/?lista=${token}`;
                        await navigator.clipboard.writeText(url);
                        await load();
                      }, "Enlace copiado. Caduca en 7 días y puedes revocarlo en Perfil.")
                    }
                  >
                    <Copy size={16} /> Crear enlace compartido
                  </button>
                </div>
              </ListOptions>
              {section === "repetidos" && listHasFilters && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setSearch("");
                    setTeam("");
                    setSeries("");
                    setEdition("");
                  }}
                >
                  Quitar filtros de mi lista
                </button>
              )}
              <p className="results-count">
                {filtered.length} cromos · {stats.reserved} unidades reservadas
              </p>
              {filtered.length ? (
                <>
                  {section === "repetidos" ? (
                    <DuplicatesList
                      stickers={filtered.slice(page * 48, (page + 1) * 48)}
                      inventory={inventory}
                      busy={busy}
                      onChange={quantity}
                    />
                  ) : (
                    <div className={list ? "sticker-list" : "sticker-grid"}>
                      {filtered.slice(page * 48, (page + 1) * 48).map(card)}
                    </div>
                  )}
                  <div className="pagination">
                    <button
                      className="secondary"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {page + 1} de {Math.ceil(filtered.length / 48)}
                    </span>
                    <button
                      className="secondary"
                      disabled={(page + 1) * 48 >= filtered.length}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              ) : (
                <section className="panel">
                  <Empty
                    title={
                      section === "repetidos" && !listHasFilters
                        ? "Todavía no tienes repetidos"
                        : stickers.length
                          ? "No hay cromos con estos filtros"
                          : "El catálogo está esperando su primer cromo verificado"
                    }
                  >
                    {section === "repetidos" && !listHasFilters
                      ? "Busca un nombre en Añadir repetidos y registra las copias que tienes para cambiar."
                      : stickers.length
                        ? "Prueba otra búsqueda o filtro."
                        : "El administrador debe importar un listado contrastado. No añadimos jugadores, códigos ni cantidades inventadas."}
                  </Empty>
                </section>
              )}
            </>
          )}
          {section === "amigos" && (
            <>
              <section className="panel">
                <span className="eyebrow">MOTOR DE COINCIDENCIAS</span>
                <h2>Tus mejores oportunidades</h2>
                <p>
                  Ordenadas por cromos útiles para ambos. Solo se comparan
                  amigos que te autorizan a ver su colección.
                </p>
                {rankedMatches.filter(
                  (m) => m.offer_count > 0 || m.receive_count > 0,
                ).length ? (
                  rankedMatches
                    .filter((m) => m.offer_count > 0 || m.receive_count > 0)
                    .map((m) => (
                      <div className="person-row" key={m.user_id}>
                        <span className="avatar">{m.display_name[0]}</span>
                        <div>
                          <strong>{m.display_name}</strong>
                          <p>
                            Puedes ofrecer {m.offer_count} · Puedes recibir{" "}
                            {m.receive_count}
                          </p>
                        </div>
                        <button
                          className="secondary"
                          onClick={() =>
                            void openComparison({
                              id: m.user_id,
                              username: m.username,
                              display_name: m.display_name,
                              is_admin: false,
                            })
                          }
                        >
                          Comparar y elegir
                        </button>
                      </div>
                    ))
                ) : (
                  <Empty title="Aún no hay coincidencias">
                    Añade cromos y amigos con colecciones compartidas para
                    encontrar oportunidades.
                  </Empty>
                )}
              </section>
              <section className="panel">
                <h2>Encuentra a tu próximo compañero</h2>
                <form
                  className="inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void findPeople(search);
                  }}
                >
                  <label className="search-field">
                    <Search size={18} />
                    <input
                      aria-label="Nombre de usuario"
                      placeholder="Busca por nombre de usuario (mín. 3 caracteres)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <button type="submit" disabled={busy}>
                    Buscar
                  </button>
                </form>
                {people.map((p) => (
                  <div className="person-row" key={p.id}>
                    <span className="avatar">{p.display_name[0]}</span>
                    <div>
                      <strong>{p.display_name}</strong>
                      <p>@{p.username}</p>
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={() => void openComparison(p)}
                    >
                      Ver perfil
                    </button>
                    <button
                      type="button"
                      disabled={
                        busy ||
                        friends.some((f) =>
                          [f.requester_id, f.recipient_id].includes(p.id),
                        )
                      }
                      onClick={() => void friendAction(p.id, "request")}
                    >
                      Añadir amigo
                    </button>
                  </div>
                ))}
              </section>
              <section className="panel">
                <h2>Amigos y solicitudes</h2>
                {!friends.length && (
                  <Empty title="El álbum se disfruta en equipo">
                    Busca el nombre de usuario de un amigo para enviar tu
                    primera solicitud.
                  </Empty>
                )}
                {friends.map((f) => {
                  const id =
                    f.requester_id === viewerId
                      ? f.recipient_id
                      : f.requester_id;
                  return (
                    <div className="person-row" key={id}>
                      <Users size={22} />
                      <span>
                        {f.status === "accepted"
                          ? "Amistad aceptada"
                          : f.recipient_id === viewerId
                            ? "Solicitud recibida"
                            : "Solicitud enviada"}
                      </span>
                      {f.status === "pending" &&
                        f.recipient_id === viewerId && (
                          <button
                            disabled={busy}
                            onClick={() => void friendAction(id, "accept")}
                          >
                            Aceptar
                          </button>
                        )}
                      {f.status === "accepted" && (
                        <button
                          className="secondary"
                          onClick={() =>
                            void act(async () => {
                              const { data, error } = await database()
                                .from("profiles")
                                .select("id,username,display_name,is_admin")
                                .eq("id", id)
                                .single();
                              if (error) throw error;
                              await openComparison(data);
                            })
                          }
                        >
                          Ver colección y comparar
                        </button>
                      )}
                      <button
                        className="text-button"
                        onClick={() => void friendAction(id, "remove")}
                      >
                        {f.status === "pending"
                          ? "Rechazar / retirar"
                          : "Eliminar amigo"}
                      </button>
                      <button
                        className="text-button"
                        onClick={() => void friendAction(id, "block")}
                      >
                        Bloquear
                      </button>
                    </div>
                  );
                })}
              </section>
            </>
          )}
          {other && (
            <section className="panel comparison">
              <button
                type="button"
                className="text-button"
                onClick={() => go("amigos")}
              >
                ← Volver a amigos
              </button>
              <div className="section-heading">
                <div>
                  <h2>{other.display_name}</h2>
                  <p>@{other.username}</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Cerrar comparador"
                  onClick={() => go("amigos")}
                >
                  <X />
                </button>
              </div>
              <div className="profile-friend-action">
                {friends.some(
                  (f) =>
                    [f.requester_id, f.recipient_id].includes(other.id) &&
                    f.status === "accepted",
                ) ? (
                  <span className="tag">Sois amigos</span>
                ) : friends.some((f) =>
                    [f.requester_id, f.recipient_id].includes(other.id),
                  ) ? (
                  <span className="tag">Solicitud pendiente</span>
                ) : (
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => void friendAction(other.id, "request")}
                  >
                    Añadir amigo
                  </button>
                )}
              </div>
              <div className="tabs" aria-label="Perfil del amigo">
                <button
                  type="button"
                  className={profileTab === "collection" ? "active" : ""}
                  onClick={() => setProfileTab("collection")}
                >
                  Ver colección
                </button>
                <button
                  type="button"
                  className={profileTab === "trade" ? "active" : ""}
                  onClick={() => setProfileTab("trade")}
                >
                  Preparar cambio
                </button>
              </div>
              {profileTab === "collection" ? (
                theirAllowed ? (
                  <VisualAlbum
                    stickers={stickers}
                    inventory={theirInventory}
                    visitor={false}
                    readOnly
                    busy={false}
                    collectionName={current?.name}
                    onQuantity={async () => {}}
                    onNavigate={() => {}}
                  />
                ) : (
                  <p>
                    Su colección es privada. Podrás verla cuando la comparta
                    contigo.
                  </p>
                )
              ) : (
                <>
                  <p>
                    Elige los repetidos que quieres cambiar con @
                    {other.username}. Selecciona al menos uno en cada lado.
                  </p>
                  {matches.offer.length === 0 &&
                    matches.receive.length === 0 && (
                      <p className="trade-next">
                        Para encontrar coincidencias, ambos necesitáis marcar
                        vuestros cromos y compartir el álbum con «Solo amigos»
                        desde Mi perfil.
                      </p>
                    )}
                  <div className="compare-columns">
                    {[
                      {
                        label: "Tú das",
                        items: matches.offer,
                        map: own,
                        giver: viewerId,
                      },
                      {
                        label: "Tú recibes",
                        items: matches.receive,
                        map: their,
                        giver: other.id,
                      },
                    ].map((part) => (
                      <div key={part.label}>
                        <h3>
                          {part.label} · {part.items.length}
                        </h3>
                        {part.items.length === 0 && (
                          <p>No hay coincidencias disponibles.</p>
                        )}
                        {part.items.map((s) => {
                          const key = `${part.giver}:${s.id}`;
                          return (
                            <label className="trade-select" key={key}>
                              <span>
                                #{s.official_code} · {s.name}
                                <small>
                                  {s.variant} · {s.edition}
                                </small>
                              </span>
                              <input
                                type="number"
                                aria-label={`Unidades de ${s.name} para ${part.label}`}
                                min={0}
                                max={available(part.map.get(s.id))}
                                value={selection[key] ?? 0}
                                onChange={(e) => {
                                  setSelection((v) => ({
                                    ...v,
                                    [key]: Math.max(
                                      0,
                                      Math.min(
                                        available(part.map.get(s.id)),
                                        Number(e.target.value) || 0,
                                      ),
                                    ),
                                  }));
                                  setDraft(null);
                                  setDraftId(null);
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <p>
                    No hace falta dar y recibir el mismo número de cromos.
                    Revisa las cartas especiales antes de acordar el cambio.
                  </p>
                  <div className="export-actions">
                    <button
                      className="secondary"
                      onClick={() => {
                        setDraft({ ...selection });
                        setDraftId(crypto.randomUUID());
                        setMessage(
                          "Borrador preparado en esta sesión. Revisa la selección y envíala cuando quieras.",
                        );
                      }}
                    >
                      Guardar borrador
                    </button>
                    <button
                      disabled={
                        busy ||
                        !Object.entries(draft ?? selection).some(
                          ([key, n]) => key.startsWith(`${viewerId}:`) && n > 0,
                        ) ||
                        !Object.entries(draft ?? selection).some(
                          ([key, n]) => key.startsWith(`${other.id}:`) && n > 0,
                        )
                      }
                      onClick={() =>
                        void act(async () => {
                          const chosen = draft ?? selection;
                          const items = Object.entries(chosen)
                            .filter(([, n]) => n > 0)
                            .map(([key, n]) => {
                              const [giver_id, sticker_id] = key.split(":");
                              return { giver_id, sticker_id, quantity: n };
                            });
                          const id = draftId ?? crypto.randomUUID();
                          setDraftId(id);
                          await rpc("propose_trade", {
                            p_receiver: other.id,
                            p_collection: collection,
                            p_items: items,
                            p_id: id,
                          });
                          setOther(null);
                          setSection("intercambios");
                          await load();
                        }, "Propuesta enviada")
                      }
                    >
                      Proponer este cambio <ArrowRight size={16} />
                    </button>
                    <button
                      className="text-button"
                      onClick={() => void friendAction(other.id, "block")}
                    >
                      Bloquear usuario
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        const reason = prompt(
                          "Explica la incidencia (mínimo 10 caracteres).",
                        );
                        if (reason)
                          void act(async () => {
                            await rpc("report_user", {
                              p_other: other.id,
                              p_reason: reason,
                            });
                          }, "Denuncia registrada");
                      }}
                    >
                      <Flag size={15} /> Denunciar
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
          {(section === "intercambios" ||
            (section === "repetidos" && repeatView === "trades")) && (
            <>
              {!visitor ? (
                <QuickTrade
                  userId={viewerId}
                  friends={homeFriends}
                  stickers={stickers}
                  inventory={inventory}
                  collection={collection}
                  onProfile={(friend) =>
                    void openComparison({
                      id: friend.user_id,
                      username: friend.username,
                      display_name: friend.display_name,
                      is_admin: false,
                    })
                  }
                  onSent={load}
                />
              ) : (
                <section className="panel">
                  <p>
                    Entra en tu cuenta para elegir un amigo y preparar un
                    intercambio.
                  </p>
                </section>
              )}
              <button
                type="button"
                className="text-button"
                onClick={() => go("amigos")}
              >
                Buscar compañeros
              </button>
              <div className="tabs">
                {[
                  { id: "all", label: "Mis cambios" },
                  { id: "history", label: "Historial" },
                ].map((x) => (
                  <button
                    key={x.id}
                    className={tradeFilter === x.id ? "active" : ""}
                    onClick={() => setTradeFilter(x.id)}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
              {!trades.length && (
                <section className="panel">
                  <Empty title="Aquí empezarán los buenos cambios">
                    Tus propuestas enviadas y recibidas aparecerán aquí. Empieza
                    eligiendo un amigo.
                  </Empty>
                </section>
              )}
              {trades
                .filter(
                  (t) =>
                    tradeFilter === "all" ||
                    (tradeFilter === "received" &&
                      t.receiver_id === viewerId) ||
                    (tradeFilter === "sent" && t.sender_id === viewerId) ||
                    (tradeFilter === "history" &&
                      ["completed", "cancelled", "rejected"].includes(
                        t.status,
                      )),
                )
                .map((t) => {
                  const partnerId =
                    t.sender_id === viewerId ? t.receiver_id : t.sender_id;
                  const partner = tradePeople[partnerId]?.username
                    ? `@${tradePeople[partnerId].username}`
                    : "tu amigo";
                  const mineConfirmed = tradeConfirmations.some(
                    (p) =>
                      p.trade_id === t.id &&
                      p.user_id === viewerId &&
                      p.confirmed_at,
                  );
                  const otherConfirmed = tradeConfirmations.some(
                    (p) =>
                      p.trade_id === t.id &&
                      p.user_id === partnerId &&
                      p.confirmed_at,
                  );
                  return (
                    <article
                      className="panel trade-panel"
                      key={t.id}
                      data-trade-id={t.id}
                    >
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">
                            {t.sender_id === viewerId
                              ? "PROPUESTA ENVIADA"
                              : "PROPUESTA RECIBIDA"}
                          </span>
                          <h2>Cambio con {partner}</h2>
                        </div>
                        <span
                          className={`tag ${t.status === "completed" ? "green" : ""}`}
                        >
                          {statusLabel[t.status]}
                        </span>
                      </div>
                      <p>{new Date(t.created_at).toLocaleString("es-ES")}</p>
                      <TradeProgress
                        status={t.status}
                        partner={partner}
                        mineConfirmed={mineConfirmed}
                        otherConfirmed={otherConfirmed}
                      />
                      <div className="compare-columns">
                        {[true, false].map((give) => (
                          <div key={String(give)}>
                            <h3>{give ? "Tú das" : "Tú recibes"}</h3>
                            {tradeItems
                              .filter(
                                (i) =>
                                  i.trade_id === t.id &&
                                  (give
                                    ? i.giver_id === viewerId
                                    : i.giver_id !== viewerId),
                              )
                              .map((i) => {
                                const s =
                                  i.stickers ??
                                  stickers.find((s) => s.id === i.sticker_id);
                                return (
                                  <p key={i.sticker_id}>
                                    {i.quantity} ×{" "}
                                    {s
                                      ? `#${s.official_code} · ${s.name}`
                                      : "Cromo no disponible"}
                                  </p>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                      <div className="export-actions">
                        {t.status === "proposed" &&
                          t.receiver_id === viewerId && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void act(async () => {
                                    await rpc("trade_action", {
                                      p_trade: t.id,
                                      p_action: "accept",
                                    });
                                    await load();
                                  }, "Propuesta aceptada y unidades reservadas")
                                }
                              >
                                Aceptar propuesta
                              </button>
                              <button
                                className="secondary"
                                disabled={busy}
                                onClick={() =>
                                  void act(async () => {
                                    await rpc("trade_action", {
                                      p_trade: t.id,
                                      p_action: "reject",
                                    });
                                    await load();
                                  })
                                }
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                        {t.status === "accepted" && !mineConfirmed && (
                          <button
                            disabled={busy}
                            onClick={() => {
                              if (
                                confirm(
                                  "¿Has realizado la entrega y recepción acordadas? Esta confirmación no se puede retirar.",
                                )
                              )
                                void act(async () => {
                                  await rpc("trade_action", {
                                    p_trade: t.id,
                                    p_action: "confirm",
                                  });
                                  await load();
                                }, "Confirmación registrada. El intercambio se completa cuando ambos confirman.");
                            }}
                          >
                            Ya he hecho el cambio
                          </button>
                        )}
                        {["accepted", "proposed"].includes(t.status) && (
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() =>
                              void act(async () => {
                                await rpc("trade_action", {
                                  p_trade: t.id,
                                  p_action: "cancel",
                                });
                                await load();
                              }, "Intercambio cancelado y reservas liberadas")
                            }
                          >
                            Cancelar intercambio
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
            </>
          )}
          {section === "notificaciones" && (
            <section className="panel">
              <div className="section-heading">
                <h2>{unread} sin leer</h2>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      await rpc("mark_notifications_read");
                      await load();
                    })
                  }
                >
                  Marcar como leídas
                </button>
              </div>
              {notifications.length ? (
                notifications.map((n) => (
                  <div className="notification-row" key={n.id}>
                    <Bell size={20} />
                    <span>
                      {!n.read_at && <strong>Nueva · </strong>}
                      {n.message}
                    </span>
                    <small>
                      {new Date(n.created_at).toLocaleString("es-ES")}
                    </small>
                  </div>
                ))
              ) : (
                <Empty title="Todo al día">
                  Las novedades de tus amistades e intercambios aparecerán aquí.
                </Empty>
              )}
            </section>
          )}
          {section === "estadisticas" && (
            <>
              <section className="stat-grid">
                {[
                  { label: "Distintos conseguidos", value: stats.owned },
                  {
                    label: "Cromos publicados verificados",
                    value: stats.total,
                  },
                  { label: "Repetidos totales", value: stats.duplicates },
                  { label: "Reservados", value: stats.reserved },
                ].map((x) => (
                  <div className="stat-card" key={x.label}>
                    <strong>{x.value}</strong>
                    <span>{x.label}</span>
                  </div>
                ))}
              </section>
              <section className="panel">
                <h2>Tu progreso, sin confusiones</h2>
                <p>
                  Colección: {stats.owned}/{stats.total} cromos distintos (
                  {stats.percent}%).{" "}
                  {stickers.some((s) => s.album_position)
                    ? `Posiciones físicas identificadas: ${stats.positions}${current?.album_positions ? ` de ${current.album_positions}` : " (mapa del álbum pendiente de verificar)"}.`
                    : "Posiciones físicas del álbum: aún no verificadas."}
                </p>
                <p>
                  Al incorporar nuevas ediciones, aumenta el total de cromos y
                  puede bajar tu porcentaje sin que pierdas ninguno.
                </p>
                <h3>Por equipo y por serie</h3>
                {Array.from(
                  new Set(
                    stickers.map(
                      (s) =>
                        s.teams?.name ?? s.sticker_series?.name ?? "General",
                    ),
                  ),
                ).map((group) => {
                  const groupStickers = stickers.filter(
                    (s) =>
                      (s.teams?.name ?? s.sticker_series?.name ?? "General") ===
                      group,
                  );
                  const st = statistics(groupStickers, inventory);
                  return (
                    <div className="progress-row" key={group}>
                      <span>{group}</span>
                      <progress max={st.total} value={st.owned} />
                      <strong>
                        {st.owned}/{st.total}
                      </strong>
                    </div>
                  );
                })}
                <h3>Movimientos recientes</h3>
                {history.length ? (
                  history.slice(0, 20).map((h, i) => (
                    <p key={i}>
                      {new Date(h.created_at).toLocaleString("es-ES")} ·{" "}
                      {h.delta > 0 ? "+" : ""}
                      {h.delta} unidades
                    </p>
                  ))
                ) : (
                  <p>Todavía no hay movimientos registrados.</p>
                )}
              </section>
            </>
          )}
          {section === "escaner" && (
            <ScanAlbum
              stickers={stickers}
              inventory={inventory}
              onAdd={quantity}
              onBusyChange={setScanBusy}
            />
          )}
          {section === "perfil" && (
            <>
              {!visitor && session && profile && (
                <AlbumSaveCheck
                  userId={session.user.id}
                  username={profile.username}
                  localInventory={localAlbum.inventory}
                  onRecovered={async () => {
                    inventoryRevision.current++;
                    await load();
                  }}
                />
              )}
              {visitor && (
                <section className="panel local-profile">
                  <h2>Tu álbum, en este dispositivo</h2>
                  <p>
                    Las cantidades se guardan en este navegador. Exporta una
                    copia para conservar tu progreso. La sincronización entre
                    cuentas aún no está conectada.
                  </p>
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        "nexo-album.json",
                        JSON.stringify(
                          {
                            version: 1,
                            quantities: Object.fromEntries(
                              inventory.map((i) => [i.sticker_id, i.quantity]),
                            ),
                          },
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    <Download size={16} /> Exportar mi álbum
                  </button>
                </section>
              )}
              <section className="panel">
                <h2>Perfil y privacidad</h2>
                <form
                  aria-label="Ajustes de perfil"
                  className="settings-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const submittedRevision = privacyDraftRevision.current;
                    const submittedBy = activeUser.current;
                    void act(async () => {
                      await rpc("update_profile", {
                        p_username: String(f.get("username")),
                        p_display_name: String(f.get("display_name")),
                        p_visibility: visibility,
                        p_matches: matchNotify,
                      });
                      if (activeUser.current !== submittedBy) return;
                      privacySavedRevision.current = submittedRevision;
                      await load();
                    }, "Perfil guardado");
                  }}
                >
                  <label>
                    Nombre público
                    <input
                      name="display_name"
                      defaultValue={profile?.display_name}
                      required
                      maxLength={60}
                    />
                  </label>
                  <label>
                    Nombre de usuario
                    <input
                      name="username"
                      defaultValue={profile?.username}
                      readOnly={Boolean(accountUsername(session?.user.email))}
                      required
                      pattern="[a-z0-9_]{3,24}"
                      title="Entre 3 y 24 caracteres: minúsculas, números y guion bajo"
                    />
                    <small>
                      {accountUsername(session?.user.email)
                        ? "Tu usuario de acceso es fijo. Puedes cambiar el nombre público."
                        : "Elige tu nombre público: 3–24 caracteres."}
                    </small>
                  </label>
                  <label>
                    Visibilidad de tu colección
                    <select
                      aria-label="Visibilidad de tu colección"
                      value={visibility}
                      onChange={(e) => {
                        privacyDraftRevision.current++;
                        setVisibility(e.target.value);
                      }}
                    >
                      <option value="private">Privada</option>
                      <option value="friends">Solo amigos</option>
                      <option value="registered">Usuarios registrados</option>
                    </select>
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={matchNotify}
                      onChange={(e) => {
                        privacyDraftRevision.current++;
                        setMatchNotify(e.target.checked);
                      }}
                    />
                    Guardar preferencia para futuras alertas de coincidencias
                    (envío aún no activado).
                  </label>
                  {privacyDraftRevision.current !==
                    privacySavedRevision.current && (
                    <p role="status">
                      Tu privacidad tiene cambios sin guardar.
                    </p>
                  )}
                  <button disabled={busy}>Guardar cambios</button>
                </form>
              </section>
              <section className="panel">
                <h2>Listas compartidas</h2>
                {shared.length ? (
                  shared.map((s) => (
                    <div className="person-row" key={s.id}>
                      <span>
                        {s.kind === "missing" ? "Faltantes" : "Repetidos"} ·
                        caduca{" "}
                        {new Date(s.expires_at).toLocaleDateString("es-ES")}
                      </span>
                      <button
                        className="secondary"
                        onClick={() =>
                          void act(async () => {
                            await rpc("revoke_shared_list", { p_id: s.id });
                            await load();
                          }, "Enlace revocado")
                        }
                      >
                        Revocar enlace
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No tienes enlaces activos.</p>
                )}
                <h3>Usuarios bloqueados</h3>
                {blocks.length ? (
                  blocks.map((b) => (
                    <div className="person-row" key={b.blocked_id}>
                      <span>Usuario {b.blocked_id.slice(0, 8)}</span>
                      <button
                        className="secondary"
                        onClick={() =>
                          void friendAction(b.blocked_id, "unblock")
                        }
                      >
                        Desbloquear
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No has bloqueado a nadie.</p>
                )}
              </section>
              <section className="panel">
                <details className="profile-tools">
                  <summary>Más opciones</summary>
                  <div className="export-actions">
                    <button
                      className="secondary"
                      onClick={() => go("estadisticas")}
                    >
                      Estadísticas
                    </button>
                    <button className="secondary" onClick={() => go("escaner")}>
                      Cámara y entrada manual
                    </button>
                  </div>
                </details>
              </section>
              <section className="panel">
                <h2>Tu cuenta, bajo tu control</h2>
                <div className="export-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      void act(async () => {
                        const tables = [
                          "profiles",
                          "user_inventory",
                          "user_collections",
                          "user_privacy_settings",
                          "friendships",
                          "trade_proposals",
                          "trade_participants",
                          "trade_items",
                          "trade_reservations",
                          "inventory_transactions",
                          "notifications",
                          "shared_lists",
                          "user_blocks",
                          "reports",
                        ];
                        const data: Record<string, unknown> = {};
                        for (const table of tables) {
                          const { data: rows, error } = await database()
                            .from(table)
                            .select("*");
                          if (error) throw error;
                          data[table] =
                            table === "profiles"
                              ? rows?.filter((r) => r.id === viewerId)
                              : table === "user_inventory" ||
                                  table === "user_collections"
                                ? rows?.filter((r) => r.user_id === viewerId)
                                : rows;
                        }
                        download("mis-datos-cromatch.json", data);
                      }, "Exportación descargada")
                    }
                  >
                    <Download size={17} /> Exportar mis datos
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      void act(async () => {
                        await database().auth.signOut();
                        setProfile(null);
                        setInventory([]);
                        setStickers([]);
                        setOther(null);
                        setSharedRows(null);
                      })
                    }
                  >
                    <LogOut size={17} /> Cerrar sesión
                  </button>
                  <button
                    className="text-button danger"
                    disabled={visitor}
                    onClick={() => {
                      if (
                        confirm(
                          "¿Eliminar tu cuenta? Se borrarán tu acceso y perfil personal. Los intercambios finalizados conservarán un registro seudonimizado. Esta acción no se puede deshacer.",
                        )
                      )
                        void act(async () => {
                          await rpc("delete_my_account");
                          await database().auth.signOut();
                          setProfile(null);
                          setInventory([]);
                          setOther(null);
                        });
                    }}
                  >
                    Eliminar cuenta
                  </button>
                </div>
                {profile?.is_admin && (
                  <button className="secondary" onClick={() => go("admin")}>
                    Administrar catálogo <ArrowRight size={17} />
                  </button>
                )}
                <button className="text-button" onClick={() => setLegal(true)}>
                  Privacidad y condiciones
                </button>
              </section>
            </>
          )}
          {section === "admin" && profile?.is_admin && (
            <>
              <section className="panel">
                <h2>Importación verificable · JSON</h2>
                <p>
                  Solo datos publicados y contrastados. Cada fila exige código,
                  nombre, edición, variante, fuente oficial, corroboración y
                  fecha. Los IDs existentes permanecen estables y las
                  correcciones se guardan en el historial.
                </p>
                <label>
                  Archivo JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.size > 2_000_000) {
                          setError("El archivo supera 2 MB");
                          return;
                        }
                        void f.text().then((t) => {
                          setAdminInput(t);
                          setValidated(null);
                        });
                      }
                    }}
                  />
                </label>
                <label>
                  Datos del catálogo
                  <textarea
                    rows={12}
                    value={adminInput}
                    onChange={(e) => {
                      setAdminInput(e.target.value);
                      setValidated(null);
                    }}
                    placeholder='[{"official_code": "…", "name": "…", "edition": "…", "source_url": "https://…", "corroboration_url": "https://…", "verified_at": "2026-11-08T00:00:00Z"}]'
                  />
                </label>
                <div className="export-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      void act(async () => {
                        const rows = parseCatalog(adminInput);
                        setValidated(rows);
                      }, "Validación estructural correcta. Revisa manualmente las fuentes antes de publicar.")
                    }
                  >
                    Validar sin publicar
                  </button>
                  <button
                    disabled={!validated || busy}
                    onClick={() =>
                      void act(async () => {
                        await rpc("import_catalog", {
                          p_collection: collection,
                          p_rows: validated,
                        });
                        setValidated(null);
                        setAdminInput("");
                        await load();
                        setCollection("");
                        setTimeout(() => setCollection(collection), 0);
                      }, "Catálogo importado con registro de revisiones")
                    }
                  >
                    Publicar {validated?.length ?? 0} filas verificadas
                  </button>
                </div>
                <p>
                  La validación estructural no verifica automáticamente el
                  contenido de las fuentes.
                </p>
              </section>
              <section className="panel">
                <h2>Añadir colección</h2>
                <form
                  className="settings-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void act(async () => {
                      await rpc("add_collection", {
                        p_slug: f.get("slug"),
                        p_name: f.get("name"),
                        p_season: f.get("season"),
                      });
                      await load();
                    }, "Colección creada");
                  }}
                >
                  <label>
                    Identificador URL
                    <input name="slug" required pattern="[a-z0-9-]+" />
                  </label>
                  <label>
                    Nombre
                    <input name="name" required />
                  </label>
                  <label>
                    Temporada
                    <input name="season" required />
                  </label>
                  <button disabled={busy}>Crear colección</button>
                </form>
              </section>
              <section className="panel">
                <h2>Auditoría e incidencias</h2>
                <button
                  className="secondary"
                  onClick={() =>
                    void act(async () => {
                      const data: Record<string, unknown> = {};
                      for (const table of [
                        "sticker_catalog_revisions",
                        "audit_logs",
                        "reports",
                      ]) {
                        const { data: rows, error } = await database()
                          .from(table)
                          .select("*")
                          .limit(1000);
                        if (error) throw error;
                        data[table] = rows;
                      }
                      download("nexo-auditoria.json", data);
                    })
                  }
                >
                  Descargar revisiones, registros y denuncias
                </button>
              </section>
            </>
          )}
          <footer className="workspace-footer">
            <span>
              NEXO · Cada cromo cuenta.{" "}
              <a
                href="https://www.footylogos.com/es"
                target="_blank"
                rel="noopener noreferrer"
              >
                Escudos: FootyLogos
              </a>
            </span>
            <span>
              Retratos: FootyLogos, LaLiga y clubes · Fuente en cada ficha.
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegación principal">
        {nav.map((n) => (
          <button
            key={n.id}
            className={section === n.id ? "nav-active" : ""}
            onClick={() => go(n.id)}
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      {award.event && !quickAddOpen && !scanBusy && !legal && (
        <CollectionCelebration event={award.event} close={award.close} />
      )}
      {quickAddOpen && (
        <QuickAdd
          stickers={stickers}
          inventory={inventory}
          duplicates={section === "repetidos"}
          onAdd={quantity}
          close={() => setQuickAddOpen(false)}
          scan={() => {
            setQuickAddOpen(false);
            go("escaner");
          }}
        />
      )}
      {legal && <Legal close={() => setLegal(false)} />}
    </div>
  );
}
