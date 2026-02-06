import type { DailyReport, ReportTask, ReportMaterial, ReportTomorrowPlan, ReportTaskAttachment } from '../../lib/database.types';

// Extended Report type with joined relations
export interface ReportWithRelations extends DailyReport {
    location: { location_name: string } | null;
    department: { dept_name: string } | null;
    project_type: { project_name: string } | null;
    creator: { fullname: string; role: string; avatar_url: string | null } | null;
    spv: { fullname: string } | null;
    manager: { fullname: string } | null;
}

// Task with nested attachments
export interface TaskWithAttachments extends ReportTask {
    attachments: ReportTaskAttachment[] | null;
}

// Re-export types for convenience
export type { ReportMaterial, ReportTomorrowPlan };

// Hook return type
export interface UseReportDetailReturn {
    // Data
    report: ReportWithRelations | null;
    tasks: TaskWithAttachments[];
    materials: ReportMaterial[];
    tomorrowPlans: ReportTomorrowPlan[];

    // State
    isLoading: boolean;
    isVerifying: boolean;
    errorMsg: string;
    showShareMenu: boolean;
    setShowShareMenu: (show: boolean) => void;

    // Actions
    handleVerify: () => Promise<void>;
    getReportSummary: () => string;
    handlePrint: () => void;
    handleShareWA: () => void;
    handleShareEmail: () => void;
    handleCopy: () => void;
    canVerify: boolean;
}
