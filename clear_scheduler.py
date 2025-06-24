import sqlite3
from pytz import timezone
from apscheduler.schedulers.background import BackgroundScheduler

# 스케줄러 초기화 (app.py와 동일한 설정)
scheduler = BackgroundScheduler(timezone=timezone('Asia/Seoul'))
scheduler.start()

def list_and_clear_jobs():
    try:
        # 현재 스케줄러에 등록된 모든 작업 조회
        jobs = scheduler.get_jobs()
        
        if not jobs:
            print("\n등록된 스케줄러 작업이 없습니다.")
            return
            
        print(f"\n=== 현재 등록된 스케줄러 작업 목록 ({len(jobs)}개) ===")
        for job in jobs:
            print(f"\nJob ID: {job.id}")
            print(f"다음 실행 시간: {job.next_run_time}")
            
        # 사용자 확인
        confirm = input("\n모든 스케줄러 작업을 제거하시겠습니까? (y/n): ")
        if confirm.lower() != 'y':
            print("작업이 취소되었습니다.")
            return
            
        # 모든 작업 제거
        scheduler.remove_all_jobs()
        print("\n모든 스케줄러 작업이 제거되었습니다.")
        
    except Exception as e:
        print(f"오류 발생: {str(e)}")

if __name__ == "__main__":
    try:
        list_and_clear_jobs()
    finally:
        scheduler.shutdown() 