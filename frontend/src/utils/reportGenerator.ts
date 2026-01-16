import html2pdf from 'html2pdf.js';

/**
 * 특정 HTML 요소를 PDF로 저장합니다.
 */
export async function downloadReportAsPDF(element: HTMLElement, filename: string) {
    const options = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        // 에러 해결: 'portrait'를 리터럴 타입으로 명시
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    
    return html2pdf().set(options).from(element).save();
}