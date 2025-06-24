import sqlite3
from pytz import timezone
from apscheduler.schedulers.background import BackgroundScheduler
import json
import os

# 스케줄러 초기화
scheduler = BackgroundScheduler(timezone=timezone('Asia/Seoul'))
scheduler.start()

def delete_workspace_notices(workspace_id):
    try:
        # 데이터베이스 연결
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # 워크스페이스 이름 확인
            cursor.execute('SELECT name FROM workspaces WHERE id = ?', (workspace_id,))
            workspace = cursor.fetchone()
            
            if not workspace:
                print(f"워크스페이스 ID {workspace_id}를 찾을 수 없습니다.")
                return
                
            print(f"\n워크스페이스: {workspace[0]} (ID: {workspace_id})")
            
            # 예약된 공지 조회
            cursor.execute('''
                SELECT id, message, run_date, status
                FROM notices 
                WHERE workspace_id = ? AND status = "예약됨"
                ORDER BY run_date
            ''', (workspace_id,))
            notices = cursor.fetchall()
            
            if not notices:
                print("삭제할 예약 공지가 없습니다.")
                return
                
            # 예약된 공지 목록 출력
            print(f"\n삭제될 예약 공지 목록 ({len(notices)}개):")
            for notice in notices:
                print(f"ID: {notice[0]} | 상태: {notice[3]} | 예약시간: {notice[2]} | 메시지: {notice[1][:50]}...")
                
            # 사용자 확인
            confirm = input("\n위 공지들을 모두 삭제하시겠습니까? (y/n): ")
            if confirm.lower() != 'y':
                print("작업이 취소되었습니다.")
                return
            
            # 1. 스케줄러에서 작업 제거
            for notice in notices:
                job_id = f"notice_{notice[0]}"
                if scheduler.get_job(job_id):
                    scheduler.remove_job(job_id)
                    print(f"스케줄러에서 작업 제거됨: {job_id}")

            # 2. DB에서 공지 삭제
            cursor.execute('''
                DELETE FROM notices 
                WHERE workspace_id = ? AND status = "예약됨"
            ''', (workspace_id,))
            deleted_count = cursor.rowcount
            conn.commit()
            print(f"\nDB에서 {deleted_count}개의 공지가 삭제되었습니다.")

            print(f"\n총 {len(notices)}개의 예약 공지가 완전히 삭제되었습니다.")
            
    except Exception as e:
        print(f"오류 발생: {str(e)}")

def list_workspaces():
    """사용 가능한 워크스페이스 목록 출력"""
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, name FROM workspaces ORDER BY id')
            workspaces = cursor.fetchall()
            
            if not workspaces:
                print("등록된 워크스페이스가 없습니다.")
                return
            
            print("\n사용 가능한 워크스페이스 목록:")
            for workspace in workspaces:
                print(f"ID: {workspace[0]} | 이름: {workspace[1]}")
                
    except Exception as e:
        print(f"오류 발생: {str(e)}")

if __name__ == "__main__":
    while True:
        print("\n=== 예약 공지 일괄 삭제 도구 ===")
        list_workspaces()
        
        try:
            workspace_id = input("\n워크스페이스 ID를 입력하세요 (종료: q): ")
            if workspace_id.lower() == 'q':
                print("프로그램을 종료합니다.")
                break
                
            delete_workspace_notices(int(workspace_id))
            
        except ValueError:
            print("올바른 워크스페이스 ID를 입력해주세요.")
    
    # 프로그램 종료 시 스케줄러 종료
    scheduler.shutdown()