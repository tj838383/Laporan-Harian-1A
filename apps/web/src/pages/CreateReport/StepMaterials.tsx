import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Material, StepMaterialsProps } from './types';

export function StepMaterials({ materials, setMaterials }: StepMaterialsProps) {
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
