import { create } from 'zustand';

interface SidebarStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useSidebarInfo = create<SidebarStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
}));
