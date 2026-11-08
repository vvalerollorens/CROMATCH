import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { VisualAlbum } from "../src/components/visual-album";
import { seasonTeams, teamKey } from "../src/lib/teams";
import type { Sticker } from "../src/lib/domain";
const noop = () => {};
const props = {
  inventory: [],
  busy: false,
  onQuantity: async () => {},
  onDetail: noop,
  onNavigate: noop,
};
describe("álbum visual", () => {
  it("normaliza nombres del catálogo sin mezclar clubes", () => {
    expect(teamKey("FC Barcelona")).toBe("barcelona");
    expect(teamKey("RC Celta de Vigo")).toBe("celta");
    expect(teamKey("Atlético de Madrid")).toBe("atletico");
    expect(teamKey("Real Madrid")).toBe("madrid");
    expect(new Set(seasonTeams.map((t) => t.id)).size).toBe(20);
  });
  it("sin catálogo una cuenta real no recibe cromos de prueba", () => {
    const html = renderToStaticMarkup(
      <VisualAlbum {...props} stickers={[]} visitor={false} />,
    );
    expect(html).toContain("El catálogo está esperando");
    expect(html).not.toContain("preview-slot");
  });
  it("la visita etiqueta sus casilleros y no inventa jugadores ni códigos oficiales", () => {
    const html = renderToStaticMarkup(
      <VisualAlbum {...props} stickers={[]} visitor />,
    );
    expect(html).toContain("Sin numeración oficial");
    expect(html.match(/class="album-slot preview-slot/g)).toHaveLength(12);
    expect(html).not.toContain("Desbloquear ");
  });
  it("los cromos reales muestran cantidades y protegen las reservas", () => {
    const sticker = {
      id: "fixture",
      name: "Fixture de pruebas",
      official_code: "TEST",
      edition: "TEST",
      variant: "base",
      teams: { name: "Athletic Club" },
    } as Sticker;
    const html = renderToStaticMarkup(
      <VisualAlbum
        {...props}
        stickers={[sticker]}
        visitor={false}
        inventory={[
          { user_id: "u", sticker_id: "fixture", quantity: 2, reserved: 1 },
        ]}
      />,
    );
    expect(html).toContain("Ver Fixture de pruebas, 2 unidades");
    expect(html).toMatch(/disabled=""[^>]*aria-label="Quitar una unidad/);
    expect(html).not.toContain("preview-slot");
  });
});
