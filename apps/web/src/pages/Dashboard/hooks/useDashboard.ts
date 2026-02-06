import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { useReports, useReportStats } from '../../../hooks/useReports';
import type { Location, Department } from '../../../lib/database.types';
import type { PendingUser, DateFilter, UseDashboardReturn } from '../types';

export function useDashboard(): UseDashboardReturn {
    const location = useLocation();
    const { user } = useAuthStore();

    // Use location key as part of hook trigger to refetch on navigation
    // Increased limit to 50 for better search experience
    const locationKey = useMemo(() => location.key || 'default', [location.key]);
    const { reports, error } = useReports(50, locationKey);
    const { stats } = useReportStats();

    // Filter States
    const [filterLoc, setFilterLoc] = useState<number | 'all'>('all');
    const [filterDept, setFilterDept] = useState<number | 'all'>('all');
    const [filterDate, setFilterDate] = useState<DateFilter>('today');
    const [searchQuery, setSearchQuery] = useState('');

    // Master Data
    const [locations, setLocations] = useState<Location[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [locs, depts] = await Promise.all([
                    supabase.from('locations').select('*').eq('is_active', true),
                    supabase.from('departments').select('*').eq('is_active', true)
                ]);
                if (locs.data) setLocations(locs.data);
                if (depts.data) setDepartments(depts.data);

                // Fetch Pending Users using RPC function (bypasses RLS)
                if (['Supervisor', 'Manager', 'Owner'].includes(user?.role || '')) {
                    const { data: pendings } = await supabase.rpc('get_pending_users');

                    if (pendings && pendings.length > 0) {
                        setPendingUsers(pendings as PendingUser[]);
                        const initialRoles: Record<string, string> = {};
                        (pendings as PendingUser[]).forEach((u) => initialRoles[u.id] = 'Staff');
                        setSelectedRoles(initialRoles);
                    }
                }
            } catch (err) {
                console.error('Error fetching master data:', err);
            }
        };
        fetchMasterData();
    }, [user]);

    const handleApproveUser = async (userId: string, userName: string) => {
        const roleToAssign = selectedRoles[userId] || 'Staff';

        if (!confirm(`Setujui akun untuk ${userName} sebagai ${roleToAssign}?`)) return;

        try {
            const { data, error } = await supabase.rpc('approve_user', {
                target_user_id: userId,
                new_role: roleToAssign
            });

            if (error) throw error;

            if (data === true) {
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
                alert(`Akun ${userName} berhasil disetujui sebagai ${roleToAssign}!`);
            } else {
                alert('Gagal menyetujui akun: Anda tidak memiliki izin.');
            }
        } catch (err) {
            alert('Gagal menyetujui akun: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleRejectUser = async (userId: string, userName: string) => {
        if (!confirm(`Tolak dan hapus akun ${userName}?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            alert(`Akun ${userName} ditolak.`);
        } catch (err) {
            alert('Gagal menolak akun (mungkin butuh akses admin): ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    // Filter Logic
    const filteredReports = reports.filter(r => {
        if (filterLoc !== 'all' && r.location_id !== filterLoc) return false;
        if (filterDept !== 'all' && r.dept_id !== filterDept) return false;
        if (filterDate !== 'all') {
            const reportDate = new Date(r.created_at);
            const now = new Date();
            if (filterDate === 'today' && !isSameDay(reportDate, now)) return false;
            if (filterDate === 'week' && !isSameWeek(reportDate, now, { weekStartsOn: 1 })) return false;
            if (filterDate === 'month' && !isSameMonth(reportDate, now)) return false;
        }

        // Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            return (
                r.creator?.fullname?.toLowerCase().includes(lowerQuery) ||
                r.location?.location_name?.toLowerCase().includes(lowerQuery) ||
                r.department?.dept_name?.toLowerCase().includes(lowerQuery) ||
                r.project_type?.project_name?.toLowerCase().includes(lowerQuery)
            );
        }

        return true;
    });

    return {
        reports,
        filteredReports,
        stats,
        locations,
        departments,
        pendingUsers,
        selectedRoles,
        filterLoc,
        filterDept,
        filterDate,
        searchQuery,
        setFilterLoc,
        setFilterDept,
        setFilterDate,
        setSearchQuery,
        handleApproveUser,
        handleRejectUser,
        setSelectedRoles,
        error,
    };
}
