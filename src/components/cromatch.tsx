"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
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
  | "admin";
const nav = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "album", label: "Mi álbum", icon: Album },
  { id: "intercambios", label: "Intercambios", icon: ArrowDownUp },
  { id: "amigos", label: "Amigos", icon: Users },
  { id: "perfil", label: "Mi perfil", icon: UserRound },
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
  admin: "Administración del catálogo",
};
import { Empty, Logo, Legal } from "./ui";
import { Dialog } from "./dialog";
import { Landing } from "./landing";
import { VisualAlbum } from "./visual-album";
import { HomeOverview } from "./home-overview";
export function Cromatch({
  initialVisitor = false,
}: {
  initialVisitor?: boolean;
}) {
  useEffect(() => {
    if (initialVisitor && window.location.hash === "#album")
      setSection("album");
  }, [initialVisitor]);
  const activeUser = useRef<string | null>(null);
  const pendingQuantity = useRef<
    Record<string, { operation: string; delta: number }>
  >({});
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collection, setCollection] = useState("");
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeItems, setTradeItems] = useState<TradeItem[]>([]);
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
  const [selected, setSelected] = useState<Sticker | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<{ blocked_id: string }[]>([]);
  const [history, setHistory] = useState<
    { created_at: string; delta: number }[]
  >([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number> | null>(null);
  const go = (s: Section) => {
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
    } catch (e) {
      if (requestedBy !== activeUser.current) return;
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo guardar. Vuelve a intentarlo.",
      );
    } finally {
      if (requestedBy === activeUser.current) setBusy(false);
    }
  };
  const rpc = async (name: string, args: Record<string, unknown> = {}) => {
    if (visitor) throw new Error("El modo visita es de solo lectura.");
    const { data, error } = await database().rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  };
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (!configured) return;
    const db = database();
    const acceptSession = (next: Session | null) => {
      const id = next?.user.id ?? null;
      if (activeUser.current !== id) {
        setBusy(false);
        setProfile(null);
        setCollections([]);
        setCollection("");
        setStickers([]);
        setInventory([]);
        setTrades([]);
        setTradeItems([]);
        setNotifications([]);
        setFriends([]);
        setPeople([]);
        setOther(null);
        setTheirInventory([]);
        setSelected(null);
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
    setLoading(true);
    const db = database();
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
        db.from("trade_items").select("*").limit(10000),
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
      if (activeUser.current !== session.user.id) return;
      for (const res of [p, c, inv, f, t, ti, n, pr, sh, b, h])
        if (res.error) throw new Error(res.error.message);
      setProfile(p.data);
      setCollections(c.data ?? []);
      setInventory(inv.data ?? []);
      setFriends(f.data ?? []);
      setTrades(t.data ?? []);
      setTradeItems(ti.data ?? []);
      setNotifications(n.data ?? []);
      setShared(sh.data ?? []);
      setBlocks(b.data ?? []);
      setHistory(h.data ?? []);
      setVisibility(pr.data.visibility);
      setMatchNotify(pr.data.match_notifications);
      setCollection((v) => v || c.data?.[0]?.id || "");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudieron cargar los datos",
      );
    } finally {
      setLoading(false);
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
      if (alive) setStickers(all);
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
  const unread = notifications.filter((n) => !n.read_at).length;
  const filtered = stickers.filter(
    (s) =>
      `${s.official_code} ${s.name} ${s.teams?.name ?? ""}`
        .toLocaleLowerCase("es")
        .includes(search.toLocaleLowerCase("es")) &&
      (!team || s.teams?.name === team) &&
      (!series || s.sticker_series?.name === series) &&
      (!edition || s.edition === edition) &&
      (section !== "repetidos" || available(own.get(s.id)) > 0) &&
      (section !== "faltantes" || !own.get(s.id)?.quantity),
  );
  const [page, setPage] = useState(0);
  useEffect(
    () => setPage(0),
    [search, team, series, edition, section, collection],
  );
  async function quantity(s: Sticker, delta: number) {
    const requestedBy = activeUser.current;
    await act(async () => {
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
          reserved: own.get(s.id)?.reserved ?? 0,
        },
      ]);
    }, "Cantidad guardada");
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
        .like("username", `${safe.toLowerCase()}%`)
        .neq("id", session!.user.id)
        .limit(30);
      if (error) throw error;
      setPeople(data ?? []);
    });
  }
  async function openComparison(p: Profile) {
    await act(async () => {
      const requestedBy = activeUser.current;
      const data = await inventoryFor(p.id);
      if (activeUser.current !== requestedBy) return;
      setTheirInventory(data ?? []);
      setOther(p);
      setSelection({});
      setDraft(null);
      setDraftId(null);
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
        const { error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: String(f.get("name")) },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setMessage(
          "Revisa tu correo para verificar tu cuenta antes de entrar.",
        );
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
            <label>
              Tu nombre
              <input name="name" required maxLength={60} autoComplete="name" />
            </label>
          )}
          {auth !== "reset" && (
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
  const viewerId = session?.user.id ?? "";
  const card = (s: Sticker) => {
    const i = own.get(s.id);
    const q = i?.quantity ?? 0;
    return (
      <article key={s.id} className={`sticker-card ${list ? "compact" : ""}`}>
        <button className="sticker-open" onClick={() => setSelected(s)}>
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
            onClick={() => void quantity(s, -1)}
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
            onClick={() => void quantity(s, 1)}
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
    <div className="app-shell">
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
              {n.id === "intercambios" &&
                trades.some(
                  (t) => t.status === "proposed" && t.receiver_id === viewerId,
                ) && <span className="dot" />}
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
            {profile?.display_name.slice(0, 1) ?? "C"}
          </span>
          <span>
            <strong>
              {profile?.display_name ??
                (visitor ? "Visitante sin cuenta" : "Coleccionista")}
            </strong>
            <small>
              {visitor ? "Solo lectura" : `@${profile?.username ?? ""}`}
            </small>
          </span>
          <Settings size={17} />
        </button>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div className="breadcrumb">
            Tu zona de juego <ChevronRight size={14} />{" "}
            <strong>{section === "inicio" ? "Inicio" : titles[section]}</strong>
          </div>
          <div className="header-actions">
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
              {profile?.display_name.slice(0, 1) ?? "C"}
            </button>
          </div>
        </header>
        <main className="workspace" id="contenido">
          {visitor && (
            <div className="notice visitor-banner" role="status">
              <ShieldCheck size={20} />
              <div>
                <strong>Modo visita · Sin cuenta</strong>
                <p>Explora y prueba el álbum.</p>
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
          {notices}
          {loading && (
            <div role="status" className="loading-note">
              Sincronizando tu colección…
            </div>
          )}
          <div
            className={`page-heading ${section === "album" ? "album-page-heading" : ""}`}
          >
            <div>
              <span className="eyebrow">
                {section === "inicio"
                  ? `HOLA, ${profile?.display_name?.toUpperCase() ?? "COLECCIONISTA"}`
                  : "CROMATCH / TU COLECCIÓN"}
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
              go={go}
            />
          )}
          {section === "album" && (
            <VisualAlbum
              stickers={stickers}
              inventory={inventory}
              visitor={visitor}
              busy={busy}
              collectionName={current?.name}
              onQuantity={quantity}
              onDetail={setSelected}
              onNavigate={go}
            />
          )}
          {["repetidos", "faltantes"].includes(section) && (
            <>
              <div className="tabs">
                {[
                  { id: "album", label: "Todos los cromos" },
                  {
                    id: "repetidos",
                    label: `Mis repetidos · ${stats.available}`,
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
                    new Set(stickers.map((s) => s.teams?.name).filter(Boolean)),
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
              {section !== "album" && (
                <div className="export-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        `cromatch-${section}.txt`,
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
              )}
              <p className="results-count">
                {filtered.length} cromos · {stats.reserved} unidades reservadas
              </p>
              {filtered.length ? (
                <>
                  <div className={list ? "sticker-list" : "sticker-grid"}>
                    {filtered.slice(page * 48, (page + 1) * 48).map(card)}
                  </div>
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
                      stickers.length
                        ? "No hay cromos con estos filtros"
                        : "El catálogo está esperando su primer cromo verificado"
                    }
                  >
                    {stickers.length
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
                  <button disabled={busy}>Buscar</button>
                </form>
                {people.map((p) => (
                  <div className="person-row" key={p.id}>
                    <span className="avatar">{p.display_name[0]}</span>
                    <div>
                      <strong>{p.display_name}</strong>
                      <p>@{p.username}</p>
                    </div>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => void openComparison(p)}
                    >
                      Ver perfil
                    </button>
                    <button
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
              <div className="section-heading">
                <div>
                  <h2>{other.display_name}</h2>
                  <p>@{other.username}</p>
                </div>
                <button
                  className="icon-button"
                  aria-label="Cerrar comparador"
                  onClick={() => setOther(null)}
                >
                  <X />
                </button>
              </div>
              <p>
                Solo puedes consultar datos autorizados. Una colección privada
                puede aparecer vacía. Los bloqueos y permisos también se aplican
                en la base de datos.
              </p>
              <div className="compare-columns">
                {[
                  {
                    label: "Puedes ofrecer",
                    items: matches.offer,
                    map: own,
                    giver: viewerId,
                  },
                  {
                    label: "Puedes recibir",
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
                Las cantidades y rarezas no tienen por qué ser equivalentes.
                Revisa y acuerda la propuesta con la otra persona.
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
                  disabled={busy}
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
                  Enviar propuesta <ArrowRight size={16} />
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
            </section>
          )}
          {section === "intercambios" && (
            <>
              <div className="tabs">
                {[
                  { id: "all", label: "Todos" },
                  { id: "received", label: "Recibidos" },
                  { id: "sent", label: "Enviados" },
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
              <div className="notice">
                <ShieldCheck size={19} />
                <span>
                  Aceptar reserva los cromos. Las cantidades cambian cuando
                  ambos confirmáis la entrega. Confirma solo cuando la hayáis
                  realizado.
                </span>
              </div>
              {!trades.length && (
                <section className="panel">
                  <Empty title="Aquí empezarán los buenos cambios">
                    Compara el álbum de un amigo y envía una propuesta con lo
                    que cada uno necesita.
                  </Empty>
                  <button onClick={() => go("amigos")}>
                    Buscar coincidencias <ArrowRight size={17} />
                  </button>
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
                .map((t) => (
                  <article className="panel trade-panel" key={t.id}>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">
                          {t.sender_id === viewerId
                            ? "PROPUESTA ENVIADA"
                            : "PROPUESTA RECIBIDA"}
                        </span>
                        <h2>Intercambio #{t.id.slice(0, 8)}</h2>
                      </div>
                      <span
                        className={`tag ${t.status === "completed" ? "green" : ""}`}
                      >
                        {statusLabel[t.status]}
                      </span>
                    </div>
                    <p>{new Date(t.created_at).toLocaleString("es-ES")}</p>
                    <div className="compare-columns">
                      {[true, false].map((give) => (
                        <div key={String(give)}>
                          <h3>{give ? "Entregas" : "Recibes"}</h3>
                          {tradeItems
                            .filter(
                              (i) =>
                                i.trade_id === t.id &&
                                (give
                                  ? i.giver_id === viewerId
                                  : i.giver_id !== viewerId),
                            )
                            .map((i) => {
                              const s = stickers.find(
                                (s) => s.id === i.sticker_id,
                              );
                              return (
                                <p key={i.sticker_id}>
                                  {i.quantity} ×{" "}
                                  {s
                                    ? `#${s.official_code} · ${s.name}`
                                    : `Cromo ${i.sticker_id.slice(0, 8)} · otra colección`}
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
                              Aceptar
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
                      {t.status === "accepted" && (
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
                          Confirmar entrega realizada
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
                ))}
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
                  {stats.percent}%). Posiciones físicas cubiertas:{" "}
                  {stats.positions}
                  {current?.album_positions
                    ? ` de ${current.album_positions}`
                    : " (total de posiciones no verificado)"}
                  .
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
            <section className="panel scanner-panel">
              <Camera size={44} />
              <h2>La entrada manual está siempre disponible</h2>
              <p>
                La primera versión prepara la captura de imagen. El
                reconocimiento OCR todavía no está activado: no se identificará
                ni añadirá ningún cromo automáticamente.
              </p>
              <label className="file-input">
                Fotografiar un cromo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files?.[0])
                      setMessage(
                        "Imagen seleccionada solo en tu dispositivo. Busca y confirma el código manualmente; no se ha subido ni guardado la foto.",
                      );
                  }}
                />
              </label>
              <button onClick={() => go("album")}>
                Buscar y registrar manualmente <Search size={17} />
              </button>
            </section>
          )}
          {section === "perfil" && (
            <>
              <section className="panel">
                <h2>Perfil y privacidad</h2>
                <form
                  aria-label="Ajustes de perfil"
                  className="settings-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void act(async () => {
                      await rpc("update_profile", {
                        p_username: String(f.get("username")),
                        p_display_name: String(f.get("display_name")),
                        p_visibility: visibility,
                        p_matches: matchNotify,
                      });
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
                      required
                      pattern="[a-z0-9_]{3,24}"
                      title="Entre 3 y 24 caracteres: minúsculas, números y guion bajo"
                    />
                    <small>Elige tu nombre público: 3–24 caracteres.</small>
                  </label>
                  <label>
                    Visibilidad de tu colección
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
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
                      onChange={(e) => setMatchNotify(e.target.checked)}
                    />
                    Guardar preferencia para futuras alertas de coincidencias
                    (envío aún no activado).
                  </label>
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
                      download("cromatch-auditoria.json", data);
                    })
                  }
                >
                  Descargar revisiones, registros y denuncias
                </button>
              </section>
            </>
          )}
          <footer className="workspace-footer">
            <span>CROMATCH · Cada cromo cuenta.</span>
            <span>Tu colección es tuya. Tu privacidad, también.</span>
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
      {selected && (
        <Dialog titleId="sticker-title" close={() => setSelected(null)}>
          <button
            className="icon-button close"
            onClick={() => setSelected(null)}
            aria-label="Cerrar detalle"
          >
            <X />
          </button>
          <span className="eyebrow">
            #{selected.official_code} · {selected.edition}
          </span>
          <h2 id="sticker-title">{selected.name}</h2>
          <p>
            {selected.teams?.name} · {selected.sticker_series?.name} ·{" "}
            {selected.variant}
          </p>
          <p>Posición física: {selected.album_position ?? "No verificada"}</p>
          <p>
            {own.get(selected.id)?.quantity ?? 0} unidades ·{" "}
            {available(own.get(selected.id))} disponibles ·{" "}
            {own.get(selected.id)?.reserved ?? 0} reservadas
          </p>
          <p>
            Verificado:{" "}
            {new Date(selected.verified_at).toLocaleDateString("es-ES")}
          </p>
          <div className="export-actions">
            <a
              href={selected.source_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Fuente original ↗
            </a>
            <a
              href={selected.corroboration_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Fuente de contraste ↗
            </a>
          </div>
          <p>
            Sin imagen: no se ha incorporado material protegido sin
            autorización.
          </p>
        </Dialog>
      )}
      {legal && <Legal close={() => setLegal(false)} />}
    </div>
  );
}
