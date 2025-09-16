#!/bin/bash

# FastLM 배포 스크립트

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 FastLM 배포를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
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

# Docker 및 Docker Compose 설치 확인
check_dependencies() {
    log_info "의존성 확인 중..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되어 있지 않습니다."
        log_info "Docker 설치: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose가 설치되어 있지 않습니다."
        log_info "Docker Compose 설치: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    log_success "의존성 확인 완료"
}

# 환경 변수 파일 생성
setup_env() {
    log_info "환경 변수 설정 중..."
    
    if [ ! -f ".env" ]; then
        log_warning ".env 파일이 없습니다. env.example에서 복사합니다."
        cp env.example .env
        log_warning "⚠️  .env 파일을 편집하여 보안 키를 변경해주세요!"
    fi
    
    log_success "환경 변수 설정 완료"
}

# 기존 컨테이너 정리
cleanup_containers() {
    log_info "기존 컨테이너 정리 중..."
    
    if docker compose ps -q | grep -q .; then
        docker compose down
        log_success "기존 컨테이너 중단 완료"
    fi
}

# 이미지 빌드
build_images() {
    log_info "Docker 이미지 빌드 중..."
    
    docker compose build --no-cache
    
    log_success "이미지 빌드 완료"
}

# 서비스 시작
start_services() {
    log_info "서비스 시작 중..."
    
    docker compose up -d
    
    log_success "서비스 시작 완료"
}

# 헬스 체크
health_check() {
    log_info "서비스 상태 확인 중..."
    
    # 백엔드 헬스 체크 (최대 60초 대기)
    for i in {1..12}; do
        if docker compose exec -T backend curl -f http://localhost:5000/api/health 2>/dev/null; then
            log_success "백엔드 서비스가 정상 동작 중입니다"
            break
        fi
        if [ $i -eq 12 ]; then
            log_error "백엔드 서비스 헬스 체크 실패"
            docker compose logs backend
            exit 1
        fi
        log_info "백엔드 서비스 시작 대기 중... ($i/12)"
        sleep 5
    done
    
    # 프론트엔드 헬스 체크
    for i in {1..12}; do
        if curl -f http://localhost 2>/dev/null; then
            log_success "프론트엔드 서비스가 정상 동작 중입니다"
            break
        fi
        if [ $i -eq 12 ]; then
            log_error "프론트엔드 서비스 헬스 체크 실패"
            docker compose logs frontend
            exit 1
        fi
        log_info "프론트엔드 서비스 시작 대기 중... ($i/12)"
        sleep 5
    done
}

# 서비스 정보 출력
show_service_info() {
    echo ""
    echo "🎉 FastLM 배포가 완료되었습니다!"
    echo ""
    echo "📋 서비스 정보:"
    echo "  • 웹 애플리케이션: http://localhost"
    echo "  • 백엔드 API: http://localhost/api"
    echo ""
    echo "👤 관리자 계정:"
    echo "  • 이메일: admin@day1company.co.kr"
    echo "  • 비밀번호: Camp1017!!"
    echo ""
    echo "📊 서비스 상태 확인:"
    echo "  docker compose ps"
    echo ""
    echo "📝 로그 확인:"
    echo "  docker compose logs -f"
    echo ""
    echo "🛑 서비스 중단:"
    echo "  docker compose down"
    echo ""
}

# 메인 실행
main() {
    check_dependencies
    setup_env
    cleanup_containers
    build_images
    start_services
    health_check
    show_service_info
}

# 스크립트 실행
main "$@"
