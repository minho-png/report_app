import { AnalysisResponse } from '../types/report';

const STORAGE_KEY = 'report_history';

export class ReportRepository {
    static getAll(): AnalysisResponse[] {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    static save(report: AnalysisResponse): void {
        const history = this.getAll();
        const updated = [report, ...history.filter(r => r.id !== report.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 50))); // Keep last 50
    }

    static delete(id: string): void {
        const history = this.getAll();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history.filter(r => r.id !== id)));
    }

    static getById(id: string): AnalysisResponse | undefined {
        return this.getAll().find(r => r.id === id);
    }
}
