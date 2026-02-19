from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalysisRequest(BaseModel):
    raw_rows: List[Dict[str, Any]]
    mix_rows: List[Dict[str, Any]]
    mappings: Dict[str, Any]

class MetricSet(BaseModel):
    today: float
    prev: float
    delta: Optional[float] = None
    total: Optional[float] = 0

class MediaMetricDetail(BaseModel):
    impressions: MetricSet
    clicks: MetricSet
    spend: MetricSet

class MediaComparison(BaseModel):
    name: str
    metrics: MediaMetricDetail

class OverallStats(BaseModel):
    impressions: MetricSet
    clicks: MetricSet
    spend: MetricSet

class AnalysisResponse(BaseModel):
    date: str
    prevDate: str
    mediaComparison: List[MediaComparison]
    overall: OverallStats
    budgetTotal: Optional[float] = 0
    budgetAchievement: Optional[float] = 0
    mediaBudgetMap: Optional[Dict[str, float]] = {}
    insight: Optional[str] = None
    insight_summary: Optional[str] = None
    error: Optional[str] = None
    advertiser: Optional[str] = None
    id: Optional[str] = None
    # Raw data for download/re-analysis, usually loaded separately or attached
    raw_data: Optional[Dict[str, Any]] = None
