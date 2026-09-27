// store/roomStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CabinetType = "cabinet_00" | "cabinet_01";
type PosterType =
  | "poster_00"
  | "poster_01"
  | "poster_02"
  | "poster_03"
  | "poster_04";

interface RoomState {
  cabinetType: CabinetType;
  posterType: PosterType;
  setCabinetType: (type: CabinetType) => void;
  setPosterType: (type: PosterType) => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      cabinetType: "cabinet_00",
      posterType: "poster_00",
      setCabinetType: (type) => set({ cabinetType: type }),
      setPosterType: (type) => set({ posterType: type }),
    }),
    {
      name: "room_state",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
