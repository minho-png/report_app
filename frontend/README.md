# DMP Platform - Targeting Manager

React + TypeScript + Tailwind CSS로 구축된 DMP 타겟팅 관리 플랫폼입니다.

## 주요 기능

- **RAG 기반 데이터 분석**: JSONL 파일들을 활용한 세그먼트 데이터 분석
- **LLM 챗봇**: 자연어로 데이터 분석 및 타겟 그룹 생성 요청
- **타겟팅 관리**: 생성된 타겟 그룹과 세그먼트를 시각적으로 관리
- **로직 편집기**: 타겟팅 로직을 직접 편집하고 복사

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_LLM_API_URL=https://api.openai.com/v1/chat/completions
VITE_LLM_API_KEY=your_api_key_here
VITE_LLM_MODEL=gpt-4
```

### 3. 데이터 파일 준비

프로젝트 루트에 다음 JSONL 파일들이 있어야 합니다:
- `Lotte.jsonl`
- `skp표준.jsonl`
- `KB DMP.jsonl`
- `TG360_data.jsonl`
- `wifi.jsonl`

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 빌드

```bash
npm run build
```

## 사용 방법

1. **챗봇 화면**: 앱을 실행하면 첫 화면에서 챗봇이 표시됩니다.
2. **데이터 분석 요청**: "데이터 분석 시작" 또는 "타겟 그룹 생성"이라고 입력하세요.
3. **결과 확인**: LLM이 생성한 타겟 그룹과 RAW_DATA가 자동으로 결과 화면에 표시됩니다.
4. **타겟팅 관리**: 결과 화면에서 세그먼트를 선택하고 타겟팅 로직을 편집할 수 있습니다.

## 프로젝트 구조

```
src/
├── components/
│   ├── ChatBot.tsx          # LLM 챗봇 컴포넌트
│   └── SegmentManager.tsx   # 타겟팅 관리 컴포넌트
├── utils/
│   ├── rag.ts               # RAG 시스템 (JSONL 파싱 및 검색)
│   ├── llm.ts               # LLM API 연동
│   └── dataProcessor.ts    # LLM 응답 파싱
├── App.tsx                  # 메인 앱 컴포넌트
└── main.tsx                 # 진입점
```

## 기술 스택

- **React 18**: UI 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **Vite**: 빌드 도구
- **Lucide React**: 아이콘

## 라이선스

MIT
