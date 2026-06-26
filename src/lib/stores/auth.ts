'use client'

import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isAdmin: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,

  setUser: (user) => set({ user }),

  setProfile: (profile) =>
    set({
      profile,
      isAdmin: profile?.role === 'admin',
    }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: () =>
    set({
      user: null,
      profile: null,
      isAdmin: false,
      isLoading: false,
    }),
}))
