import { create } from "zustand";
import { RoomDTO } from "@codesync/types";

export interface RoomState {
  rooms: RoomDTO[];
  activeRoom: RoomDTO | null;
  loading: boolean;
  viewMode: "grid" | "list";
  setRooms: (rooms: RoomDTO[]) => void;
  setActiveRoom: (room: RoomDTO | null) => void;
  setLoading: (loading: boolean) => void;
  setViewMode: (mode: "grid" | "list") => void;
  clearRoomState: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  activeRoom: null,
  loading: false,
  viewMode: "grid",
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (activeRoom) => set({ activeRoom }),
  setLoading: (loading) => set({ loading }),
  setViewMode: (viewMode) => set({ viewMode }),
  clearRoomState: () => set({ rooms: [], activeRoom: null, loading: false, viewMode: "grid" }),
}));
