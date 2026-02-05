import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '../lib/database.types'

interface AuthState {
    user: User | null
    session: any | null
    isLoading: boolean
    isAuthenticated: boolean

    // Actions
    initialize: () => Promise<void>
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signUp: (email: string, password: string, fullname: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    setUser: (user: User | null) => void
    refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,

    initialize: async () => {
        try {
            // Get current session
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
                // Fetch user profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                set({
                    session,
                    user: profile,
                    isAuthenticated: true,
                    isLoading: false
                })
            } else {
                set({ isLoading: false })
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('[Auth] Event:', event, 'Session:', !!session)

                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
                    // Only fetch profile if we don't have user data yet or it's a new sign in
                    const currentUser = get().user
                    if (!currentUser || currentUser.id !== session.user.id) {
                        const { data: profile } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', session.user.id)
                            .single()

                        set({ session, user: profile, isAuthenticated: true, isLoading: false })
                    } else {
                        // Just update session, keep existing user
                        set({ session, isAuthenticated: true, isLoading: false })
                    }
                } else if (event === 'SIGNED_OUT') {
                    set({ session: null, user: null, isAuthenticated: false })
                }
            })
        } catch (error) {
            console.error('Auth initialization error:', error)
            set({ isLoading: false })
        }
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { error: error.message }
        }

        if (data.user) {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single()

            set({ session: data.session, user: profile, isAuthenticated: true })
        }

        return { error: null }
    },

    signUp: async (email, password, fullname) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { fullname }
            }
        })

        if (error) {
            return { error: error.message }
        }

        return { error: null }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ session: null, user: null, isAuthenticated: false })
    },

    setUser: (user) => set({ user }),

    refreshProfile: async () => {
        const session = get().session
        if (!session?.user) return

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

        if (profile) {
            set({ user: profile })
        }
    }
}))
