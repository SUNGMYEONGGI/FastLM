# FastLM - 워크스페이스 관리 시스템

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

> 🚧 **현재 개발 중** - 프론트엔드 구현 완료, Supabase 백엔드 구축 진행 중

## 📋 프로젝트 소개

FastLM은 팀과 조직을 위한 워크스페이스 관리 시스템입니다. 사용자 관리, 워크스페이스 설정, 공지사항 자동화, Slack 통합 등의 기능을 제공합니다.

### ✨ 주요 기능

- **🔐 사용자 인증 및 권한 관리**
  - 회원가입/로그인 시스템
  - 관리자 승인 기반 사용자 관리
  - 역할 기반 접근 제어 (RBAC)

- **🏢 워크스페이스 관리**
  - 다중 워크스페이스 지원
  - 워크스페이스별 사용자 할당
  - QR 코드 생성 및 관리

- **📢 공지사항 시스템**
  - 스케줄링 기반 공지사항 발송
  - 출석, 만족도, 스레드 타입별 공지
  - Slack 웹훅 통합

- **📊 대시보드 및 통계**
  - 실시간 사용자 및 공지사항 통계
  - Zoom 퇴실 기록 추적
  - 관리자 전용 사용자 관리 패널

## 🛠 기술 스택

### Frontend
- **React 18** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안전성을 위한 JavaScript 확장
- **Vite** - 빠른 빌드 도구
- **Tailwind CSS** - 유틸리티 퍼스트 CSS 프레임워크
- **React Router DOM** - 클라이언트 사이드 라우팅
- **Lucide React** - 아이콘 라이브러리
- **React Hot Toast** - 알림 메시지

### Backend (계획)
- **Supabase** - BaaS (Backend as a Service)
- **PostgreSQL** - 관계형 데이터베이스
- **Supabase Auth** - 인증 서비스
- **Supabase Storage** - 파일 저장소

### 외부 연동
- **Slack Webhooks** - 메시지 자동 발송
- **Zoom API** - 퇴실 기록 추적 (계획)

## 🚀 빠른 시작

### 사전 요구사항
- Node.js (v18 이상)
- npm 또는 yarn

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/SUNGMYEONGGI/FastLM.git
   cd FastLM/project
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 필요한 환경 변수 설정
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

5. **브라우저에서 확인**
   ```
   http://localhost:5173
   ```

### 기본 로그인 정보 (개발용)
- **관리자**: admin@example.com / admin
- **일반 사용자**: 회원가입 후 관리자 승인 필요

## 📁 프로젝트 구조

```
project/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── Auth/           # 인증 관련 컴포넌트
│   │   └── Layout/         # 레이아웃 컴포넌트
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx
│   │   └── WorkspaceContext.tsx
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── Admin/          # 관리자 페이지
│   │   ├── Auth/           # 인증 페이지
│   │   └── Dashboard/      # 대시보드 페이지
│   ├── services/           # API 서비스
│   │   └── api.ts
│   ├── types/              # TypeScript 타입 정의
│   │   └── index.ts
│   └── main.tsx            # 앱 진입점
├── public/                 # 정적 파일
└── package.json
```

## ⚙️ 환경 설정

프로젝트 실행을 위해 다음 환경 변수들을 설정해야 합니다:

```bash
# .env 파일 예시
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000/api
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## 🔧 사용 가능한 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린트 검사
npm run lint
```

## 🚧 현재 개발 상황

### ✅ 완료된 기능
- [x] 프론트엔드 UI/UX 구현
- [x] 사용자 인증 시스템 (Mock)
- [x] 워크스페이스 관리 UI
- [x] 대시보드 및 통계 화면
- [x] 관리자 사용자 관리 페이지

### 🔄 진행 중
- [ ] Supabase 백엔드 구축
- [ ] 실제 API 연동
- [ ] 파일 업로드 시스템
- [ ] Slack 웹훅 통합

### 📋 계획 중
- [ ] 테스트 코드 작성
- [ ] 성능 최적화
- [ ] 추가 관리자 기능
- [ ] 모바일 반응형 개선

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면:

1. 이 저장소를 Fork합니다
2. feature 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📝 주요 이슈

현재 프로젝트의 주요 이슈들을 GitHub Issues에서 확인할 수 있습니다:

- [🏗️ Supabase 백엔드 구축](https://github.com/SUNGMYEONGGI/FastLM/issues/1)
- [🐛 API 서비스 레이어 문제](https://github.com/SUNGMYEONGGI/FastLM/issues/4)
- [🔒 보안 개선](https://github.com/SUNGMYEONGGI/FastLM/issues/7)
- [🧪 테스트 코드 작성](https://github.com/SUNGMYEONGGI/FastLM/issues/8)

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 GitHub Issues를 통해 연락해 주세요.

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! 