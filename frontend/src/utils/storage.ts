/**
 * 통합 저장소 모듈
 * path: src/utils/storage.ts
 */

// 데이터 타입에 상관없이 저장 가능하도록 any 타입 허용
export const storage = {
    save: (title: string, data: any): string => {
      const id = Date.now().toString();
      const timestamp = Date.now();
      
      // 기존 데이터 로드
      const existingDataStr = localStorage.getItem('dmp_analysis_results');
      const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];
      
      // 새 데이터 추가
      const newData = {
        id,
        timestamp,
        title,
        data // DMP 타겟 데이터 또는 리포트 데이터 모두 수용
      };
      
      const updatedData = [newData, ...existingData];
      localStorage.setItem('dmp_analysis_results', JSON.stringify(updatedData));
      
      return id;
    },
  
    loadAll: () => {
      const dataStr = localStorage.getItem('dmp_analysis_results');
      return dataStr ? JSON.parse(dataStr) : [];
    },
  
    loadById: (id: string) => {
      const dataStr = localStorage.getItem('dmp_analysis_results');
      if (!dataStr) return null;
      const list = JSON.parse(dataStr);
      return list.find((item: any) => item.id === id) || null;
    }
  };