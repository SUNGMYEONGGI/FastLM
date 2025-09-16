#!/bin/bash

# FastLM Supervisor 시작 스크립트

set -e

cd /home/ubuntu/git/FastLM

# 기존 컨테이너 정리
docker compose down 2>/dev/null || true

# 새로운 그룹 권한 적용
newgrp docker << EOF
# Docker Compose 시작
docker compose up -d

# 서비스가 정상적으로 시작될 때까지 대기
echo "서비스 시작 대기 중..."
sleep 30

# 헬스 체크
for i in {1..10}; do
    if curl -f http://localhost/api/health 2>/dev/null; then
        echo "FastLM 서비스가 정상적으로 시작되었습니다."
        break
    fi
    if [ \$i -eq 10 ]; then
        echo "서비스 시작 실패"
        exit 1
    fi
    sleep 5
done

# 서비스 유지를 위한 무한 루프
while true; do
    if ! docker compose ps | grep -q "Up"; then
        echo "서비스가 중단되었습니다. 재시작 중..."
        docker compose up -d
    fi
    sleep 30
done
EOF
