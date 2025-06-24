import sqlite3
from datetime import datetime

def list_workspaces():
    """사용 가능한 워크스페이스 목록 출력"""
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, name FROM workspaces ORDER BY id')
            workspaces = cursor.fetchall()
            
            if not workspaces:
                print("\n등록된 워크스페이스가 없습니다.")
                return None
            
            print("\n=== 워크스페이스 목록 ===")
            for workspace in workspaces:
                print(f"ID: {workspace[0]} | 이름: {workspace[1]}")
            return workspaces
                
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        return None

def read_workspace_notices(workspace_id):
    """특정 워크스페이스의 공지 조회"""
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # 워크스페이스 확인
            cursor.execute('SELECT name FROM workspaces WHERE id = ?', (workspace_id,))
            workspace = cursor.fetchone()
            
            if not workspace:
                print(f"\n워크스페이스 ID {workspace_id}를 찾을 수 없습니다.")
                return
            
            print(f"\n=== 워크스페이스: {workspace[0]} (ID: {workspace_id}) ===")
            
            # 해당 워크스페이스의 공지 조회
            cursor.execute('''
                SELECT id, message, run_date, status
                FROM notices 
                WHERE workspace_id = ?
                ORDER BY run_date
            ''', (workspace_id,))
            notices = cursor.fetchall()
            
            if not notices:
                print("\n예약된 공지가 없습니다.")
                return
            
            print(f"\n총 {len(notices)}개의 공지:")
            for notice in notices:
                notice_id, message, run_date, status = notice
                print(f"\nID: {notice_id}")
                print(f"상태: {status}")
                print(f"예약시간: {run_date}")
                print(f"메시지: {message[:100]}...")  # 메시지 앞부분만 출력
                print("-" * 50)  # 구분선 추가
                
    except Exception as e:
        print(f"오류 발생: {str(e)}")

def main():
    while True:
        workspaces = list_workspaces()
        if not workspaces:
            break
            
        try:
            workspace_id = input("\n워크스페이스 ID를 입력하세요 (종료: q): ")
            if workspace_id.lower() == 'q':
                print("\n프로그램을 종료합니다.")
                break
                
            read_workspace_notices(int(workspace_id))
            
        except ValueError:
            print("올바른 워크스페이스 ID를 입력해주세요.")

if __name__ == "__main__":
    main() 