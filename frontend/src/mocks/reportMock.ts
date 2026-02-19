import { AnalysisResponse } from "../types/report";

export const mockReportData: AnalysisResponse = {
    date: "2025-12-31",
    prevDate: "2024-12-31",
    advertiser: "동국제약",
    brandColor: "#005835",
    budgetTotal: 150000000,
    totalSpend: 152000000,
    budgetAchievement: 101.3,
    overall: {
        impressions: { today: 1972155, prev: 1850000, total: 35000000 },
        clicks: { today: 15400, prev: 14200, total: 280000 },
        spend: { today: 5000000, prev: 4800000, total: 152000000 },
        views: { today: 1943709, prev: 1800000, total: 34000000 }
    },
    mediaComparison: [
        {
            name: "QTONE",
            metrics: {
                impressions: { today: 1074824, prev: 980000, delta: 9.6, total: 18000000 },
                clicks: { today: 8500, prev: 7800, total: 150000 },
                spend: { today: 2800000, prev: 2600000, total: 80000000 },
                views: { today: 1050000, prev: 950000, total: 17500000 }
            }
        },
        {
            name: "ADDRESSABLE",
            metrics: {
                impressions: { today: 431872, prev: 450000, delta: -4.0, total: 8500000 },
                clicks: { today: 3200, prev: 3500, total: 65000 },
                spend: { today: 1200000, prev: 1300000, total: 40000000 },
                views: { today: 420000, prev: 440000, total: 8300000 }
            }
        },
        {
            name: "FAST",
            metrics: {
                impressions: { today: 465459, prev: 420000, delta: 10.8, total: 8500000 },
                clicks: { today: 3700, prev: 2900, total: 65000 },
                spend: { today: 1000000, prev: 900000, total: 32000000 },
                views: { today: 473709, prev: 410000, total: 8200000 }
            }
        }
    ],
    creativeComparison: [
        {
            name: "아침이 다릅니다 (15s)",
            metrics: {
                impressions: { today: 1972155, prev: 1850000, delta: 6.6, total: 35000000 },
                clicks: { today: 15400, prev: 14200, total: 280000 },
                spend: { today: 5000000, prev: 4800000, total: 152000000 },
                views: { today: 1943709, prev: 1800000, total: 34000000 }
            }
        }
    ],
    insight: "크로스타겟TV는 1,801,361명의 정교한 타겟팅 모수를 기반으로 캠페인을 집행했습니다.\n특히, 전립선 비대증 유병률이 높은 55세 이상 남성만을 핵심 타겟으로 설정하여 유효 도달을 극대화했습니다.\n그 결과 순 시청자 352,939명에게 평균 5.6회 반복 노출되며 강력한 브랜드 각인 효과를 달성했습니다.",
    insight_summary: "• 정교한 타겟팅(180만 모수)을 통한 효율적인 캠페인 집행 완료\n• 고유병률 타겟(M55+) 집중 공략으로 유효 도달 및 브랜드 각인 극대화\n• 평균 노출 5.6회 달성으로 실질적인 광고 인지도 및 성과 확보"
};
