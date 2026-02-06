import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { DailyReport } from '../../../lib/database.types';
import type { ReportWithRelations, TaskWithAttachments, ReportMaterial, ReportTomorrowPlan, UseReportDetailReturn } from '../types';

export function useReportDetail(): UseReportDetailReturn {
    const { id } = useParams();
    const { user } = useAuthStore();

    const [report, setReport] = useState<ReportWithRelations | null>(null);
    const [tasks, setTasks] = useState<TaskWithAttachments[]>([]);
    const [materials, setMaterials] = useState<ReportMaterial[]>([]);
    const [tomorrowPlans, setTomorrowPlans] = useState<ReportTomorrowPlan[]>([]);
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

            // 2. Fetch Tasks & Attachments
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

            // 3. Fetch Materials
            try {
                const { data: materialsData } = await supabase
                    .from('report_materials')
                    .select('*')
                    .eq('report_id', id);
                setMaterials(materialsData || []);
            } catch (e) { console.warn('Materials fetch error', e); }

            // 4. Fetch Tomorrow Plans
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
                console.warn('Tomorrow plans fetch error', err);
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

        } catch (error) {
            console.error('CRITICAL: Error fetching report details:', error);
            setErrorMsg(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!user || !report) return;

        const roleMsg = user.role === 'Supervisor' ? 'sebagai Supervisor' : 'sebagai Manager';
        const confirmVerify = window.confirm(`Apakah Anda yakin ingin memverifikasi laporan ini ${roleMsg}?`);
        if (!confirmVerify) return;

        setIsVerifying(true);
        try {
            const updates: Partial<DailyReport> = {};
            const now = new Date().toISOString();

            if (user.role === 'Supervisor') {
                updates.approved_by_spv = user.id;
                updates.approved_at_spv = now;
            }

            if (['Manager', 'Owner'].includes(user.role)) {
                updates.approved_by_manager = user.id;
                updates.approved_at_manager = now;
                updates.status = 'verified';
                updates.is_verified = true;
                updates.verified_by = user.id;
                updates.verified_at = now;
            }

            const { error } = await supabase
                .from('daily_reports')
                .update(updates)
                .eq('id', report.id);

            if (error) throw error;

            await fetchReportDetails();
            alert('Verifikasi berhasil disimpan! ✅');
        } catch (error) {
            console.error('Verify failed:', error);
            alert(`Gagal verifikasi: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsVerifying(false);
        }
    };

    const getReportSummary = () => {
        if (!report) return '';
        const date = report.report_date ? format(new Date(report.report_date), 'dd/MM/yyyy', { locale: localeId }) : '-';

        const taskList = tasks.map((t, i) => {
            const pic = t.responsible_person ? ` (PIC: ${t.responsible_person})` : '';
            const status = t.status ? ` - [${t.status}]` : '';
            return `${i + 1}. ${t.task_description}${status}${pic}`;
        }).join('\n');

        let materialsSection = '';
        if (materials.length > 0) {
            const materialList = materials.map((m) => `• ${m.item_name}: ${m.quantity} ${m.unit}`).join('\n');
            materialsSection = `\n\n*Material:*\n${materialList}`;
        }

        let tomorrowSection = '';
        if (tomorrowPlans.length > 0) {
            const planList = tomorrowPlans.map((p, i) => {
                const pj = p.responsible_person ? ` (PJ: ${p.responsible_person})` : '';
                return `${i + 1}. ${p.plan_description}${pj}`;
            }).join('\n');
            tomorrowSection = `\n\n*Rencana Besok:*\n${planList}`;
        } else if (report.tomorrow_plan) {
            tomorrowSection = `\n\n*Rencana Besok:*\n${report.tomorrow_plan}`;
        }

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

    const canVerify = (() => {
        if (!user || !report) return false;
        if (user.role === 'Supervisor') return !report.approved_by_spv;
        if (['Manager', 'Owner'].includes(user.role)) return !report.approved_by_manager;
        return false;
    })();

    return {
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
        getReportSummary,
        handlePrint,
        handleShareWA,
        handleShareEmail,
        handleCopy,
        canVerify,
    };
}
