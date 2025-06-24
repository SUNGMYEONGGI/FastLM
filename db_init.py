import sqlite3
from werkzeug.security import generate_password_hash
import os

def init_database():
    print("데이터베이스 초기화 시작...")
    
    # 데이터베이스 파일 경로
    db_path = 'workspace.db'
    
    # 기존 DB 파일이 있다면 백업
    if os.path.exists(db_path):
        backup_path = 'workspace_backup.db'
        print(f"기존 DB 파일 백업: {backup_path}")
        os.rename(db_path, backup_path)
    
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # users 테이블 생성
            cursor.execute('''
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    is_admin INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("users 테이블 생성 완료")
            
            # workspaces 테이블 생성
            cursor.execute('''
                CREATE TABLE workspaces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    attendance_webhook TEXT NOT NULL,
                    operations_webhook TEXT NOT NULL,
                    question_webhook TEXT NOT NULL,
                    entry_time TEXT NOT NULL,
                    mid_time TEXT NOT NULL,
                    exit_time TEXT NOT NULL,
                    qr_image TEXT,
                    zoom_url TEXT NOT NULL,
                    zoom_id TEXT NOT NULL,
                    zoom_pw TEXT NOT NULL,
                    schedule_url TEXT NOT NULL
                )
            ''')
            print("workspaces 테이블 생성 완료")
            
            # notices 테이블 생성
            cursor.execute('''
                CREATE TABLE notices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workspace_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT DEFAULT '예약됨',
                    run_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
                )
            ''')
            print("notices 테이블 생성 완료")
            
            # 기본 관리자 계정 생성
            admin_password = generate_password_hash('your_secure_password')
            cursor.execute('''
                INSERT INTO users (username, password, is_admin, status) 
                VALUES (?, ?, ?, ?)
            ''', ('admin', admin_password, 1, 'approved'))
            print("기본 관리자 계정 생성 완료")
            
            # 인덱스 생성
            cursor.execute('CREATE INDEX idx_notices_workspace ON notices(workspace_id)')
            cursor.execute('CREATE INDEX idx_notices_status ON notices(status)')
            cursor.execute('CREATE INDEX idx_users_username ON users(username)')
            print("인덱스 생성 완료")
            
            conn.commit()
            print("데이터베이스 초기화 완료")
            
            # 테이블 정보 출력
            print("\n=== 테이블 구조 확인 ===")
            for table in ['users', 'workspaces', 'notices']:
                cursor.execute(f"PRAGMA table_info({table})")
                columns = cursor.fetchall()
                print(f"\n{table} 테이블 구조:")
                for col in columns:
                    print(f"- {col[1]} ({col[2]})")
    
    except Exception as e:
        print(f"데이터베이스 초기화 중 오류 발생: {str(e)}")
        # 오류 발생 시 백업 복구
        if os.path.exists(backup_path):
            os.rename(backup_path, db_path)
            print("백업에서 복구됨")
        raise
    
    finally:
        # 성공적으로 완료되면 백업 파일 삭제
        if os.path.exists(backup_path):
            os.remove(backup_path)
            print("백업 파일 삭제됨")

if __name__ == "__main__":
    init_database()