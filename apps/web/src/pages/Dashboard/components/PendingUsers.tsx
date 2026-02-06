import { User, Check, X } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import type { PendingUser } from '../types';

interface PendingUsersProps {
    pendingUsers: PendingUser[];
    selectedRoles: Record<string, string>;
    setSelectedRoles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    handleApproveUser: (userId: string, userName: string) => void;
    handleRejectUser: (userId: string, userName: string) => void;
}

export function PendingUsers({
    pendingUsers,
    selectedRoles,
    setSelectedRoles,
    handleApproveUser,
    handleRejectUser
}: PendingUsersProps) {
    const { user } = useAuthStore();

    if (pendingUsers.length === 0) return null;

    return (
        <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wide flex items-center gap-2 mb-3">
                <User size={16} />
                Permintaan Akun Baru ({pendingUsers.length})
            </h2>
            <div className="space-y-2">
                {pendingUsers.map(u => (
                    <div key={u.id} className="bg-dark-card p-3 rounded-lg flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <User size={14} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-white">{u.fullname}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>

                                {/* Role Selection */}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-indigo-400">Jadikan:</span>
                                    <select
                                        value={selectedRoles[u.id] || 'Staff'}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setSelectedRoles(prev => ({ ...prev, [u.id]: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                        <option value="Staff" className="bg-dark-card">Staff</option>
                                        {['Manager', 'Owner'].includes(user?.role || '') && (
                                            <>
                                                <option value="Supervisor" className="bg-dark-card text-blue-400">Supervisor</option>
                                                <option value="Manager" className="bg-dark-card text-indigo-400">Manager</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleApproveUser(u.id, u.fullname); }}
                                className="p-1.5 bg-success/20 text-success hover:bg-success/30 rounded-lg transition-colors"
                                title="Setujui"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRejectUser(u.id, u.fullname); }}
                                className="p-1.5 bg-danger/20 text-danger hover:bg-danger/30 rounded-lg transition-colors"
                                title="Tolak"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
