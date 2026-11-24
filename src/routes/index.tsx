import { createFileRoute, Link } from "@tanstack/react-router";
import { ChessBoard } from "@/components/ChessBoard";
import { SiteHeader } from "@/components/SiteHeader";
import { courses } from "@/lib/repertoire";
import { lessonKey, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Мой дебютный репертуар — шахматный тренажёр дебютов" },
      { name: "description", content: "Учите Каро-Канн, Лондонскую систему и Славянскую защиту: теория, демонстрация, тренировка и экзамен на интерактивной доске." },
      { property: "og:title", content: "Мой дебютный репертуар" },
      { property: "og:description", content: "Шахматный тренажёр дебютов: Каро-Канн, Лондон, Славянская защита." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { store, reset } = useProgress();
  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Шахматный тренажёр</p>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">Выучите дебюты ходами, а не словами</h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Четыре режима: теория, демонстрация, тренировка с подсказками и экзамен. Соперник отвечает сам, прогресс сохраняется в браузере — без регистрации.
            </p>
            <Link to="/course/$courseId" params={{ courseId: "caro-kann" }}
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:brightness-110">
              Начать с Каро-Канн
            </Link>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <ChessBoard fen="rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq c6 0 4" orientation="b"
              lastMove={["c7", "c5"]} arrows={[{ from: "c5", to: "d4" }]} />
            <p className="mt-2 text-center text-xs text-muted-foreground">Вариант Хенкена: 3...c5</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {courses.map((c) => {
            const done = c.lessons.filter((l) => store[lessonKey(c.id, l.id)]?.passed).length;
            return (
              <Link key={c.id} to="/course/$courseId" params={{ courseId: c.id }}
                className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/60">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.tagline}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5">{c.side === "w" ? "♔ белые" : "♚ чёрные"}</span>
                </div>
                <h2 className="mt-3 font-display text-xl font-bold group-hover:text-primary">{c.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${(done / c.lessons.length) * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Экзаменов сдано: {done} из {c.lessons.length}</p>
              </Link>
            );
          })}
        </section>
        <button onClick={() => confirm("Сбросить весь прогресс?") && reset()} className="mt-8 text-xs text-muted-foreground underline">
          Сбросить прогресс
        </button>
      </main>
    </div>
  );
}