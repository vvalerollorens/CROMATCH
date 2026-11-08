import { describe, expect, it } from "vitest";
import {
  usernameEmail,
  loginEmail,
  accountUsername,
} from "../src/lib/username-auth";
describe("acceso sin correo personal", () => {
  it("normaliza el usuario a una identidad interna estable", () => {
    expect(usernameEmail("  Amigo_23 ")).toBe("amigo_23@accounts.nexo.invalid");
    expect(loginEmail("AMIGO_23")).toBe(usernameEmail("amigo_23"));
    expect(accountUsername(usernameEmail("amigo_23"))).toBe("amigo_23");
  });
  it("rechaza caracteres ambiguos, dominios y longitudes inválidas en registros", () => {
    for (const value of [
      "ab",
      "a".repeat(25),
      "álbum",
      "juan perez",
      "a@b.es",
      "../juan",
      "",
    ])
      expect(() => usernameEmail(value)).toThrow();
  });
  it("mantiene el acceso a cuentas anteriores con correo", () => {
    expect(loginEmail("  anterior@example.test ")).toBe(
      "anterior@example.test",
    );
    expect(accountUsername("anterior@example.test")).toBeNull();
    expect(accountUsername()).toBeNull();
  });
});
