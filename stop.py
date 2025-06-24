import os
import subprocess
import signal
import time

def restart_app():
    try:
        # 1. 현재 실행 중인 app.py 프로세스 찾기
        ps_command = "ps -ef | grep 'python3 app.py' | grep -v grep"
        process = subprocess.Popen(ps_command, shell=True, stdout=subprocess.PIPE)
        output = process.stdout.read().decode()
        
        if output:
            # PID 추출
            pid = int(output.split()[1])
            print(f"Found running app.py process with PID: {pid}")
            
            # 프로세스 종료
            os.kill(pid, signal.SIGTERM)
            print("Sent termination signal to the process")
            
            # 프로세스가 완전히 종료될 때까지 대기
            time.sleep(5)
            print("Waited for process termination")
        else:
            print("No running app.py process found")

    except Exception as e:
        print(f"Error during restart: {str(e)}")

if __name__ == "__main__":
    restart_app() 