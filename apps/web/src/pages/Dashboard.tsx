import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useReports, useReportStats } from '../hooks/useReports';
import { Filter, MapPin, Building2, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { formatDistanceToNow, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

export function DashboardPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();

    // Use location key as part of hook trigger to refetch on navigation
    const locationKey = useMemo(() => location.key || 'default', [location.key]);
    const { reports, error } = useReports(20, locationKey);
    const { stats } = useReportStats();

    // Filter States
    const [filterLoc, setFilterLoc] = useState<number | 'all'>('all');
    const [filterDept, setFilterDept] = useState<number | 'all'>('all');
    const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('today');

    // Master Data
    const [locations, setLocations] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [locs, depts] = await Promise.all([
                    supabase.from('locations').select('*').eq('is_active', true),
                    supabase.from('departments').select('*').eq('is_active', true)
                ]);
                if (locs.data) setLocations(locs.data);
                if (depts.data) setDepartments(depts.data);
            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };
        fetchMasterData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    const getStatusColor = (report: any) => {
        if (report.is_verified) return 'border-l-4 border-l-success bg-success/5';
        if (report.status === 'submitted') return 'border-l-4 border-l-warning bg-warning/5';
        if (report.status === 'draft') return 'border-l-4 border-l-gray-500 bg-gray-500/5';
        return 'border-l-4 border-l-danger bg-danger/5';
    };

    const getStatusBadge = (report: any) => {
        if (report.status === 'draft') {
            return (
                <span className="text-[10px] px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                    Draft
                </span>
            );
        }

        return (
            <div className="flex flex-col gap-1 items-end">
                {/* SPV Badge */}
                <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${report.approved_by_spv
                    ? 'bg-success/20 text-success border-success/30'
                    : 'bg-warning/10 text-warning border-warning/20'
                    }`}>
                    <span>SPV:</span>
                    {report.approved_by_spv ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                </div>

                {/* Manager Badge */}
                <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${report.approved_by_manager
                    ? 'bg-success/20 text-success border-success/30'
                    : 'bg-warning/10 text-warning border-warning/20'
                    }`}>
                    <span>MGR:</span>
                    {report.approved_by_manager ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                </div>
            </div>
        );
    };

    // Filter Logic (Applied to the recent 50 reports)
    const filteredReports = reports.filter(r => {
        // Location Filter
        if (filterLoc !== 'all' && r.location_id !== filterLoc) return false;
        // Dept Filter
        if (filterDept !== 'all' && r.dept_id !== filterDept) return false;
        // Date Filter
        if (filterDate !== 'all') {
            const reportDate = new Date(r.created_at);
            const now = new Date();
            if (filterDate === 'today' && !isSameDay(reportDate, now)) return false;
            if (filterDate === 'week' && !isSameWeek(reportDate, now, { weekStartsOn: 1 })) return false;
            if (filterDate === 'month' && !isSameMonth(reportDate, now)) return false;
        }
        return true;
    });

    // Removed: Full-screen loading removed to prevent stuck state
    // Loading spinner will be shown inline in the reports section

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger">
                    <h3 className="font-semibold mb-1">Error</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 pb-24">
            {/* Header */}
            <header className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-xl font-bold">{getGreeting()}, {user?.fullname?.split(' ')[0] || 'User'}! 👋</h1>
                        <p className="text-sm text-gray-400">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg">
                        <span className={`text-xs px-2 py-1 rounded-full border ${user?.role === 'Owner' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                            user?.role === 'Manager' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                                user?.role === 'Supervisor' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                            {user?.role}
                        </span>
                    </div>
                </div>
            </header>

            {/* Compact Stats Chips (Dynamic) */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    <span className="text-gray-400">Total:</span>
                    <span className="font-bold">{stats.total}</span>
                </div>
                <div className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="text-gray-400">Terverifikasi:</span>
                    <span className="font-bold text-success">{stats.verified}</span>
                </div>
                <div className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-400" />
                    <span className="text-gray-400">Selesai:</span>
                    <span className="font-bold text-blue-400">{stats.completed}</span>
                </div>
                <div className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2">
                    <Clock size={16} className="text-warning" />
                    <span className="text-gray-400">Proses:</span>
                    <span className="font-bold text-warning">{stats.inProgress}</span>
                </div>
                <div className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="text-danger" />
                    <span className="text-gray-400">Bermasalah:</span>
                    <span className="font-bold text-danger">{stats.problematic}</span>
                </div>
                <div className="flex-shrink-0 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle size={16} className="text-gray-400" />
                    <span className="text-gray-400">Draft:</span>
                    <span className="font-bold text-gray-500">{stats.draft}</span>
                </div>
            </div>

            {/* Filter Bar (for Supervisor/Manager/Owner/Staff) */}
            {['Supervisor', 'Manager', 'Owner', 'Staff'].includes(user?.role || '') && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                    {/* Location Filter */}
                    <div className="relative">
                        <select
                            value={filterLoc}
                            onChange={(e) => setFilterLoc(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="appearance-none pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-white cursor-pointer"
                        >
                            <option value="all" className="bg-dark-card">Semua Kantor</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id} className="bg-dark-card">{loc.location_name}</option>
                            ))}
                        </select>
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>

                    {/* Dept Filter */}
                    <div className="relative">
                        <select
                            value={filterDept}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'all') setFilterDept('all');
                                else setFilterDept(Number(val));
                            }}
                            className="appearance-none pl-4 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-white cursor-pointer"
                        >
                            <option value="all" className="bg-dark-card">Semua Bagian / Unit</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id} className="bg-dark-card">{dept.dept_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value as any)}
                            className="appearance-none pl-4 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-white cursor-pointer text-center"
                        >
                            <option value="today" className="bg-dark-card">Hari Ini</option>
                            <option value="week" className="bg-dark-card">Minggu Ini</option>
                            <option value="month" className="bg-dark-card">Bulan Ini</option>
                            <option value="all" className="bg-dark-card">Semua Tanggal</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Reports List */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex justify-between items-center">
                    <span>Laporan Terbaru</span>
                    <span className="text-[10px] font-normal normal-case bg-white/5 px-2 py-0.5 rounded-full text-gray-400">
                        Menampilkan {filteredReports.length} laporan
                    </span>
                </h2>


                {filteredReports.length === 0 ? (
                    <div className="bg-dark-card border border-white/5 rounded-xl p-8 text-center">
                        <FileText className="mx-auto mb-3 text-gray-500" size={48} />
                        <h3 className="font-semibold mb-1">Tidak Ada Laporan</h3>
                        <p className="text-sm text-gray-400">
                            {reports.length > 0
                                ? 'Tidak ada laporan yang cocok dengan filter.'
                                : user?.role === 'Staff'
                                    ? 'Mulai buat laporan harian pertama Anda'
                                    : 'Belum ada laporan yang dibuat oleh tim'}
                        </p>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <div
                            key={report.id}
                            onClick={() => navigate(`/report/${report.id}`)}
                            className={`bg-dark-card rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer ${getStatusColor(report)}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin size={14} className="text-gray-500" />
                                        <h3 className="font-semibold text-sm">
                                            {report.location?.location_name || 'Unknown'} - {report.department?.dept_name || 'Unknown'}
                                        </h3>
                                    </div>
                                    {report.project_type && (
                                        <p className="text-xs text-gray-400 ml-5">
                                            Proyek: {report.project_type.project_name}
                                        </p>
                                    )}
                                </div>
                                {getStatusBadge(report)}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 ml-5">
                                <span className="flex items-center gap-1">
                                    <Building2 size={12} />
                                    {report.creator?.fullname || 'Unknown'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDistanceToNow(new Date(report.created_at), {
                                        addSuffix: true,
                                        locale: localeId
                                    })}
                                </span>
                            </div>

                            {report.important_notes && (
                                <p className="text-xs text-gray-400 mt-2 ml-5 line-clamp-2">
                                    {report.important_notes}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default DashboardPage;
