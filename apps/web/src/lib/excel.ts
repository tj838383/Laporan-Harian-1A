import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export const exportToExcel = (data: any[], fileName: string) => {
    // 1. Format Data for Excel
    const formattedData = data.map((item) => {
        // Flatten tasks if array
        const tasksSummary = Array.isArray(item.tasks)
            ? item.tasks.map((t: any) => `- ${t.description} (${t.volume} ${t.unit})`).join('\n')
            : '';

        const materialsSummary = Array.isArray(item.materials)
            ? item.materials.map((m: any) => `- ${m.item_name}: ${m.quantity} ${m.unit}`).join('\n')
            : '';

        return {
            'ID Report': item.id,
            'Tanggal': format(new Date(item.created_at), 'dd MMMM yyyy', { locale: localeId }),
            'Nama Pelapor': item.creator?.fullname || 'Unknown',
            'Lokasi': item.location?.location_name || '-',
            'Bagian/Unit': item.department?.dept_name || '-',
            'Proyek': item.project_type?.project_name || '-',
            'Status': item.status,
            'Pekerjaan': tasksSummary,
            'Material': materialsSummary,
            'Rencana Besok': item.tomorrow_plans?.map((p: any) => `- ${p.description}`).join('\n') || '',
            'Catatan Penting': item.important_notes || '',
            'Disetujui SPV': item.approved_by_spv ? 'Ya' : 'Belum',
            'Disetujui Manager': item.approved_by_manager ? 'Ya' : 'Belum',
        };
    });

    // 2. Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 3. Auto-width columns (Simple approximation)
    const wscols = [
        { wch: 10 }, // ID
        { wch: 15 }, // Date
        { wch: 20 }, // Name
        { wch: 15 }, // Loc
        { wch: 15 }, // Dept
        { wch: 15 }, // Proj
        { wch: 10 }, // Status
        { wch: 40 }, // Tasks
        { wch: 30 }, // Materials
        { wch: 30 }, // Plans
        { wch: 20 }, // Notes
        { wch: 10 }, // SPV
        { wch: 10 }, // Mgr
    ];
    worksheet['!cols'] = wscols;

    // 4. Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');

    // 5. Download File
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
