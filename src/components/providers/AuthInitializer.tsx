'use client'

import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuthStore } from '@/lib/stores/auth'
import type { UserProfile } from '@/types'

interface Props {
  user: User
  profile: UserProfile | null
}

export default function AuthInitializer({ user, profile }: Props) {
  const { setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    setUser(user)
    setProfile(profile)
    setLoading(false)
  }, [user, profile, setUser, setProfile, setLoading])

  return null
}
