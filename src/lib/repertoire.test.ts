import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { courses } from "./repertoire";

describe("все учебные линии легальны", () => {
  for (const c of courses)
    for (const l of c.lessons)
      it(`${c.id}/${l.id}`, () => {
        const g = new Chess();
        for (const s of l.moves) expect(() => g.move(s), `${l.id}: ${s}`).not.toThrow();
        expect(l.definingPlies).toBeLessThanOrEqual(l.moves.length);
        if (l.moves.length % 2 === (c.side === "w" ? 0 : 1)) throw new Error("линия должна кончаться ходом ученика");
      });
  it("Хенкен начинается с 1.e4 c6 2.d4 d5 3.e5 c5", () => {
    expect(courses[0]!.lessons[0]!.moves.slice(0, 6)).toEqual(["e4", "c6", "d4", "d5", "e5", "c5"]);
  });
  it("Гургенидзе: 3.Nc3 без 3...dxe4", () => {
    const l = courses[0]!.lessons.find((x) => x.id === "gurgenidze")!;
    expect(l.moves.slice(0, 5)).toEqual(["e4", "c6", "d4", "d5", "Nc3"]);
    expect(l.moves[5]).not.toBe("dxe4");
  });
});