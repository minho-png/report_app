import { AnalysisResponse } from '../types/report';

const STORAGE_KEY = 'dmp_report_history';

export interface HistoryItem {
  id: string;
  date: string;
  created_at: string;
  advertiser: string;
  brandColor?: string;
  report: AnalysisResponse;
  raw?: any; // Excel data
}

export const storageService = {
  saveReport: (report: AnalysisResponse, rawData?: any): string => {
    try {
      const history = storageService.getAll();

      const id = report.id || crypto.randomUUID();
      const newItem: HistoryItem = {
        id,
        date: report.date,
        created_at: new Date().toISOString(),
        advertiser: report.advertiser || 'Unknown',
        brandColor: report.brandColor,
        report: { ...report, id },
        raw: rawData
      };

      // Check if exists?
      const existingIndex = history.findIndex(h => h.id === id);
      if (existingIndex >= 0) {
        history[existingIndex] = newItem;
      } else {
        history.unshift(newItem); // Add to top
      }

      // Limit history size (e.g., 50 items) to prevent quota exceeded
      const limitedHistory = history.slice(0, 50);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
      return id;
    } catch (e) {
      console.error("Failed to save to localStorage", e);
      // Handle quota exceeded?
      return "";
    }
  },

  getAll: (): HistoryItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to read from localStorage", e);
      return [];
    }
  },

  getById: (id: string): HistoryItem | null => {
    const history = storageService.getAll();
    return history.find(item => item.id === id) || null;
  },

  deleteById: (id: string) => {
    const history = storageService.getAll();
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  },

  updateReport: (id: string, updatedReport: AnalysisResponse) => {
    const history = storageService.getAll();
    const index = history.findIndex(h => h.id === id);
    if (index >= 0) {
      history[index].report = updatedReport;
      history[index].report.id = id; // Ensure ID persists
      // Keep existing raw data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }
};