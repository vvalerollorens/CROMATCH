"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { referenceStickers } from "./catalogue";
import {
  LOCAL_ALBUM_KEY,
  changeLocalQuantity,
  readLocalAlbum,
  type LocalAlbum,
} from "./local-album";
const ids = new Set(referenceStickers.map((s) => s.id));
export function useLocalAlbum() {
  const [value, setValue] = useState<LocalAlbum>({
    version: 1,
    quantities: {},
  });
  const current = useRef(value);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const read = () => {
      try {
        const next = readLocalAlbum(localStorage.getItem(LOCAL_ALBUM_KEY), ids);
        current.current = next;
        setValue(next);
      } catch {
        setError("Este navegador no permite guardar el álbum local.");
      }
      setReady(true);
    };
    read();
    const update = (e: StorageEvent) => {
      if (e.key === LOCAL_ALBUM_KEY) read();
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  const inventory = useMemo(
    () =>
      Object.entries(value.quantities).map(([sticker_id, quantity]) => ({
        user_id: "local-device",
        sticker_id,
        quantity,
        reserved: 0,
      })),
    [value],
  );
  function change(id: string, delta: number) {
    if (!ready) throw new Error("Espera a que cargue tu álbum.");
    const next = changeLocalQuantity(current.current, id, delta, ids);
    try {
      localStorage.setItem(LOCAL_ALBUM_KEY, JSON.stringify(next));
    } catch {
      setError(
        "No se pudo guardar. Comprueba el espacio o los permisos del navegador.",
      );
      throw new Error("No se pudo guardar la cantidad en este dispositivo.");
    }
    current.current = next;
    setValue(next);
    setError("");
  }
  return { inventory, ready, error, change };
}
