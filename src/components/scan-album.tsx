"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, ImagePlus, LoaderCircle, ScanLine } from "lucide-react";
import type { Worker } from "tesseract.js";
import type { Inventory, Sticker } from "@/lib/domain";
import { matchScanText } from "@/lib/scan-matching";
type Choice = {
  id: string;
  quantity: number;
  checked: boolean;
  applied?: boolean;
};
export function ScanAlbum({
  stickers,
  inventory,
  onAdd,
  onBusyChange,
}: {
  stickers: Sticker[];
  inventory: Inventory[];
  onAdd: (s: Sticker, delta: number) => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);
  const run = useRef(0);
  const matches = useMemo(
    () => matchScanText(reviewText, stickers),
    [reviewText, stickers],
  );
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  const own = new Map(inventory.map((i) => [i.sticker_id, i.quantity]));
  useEffect(
    () => () => {
      run.current++;
      void worker.current?.terminate();
    },
    [],
  );
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function select(f?: File) {
    if (!f) return;
    setError("");
    setStatus("");
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
      setError(
        "Elige una imagen JPG, PNG o WebP. Si tu móvil usa HEIC, compártela como JPG.",
      );
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("La foto supera 20 MB. Elige una imagen más pequeña.");
      return;
    }
    setFile(f);
    setText("");
    setReviewText("");
    setChoices({});
    setProgress(0);
  }
  async function analyze() {
    if (!file || busy) return;
    const job = ++run.current;
    setBusy(true);
    setError("");
    setChoices({});
    setText("");
    setReviewText("");
    setStatus("Preparando el lector en tu dispositivo…");
    try {
      const { createWorker, PSM } = await import("tesseract.js");
      const w = await createWorker("spa", 1, {
        workerPath: `${location.origin}/ocr/worker.min.js`,
        corePath: `${location.origin}/ocr`,
        langPath: `${location.origin}/ocr`,
        workerBlobURL: false,
        logger: (m) => {
          if (run.current !== job) return;
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
            setStatus("Leyendo nombres y números…");
          }
        },
      });
      if (run.current !== job) {
        await w.terminate();
        return;
      }
      worker.current = w;
      await w.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo abrir la imagen.");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      let { data } = await w.recognize(canvas);
      if (!matchScanText(data.text, stickers).length) {
        setStatus("Buscando nombres en las cartas…");
        await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
        const fallback = await w.recognize(canvas);
        data = fallback.data;
      }
      if (run.current !== job) return;
      setText(data.text);
      setReviewText(data.text);
      setProgress(100);
      const detected = matchScanText(data.text, stickers);
      setChoices(
        Object.fromEntries(
          detected.map((m) => [
            m.name,
            {
              id: m.candidates.length === 1 ? m.candidates[0].id : "",
              quantity: 1,
              checked: m.exact && m.candidates.length === 1,
            },
          ]),
        ),
      );
      setStatus(
        detected.length
          ? `${detected.length} nombres encontrados. Revisa las cartas antes de añadirlas.`
          : "No hemos identificado nombres con claridad. Puedes corregir el texto o buscar manualmente.",
      );
    } catch (e) {
      if (run.current === job)
        setError(
          e instanceof Error
            ? `No se pudo leer la foto: ${e.message}`
            : "No se pudo leer la foto. Prueba con más luz y las cartas rectas.",
        );
    } finally {
      await worker.current?.terminate();
      worker.current = null;
      if (run.current === job) setBusy(false);
    }
  }
  const choiceFor = (name: string) =>
    choices[name] ?? { id: "", quantity: 1, checked: false };
  const change = (name: string, next: Partial<Choice>) =>
    setChoices((v) => ({ ...v, [name]: { ...choiceFor(name), ...next } }));
  async function apply() {
    setBusy(true);
    setError("");
    let added = 0;
    try {
      for (const m of matches) {
        const c = choices[m.name];
        if (!c?.checked || c.applied || !c.id) continue;
        const s = m.candidates.find((s) => s.id === c.id);
        if (!s) continue;
        await onAdd(s, c.quantity);
        added += c.quantity;
        setChoices((v) => ({
          ...v,
          [m.name]: { ...v[m.name], applied: true, checked: false },
        }));
      }
      setStatus(
        `${added} ${added === 1 ? "copia añadida" : "copias añadidas"} al álbum.`,
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo guardar. Las cartas ya añadidas están indicadas; no se repetirán al reintentar.",
      );
    } finally {
      setBusy(false);
    }
  }
  const actionable = matches.filter((m) => {
    const c = choices[m.name];
    return c?.checked && c.id && !c.applied;
  }).length;
  return (
    <section className="scan-album">
      <div className="scan-intro">
        <span className="scanner-orb">
          <ScanLine size={32} />
        </span>
        <span className="eyebrow">Del papel a tu álbum</span>
        <h2>Tus cromos. En una foto.</h2>
        <p>
          Coloca hasta tres cartas separadas, con buena luz y los nombres
          visibles. Revisarás las coincidencias antes de guardar.
        </p>
      </div>
      <div className="scan-actions">
        <label className="glow-cta">
          <Camera size={18} /> Hacer foto
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            disabled={busy}
            onChange={(e) => select(e.target.files?.[0])}
          />
        </label>
        <label className="secondary scan-file">
          <ImagePlus size={18} /> Elegir imagen
          <input
            className="sr-only"
            aria-label="Elegir foto de cromos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => select(e.target.files?.[0])}
          />
        </label>
      </div>
      <p className="scan-privacy">
        La imagen se analiza en este dispositivo. No se sube a un servidor.
      </p>
      {preview && (
        <div className="scan-preview">
          <img src={preview} alt="Foto seleccionada para reconocer cromos" />
          <button
            className="glow-cta"
            disabled={busy}
            onClick={() => void analyze()}
          >
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <ScanLine size={18} />
            )}{" "}
            {busy ? "Analizando…" : "Analizar foto"}
          </button>
        </div>
      )}
      {busy && (
        <progress
          max={100}
          value={progress}
          aria-label="Progreso de reconocimiento"
        />
      )}
      <p role="status" aria-live="polite">
        {status}
      </p>
      {error && <p role="alert">{error}</p>}
      {matches.length > 0 && (
        <div className="scan-review">
          <h3>Revisa lo que hemos leído</h3>
          {matches.map((m) => {
            const c = choiceFor(m.name);
            const q = own.get(c.id) ?? 0;
            return (
              <article
                key={m.name}
                className={`scan-match ${c.applied ? "applied" : ""}`}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={c.checked}
                    disabled={busy || c.applied || !c.id}
                    onChange={(e) =>
                      change(m.name, { checked: e.target.checked })
                    }
                  />
                  <strong>{m.name}</strong>
                  {c.applied ? (
                    <span>
                      <Check size={15} /> Añadido
                    </span>
                  ) : (
                    <small>
                      {m.exact
                        ? "Nombre reconocido"
                        : "Nombre aproximado · revisar"}
                    </small>
                  )}
                </label>
                <select
                  aria-label={`Elegir carta de ${m.name}`}
                  value={c.id}
                  disabled={busy || c.applied}
                  onChange={(e) =>
                    change(m.name, {
                      id: e.target.value,
                      checked: !!e.target.value,
                    })
                  }
                >
                  <option value="">Elige equipo, número y edición</option>
                  {m.candidates.map((s) => (
                    <option key={s.id} value={s.id}>
                      #{s.official_code} ·{" "}
                      {s.teams?.name ?? s.sticker_series?.name} · {s.edition}
                    </option>
                  ))}
                </select>
                {c.id && (
                  <div className="scan-quantity">
                    <span>
                      {c.applied
                        ? `Ahora tienes ${q}`
                        : q
                          ? `Ya tienes ${q} · será repetido`
                          : "Te falta · nuevo para tu álbum"}
                    </span>
                    <label>
                      Copias{" "}
                      <input
                        aria-label={`Copias de ${m.name}`}
                        type="number"
                        min={1}
                        max={9}
                        value={c.quantity}
                        disabled={busy || c.applied}
                        onChange={(e) =>
                          change(m.name, {
                            quantity: Math.max(
                              1,
                              Math.min(9, Number(e.target.value) || 1),
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                )}
              </article>
            );
          })}
          <button
            className="glow-cta"
            disabled={busy || !actionable}
            onClick={() => void apply()}
          >
            Confirmar y añadir {actionable ? `(${actionable})` : ""}
          </button>
        </div>
      )}
      {text && (
        <details className="scan-text">
          <summary>Revisar o corregir el texto detectado</summary>
          <textarea
            aria-label="Texto detectado en la foto"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              setReviewText(text);
              setChoices({});
            }}
          >
            Buscar nombres en este texto
          </button>
        </details>
      )}
    </section>
  );
}
