import sqlite3

def update_database():
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # 기존 테이블 백업
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users_backup AS 
                SELECT * FROM users
            ''')
            
            # 기존 테이블 삭제
            cursor.execute('DROP TABLE users')
            
            # 새로운 구조로 테이블 생성
            cursor.execute('''
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    is_admin BOOLEAN NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'pending'
                )
            ''')
            
            # 백업에서 데이터 복원
            cursor.execute('''
                INSERT INTO users (id, username, password, is_admin, status)
                SELECT id, username, password, is_admin, status FROM users_backup
            ''')
            
            # 백업 테이블 삭제
            cursor.execute('DROP TABLE users_backup')
            
            conn.commit()
            print("데이터베이스 구조가 성공적으로 업데이트되었습니다.")
            
    except sqlite3.Error as e:
        print(f"데이터베이스 오류: {e}")
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    update_database() 