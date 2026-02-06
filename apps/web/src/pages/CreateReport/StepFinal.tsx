import { useState } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import type { TomorrowPlan, StepFinalProps } from './types';

export function StepFinal({
    tomorrowPlans,
    setTomorrowPlans,
    importantNotes,
    setImportantNotes,
}: StepFinalProps) {
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
