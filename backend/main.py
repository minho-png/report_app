import pandas as pd
<<<<<<< HEAD
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()

# CORS 설정: origins에 프론트엔드 주소를 명시적으로 추가하여 안정성을 높입니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    raw_rows: List[Dict[str, Any]]
    mix_rows: List[Dict[str, Any]]
    mappings: Dict[str, Any]

@app.post("/analyze")
async def analyze_data(req: AnalysisRequest):
    try:
        raw_df = pd.DataFrame(req.raw_rows)
        mix_df = pd.DataFrame(req.mix_rows)
        r_map = req.mappings.get('raw_mapping')
        m_map = req.mappings.get('mix_mapping')

        if not r_map or not m_map:
            raise HTTPException(status_code=400, detail="매핑 정보가 부족합니다.")

        # 예산 데이터 매핑
        budgets = {}
        for _, row in mix_df.iterrows():
            name = str(row.get(m_map['media_name_col'], '')).strip()
            val = pd.to_numeric(str(row.get(m_map['budget_col'], '0')).replace(',', ''), errors='coerce') or 0
            if name:
                budgets[name] = val

        # 날짜 및 성과 계산 로직
        raw_df[r_map['date_col']] = pd.to_datetime(raw_df[r_map['date_col']])
        dates = sorted(raw_df[r_map['date_col']].unique(), reverse=True)
        if len(dates) < 2:
            return {"error": "비교할 전일 데이터가 부족합니다."}
        
        t_date, p_date = dates[0], dates[1]
        
        # ... (이후 성과 집계 로직 동일) ...
        # 결과를 반환할 때 날짜를 문자열로 변환하여 JSON 오류를 방지합니다.
        return {
            "date": t_date.strftime('%Y-%m-%d'),
            "prevDate": p_date.strftime('%Y-%m-%d'),
            "mediaComparison": [], # 계산된 리스트
            "overall": {}          # 계산된 요약
        }
    except Exception as e:
        # 서버 에러 발생 시 상세 내용을 반환하여 500 에러 원인을 파악합니다.
        raise HTTPException(status_code=500, detail=str(e))
=======
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import io

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def find_col(columns, keywords):
    """키워드 리스트 중 컬럼명에 포함된 첫 번째 컬럼 반환"""
    for col in columns:
        if any(k in str(col) for k in keywords):
            return col
    return None

@app.post("/analyze")
async def analyze_excel(file: UploadFile = File(...)):
    contents = await file.read()
    excel = pd.ExcelFile(io.BytesIO(contents))
    
    # 1. RAW 데이터 시트 찾기
    raw_sheet = next((s for s in excel.sheet_names if 'raw' in s.lower()), excel.sheet_names[-1])
    df = excel.parse(raw_sheet)
    df.columns = [str(c).strip() for c in df.columns]

    # 2. 필수 컬럼 자동 매핑
    date_col = find_col(df.columns, ['날짜', 'Date'])
    media_col = find_col(df.columns, ['매체', 'Media', 'Platform'])
    creative_col = find_col(df.columns, ['소재', 'Creative', 'Content']) # 소재 컬럼 유무 확인
    imp_col = find_col(df.columns, ['노출', 'Imp'])
    clk_col = find_col(df.columns, ['클릭', 'Click'])
    cost_col = find_col(df.columns, ['금액', 'Cost', 'Spend'])

    # 날짜 형식 변환 및 정렬
    df[date_col] = pd.to_datetime(df[date_col])
    all_dates = sorted(df[date_col].unique(), reverse=True)
    
    if len(all_dates) < 2:
        return {"error": "비교할 전일 데이터가 부족합니다."}

    target_date = all_dates[0]
    prev_date = all_dates[1]

    # 3. 데이터 요약 함수 (매체/소재별)
    def get_comparison(groupby_col):
        if not groupby_col: return []
        
        # 해당일 및 전일 데이터 필터링
        filtered = df[df[date_col].isin([target_date, prev_date])]
        summary = filtered.groupby([date_col, groupby_col]).agg({
            imp_col: 'sum', clk_col: 'sum', cost_col: 'sum'
        }).reset_index()

        comparison = []
        for name in summary[groupby_col].unique():
            today_row = summary[(summary[groupby_col] == name) & (summary[date_col] == target_date)]
            prev_row = summary[(summary[groupby_col] == name) & (summary[date_col] == prev_date)]
            
            t_imp = int(today_row[imp_col].sum())
            p_imp = int(prev_row[imp_col].sum())
            t_clk = int(today_row[clk_col].sum())
            p_clk = int(prev_row[clk_col].sum())
            t_cost = int(today_row[cost_col].sum())
            p_cost = int(prev_row[cost_col].sum())

            comparison.append({
                "name": name,
                "metrics": {
                    "impressions": {"today": t_imp, "prev": p_imp, "delta": round(((t_imp-p_imp)/p_imp*100),1) if p_imp else 0},
                    "clicks": {"today": t_clk, "prev": p_clk, "delta": round(((t_clk-p_clk)/p_clk*100),1) if p_clk else 0},
                    "spend": {"today": t_cost, "prev": p_cost, "delta": round(((t_cost-p_cost)/p_cost*100),1) if p_cost else 0}
                }
            })
        return comparison

    return {
        "date": target_date.strftime('%Y-%m-%d'),
        "prevDate": prev_date.strftime('%Y-%m-%d'),
        "mediaComparison": get_comparison(media_col),
        "creativeComparison": get_comparison(creative_col) if creative_col else None,
        "overall": {
            "impressions": {"today": int(df[df[date_col]==target_date][imp_col].sum()), "prev": int(df[df[date_col]==prev_date][imp_col].sum())},
            "clicks": {"today": int(df[df[date_col]==target_date][clk_col].sum()), "prev": int(df[df[date_col]==prev_date][clk_col].sum())},
            "spend": {"today": int(df[df[date_col]==target_date][cost_col].sum()), "prev": int(df[df[date_col]==prev_date][cost_col].sum())}
        }
    }
>>>>>>> e3ed5bec679515fda425b8b373b53aac10cdbb8d
