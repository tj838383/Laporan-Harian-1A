import { MapPin, Building2, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { ReportWithRelations } from '../types';

interface ReportCardProps {
    report: ReportWithRelations;
    onClick: () => void;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
    const getStatusColor = () => {
        if (report.is_verified) return 'border-l-4 border-l-success bg-success/5';
        if (report.status === 'submitted') return 'border-l-4 border-l-warning bg-warning/5';
        if (report.status === 'draft') return 'border-l-4 border-l-gray-500 bg-gray-500/5';
        return 'border-l-4 border-l-danger bg-danger/5';
    };

    const getStatusBadge = () => {
        if (report.status === 'draft') {
            return (
                <span className="text-[10px] px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                    Draft
                </span>
            );
        }

        return (
            <div className="flex flex-col gap-1 items-end">
                <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${report.approved_by_spv
                    ? 'bg-success/20 text-success border-success/30'
                    : 'bg-warning/10 text-warning border-warning/20'
                    }`}>
                    <span>SPV:</span>
                    {report.approved_by_spv ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                </div>
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

    return (
        <div
            onClick={onClick}
            className={`bg-dark-card rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer ${getStatusColor()}`}
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
                {getStatusBadge()}
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
    );
}
