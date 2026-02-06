import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useReports } from '../hooks/useReports';
import { User, Settings, Bell, Moon, Sun, LogOut, ChevronRight, Download, Shield, X, Save, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ProfilePage() {
    const navigate = useNavigate();
    const { user, signOut, refreshProfile } = useAuthStore();
    const { reports } = useReports();

    // Feature States
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState(user?.fullname || '');
    const [isSaving, setIsSaving] = useState(false);

    const [showSettings, setShowSettings] = useState(false);
    const [notifSettings, setNotifSettings] = useState({
        email: localStorage.getItem('notif_email') === 'true',
        wa: localStorage.getItem('notif_wa') === 'true'
    });

    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') !== 'light');

    // PWA Install Logic
    interface BeforeInstallPromptEvent extends Event {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    }
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    // Stats Logic
    const myReports = reports.filter(r => r.creator_id === user?.id);
    const totalReports = myReports.length;

    // Calculate Completed Tasks
    type TaskWithStatus = { status: string };
    const completedTasksCount = myReports.reduce((acc, report) => {
        const finishedTasks = report.tasks?.filter((t: TaskWithStatus) => t.status === 'Selesai').length || 0;
        return acc + finishedTasks;
    }, 0);

    useEffect(() => {
        // Sync theme
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleLogout = async () => {
        if (confirm('Yakin ingin keluar?')) {
            await signOut();
            navigate('/login');
        }
    };

    const handleEditProfile = async () => {
        if (!user || !newName.trim()) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ fullname: newName })
                .eq('id', user.id);

            if (error) throw error;

            // Refresh local user data
            await refreshProfile();
            setEditMode(false);
            alert('Profil berhasil diperbarui! ✅');
        } catch (error) {
            alert('Gagal update: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportCSV = () => {
        if (myReports.length === 0) {
            alert('Belum ada laporan untuk didownload.');
            return;
        }

        const headers = ['Tanggal', 'Lokasi', 'Judul Pekerjaan', 'Status'];
        const rows = myReports.map(r => [
            r.report_date ? new Date(r.report_date).toLocaleDateString('id-ID') : '-',
            r.location?.location_name || '-',
            '"' + (r.tasks?.[0]?.task_description || 'Laporan Harian') + '"', // Escape quotes
            r.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `laporan_harian_${user?.fullname}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleNotif = (key: 'email' | 'wa') => {
        const newVal = !notifSettings[key];
        setNotifSettings(prev => ({ ...prev, [key]: newVal }));
        localStorage.setItem(`notif_${key}`, String(newVal));
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'Owner': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'Manager': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
            case 'Supervisor': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="p-6 pb-24">
            <header className="mb-8 text-center pt-4 relative">
                <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 border-4 border-dark-card shadow-xl relative group">
                    {user?.fullname?.charAt(0).toUpperCase() || 'U'}
                    <button
                        onClick={() => { setNewName(user?.fullname || ''); setEditMode(true); }}
                        className="absolute bottom-0 right-0 bg-white text-black p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit size={14} />
                    </button>
                </div>

                <h1 className="text-xl font-bold">{user?.fullname || 'User'}</h1>

                <div className="flex items-center justify-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getRoleBadgeColor(user?.role || 'Staff')}`}>
                        {user?.role || 'Staff'}
                    </span>
                    {!user?.is_approved && (
                        <span className="text-xs px-2 py-1 rounded-full border border-warning/30 bg-warning/10 text-warning">
                            Menunggu Approval
                        </span>
                    )}
                </div>
                <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-dark-card p-4 rounded-xl border border-white/5 text-center hover:border-white/10 transition-colors">
                    <h3 className="text-2xl font-bold">{totalReports}</h3>
                    <p className="text-xs text-gray-400">Total Laporan</p>
                </div>
                <div className="bg-dark-card p-4 rounded-xl border border-white/5 text-center hover:border-white/10 transition-colors">
                    <h3 className="text-2xl font-bold text-success">
                        {completedTasksCount}
                    </h3>
                    <p className="text-xs text-gray-400">Pekerjaan Selesai</p>
                </div>
            </div>

            {/* Menu Options */}
            <div className="space-y-3">
                {deferredPrompt && (
                    <button
                        onClick={handleInstall}
                        className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-primary to-purple-600 rounded-xl text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform animate-in slide-in-from-left"
                    >
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Download size={20} />
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="font-bold text-sm">Install Aplikasi</h4>
                            <p className="text-xs text-white/80">Tambahkan ke Layar Utama</p>
                        </div>
                        <ChevronRight size={16} />
                    </button>
                )}
                <MenuItem icon={User} label="Edit Profil" onClick={() => { setNewName(user?.fullname || ''); setEditMode(true); }} />
                <MenuItem icon={Bell} label="Notifikasi" badge={Object.values(notifSettings).filter(Boolean).length > 0 ? "ON" : "OFF"} onClick={() => setShowSettings(true)} />
                <MenuItem icon={Shield} label="Status Akun" subtitle={user?.is_approved ? 'Aktif' : 'Menunggu Approval'} onClick={() => { }} />
                <MenuItem icon={Download} label="Download Data Offline" subtitle="CSV Export" onClick={handleExportCSV} />
                <MenuItem
                    icon={darkMode ? Moon : Sun}
                    label="Mode Gelap"
                    toggle
                    checked={darkMode}
                    onClick={() => setDarkMode(!darkMode)}
                />
                <MenuItem icon={Settings} label="Pengaturan Aplikasi" onClick={() => setShowSettings(true)} />

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-4 mt-6 bg-danger/10 border border-danger/20 rounded-xl text-danger hover:bg-danger/20 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Keluar Akun</span>
                </button>
            </div>

            {/* Edit Profile Modal */}
            {editMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-dark-card w-full max-w-sm rounded-2xl border border-white/10 p-5 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg">Edit Profil</h3>
                            <button onClick={() => setEditMode(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Nama Lengkap</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button onClick={() => setEditMode(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors">Batal</button>
                            <button
                                onClick={handleEditProfile}
                                disabled={isSaving}
                                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {isSaving ? 'Menyimpan...' : <><Save size={16} /> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-dark-card w-full max-w-sm rounded-2xl border border-white/10 p-5 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg">Pengaturan</h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <span className="text-sm">Notifikasi Email</span>
                                <Toggle checked={notifSettings.email} onChange={() => toggleNotif('email')} />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <span className="text-sm">Notifikasi WhatsApp</span>
                                <Toggle checked={notifSettings.wa} onChange={() => toggleNotif('wa')} />
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl">
                                <p className="text-xs text-gray-400 mb-2">Versi Aplikasi</p>
                                <p className="text-sm font-mono">v1.2.0 (Build 2026.02.04)</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button onClick={() => setShowSettings(false)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface MenuItemProps {
    icon: React.ComponentType<{ size: number }>;
    label: string;
    subtitle?: string;
    badge?: string;
    toggle?: boolean;
    checked?: boolean;
    onClick: () => void;
}

function MenuItem({ icon: Icon, label, subtitle, badge, toggle, checked, onClick }: MenuItemProps) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 bg-dark-card border border-white/5 rounded-xl hover:bg-white/5 transition-colors active:scale-95 duration-200 group"
        >
            <div className="p-2 bg-white/5 rounded-lg text-gray-300 group-hover:text-white group-hover:bg-white/10 transition-colors">
                <Icon size={20} />
            </div>
            <div className="flex-1 text-left">
                <h4 className="font-medium text-sm text-gray-200 group-hover:text-white">{label}</h4>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
            {badge && (
                <span className="bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
            {toggle ? (
                <Toggle checked={checked} readOnly />
            ) : (
                <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
            )}
        </button>
    )
}

interface ToggleProps {
    checked?: boolean;
    onChange?: () => void;
    readOnly?: boolean;
}

function Toggle({ checked, onChange, readOnly }: ToggleProps) {
    return (
        <div
            className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-gray-600'}`}
            onClick={e => {
                if (readOnly) return;
                e.stopPropagation();
                onChange && onChange();
            }}
        >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${checked ? 'left-6' : 'left-1'}`}></div>
        </div>
    )
}
