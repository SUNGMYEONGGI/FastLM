# Gunicorn 설정 파일
import os

# 서버 소켓
bind = "0.0.0.0:5000"
backlog = 2048

# 워커 프로세스
workers = int(os.getenv('GUNICORN_WORKERS', 4))
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# 재시작
max_requests = 1000
max_requests_jitter = 50
preload_app = True

# 로깅
accesslog = "-"
errorlog = "-"
loglevel = os.getenv('LOG_LEVEL', 'info').lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# 프로세스 이름
proc_name = 'fastlm-backend'

# 보안
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# 성능
preload_app = True
