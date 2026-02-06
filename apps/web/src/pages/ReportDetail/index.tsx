import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Building2, User, Clock, CheckCircle2, FileText, Calendar, Link as LinkIcon, AlertTriangle, ArrowLeft, Share2, Printer, MessageCircle, Edit, Home } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuthStore } from '../../stores/authStore';
import { useReportDetail } from './hooks/useReportDetail';
import { ShareMenu } from './components/ShareMenu';
import { printStyles } from './printStyles';

export function ReportDetailPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        report,
        tasks,
        materials,
        tomorrowPlans,
        isLoading,
        isVerifying,
        errorMsg,
        showShareMenu,
        setShowShareMenu,
        handleVerify,
        handlePrint,
        handleShareWA,
        handleShareEmail,
        handleCopy,
        canVerify,
    } = useReportDetail();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="p-6 text-center pt-20">
                <AlertTriangle className="mx-auto text-danger mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">Laporan tidak ditemukan</h3>
                <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                    {errorMsg ? `Error: ${errorMsg}` : "Data laporan tidak dapat diambil dari database."}
                </p>
                <div className="space-y-4">
                    <button onClick={() => navigate('/')} className="px-6 py-2 bg-white/10 rounded-full text-sm font-medium hover:bg-white/20 transition-colors">
                        Kembali ke Dashboard
                    </button>
                    {errorMsg && (
                        <div className="text-xs text-left bg-black/30 p-4 rounded-lg font-mono text-danger max-w-sm mx-auto overflow-auto">
                            Debug: {errorMsg}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 bg-dark min-h-screen animate-in fade-in duration-300 print:bg-white print:text-black print:min-h-0 print:pb-0 print:h-auto">
            <style>{printStyles}</style>

            {/* Header */}
            <div className="sticky top-0 z-10 bg-dark/95 backdrop-blur-sm border-b border-white/5 p-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg">Detail Laporan</h1>
                        <p className="text-xs text-gray-400">
                            {report.report_date ? format(new Date(report.report_date), 'EEEE, d MMMM yyyy', { locale: localeId }) : '-'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {user && (report.creator_id === user.id || ['Manager', 'Owner'].includes(user.role)) && !report.is_verified && (
                        <button
                            onClick={() => navigate(`/report/edit/${report.id}`)}
                            className="p-2 bg-yellow-500/10 text-yellow-500 rounded-full hover:bg-yellow-500/20 transition-colors no-print"
                            title="Edit Laporan"
                        >
                            <Edit size={20} />
                        </button>
                    )}
                    <button onClick={() => setShowShareMenu(true)} className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Share Menu Modal */}
            <ShareMenu
                showShareMenu={showShareMenu}
                setShowShareMenu={setShowShareMenu}
                handlePrint={handlePrint}
                handleShareWA={handleShareWA}
                handleShareEmail={handleShareEmail}
                handleCopy={handleCopy}
            />

            <div id="print-container" className="p-4 space-y-4 w-full max-w-7xl mx-auto print:p-0 print:max-w-none print:space-y-0">
                {/* Compact Info Header */}
                <div className="bg-dark-card border border-white/10 rounded-xl p-3 shadow-lg flex flex-col md:flex-row print:flex-row md:items-center print:items-center justify-between gap-4 print:border-b print:border-x-0 print:border-t-0 print:rounded-none print:shadow-none">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 print:border print:border-gray-300">
                                {report.creator?.fullname?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="font-semibold leading-tight">{report.creator?.fullname}</h2>
                                <p className="text-xs text-gray-400">{report.creator?.role}</p>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-8 bg-white/10 print:hidden"></div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5"><MapPin size={10} /> Kantor</div>
                                <p className="text-gray-200 font-medium whitespace-nowrap">{report.location?.location_name}</p>
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5"><Building2 size={10} /> Bagian / Unit</div>
                                <p className="text-gray-200 font-medium whitespace-nowrap">{report.department?.dept_name}</p>
                            </div>
                            {report.project_type && (
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5"><FileText size={10} /> Proyek</div>
                                    <p className="text-gray-200 font-medium text-primary whitespace-nowrap">{report.project_type.project_name}</p>
                                </div>
                            )}
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5"><Clock size={10} /> Dibuat</div>
                                <p className="text-gray-200 font-medium whitespace-nowrap">
                                    {report.created_at ? format(new Date(report.created_at), 'EEEE, d MMM yyyy HH:mm', { locale: localeId }) : '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status - Dual Verification */}
                    <div className="shrink-0 flex flex-col gap-2 items-end justify-center">
                        {!report.approved_by_spv && !report.approved_by_manager && (
                            <span className="text-warning text-[10px] font-bold bg-warning/10 px-2 py-1 rounded-full border border-warning/20 whitespace-nowrap">
                                Tunggu Ver
                            </span>
                        )}
                        {report.approved_by_spv && (
                            <div className="text-right flex flex-col items-end leading-tight">
                                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 print:text-black print:border-black">
                                    <CheckCircle2 size={10} /> Verifikasi SPV
                                </span>
                                <span className="text-[10px] text-gray-400 mt-0.5">{report.spv?.fullname || 'Supervisor'}</span>
                            </div>
                        )}
                        {report.approved_by_manager && (
                            <div className="text-right flex flex-col items-end leading-tight">
                                <span className="flex items-center gap-1 text-blue-400 text-[10px] font-bold uppercase tracking-wider bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10 print:text-black print:border-black">
                                    <CheckCircle2 size={10} /> Verifikasi Mgr
                                </span>
                                <span className="text-[10px] text-gray-400 mt-0.5">{report.manager?.fullname || 'Manager'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="bg-dark-card border border-white/5 rounded-xl p-3 print:border-none print:p-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2 pb-2 border-b border-white/5 print:text-black print:border-gray-200">
                        <CheckCircle2 size={14} className="text-primary print:text-black" /> Daftar Pekerjaan
                    </h3>
                    <div className="divide-y divide-white/5 print:divide-gray-200">
                        {tasks.map((task, index) => (
                            <div key={task.id} className="py-2 first:pt-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded print:px-0 print:mx-0">
                                <div className="flex items-start gap-3">
                                    <span className="text-xs font-mono text-gray-500 mt-0.5 print:text-black">{index + 1}.</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-200 leading-snug break-words print:text-black">
                                            {task.task_description}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User size={10} /> {task.responsible_person || '-'}
                                            </span>
                                            {task.attachments?.map((att) => (
                                                <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline print:text-black">
                                                    <LinkIcon size={10} /> {att.file_type === 'link' ? 'Link' : 'File'}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                    <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border print:border-black print:text-black ${task.status === 'Selesai' ? 'bg-success/10 text-success border-success/20' :
                                        task.status === 'Bermasalah' ? 'bg-danger/10 text-danger border-danger/20' :
                                            'bg-warning/10 text-warning border-warning/20'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <p className="text-center text-xs text-gray-500 py-4">Tidak ada pekerjaan</p>
                        )}
                    </div>
                </div>

                {/* Materials Section */}
                {materials.length > 0 && (
                    <div className="bg-dark-card border border-white/5 rounded-xl p-3 print:border-none print:p-0">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2 pb-2 border-b border-white/5 print:text-black print:border-gray-200">
                            <Building2 size={14} className="text-purple-400 print:text-black" /> Material
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-8 gap-y-1">
                            {materials.map((m) => (
                                <div key={m.id} className="flex justify-between items-center py-1 border-b border-white/5 print:border-dotted print:border-gray-300 last:border-0">
                                    <span className="text-xs text-gray-200 print:text-black">{m.item_name}</span>
                                    <span className="text-xs font-medium text-gray-200 print:text-black whitespace-nowrap ml-2">{m.quantity} {m.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tomorrow Plan Section */}
                <div className="bg-dark-card border border-white/5 rounded-xl p-3 print:border-none print:p-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2 pb-2 border-b border-white/5 print:text-black print:border-gray-200">
                        <Calendar size={14} className="text-indigo-400 print:text-black" /> Rencana Besok
                    </h3>
                    <div className="space-y-2">
                        {tomorrowPlans.length > 0 ? (
                            tomorrowPlans.map((plan, i) => (
                                <div key={plan.id} className="text-xs text-gray-200 bg-white/5 p-2 rounded border border-white/5 print:text-black print:bg-transparent print:border-gray-200 print:p-1">
                                    <div className="flex gap-2">
                                        <span className="text-gray-500 font-mono print:text-black">{i + 1}.</span>
                                        <div>
                                            <p>{plan.plan_description}</p>
                                            {plan.responsible_person && (
                                                <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 print:text-black">
                                                    <User size={8} /> {plan.responsible_person}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs">
                                {report.tomorrow_plan ? (
                                    <p className="text-gray-300 whitespace-pre-wrap print:text-black">{report.tomorrow_plan}</p>
                                ) : (
                                    <p className="text-gray-500 italic">Tidak ada rencana</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes Section */}
                {report.important_notes && (
                    <div className="bg-danger/5 border border-danger/10 rounded-xl p-3 flex gap-3 items-start md:items-center print:border-red-200 print:bg-transparent">
                        <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5 md:mt-0" />
                        <div>
                            <span className="text-xs font-bold text-danger uppercase mr-2">Catatan Penting:</span>
                            <span className="text-sm text-gray-300 print:text-black">{report.important_notes}</span>
                        </div>
                    </div>
                )}

                {/* Share Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6 mb-4 no-print">
                    <button onClick={handlePrint} className="flex flex-col items-center justify-center p-4 bg-dark-card border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                        <Printer className="text-gray-400 mb-2" size={24} />
                        <span className="text-xs font-medium text-gray-300">Download PDF</span>
                    </button>
                    <button onClick={handleShareWA} className="flex flex-col items-center justify-center p-4 bg-dark-card border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                        <MessageCircle className="text-green-500 mb-2" size={24} />
                        <span className="text-xs font-medium text-gray-300">Share WhatsApp</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 pb-4 text-xs text-gray-400 opacity-50 border-t border-white/5 mt-8 print:border-gray-200 print:text-black print:opacity-100 print:mt-4 print:pt-2 print:pb-0">
                    Dari Tj & Co Untuk AQL
                </div>
            </div>

            {/* Verification Button */}
            {canVerify && (
                <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-dark/95 backdrop-blur-sm z-20 no-print">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleVerify}
                            disabled={isVerifying}
                            className="w-full py-3.5 bg-success hover:bg-success-dark text-white rounded-xl font-bold shadow-lg shadow-success/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <div className="animate-spin size-5 border-2 border-white/30 border-t-white rounded-full"></div>
                            ) : (
                                <CheckCircle2 size={20} />
                            )}
                            Verifikasi Laporan
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="mt-8 mb-4 no-print">
                <Link
                    to="/"
                    className="w-full flex items-center justify-center gap-2 p-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                    <Home size={20} />
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
