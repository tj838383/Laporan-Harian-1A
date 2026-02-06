// Type definitions for CreateReport components

export type Attachment = {
    id: string;
    type: 'image' | 'document' | 'link';
    url: string;
    name: string;
};

export type Task = {
    id: string;
    description: string;
    responsible_person: string;
    status: 'Selesai' | 'Dalam Proses' | 'Bermasalah';
    attachments: Attachment[];
};

export type Material = {
    id: string;
    item_name: string;
    quantity: number;
    unit: string;
};

export type TomorrowPlan = {
    id: string;
    description: string;
    responsible_person: string;
};

export type Location = {
    id: number;
    location_name: string;
};

export type Department = {
    id: number;
    dept_name: string;
};

export type ProjectType = {
    id: number;
    project_name: string;
};

// Props interfaces for step components
export interface StepInfoProps {
    locations: Location[];
    departments: Department[];
    projectTypes: ProjectType[];
    locationId: number | null;
    setLocationId: (id: number) => void;
    deptId: number | null;
    setDeptId: (id: number) => void;
    projectTypeId: number | null;
    setProjectTypeId: (id: number) => void;
    showProjectField: boolean;
}

export interface StepTasksProps {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export interface StepMaterialsProps {
    materials: Material[];
    setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
}

export interface StepFinalProps {
    tomorrowPlans: TomorrowPlan[];
    setTomorrowPlans: React.Dispatch<React.SetStateAction<TomorrowPlan[]>>;
    importantNotes: string;
    setImportantNotes: (notes: string) => void;
}
