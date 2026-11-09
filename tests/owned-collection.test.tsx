import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { OwnedCollectionList } from "../src/components/owned-collection-list";
import type { Sticker } from "../src/lib/domain";

it("lista posesiones de todos los apartados, incluidas reservas, sin mostrar faltantes ni registros de otro catálogo", () => {
  const base = {
    collection_id: "collection",
    edition: "Cuarta edición",
    variant: "base",
    album_position: null,
    source_url: "",
    corroboration_url: "",
    verified_at: "",
    teams: null,
    sticker_series: null,
  };
  const stickers: Sticker[] = [
    { id: "a", name: "Primero", official_code: "3", teams: { name: "Alavés" } },
    {
      id: "missing",
      name: "Faltante",
      official_code: "5",
      teams: { name: "Alavés" },
    },
    {
      id: "b",
      name: "Especial",
      official_code: "1",
      sticker_series: { name: "Diamantes" },
    },
  ].map((s) => ({ ...base, ...s }));
  const html = renderToStaticMarkup(
    <OwnedCollectionList
      stickers={stickers}
      inventory={[
        { user_id: "me", sticker_id: "a", quantity: 2, reserved: 1 },
        { user_id: "me", sticker_id: "b", quantity: 1, reserved: 0 },
        { user_id: "me", sticker_id: "outside", quantity: 9, reserved: 0 },
      ]}
    />,
  );
  expect(html).toContain("2 cromos distintos · 3 copias");
  expect(html).toContain("2 copias");
  expect(html).toContain("Diamantes");
  expect(html).not.toContain("Faltante");
  expect(html).not.toContain("outside");
  expect(html.indexOf("<strong>Primero")).toBeLessThan(
    html.indexOf("<strong>Especial"),
  );
});
