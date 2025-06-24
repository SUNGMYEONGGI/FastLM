from apscheduler.schedulers.background import BackgroundScheduler
import sqlite3
from datetime import datetime

def check_scheduled_jobs():
    print("\n=== 현재 스케줄러에 등록된 작업 목록 ===")
    
    # 스케줄러 초기화
    scheduler = BackgroundScheduler()
    scheduler.start()
    
    try:
        # DB에서 예약된 공지 조회
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT n.id, n.message, n.run_date, n.status, w.name as workspace_name
                FROM notices n
                JOIN workspaces w ON n.workspace_id = w.id
                WHERE n.status = '예약됨'
                AND n.run_date > datetime('now')
                ORDER BY n.run_date ASC
            ''')
            notices = cursor.fetchall()
            
            print(f"\n총 예약된 공지 수: {len(notices)}")
            print("\n=== 예약된 공지 상세 정보 ===")
            
            for notice in notices:
                notice_id, message, run_date, status, workspace_name = notice
                
                # 메시지 유형 판별
                notice_type = "기타"
                if "입실 안내" in message:
                    notice_type = "입실"
                elif "중간 출석" in message:
                    notice_type = "중간"
                elif "퇴실 안내" in message:
                    notice_type = "퇴실"
                elif "만족도 조사" in message:
                    notice_type = "만족도"
                elif "질문 스레드" in message:
                    notice_type = "질문"
                
                # 실행 예정 시간까지 남은 시간 계산
                run_datetime = datetime.fromisoformat(run_date)
                time_remaining = run_datetime - datetime.now()
                
                print(f"\n공지 ID: {notice_id}")
                print(f"워크스페이스: {workspace_name}")
                print(f"공지 유형: {notice_type}")
                print(f"예약 시간: {run_date}")
                print(f"남은 시간: {time_remaining}")
                print(f"상태: {status}")
                print("-" * 50)
    
    except Exception as e:
        print(f"오류 발생: {str(e)}")
    
    finally:
        scheduler.shutdown()

if __name__ == "__main__":
    check_scheduled_jobs() 