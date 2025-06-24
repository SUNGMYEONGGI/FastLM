import os
import subprocess
import signal
import time

def restart_app():
    try:
        # 1. 현재 실행 중인 모든 app.py 프로세스 찾기
        ps_command = "ps -ef | grep 'python3 app.py' | grep -v grep"
        process = subprocess.Popen(ps_command, shell=True, stdout=subprocess.PIPE)
        output = process.stdout.read().decode()
        
        # 모든 PID 수집
        pids = []
        for line in output.split('\n'):
            if line.strip():
                try:
                    pid = int(line.split()[1])
                    pids.append(pid)
                except (IndexError, ValueError):
                    continue
        
        if pids:
            print(f"Found {len(pids)} running app.py processes: {pids}")
            
            # 모든 프로세스 종료
            for pid in pids:
                try:
                    os.kill(pid, signal.SIGTERM)
                    print(f"Sent termination signal to process {pid}")
                except ProcessLookupError:
                    print(f"Process {pid} already terminated")
                except Exception as e:
                    print(f"Error killing process {pid}: {str(e)}")
            
            # 모든 프로세스가 완전히 종료될 때까지 대기
            time.sleep(5)
            print("Waited for all processes to terminate")
        else:
            print("No running app.py processes found")

        # 2. nohup으로 app.py 재시작
        restart_command = "nohup sudo python3 app.py > app.log 2>&1 &"
        subprocess.run(restart_command, shell=True)
        print("Started new app.py process")
        
        print("Restart completed successfully")
        
    except Exception as e:
        print(f"Error during restart: {str(e)}")

if __name__ == "__main__":
    restart_app() 