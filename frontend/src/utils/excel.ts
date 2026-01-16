import * as XLSX from 'xlsx';

// 1. 에러 해결: 인터페이스 정의를 최상단으로 이동하여 2304 에러 방지
export interface ExcelData {
  fileName: string;
  raw: { headers: string[]; rows: any[] };
  mediaMix: { headers: string[]; rows: any[] };
  mediaSheets: { sheetName: string; headers: string[]; rows: any[] }[];
}

// 분석에서 제외할 불필요한 컬럼 키워드
const EXCLUDE_KEYWORDS = ['os', '요일', 'day', 'week', '지면', 'placement', 'device', '기기', 'summary', 'sum'];

// 헤더 탐색용 핵심 키워드
const HEADER_KEYWORDS = ['date', '일자', 'media', '매체', 'cost', '비용', 'imp', '노출', 'click', '광고주', 'campaign', '캠페인'];

// 2차원 배열 전치 (행 <-> 열 변환) 함수
const transpose = (matrix: any[][]) => {
  if (!matrix || matrix.length === 0) return [];
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
};

// 사람이 보기 쉬운 데이터(콤마, 기호 등)를 정제하는 함수
const cleanValue = (val: any) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') return val;
    // 숫자 형식인 경우 콤마와 기호 제거 후 숫자로 변환 시도
    const str = String(val).trim();
    if (/^-?[\d,.]+$/.test(str) || str.includes('₩') || str.includes('$')) {
        const cleaned = str.replace(/[^\d.-]/g, '');
        return cleaned.includes('.') ? parseFloat(cleaned) : parseInt(cleaned, 10);
    }
    return str;
};

// MediaMix 시트 찾기 우선순위 로직
// 2. 에러 해결: n의 타입을 string으로 명시하여 7006 에러 방지
const findMediaMixSheetName = (sheetNames: string[]): string => {
  const lowerNames = sheetNames.map((n: string) => ({ original: n, lower: n.toLowerCase().replace(/[\s_]/g, '') }));

  const exactMatch = lowerNames.find(n => n.lower.includes('mediamix'));
  if (exactMatch) return exactMatch.original;

  const planMatch = lowerNames.find(n => 
    n.lower.includes('budget') || n.lower.includes('plan') || n.lower.includes('goal') || n.lower.includes('믹스')
  );
  if (planMatch) return planMatch.original;

  const summaryMatch = lowerNames.find(n => 
    !n.lower.includes('raw') && (n.lower.includes('summary') || n.lower.includes('total') || n.lower.includes('종합'))
  );
  if (summaryMatch) return summaryMatch.original;

  return '';
};

export const parseExcel = async (file: File): Promise<ExcelData> => {
  console.log(`[Excel Log] 파일 읽기 시작: ${file.name}`);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // 3. 에러 해결: XLSX 라이브러리 사용 지점 로그 추가 및 정상 참조 확인
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetNames = workbook.SheetNames;
        console.log(`[Excel Log] 발견된 시트들: ${sheetNames.join(', ')}`);
        
        const rawName = sheetNames.find(n => n.toLowerCase().includes('raw') || n.toLowerCase().includes('로데이터')) || '';
        const mixName = findMediaMixSheetName(sheetNames);
        
        console.log(`[Excel Log] Target RAW 시트: ${rawName || '없음(기본값 사용)'}`);
        console.log(`[Excel Log] Target MediaMix 시트: ${mixName || '없음'}`);

        const getSheetData = (name: string) => {
          if (!name) return { headers: [], rows: [] };
          const sheet = workbook.Sheets[name];
          let allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];
          if (allRows.length === 0) return { headers: [], rows: [] };

          // 방향 탐지 (가로/세로 자동 감지)
          let verticalScore = 0;
          let horizontalScore = 0;
          for (let i = 0; i < Math.min(allRows.length, 20); i++) {
            const rowStr = (allRows[i] || []).join(' ').toLowerCase();
            const matchCount = HEADER_KEYWORDS.filter(k => rowStr.includes(k)).length;
            verticalScore = Math.max(verticalScore, matchCount);
          }
          let colA_matches = 0;
          for (let i = 0; i < Math.min(allRows.length, 50); i++) {
            const cellVal = String(allRows[i]?.[0] || '').toLowerCase();
            if (HEADER_KEYWORDS.some(k => cellVal.includes(k))) colA_matches++;
          }
          horizontalScore = colA_matches;

          if (horizontalScore > verticalScore && horizontalScore >= 2) {
            console.log(`[Excel Log] '${name}' 시트가 가로 방향으로 감지되어 회전(Transpose)합니다.`);
            allRows = transpose(allRows);
          }

          // 헤더 행 찾기
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(allRows.length, 20); i++) {
             const rowStr = (allRows[i] || []).join(' ').toLowerCase();
             if (HEADER_KEYWORDS.filter(k => rowStr.includes(k)).length >= 2) {
                headerRowIndex = i;
                break;
             }
          }

          const headers = (allRows[headerRowIndex] || []).map(h => String(h || '').trim());
          const dataRows = allRows.slice(headerRowIndex + 1);
          
          // 데이터 정제 및 객체화
          const jsonData = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((h, idx) => {
              if (h) obj[h] = cleanValue(row[idx]); // 사람이 보기 쉬운 데이터를 여기서 정제
            });
            return obj;
          });
          
          return { headers, rows: jsonData };
        };

        const rawData = getSheetData(rawName || sheetNames[0]);
        const mixData = getSheetData(mixName);

        console.log(`[Excel Log] 파싱 완료: RAW 행수 ${rawData.rows.length}, MediaMix 행수 ${mixData.rows.length}`);

        resolve({
          fileName: file.name,
          raw: rawData,
          mediaMix: mixData,
          mediaSheets: []
        });

      } catch (err) {
        console.error("[Excel Log] 파싱 중 심각한 오류 발생:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};