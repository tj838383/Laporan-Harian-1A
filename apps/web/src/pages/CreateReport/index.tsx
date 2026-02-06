import { ChevronLeft, Loader2 } from 'lucide-react';
import { useCreateReport } from './hooks/useCreateReport';
import { StepInfo } from './StepInfo';
import { StepTasks } from './StepTasks';
import { StepMaterials } from './StepMaterials';
import { StepFinal } from './StepFinal';

export function CreateReportPage() {
    const {
        step,
        setStep,
        navigate,
        isSubmitting,
        handleSubmit,
        isLoadingData,
        // Form data
        locationId,
        setLocationId,
        deptId,
        setDeptId,
        projectTypeId,
        setProjectTypeId,
        tasks,
        setTasks,
        materials,
        setMaterials,
        tomorrowPlans,
        setTomorrowPlans,
        importantNotes,
        setImportantNotes,
        // Master data
        locations,
        departments,
        projectTypes,
        showProjectField,
    } = useCreateReport();

    if (isLoadingData) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 pb-24">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 -ml-2 text-gray-400"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg">Buat Laporan</h1>
                <div className="w-8" />
            </header>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Step {step} dari 4</span>
                    <span>
                        {step === 1
                            ? 'Info Dasar'
                            : step === 2
                                ? 'Daftar Pekerjaan'
                                : step === 3
                                    ? 'Material'
                                    : 'Finalisasi'}
                    </span>
                </div>
                <div className="h-2 bg-dark-card rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
            </div>

            {/* Content Steps */}
            <div className="min-h-[400px]">
                {step === 1 && (
                    <StepInfo
                        locations={locations}
                        departments={departments}
                        projectTypes={projectTypes}
                        locationId={locationId}
                        setLocationId={setLocationId}
                        deptId={deptId}
                        setDeptId={setDeptId}
                        projectTypeId={projectTypeId}
                        setProjectTypeId={setProjectTypeId}
                        showProjectField={showProjectField}
                    />
                )}
                {step === 2 && <StepTasks tasks={tasks} setTasks={setTasks} />}
                {step === 3 && (
                    <StepMaterials materials={materials} setMaterials={setMaterials} />
                )}
                {step === 4 && (
                    <StepFinal
                        tomorrowPlans={tomorrowPlans}
                        setTomorrowPlans={setTomorrowPlans}
                        importantNotes={importantNotes}
                        setImportantNotes={setImportantNotes}
                    />
                )}
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-dark/95 backdrop-blur-sm z-50">
                <div className="max-w-md mx-auto flex gap-4">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="flex-1 py-3 px-4 rounded-xl border border-white/10 font-medium active:scale-95 transition-transform"
                        >
                            Kembali
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() =>
                            step < 4 ? setStep((s) => s + 1) : handleSubmit()
                        }
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/25 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Mengirim...</span>
                            </>
                        ) : (
                            <span>{step === 4 ? 'Kirim Laporan' : 'Selanjutnya'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateReportPage;
