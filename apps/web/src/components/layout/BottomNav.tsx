import { Home, PlusSquare, ClipboardList, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function BottomNav() {
    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: PlusSquare, label: 'Laporan', path: '/create' },
        { icon: ClipboardList, label: 'Riwayat', path: '/history' },
        { icon: User, label: 'Profil', path: '/profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-card/90 backdrop-blur-md border-t border-white/10 pb-safe">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map(({ icon: Icon, label, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center w-full h-full transition-colors duration-200",
                                isActive ? "text-primary" : "text-gray-400 hover:text-gray-200"
                            )
                        }
                    >
                        <Icon size={24} strokeWidth={2} />
                        <span className="text-[10px] mt-1 font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
