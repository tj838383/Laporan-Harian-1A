import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DailyReport } from '../lib/database.types'
import { useAuthStore } from '../stores/authStore'

interface ReportWithRelations extends DailyReport {
    creator: {
        fullname: string
        role: string
    } | null
    location: {
        location_name: string
    } | null
    department: {
        dept_name: string
    } | null
    project_type: {
        project_name: string
    } | null
    tasks?: {
        status: string
        task_description: string
    }[] | null
}

export function useReports(limit?: number, refetchKey?: string) {
    const { user } = useAuthStore()
    const [reports, setReports] = useState<ReportWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fetchTrigger, setFetchTrigger] = useState(0)

    // Use stable primitive values as dependencies
    const userId = user?.id
    const userRole = user?.role

    // Listen for visibility changes (app returning from background)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && userId) {
                console.log('[useReports] Page visible, triggering refetch')
                setFetchTrigger(prev => prev + 1)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [userId])

    useEffect(() => {
        // No user = no need to fetch, just clear state
        if (!userId) {
            setReports([])
            setIsLoading(false)
            return
        }

        const fetchReports = async (isBackground = false) => {
            try {
                if (!isBackground) setIsLoading(true)

                // Fetch reports based on role
                let query = supabase
                    .from('daily_reports')
                    .select(`
            *,
            approved_by_spv,
            approved_at_spv,
            approved_by_manager,
            approved_at_manager,
            creator:users!daily_reports_creator_id_fkey(fullname, role),
            location:locations!daily_reports_location_id_fkey(location_name),
            department:departments!daily_reports_dept_id_fkey(dept_name),
            project_type:project_types!daily_reports_project_type_id_fkey(project_name),
            tasks:report_tasks(status, task_description)
          `)
                    .order('created_at', { ascending: false })

                // Staff only sees their own reports
                if (userRole === 'Staff') {
                    query = query.eq('creator_id', userId)
                }

                if (limit) {
                    query = query.limit(limit)
                }

                const { data, error: fetchError } = await query

                if (fetchError) throw fetchError

                setReports(data as ReportWithRelations[])
                setError(null)
            } catch (err) {
                console.error('Error fetching reports:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                if (!isBackground) setIsLoading(false)
            }
        }

        fetchReports()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('daily_reports_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'daily_reports',
                },
                () => {
                    fetchReports(true) // Background fetch, don't show spinner
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [userId, userRole, limit, refetchKey, fetchTrigger])

    return { reports, isLoading, error }
}

// Get statistics for dashboard - Optimized
export function useReportStats() {
    const { user } = useAuthStore()
    const [stats, setStats] = useState({
        total: 0,
        verified: 0,
        completed: 0,
        inProgress: 0,
        problematic: 0,
        draft: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setIsLoading(false)
            return
        }

        const fetchStats = async () => {
            setIsLoading(true)
            try {
                // Fetch ONLY needed fields for stats: status, is_verified, and tasks status
                let query = supabase
                    .from('daily_reports')
                    .select(`
                        id,
                        status,
                        is_verified,
                        tasks:report_tasks(status)
                    `)

                if (user.role === 'Staff') {
                    query = query.eq('creator_id', user.id)
                }

                const { data, error } = await query
                if (error) throw error

                type ReportStat = { id: string; status: string; is_verified: boolean; tasks: { status: string }[] | null }
                if (data) {
                    const reports = data as ReportStat[]
                    setStats({
                        total: reports.length,
                        verified: reports.filter(r => r.is_verified).length,
                        completed: reports.filter(r => r.status !== 'draft' && r.tasks?.every(t => t.status === 'Selesai') && (r.tasks?.length ?? 0) > 0).length,
                        inProgress: reports.filter(r => r.status !== 'draft' && r.tasks?.some(t => t.status === 'Dalam Proses') && !r.tasks?.some(t => t.status === 'Bermasalah')).length,
                        problematic: reports.filter(r => r.tasks?.some(t => t.status === 'Bermasalah')).length,
                        draft: reports.filter(r => r.status === 'draft').length,
                    })
                }
            } catch (err) {
                console.error("Error fetching stats:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [user])

    return { stats, isLoading }
}
