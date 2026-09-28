export type CabinetType = "cabinet_00" | "cabinet_01";
export type PosterType =
  | "poster_00"
  | "poster_01"
  | "poster_02"
  | "poster_03"
  | "poster_04";

export const CABINET_TYPE_MAP: Record<CabinetType, number> = {
  cabinet_00: 0,
  cabinet_01: 1,
};

export const POSTER_TYPE_MAP: Record<PosterType, number> = {
  poster_00: 0,
  poster_01: 1,
  poster_02: 2,
  poster_03: 3,
  poster_04: 4,
};
