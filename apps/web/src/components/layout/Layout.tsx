import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
    const location = useLocation();
    const isDetailPage = location.pathname.startsWith('/report/') || location.pathname === '/create';

    return (
        <div className="min-h-screen bg-dark text-gray-100 font-sans">
            <div className="max-w-md mx-auto min-h-screen bg-dark relative shadow-2xl overflow-hidden">
                {/* Main Content Area */}
                <main className={`min-h-screen overflow-y-auto ${isDetailPage ? 'pb-0' : 'pb-20'}`}>
                    <Outlet />
                    <div className="text-center py-6 text-xs text-gray-500 opacity-50 print:hidden">
                        Dari Tj & Co Untuk AQL
                    </div>
                </main>

                {/* Navigation - Hide on detail pages */}
                {!isDetailPage && <BottomNav />}
            </div>
        </div>
    );
}
