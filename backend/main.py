import pandas as pd
import re
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

# 로그 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    raw_rows: List[Dict[str, Any]]
    mix_rows: List[Dict[str, Any]]
    mappings: Dict[str, Any]

def clean_numeric(series, name="column"):
    """사람이 보기 쉬운 형태(1,234, ₩500)를 숫자로 변환하며 로그 출력"""
    def _parse(val):
        if pd.isna(val) or val == '': return 0
        if isinstance(val, (int, float)): return val
        cleaned = re.sub(r'[^\d.]', '', str(val))
        try:
            return float(cleaned) if '.' in cleaned else int(cleaned)
        except:
            return 0
    
    result = series.apply(_parse)
    logger.info(f"[Data Cleaning] {name}: 변환 완료 (샘플: {result.iloc[0] if not result.empty else 'N/A'})")
    return result

@app.post("/analyze")
async def analyze_data(req: AnalysisRequest):
    logger.info("=== 백엔드 분석 시작 ===")
    try:
        raw_df = pd.DataFrame(req.raw_rows)
        r_map = req.mappings.get('raw_mapping')
        
        if not r_map:
            logger.error("매핑 정보가 전달되지 않았습니다.")
            raise HTTPException(status_code=400, detail="매핑 정보 누락")

        logger.info(f"전달된 컬럼 매핑: {r_map}")

        # 데이터 정제 및 변환
        date_col = r_map['date_col']
        raw_df[date_col] = pd.to_datetime(raw_df[date_col], errors='coerce')
        raw_df = raw_df.dropna(subset=[date_col])
        logger.info(f"유효한 데이터 행 수: {len(raw_df)}")

        raw_df[r_map['imp_col']] = clean_numeric(raw_df[r_map['imp_col']], "노출량")
        raw_df[r_map['cost_col']] = clean_numeric(raw_df[r_map['cost_col']], "집행금액")
        
        if r_map.get('click_col'):
            raw_df[r_map['click_col']] = clean_numeric(raw_df[r_map['click_col']], "클릭수")

        # 날짜 추출
        dates = sorted(raw_df[date_col].unique(), reverse=True)
        if len(dates) < 2:
            logger.warning("날짜 데이터 부족")
            return {"error": "비교 분석을 위해 최소 2일 이상의 데이터가 필요합니다."}
        
        t_date, p_date = dates[0], dates[1]
        logger.info(f"분석 날짜: 기준일({t_date}), 비교일({p_date})")

        def get_stats(df, target_date):
            day_df = df[df[date_col] == target_date]
            return {
                "impressions": int(day_df[r_map['imp_col']].sum()),
                "clicks": int(day_df[r_map['click_col']].sum()) if r_map.get('click_col') else 0,
                "spend": int(day_df[r_map['cost_col']].sum())
            }

        overall_today = get_stats(raw_df, t_date)
        overall_prev = get_stats(raw_df, p_date)
        logger.info(f"전체 집계 완료: {overall_today['impressions']} 노출")

        # 매체별 비교
        media_comparison = []
        for media in raw_df[r_map['media_col']].unique():
            m_df = raw_df[raw_df[r_map['media_col']] == media]
            t_stats = get_stats(m_df, t_date)
            p_stats = get_stats(m_df, p_date)
            
            p_imp = p_stats['impressions']
            delta = round(((t_stats['impressions'] - p_imp) / p_imp * 100), 1) if p_imp > 0 else 0
            
            media_comparison.append({
                "name": str(media),
                "metrics": {
                    "impressions": {"today": t_stats['impressions'], "prev": p_imp, "delta": delta}
                }
            })

        logger.info("=== 백엔드 분석 성공 ===")
        return {
            "date": t_date.strftime('%Y-%m-%d'),
            "prevDate": p_date.strftime('%Y-%m-%d'),
            "mediaComparison": media_comparison,
            "overall": {
                "impressions": {"today": overall_today['impressions'], "prev": overall_prev['impressions']},
                "clicks": {"today": overall_today['clicks'], "prev": overall_prev['clicks']},
                "spend": {"today": overall_today['spend'], "prev": overall_prev['spend']}
            }
        }
    except Exception as e:
        logger.error(f"백엔드 에러 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))