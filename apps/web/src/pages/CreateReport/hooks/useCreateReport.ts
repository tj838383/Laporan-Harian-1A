import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import type { Task, Material, TomorrowPlan, Location, Department, ProjectType } from '../types';

export function useCreateReport() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [locationId, setLocationId] = useState<number | null>(null);
    const [deptId, setDeptId] = useState<number | null>(null);
    const [projectTypeId, setProjectTypeId] = useState<number | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [tomorrowPlans, setTomorrowPlans] = useState<TomorrowPlan[]>([]);
    const [importantNotes, setImportantNotes] = useState('');

    // Master data
    const [locations, setLocations] = useState<Location[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Fetch master data
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [locsRes, deptsRes, projRes] = await Promise.all([
                    supabase.from('locations').select('*').eq('is_active', true),
                    supabase.from('departments').select('*'),
                    supabase.from('project_types').select('*').eq('is_active', true),
                ]);

                setLocations(locsRes.data || []);
                setDepartments(deptsRes.data || []);
                setProjectTypes(projRes.data || []);
            } catch (error) {
                console.error('Error fetching master data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchMasterData();
    }, []);

    // Draft Autosave Logic
    // Load Draft
    useEffect(() => {
        if (isEditMode) return;
        const saved = localStorage.getItem('draft_report');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (confirm('Ditemukan draft laporan yang belum tersimpan. Gunakan draft ini?')) {
                    if (data.locationId) setLocationId(data.locationId);
                    if (data.deptId) setDeptId(data.deptId);
                    if (data.projectTypeId) setProjectTypeId(data.projectTypeId);
                    if (data.tasks) setTasks(data.tasks);
                    if (data.materials) setMaterials(data.materials);
                    if (data.tomorrowPlans) setTomorrowPlans(data.tomorrowPlans);
                    if (data.importantNotes) setImportantNotes(data.importantNotes);
                    if (data.step) setStep(data.step);
                } else {
                    localStorage.removeItem('draft_report');
                }
            } catch (e) {
                console.error('Error loading draft', e);
            }
        }
    }, [isEditMode]);

    // Save Draft
    useEffect(() => {
        if (isEditMode) return;
        const data = {
            locationId, deptId, projectTypeId, tasks, materials, tomorrowPlans, importantNotes, step
        };
        localStorage.setItem('draft_report', JSON.stringify(data));
    }, [isEditMode, locationId, deptId, projectTypeId, tasks, materials, tomorrowPlans, importantNotes, step]);

    // Auto-populate Tomorrow Plans with incomplete tasks from previous report
    useEffect(() => {
        if (isEditMode || !user) return;

        const fetchIncompleteTasks = async () => {
            try {
                console.log('[AutoPopulate] Fetching incomplete tasks for user:', user.id);

                const { data: reports, error: reportError } = await supabase
                    .from('daily_reports')
                    .select('id, created_at')
                    .eq('creator_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (reportError) {
                    console.warn('[AutoPopulate] Error fetching reports:', reportError);
                    return;
                }

                if (!reports || reports.length === 0) {
                    console.log('[AutoPopulate] No previous reports found');
                    return;
                }

                const lastReport = reports[0];
                console.log('[AutoPopulate] Found last report:', lastReport.id);

                const { data: incompleteTasks, error: tasksError } = await supabase
                    .from('report_tasks')
                    .select('task_description, responsible_person, status')
                    .eq('report_id', lastReport.id)
                    .neq('status', 'Selesai')
                    .order('order_index', { ascending: true });

                if (tasksError) {
                    console.warn('[AutoPopulate] Error fetching tasks:', tasksError);
                    return;
                }

                console.log('[AutoPopulate] Found incomplete tasks:', incompleteTasks?.length || 0);

                if (incompleteTasks && incompleteTasks.length > 0) {
                    const autoTasks: Task[] = incompleteTasks.map(t => ({
                        id: crypto.randomUUID(),
                        description: `[Lanjutan] ${t.task_description}`,
                        responsible_person: t.responsible_person || '',
                        status: t.status as Task['status'],
                        attachments: []
                    }));
                    console.log('[AutoPopulate] Setting tasks:', autoTasks);
                    setTasks(prev => [...prev, ...autoTasks]);
                }
            } catch (err) {
                console.warn('[AutoPopulate] Failed to fetch incomplete tasks:', err);
            }
        };

        fetchIncompleteTasks();
    }, [isEditMode, user]);

    // Sync current report's incomplete tasks to Tomorrow Plans
    useEffect(() => {
        const incompleteTasks = tasks.filter(t => t.status !== 'Selesai');

        if (incompleteTasks.length === 0) return;

        setTomorrowPlans(currentPlans => {
            const existingDescriptions = new Set(currentPlans.map(p => p.description));

            const newPlans = incompleteTasks
                .filter(t => {
                    const desc = t.description;
                    return !existingDescriptions.has(desc) &&
                        !existingDescriptions.has(`[Lanjutan] ${desc}`) &&
                        !existingDescriptions.has(`[Hari Ini] ${desc}`);
                })
                .map(t => ({
                    id: crypto.randomUUID(),
                    description: `[Hari Ini] ${t.description}`,
                    responsible_person: t.responsible_person || ''
                }));

            if (newPlans.length === 0) return currentPlans;

            return [...currentPlans, ...newPlans];
        });
    }, [tasks]);

    // Fetch existing report data for edit
    useEffect(() => {
        if (!isEditMode || !id) return;

        const fetchReportData = async () => {
            try {
                const { data: report, error } = await supabase
                    .from('daily_reports')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (report) {
                    setLocationId(report.location_id);
                    setDeptId(report.dept_id);
                    setProjectTypeId(report.project_type_id);
                    setImportantNotes(report.important_notes || '');
                }

                // Fetch Tasks
                const { data: tasksData } = await supabase
                    .from('report_tasks')
                    .select('*, attachments:report_task_attachments(*)')
                    .eq('report_id', id)
                    .order('order_index', { ascending: true });

                if (tasksData) {
                    interface TaskRow { id: string; task_description: string; responsible_person: string | null; status: string; attachments: { id: string; file_type: string; file_url: string; file_name: string }[] | null; }
                    const mappedTasks: Task[] = (tasksData as TaskRow[]).map((t) => ({
                        id: t.id,
                        description: t.task_description,
                        responsible_person: t.responsible_person || '',
                        status: t.status as Task['status'],
                        attachments: t.attachments ? t.attachments.map((a) => ({
                            id: a.id,
                            type: (a.file_type || 'image') as 'image' | 'document' | 'link',
                            url: a.file_url,
                            name: a.file_name || 'Attachment'
                        })) : []
                    }));
                    setTasks(mappedTasks);
                }

                // Fetch Materials
                const { data: materialsData } = await supabase
                    .from('report_materials')
                    .select('*')
                    .eq('report_id', id);

                if (materialsData) {
                    interface MaterialRow { id: string; item_name: string; quantity: number; unit: string; }
                    setMaterials((materialsData as MaterialRow[]).map((m) => ({
                        id: m.id,
                        item_name: m.item_name,
                        quantity: m.quantity,
                        unit: m.unit
                    })));
                }

                // Fetch Tomorrow Plans
                const { data: plansData } = await supabase
                    .from('report_tomorrow_plans')
                    .select('*')
                    .eq('report_id', id)
                    .order('order_index', { ascending: true });

                if (plansData && plansData.length > 0) {
                    interface PlanRow { id: string; plan_description: string; responsible_person: string | null; }
                    setTomorrowPlans((plansData as PlanRow[]).map((p) => ({
                        id: p.id,
                        description: p.plan_description,
                        responsible_person: p.responsible_person || ''
                    })));
                }

            } catch (err) {
                console.error("Error loading report:", err);
                alert("Gagal memuat data laporan");
                navigate('/');
            }
        };

        fetchReportData();
    }, [id, isEditMode, navigate]);

    const handleSubmit = async () => {
        if (!user || !locationId || !deptId) {
            alert('Mohon lengkapi data lokasi dan bagian');
            return;
        }

        setIsSubmitting(true);

        try {
            let targetReportId = id;

            if (isEditMode && id) {
                const { error: updateError } = await supabase
                    .from('daily_reports')
                    .update({
                        location_id: locationId,
                        dept_id: deptId,
                        project_type_id: projectTypeId,
                        tomorrow_plan: tomorrowPlans.map(p => `- ${p.description} (PJ: ${p.responsible_person})`).join('\n') || null,
                        important_notes: importantNotes || null,
                    })
                    .eq('id', id);

                if (updateError) throw updateError;

                await Promise.all([
                    supabase.from('report_tasks').delete().eq('report_id', id),
                    supabase.from('report_materials').delete().eq('report_id', id),
                    supabase.from('report_tomorrow_plans').delete().eq('report_id', id)
                ]);

            } else {
                const { data: newReport, error: insertError } = await supabase
                    .from('daily_reports')
                    .insert({
                        creator_id: user.id,
                        location_id: locationId,
                        dept_id: deptId,
                        project_type_id: projectTypeId,
                        tomorrow_plan: tomorrowPlans.map(p => `- ${p.description} (PJ: ${p.responsible_person})`).join('\n') || null,
                        important_notes: importantNotes || null,
                        status: 'submitted',
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                targetReportId = newReport.id;
            }

            const currentReportId = targetReportId;

            // Insert Tasks and Attachments
            if (tasks.length > 0) {
                for (const [idx, task] of tasks.entries()) {
                    const { data: taskData, error: taskError } = await supabase
                        .from('report_tasks')
                        .insert({
                            report_id: currentReportId,
                            task_description: task.description,
                            responsible_person: task.responsible_person,
                            status: task.status,
                            order_index: idx,
                        })
                        .select()
                        .single();

                    if (taskError) throw taskError;

                    if (task.attachments.length > 0) {
                        const attachmentsToInsert = task.attachments.map(att => ({
                            task_id: taskData.id,
                            file_type: att.type,
                            file_url: att.url,
                            file_name: att.name
                        }));

                        const { error: attachError } = await supabase
                            .from('report_task_attachments')
                            .insert(attachmentsToInsert);

                        if (attachError) {
                            console.warn('Attachment insert failed:', attachError);
                        }
                    }
                }
            }

            // Insert Materials
            if (materials.length > 0) {
                const materialsToInsert = materials.map((mat) => ({
                    report_id: currentReportId,
                    item_name: mat.item_name,
                    quantity: mat.quantity,
                    unit: mat.unit,
                }));

                const { error: materialsError } = await supabase
                    .from('report_materials')
                    .insert(materialsToInsert);

                if (materialsError) throw materialsError;
            }

            // Insert Tomorrow Plans
            if (tomorrowPlans.length > 0) {
                const plansToInsert = tomorrowPlans.map((plan, idx) => ({
                    report_id: currentReportId,
                    plan_description: plan.description,
                    responsible_person: plan.responsible_person,
                    order_index: idx,
                }));

                const { error: plansError } = await supabase
                    .from('report_tomorrow_plans')
                    .insert(plansToInsert);

                if (plansError) {
                    console.warn('Error inserting tomorrow plans:', plansError);
                }
            }

            if (!isEditMode) {
                localStorage.removeItem('draft_report');
            }
            alert(isEditMode ? 'Laporan berhasil diperbarui!' : 'Laporan berhasil dikirim!');
            navigate(`/report/${currentReportId}`);
        } catch (error) {
            console.error('Error submitting report:', error);
            alert(`Gagal mengirim laporan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedDept = departments.find((d) => d.id === deptId);
    const showProjectField = selectedDept?.dept_name === 'Proyek';

    return {
        // Navigation
        step,
        setStep,
        navigate,
        isEditMode,
        isSubmitting,
        handleSubmit,

        // Loading
        isLoadingData,

        // Form data
        locationId,
        setLocationId,
        deptId,
        setDeptId,
        projectTypeId,
        setProjectTypeId,
        tasks,
        setTasks,
        materials,
        setMaterials,
        tomorrowPlans,
        setTomorrowPlans,
        importantNotes,
        setImportantNotes,

        // Master data
        locations,
        departments,
        projectTypes,
        showProjectField,
    };
}
