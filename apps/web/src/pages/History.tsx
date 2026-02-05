import { useState } from 'react';
import { Search, Filter, Calendar, Loader2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function HistoryPage() {
    const navigate = useNavigate();
    const { reports, isLoading } = useReports();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredReports = reports.filter(report => {
        const searchLower = searchQuery.toLowerCase();
        return (
            report.creator?.fullname?.toLowerCase().includes(searchLower) ||
            report.location?.location_name?.toLowerCase().includes(searchLower) ||
            report.project_type?.project_name?.toLowerCase().includes(searchLower) ||
            (report.dept_id && report.dept_id.toString().includes(searchLower))
        );
    });

    const getStatusLabel = (status: string, spv: boolean, mgr: boolean) => {
        if (status === 'rejected') return 'Ditolak';
        if (mgr) return 'Selesai';
        if (spv) return 'Verif SPV';
        return 'Menunggu';
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 pb-24">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Riwayat Laporan</h1>
                <button className="p-2 bg-dark-card border border-white/10 rounded-full">
                    <Calendar size={20} className="text-gray-400" />
                </button>
            </header>

            {/* Search & Filter */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari kantor, bagian/unit, proyek..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-dark-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary text-white placeholder-gray-500"
                    />
                </div>
                {/* Future: Add Filter logic */}
                <button className="p-3 bg-dark-card border border-white/10 rounded-xl">
                    <Filter size={18} className="text-gray-400" />
                </button>
            </div>

            {/* Report List */}
            <div className="space-y-4">
                {filteredReports.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <FileText size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Belum ada laporan</p>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const statusLabel = getStatusLabel(report.status, !!report.approved_by_spv, !!report.approved_by_manager);

                        let statusColor = 'text-warning border-warning/30 bg-warning/10';
                        if (report.approved_by_manager) statusColor = 'text-success border-success/30 bg-success/10';
                        else if (report.approved_by_spv) statusColor = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
                        else if ((report.status as string) === 'rejected') statusColor = 'text-danger border-danger/30 bg-danger/10';

                        return (
                            <div
                                key={report.id}
                                onClick={() => navigate(`/report/${report.id}`)}
                                className="bg-dark-card border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-white/10"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 pr-2">
                                        <h3 className="font-semibold text-indigo-200 line-clamp-1">
                                            {report.department?.dept_name} - {report.location?.location_name}
                                        </h3>
                                        {report.project_type && (
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {report.project_type.project_name}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-full border ${statusColor} shrink-0`}>
                                        {statusLabel}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-500 mt-2 border-t border-white/5 pt-2">
                                    <span>
                                        📅 {report.report_date ? format(new Date(report.report_date), 'dd MMM yyyy', { locale: localeId }) : '-'}
                                    </span>
                                    <span>
                                        Oleh: {report.creator?.fullname}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
