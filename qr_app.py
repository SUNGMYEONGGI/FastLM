from flask import Blueprint, render_template, jsonify
import sqlite3
from datetime import datetime
import pandas as pd
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import timezone

qr_bp = Blueprint('qr', __name__)

def init_qr_db():
    """QR 코드 검증용 데이터베이스 초기화"""
    try:
        with sqlite3.connect('qr_verification.db') as conn:
            cursor = conn.cursor()
            
            # 수료증 테이블 생성 - 시트 순서에 맞춤
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS qr_verification (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workspace_id INTEGER NOT NULL,
                    verification_code TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            print("QR 검증용 데이터베이스 초기화 완료")
            
    except Exception as e:
        print(f"QR 데이터베이스 초기화 오류: {str(e)}")
        import traceback
        traceback.print_exc()

def upload_sheet_to_db_simple():
    # 구글 시트를 CSV로 내보내기 URL로 변환
    SHEET_ID = "14gUz1L3N9FeCuY-7UWmTgY18w3OMWD5K66WVGgaZesw"
    CSV_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv"
    
    try:
        # 구글 시트 데이터 읽기
        df = pd.read_csv(CSV_URL)
        
        # 컬럼명 매핑 (시트의 컬럼명이 다른 경우)
        df.columns = ['id', 'student_name', 'issue_date', 'course_code', 
                     'course_name', 'serial_number']
        
        # SQLite DB에 저장
        with sqlite3.connect('certificates.db') as conn:
            df.to_sql('certificates', conn, if_exists='replace', 
                     index=False)
            print(f"{len(df)}개의 레코드가 성공적으로 업로드되었습니다.")
            
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()  # 상세 오류 출력 추가

def init_scheduler(main_scheduler=None):
    """QR 앱의 스케줄러 초기화
    
    Args:
        main_scheduler: 메인 앱에서 전달받은 스케줄러 인스턴스
    """
    if main_scheduler:
        scheduler = main_scheduler
    else:
        scheduler = BackgroundScheduler(timezone=timezone('Asia/Seoul'))
        scheduler.start()

    scheduler.add_job(upload_sheet_to_db_simple, 'cron', hour=18)
    
    return scheduler

@qr_bp.route('/verify/<serial_number>')
def verify_certificate(serial_number):
    try:
        with sqlite3.connect('certificates.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, student_name, issue_date, course_code, 
                       course_name, serial_number 
                FROM certificates 
                WHERE serial_number = ?
            ''', (serial_number,))
            
            result = cursor.fetchone()
            
            if result:
                # 날짜 형식 처리 개선
                try:
                    # 첫 번째 시도: 'YYYY. MM. DD' 형식
                    issue_date = datetime.strptime(result[2], '%Y. %m. %d')
                except ValueError:
                    try:
                        # 두 번째 시도: 'YYYY-MM-DD' 형식
                        issue_date = datetime.strptime(result[2], '%Y-%m-%d')
                    except ValueError:
                        try:
                            # 세 번째 시도: 'YYYY-MM-DD HH:MM:SS' 형식
                            issue_date = datetime.strptime(result[2], '%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            # 날짜 파싱 실패 시 현재 날짜 사용
                            print(f"날짜 파싱 실패: {result[2]}")
                            issue_date = datetime.now()
                
                return render_template('verify_certificate.html',
                    verified=True,
                    id=result[0],
                    student_name=result[1],
                    issue_date=issue_date,
                    course_code=result[3],
                    course_name=result[4],
                    serial_number=result[5],
                    year=datetime.now().year
                )
            else:
                return render_template('verify_certificate.html',
                    verified=False,
                    error="존재하지 않는 수료증입니다.",
                    year=datetime.now().year
                )
    except Exception as e:
        print(f"Error during verification: {str(e)}")
        return render_template('verify_certificate.html',
            verified=False,
            error=f"검증 과정에서 오류가 발생했습니다. ({str(e)})",
            year=datetime.now().year
        )

@qr_bp.route('/update_db', methods=['GET'])
def update_db():
    try:
        # DB 업데이트 실행
        upload_sheet_to_db_simple()
        
        return jsonify({
            "status": "success",
            "message": "데이터베이스가 성공적으로 업데이트되었습니다."
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"업데이트 중 오류 발생: {str(e)}"
        }), 500 