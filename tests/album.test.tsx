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
  it("sin catálogo una cuenta real solo ve el catálogo de referencia", () => {
    const html = renderToStaticMarkup(
      <VisualAlbum {...props} stickers={[]} visitor={false} />,
    );
    expect(html).toContain("Catálogo de consulta");
    expect(html).not.toContain("Toca para abrir");
  });
  it("la visita etiqueta sus casilleros y no inventa jugadores ni códigos oficiales", () => {
    const html = renderToStaticMarkup(
      <VisualAlbum {...props} stickers={[]} visitor />,
    );
    expect(html).toContain("Tus marcas no se guardan");
    expect(html.match(/class="album-slot[^"]*reference-slot/g)).toHaveLength(
      23,
    );
    expect(html).toContain("Marcar Sivera, número 3");
    expect(html).not.toContain("Casillero de prueba");
  });
  it("la plantilla no tiene controles de cantidades ni de repetidos", () => {
    const sticker = {
      id: "fixture",
      name: "Fixture de pruebas",
      official_code: "TEST",
      edition: "TEST",
      variant: "base",
      teams: { name: "Deportivo Alavés" },
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
    expect(html).toContain("Gestionar repetidos de Fixture de pruebas");
    expect(html).not.toContain("Quitar una unidad");
    expect(html).not.toContain("Añadir una unidad");
    expect(html).not.toContain("slot-counter");
    expect(html).not.toContain("preview-slot");
  });
  it("la colección de un amigo muestra su inventario y bloquea la edición", () => {
    const sticker = {
      id: "friend-card",
      name: "Tenaglia",
      official_code: "7",
      edition: "TEST",
      variant: "base",
      teams: { name: "Deportivo Alavés" },
    } as Sticker;
    const html = renderToStaticMarkup(
      <VisualAlbum
        {...props}
        stickers={[sticker]}
        visitor={false}
        readOnly
        inventory={[
          {
            user_id: "friend",
            sticker_id: sticker.id,
            quantity: 2,
            reserved: 0,
          },
        ]}
      />,
    );
    expect(html).toContain("Su colección: 1 de");
    expect(html).toMatch(/disabled="" aria-label="Tiene Tenaglia, código 7"/);
    expect(html).not.toContain("Gestionar repetidos de Tenaglia");
    expect(html).not.toContain("Reconocer cromos con la cámara");
  });
});
