import { Search } from 'lucide-react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
                type="text"
                placeholder="Cari kantor, bagian/unit, proyek, atau nama..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-dark-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary text-white placeholder-gray-500 transition-colors"
            />
        </div>
    );
}
