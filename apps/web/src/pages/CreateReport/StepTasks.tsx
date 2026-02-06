import { useState } from 'react';
import {
    Plus,
    X,
    Check,
    Clock,
    AlertTriangle,
    Loader2,
    Link as LinkIcon,
    Upload,
    Image as ImageIcon,
    FileText,
    Edit2,
    Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Task, Attachment, StepTasksProps } from './types';

export function StepTasks({ tasks, setTasks }: StepTasksProps) {
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

    const startEditing = (task: Task) => {
        setEditingTask(task);
        setNewTask({
            description: task.description,
            responsible_person: task.responsible_person || '',
            status: task.status,
            attachments: task.attachments || []
        });
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
            setTasks(tasks.map((t: Task) => t.id === editingTask.id ? { ...newTask, id: editingTask.id } : t));
            setEditingTask(null);
        } else {
            setTasks([
                ...tasks,
                { ...newTask, id: crypto.randomUUID() },
            ]);
        }

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
        } catch (error) {
            console.error('Upload failed:', error);
            alert(`Gagal upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    };

    const removeTask = (id: string) => {
        setTasks(tasks.filter((t: Task) => t.id !== id));
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
    };

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
            <div id="task-form" className="bg-dark-card border border-primary/20 rounded-xl p-4 space-y-3 shadow-lg shadow-black/20">
                <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                    <Plus size={16} />
                    {editingTask ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}
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

                {/* Attachments Section */}
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
