import * as XLSX from 'xlsx';

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

const cleanHeaders = (headers: string[]) => {
  return headers.filter(h => !EXCLUDE_KEYWORDS.some(k => h.toLowerCase().includes(k)));
};

// MediaMix 시트 찾기 우선순위 로직
const findMediaMixSheetName = (sheetNames: string[]): string => {
  const lowerNames = sheetNames.map(n => ({ original: n, lower: n.toLowerCase().replace(/[\s_]/g, '') }));

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetNames = workbook.SheetNames;
        
        const rawName = sheetNames.find(n => n.toLowerCase().includes('raw') || n.toLowerCase().includes('로데이터')) || '';
        const mixName = findMediaMixSheetName(sheetNames);
        const mixIndex = sheetNames.indexOf(mixName);

        let mediaSheetNames: string[] = [];
        if (mixIndex > 0) {
            mediaSheetNames = sheetNames.slice(0, mixIndex);
        } else {
            mediaSheetNames = sheetNames.filter(n => n !== rawName && n !== mixName);
        }
        mediaSheetNames = mediaSheetNames.filter(n => n !== rawName);

        // [핵심] 스마트 데이터 추출 함수 (가로/세로 자동 감지)
        const getSheetData = (name: string) => {
          if (!name) return { headers: [], rows: [] };
          const sheet = workbook.Sheets[name];
          
          // 1. 전체 데이터를 2차원 배열로 로드 (헤더 옵션 없이 Raw하게)
          let allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];
          if (allRows.length === 0) return { headers: [], rows: [] };

          // 2. 방향 탐지 (Orientation Detection)
          // 세로 점수: 상위 20개 '행(Row)'에서 키워드가 발견되는 빈도
          // 가로 점수: 상위 20개 '열(Column)'의 첫 번째 셀에서 키워드가 발견되는 빈도
          let verticalScore = 0;
          let horizontalScore = 0;

          // 세로 스캔 (일반적)
          for (let i = 0; i < Math.min(allRows.length, 20); i++) {
            const rowStr = (allRows[i] || []).join(' ').toLowerCase();
            const matchCount = HEADER_KEYWORDS.filter(k => rowStr.includes(k)).length;
            verticalScore = Math.max(verticalScore, matchCount);
          }

          // 가로 스캔 (좌우 배치) - A열(index 0)을 검사
          let colA_matches = 0;
          for (let i = 0; i < Math.min(allRows.length, 50); i++) {
            const cellVal = String(allRows[i]?.[0] || '').toLowerCase();
            if (HEADER_KEYWORDS.some(k => cellVal.includes(k))) {
              colA_matches++;
            }
          }
          horizontalScore = colA_matches;

          // 3. 전치 결정 (가로 점수가 압도적으로 높으면 뒤집음)
          // 조건: 가로 점수가 세로 점수보다 크고, 최소 2개 이상의 키워드가 A열에 있어야 함
          if (horizontalScore > verticalScore && horizontalScore >= 2) {
            console.log(`[Detect] Sheet '${name}' is transposed. Flipping...`);
            allRows = transpose(allRows);
          }

          // 4. 헤더 행 찾기 (전치된 데이터 기준)
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(allRows.length, 20); i++) {
             const rowStr = (allRows[i] || []).join(' ').toLowerCase();
             if (HEADER_KEYWORDS.filter(k => rowStr.includes(k)).length >= 2) {
                headerRowIndex = i;
                break;
             }
          }

          // 5. 데이터 객체화 (Array of Arrays -> Array of Objects)
          const headers = (allRows[headerRowIndex] || []).map(h => String(h || '').trim());
          const dataRows = allRows.slice(headerRowIndex + 1);
          
          const jsonData = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((h, idx) => {
              // 헤더가 있는 열만 데이터로 가져옴
              if (h) obj[h] = row[idx];
            });
            return obj;
          });
          
          return { headers, rows: jsonData };
        };

        const rawData = getSheetData(rawName);
        const mixData = getSheetData(mixName);
        
        if (!mixName) console.warn("MediaMix 시트를 찾지 못했습니다.");

        const mediaSheetsData = mediaSheetNames.map(name => ({
          sheetName: name,
          ...getSheetData(name)
        }));

        const validRawHeaders = cleanHeaders(rawData.headers);
        const cleanRawRows = rawData.rows.map((row: any) => {
          const newRow: any = {};
          validRawHeaders.forEach(h => newRow[h] = row[h]);
          return newRow;
        });

        resolve({
          fileName: file.name,
          raw: { headers: validRawHeaders, rows: cleanRawRows },
          mediaMix: mixData,
          mediaSheets: mediaSheetsData
        });

      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};