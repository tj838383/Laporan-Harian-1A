import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type Notification } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleItemClick = async (n: Notification) => {
        if (!n.is_read) await markAsRead(n.id);
        if (n.link) {
            setIsOpen(false);
            navigate(n.link);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-white/5 rounded-full relative"
            >
                <Bell size={20} className="text-gray-400" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-dark" />
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-semibold">Notifikasi</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-xs text-primary hover:text-primary/80"
                                >
                                    Tandai semua dibaca
                                </button>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-xs">
                                    Belum ada notifikasi
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleItemClick(n)}
                                        className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-white/5' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-xs font-semibold ${n.type === 'error' ? 'text-danger' :
                                                n.type === 'success' ? 'text-success' :
                                                    n.type === 'warning' ? 'text-warning' : 'text-primary'
                                                }`}>
                                                {n.title}
                                            </h4>
                                            <span className="text-[10px] text-gray-500">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: localeId })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 line-clamp-2">
                                            {n.message}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
