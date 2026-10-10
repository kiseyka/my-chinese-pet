export type CabinetType = "cabinet_00" | "cabinet_01";
export type PosterType =
  | "poster_00"
  | "poster_01"
  | "poster_02"
  | "poster_03"
  | "poster_04";

export type WallType =
  | "wall_000"
  | "wall_001"
  | "wall_002"
  | "wall_003"
  | "wall_004"
  | "wall_005"
  | "wall_006"
  | "wall_007"
  | "wall_008"
  | "wall_009"
  | "wall_010"
  | "wall_011"
  | "wall_012"
  | "wall_013"
  | "wall_014"
  | "wall_015"
  | "wall_016"
  | "wall_017"
  | "wall_018"
  | "wall_019"
  | "wall_020";

export type FloorType =
  | "floor_000"
  | "floor_001"
  | "floor_002"
  | "floor_003"
  | "floor_004"
  | "floor_005"
  | "floor_006"
  | "floor_007"
  | "floor_008"
  | "floor_009"
  | "floor_010"
  | "floor_011"
  | "floor_012";
export type CarpetType =
  | "carpet_000"
  | "carpet_001"
  | "carpet_002"
  | "carpet_003"
  | "carpet_004"
  | "carpet_005"
  | "carpet_006";

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
export const WALL_TYPE_MAP: Record<WallType, number> = {
  wall_000: 0,
  wall_001: 1,
  wall_002: 2,
  wall_003: 3,
  wall_004: 4,
  wall_005: 5,
  wall_006: 6,
  wall_007: 7,
  wall_008: 8,
  wall_009: 9,
  wall_010: 10,
  wall_011: 11,
  wall_012: 12,
  wall_013: 13,
  wall_014: 14,
  wall_015: 15,
  wall_016: 16,
  wall_017: 17,
  wall_018: 18,
  wall_019: 19,
  wall_020: 20,
};
export const FLOOR_TYPE_MAP: Record<FloorType, number> = {
  floor_000: 0,
  floor_001: 1,
  floor_002: 2,
  floor_003: 3,
  floor_004: 4,
  floor_005: 5,
  floor_006: 6,
  floor_007: 7,
  floor_008: 8,
  floor_009: 9,
  floor_010: 10,
  floor_011: 11,
  floor_012: 12,
};
export const CARPET_TYPE_MAP: Record<CarpetType, number> = {
  carpet_000: 0,
  carpet_001: 1,
  carpet_002: 2,
  carpet_003: 3,
  carpet_004: 4,
  carpet_005: 5,
  carpet_006: 6,
};
