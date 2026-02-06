/// <reference types="vitest/globals" />
import { useAuthStore } from '../stores/authStore'
import { act } from '@testing-library/react'

// Mock supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(),
                })),
            })),
        })),
    },
}))

describe('authStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useAuthStore.setState({
            user: null,
            session: null,
            isLoading: true,
            isAuthenticated: false,
        })
        vi.clearAllMocks()
    })

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = useAuthStore.getState()

            expect(state.user).toBeNull()
            expect(state.session).toBeNull()
            expect(state.isLoading).toBe(true)
            expect(state.isAuthenticated).toBe(false)
        })
    })

    describe('setUser', () => {
        it('should update user in store', () => {
            const mockUser = {
                id: 'test-id',
                email: 'test@example.com',
                fullname: 'Test User',
                role: 'Staff' as const,
                is_approved: true,
                approved_by: null,
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            act(() => {
                useAuthStore.getState().setUser(mockUser)
            })

            expect(useAuthStore.getState().user).toEqual(mockUser)
        })

        it('should allow setting user to null', () => {
            act(() => {
                useAuthStore.getState().setUser(null)
            })

            expect(useAuthStore.getState().user).toBeNull()
        })
    })

    describe('signOut', () => {
        it('should clear user and session on sign out', async () => {
            const { supabase } = await import('../lib/supabase')
            vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

            // Set initial authenticated state
            useAuthStore.setState({
                user: { id: 'test', email: 'test@test.com' } as import('../lib/database.types').User,
                session: {
                    access_token: 'token',
                    refresh_token: 'refresh',
                    expires_in: 3600,
                    token_type: 'bearer',
                    user: { id: 'test', email: 'test@test.com', app_metadata: {}, user_metadata: {}, aud: '', created_at: '' }
                },
                isAuthenticated: true,
            })

            await act(async () => {
                await useAuthStore.getState().signOut()
            })

            const state = useAuthStore.getState()
            expect(state.user).toBeNull()
            expect(state.session).toBeNull()
            expect(state.isAuthenticated).toBe(false)
        })
    })
})
