/**
 * path: src/App.tsx
 */
import ExcelAnalyst from './components/ExcelAnalyst';

function App() {
  return (
    <div className="h-screen w-screen bg-slate-100 overflow-hidden">
      {/* 기존 ChatBot, SegmentManager 라우팅을 제거하고 
        Excel Analyst 단일 뷰로 전환 
      */}
      <ExcelAnalyst />
    </div>
  );
}

export default App;

