import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="bg-danger text-white px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
            <WifiOff size={14} />
            <span>Anda sedang offline. Beberapa fitur mungkin terbatas.</span>
        </div>
    );
}
