import { X, Printer, MessageCircle, Mail, Copy } from 'lucide-react';

interface ShareMenuProps {
    showShareMenu: boolean;
    setShowShareMenu: (show: boolean) => void;
    handlePrint: () => void;
    handleShareWA: () => void;
    handleShareEmail: () => void;
    handleCopy: () => void;
}

export function ShareMenu({
    showShareMenu,
    setShowShareMenu,
    handlePrint,
    handleShareWA,
    handleShareEmail,
    handleCopy
}: ShareMenuProps) {
    if (!showShareMenu) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print animate-in fade-in duration-200">
            <div className="bg-dark-card w-full max-w-sm rounded-2xl border border-white/10 p-5 space-y-4 relative animate-in slide-in-from-bottom duration-300">
                <button
                    onClick={() => setShowShareMenu(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>
                <h3 className="font-bold text-lg text-center">Bagikan Laporan</h3>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handlePrint} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                        <div className="p-3 bg-red-500/20 text-red-400 rounded-full">
                            <Printer size={24} />
                        </div>
                        <span className="text-xs font-medium">Simpan PDF</span>
                    </button>

                    <button onClick={handleShareWA} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                        <div className="p-3 bg-green-500/20 text-green-400 rounded-full">
                            <MessageCircle size={24} />
                        </div>
                        <span className="text-xs font-medium">Kirim WA</span>
                    </button>

                    <button onClick={handleShareEmail} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full">
                            <Mail size={24} />
                        </div>
                        <span className="text-xs font-medium">Email</span>
                    </button>

                    <button onClick={handleCopy} className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">
                        <div className="p-3 bg-gray-500/20 text-gray-400 rounded-full">
                            <Copy size={24} />
                        </div>
                        <span className="text-xs font-medium">Salin Teks</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
