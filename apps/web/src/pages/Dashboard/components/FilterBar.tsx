import { Filter } from 'lucide-react';
import type { Location, Department } from '../../../lib/database.types';
import type { DateFilter } from '../types';

interface FilterBarProps {
    locations: Location[];
    departments: Department[];
    filterLoc: number | 'all';
    filterDept: number | 'all';
    filterDate: DateFilter;
    setFilterLoc: (loc: number | 'all') => void;
    setFilterDept: (dept: number | 'all') => void;
    setFilterDate: (date: DateFilter) => void;
}

export function FilterBar({
    locations,
    departments,
    filterLoc,
    filterDept,
    filterDate,
    setFilterLoc,
    setFilterDept,
    setFilterDate
}: FilterBarProps) {
    return (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {/* Location Filter */}
            <div className="relative">
                <select
                    value={filterLoc}
                    onChange={(e) => setFilterLoc(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="appearance-none pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-white cursor-pointer"
                >
                    <option value="all" className="bg-dark-card">Semua Kantor</option>
                    {locations.map(loc => (
                        <option key={loc.id} value={loc.id} className="bg-dark-card">{loc.location_name}</option>
                    ))}
                </select>
                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Dept Filter */}
            <div className="relative">
                <select
                    value={filterDept}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'all') setFilterDept('all');
                        else setFilterDept(Number(val));
                    }}
                    className="appearance-none pl-4 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-white cursor-pointer"
                >
                    <option value="all" className="bg-dark-card">Semua Bagian / Unit</option>
                    {departments.map(dept => (
                        <option key={dept.id} value={dept.id} className="bg-dark-card">{dept.dept_name}</option>
                    ))}
                </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
                <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value as DateFilter)}
                    className="appearance-none pl-4 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary text-white cursor-pointer text-center"
                >
                    <option value="today" className="bg-dark-card">Hari Ini</option>
                    <option value="week" className="bg-dark-card">Minggu Ini</option>
                    <option value="month" className="bg-dark-card">Bulan Ini</option>
                    <option value="all" className="bg-dark-card">Semua Tanggal</option>
                </select>
            </div>
        </div>
    );
}
