import { Chess, type Square } from "chess.js";
import { useMemo, useState } from "react";

const GLYPH: Record<string, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const FILES = "abcdefgh";

export interface BoardArrow { from: string; to: string; kind?: "move" | "idea" }

interface Props {
  fen: string;
  orientation: "w" | "b";
  interactive?: boolean;
  onMove?: (from: string, to: string) => void;
  lastMove?: [string, string] | null;
  arrows?: BoardArrow[];
  wrongSquare?: string | null;
}

export function ChessBoard({ fen, orientation, interactive, onMove, lastMove, arrows = [], wrongSquare }: Props) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const [sel, setSel] = useState<string | null>(null);
  const targets = useMemo(
    () => (sel ? game.moves({ square: sel as Square, verbose: true }).map((m) => m.to) : []),
    [sel, game],
  );
  const ranks = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === "w" ? FILES.split("") : FILES.split("").reverse();
  const pos = (sq: string) => {
    const f = files.indexOf(sq[0]!);
    const r = ranks.indexOf(Number(sq[1]));
    return { x: f + 0.5, y: r + 0.5 };
  };

  function click(sq: string) {
    if (!interactive) return;
    const p = game.get(sq as Square);
    if (sel && targets.includes(sq as Square)) {
      onMove?.(sel, sq);
      setSel(null);
      return;
    }
    if (p && p.color === game.turn()) setSel(sq === sel ? null : sq);
    else setSel(null);
  }

  return (
    <div className="relative aspect-square w-full select-none overflow-hidden rounded-xl shadow-board">
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {ranks.map((r, ri) =>
          files.map((f, fi) => {
            const sq = `${f}${r}`;
            const p = game.get(sq as Square);
            const dark = (FILES.indexOf(f) + r) % 2 === 0;
            const isLast = lastMove?.includes(sq);
            const isTarget = targets.includes(sq as Square);
            return (
              <button
                key={sq}
                type="button"
                aria-label={sq}
                onClick={() => click(sq)}
                className={`relative flex items-center justify-center ${dark ? "bg-[var(--sq-light)]" : "bg-[var(--sq-dark)]"} ${interactive ? "cursor-pointer" : "cursor-default"}`}
              >
                {isLast && <span className="absolute inset-0 bg-[var(--sq-last)]" />}
                {sel === sq && <span className="absolute inset-0 bg-[var(--sq-select)]" />}
                {wrongSquare === sq && <span className="absolute inset-0 animate-pulse bg-[var(--sq-wrong)]" />}
                {fi === 0 && (
                  <span className={`absolute left-0.5 top-0 text-[10px] font-bold ${dark ? "text-[var(--sq-dark)]" : "text-[var(--sq-light)]"}`}>{r}</span>
                )}
                {ri === 7 && (
                  <span className={`absolute bottom-0 right-1 text-[10px] font-bold ${dark ? "text-[var(--sq-dark)]" : "text-[var(--sq-light)]"}`}>{f}</span>
                )}
                {p && (
                  <span
                    className={`relative z-10 text-[min(10vw,3.4rem)] leading-none ${p.color === "w" ? "text-[var(--piece-white)] [text-shadow:0_0_2px_var(--piece-black),0_0_1px_var(--piece-black),0_2px_3px_oklch(0_0_0/0.4)]" : "text-[var(--piece-black)] [text-shadow:0_0_1px_var(--piece-white),0_2px_3px_oklch(0_0_0/0.3)]"}`}
                  >
                    {GLYPH[p.type]}
                  </span>
                )}
                {isTarget && (
                  <span className={`absolute z-20 rounded-full ${p ? "inset-1 border-4 border-[var(--sq-select)]" : "h-1/4 w-1/4 bg-[var(--sq-select)]"}`} />
                )}
              </button>
            );
          }),
        )}
      </div>
      <svg viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 z-30 h-full w-full">
        <defs>
          <marker id="ah-move" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 z" fill="var(--arrow)" /></marker>
          <marker id="ah-idea" markerWidth="3" markerHeight="3" refX="1.6" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3 z" fill="var(--arrow-idea)" /></marker>
        </defs>
        {arrows.map((a, i) => {
          const s = pos(a.from), e = pos(a.to);
          const dx = e.x - s.x, dy = e.y - s.y, len = Math.hypot(dx, dy) || 1;
          const ex = e.x - (dx / len) * 0.35, ey = e.y - (dy / len) * 0.35;
          const k = a.kind ?? "move";
          return (
            <line key={i} x1={s.x} y1={s.y} x2={ex} y2={ey} stroke={k === "idea" ? "var(--arrow-idea)" : "var(--arrow)"}
              strokeWidth="0.16" strokeLinecap="round" markerEnd={`url(#ah-${k})`} />
          );
        })}
      </svg>
    </div>
  );
}