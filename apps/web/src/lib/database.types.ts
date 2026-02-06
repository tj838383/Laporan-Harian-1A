// Auto-generated types - will be replaced with actual types from Supabase CLI
// For now, this provides basic type safety

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    fullname: string
                    role: 'Staff' | 'Supervisor' | 'Manager' | 'Owner'
                    is_approved: boolean
                    approved_by: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    fullname: string
                    role?: 'Staff' | 'Supervisor' | 'Manager' | 'Owner'
                    is_approved?: boolean
                    approved_by?: string | null
                    avatar_url?: string | null
                }
                Update: {
                    fullname?: string
                    role?: 'Staff' | 'Supervisor' | 'Manager' | 'Owner'
                    is_approved?: boolean
                    approved_by?: string | null
                    avatar_url?: string | null
                }
            }
            locations: {
                Row: {
                    id: number
                    location_name: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    location_name: string
                    is_active?: boolean
                }
                Update: {
                    location_name?: string
                    is_active?: boolean
                }
            }
            departments: {
                Row: {
                    id: number
                    dept_name: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    dept_name: string
                    is_active?: boolean
                }
                Update: {
                    dept_name?: string
                    is_active?: boolean
                }
            }
            project_types: {
                Row: {
                    id: number
                    project_name: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    project_name: string
                    is_active?: boolean
                }
                Update: {
                    project_name?: string
                    is_active?: boolean
                }
            }
            daily_reports: {
                Row: {
                    id: string
                    creator_id: string
                    location_id: number
                    dept_id: number
                    project_type_id: number | null
                    tomorrow_plan: string | null
                    important_notes: string | null
                    status: 'draft' | 'submitted' | 'read' | 'verified'
                    is_verified: boolean
                    verified_by: string | null
                    verified_at: string | null
                    approved_by_spv: string | null
                    approved_at_spv: string | null
                    approved_by_manager: string | null
                    approved_at_manager: string | null
                    read_by: string[]
                    footer_text: string
                    report_date: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    creator_id: string
                    location_id: number
                    dept_id: number
                    project_type_id?: number | null
                    tomorrow_plan?: string | null
                    important_notes?: string | null
                    status?: 'draft' | 'submitted' | 'read' | 'verified'
                    footer_text?: string
                    report_date?: string
                    approved_by_spv?: string | null
                    approved_at_spv?: string | null
                    approved_by_manager?: string | null
                    approved_at_manager?: string | null
                }
                Update: {
                    location_id?: number
                    dept_id?: number
                    project_type_id?: number | null
                    tomorrow_plan?: string | null
                    important_notes?: string | null
                    status?: 'draft' | 'submitted' | 'read' | 'verified'
                    is_verified?: boolean
                    verified_by?: string | null
                    verified_at?: string | null
                    approved_by_spv?: string | null
                    approved_at_spv?: string | null
                    approved_by_manager?: string | null
                    approved_at_manager?: string | null
                    read_by?: string[]
                }
            }
            report_tasks: {
                Row: {
                    id: string
                    report_id: string
                    task_description: string
                    responsible_person: string | null
                    status: 'Selesai' | 'Dalam Proses' | 'Bermasalah'
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    report_id: string
                    task_description: string
                    responsible_person?: string | null
                    status?: 'Selesai' | 'Dalam Proses' | 'Bermasalah'
                    order_index?: number
                }
                Update: {
                    task_description?: string
                    responsible_person?: string | null
                    status?: 'Selesai' | 'Dalam Proses' | 'Bermasalah'
                    order_index?: number
                }
            }
            report_materials: {
                Row: {
                    id: string
                    report_id: string
                    item_name: string
                    quantity: number
                    unit: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    report_id: string
                    item_name: string
                    quantity: number
                    unit: string
                }
                Update: {
                    item_name?: string
                    quantity?: number
                    unit?: string
                }
            }
            report_task_attachments: {
                Row: {
                    id: string
                    task_id: string
                    file_type: 'image' | 'document' | 'link'
                    file_url: string
                    file_name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    file_type: 'image' | 'document' | 'link'
                    file_url: string
                    file_name: string
                }
                Update: {
                    file_type?: 'image' | 'document' | 'link'
                    file_url?: string
                    file_name?: string
                }
            }
            report_tomorrow_plans: {
                Row: {
                    id: string
                    report_id: string
                    plan_description: string
                    responsible_person: string | null
                    order_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    report_id: string
                    plan_description: string
                    responsible_person?: string | null
                    order_index?: number
                }
                Update: {
                    plan_description?: string
                    responsible_person?: string | null
                    order_index?: number
                }
            }
        }
    }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type User = Tables<'users'>
export type Location = Tables<'locations'>
export type Department = Tables<'departments'>
export type ProjectType = Tables<'project_types'>
export type DailyReport = Tables<'daily_reports'>
export type ReportTask = Tables<'report_tasks'>
export type ReportMaterial = Tables<'report_materials'>
export type ReportTaskAttachment = Tables<'report_task_attachments'>
export type ReportTomorrowPlan = Tables<'report_tomorrow_plans'>

