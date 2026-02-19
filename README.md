# DMP Platform - Analysis Hub

웹 전용 아키텍처(FastAPI + Next.js)를 기반으로 구축된 데이터 분석 플랫폼입니다.

## 아키텍처 (Architecture: Frontend - Gateway - Backend)

본 프로젝트는 서비스의 확장성과 엔트리 포인트 제어를 위해 **3계층 구조(3-Tier Architecture)**를 따릅니다.

### 1. Frontend (Next.js 14+)
- **View (V)**: `frontend/src/components` - 사용자 UI 및 리포트 시각화
- **Controller (C)**: `frontend/src/services` & Hooks - API 호출 및 상태 제어

### 2. Gateway (FastAPI Entry - Port 8000)
- **Role**: 모든 외부 요청의 관문(Entry Point). 프론트엔드로부터 요청을 받아 Backend(8001)로 중계(Proxy)합니다.
- **Controller**: `gateway/api` - 엔드포인트 정의 및 `httpx`를 통한 백엔드 API 호출.

### 3. Backend (Core Engine - Port 8001)
- **Role**: 실제 분석 기능이 수립되어 있는 핵심 서버입니다.
- **Services**: `backend/services` - 분석 로직, AI 인사이트 생성.
- **API**: `backend/main.py` - 내부 분석 API를 제공합니다.

## 시작하기

### 1. 개발 환경 설치
```bash
npm run install:all
```

### 2. 프로젝트 실행 (Local)
```bash
npm run dev
```

### 3. Docker로 실행
Docker와 Docker Compose가 설치되어 있어야 합니다.
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Gateway: `http://localhost:8000`
- Backend: `http://localhost:8001`

## 배포 (Deployment)

### Vercel (Frontend)
이 프로젝트는 Vercel에 최적화되어 있습니다. GitHub 레포지토리를 연결하여 배포할 수 있습니다.
- **Root Directory**: `frontend`로 설정
- **Environment Variable**: `NEXT_PUBLIC_API_URL`에 Gateway URL 설정 (예: `https://your-gateway.com/api/analysis`)

## 주요 기능
- **광고주 인식**: 엑셀 데이터에서 광고주를 인식하여 리포트 테마 자동 변경
- **AI 인사이트**: Gemini를 연동한 전문적인 데이터 성과 분석
- **실시간 스트리밍**: 분석 단계별 진행 상황을 실시간으로 확인

## 기술 스택
- **Backend**: FastAPI, Pandas, Gemini AI
- **Frontend**: Next.js, TypeScript, Tailwind CSS, Recharts
- **Storage**: Browser LocalStorage
