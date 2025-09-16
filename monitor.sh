#!/bin/bash

# FastLM 모니터링 스크립트

LOG_FILE="/var/log/fastlm-monitor.log"
WEBHOOK_URL=""  # 슬랙 웹훅 URL (선택사항)

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | sudo tee -a $LOG_FILE
}

check_service() {
    cd /home/ubuntu/git/FastLM
    
    # Docker Compose 서비스 상태 확인
    if ! docker compose ps | grep -q "Up"; then
        log_message "ERROR: FastLM services are down. Attempting to restart..."
        docker compose down
        sleep 5
        docker compose up -d
        
        if [ $? -eq 0 ]; then
            log_message "SUCCESS: FastLM services restarted successfully"
        else
            log_message "CRITICAL: Failed to restart FastLM services"
            # 슬랙 알림 (선택사항)
            if [ ! -z "$WEBHOOK_URL" ]; then
                curl -X POST -H 'Content-type: application/json' \
                    --data '{"text":"🚨 FastLM 서비스 재시작 실패!"}' \
                    $WEBHOOK_URL
            fi
        fi
    fi
    
    # 웹사이트 응답 확인
    if ! curl -f -s http://new.fastlm.site > /dev/null; then
        log_message "WARNING: Website not responding"
    fi
    
    # 디스크 사용량 확인
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        log_message "WARNING: Disk usage is ${DISK_USAGE}%"
    fi
    
    # 메모리 사용량 확인
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEMORY_USAGE -gt 90 ]; then
        log_message "WARNING: Memory usage is ${MEMORY_USAGE}%"
    fi
}

# 메인 실행
check_service

