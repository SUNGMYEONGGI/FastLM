import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

def check_and_create_admin():
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            admin_email = 'gijun.park@day1company.co.kr'
            
            # 현재 관리자 계정 확인
            cursor.execute('''
                SELECT id, username, password, is_admin, status, created_at 
                FROM users 
                WHERE username = ?
            ''', (admin_email,))
            admin = cursor.fetchone()
            
            if admin:
                print("\n현재 관리자 계정 정보:")
                print(f"ID: {admin[0]}")
                print(f"Username: {admin[1]}")
                print(f"Is Admin: {admin[3]}")
                print(f"Status: {admin[4]}")
                print(f"Created At: {admin[5]}")
                
                # 관리자 권한 확인 및 업데이트
                if admin[3] != 1:
                    cursor.execute('''
                        UPDATE users 
                        SET is_admin = 1 
                        WHERE username = ?
                    ''', (admin_email,))
                    conn.commit()
                    print("\n관리자 권한이 업데이트되었습니다.")
                
                # 상태가 approved가 아닌 경우 업데이트
                if admin[4] != 'approved':
                    cursor.execute('''
                        UPDATE users 
                        SET status = 'approved' 
                        WHERE username = ?
                    ''', (admin_email,))
                    conn.commit()
                    print("\n계정 상태가 approved로 업데이트되었습니다.")
                
                print("\n기존 관리자 계정이 확인되었습니다. 추가 작업이 필요하지 않습니다.")
                return
            
            # 관리자 계정이 없는 경우 새로 생성
            admin_password = 'rlwns1'
            hashed_password = generate_password_hash(admin_password)
            
            cursor.execute('''
                INSERT INTO users (username, password, is_admin, status) 
                VALUES (?, ?, ?, ?)
            ''', (admin_email, hashed_password, 1, 'approved'))
            
            conn.commit()
            print("\n새로운 관리자 계정이 생성되었습니다:")
            print(f"이메일: {admin_email}")
            print(f"비밀번호: {admin_password}")
            
            # 생성된 계정 확인
            cursor.execute('''
                SELECT id, username, password, is_admin, status, created_at 
                FROM users 
                WHERE username = ?
            ''', (admin_email,))
            new_admin = cursor.fetchone()
            print("\n생성된 관리자 계정 정보:")
            print(f"ID: {new_admin[0]}")
            print(f"Username: {new_admin[1]}")
            print(f"Is Admin: {new_admin[3]}")
            print(f"Status: {new_admin[4]}")
            print(f"Created At: {new_admin[5]}")
            
    except sqlite3.Error as e:
        print(f"\n데이터베이스 오류: {e}")
    except Exception as e:
        print(f"\n오류 발생: {e}")

if __name__ == "__main__":
    check_and_create_admin()