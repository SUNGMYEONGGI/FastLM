#!/bin/bash

# 파일 변경 감지 및 자동 재배포 스크립트

echo "🔍 FastLM 파일 변경 감지 시작..."
echo "종료하려면 Ctrl+C를 누르세요."

# inotify-tools 설치 확인
if ! command -v inotifywait &> /dev/null; then
    echo "📦 inotify-tools 설치 중..."
    sudo apt update && sudo apt install -y inotify-tools
fi

# 변경 감지 대상 디렉토리
WATCH_DIRS=(
    "FastLM-Backend"
    "Fastlm-Fronte/src"
    "Fastlm-Fronte/index.html"
    "Fastlm-Fronte/nginx.conf"
)

# 마지막 재배포 시간 추적
LAST_DEPLOY=0
DEPLOY_COOLDOWN=10  # 10초 쿨다운

deploy() {
    local current_time=$(date +%s)
    
    # 쿨다운 체크
    if [ $((current_time - LAST_DEPLOY)) -lt $DEPLOY_COOLDOWN ]; then
        echo "⏳ 쿨다운 중... $(($DEPLOY_COOLDOWN - (current_time - LAST_DEPLOY)))초 대기"
        return
    fi
    
    echo "🔄 변경 감지! 재배포 시작..."
    ./manage.sh restart
    
    if [ $? -eq 0 ]; then
        echo "✅ 재배포 완료! $(date)"
        LAST_DEPLOY=$current_time
    else
        echo "❌ 재배포 실패!"
    fi
}

# 파일 변경 감지
inotifywait -m -r -e modify,create,delete,move \
    --include '\.(py|tsx?|jsx?|html|css|json|conf)$' \
    "${WATCH_DIRS[@]}" 2>/dev/null |
while read path action file; do
    echo "📝 파일 변경: $path$file ($action)"
    deploy
done

