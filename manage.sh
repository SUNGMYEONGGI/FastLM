#!/bin/bash

# FastLM 관리 스크립트

case "$1" in
    start)
        echo "🚀 FastLM 서비스 시작 중..."
        sudo supervisorctl start fastlm
        echo "✅ FastLM 서비스가 시작되었습니다."
        ;;
    stop)
        echo "🛑 FastLM 서비스 중단 중..."
        sudo supervisorctl stop fastlm
        docker compose down
        echo "✅ FastLM 서비스가 중단되었습니다."
        ;;
    restart)
        echo "🔄 FastLM 서비스 재시작 중..."
        docker compose down
        docker compose up -d --build
        echo "✅ FastLM 서비스가 재시작되었습니다."
        ;;
    status)
        echo "📊 FastLM 서비스 상태:"
        docker compose ps
        echo ""
        echo "🌐 웹사이트 상태:"
        curl -I http://new.fastlm.site 2>/dev/null | head -1 || echo "❌ 웹사이트 접속 불가"
        ;;
    logs)
        echo "📝 FastLM 로그:"
        docker compose logs -f
        ;;
    update)
        echo "🔄 FastLM 업데이트 중..."
        git pull
        docker compose down
        docker compose up -d --build
        echo "✅ FastLM 업데이트가 완료되었습니다."
        ;;
    backup)
        echo "💾 데이터베이스 백업 중..."
        BACKUP_DIR="/home/ubuntu/fastlm-backups"
        mkdir -p $BACKUP_DIR
        docker compose exec backend cp /app/instance/fastlm.db /tmp/
        docker cp fastlm-backend:/tmp/fastlm.db $BACKUP_DIR/fastlm-$(date +%Y%m%d-%H%M%S).db
        echo "✅ 백업 완료: $BACKUP_DIR"
        ;;
    monitor)
        echo "🔍 시스템 모니터링:"
        ./monitor.sh
        ;;
    *)
        echo "FastLM 관리 스크립트"
        echo ""
        echo "사용법: $0 {start|stop|restart|status|logs|update|backup|monitor}"
        echo ""
        echo "명령어:"
        echo "  start    - 서비스 시작"
        echo "  stop     - 서비스 중단"
        echo "  restart  - 서비스 재시작"
        echo "  status   - 서비스 상태 확인"
        echo "  logs     - 로그 확인"
        echo "  update   - 코드 업데이트 및 재배포"
        echo "  backup   - 데이터베이스 백업"
        echo "  monitor  - 시스템 모니터링 실행"
        exit 1
        ;;
esac

