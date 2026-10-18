// src/utils/hydration.ts
//
// Ожидание загрузки persist-стора с диска.

export type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/** Вызывает fn, когда стор загружен (сразу, если уже). Возвращает отписку. */
export function whenHydrated(api: PersistApi, fn: () => void): () => void {
  if (api.hasHydrated()) {
    fn();
    return () => {};
  }
  return api.onFinishHydration(fn);
}
