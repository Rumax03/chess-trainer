import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChessBoard, type BoardArrow } from "@/components/ChessBoard";
import { SiteHeader } from "@/components/SiteHeader";
import { getCourse, getLesson } from "@/lib/repertoire";
import { lessonKey, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/lesson/$courseId/$lessonId")({
  loader: ({ params }) => {
    if (!getLesson(params.courseId, params.lessonId)) throw notFound();
    return { c: params.courseId, l: params.lessonId };
  },
  head: ({ loaderData }) => {
    const l = loaderData ? getLesson(loaderData.c, loaderData.l) : undefined;
    const t = l ? `${l.title} — урок | Мой дебютный репертуар` : "Урок не найден";
    const d = l ? `${l.subtitle}. ${l.intro}` : "";
    return {
      meta: [
        { title: t }, { name: "description", content: d },
        { property: "og:title", content: t }, { property: "og:description", content: d },
        { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: LessonPage,
});

type Mode = "theory" | "demo" | "training" | "exam";
const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "theory", label: "Теория", hint: "Листайте ходы и читайте объяснения" },
  { id: "demo", label: "Демо", hint: "Линия проигрывается автоматически" },
  { id: "training", label: "Тренировка", hint: "Делайте ходы сами, есть подсказки" },
  { id: "exam", label: "Экзамен", hint: "Без подсказок, ошибки считаются" },
];

function LessonPage() {
  const { c, l } = Route.useLoaderData();
  const course = getCourse(c)!;
  const lesson = getLesson(c, l)!;
  const side = course.side;
  const key = lessonKey(c, l);
  const { store, update } = useProgress();
  const prog = store[key] ?? {};

  const positions = useMemo(() => {
    const g = new Chess();
    const out: { fen: string; last: [string, string] | null; from?: string; to?: string }[] = [{ fen: g.fen(), last: null }];
    for (const s of lesson.moves) {
      const mv = g.move(s);
      out[out.length - 1]!.from = mv.from;
      out[out.length - 1]!.to = mv.to;
      out.push({ fen: g.fen(), last: [mv.from, mv.to] });
    }
    return out;
  }, [lesson]);
  const total = lesson.moves.length;
  const isUserPly = (i: number) => (i % 2 === 0 ? "w" : "b") === side;
  const userMoves = lesson.moves.filter((_, i) => isUserPly(i)).length;

  const [mode, setMode] = useState<Mode>("theory");
  const [ply, setPly] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const finishedRef = useRef(false);

  function restart(m: Mode = mode) {
    setMode(m); setPly(0); setPlaying(m === "demo"); setWrong(null); setFeedback(null);
    setMistakes(0); setAttempts(0); setShowHint(false); finishedRef.current = false;
  }

  // Opponent auto-reply
  useEffect(() => {
    if ((mode === "training" || mode === "exam") && ply < total && !isUserPly(ply)) {
      const t = setTimeout(() => setPly((p) => p + 1), ply === 0 ? 500 : 650);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [mode, ply, total]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo autoplay
  useEffect(() => {
    if (mode !== "demo" || !playing) return undefined;
    if (ply >= total) { setPlaying(false); return undefined; }
    const t = setTimeout(() => setPly((p) => p + 1), 1400);
    return () => clearTimeout(t);
  }, [mode, playing, ply, total]);

  // Completion
  useEffect(() => {
    if (ply < total || finishedRef.current) return;
    finishedRef.current = true;
    if (mode === "theory") update(key, (p) => ({ ...p, theory: true }));
    if (mode === "demo") update(key, (p) => ({ ...p, demo: true }));
    if (mode === "training") {
      update(key, (p) => ({ ...p, trained: (p.trained ?? 0) + 1 }));
      setFeedback({ ok: true, text: "Линия пройдена! Попробуйте экзамен." });
    }
    if (mode === "exam") {
      const score = Math.max(0, Math.round((100 * (userMoves - Math.min(mistakes, userMoves))) / userMoves));
      const passed = score >= 80;
      update(key, (p) => ({ ...p, examBest: Math.max(p.examBest ?? 0, score), passed: p.passed || passed }));
      setFeedback({ ok: passed, text: passed ? `Экзамен сдан: ${score}% (ошибок: ${mistakes})` : `Результат ${score}% — нужно 80%. Повторите тренировку.` });
    }
  }, [ply, total, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  function onMove(from: string, to: string) {
    if (ply >= total || !isUserPly(ply)) return;
    const g = new Chess(positions[ply]!.fen);
    let san: string;
    try { san = g.move({ from, to, promotion: "q" }).san; } catch { return; }
    if (san === lesson.moves[ply]) {
      setWrong(null); setAttempts(0); setShowHint(false);
      setFeedback({ ok: true, text: `Верно: ${san}` });
      setPly(ply + 1);
    } else {
      setWrong(to);
      setTimeout(() => setWrong(null), 700);
      if (mode === "exam") setMistakes((x) => x + 1);
      const a = attempts + 1;
      setAttempts(a);
      if (mode === "training" && a >= 2) setShowHint(true);
      setFeedback({ ok: false, text: `${san} — не ход учебной линии.${mode === "training" ? " Попробуйте ещё раз." : ""}` });
    }
  }

  const interactive = (mode === "training" || mode === "exam") && ply < total && isUserPly(ply);
  const cur = positions[ply]!;
  const arrows: BoardArrow[] = [];
  if (mode === "theory" || mode === "demo") {
    for (const [f, t] of lesson.arrows?.[ply] ?? []) arrows.push({ from: f, to: t, kind: "idea" });
    if (ply < total && cur.from && cur.to) arrows.push({ from: cur.from, to: cur.to });
  }
  if (mode === "training" && showHint && cur.from && cur.to) arrows.push({ from: cur.from, to: cur.to });

  const note = ply > 0 ? lesson.notes[ply] : undefined;
  const lastFromDoc = ply > 0 && ply <= lesson.definingPlies;
  const moveLabel = (i: number) => `${Math.floor(i / 2) + 1}.${i % 2 ? ".." : ""} ${lesson.moves[i]}`;
  const idx = course.lessons.findIndex((x) => x.id === l);
  const next = course.lessons[idx + 1];

  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:py-8">
        <div className="mx-auto w-full max-w-[640px]">
          <ChessBoard fen={cur.fen} orientation={side} interactive={interactive} onMove={onMove}
            lastMove={cur.last} arrows={arrows} wrongSquare={wrong} />
          <div className="mt-3 flex items-center justify-between gap-2">
            {(mode === "theory" || mode === "demo") ? (
              <div className="flex flex-1 gap-2">
                <Ctl onClick={() => { setPlaying(false); setPly(0); }} label="В начало">⏮</Ctl>
                <Ctl onClick={() => { setPlaying(false); setPly((p) => Math.max(0, p - 1)); }} label="Назад">◀</Ctl>
                {mode === "demo" && <Ctl onClick={() => { if (ply >= total) setPly(0); setPlaying((x) => !x); }} label="Пуск/пауза">{playing ? "⏸" : "▶"}</Ctl>}
                <Ctl primary onClick={() => { setPlaying(false); setPly((p) => Math.min(total, p + 1)); }} label="Вперёд">▶</Ctl>
                <Ctl onClick={() => { setPlaying(false); setPly(total); }} label="В конец">⏭</Ctl>
              </div>
            ) : (
              <div className="flex flex-1 gap-2">
                <Ctl onClick={() => restart()} label="Заново">↺ Заново</Ctl>
                {mode === "training" && ply < total && <Ctl onClick={() => setShowHint(true)} label="Подсказка">💡 Подсказка</Ctl>}
              </div>
            )}
            <span className="text-xs tabular-nums text-muted-foreground">{ply}/{total}</span>
          </div>
        </div>

        <aside className="space-y-4">
          <div>
            <Link to="/course/$courseId" params={{ courseId: c }} className="text-sm text-muted-foreground hover:text-primary">← {course.title}</Link>
            <h1 className="mt-1 font-display text-2xl font-bold">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground">{lesson.subtitle} · вы играете {side === "w" ? "белыми" : "чёрными"}</p>
          </div>

          <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
            {MODES.map((x) => (
              <button key={x.id} onClick={() => restart(x.id)}
                className={`rounded-lg px-1 py-2 text-xs font-semibold transition sm:text-sm ${mode === x.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {x.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{MODES.find((x) => x.id === mode)!.hint}</p>

          {lesson.warning && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">⚠ {lesson.warning}</div>
          )}

          <div className="rounded-2xl border border-border bg-card p-4">
            {mode === "exam" ? (
              <p className="text-sm">
                {ply >= total ? "Экзамен завершён." : isUserPly(ply) ? "Ваш ход. Сыграйте ход учебной линии." : "Соперник думает…"}
                <span className="mt-2 block text-xs text-muted-foreground">Ошибок: {mistakes} · лучший результат: {prog.examBest ?? "—"}{prog.examBest !== undefined ? "%" : ""}</span>
              </p>
            ) : (
              <>
                {ply > 0 && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-display font-bold">{moveLabel(ply - 1)}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${lastFromDoc ? "bg-accent text-accent-foreground" : "bg-warning/15 text-warning"}`}>
                      {lastFromDoc ? "определяет вариант" : "учебный пример"}
                    </span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">
                  {ply === 0 ? lesson.intro : note ?? (lastFromDoc ? "Ход, определяющий вариант." : "Учебное продолжение — пример типичной игры.")}
                </p>
                {mode === "training" && ply < total && (
                  <p className="mt-2 text-xs text-muted-foreground">{isUserPly(ply) ? "Ваш ход — нажмите на фигуру, затем на поле." : "Соперник отвечает…"}</p>
                )}
              </>
            )}
            {feedback && (mode === "training" || mode === "exam") && (
              <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${feedback.ok ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>{feedback.text}</p>
            )}
          </div>

          {mode !== "exam" && (
            <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-3 text-sm">
              {lesson.moves.map((s, i) => {
                const hidden = mode === "training" && i >= ply;
                return (
                  <button key={i} disabled={mode !== "theory"}
                    onClick={() => setPly(i + 1)}
                    className={`rounded px-1.5 py-0.5 ${i === ply - 1 ? "bg-primary text-primary-foreground" : i < lesson.definingPlies ? "text-foreground" : "text-muted-foreground"} ${mode === "theory" ? "hover:bg-accent" : ""}`}>
                    {i % 2 === 0 && <span className="mr-0.5 text-muted-foreground">{i / 2 + 1}.</span>}
                    {hidden ? "…" : s}
                  </button>
                );
              })}
              <p className="mt-2 w-full text-[11px] text-muted-foreground">Яркие ходы определяют вариант, серые — добавленное учебное продолжение. Все линии проверены на легальность.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            {prog.theory && <span className="rounded bg-accent px-2 py-1">✓ теория</span>}
            {prog.demo && <span className="rounded bg-accent px-2 py-1">✓ демо</span>}
            {!!prog.trained && <span className="rounded bg-accent px-2 py-1">тренировок: {prog.trained}</span>}
            {prog.passed && <span className="rounded bg-primary px-2 py-1 text-primary-foreground">✓ экзамен сдан</span>}
          </div>
          {next && (
            <Link to="/lesson/$courseId/$lessonId" params={{ courseId: c, lessonId: next.id }}
              onClick={() => restart("theory")}
              className="block rounded-xl border border-border p-3 text-sm hover:border-primary/60">
              Следующий урок: <b>{next.title}</b> →
            </Link>
          )}
        </aside>
      </main>
    </div>
  );
}

function Ctl({ children, onClick, label, primary }: { children: React.ReactNode; onClick: () => void; label: string; primary?: boolean }) {
  return (
    <button aria-label={label} onClick={onClick}
      className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition active:scale-95 ${primary ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>
      {children}
    </button>
  );
}