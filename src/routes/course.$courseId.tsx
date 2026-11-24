import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { getCourse } from "@/lib/repertoire";
import { lessonKey, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/course/$courseId")({
  loader: ({ params }) => {
    const c = getCourse(params.courseId);
    if (!c) throw notFound();
    return { id: c.id };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? getCourse(loaderData.id) : undefined;
    const t = c ? `${c.title} — Мой дебютный репертуар` : "Курс не найден";
    return {
      meta: [
        { title: t },
        { name: "description", content: c?.description ?? "" },
        { property: "og:title", content: t },
        { property: "og:description", content: c?.description ?? "" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CoursePage,
});

function CoursePage() {
  const { id } = Route.useLoaderData();
  const c = getCourse(id)!;
  const { store } = useProgress();
  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Все курсы</Link>
        <h1 className="mt-3 font-display text-3xl font-bold">{c.title}</h1>
        <p className="mt-2 text-muted-foreground">{c.description}</p>
        <p className="mt-2 text-sm">Вы играете: <b className="text-primary">{c.side === "w" ? "белыми" : "чёрными"}</b></p>
        <ol className="mt-6 space-y-3">
          {c.lessons.map((l, i) => {
            const p = store[lessonKey(c.id, l.id)] ?? {};
            return (
              <li key={l.id}>
                <Link to="/lesson/$courseId/$lessonId" params={{ courseId: c.id, lessonId: l.id }}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/60">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display font-bold ${p.passed ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    {p.passed ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{l.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{l.subtitle}</div>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      {p.theory && <Tag>теория</Tag>}
                      {!!p.trained && <Tag>тренировок: {p.trained}</Tag>}
                      {p.examBest !== undefined && <Tag>экзамен: {p.examBest}%</Tag>}
                      {l.warning && <span className="rounded bg-warning/15 px-1.5 py-0.5 text-warning">есть учебные примеры</span>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded bg-accent px-1.5 py-0.5 text-accent-foreground">{children}</span>
);