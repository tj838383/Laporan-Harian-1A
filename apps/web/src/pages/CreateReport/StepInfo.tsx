import type { StepInfoProps } from './types';

export function StepInfo({
    locations,
    departments,
    projectTypes,
    locationId,
    setLocationId,
    deptId,
    setDeptId,
    projectTypeId,
    setProjectTypeId,
    showProjectField,
}: StepInfoProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                    📍 Kantor <span className="text-danger">*</span>
                </label>
                <select
                    className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-primary"
                    value={locationId || ''}
                    onChange={(e) => setLocationId(Number(e.target.value))}
                >
                    <option value="" disabled className="bg-dark-card">
                        Pilih Kantor...
                    </option>
                    {locations.map((loc) => (
                        <option key={loc.id} value={loc.id} className="bg-dark-card text-white">
                            {loc.location_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                    🏢 Bagian / Unit <span className="text-danger">*</span>
                </label>
                <select
                    className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-primary"
                    value={deptId || ''}
                    onChange={(e) => setDeptId(Number(e.target.value))}
                >
                    <option value="" disabled className="bg-dark-card">
                        Pilih Bagian / Unit...
                    </option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.id} className="bg-dark-card text-white">
                            {dept.dept_name}
                        </option>
                    ))}
                </select>
            </div>

            {showProjectField && (
                <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <label className="text-sm font-medium text-gray-300">
                        📁 Detail Proyek <span className="text-danger">*</span>
                    </label>
                    <select
                        className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-white appearance-none focus:outline-none focus:border-primary"
                        value={projectTypeId || ''}
                        onChange={(e) => setProjectTypeId(Number(e.target.value))}
                    >
                        <option value="" disabled className="bg-dark-card">
                            Pilih Proyek...
                        </option>
                        {projectTypes.map((proj) => (
                            <option key={proj.id} value={proj.id} className="bg-dark-card text-white">
                                {proj.project_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                    📅 Tanggal Laporan
                </label>
                <div className="w-full bg-dark-card border border-white/10 rounded-xl p-4 text-gray-400">
                    {new Date().toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </div>
            </div>
        </div>
    );
}
