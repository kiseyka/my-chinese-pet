// src/hooks/panda/usePandaNews.ts
//
// Новости панды на её экране: есть ли что рассказать (значок), текст реплики
// и «Ура!» — прочитано (новости очищаются, привязанность +1).

import { usePandaStore } from "@/store/pandaStore";
import { buildNewsText } from "@/utils/panda/news";
import { useMemo, useState } from "react";

export function usePandaNews() {
  const news = usePandaStore((s) => s.news);
  const [open, setOpen] = useState(false);

  // Текст собирается при открытии: этапы и «дальше» — по текущему прогрессу
  const text = useMemo(
    () => (open ? buildNewsText(news) : null),
    [open, news],
  );

  const hasNews = news.length > 0;

  const show = () => {
    if (!hasNews) return;
    // Рассказывать нечего (например, этап из старой версии пути) — просто очищаем
    if (!buildNewsText(news)) {
      usePandaStore.getState().clearNews();
      return;
    }
    setOpen(true);
  };

  const done = () => {
    const panda = usePandaStore.getState();
    panda.clearNews();
    panda.increaseBond(1);
    setOpen(false);
  };

  return {
    /** Есть непрочитанные новости — показать значок. */
    hasNews: hasNews && !open,
    /** Текст реплики, если она открыта. */
    text: open ? text : null,
    show,
    done,
  };
}
