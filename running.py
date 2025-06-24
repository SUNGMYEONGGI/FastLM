import subprocess
import time
import psutil

def is_process_running(process_name):
    for proc in psutil.process_iter(['name']):
        try:
            if process_name in proc.info['name']:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

def main():
    while True:
        if not is_process_running('python3'):  # app.py가 실행중인지 확인
            print("app.py가 종료되었습니다. 재시작합니다...")
            subprocess.run(['sudo', 'python3', 'app.py'])
        time.sleep(10)  # 10초마다 확인

if __name__ == "__main__":
    main()