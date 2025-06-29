# 🚀 FastLM - 워크스페이스 관리 시스템

> 팀과 조직을 위한 종합 워크스페이스 관리 시스템

## 📋 프로젝트 소개

FastLM은 워크스페이스 관리, 사용자 권한 관리, 공지사항 자동화, Slack 통합 등의 기능을 제공하는 종합 관리 시스템입니다.

## 🏗️ 시스템 구조

```
FastLM/
├── FastLM-Backend/     # Flask 백엔드 서버
│   ├── app.py         # 메인 애플리케이션
│   ├── requirements.txt
│   └── README.md
├── Fastlm-Fronte/     # React 프론트엔드
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md          # 이 파일
```

## ⚡ 빠른 시작

### 사전 요구사항
- Python 3.8 이상
- Node.js 16 이상
- npm 또는 yarn

### 1. 백엔드 실행

```bash
# 백엔드 디렉토리로 이동
cd FastLM-Backend

# 가상환경 생성 (권장)
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt

# 서버 실행
python app.py
```

백엔드 서버가 `http://localhost:5000`에서 실행됩니다.

### 2. 프론트엔드 실행

새 터미널을 열고:

```bash
# 프론트엔드 디렉토리로 이동
cd Fastlm-Fronte

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

## 🔑 기본 관리자 계정

- **이메일**: admin@day1company.co.kr
- **비밀번호**: Camp1017!!

## ✨ 주요 기능

### 🔐 사용자 관리
- 회원가입/로그인 시스템
- 관리자 승인 기반 사용자 관리
- JWT 토큰 기반 인증

### 🏢 워크스페이스 관리
- 다중 워크스페이스 지원
- 워크스페이스별 사용자 권한 관리
- QR 코드 생성 및 업로드

### 📢 공지사항 시스템
- 자동 공지사항 스케줄링
- 출석, 만족도, 스레드 타입 공지
- Slack 웹훅 통합

### 📊 관리자 기능
- 사용자 승인/거부 관리
- 워크스페이스 승인 관리
- 스케줄된 작업 모니터링

## 🛠 기술 스택

### 백엔드
- **Flask** - 웹 프레임워크
- **SQLAlchemy** - ORM
- **JWT** - 사용자 인증
- **APScheduler** - 작업 스케줄링
- **SQLite** - 데이터베이스

### 프론트엔드
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅

## 📁 주요 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/verify` - 토큰 검증

### 사용자 관리 (관리자)
- `GET /api/admin/users` - 사용자 목록
- `PUT /api/admin/users/<id>/approve` - 사용자 승인

### 워크스페이스
- `GET /api/workspaces` - 워크스페이스 목록
- `POST /api/admin/workspaces` - 워크스페이스 생성

### 공지사항
- `GET /api/notices` - 공지사항 목록
- `POST /api/notices` - 공지사항 생성

## 🔧 개발 환경 설정

### 백엔드 설정
백엔드는 SQLite 데이터베이스를 사용하며, 첫 실행 시 자동으로 데이터베이스가 생성됩니다.

### 프론트엔드 설정
프론트엔드는 `http://localhost:5000`의 백엔드 API를 기본으로 사용하도록 설정되어 있습니다.

## 🚀 프로덕션 배포

### 백엔드 배포
```bash
cd FastLM-Backend
pip install -r requirements.txt
python app.py
```

### 프론트엔드 빌드
```bash
cd Fastlm-Fronte
npm install
npm run build
```

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 📞 문의사항

프로젝트에 대한 문의사항이나 이슈는 GitHub Issues를 통해 남겨주세요.

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요! 