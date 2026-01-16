/**
 * 리포트 데이터 타입 정의
 * path: src/types/report.ts
 */
export interface DailyKPI {
    metric: string;
    value: number;
    unit: string;
    dod: number; // 전일 대비
    wow: number; // 전주 대비
    status: 'good' | 'bad' | 'neutral';
  }
  
  export interface MediaPerformance {
    name: string;
    spend: number;
    roas: number;
    cpa: number;
    conversion: number;
    roasChange: number;
  }
  
  export interface CreativePerformance {
    type: 'BEST' | 'WORST';
    name: string;
    roas: number;
    ctr: number;
    reason: string;
  }
  
  export interface DailyReportData {
    type: 'DAILY_REPORT';
    date: string;
    summary: string;
    kpis: DailyKPI[];
    mediaMix: MediaPerformance[];
    creatives: CreativePerformance[];
  }