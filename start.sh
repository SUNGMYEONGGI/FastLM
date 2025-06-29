#!/bin/bash

echo "🚀 FastLM 프로젝트 시작 중..."
echo "==============================================="

# 현재 디렉토리 저장
CURRENT_DIR=$(pwd)

# 백엔드 실행 함수
start_backend() {
    echo "📡 백엔드 서버 시작 중..."
    cd "$CURRENT_DIR/FastLM-Backend"
    
    # 가상환경이 없으면 생성
    if [ ! -d "venv" ]; then
        echo "🔧 가상환경 생성 중..."
        python3 -m venv venv
    fi
    
    # 가상환경 활성화
    source venv/bin/activate
    
    # 패키지 설치
    echo "📦 패키지 설치 중..."
    pip install -r requirements.txt
    
    # 백엔드 서버 실행
    echo "✅ 백엔드 서버 실행 (http://localhost:5000)"
    python app.py &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
}

# 프론트엔드 실행 함수
start_frontend() {
    echo "🎨 프론트엔드 서버 시작 중..."
    cd "$CURRENT_DIR/Fastlm-Fronte"
    
    # node_modules가 없으면 설치
    if [ ! -d "node_modules" ]; then
        echo "📦 npm 패키지 설치 중..."
        npm install
    fi
    
    # 프론트엔드 서버 실행
    echo "✅ 프론트엔드 서버 실행 (http://localhost:5173)"
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
}

# 정리 함수
cleanup() {
    echo ""
    echo "🛑 서버 종료 중..."
    
    if [ -f "$CURRENT_DIR/FastLM-Backend/backend.pid" ]; then
        kill $(cat "$CURRENT_DIR/FastLM-Backend/backend.pid") 2>/dev/null
        rm "$CURRENT_DIR/FastLM-Backend/backend.pid"
    fi
    
    if [ -f "$CURRENT_DIR/Fastlm-Fronte/frontend.pid" ]; then
        kill $(cat "$CURRENT_DIR/Fastlm-Fronte/frontend.pid") 2>/dev/null
        rm "$CURRENT_DIR/Fastlm-Fronte/frontend.pid"
    fi
    
    echo "✅ 모든 서버가 종료되었습니다."
    exit 0
}

# Ctrl+C 처리
trap cleanup SIGINT

# 백엔드와 프론트엔드 실행
start_backend
sleep 3
start_frontend

echo ""
echo "🎉 FastLM 프로젝트가 성공적으로 시작되었습니다!"
echo "==============================================="
echo "📡 백엔드: http://localhost:5000"
echo "🎨 프론트엔드: http://localhost:5173"
echo ""
echo "🔑 기본 관리자 계정:"
echo "   이메일: admin@day1company.co.kr"
echo "   비밀번호: Camp1017!!"
echo ""
echo "⏹️  종료하려면 Ctrl+C를 누르세요"
echo "==============================================="

# 사용자가 Ctrl+C를 누를 때까지 대기
wait 