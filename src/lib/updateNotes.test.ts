import { describe, it, expect } from "vitest";
import { notesFor } from "@/components/UpdateNotes";
describe("notas por tabuleiro", () => {
  it("Selva mostra suas notas", () => expect(notesFor("selva").some((n) => n.includes("Relíquias"))).toBe(true));
  it("Salinas e Boró não mostram notas da Selva", () => {
    for (const c of ["salinas", "boro"]) expect(notesFor(c).some((n) => /Relíquias|Onça/.test(n))).toBe(false);
  });
});
