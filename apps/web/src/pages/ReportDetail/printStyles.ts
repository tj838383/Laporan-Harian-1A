export const printStyles = `
@media print {
    @page { size: A4; margin: 0.4cm; }
    html, body, #root { width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
    
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    
    .max-w-7xl, .max-w-5xl, .container, div[class*="max-w-"] { 
        max-width: none !important; 
        width: 100% !important; 
        margin: 0 !important; 
        padding: 0 !important;
    }

    body { background: white; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    
    .bg-dark {
        background: transparent !important;
        color: black !important;
        border: none !important;
        padding: 0 !important;
    }

    .bg-dark-card { 
        background: transparent !important; 
        color: black !important; 
        border: none !important; 
        box-shadow: none !important; 
        border-radius: 0 !important;
        padding: 0 !important;
        margin-bottom: 0.5cm !important;
        page-break-inside: avoid;
    }

    #print-container {
        border: 1px solid #000 !important;
        border-radius: 8px !important;
        padding: 0.3cm !important;
        margin-top: 0 !important;
    }
    
    .text-gray-200, .text-gray-300, .text-gray-400, .text-gray-500, .text-gray-600 { 
        color: #000 !important; 
    }
    
    .bg-dark-card h3 {
        border-bottom: 1px solid #000 !important;
        padding-bottom: 0.2cm !important;
        margin-bottom: 0.4cm !important;
    }

    .gap-4 { gap: 1rem !important; }
    .fixed { display: none !important; }
}
`;
