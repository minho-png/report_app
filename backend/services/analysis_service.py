import pandas as pd
import re
import logging
from typing import List, Dict, Any
from backend.models.analysis import AnalysisRequest, AnalysisResponse
from backend.events.bus import event_bus

logger = logging.getLogger(__name__)

class AnalysisService:
    def robust_to_numeric(self, val):
        """Convert value to numeric, handling currency symbols and commas"""
        if pd.isna(val) or val == '' or str(val).strip() == '-': 
            return 0
        if isinstance(val, (int, float)): 
            # Always return as integer for cost/metrics
            return int(round(val))
        try:
            # Remove currency symbols, commas, and other non-numeric characters
            cleaned = re.sub(r'[^\d.-]', '', str(val))
            if not cleaned or cleaned == '-':
                return 0
            # Convert to float first, then round to integer for accuracy
            num_val = float(cleaned)
            return int(round(num_val))
        except: 
            return 0

    async def analyze_data(self, req: AnalysisRequest) -> Dict[str, Any]:
        await event_bus.emit("analysis_started", {"data": "Analysis process initiated"})
        
        try:
            raw_df = pd.DataFrame(req.raw_rows)
            if raw_df.empty:
                return {"error": "데이터가 비어있습니다."}

            # 1. Column Detection (AI fallback)
            from backend.services.ai_service import ai_service
            cols = list(raw_df.columns)
            ai_map = await ai_service.detect_columns(cols)
            
            # Merge provided mapping with AI detection
            r_map = req.mappings.get('raw_mapping', {})
            d_col = ai_map.get('date_col') or r_map.get('date_col')
            m_col = ai_map.get('media_col') or r_map.get('media_col')
            c_col = ai_map.get('creative_col') or r_map.get('creative_col')
            imp_col = ai_map.get('imp_col') or r_map.get('imp_col')
            cost_col = ai_map.get('cost_col') or r_map.get('cost_col')
            clk_col = ai_map.get('click_col') or r_map.get('click_col')
            v_col = ai_map.get('view_col') or r_map.get('view_col')
            adv_col = ai_map.get('advertiser_col') or r_map.get('advertiser_col', '광고주')

            # Validation: Need Date and at least one performance metric
            missing = []
            if not d_col or d_col not in raw_df.columns: missing.append("날짜")
            perf_cols = [c for c in [imp_col, cost_col, v_col] if c and c in raw_df.columns]
            if not perf_cols: missing.append("성과 지표(노출/지출/조회)")
            
            if missing:
                err_msg = f"필수 컬럼을 찾을 수 없습니다: {', '.join(missing)}"
                await event_bus.emit("analysis_error", {"error": err_msg})
                return {"error": err_msg}

            # 2. Cleaning & Strict Filtering
            # [Fix] Parse date strictly to prevent timezone shifting
            def parse_date_safe(val):
                if pd.isna(val) or val == '' or str(val).strip() == '':
                    return None
                    
                # If already a date/datetime object
                if hasattr(val, 'date'):
                    return val.date() if callable(val.date) else val
                
                # If string, try to parse
                s_val = str(val).strip()
                try:
                    # Basic string parse - avoid pd.to_datetime's timezone defaults if possible for pure dates
                    # But pd.to_datetime is robust for formats. We use it but Strip TZ immediately.
                    dt = pd.to_datetime(s_val, errors='coerce')
                    if pd.isna(dt):
                        return None
                    return dt.date()
                except:
                    return None

            raw_df[d_col] = raw_df[d_col].apply(parse_date_safe)
            raw_df = raw_df.dropna(subset=[d_col])
            
            numeric_cols = [imp_col, cost_col, clk_col, v_col]
            for col in numeric_cols:
                if col and col in raw_df.columns:
                    raw_df[col] = raw_df[col].apply(self.robust_to_numeric)

            # [New] Filter out rows where all performance metrics are 0
            # If a row has date but no impressions, clicks, spend, or views, it's invalid
            valid_perf_mask = pd.Series(False, index=raw_df.index)
            for col in numeric_cols:
                if col and col in raw_df.columns:
                    valid_perf_mask |= (raw_df[col] > 0)
            
            raw_df = raw_df[valid_perf_mask]

            # 3. Filtering & Dates
            valid_df = raw_df.copy()
            dates = sorted(valid_df[d_col].unique(), reverse=True)
            if len(dates) < 1:
                return {"error": "유효한 성과 데이터(노출/비용 등)가 있는 날짜가 없습니다."}
            
            t_date = dates[0]
            p_date = dates[1] if len(dates) > 1 else None
            
            logger.info(f"Target Date: {t_date}, Prev Date: {p_date}")
            await event_bus.emit("data_processed", {"date": str(t_date)})

            def get_stats(df, target_date):
                day_df = df[df[d_col] == target_date]
                return {
                    "impressions": int(day_df[imp_col].sum()) if imp_col else 0,
                    "clicks": int(day_df[clk_col].sum()) if clk_col else 0,
                    "spend": int(day_df[cost_col].sum()) if cost_col else 0,
                    "views": int(day_df[v_col].sum()) if v_col else 0
                }

            def get_total_stats(df):
                return {
                    "impressions": int(df[imp_col].sum()) if imp_col else 0,
                    "clicks": int(df[clk_col].sum()) if clk_col else 0,
                    "spend": int(df[cost_col].sum()) if cost_col else 0,
                    "views": int(df[v_col].sum()) if v_col else 0
                }

            overall_today = get_stats(valid_df, t_date)
            overall_prev = get_stats(valid_df, p_date) if p_date else overall_today
            overall_total = get_total_stats(valid_df)

            # 4. Multi-level Analysis (Media & Creative)
            def analyze_dimension(df, dim_col):
                if not dim_col or dim_col not in df.columns: return []
                comparison = []
                for val in df[dim_col].unique():
                    if pd.isna(val) or str(val).strip() == '': continue
                    sub_df = df[df[dim_col] == val]
                    t_s = get_stats(sub_df, t_date)
                    p_s = get_stats(sub_df, p_date) if p_date else t_s
                    tot_s = get_total_stats(sub_df)
                    
                    p_imp = p_s['impressions']
                    delta = round(((t_s['impressions'] - p_imp) / p_imp * 100), 1) if p_imp > 0 else 0
                    
                    comparison.append({
                        "name": str(val),
                        "metrics": {
                            "impressions": {"today": t_s['impressions'], "prev": p_imp, "delta": delta, "total": tot_s['impressions']},
                            "clicks": {"today": t_s['clicks'], "prev": p_s['clicks'], "total": tot_s['clicks']},
                            "spend": {"today": t_s['spend'], "prev": p_s['spend'], "total": tot_s['spend']},
                            "views": {"today": t_s['views'], "prev": p_s['views'], "total": tot_s['views']}
                        }
                    })
                return comparison

            media_results = analyze_dimension(valid_df, m_col)
            creative_results = analyze_dimension(valid_df, c_col)

            # [Improved] Advertiser Name Extraction
            adv_name = "Nasmedia"
            
            # 1. Try mapped column
            if adv_col and adv_col in valid_df.columns:
                potential_names = valid_df[adv_col].dropna().astype(str)
                potential_names = potential_names[potential_names.str.strip() != '']
                if not potential_names.empty:
                    adv_name = potential_names.mode().iloc[0]
            else:
                # 2. Try heuristic search for "Advertiser" or "Client" or "광고주"
                potential_adv_cols = [c for c in valid_df.columns if str(c).lower() in ['advertiser', 'client', '광고주', '광고주명']]
                if potential_adv_cols:
                    found_col = potential_adv_cols[0]
                    potential_names = valid_df[found_col].dropna().astype(str)
                    potential_names = potential_names[potential_names.str.strip() != '']
                    if not potential_names.empty:
                        adv_name = potential_names.mode().iloc[0]
            
            await event_bus.emit("status_update", {"message": f"브랜드({adv_name}) 분석 및 컬러 검색 중..."})
            brand_color = await ai_service.recommend_brand_color(adv_name)

            # 5. Media Mix & Budget Analysis
            mix_df = pd.DataFrame(req.mix_rows)
            budget_total = 0
            if not mix_df.empty:
                # Priority mapping and exclusion logic for budget columns
                budget_keywords = ['예산', 'budget', 'plan', '집행금액', '배정', 'gross', 'net', '광고비']
                exclude_keywords = ['달성', 'attainment', 'rate', '비율', 'share', '비중', '차이']
                
                mix_budget_col = None
                for col in mix_df.columns:
                    c_lower = str(col).lower()
                    if any(k in c_lower for k in budget_keywords) and not any(ek in c_lower for ek in exclude_keywords):
                        mix_budget_col = col
                        break
                
                if mix_budget_col:
                    logger.info(f"Targeting budget column: {mix_budget_col}")
                    
                    # [Fix] Budget Calculation Logic Update
                    # User Request: "Find budget in mediamix sheet... incorrect values in summary"
                    # New Logic: EXCLUDE any row that looks like a Total/Sum row, and SUM everything else.
                    
                    total_row_keywords = ['total', 'sum', '합계', '종합', '계']
                    
                    # created a boolean mask for rows that are NOT total rows
                    is_valid_row = []
                    for _, row in mix_df.iterrows():
                        # Create a string representation of the row to check for keywords
                        row_str = " ".join(str(v).lower() for v in row.values)
                        
                        # If row contains total keywords, mark as False (exclude)
                        if any(tk in row_str for tk in total_row_keywords):
                            is_valid_row.append(False)
                        else:
                            is_valid_row.append(True)
                            
                    # Filter mix_df to execute rows only
                    execution_df = mix_df[is_valid_row].copy()
                    
                    # Calculate sum from valid executing rows
                    execution_df[mix_budget_col] = execution_df[mix_budget_col].apply(self.robust_to_numeric)
                    budget_total = execution_df[mix_budget_col].sum()
                    
                    logger.info(f"Calculated budget from individual execution rows: {budget_total}")
                        
                else:
                    logger.warning("No suitable budget column found in Media Mix sheet.")


            raw_total_spend = valid_df[cost_col].sum() if cost_col else 0
            budget_achievement = (raw_total_spend / budget_total * 100) if budget_total > 0 else 0

            # 6. AI Optimization
            summary_for_ai = {
                "date": t_date.strftime('%Y-%m-%d'),
                "overall": overall_today,
                "overall_prev": overall_prev,
                "overall_total": overall_total,
                "budget_total": budget_total,
                "total_spend": raw_total_spend,
                "achievement": budget_achievement,
                "top_media": sorted(media_results, key=lambda x: x['metrics']['impressions']['today'], reverse=True)[:3],
                "top_creatives": sorted(creative_results, key=lambda x: x['metrics']['impressions']['today'], reverse=True)[:3]
            }

            result = {
                "date": t_date.strftime('%Y-%m-%d'),
                "prevDate": p_date.strftime('%Y-%m-%d') if p_date else None,
                "mediaComparison": media_results,
                "creativeComparison": creative_results,
                "overall": {
                    "impressions": {"today": overall_today['impressions'], "prev": overall_prev['impressions'], "total": overall_total['impressions']},
                    "clicks": {"today": overall_today['clicks'], "prev": overall_prev['clicks'], "total": overall_total['clicks']},
                    "spend": {"today": overall_today['spend'], "prev": overall_prev['spend'], "total": overall_total['spend']},
                    "views": {"today": overall_today['views'], "prev": overall_prev['views'], "total": overall_total['views']}
                },
                "budgetTotal": int(budget_total),
                "totalSpend": int(raw_total_spend),
                "budgetAchievement": round(budget_achievement, 1),
                "advertiser": adv_name,
                "brandColor": brand_color
            }
            
            await event_bus.emit("status_update", {"message": "AI 인사이트 생성 중..."})
            insight = await ai_service.generate_insight(summary_for_ai)
            result["insight"] = insight
            
            # Generate 3-line summary
            insight_summary = await ai_service.generate_summary(insight)
            result["insight_summary"] = insight_summary

            await event_bus.emit("analysis_completed", result)
            return result

        except Exception as e:
            logger.error(f"Analysis error: {str(e)}", exc_info=True)
            await event_bus.emit("analysis_error", {"error": str(e)})
            return {"error": f"분석 오류: {str(e)}"}



analysis_service = AnalysisService()
