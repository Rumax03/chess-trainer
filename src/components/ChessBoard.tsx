import { Chess, type Square } from "chess.js";
import { useMemo, useState, type ReactNode } from "react";

function Piece({type,color}:{type:string;color:string}) { const fill=color==="w"?"#fff8e8":"#252a32"; const stroke=color==="w"?"#252a32":"#e0d5bd"; return <svg viewBox="0 0 48 48" className="relative z-10 h-[85%] w-[85%] pointer-events-none" fill={fill} stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{({p:<><circle cx="24" cy="13" r="6"/><path d="M19 19h10l-2 10 7 7H14l7-7z"/><path d="M12 36h24v5H12z"/></>,r:<><path d="M11 8h7v6h4V8h5v6h4V8h6v12l-5 5v10H16V25l-5-5z"/><path d="M12 35h24v6H12z"/></>,n:<><path d="M13 35c0-10 8-13 12-19l-9 5-7-5L23 5l3 5c11 2 13 14 10 25z"/><circle cx="24" cy="13" r="1.5" fill={stroke}/><path d="M11 35h27v6H11z"/></>,b:<><path d="M24 5c-5 5-11 11-10 17 0 5 5 7 7 8l-7 6h20l-7-6c9-4 10-12 3-19l-7 9"/><path d="M12 36h24v5H12z"/></>,q:<><path d="M9 14l7 9 8-15 8 15 7-9-5 21H14z"/><circle cx="9" cy="11" r="3"/><circle cx="24" cy="6" r="3"/><circle cx="39" cy="11" r="3"/><path d="M12 35h24v6H12z"/></>,k:<><path d="M24 4v12M18 9h12" fill="none" strokeWidth="3"/><path d="M24 19C12 8 6 20 15 28l3 7h12l3-7c9-8 3-20-9-9z"/><path d="M12 35h24v6H12z"/></>} as Record<string, ReactNode>)[type]}</svg>; }
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
                  <Piece type={p.type} color={p.color} />
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