import { create } from "zustand";
import { RoomDTO } from "@codesync/types";

export interface RoomState {
  rooms: RoomDTO[];
  activeRoom: RoomDTO | null;
  loading: boolean;
  setRooms: (rooms: RoomDTO[]) => void;
  setActiveRoom: (room: RoomDTO | null) => void;
  setLoading: (loading: boolean) => void;
  clearRoomState: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  activeRoom: null,
  loading: false,
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  setLoading: (loading) => set({ loading }),
  clearRoomState: () => set({ rooms: [], activeRoom: null, loading: false }),
}));
