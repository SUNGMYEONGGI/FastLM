import psutil

def stop_monitor():
    # monitor.py 프로세스 찾기
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if proc.info['cmdline'] and 'python' in proc.info['cmdline'][0] and 'monitor.py' in proc.info['cmdline'][1:]:
                print(f"monitor.py 프로세스(PID: {proc.pid})를 종료합니다...")
                proc.terminate()  # 프로세스 종료
                proc.wait(5)      # 최대 5초 대기
                print("monitor.py가 종료되었습니다.")
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    print("실행 중인 monitor.py를 찾을 수 없습니다.")
    return False

if __name__ == "__main__":
    stop_monitor() 