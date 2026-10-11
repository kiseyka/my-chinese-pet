// store/roomStore.ts
import {
  CabinetType,
  CarpetType,
  FloorType,
  PosterType,
  WallType,
} from "@/content/roomInputMaps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RoomState {
  cabinetType: CabinetType;
  posterType: PosterType;
  wallType: WallType;
  floorType: FloorType;
  carpetType: CarpetType;
  setCabinetType: (type: CabinetType) => void;
  setPosterType: (type: PosterType) => void;
  setWallType: (type: WallType) => void;
  setFloorType: (type: FloorType) => void;
  setCarpetType: (type: CarpetType) => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      cabinetType: "cabinet_00",
      posterType: "poster_00",
      wallType: "wall_000",
      floorType: "floor_000",
      carpetType: "carpet_000",
      setCabinetType: (type) => set({ cabinetType: type }),
      setPosterType: (type) => set({ posterType: type }),
      setWallType: (type) => set({ wallType: type }),
      setFloorType: (type) => set({ floorType: type }),
      setCarpetType: (type) => set({ carpetType: type }),
    }),
    {
      name: "room_state",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
