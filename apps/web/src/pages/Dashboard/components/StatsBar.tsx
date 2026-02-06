import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { ReportStats } from '../types';

interface StatsBarProps {
    stats: ReportStats;
}

export function StatsBar({ stats }: StatsBarProps) {
    return (
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
    );
}
