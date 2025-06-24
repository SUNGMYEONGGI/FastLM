import sqlite3

def check_admin_account():
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # 관리자 계정 조회
            cursor.execute('SELECT * FROM users WHERE username = ?', ('gijun.park@day1company.co.kr',))
            user = cursor.fetchone()
            
            if user:
                print("관리자 계정 정보:")
                print(f"ID: {user[0]}")
                print(f"Username: {user[1]}")
                print(f"Password: {user[2]}")  # 해시된 비밀번호
                print(f"Is Admin: {user[3]}")
                print(f"Status: {user[4]}")
            else:
                print("관리자 계정을 찾을 수 없습니다.")
            
    except sqlite3.Error as e:
        print(f"데이터베이스 오류: {e}")
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    check_admin_account() 