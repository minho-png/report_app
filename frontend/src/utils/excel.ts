import * as XLSX from 'xlsx';

export interface ExcelData {
  fileName: string;
  raw: { headers: string[]; rows: any[] };
  originalRaw?: { headers: string[]; rows: any[] }; // Added field
  mediaMix: { headers: string[]; rows: any[] };
  mediaSheets: { sheetName: string; headers: string[]; rows: any[] }[];
}

// 분석에서 제외할 불필요한 컬럼 키워드
const EXCLUDE_KEYWORDS = ['os', '요일', 'day', 'week', 'summary', 'sum'];

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
  console.log(`[Excel] Starting parse for file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // readAsArrayBuffer를 사용하여 인코딩 문제 방지
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellNF: false, cellText: false });
        const sheetNames = workbook.SheetNames;
        console.log(`[Excel] All sheet names found:`, sheetNames);

        const rawName = sheetNames.find(n => {
          const lower = n.toLowerCase().replace(/[\s_]/g, '');
          return lower.includes('raw') || lower.includes('로데이터') || lower.includes('data');
        }) || '';
        console.log(`[Excel] Detected 'Raw' sheet: ${rawName || '(Using first sheet fallback)'}`);

        const mixName = findMediaMixSheetName(sheetNames);
        console.log(`[Excel] Detected 'Media Mix' sheet: ${mixName || '(Not found)'}`);

        const mixIndex = sheetNames.indexOf(mixName);

        let mediaSheetNames: string[] = [];
        if (mixIndex > -1) {
          mediaSheetNames = sheetNames.slice(0, mixIndex);
        } else {
          mediaSheetNames = sheetNames.filter(n => n !== rawName && n !== mixName);
        }
        mediaSheetNames = mediaSheetNames.filter(n => n !== rawName);
        console.log(`[Excel] Targeted media sheets:`, mediaSheetNames);

        // [핵심] 스마트 데이터 추출 함수 (가로/세로 자동 감지)
        const getSheetData = (name: string) => {
          if (!name) return { headers: [], rows: [] };
          const sheet = workbook.Sheets[name];
          if (!sheet) {
            console.warn(`[Excel] Sheet '${name}' not found in workbook.`);
            return { headers: [], rows: [] };
          }

          console.group(`[Excel] Processing Sheet: ${name}`);

          // 1. 전체 데이터를 2차원 배열로 로드 (raw: false로 설정하여 보이는 그대로 텍스트로 가져옴)
          // [Fix] Use raw: false to avoid timezone issues with Dates. We get formatted strings.
          let allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false }) as any[][];
          if (allRows.length === 0) {
            console.warn(`[Excel] Sheet '${name}' is empty.`);
            console.groupEnd();
            return { headers: [], rows: [] };
          }

          // 2. 방향 탐지 (Orientation Detection)
          let verticalScore = 0;
          let horizontalScore = 0;

          // 세로 스캔
          const scanLimit = Math.min(allRows.length, 20);
          for (let i = 0; i < scanLimit; i++) {
            const rowStr = (allRows[i] || []).join(' ').toLowerCase();
            const matchCount = HEADER_KEYWORDS.filter(k => rowStr.includes(k)).length;
            verticalScore = Math.max(verticalScore, matchCount);
          }

          // 가로 스캔 (좌우 배치) - A열(index 0)을 검사
          const colScanLimit = Math.min(allRows.length, 50);
          let colA_matches = 0;
          for (let i = 0; i < colScanLimit; i++) {
            const cellVal = String(allRows[i]?.[0] || '').toLowerCase();
            if (HEADER_KEYWORDS.some(k => cellVal.includes(k))) {
              colA_matches++;
            }
          }
          horizontalScore = colA_matches;

          console.log(`[Excel] Orientation scores - Vertical: ${verticalScore}, Horizontal: ${horizontalScore}`);

          // 3. 전치 결정
          if (horizontalScore > verticalScore && horizontalScore >= 2) {
            console.log(`[Excel] Transposed orientation detected. Flipping sheet...`);
            allRows = transpose(allRows);
          } else {
            console.log(`[Excel] Standard (Vertical) orientation detected.`);
          }

          // 4. 헤더 행 찾기 (가장 많은 키워드가 매칭되는 행 추적)
          let maxMatchCount = 0;
          let bestHeaderIndex = 0;
          for (let i = 0; i < Math.min(allRows.length, 30); i++) {
            const rowValues = (allRows[i] || []).map(v => String(v || '').toLowerCase());
            const matchCount = HEADER_KEYWORDS.filter(k => rowValues.some(v => v.includes(k))).length;

            if (matchCount > maxMatchCount) {
              maxMatchCount = matchCount;
              bestHeaderIndex = i;
            }

            // 충분히 많은 키워드가 매칭되면 즉시 확정
            if (matchCount >= 3) break;
          }

          let headerRowIndex = bestHeaderIndex;
          console.log(`[Excel] Header detection summary - Best Index: ${headerRowIndex}, Max Matches: ${maxMatchCount}`);

          // 5. 데이터 객체화
          const headers = (allRows[headerRowIndex] || []).map(h => String(h || '').trim());
          const validHeaders = headers.filter(h => h !== '');
          console.log(`[Excel] Extracted headers count: ${headers.length} (Non-empty: ${validHeaders.length})`);
          if (validHeaders.length < 5) {
            console.warn(`[Excel] Unusual header count (${validHeaders.length}) for sheet '${name}'. Full headers:`, headers);
          }

          const dataRows = allRows.slice(headerRowIndex + 1);
          let rejectedEmptyRows = 0;

          const jsonData = dataRows.map((row, rIdx) => {
            const obj: any = {};
            let hasValue = false;
            headers.forEach((h, idx) => {
              if (h) {
                let cellVal = row[idx];

                obj[h] = cellVal;
                if (cellVal !== null && cellVal !== undefined && String(cellVal).trim() !== '') {
                  hasValue = true;
                }
              }
            });

            if (!hasValue) {
              rejectedEmptyRows++;
              return null;
            }
            return obj;
          }).filter(r => r !== null);

          console.log(`[Excel] Parsed ${jsonData.length} valid rows. (Rejected ${rejectedEmptyRows} empty rows)`);
          if (jsonData.length === 0 && dataRows.length > 0) {
            console.warn(`[Excel] Found ${dataRows.length} potential data rows, but all were rejected as empty based on headers at index ${headerRowIndex}.`);
            console.log(`[Excel] Sample first data row:`, dataRows[0]);
          }
          console.groupEnd();

          return { headers, rows: jsonData };
        };

        const rawData = getSheetData(rawName || sheetNames[0]); // Explicitly fallback to first sheet if no raw found
        const mixData = getSheetData(mixName);

        const mediaSheetsData = mediaSheetNames.map(name => ({
          sheetName: name,
          ...getSheetData(name)
        }));

        const validRawHeaders = cleanHeaders(rawData.headers);
        const cleanRawRows = rawData.rows.map((row: any) => {
          const newRow: any = {};
          validRawHeaders.forEach(h => {
            // Basic cleaning only
            if (h in row) newRow[h] = row[h];
          });
          return newRow;
        });

        console.log(`[Excel] Parse complete. Final raw data rows: ${cleanRawRows.length}`);

        resolve({
          fileName: file.name,
          raw: { headers: validRawHeaders, rows: cleanRawRows },
          originalRaw: rawData, // Preserve the full raw data
          mediaMix: mixData,
          mediaSheets: mediaSheetsData
        });

      } catch (err) {
        console.error(`[Excel] CRITICAL ERROR parsing ${file.name}:`, err);
        reject(err);
      }
    };
    reader.onerror = (err) => {
      console.error(`[Excel] FileReader error:`, err);
      reject(err);
    };
    reader.readAsArrayBuffer(file);
  });
};

export const downloadExcel = (data: any[], fileName: string, sheetName: string = 'Raw Data') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
