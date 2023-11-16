"use client";
import { create } from "zustand";

const useStore = create((set) => ({
  area: "us",
  setArea: (area) => set({ area }),
}));

export default useStore;
