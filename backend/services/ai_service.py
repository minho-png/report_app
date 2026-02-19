import warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
import google.generativeai as genai
from backend.core.config import settings
import logging
import json
from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        if settings.LLM_API_KEY:
            genai.configure(api_key=settings.LLM_API_KEY)
        self.model = genai.GenerativeModel(settings.LLM_MODEL)

    async def generate_insight(self, data: dict) -> str:
        prompt = f"""
        당신은 광고 대행사 보고서 전문가입니다. 다음 광고 집행 결과를 분석하여 간결한 캠페인 코멘트를 작성하세요.
        
        [데이터]
        {json.dumps(data, ensure_ascii=False, indent=2, default=lambda o: int(o) if hasattr(o, 'item') else str(o))}
        
        작성 규칙:
        1. **매체별 현황** 섹션을 먼저 작성
           - 각 상위 3개 매체를 개별 소제목으로 구분 (예: "1. 네이버 GFA", "2. 크로스타겟")
           - 각 매체마다 ㄴ 기호로 2-3개 핵심 지표만 간결하게 정리
           - CPC, CTR, CPV 등 핵심 효율 지표 위주로 언급
           - "제안 대비 XX원 낮은/높은 평균 XX원" 형식 사용
           - DMP 또는 특정 타겟에서의 효율 언급
        
        2. **캠페인 코멘트** 섹션을 마지막에 작성
           - "전체현황" 하위에 2-3줄 요약
           - 특이사항이나 주목할 매체가 있다면 "매체별 현황" 하위에 간략히 추가
        
        3. 형식 요구사항:
           - 전체 길이는 10줄 이내로 최대한 간결하게
           - 불필요한 서론이나 결론 없이 핵심만
           - 정량적 수치 위주로 작성
           - 매우 전문적이고 간결한 톤 유지
        
        예시 참고:
        ```
        1. 네이버 GFA
        ㄴ CPC의 경우 제안 대비 543원 낮은 평균 346원에 진행 중 입니다.
        ㄴ 평균 CTR은 제안 대비 0.46% 상승된 0.66%로 진행 중 입니다.
        
        캠페인 코멘트
        
        전체현황
        캠페인 별도 이슈없이 진행 중 입니다.
        매우 우수한 CPC단가로 운영 중 입니다.
        ```
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating insight: {str(e)}")
            return "인사이트 생성 중 오류가 발생했습니다."

    async def generate_summary(self, insight: str) -> str:
        prompt = f"""
        다음 캠페인 코멘트를 2-3줄로 핵심만 요약하세요:
        ---
        {insight}
        ---
        
        요구사항:
        - 최대 3줄, 각 줄은 한 문장으로 간결하게
        - 캠페인 운영 상태, 주요 효율 지표, 특이사항만 언급
        - "~ 진행 중입니다", "~ 운영 중입니다" 형식 사용
        - 숫자와 핵심 결과 위주로 작성
        
        예시: "크로스타겟 캠페인은 VTR 70% 이상으로 CPV 단가가 절감되었습니다. 크로스타겟 상품의 CTR은 최근 2일간 2% 이상으로 대폭 상승했습니다."
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return "분석 결과 요약을 생성할 수 없습니다."

    async def detect_columns(self, columns: list) -> dict:
        prompt = f"""
        다음은 엑셀 시트의 컬럼명 목록입니다: {columns}
        
        이 중에서 다음의 의미를 갖는 컬럼명을 찾아 매핑해 주세요:
        - date: 날짜, 일자
        - media: 매체, 매체사, 채널
        - creative: 소재, 광고소재, 이미지, 영상
        - impressions: 노출, 노출수, Imp
        - views: 조회, 조회수, 재생, 재생수, View (동영상용)
        - cost: 지출, 비용, 금액, 광고비, Spend
        - clicks: 클릭, 클릭수, Click
        - advertiser: 광고주, 브랜드
        
        결과는 반드시 다음 JSON 형식으로만 답변하세요. 찾지 못한 항목은 null로 표시하세요.
        {{ "date_col": "...", "media_col": "...", "creative_col": "...", "imp_col": "...", "view_col": "...", "cost_col": "...", "click_col": "...", "advertiser_col": "..." }}
        """
        try:
            response = self.model.generate_content(prompt)
            # JSON parsing with cleanup
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error detecting columns: {str(e)}")
            return {}

    async def recommend_brand_color(self, name: str) -> str:
        # 1. Web Search for Brand Color
        search_context = ""
        try:
            results = DDGS().text(f"{name} brand color hex code", max_results=3)
            search_context = "\n".join([f"- {r['title']}: {r['body']}" for r in results])
            logger.info(f"Brand color search results for {name}: {search_context}")
        except Exception as e:
            logger.warning(f"Web search failed for brand color: {str(e)}")

        # 2. AI Recommendation based on search or knowledge
        prompt = f"""
        당신은 브랜드 디자이너입니다. 광고주 '{name}'의 브랜드 아이덴티티에 가장 잘 어울리는 대표 색상(HEX 코드)을 하나만 추천해 주세요.
        
        [웹 검색 결과]
        {search_context}
        
        요구사항:
        1. 웹 검색 결과에 정확한 색상 정보가 있다면 그것을 우선적으로 사용하세요.
        2. 검색 결과가 없다면 당신의 지식이나 브랜드 이미지를 추론하여 선정하세요.
        3. 답은 반드시 #으로 시작하는 HEX 코드만 작성하세요. (예: #004dae)
        
        만약 도저히 알 수 없다면, 신뢰감을 주는 비즈니스 블루(#4f46e5)를 반환하세요.
        """
        try:
            response = self.model.generate_content(prompt)
            color = response.text.strip()
            
            # Simple cleanup to ensure only hex code
            import re
            match = re.search(r'#(?:[0-9a-fA-F]{3,4}){1,2}', color)
            return match.group(0) if match else "#4f46e5"
        except Exception as e:
            logger.error(f"Error recommending color: {str(e)}")
            return "#4f46e5"

ai_service = AIService()
