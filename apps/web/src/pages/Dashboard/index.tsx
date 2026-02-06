import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useDashboard } from './hooks/useDashboard';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { PendingUsers } from './components/PendingUsers';
import { ReportCard } from './components/ReportCard';
import { SearchBar } from './components/SearchBar';
import { NotificationBell } from '../../components/common/NotificationBell';
import { exportToExcel } from '../../lib/excel';
import { Download } from 'lucide-react';

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

export function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        reports,
        filteredReports,
        stats,
        locations, // ... existing
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
    } = useDashboard();

    const handleExport = () => {
        if (filteredReports.length === 0) {
            alert('Tidak ada data yang bisa diexport.');
            return;
        }
        const fileName = `Laporan_Harian_AQL_${new Date().toISOString().split('T')[0]}`;
        exportToExcel(filteredReports, fileName);
    };

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
                    <div className="flex items-center gap-2">
                        <NotificationBell />
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
                </div>
            </header>

            {/* Stats */}
            <StatsBar stats={stats} />

            {/* Search */}
            {/* Search & Export */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} />
                </div>
                {['Supervisor', 'Manager', 'Owner'].includes(user?.role || '') && (
                    <button
                        onClick={handleExport}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg active:scale-95"
                        title="Export to Excel"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline text-sm font-medium">Export</span>
                    </button>
                )}
            </div>

            {/* Filters */}
            {['Supervisor', 'Manager', 'Owner', 'Staff'].includes(user?.role || '') && (
                <FilterBar
                    locations={locations}
                    departments={departments}
                    filterLoc={filterLoc}
                    filterDept={filterDept}
                    filterDate={filterDate}
                    setFilterLoc={setFilterLoc}
                    setFilterDept={setFilterDept}
                    setFilterDate={setFilterDate}
                />
            )}

            {/* Pending Users */}
            <PendingUsers
                pendingUsers={pendingUsers}
                selectedRoles={selectedRoles}
                setSelectedRoles={setSelectedRoles}
                handleApproveUser={handleApproveUser}
                handleRejectUser={handleRejectUser}
            />

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
                        <ReportCard
                            key={report.id}
                            report={report}
                            onClick={() => navigate(`/report/${report.id}`)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default DashboardPage;
