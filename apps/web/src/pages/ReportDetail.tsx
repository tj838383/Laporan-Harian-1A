import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Building2, User, Clock, CheckCircle2, FileText, Calendar, Link as LinkIcon, AlertTriangle, ArrowLeft, Share2, Printer, MessageCircle, Mail, Copy, X, Edit, Home } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function ReportDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [report, setReport] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [tomorrowPlans, setTomorrowPlans] = useState<any[]>([]); // Typed as any[] for now, or define interface
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showShareMenu, setShowShareMenu] = useState(false);

    useEffect(() => {
        fetchReportDetails();
    }, [id]);

    const fetchReportDetails = async () => {
        if (!id) return;

        try {
            // 1. Fetch Report Info (Critical)
            const { data: reportData, error: reportError } = await supabase
                .from('daily_reports')
                .select(`
                    *,
                    location:locations(location_name),
                    department:departments(dept_name),
                    project_type:project_types(project_name),
                    creator:users!daily_reports_creator_id_fkey(fullname, role, avatar_url),
                    spv:users!daily_reports_approved_by_spv_fkey(fullname),
                    manager:users!daily_reports_approved_by_manager_fkey(fullname)
                `)
                .eq('id', id)
                .single();

            if (reportError) throw reportError;
            setReport(reportData);

            // 2. Fetch Tasks & Attachments (Semi-Critical)
            // We wrap this to distinguish tasks error from main report error
            try {
                const { data: tasksData, error: tasksError } = await supabase
                    .from('report_tasks')
                    .select(`
                        *,
                        attachments:report_task_attachments(*)
                    `)
                    .eq('report_id', id)
                    .order('order_index', { ascending: true });

                if (tasksError) {
                    console.warn('Tasks fetch warning:', tasksError);
                    // If attachments table missing, try fetching just tasks without attachments
                    if (tasksError.message.includes('report_task_attachments')) {
                        const { data: simpleTasks } = await supabase
                            .from('report_tasks')
                            .select('*')
                            .eq('report_id', id)
                            .order('order_index', { ascending: true });
                        setTasks(simpleTasks || []);
                    }
                } else {
                    setTasks(tasksData || []);
                }
            } catch (err) {
                console.warn('Failed to load tasks:', err);
            }

            // 3. Fetch Materials (Non-Critical)
            try {
                const { data: materialsData } = await supabase
                    .from('report_materials')
                    .select('*')
                    .eq('report_id', id);
                setMaterials(materialsData || []);
            } catch (e) { console.warn('Materials fetch error', e); }

            // 4. Fetch Tomorrow Plans (Non-Critical - Table might be missing)
            try {
                const { data: plansData, error: plansError } = await supabase
                    .from('report_tomorrow_plans')
                    .select('*')
                    .eq('report_id', id)
                    .order('order_index', { ascending: true });

                if (!plansError) {
                    setTomorrowPlans(plansData || []);
                }
            } catch (err) {
                console.warn('Tomorrow plans fetch error (table might be missing)', err);
            }

            // 5. Mark as Read
            if (user && reportData && !(reportData as any).read_by?.includes(user.id)) {
                try {
                    const currentReadBy = (reportData as any).read_by || [];
                    await supabase
                        .from('daily_reports')
                        .update({
                            read_by: [...currentReadBy, user.id],
                            status: reportData.status === 'submitted' ? 'read' : reportData.status
                        } as any)
                        .eq('id', id);
                } catch (e) {
                    console.warn('Mark read failed', e);
                }
            }

        } catch (error: any) {
            console.error('CRITICAL: Error fetching report details:', error);
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!user || !report) return;

        // Custom confirmation message based on role
        const roleMsg = user.role === 'Supervisor' ? 'sebagai Supervisor' : 'sebagai Manager';
        const confirmVerify = window.confirm(`Apakah Anda yakin ingin memverifikasi laporan ini ${roleMsg}?`);
        if (!confirmVerify) return;

        setIsVerifying(true);
        try {
            const updates: any = {};
            const now = new Date().toISOString();

            // Logic Double Verification
            if (user.role === 'Supervisor') {
                updates.approved_by_spv = user.id;
                updates.approved_at_spv = now;
            }

            if (['Manager', 'Owner'].includes(user.role)) {
                updates.approved_by_manager = user.id;
                updates.approved_at_manager = now;

                // Manager approval counts as Final Global Verification
                updates.status = 'verified';
                updates.is_verified = true;
                updates.verified_by = user.id;
                updates.verified_at = now;
            }

            const { error } = await supabase
                .from('daily_reports')
                .update(updates as any)
                .eq('id', report.id);

            if (error) throw error;

            await fetchReportDetails();
            alert('Verifikasi berhasil disimpan! ✅');
        } catch (error: any) {
            console.error('Verify failed:', error);
            alert(`Gagal verifikasi: ${error.message}`);
        } finally {
            setIsVerifying(false);
        }
    };

    // Share Actions
    const getReportSummary = () => {
        if (!report) return '';
        const date = report.report_date ? format(new Date(report.report_date), 'dd/MM/yyyy', { locale: localeId }) : '-';

        // Tasks Section
        const taskList = tasks.map((t, i) => {
            const pic = t.responsible_person ? ` (PIC: ${t.responsible_person})` : '';
            const status = t.status ? ` - [${t.status}]` : '';
            return `${i + 1}. ${t.task_description}${status}${pic}`;
        }).join('\n');

        // Materials Section
        let materialsSection = '';
        if (materials.length > 0) {
            const materialList = materials.map((m) => `• ${m.item_name}: ${m.quantity} ${m.unit}`).join('\n');
            materialsSection = `\n\n*Material:*\n${materialList}`;
        }

        // Tomorrow Plans Section
        let tomorrowSection = '';
        if (tomorrowPlans.length > 0) {
            const planList = tomorrowPlans.map((p: any, i: number) => {
                const pj = p.responsible_person ? ` (PJ: ${p.responsible_person})` : '';
                return `${i + 1}. ${p.plan_description}${pj}`;
            }).join('\n');
            tomorrowSection = `\n\n*Rencana Besok:*\n${planList}`;
        } else if (report.tomorrow_plan) {
            tomorrowSection = `\n\n*Rencana Besok:*\n${report.tomorrow_plan}`;
        }

        // Important Notes Section
        let notesSection = '';
        if (report.important_notes) {
            notesSection = `\n\n*Catatan Penting:*\n${report.important_notes}`;
        }

        return `*Laporan Harian*\nTanggal: ${date}\nOleh: ${report.creator?.fullname}\nLokasi: ${report.location?.location_name}\n\n*Pekerjaan:*\n${taskList}${materialsSection}${tomorrowSection}${notesSection}\n\nLink: ${window.location.href}`;
    };

    const handlePrint = () => {
        window.print();
        setShowShareMenu(false);
    };

    const handleShareWA = () => {
        const text = encodeURIComponent(getReportSummary());
        window.open(`https://wa.me/?text=${text}`, '_blank');
        setShowShareMenu(false);
    };

    const handleShareEmail = () => {
        const subject = encodeURIComponent(`Laporan Harian - ${report?.creator?.fullname} - ${report?.report_date}`);
        const body = encodeURIComponent(getReportSummary());
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        setShowShareMenu(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getReportSummary());
        alert('Ringkasan laporan disalin ke clipboard! 📋');
        setShowShareMenu(false);
    };

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

    const canVerify = (() => {
        if (!user || !report) return false;
        // Supervisor can verify if not yet approved by SPV
        if (user.role === 'Supervisor') return !report.approved_by_spv;
        // Manager can verify if not yet approved by Manager (even if SPV hasn't)
        if (['Manager', 'Owner'].includes(user.role)) return !report.approved_by_manager;
        return false;
    })();

    return (
        <div className="pb-24 bg-dark min-h-screen animate-in fade-in duration-300 print:bg-white print:text-black print:min-h-0 print:pb-0 print:h-auto">
            {/* Print Styling */}
            <style>
                {`
                @media print {
                    @page { size: A4; margin: 0.4cm; } /* 0.4cm margin as requested */
                    html, body, #root { width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
                    
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    
                    /* Force Full Width on ALL containers */
                    .max-w-7xl, .max-w-5xl, .container, div[class*="max-w-"] { 
                        max-width: none !important; 
                        width: 100% !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                    }

                    body { background: white; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    
                    /* High Contrast for Print */
                    .bg-dark {
                        background: transparent !important;
                        color: black !important;
                        border: none !important; /* No border for main wrapper */
                        padding: 0 !important;
                    }

                    .bg-dark-card { 
                        background: transparent !important; 
                        color: black !important; 
                        border: none !important; 
                        box-shadow: none !important; 
                        border-radius: 0 !important;
                        padding: 0 !important;
                        margin-bottom: 0.5cm !important;
                        page-break-inside: avoid;
                    }

                    /* Outer Frame (applied to #print-container) */
                    #print-container {
                        border: 1px solid #000 !important;
                        border-radius: 8px !important;
                        padding: 0.3cm !important;
                        margin-top: 0 !important;
                    }
                    
                    /* If using a single wrapper in future, we can adjust above, but for now remove parent border */
                    
                    .text-gray-200, .text-gray-300, .text-gray-400, .text-gray-500, .text-gray-600 { 
                        color: #000 !important; 
                    }
                    
                    /* Adjust headers inside cards */
                    .bg-dark-card h3 {
                        border-bottom: 1px solid #000 !important;
                        padding-bottom: 0.2cm !important;
                        margin-bottom: 0.4cm !important;
                    }

                    /* Remove gaps/spacing that might look weird */
                    .gap-4 { gap: 1rem !important; }

                    /* Hide fixed action bars */
                    .fixed { display: none !important; }
                    /* But ensure sticky header (if we wanted it) is handled, though usually we hide header in print. 
                       The header has 'no-print' already. 
                       The verify bar is 'fixed'. 
                    */
                }
                `}
            </style>

            {/* Header */}
            <div className="sticky top-0 z-10 bg-dark/95 backdrop-blur-sm border-b border-white/5 p-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
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
                    {/* JOB: Edit Button */}
                    {user && (report.creator_id === user.id || ['Manager', 'Owner'].includes(user.role)) && !report.is_verified && (
                        <button
                            onClick={() => navigate(`/report/edit/${report.id}`)}
                            className="p-2 bg-yellow-500/10 text-yellow-500 rounded-full hover:bg-yellow-500/20 transition-colors no-print"
                            title="Edit Laporan"
                        >
                            <Edit size={20} />
                        </button>
                    )}
                    <button
                        onClick={() => setShowShareMenu(true)}
                        className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Share Menu Modal */}
            {showShareMenu && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print animate-in fade-in duration-200">
                    <div className="bg-dark-card w-full max-w-sm rounded-2xl border border-white/10 p-5 space-y-4 relative animate-in slide-in-from-bottom duration-300">
                        <button
                            onClick={() => setShowShareMenu(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="font-bold text-lg text-center">Bagikan Laporan</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handlePrint} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                                <div className="p-3 bg-red-500/20 text-red-400 rounded-full">
                                    <Printer size={24} />
                                </div>
                                <span className="text-xs font-medium">Simpan PDF</span>
                            </button>

                            <button onClick={handleShareWA} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                                <div className="p-3 bg-green-500/20 text-green-400 rounded-full">
                                    <MessageCircle size={24} />
                                </div>
                                <span className="text-xs font-medium">Kirim WA</span>
                            </button>

                            <button onClick={handleShareEmail} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full">
                                    <Mail size={24} />
                                </div>
                                <span className="text-xs font-medium">Email</span>
                            </button>

                            <button onClick={handleCopy} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                                <div className="p-3 bg-gray-500/20 text-gray-400 rounded-full">
                                    <Copy size={24} />
                                </div>
                                <span className="text-xs font-medium">Salin Teks</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div id="print-container" className="p-4 space-y-4 w-full max-w-7xl mx-auto print:p-0 print:max-w-none print:space-y-0">
                {/* 1. Compact Info Header */}
                <div className="bg-dark-card border border-white/10 rounded-xl p-3 shadow-lg flex flex-col md:flex-row print:flex-row md:items-center print:items-center justify-between gap-4 print:border-b print:border-x-0 print:border-t-0 print:rounded-none print:shadow-none">
                    <div className="flex items-center gap-4">
                        {/* User */}
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 print:border print:border-gray-300">
                                {report.creator?.fullname?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h2 className="font-semibold leading-tight">{report.creator?.fullname}</h2>
                                <p className="text-xs text-gray-400">{report.creator?.role}</p>
                            </div>
                        </div>
                        {/* Divider */}
                        <div className="hidden md:block w-px h-8 bg-white/10 print:hidden"></div>
                        {/* Location Info */}
                        {/* Location Info */}
                        {/* Location Info */}
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

                    {/* Status */}
                    {/* Status - Dual Verification */}
                    <div className="shrink-0 flex flex-col gap-3 items-end justify-center min-w-[100px]">
                        {!report.approved_by_spv && !report.approved_by_manager && (
                            <span className="text-warning text-xs font-bold bg-warning/10 px-3 py-1 rounded-full border border-warning/20">
                                MENUNGGU VERIFIKASI
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

                {/* 2. Tasks Section (Full Width) */}
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
                                            {task.attachments?.map((att: any) => (
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

                {/* 3. Materials Section (Full Width) */}
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

                {/* 4. Tomorrow Plan Section (Full Width) */}
                <div className="bg-dark-card border border-white/5 rounded-xl p-3 print:border-none print:p-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-2 pb-2 border-b border-white/5 print:text-black print:border-gray-200">
                        <Calendar size={14} className="text-indigo-400 print:text-black" /> Rencana Besok
                    </h3>
                    <div className="space-y-2">
                        {tomorrowPlans.length > 0 ? (
                            tomorrowPlans.map((plan: any, i: number) => (
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

                        {/* Always show PJ if exists */}
                        {report.tomorrow_plan_pj && (
                            <div className="mt-2 text-xs border-t border-white/5 pt-2 flex items-center gap-2 print:border-gray-300">
                                <span className="flex items-center gap-1 text-indigo-400 font-bold text-[10px] uppercase print:text-black">
                                    <User size={10} /> PIC / PJ:
                                </span>
                                <span className="text-gray-200 font-medium print:text-black">{report.tomorrow_plan_pj}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Notes Section (Full Width) */}
                {report.important_notes && (
                    <div className="bg-danger/5 border border-danger/10 rounded-xl p-3 flex gap-3 items-start md:items-center print:border-red-200 print:bg-transparent">
                        <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5 md:mt-0" />
                        <div>
                            <span className="text-xs font-bold text-danger uppercase mr-2">Catatan Penting:</span>
                            <span className="text-sm text-gray-300 print:text-black">{report.important_notes}</span>
                        </div>
                    </div>
                )}

                {/* Share & Export Actions (Visible at bottom) */}
                <div className="grid grid-cols-2 gap-3 mt-6 mb-4 no-print">
                    <button
                        onClick={handlePrint}
                        className="flex flex-col items-center justify-center p-4 bg-dark-card border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <Printer className="text-gray-400 mb-2" size={24} />
                        <span className="text-xs font-medium text-gray-300">Download PDF</span>
                    </button>
                    <button
                        onClick={handleShareWA}
                        className="flex flex-col items-center justify-center p-4 bg-dark-card border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <MessageCircle className="text-green-500 mb-2" size={24} />
                        <span className="text-xs font-medium text-gray-300">Share WhatsApp</span>
                    </button>
                    {/* 
                    <button
                        onClick={handleShareEmail}
                        className="flex flex-col items-center justify-center p-4 bg-dark-card border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <Mail className="text-blue-500 mb-2" size={24} />
                        <span className="text-xs font-medium text-gray-300">Email</span>
                    </button>
                    <button
                        onClick={handleCopy}
                        className="flex flex-col items-center justify-center p-4 bg-dark-card border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <Copy className="text-gray-400 mb-2" size={24} />
                        <span className="text-xs font-medium text-gray-300">Copy Text</span>
                    </button>
                    */}
                </div>

                {/* Footer for Report (Always visible in print) */}
                <div className="text-center pt-8 pb-4 text-xs text-gray-400 opacity-50 border-t border-white/5 mt-8 print:border-gray-200 print:text-black print:opacity-100 print:mt-4 print:pt-2 print:pb-0">
                    Dari Tj & Co Untuk AQL
                </div>
            </div>

            {/* Action Bar for Verification */}
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
