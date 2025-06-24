import sqlite3
from werkzeug.security import generate_password_hash
import os
from datetime import datetime

def reset_users():
    try:
        db_path = 'workspace.db'
        
        # 데이터베이스 백업
        backup_path = f'workspace_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.db'
        
        print("\n데이터베이스 백업 중...")
        if os.path.exists(db_path):
            with open(db_path, 'rb') as src, open(backup_path, 'wb') as dst:
                dst.write(src.read())
            print(f"백업 완료: {backup_path}")
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # 기존 사용자 수 확인
            cursor.execute('SELECT COUNT(*) FROM users')
            user_count = cursor.fetchone()[0]
            print(f"\n현재 등록된 사용자 수: {user_count}")
            
            # user_workspace_access 테이블 초기화
            print("\n사용자-워크스페이스 접근 권한 초기화 중...")
            cursor.execute('DELETE FROM user_workspace_access')
            
            # users 테이블 초기화
            print("사용자 테이블 초기화 중...")
            cursor.execute('DELETE FROM users')
            
            # 관리자 계정 생성
            admin_email = 'gijun.park@day1company.co.kr'
            admin_password = 'rlwns1'
            hashed_password = generate_password_hash(admin_password)
            
            print("\n관리자 계정 생성 중...")
            cursor.execute('''
                INSERT INTO users (username, password, is_admin, status) 
                VALUES (?, ?, ?, ?)
            ''', (admin_email, hashed_password, 1, 'approved'))
            
            conn.commit()
            
            # 생성된 관리자 계정 확인
            cursor.execute('''
                SELECT id, username, is_admin, status, created_at 
                FROM users 
                WHERE username = ?
            ''', (admin_email,))
            admin = cursor.fetchone()
            
            print("\n관리자 계정이 성공적으로 생성되었습니다:")
            print(f"ID: {admin[0]}")
            print(f"Username: {admin[1]}")
            print(f"Is Admin: {admin[2]}")
            print(f"Status: {admin[3]}")
            print(f"Created At: {admin[4]}")
            
            print("\n초기화 완료!")
            print(f"백업 파일: {backup_path}")
            print("관리자 계정 정보:")
            print(f"이메일: {admin_email}")
            print(f"비밀번호: {admin_password}")
            
    except sqlite3.Error as e:
        print(f"\n데이터베이스 오류: {e}")
    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()

def confirm_reset():
    print("경고: 이 작업은 모든 사용자 계정을 삭제하고 초기화합니다.")
    print("데이터베이스는 백업되지만, 이 작업은 되돌릴 수 없습니다.")
    response = input("\n정말로 모든 사용자 계정을 초기화하시겠습니까? (yes/no): ")
    return response.lower() == 'yes'

if __name__ == "__main__":
    if confirm_reset():
        reset_users()
    else:
        print("\n작업이 취소되었습니다.") 