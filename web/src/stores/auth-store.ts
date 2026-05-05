"use client";

import { create } from "zustand";
import { User } from "@/types";
import { getStoredUser, isAuthenticated as checkAuth } from "@/lib/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  initialize: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  setLoading: (value) => set({ isLoading: value }),

  initialize: () => {
    const user = getStoredUser();
    const authenticated = checkAuth();
    set({
      user,
      isAuthenticated: authenticated,
      isLoading: false,
    });
  },

  clear: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
