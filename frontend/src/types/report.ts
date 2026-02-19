export interface MetricSet {
    today: number;
    prev: number;
    delta?: number;
    total?: number;
}

export interface MediaMetricDetail {
    impressions: MetricSet;
    clicks: MetricSet;
    spend: MetricSet;
    views?: MetricSet;
}

export interface MediaComparison {
    name: string;
    metrics: MediaMetricDetail;
}

export interface OverallStats {
    impressions: MetricSet;
    clicks: MetricSet;
    spend: MetricSet;
    views?: MetricSet;
}

export interface AnalysisResponse {
    id?: string;
    date: string;
    prevDate: string;
    mediaComparison: MediaComparison[];
    creativeComparison?: MediaComparison[];
    overall: OverallStats;
    budgetTotal?: number;
    totalSpend?: number;
    budgetAchievement?: number;
    mediaBudgetMap?: Record<string, number>;
    insight?: string;
    insight_summary?: string;
    error?: string;
    campaignName?: string;
    advertiser?: string;
    brandColor?: string;
}

export interface AnalysisRequest {
    raw_rows: any[];
    mix_rows: any[];
    mappings: {
        raw_mapping: {
            date_col?: string;
            media_col?: string;
            creative_col?: string;
            imp_col?: string;
            click_col?: string;
            cost_col?: string;
            view_col?: string;
            advertiser_col?: string;
        };
    };
}

export interface AnalysisEvent {
    type: 'analysis_started' | 'data_processed' | 'analysis_completed' | 'analysis_error';
    data: any;
}
