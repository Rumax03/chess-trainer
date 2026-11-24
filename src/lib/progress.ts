import { useCallback, useEffect, useState } from "react";

export interface LessonProgress { theory?: boolean; demo?: boolean; trained?: number; examBest?: number; passed?: boolean }
type Store = Record<string, LessonProgress>;
const KEY = "debut-repertoire-progress-v1";

function read(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store; } catch { return {}; }
}

export function useProgress() {
  const [store, setStore] = useState<Store>({});
  useEffect(() => {
    setStore(read());
    const h = () => setStore(read());
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  const update = useCallback((key: string, fn: (p: LessonProgress) => LessonProgress) => {
    const s = read();
    s[key] = fn(s[key] ?? {});
    localStorage.setItem(KEY, JSON.stringify(s));
    setStore({ ...s });
  }, []);
  const reset = useCallback(() => { localStorage.removeItem(KEY); setStore({}); }, []);
  return { store, update, reset };
}

export const lessonKey = (c: string, l: string) => `${c}/${l}`;