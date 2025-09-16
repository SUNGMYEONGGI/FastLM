#!/bin/bash

# FastLM 개발 환경 실행 스크립트

set -e

echo "🛠️  FastLM 개발 환경을 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Python 가상환경 확인 및 생성
setup_backend() {
    log_info "백엔드 환경 설정 중..."
    
    cd FastLM-Backend
    
    if [ ! -d "venv" ]; then
        log_info "Python 가상환경 생성 중..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    log_info "Python 패키지 설치 중..."
    pip install -r requirements.txt
    
    log_success "백엔드 환경 설정 완료"
    cd ..
}

# Node.js 패키지 설치
setup_frontend() {
    log_info "프론트엔드 환경 설정 중..."
    
    cd Fastlm-Fronte
    
    if [ ! -d "node_modules" ]; then
        log_info "Node.js 패키지 설치 중..."
        npm install
    fi
    
    log_success "프론트엔드 환경 설정 완료"
    cd ..
}

# 개발 서버 실행
start_dev_servers() {
    log_info "개발 서버 시작 중..."
    
    # 백엔드 서버 백그라운드 실행
    cd FastLM-Backend
    source venv/bin/activate
    export FLASK_ENV=development
    export FLASK_DEBUG=1
    python app.py &
    BACKEND_PID=$!
    cd ..
    
    # 잠시 대기
    sleep 3
    
    # 프론트엔드 개발 서버 실행
    cd Fastlm-Fronte
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    log_success "개발 서버가 시작되었습니다!"
    echo ""
    echo "📋 개발 서버 정보:"
    echo "  • 프론트엔드: http://localhost:5173"
    echo "  • 백엔드: http://localhost:5000"
    echo ""
    echo "🛑 서버 중단: Ctrl+C"
    echo ""
    
    # 종료 시그널 처리
    trap 'log_info "서버를 종료합니다..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT TERM
    
    # 서버들이 실행 중인지 확인
    wait
}

# 메인 실행
main() {
    setup_backend
    setup_frontend
    start_dev_servers
}

# 스크립트 실행
main "$@"
