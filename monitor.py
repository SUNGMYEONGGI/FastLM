import os
import subprocess
import signal
import time
import psutil

# run
# nohup sudo python3 monitor.py > monitor.log 2>&1 &

def is_app_running():
    # app.py 프로세스 확인
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['cmdline'] and 'python' in proc.info['cmdline'][0] and 'app.py' in proc.info['cmdline'][1:]:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

def start_app():
    # app.py 시작
    restart_command = "nohup sudo python3 app.py --port 5020 > app.log 2>&1 &"
    subprocess.run(restart_command, shell=True)
    print("앱을 시작했습니다.")

def monitor_app():
    print("앱 모니터링을 시작합니다...")
    
    while True:
        if not is_app_running():
            print("앱이 실행되고 있지 않습니다. 재시작합니다...")
            start_app()
        time.sleep(10)  # 10초마다 상태 체크

if __name__ == "__main__":
    monitor_app() 