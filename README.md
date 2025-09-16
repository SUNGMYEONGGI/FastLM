# FastLM - 워크스페이스 관리 시스템

FastLM은 워크스페이스 관리, 공지사항 스케줄링, 사용자 관리 기능을 제공하는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **사용자 관리**: 회원가입, 로그인, 관리자 승인 시스템
- **워크스페이스 관리**: 워크스페이스 생성, 수정, 승인 관리
- **공지사항 스케줄링**: 슬랙 연동 자동 공지 발송
- **QR 코드 관리**: 워크스페이스별 QR 이미지 업로드
- **템플릿 시스템**: 공지사항 템플릿 관리
- **줌 연동**: 줌 회의 정보 관리

## 🛠️ 기술 스택

### 백엔드
- **Flask**: Python 웹 프레임워크
- **SQLAlchemy**: ORM
- **JWT**: 인증
- **APScheduler**: 작업 스케줄링
- **Gunicorn**: WSGI 서버

### 프론트엔드
- **React 18**: UI 프레임워크
- **TypeScript**: 타입 안전성
- **Vite**: 빌드 도구
- **Tailwind CSS**: 스타일링
- **React Router**: 라우팅

### 인프라
- **Docker & Docker Compose**: 컨테이너화
- **Nginx**: 리버스 프록시
- **SQLite**: 데이터베이스

## 📦 빠른 시작

### 사전 요구사항
- Docker
- Docker Compose

### 1. 프로덕션 배포

```bash
# 저장소 클론
git clone <repository-url>
cd FastLM

# 환경 변수 설정
cp env.example .env
# .env 파일을 편집하여 보안 키를 변경하세요

# 배포 실행
./deploy.sh
```

배포 완료 후:
- 웹 애플리케이션: http://new.fastlm.site (또는 http://localhost)
- 관리자 계정: admin@day1company.co.kr / Camp1017!!

### 2. 개발 환경 실행

```bash
# 개발 환경 실행
./dev.sh
```

개발 서버:
- 프론트엔드: http://localhost:5173
- 백엔드: http://localhost:5000

## 🔧 수동 설정

### 백엔드 설정

```bash
cd FastLM-Backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt

# 개발 서버 실행
python app.py
```

### 프론트엔드 설정

```bash
cd Fastlm-Fronte

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 🐳 Docker 명령어

```bash
# 서비스 시작
docker-compose up -d

# 서비스 중단
docker-compose down

# 로그 확인
docker-compose logs -f

# 서비스 상태 확인
docker-compose ps

# 이미지 재빌드
docker-compose build --no-cache
```

## 📁 프로젝트 구조

```
FastLM/
├── FastLM-Backend/          # Flask 백엔드
│   ├── app.py              # 메인 애플리케이션
│   ├── requirements.txt    # Python 의존성
│   ├── Dockerfile         # 백엔드 Docker 설정
│   └── gunicorn.conf.py   # Gunicorn 설정
├── Fastlm-Fronte/          # React 프론트엔드
│   ├── src/               # 소스 코드
│   ├── package.json       # Node.js 의존성
│   ├── Dockerfile        # 프론트엔드 Docker 설정
│   └── nginx.conf        # Nginx 설정
├── docker-compose.yml     # Docker Compose 설정
├── deploy.sh             # 프로덕션 배포 스크립트
├── dev.sh               # 개발 환경 스크립트
└── README.md           # 프로젝트 문서
```

## 🔐 환경 변수

### 백엔드 환경 변수 (.env)

```bash
SECRET_KEY=your-secret-key-change-this-in-production
JWT_SECRET_KEY=jwt-secret-string-change-this-in-production
SQLALCHEMY_DATABASE_URI=sqlite:///fastlm.db
FLASK_ENV=production
DEBUG=False
LOG_LEVEL=INFO
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=static/qr_images
```

### 프론트엔드 환경 변수

```bash
# 개발 환경
VITE_API_BASE_URL=http://localhost:5000/api

# 프로덕션 환경
VITE_API_BASE_URL=/api
```

## 👤 기본 관리자 계정

- **이메일**: admin@day1company.co.kr
- **비밀번호**: Camp1017!!

⚠️ **보안**: 프로덕션 환경에서는 반드시 기본 비밀번호를 변경하세요.

## 📋 API 문서

### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/verify` - 토큰 검증

### 사용자 관리 API (관리자)
- `GET /api/admin/users` - 모든 사용자 조회
- `PUT /api/admin/users/{id}/approve` - 사용자 승인
- `DELETE /api/admin/users/{id}` - 사용자 삭제

### 워크스페이스 API
- `GET /api/workspaces` - 워크스페이스 조회
- `POST /api/workspaces` - 워크스페이스 생성
- `PUT /api/workspaces/{id}` - 워크스페이스 수정
- `POST /api/workspaces/{id}/qr` - QR 이미지 업로드

### 공지사항 API
- `GET /api/notices` - 공지사항 조회
- `POST /api/notices` - 공지사항 생성

## 🔍 문제 해결

### 일반적인 문제

1. **Docker 권한 오류**
   ```bash
   sudo usermod -aG docker $USER
   # 로그아웃 후 다시 로그인
   ```

2. **포트 충돌**
   - 80번 포트가 사용 중인 경우 docker-compose.yml에서 포트 변경

3. **데이터베이스 초기화**
   ```bash
   docker-compose exec backend python -c "from app import init_db; init_db()"
   ```

4. **로그 확인**
   ```bash
   # 모든 서비스 로그
   docker-compose logs -f
   
   # 특정 서비스 로그
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

### 개발 환경 문제

1. **Python 가상환경 활성화**
   ```bash
   cd FastLM-Backend
   source venv/bin/activate
   ```

2. **Node.js 패키지 재설치**
   ```bash
   cd Fastlm-Fronte
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이센스

이 프로젝트는 [MIT 라이센스](LICENSE)를 따릅니다.

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요.
