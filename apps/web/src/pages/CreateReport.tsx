import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, X, Check, Clock, AlertTriangle, Loader2, Link as LinkIcon, Upload, Image as ImageIcon, FileText, Edit2, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

type Attachment = {
    id: string;
    type: 'image' | 'document' | 'link';
    url: string;
    name: string;
};

type Task = {
    id: string;
    description: string;
    responsible_person: string;
    status: 'Selesai' | 'Dalam Proses' | 'Bermasalah';
    attachments: Attachment[];
};

type Material = {
    id: string;
    item_name: string;
    quantity: number;
    unit: string;
};

type TomorrowPlan = {
    id: string;
    description: string;
    responsible_person: string;
};

type Location = {
    id: number;
    location_name: string;
};

type Department = {
    id: number;
    dept_name: string;
};

type ProjectType = {
    id: number;
    project_name: string;
};

export function CreateReportPage() {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // const [isLoadingReport, setIsLoadingReport] = useState(false); // Removed unused state if not needed, or use it

    // Form data
    const [locationId, setLocationId] = useState<number | null>(null);
    const [deptId, setDeptId] = useState<number | null>(null);
    const [projectTypeId, setProjectTypeId] = useState<number | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);

    // Tomorrow Plans is a list
    const [tomorrowPlans, setTomorrowPlans] = useState<TomorrowPlan[]>([]);
    const [importantNotes, setImportantNotes] = useState('');

    // Master data
    const [locations, setLocations] = useState<Location[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchMasterData = async () => {
            // ... existing code ...
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

    // Auto-populate Tomorrow Plans with incomplete tasks from previous report
    useEffect(() => {
        // Only run for new reports, not edit mode
        if (isEditMode || !user) return;

        const fetchIncompleteTasks = async () => {
            try {
                console.log('[AutoPopulate] Fetching incomplete tasks for user:', user.id);

                // Get user's latest report (use array and take first item to avoid single() error)
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

                // Get incomplete tasks from that report (status != 'Selesai')
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
                        status: t.status, // Keep original status (Dalam Proses/Bermasalah)
                        attachments: []
                    }));
                    console.log('[AutoPopulate] Setting tasks:', autoTasks);
                    setTasks(prev => [...prev, ...autoTasks]); // Append to existing tasks
                }
            } catch (err) {
                console.warn('[AutoPopulate] Failed to fetch incomplete tasks:', err);
            }
        };

        fetchIncompleteTasks();
    }, [isEditMode, user]);

    // Sync current report's incomplete tasks to Tomorrow Plans
    useEffect(() => {
        // Get tasks that are not "Selesai" from current report
        const incompleteTasks = tasks.filter(t => t.status !== 'Selesai');

        if (incompleteTasks.length === 0) return;

        // Check which incomplete tasks are NOT yet in tomorrowPlans
        setTomorrowPlans(currentPlans => {
            const existingDescriptions = new Set(currentPlans.map(p => p.description));

            const newPlans = incompleteTasks
                .filter(t => {
                    // Check if this task is not already in plans (with or without [Lanjutan] prefix)
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
            // setIsLoadingReport(true); // Unused state
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
                    const mappedTasks: Task[] = tasksData.map((t: any) => ({
                        id: t.id,
                        description: t.task_description,
                        responsible_person: t.responsible_person || '',
                        status: t.status,
                        attachments: t.attachments ? t.attachments.map((a: any) => ({
                            id: a.id,
                            type: a.file_type || 'image', // fallback
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
                    setMaterials(materialsData.map((m: any) => ({
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
                    setTomorrowPlans(plansData.map((p: any) => ({
                        id: p.id,
                        description: p.plan_description,
                        responsible_person: p.responsible_person || ''
                    })));
                }

            } catch (err) {
                console.error("Error loading report:", err);
                alert("Gagal memuat data laporan");
                navigate('/');
            } finally {
                // setIsLoadingReport(false);
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
                // UPDATE
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

                // Sync Sub-items: Delete all old items to replace with new state
                // This is the simplest way to handle additions/removals/edits without complex diffing
                await Promise.all([
                    supabase.from('report_tasks').delete().eq('report_id', id),
                    supabase.from('report_materials').delete().eq('report_id', id),
                    supabase.from('report_tomorrow_plans').delete().eq('report_id', id)
                ]);

            } else {
                // INSERT
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

            // 2. Insert Tasks and Attachments
            if (tasks.length > 0) {
                for (const [idx, task] of tasks.entries()) {
                    // Create Task
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

                    // Create Attachments for this Task
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

            // 3. Insert Materials
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

            // 4. Insert Tomorrow Plans (NEW TABLE)
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

            alert(isEditMode ? 'Laporan berhasil diperbarui!' : 'Laporan berhasil dikirim!');
            navigate(`/report/${currentReportId}`);
            return; // Exit function to avoid hitting the catch block or remaining code
        } catch (error: any) {
            console.error('Error submitting report:', error);
            alert(`Gagal mengirim laporan: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedDept = departments.find((d) => d.id === deptId);
    const showProjectField = selectedDept?.dept_name === 'Proyek';

    if (isLoadingData) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 pb-24">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 -ml-2 text-gray-400"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg">Buat Laporan</h1>
                <div className="w-8" />
            </header>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Step {step} dari 4</span>
                    <span>
                        {step === 1
                            ? 'Info Dasar'
                            : step === 2
                                ? 'Daftar Pekerjaan'
                                : step === 3
                                    ? 'Material'
                                    : 'Finalisasi'}
                    </span>
                </div>
                <div className="h-2 bg-dark-card rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
            </div>

            {/* Content Steps */}
            <div className="min-h-[400px]">
                {step === 1 && (
                    <StepInfo
                        locations={locations}
                        departments={departments}
                        projectTypes={projectTypes}
                        locationId={locationId}
                        setLocationId={setLocationId}
                        deptId={deptId}
                        setDeptId={setDeptId}
                        projectTypeId={projectTypeId}
                        setProjectTypeId={setProjectTypeId}
                        showProjectField={showProjectField}
                    />
                )}
                {step === 2 && <StepTasks tasks={tasks} setTasks={setTasks} />}
                {step === 3 && (
                    <StepMaterials materials={materials} setMaterials={setMaterials} />
                )}
                {step === 4 && (
                    <StepFinal
                        tomorrowPlans={tomorrowPlans}
                        setTomorrowPlans={setTomorrowPlans}
                        importantNotes={importantNotes}
                        setImportantNotes={setImportantNotes}
                    />
                )}
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-dark/95 backdrop-blur-sm z-50">
                <div className="max-w-md mx-auto flex gap-4">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="flex-1 py-3 px-4 rounded-xl border border-white/10 font-medium active:scale-95 transition-transform"
                        >
                            Kembali
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() =>
                            step < 4 ? setStep((s) => s + 1) : handleSubmit()
                        }
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/25 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Mengirim...</span>
                            </>
                        ) : (
                            <span>{step === 4 ? 'Kirim Laporan' : 'Selanjutnya'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}



function StepInfo({
    locations,
    departments,
    projectTypes,
    locationId,
    setLocationId,
    deptId,
    setDeptId,
    projectTypeId,
    setProjectTypeId,
    showProjectField,
}: any) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                    📍 Kantor <span className="text-danger">*</span>
                </label>
                <select
                    className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-primary"
                    value={locationId || ''}
                    onChange={(e) => setLocationId(Number(e.target.value))}
                >
                    <option value="" disabled className="bg-dark-card">
                        Pilih Kantor...
                    </option>
                    {locations.map((loc: any) => (
                        <option key={loc.id} value={loc.id} className="bg-dark-card text-white">
                            {loc.location_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                    🏢 Bagian / Unit <span className="text-danger">*</span>
                </label>
                <select
                    className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-primary"
                    value={deptId || ''}
                    onChange={(e) => setDeptId(Number(e.target.value))}
                >
                    <option value="" disabled className="bg-dark-card">
                        Pilih Bagian / Unit...
                    </option>
                    {departments.map((dept: any) => (
                        <option key={dept.id} value={dept.id} className="bg-dark-card text-white">
                            {dept.dept_name}
                        </option>
                    ))}
                </select>
            </div>

            {showProjectField && (
                <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <label className="text-sm font-medium text-gray-300">
                        📁 Detail Proyek <span className="text-danger">*</span>
                    </label>
                    <select
                        className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-primary"
                        value={projectTypeId || ''}
                        onChange={(e) => setProjectTypeId(Number(e.target.value))}
                    >
                        <option value="" disabled className="bg-dark-card">
                            Pilih Proyek...
                        </option>
                        {projectTypes.map((proj: any) => (
                            <option key={proj.id} value={proj.id} className="bg-dark-card text-white">
                                {proj.project_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                    📅 Tanggal Laporan
                </label>
                <div className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-gray-400">
                    {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </div>
            </div>
        </div>
    );
}

function StepTasks({ tasks, setTasks }: any) {
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newTask, setNewTask] = useState({
        description: '',
        responsible_person: '',
        status: 'Dalam Proses' as Task['status'],
        attachments: [] as Attachment[]
    });

    const [isAddingAttachment, setIsAddingAttachment] = useState(false);
    const [newLink, setNewLink] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Populate form when editing starts
    const startEditing = (task: Task) => {
        setEditingTask(task);
        setNewTask({
            description: task.description,
            responsible_person: task.responsible_person || '',
            status: task.status,
            attachments: task.attachments || []
        });
        // Scroll to form (optional, but good UX)
        document.getElementById('task-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setEditingTask(null);
        setNewTask({
            description: '',
            responsible_person: '',
            status: 'Dalam Proses',
            attachments: []
        });
    };

    const saveTask = () => {
        if (!newTask.description.trim()) {
            alert('Deskripsi pekerjaan harus diisi');
            return;
        }

        if (editingTask) {
            // Update existing task
            setTasks(tasks.map((t: Task) => t.id === editingTask.id ? { ...newTask, id: editingTask.id } : t));
            setEditingTask(null);
        } else {
            // Add new task
            setTasks([
                ...tasks,
                { ...newTask, id: crypto.randomUUID() },
            ]);
        }

        // Reset form
        setNewTask({
            description: '',
            responsible_person: '',
            status: 'Dalam Proses',
            attachments: []
        });
        setIsAddingAttachment(false);
        setNewLink('');
    };

    const addLink = () => {
        if (!newLink) return;
        setNewTask(prev => ({
            ...prev,
            attachments: [...prev.attachments, {
                id: crypto.randomUUID(),
                type: 'link',
                url: newLink,
                name: newLink
            }]
        }));
        setNewLink('');
        setIsAddingAttachment(false);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

            const type = file.type.startsWith('image/') ? 'image' : 'document';

            setNewTask(prev => ({
                ...prev,
                attachments: [...prev.attachments, {
                    id: crypto.randomUUID(),
                    type,
                    url: publicUrl,
                    name: file.name
                }]
            }));
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Gagal upload file: ${error.message}`);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const removeTask = (id: string) => {
        setTasks(tasks.filter((t: Task) => t.id !== id));
        // If removing the task currently being edited, cancel edit
        if (editingTask && editingTask.id === id) {
            cancelEditing();
        }
    };

    const getStatusStyle = (status: Task['status']) => {
        switch (status) {
            case 'Selesai':
                return 'bg-green-600 text-white border-green-700 shadow-lg shadow-green-500/20';
            case 'Bermasalah':
                return 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-500/20';
            default:
                return 'bg-amber-500 text-black border-amber-600 shadow-lg shadow-amber-500/20 font-semibold';
        }
    };

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'Selesai':
                return <Check size={14} className="stroke-[3]" />;
            case 'Bermasalah':
                return <AlertTriangle size={14} className="stroke-[3]" />;
            default:
                return <Clock size={14} className="stroke-[3]" />;
        }
    };

    const getAttachmentIcon = (type: Attachment['type']) => {
        switch (type) {
            case 'image': return <ImageIcon size={12} className="text-purple-400" />;
            case 'link': return <LinkIcon size={12} className="text-blue-400" />;
            default: return <FileText size={12} className="text-orange-400" />;
        }
    }

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <h3 className="font-medium text-lg mb-2">Daftar Pekerjaan Harian</h3>

            {/* Existing Tasks */}
            {tasks.map((task: Task) => (
                <div
                    key={task.id}
                    className="bg-dark-card border border-white/5 rounded-xl p-4 space-y-3 relative group"
                >
                    <button
                        onClick={() => removeTask(task.id)}
                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-danger"
                    >
                        <X size={16} />
                    </button>

                    <div className="space-y-1 pr-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <label className="text-xs text-gray-500">Deskripsi Pekerjaan</label>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>

                                {/* Edit Button */}
                                <div className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEditing(task)}
                                        className="p-1 text-gray-400 hover:text-white bg-dark-card/50 rounded-lg backdrop-blur-sm"
                                        title="Edit Pekerjaan"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div
                                className={`flex items-center gap-1.5 px-3 py-1 bg-opacity-90 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(task.status)}`}
                            >
                                {getStatusIcon(task.status)}
                                <span>{task.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">PJ</label>
                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                                <div className="size-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                                    {task.responsible_person?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="text-sm">{task.responsible_person || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Attachments List Readonly */}
                    {task.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/5">
                            {task.attachments.map(att => (
                                <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs transition-colors border border-white/10">
                                    {getAttachmentIcon(att.type)}
                                    <span className="truncate max-w-[150px] text-gray-300">{att.name}</span>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Add New Task Form */}
            <div className="bg-dark-card border border-primary/20 rounded-xl p-4 space-y-3 shadow-lg shadow-black/20">
                <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                    <Plus size={16} />
                    Tambah Pekerjaan Baru
                </h4>

                <input
                    type="text"
                    placeholder="Deskripsi pekerjaan..."
                    value={newTask.description}
                    onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                />

                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        placeholder="Penanggung Jawab"
                        value={newTask.responsible_person}
                        onChange={(e) =>
                            setNewTask({ ...newTask, responsible_person: e.target.value })
                        }
                        className="bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors"
                    />

                    <select
                        value={newTask.status}
                        onChange={(e) =>
                            setNewTask({
                                ...newTask,
                                status: e.target.value as Task['status'],
                            })
                        }
                        className="bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors appearance-none text-white"
                        style={{ backgroundImage: 'none' }}
                    >
                        <option value="Dalam Proses" className="bg-gray-800 text-white py-2">Dalam Proses</option>
                        <option value="Selesai" className="bg-gray-800 text-white py-2">Selesai</option>
                        <option value="Bermasalah" className="bg-gray-800 text-white py-2">Bermasalah</option>
                    </select>
                </div>

                {/* Attachments Section used for Adding */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-500">Lampiran (Opsional)</label>
                        {!isAddingAttachment && (
                            <div className="flex gap-3">
                                <label className={`cursor-pointer text-xs text-primary flex items-center gap-1 hover:underline ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                    {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                    <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                    />
                                </label>
                                <button onClick={() => setIsAddingAttachment(true)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                                    <LinkIcon size={12} /> Tambah Link
                                </button>
                            </div>
                        )}
                    </div>

                    {isAddingAttachment && (
                        <div className="flex gap-2 animate-in fade-in zoom-in-95">
                            <input
                                type="url"
                                placeholder="https://..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                value={newLink}
                                onChange={e => setNewLink(e.target.value)}
                            />
                            <button onClick={addLink} className="bg-primary/20 text-primary hover:bg-primary/30 px-3 py-1 rounded-lg text-xs font-medium">Add</button>
                            <button onClick={() => setIsAddingAttachment(false)} className="text-gray-500 hover:text-white px-2"><X size={14} /></button>
                        </div>
                    )}

                    {newTask.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {newTask.attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md text-xs border border-white/5">
                                    {getAttachmentIcon(att.type)}
                                    <span className="truncate max-w-[150px]">{att.name}</span>
                                    <button
                                        onClick={() => setNewTask(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== att.id) }))}
                                        className="text-gray-500 hover:text-danger ml-1"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {editingTask && (
                        <button
                            onClick={cancelEditing}
                            className="flex-1 py-3 bg-gray-700 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-gray-600 font-medium mt-2"
                        >
                            <X size={20} />
                            <span>Batal</span>
                        </button>
                    )}
                    <button
                        onClick={saveTask}
                        className={`flex-1 py-3 ${editingTask ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary hover:bg-primary-dark'} text-white rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-primary/20 mt-2`}
                    >
                        {editingTask ? <Save size={20} /> : <Plus size={20} />}
                        <span>{editingTask ? 'Update Pekerjaan' : 'Simpan Pekerjaan'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function StepMaterials({ materials, setMaterials }: any) {
    const [newMaterial, setNewMaterial] = useState({
        item_name: '',
        quantity: '',
        unit: '',
    });

    const addMaterial = () => {
        if (!newMaterial.item_name.trim() || !newMaterial.quantity || !newMaterial.unit) {
            alert('Lengkapi data material (nama, jumlah, satuan)');
            return;
        }

        setMaterials([
            ...materials,
            {
                id: crypto.randomUUID(),
                item_name: newMaterial.item_name,
                quantity: parseFloat(newMaterial.quantity),
                unit: newMaterial.unit,
            },
        ]);

        setNewMaterial({ item_name: '', quantity: '', unit: '' });
    };

    const removeMaterial = (id: string) => {
        setMaterials(materials.filter((m: Material) => m.id !== id));
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <h3 className="font-medium text-lg mb-2">Material Digunakan</h3>

            {materials.length > 0 && (
                <div className="bg-dark-card rounded-xl overflow-hidden border border-white/5">
                    <table className="w-full text-sm">
                        <thead className="bg-white/5 text-gray-400">
                            <tr>
                                <th className="p-3 text-left font-medium">Item</th>
                                <th className="p-3 text-center font-medium">Jml</th>
                                <th className="p-3 text-left font-medium">Satuan</th>
                                <th className="p-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {materials.map((mat: Material) => (
                                <tr key={mat.id}>
                                    <td className="p-3">{mat.item_name}</td>
                                    <td className="p-3 text-center">{mat.quantity}</td>
                                    <td className="p-3 text-gray-400">{mat.unit}</td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => removeMaterial(mat.id)}
                                            className="text-gray-500 hover:text-danger"
                                        >
                                            <X size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="bg-dark-card border border-white/5 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-medium text-primary">Tambah Material</h4>

                <div className="grid grid-cols-12 gap-2">
                    <input
                        type="text"
                        placeholder="Nama material..."
                        value={newMaterial.item_name}
                        onChange={(e) =>
                            setNewMaterial({ ...newMaterial, item_name: e.target.value })
                        }
                        className="col-span-6 bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-primary"
                    />
                    <input
                        type="number"
                        placeholder="Qty"
                        value={newMaterial.quantity}
                        onChange={(e) =>
                            setNewMaterial({ ...newMaterial, quantity: e.target.value })
                        }
                        className="col-span-3 bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-primary"
                    />
                    <input
                        type="text"
                        placeholder="Satuan"
                        value={newMaterial.unit}
                        onChange={(e) =>
                            setNewMaterial({ ...newMaterial, unit: e.target.value })
                        }
                        className="col-span-3 bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-primary"
                    />
                </div>

                <button
                    onClick={addMaterial}
                    className="w-full py-3 bg-primary text-white rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark"
                >
                    <Plus size={20} />
                    Tambah Material
                </button>
            </div>
        </div>
    );
}

function StepFinal({
    tomorrowPlans,
    setTomorrowPlans,
    importantNotes,
    setImportantNotes,
}: any) {
    const [newPlan, setNewPlan] = useState({ description: '', responsible_person: '' });

    const addPlan = () => {
        if (!newPlan.description.trim()) {
            alert('Deskripsi rencana harus diisi');
            return;
        }
        setTomorrowPlans([...tomorrowPlans, { ...newPlan, id: crypto.randomUUID() }]);
        setNewPlan({ description: '', responsible_person: '' });
    };

    const removePlan = (id: string) => {
        setTomorrowPlans(tomorrowPlans.filter((p: TomorrowPlan) => p.id !== id));
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-4">
                <h3 className="font-medium text-lg mb-2">📅 Rencana Kerja Besok</h3>

                {/* Info about auto-import */}
                {tomorrowPlans.some((p: TomorrowPlan) => p.description.startsWith('[Lanjutan]') || p.description.startsWith('[Hari Ini]')) && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex gap-2 items-start text-xs text-blue-300">
                        <span className="text-lg">💡</span>
                        <div className="space-y-1">
                            {tomorrowPlans.some((p: TomorrowPlan) => p.description.startsWith('[Hari Ini]')) && (
                                <p><strong>[Hari Ini]</strong> = Pekerjaan yang belum selesai di laporan ini</p>
                            )}
                            {tomorrowPlans.some((p: TomorrowPlan) => p.description.startsWith('[Lanjutan]')) && (
                                <p><strong>[Lanjutan]</strong> = Pekerjaan yang belum selesai dari laporan sebelumnya</p>
                            )}
                            <p className="text-gray-400">Anda dapat mengedit atau menghapusnya.</p>
                        </div>
                    </div>
                )}
                {tomorrowPlans.map((plan: TomorrowPlan) => (
                    <div key={plan.id} className="bg-dark-card border border-white/5 rounded-xl p-4 relative group">
                        <button
                            onClick={() => removePlan(plan.id)}
                            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-danger"
                        >
                            <X size={16} />
                        </button>
                        <div className="space-y-1 pr-6">
                            <div className="text-sm font-medium">{plan.description}</div>
                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg w-fit mt-2">
                                <div className="size-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px]">
                                    {plan.responsible_person?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="text-xs text-gray-300">{plan.responsible_person || '-'}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Plan Form */}
                <div className="bg-dark-card border border-primary/20 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-medium text-primary">Tambah Rencana Baru</h4>
                    <input
                        type="text"
                        placeholder="Deskripsi kegiatan..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-primary"
                        value={newPlan.description}
                        onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Penanggung Jawab (PJ)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-primary"
                        value={newPlan.responsible_person}
                        onChange={e => setNewPlan({ ...newPlan, responsible_person: e.target.value })}
                    />
                    <button
                        onClick={addPlan}
                        className="w-full py-3 bg-primary text-white rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark"
                    >
                        <Plus size={20} />
                        <span>Tambah Rencana</span>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                    📝 Catatan Penting / Kendala
                </label>
                <textarea
                    className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-white h-24 focus:outline-none focus:border-primary resize-none"
                    placeholder="Catatan penting atau kendala yang dihadapi..."
                    value={importantNotes}
                    onChange={(e) => setImportantNotes(e.target.value)}
                />
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3 items-start">
                <AlertTriangle className="text-primary shrink-0" size={20} />
                <p className="text-xs text-primary/80 leading-relaxed">
                    Pastikan semua data sudah benar sebelum mengirim. Laporan yang sudah
                    diverifikasi Manager tidak dapat diubah kembali.
                </p>
            </div>
        </div>
    );
}

export default CreateReportPage;
