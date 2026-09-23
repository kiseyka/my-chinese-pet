// store/roomStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CabinetType = "stand" | "wardrobe";

interface RoomState {
  cabinetType: CabinetType;
  setCabinetType: (type: CabinetType) => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      cabinetType: "stand",
      setCabinetType: (type) => set({ cabinetType: type }),
    }),
    {
      name: "room_state",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
