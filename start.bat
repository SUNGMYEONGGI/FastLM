@echo off
chcp 65001 >nul

echo 🚀 FastLM 프로젝트 시작 중...
echo ===============================================

set CURRENT_DIR=%cd%

echo 📡 백엔드 서버 시작 중...
cd /d "%CURRENT_DIR%\FastLM-Backend"

REM 가상환경이 없으면 생성
if not exist "venv" (
    echo 🔧 가상환경 생성 중...
    python -m venv venv
)

REM 가상환경 활성화
call venv\Scripts\activate

REM 패키지 설치
echo 📦 패키지 설치 중...
pip install -r requirements.txt

REM 백엔드 서버 실행 (새 창에서)
echo ✅ 백엔드 서버 실행 (http://localhost:5000)
start "FastLM Backend" cmd /k "venv\Scripts\activate && python app.py"

REM 잠시 대기
timeout /t 3 /nobreak >nul

echo 🎨 프론트엔드 서버 시작 중...
cd /d "%CURRENT_DIR%\Fastlm-Fronte"

REM node_modules가 없으면 설치
if not exist "node_modules" (
    echo 📦 npm 패키지 설치 중...
    npm install
)

REM 프론트엔드 서버 실행 (새 창에서)
echo ✅ 프론트엔드 서버 실행 (http://localhost:5173)
start "FastLM Frontend" cmd /k "npm run dev"

echo.
echo 🎉 FastLM 프로젝트가 성공적으로 시작되었습니다!
echo ===============================================
echo 📡 백엔드: http://localhost:5000
echo 🎨 프론트엔드: http://localhost:5173
echo.
echo 🔑 기본 관리자 계정:
echo    이메일: admin@day1company.co.kr
echo    비밀번호: Camp1017!!
echo.
echo ⏹️  각 서버 창을 닫아서 서버를 종료할 수 있습니다
echo ===============================================

echo.
echo 아무 키나 누르면 이 창이 닫힙니다...
pause >nul 