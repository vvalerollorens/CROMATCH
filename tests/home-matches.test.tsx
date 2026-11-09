import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { HomeOverview } from "../src/components/home-overview";
const base = {
  owned: 5,
  total: 654,
  duplicates: 1,
  busy: false,
  go: () => {},
  prepareTrade: () => {},
};
it("sin cromos el inicio muestra cero y no añade un porcentaje mínimo", () => {
  const html = renderToStaticMarkup(
    <HomeOverview {...base} owned={0} friends={0} opportunities={[]} />,
  );
  expect(html).toContain("0% de la colección");
  expect(html).not.toContain("5% de la colección");
});
it("sin amigos conserva el inicio sin inventar coincidencias", () => {
  const html = renderToStaticMarkup(
    <HomeOverview {...base} friends={0} opportunities={[]} />,
  );
  expect(html).not.toContain('class="home-matches"');
  expect(html).toContain("Ir a mi álbum");
});
it("el cambio con un amigo aparece antes del álbum y permite prepararlo directamente", () => {
  const html = renderToStaticMarkup(
    <HomeOverview
      {...base}
      friends={1}
      opportunities={[
        {
          user_id: "friend",
          username: "amigo",
          display_name: "Amigo",
          offer_count: 3,
          receive_count: 2,
        },
      ]}
    />,
  );
  expect(html.indexOf('class="home-matches"')).toBeLessThan(
    html.indexOf('class="glow-hero"'),
  );
  expect(html).toContain("Preparar cambio con @amigo");
  expect(html).toContain("Tú das");
  expect(html).toContain("Tú recibes");
});
it("sin autorización muestra el amigo y la opción de compartir, sin publicar cantidades", () => {
  const html = renderToStaticMarkup(
    <HomeOverview
      {...base}
      friends={1}
      opportunities={[
        { user_id: "friend", username: "amigo", display_name: "Amigo" },
      ]}
    />,
  );
  expect(html).toContain("Solo amigos");
  expect(html).not.toContain('class="home-match-counts"');
  expect(html).toContain("Ver coincidencias con @amigo");
});
