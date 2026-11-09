import { expect, it } from "vitest";
import {
  duplicateAddition,
  duplicateMatches,
} from "../src/lib/duplicate-entry";
import type { Sticker } from "../src/lib/domain";
it("distingue repetidos de copias totales y respeta límites", () => {
  expect(duplicateAddition(0, 3)).toBe(4);
  expect(duplicateAddition(1, 3)).toBe(3);
  expect(duplicateAddition(7, 3)).toBe(3);
  expect(duplicateAddition(0, 99)).toBe(100);
  for (const n of [0, -1, 100, 1.5, NaN])
    expect(() => duplicateAddition(0, n)).toThrow();
  expect(() => duplicateAddition(998, 2)).toThrow("999");
});

it("equipo y número exacto evitan añadir un 13 al buscar el 3, y admiten Bis sin espacios", () => {
  const rows = [
    {
      id: "one",
      official_code: "3",
      name: "Sivera",
      teams: { name: "Deportivo Alavés" },
    },
    {
      id: "thirteen",
      official_code: "13",
      name: "Guevara",
      teams: { name: "Deportivo Alavés" },
    },
    {
      id: "other",
      official_code: "3",
      name: "Otro",
      teams: { name: "Elche CF" },
    },
    {
      id: "bis",
      official_code: "5 Bis",
      name: "Rubén",
      teams: { name: "Elche CF" },
    },
  ] as Sticker[];
  expect(
    duplicateMatches(rows, "3", "team:Deportivo Alavés").map((s) => s.id),
  ).toEqual(["one"]);
  expect(duplicateMatches(rows, "3", "")).toHaveLength(2);
  expect(
    duplicateMatches(rows, "5bis", "team:Elche CF").map((s) => s.id),
  ).toEqual(["bis"]);
  expect(duplicateMatches(rows, "ruben", "").map((s) => s.id)).toEqual(["bis"]);
});
