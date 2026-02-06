import type { Location, Department, DailyReport } from '../../lib/database.types';

// Extended report type with relations
export interface ReportWithRelations extends DailyReport {
    creator: {
        fullname: string;
        role: string;
    } | null;
    location: {
        location_name: string;
    } | null;
    department: {
        dept_name: string;
    } | null;
    project_type: {
        project_name: string;
    } | null;
}

// Pending user for approval
export interface PendingUser {
    id: string;
    fullname: string;
    email: string;
}

// Date filter options
export type DateFilter = 'all' | 'today' | 'week' | 'month';

// Report stats from useReportStats hook
export interface ReportStats {
    total: number;
    verified: number;
    completed: number;
    inProgress: number;
    problematic: number;
    draft: number;
}

// Filter state
export interface FilterState {
    location: number | 'all';
    department: number | 'all';
    date: DateFilter;
}

// Report card props
export interface ReportCardProps {
    report: ReportWithRelations;
    onClick: () => void;
}

// Hook return type
export interface UseDashboardReturn {
    // Data
    reports: ReportWithRelations[];
    filteredReports: ReportWithRelations[];
    stats: ReportStats;
    locations: Location[];
    departments: Department[];
    pendingUsers: PendingUser[];
    selectedRoles: Record<string, string>;

    // Filter state
    filterLoc: number | 'all';
    filterDept: number | 'all';
    filterDate: DateFilter;
    searchQuery: string;
    setFilterLoc: (loc: number | 'all') => void;
    setFilterDept: (dept: number | 'all') => void;
    setFilterDate: (date: DateFilter) => void;
    setSearchQuery: (query: string) => void;

    // Actions
    handleApproveUser: (userId: string, userName: string) => void;
    handleRejectUser: (userId: string, userName: string) => void;
    setSelectedRoles: React.Dispatch<React.SetStateAction<Record<string, string>>>;

    // State
    error: string | null;
}
