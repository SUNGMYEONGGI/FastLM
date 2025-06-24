import sqlite3
from flask import Flask, render_template, request, redirect, url_for, flash, session, send_file, send_from_directory, jsonify
from slack_sdk.webhook import WebhookClient
import requests
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import markdown
from markupsafe import Markup  
from werkzeug.utils import secure_filename
import os
import io
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from pytz import timezone
from qr_app import qr_bp, init_qr_db, init_scheduler
import json
import logging
import hmac
import hashlib
import traceback
import base64
from ninehire_bp import ninehire_bp

# 로깅 설정
logging.basicConfig(
    filename='/var/log/fastlm/out.log',
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s'
)

scheduler = BackgroundScheduler(timezone=timezone('Asia/Seoul'))

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # 플래시 메시지를 위해 필요

ADMIN_PASSWORD = "123"
app.register_blueprint(qr_bp)  # URL prefix가 없는 경우
app.register_blueprint(ninehire_bp)  # NineHire Blueprint 등록

# 파일 업로드 설정
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates', 'qr')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# QR 이미지 저장 디렉토리 생성 함수 추가
def ensure_upload_directory():
    """QR 이미지 저장 디렉토리 생성 함수"""
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        try:
            os.makedirs(app.config['UPLOAD_FOLDER'])
            print(f"Upload directory created: {app.config['UPLOAD_FOLDER']}")
        except Exception as e:
            print(f"Error creating upload directory: {str(e)}")
            raise
    else:
        print(f"Upload directory exists: {app.config['UPLOAD_FOLDER']}")

# SQLite 데이터베이스 초기화 함수
def init_db():
    print("데이터베이스 초기화 시작")  # 디버깅 로그
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # users 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    is_admin INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # ���존 테이블 구조 확인
            cursor.execute('PRAGMA table_info(users)')
            existing_columns = [column[1] for column in cursor.fetchall()]
            print(f"기존 컬럼: {existing_columns}")  # 디버깅 로그
            
            # 필요한 컬럼 추가
            required_columns = {
                'status': 'TEXT DEFAULT "pending"',
                'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                'is_admin': 'INTEGER DEFAULT 0'
            }
            
            for column, type_def in required_columns.items():
                if column not in existing_columns:
                    try:
                        cursor.execute(f'ALTER TABLE users ADD COLUMN {column} {type_def}')
                        print(f"컬럼 추가됨: {column}")  # 디버깅 로그
                    except sqlite3.OperationalError as e:
                        print(f"컬럼 추가 실패 ({column}): {str(e)}")  # 디버깅 로그
            
            # 기본 관리자 계정 확인 및 생성
            cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
            if not cursor.fetchone():
                cursor.execute('''
                    INSERT INTO users (username, password, is_admin, status) 
                    VALUES (?, ?, ?, ?)
                ''', ('admin', generate_password_hash('your_secure_password'), 1, 'approved'))
                print("관리자 계정 생성됨")  # 디버깅 로그
            
            # 사용자-워크스페이스 접근 권한 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_workspace_access (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    workspace_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
                    UNIQUE(user_id, workspace_id)
                )
            ''')
            
            conn.commit()
            print("데이터베이스 초기화 완료")
            
    except Exception as e:
        print(f"데이터베이스 초기화 오류: {str(e)}")
        import traceback
        traceback.print_exc()


# 로그인 필요 데코레이터
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            flash('관리자 권한이 필요합니다.', 'error')
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function
# 홈 화면 라우트 수정
@app.route('/')
@login_required
def home():
    return redirect(url_for('workspace_select'))

@app.route('/workspace_select')
@login_required
def workspace_select():
    user_id = session.get('user_id')
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        # 사용자가 접근할 수 있는 워크스페이스만 선택
        cursor.execute('''
            SELECT w.id, w.name 
            FROM workspaces w
            JOIN user_workspace_access uwa ON w.id = uwa.workspace_id
            WHERE uwa.user_id = ?
        ''', (user_id,))
        workspaces = cursor.fetchall()
    return render_template('workspace_select.html', title="워크스페이스 선택", workspaces=workspaces)

@app.route('/bot_setting')
@login_required
def bot_setting():
    return render_template('bot_setting.html', title="Slack 봇 설정")

# 워크스페이스 선택 라우트
@app.route('/select_workspace', methods=['POST'])
@login_required
def select_workspace():
    workspace_id = request.form['workspace_id']

    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM workspaces WHERE id = ?', (workspace_id,))
        workspace = cursor.fetchone()

    if workspace:
        session['selected_workspace'] = workspace  # 세션에 크스페이스 저장
    else:
        flash('워크스페이스를 선택하지 못했습니.', 'error')

    return redirect(url_for('home'))

# 워크스페이스 선택 해제 라우트
@app.route('/remove_workspace', methods=['POST'])
@login_required
def remove_workspace():
    session.pop('selected_workspace', None)  # 세션에서 워크스페이스 제거
    return '', 204  # 성공적으로 처리되었음을 알리기 위해 상태 코드 204 반환



@app.route('/admin/workspace/register', methods=['GET', 'POST'])
@login_required
@admin_required
def register_workspace():
    if request.method == 'POST':
        try:
            print("파일:", request.files)  # 디버깅
            if 'qr_image' not in request.files:
                return redirect(request.url)
                
            file = request.files['qr_image']
            if file.filename == '':
                return redirect(request.url)
                
            if file and allowed_file(file.filename):
                with sqlite3.connect('workspace.db') as conn:
                    cursor = conn.cursor()
                    # 먼저 워크스페이스 기본 정보 저장
                    cursor.execute('''
                        INSERT INTO workspaces (
                            name, attendance_webhook, operations_webhook, 
                            question_webhook, entry_time, mid_time, exit_time,
                            zoom_url, zoom_id, zoom_pw, schedule_url, qr_image
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        request.form['name'],
                        request.form['attendance_webhook'],
                        request.form['operations_webhook'],
                        request.form['question_webhook'],
                        request.form['entry_time'],
                        request.form['mid_time'],
                        request.form['exit_time'],
                        request.form['zoom_url'],
                        request.form['zoom_id'],
                        request.form['zoom_pw'],
                        request.form['schedule_url'],
                        None  # 임시로 NULL 저장
                    ))
                    
                    workspace_id = cursor.lastrowid
                    print(f"생성된 워크스페이스 ID: {workspace_id}")  # 디버깅
                    
                    # QR 이미지 파일 저장
                    filename = f"qr_{workspace_id}.{file.filename.rsplit('.', 1)[1].lower()}"
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    print(f"저장할 파일 경로: {file_path}")  # 디버깅
                    file.save(file_path)
                    
                    # QR 이미지 파일명 업데이트
                    cursor.execute('UPDATE workspaces SET qr_image = ? WHERE id = ?', 
                                 (filename, workspace_id))
                    conn.commit()
                    print(f"QR 이미지 파일명 업데이트 완료: {filename}")  # 디버깅
                    
                flash('워크스페이스가 성공적으로 등록되었습니다!')
                return redirect(url_for('manage_workspace'))
                    
        except Exception as e:
            print(f"워크스페이스 등록 중 오류: {str(e)}")
            flash('워크스페이스 등록 중 오류가 발생했습니다.')
            
    # GET 요청이거나 POST 요청 실패 시
    return render_template('register_workspace.html', title="워크스페이스 등록")



@app.route('/admin/workspace/manage')
@login_required
@admin_required
def manage_workspace():
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM workspaces')
            workspaces = cursor.fetchall()
            
            # QR 이미지 존재 여부 확인
            for i, workspace in enumerate(workspaces):
                workspace = list(workspace)  # 튜플을 리스트로 변환
                if workspace[8]:  # qr_image 필드
                    qr_path = os.path.join(app.config['UPLOAD_FOLDER'], workspace[8])
                    workspace[8] = workspace[8] if os.path.exists(qr_path) else None
                workspaces[i] = tuple(workspace)  # 다시 튜플로 변환
                
            print("Workspaces data:", workspaces)  # 디버깅용
            
        return render_template('manage_workspace.html', 
                             title="FASTLM", 
                             workspaces=workspaces)
                             
    except Exception as e:
        print(f"워크스페이스 관리 페이지 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        return render_template('manage_workspace.html', 
                             title="FASTLM", 
                             workspaces=[])




# 워크스페이스 수정 페이지
@app.route('/admin/workspace/edit/<int:workspace_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_workspace(workspace_id):
    if request.method == 'POST':
        try:
            # 기존 데이터 가져오기
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT qr_image FROM workspaces WHERE id = ?', (workspace_id,))
                current_qr = cursor.fetchone()[0]

            # 폼 데이터 가져오기
            name = request.form['name']
            attendance_webhook = request.form['attendance_webhook']
            operations_webhook = request.form['operations_webhook']
            question_webhook = request.form['question_webhook']
            entry_time = request.form['entry_time']
            mid_time = request.form['mid_time']
            exit_time = request.form['exit_time']
            zoom_url = request.form['zoom_url']
            zoom_id = request.form['zoom_id']
            zoom_pw = request.form['zoom_pw']
            schedule_url = request.form['schedule_url']

            # QR 이미지 처리
            qr_image = request.files['qr_image']
            qr_filename = current_qr  # 기본값으로 현재 파일명 사용

            if qr_image and allowed_file(qr_image.filename):
                # 기존 QR 이미지 파일 삭제
                if current_qr:
                    old_file_path = os.path.join(app.config['UPLOAD_FOLDER'], current_qr)
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)

                # 새 QR 이미지 저장 (파일명 형식 통일)
                extension = qr_image.filename.rsplit('.', 1)[1].lower()
                qr_filename = f"qr_{workspace_id}.{extension}"  # 파일명 형식 변경
                qr_image.save(os.path.join(app.config['UPLOAD_FOLDER'], qr_filename))

            # DB 업데이트
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE workspaces 
                    SET name=?, attendance_webhook=?, operations_webhook=?, 
                        question_webhook=?, entry_time=?, mid_time=?, exit_time=?, 
                        qr_image=?, zoom_url=?, zoom_id=?, zoom_pw=?, schedule_url=?
                    WHERE id=?
                ''', (name, attendance_webhook, operations_webhook, question_webhook,
                      entry_time, mid_time, exit_time, qr_filename, zoom_url,
                      zoom_id, zoom_pw, schedule_url, workspace_id))
                conn.commit()

            flash('워크스페이스가 성공적으로 수정되었습니다!', 'success')
            return redirect(url_for('manage_workspace'))
            
        except Exception as e:
            print(f"워크스페이스 수정 중 오류: {str(e)}")  # 디버깅용
            flash('워크스페이스 수정 중 오류가 발생했습니다.', 'error')
            return redirect(url_for('edit_workspace', workspace_id=workspace_id))

    # GET 요청 처리
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT name, attendance_webhook, operations_webhook, question_webhook,
                       entry_time, mid_time, exit_time, qr_image, zoom_url,
                       zoom_id, zoom_pw, schedule_url
                FROM workspaces WHERE id = ?
            ''', (workspace_id,))
            workspace_data = cursor.fetchone()

            if workspace_data:
                workspace = {
                    'name': workspace_data[0],
                    'attendance_webhook': workspace_data[1],
                    'operations_webhook': workspace_data[2],
                    'question_webhook': workspace_data[3],
                    'entry_time': workspace_data[4],
                    'mid_time': workspace_data[5],
                    'exit_time': workspace_data[6],
                    'qr_image': workspace_data[7],
                    'zoom_url': workspace_data[8],
                    'zoom_id': workspace_data[9],
                    'zoom_pw': workspace_data[10],
                    'schedule_url': workspace_data[11]
                }
                return render_template('edit_workspace.html', 
                                        workspace=workspace, 
                                        workspace_id=workspace_id,
                                        title="FASTLM")
            else:
                flash('워크스페이스를 찾을 수 없습니다.', 'error')
                return redirect(url_for('manage_workspace'))

    except sqlite3.Error as e:
        flash(f'데이터베이스 오류: {e}', 'error')
        return redirect(url_for('manage_workspace'))

@app.route('/admin/workspace/delete/<int:workspace_id>')
@login_required
@admin_required
def delete_workspace(workspace_id):
    if not session.get('admin_logged_in'):
        flash('관리자 로그인이 필요합니다.', 'error')
        return redirect(url_for('admin_login'))

    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # QR 이미지 파일명 가져오
            cursor.execute('SELECT qr_image FROM workspaces WHERE id = ?', (workspace_id,))
            qr_filename = cursor.fetchone()[0]

            # DB에서 워크스페이스 삭제
            cursor.execute('DELETE FROM workspaces WHERE id = ?', (workspace_id,))
            conn.commit()

            # QR 이미지 파일 삭제
            if qr_filename:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], qr_filename)
                if os.path.exists(file_path):
                    os.remove(file_path)

    except sqlite3.Error as e:
        flash(f'데이터베이 오류: {e}', 'error')
    
    return redirect(url_for('manage_workspace'))

@app.route('/admin/menu')
@login_required
@admin_required
def admin_menu():
    if not session.get('is_admin'):  # 관리자 권한 확인
        flash('관리자 권한이 필요합니다.', 'error')
        return redirect(url_for('home'))
    
    return render_template('admin_menu.html', title="FASTLM")

@app.route('/notices/attendance')
def attendance_notice_page():
    selected_workspace = session.get('selected_workspace')
    workspace_name = selected_workspace[1] if selected_workspace else ""
    return render_template('attendance_notice.html', 
                         title="FASTLM",
                         workspace_name=workspace_name)

@app.route('/notices/attendance', methods=['GET', 'POST'])
def attendance_notice():
    if request.method == 'POST':
        selected_workspace = session.get('selected_workspace')
        if not selected_workspace:
            return redirect(url_for('select_workspace'))

        try:
            # 데이터 가져오기
            attendance_type = request.form['survey_type']
            reservation = request.form['reservation']  # YYYY-MM-DD 형식
            no_image = 1 if request.form.get('no_image') == 'on' else 0  # 체크박스 상태 확인
            
            # 워크스페이스 정보 가져오기
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM workspaces WHERE id = ?', (selected_workspace[0],))
                workspace = cursor.fetchone()

            # 시간 설정
            if workspace[1][:3] == "BDA":
                entry_subject_time = -30
                mid_subject_time = -15
                exit_subject_time = 0
            elif workspace[1] == "DBE 2기":
                entry_subject_time = -15
                mid_subject_time = -10
                exit_subject_time = -15
            elif workspace[1] == "DFE 2기" or workspace[1] == "Upstage AI Lab 5기":
                entry_subject_time = -10
                mid_subject_time = -10
                exit_subject_time = -10
            elif workspace[1] == "DFE 2기" or workspace[1] == "Upstage AI Lab 5기_인턴십":
                entry_subject_time = -10
                mid_subject_time = -10
                exit_subject_time = -10
            elif workspace[1] == "PM 7기" or workspace[1] == "PM 8기":
                entry_subject_time = -10
                mid_subject_time = -10
                exit_subject_time = -10
            else:
                entry_subject_time = -30
                mid_subject_time = -10
                exit_subject_time = -10

            if attendance_type == "입실":
                selected_time = adjust_time(workspace[5], entry_subject_time)  # entry_time에서 30분 전
            elif attendance_type == "중간":
                selected_time = adjust_time(workspace[6], mid_subject_time)
            elif attendance_type == "퇴실":
                selected_time = adjust_time(workspace[7], exit_subject_time)
            else:
                flash('유효하지 않은 출석 유형입니다.', 'error')
                return redirect(url_for('attendance_notice'))

            # 예약 실행 시간 생성
            run_date = datetime.fromisoformat(f"{reservation}T{selected_time}:00")
            
            # 메시지 생성
            message = create_attendance_message(
                attendance_type=attendance_type,
                scheduled_date=reservation,
                entry_time=workspace[5],
                mid_time=workspace[6],
                exit_time=workspace[7],
                zoom_url=workspace[9],
                zoom_id=workspace[10],
                zoom_pw=workspace[11],
                entry_time_minus_10=adjust_time(workspace[5], -10),
                entry_time_plus_10=adjust_time(workspace[5], 10),
                exit_time_minus_10=adjust_time(workspace[7], -10),
                exit_time_plus_10=adjust_time(workspace[7], 10),
                workspace_name=workspace[1],
                schedule_url=workspace[12]
            )

            # DB에 공지 저장
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO notices (workspace_id, message, status, run_date, no_image) 
                    VALUES (?, ?, ?, ?, ?)
                ''', (selected_workspace[0], message, '예약됨', run_date.isoformat(), no_image))
                notice_id = cursor.lastrowid
                conn.commit()
                
            print(f"공지 등록 완료 - ID: {notice_id}, 실행시간: {run_date}, 메시지: {message[:100]}...")  # 디버깅용

            # 메시지 예약
            schedule_slack_message(notice_id, run_date)

            return redirect(url_for('attendance_notice'))

        except Exception as e:
            print(f"공지 등록 중 오류 발생: {str(e)}")
            import traceback
            traceback.print_exc()  # 상세한 오류 정보 출력
            return redirect(url_for('attendance_notice'))

    return render_template('attendance_notice.html', title="FASTLM")




def adjust_time(time_str, minutes_offset):
    """시간 문자열에 분 단위 오프셋을 더하거나 뺍니다."""
    time_obj = datetime.strptime(time_str, "%H:%M")
    adjusted_time = time_obj + timedelta(minutes=minutes_offset)
    return adjusted_time.strftime("%H:%M")


def adjust_time(time_str, minutes_offset):
    """시간 문자열에 분 단위 오프셋을 더하거나 뺍니다."""
    time_obj = datetime.strptime(time_str, "%H:%M")
    adjusted_time = time_obj + timedelta(minutes=minutes_offset)
    return adjusted_time.strftime("%H:%M")


def create_attendance_message(attendance_type, scheduled_date, 
                            entry_time, mid_time, exit_time, 
                            zoom_url, zoom_id, zoom_pw, 
                            entry_time_minus_10, entry_time_plus_10,
                            exit_time_minus_10, exit_time_plus_10, 
                            workspace_name, schedule_url):

    formatted_date = format_date_korean(scheduled_date)
    additional_message = request.form.get('additional_message', '')
    
    # DBE 2기와 테스트 1의 경우 간단한 메시지 포맷 사용 (줌 정보 제외)
    if workspace_name == "DBE 2기":
        if attendance_type == "입실":
            message = f"<!channel> \n*:loudspeaker: {formatted_date} 입실 안내* \n"
            message += f"수강생 여러분, 안녕하세요! \n"
            message += f"좋은 아침입니다 :slightly_smiling_face: \n\n"
            message += f"강의장 출석하신 분들께서는, \n"
            message += f"시간에 맞춰 입실체크 진행해 주시기 바랍니다. \n"
            message += f"*입실시간* : 9:50 ~ 10:10 까지 \n"
            message += f"*퇴실시간* : 18:50 ~ 19:10 까지 \n\n"
            message += f":warning: *지정 시간 외에 QR 체크 시 지각 또는 결석* :warning: 으로 처리됩니다! \n"
            message += f"*출석체크는 항상 강의장 입실 후 본인이 직접 진행하셔야 합니다. \n"
        elif attendance_type == "중간":
            message = f"<!channel> \n*:loudspeaker: {formatted_date} 중간 출석 안내* \n"
            message += f"수강생 여러분, 안녕하세요! \n"
            message += f"좋은 아침입니다 :slightly_smiling_face: \n\n"
            message += f"강의장 출석하신 분들께서는, \n"
            message += f"시간에 맞춰 중간체크 진행해 주시기 바랍니다. \n"
            message += f"*중간시간* : 10:10 \n"
        elif attendance_type == "퇴실":
            message = f"<!channel> \n*:loudspeaker: {formatted_date} 퇴실 안내* \n"
            message += f"수강생 여러분, 안녕하세요! \n"
            message += f"오늘 하루도 고생하셨습니다. :slightly_smiling_face: \n\n"
            message += f"시간에 맞춰 퇴실체크 진행해 주시기 바랍니다. \n"
            message += f"*입실시간* : 9:50 ~ 10:10 까지 \n"
            message += f"*퇴실시간* : 18:50 ~ 19:10 까지 \n"
            message += f":warning: *지정 시간 외에 QR 체크 시 지각 또는 결석* :warning: 으로 처리됩니다! \n"
            message += f"*강의장 퇴실은 19시 이후 가능합니다.*\n"
    elif workspace_name == "Upstage AI Lab 5기_인턴십":
        if attendance_type == "입실":
            message = f"<!channel> \n*{formatted_date} 입실 안내 공지* \n"
            message += f"<@U07MNADMYEB> <@U07LLRH3RHS> <@U07KDS6M68N><@U083B3Y1TNK> <@U07NJ2BU5T4> \n"
            message += f"안녕하세요 여러분!! \n"
            message += f"해당 스레드에 금일 HRD-Net QR 입실 체크 스크린샷을 업데이트 해주시길 바랍니다!!\n\n"
            message += f"오늘도 많은 성장 이루시길 바랍니다!!"  
        elif attendance_type == "퇴실":
            message = f"<!channel> \n*{formatted_date} 퇴실 안내 공지* \n"
            message += f"<@U07MNADMYEB> <@U07LLRH3RHS> <@U07KDS6M68N> <@U083B3Y1TNK> <@U07NJ2BU5T4> \n"
            message += f"해당 스레드에 금일 HRD-Net QR 퇴실 체크 스크린샷을 업데이트 해주시길 바랍니다!!\n\n"
            message += f"오늘 하루도 고생많으셨습니다!!"
    elif workspace_name == "BDA 18기" or workspace_name == "BDA 19기":
                # 다른 워크스페이스용 기존 메시지 포맷 (줌 정보 포함)
        if attendance_type == "입실":
            message = f"<!channel> \n*{formatted_date} 입실 안내 공지* \n"
            message += f"안녕하세요 {workspace_name} 수강생 여러분!! \n"
            message += f"아래 금일 입실 안내 공지 드립니다!\n\n"
            if additional_message:
                message += f"{additional_message}\n\n"
            message += f"> :ballot_box_with_check: *HRD QR 체크 안내* \n"
            message += f"    *입실 QR 시간*: 8:50 ~ 9:00\n\n"
            message += f"> :camera: *줌 스크린샷 안내*\n    *입실 스크린샷 시각*: {entry_time}\n\n"
        elif attendance_type == "중간":
            message = f"<!channel> \n*{formatted_date} 중간 출석 안내 공지* \n"
            message += f"> :camera: *줌 스크린샷 안내*\n    *중간 스크린샷 시각*: {mid_time}\n\n"
        elif attendance_type == "퇴실":
            message = f"<!channel> \n*{formatted_date} 퇴실 안내 공지* \n"
            message += "오늘 하루도 고생 많으셨습니다!\n\n"
            message += f"> :ballot_box_with_check: *HRD QR 체크 안내* \n"
            message += f"    *퇴실 QR 시간*: 18:00 ~ 18:10\n\n"
            message += f"> :camera: *줌 스크린샷 안내*\n    *퇴실 스크린샷 시각*: {exit_time}\n\n"
        message += f"> :clipboard: *ZOOM 회의장 정보*\n"
        message += f"    *줌 링크*: <{zoom_url}|줌 링크 입장>\n    *회의 ID*: {zoom_id}\n    *회의 PW*: {zoom_pw}\n\n"   
    elif workspace_name == "PM 7기" or workspace_name == "테스트 1":
        if attendance_type == "입실":
            message = f":heart: *PM7*\n"
            message += f"*출결 공지*\n"
            message += f":bell: *입실 체크 안내* :bell: <!channel>\n"
            message += f"금일 입실 QR 코드 공유드립니다. 10시 5분까지 아래 QR 코드를 스캔해주세요!\n"
            message += f":grey_exclamation: HRD-Net 앱 실행 > 출석 체크 QR > 스캔\n"
            message += f":exclamation: *입실 QR 코드를 스캔하지 않으면, 퇴실 체크가 불가하며, 결석 처리됩니다* :exclamation:\n"
            message += f":star2: *PM 7기 ZOOM*\n"
            message += f"> *줌 링크*: <{zoom_url}|줌 링크 입장>\n"
            message += f"> *회의 ID*: {zoom_id}\n"
            message += f"> *회의 PW*: {zoom_pw}\n"
            message += f"> 이름 설정 : 'PM7_000'\n"
            message += f"반드시 실명으로 설정 (ex. PM7_김미현)\n"
            message += f":star2: QR 체크 관련 문의사항이 있다면 본 스레드의 댓글로 남겨주세요 (<@U086FGWATTJ>)\n"
        elif attendance_type == "퇴실":
            message = f":heart: *PM7*\n"
            message += f"*출결 공지*\n"
            message += f":bell: *퇴실 체크 안내* :bell: <!channel>\n"
            message += f"금일 입실 QR 코드 공유드립니다. 19시 5분까지 아래 QR 코드를 스캔해주세요!\n"
            message += f":grey_exclamation: HRD-Net 앱 실행 > 출석 체크 QR > 스캔\n"
            message += f":exclamation: * 퇴실 체크를 하지 않을 경우, 결석 처리됩니다* :exclamation:\n"
            message += f":star2: * 오늘의 출석 체크 일정*\n"
            message += f"> ~10시 전후 - QR코드 & 입실 스크린샷~\n"
            message += f"> ~14시 정각 - 중간 스크린샷~\n"
            message += f"> 19시 전후 - QR코드 & 퇴실 스크린샷\n"
            message += f"QR 체크 관련 문의사항이 있다면 본 스레드의 댓글로 남겨주세요 (<@U086FGWATTJ>)\n"
    
  
    else:
        # 다른 워크스페이스용 기존 메시지 포맷 (줌 정보 포함)
        if attendance_type == "입실":
            message = f"<!channel> \n*{formatted_date} 입실 안내 공지* \n"
            message += f"안녕하세요 {workspace_name} 수강생 여러분!! \n"
            message += f"아래 금일 입실 안내 공지 드립니다!\n\n"
            if additional_message:
                message += f"{additional_message}\n\n"
            message += f"> :ballot_box_with_check: *HRD QR 체크 안내* \n"
            message += f"    *입실 QR 시간*: {entry_time_minus_10} ~ {entry_time_plus_10}\n\n"
            message += f"> :camera: *줌 스크린샷 안내*\n    *입실 스크린샷 시각*: {entry_time}\n\n"
        elif attendance_type == "중간":
            message = f"<!channel> \n*{formatted_date} 중간 출석 안내 공지* \n"
            message += f"> :camera: *줌 스크린샷 안내*\n    *중간 스크린샷 시각*: {mid_time}\n\n"
        elif attendance_type == "퇴실":
            message = f"<!channel> \n*{formatted_date} 퇴실 안내 공지* \n"
            message += "오늘 하루도 고생 많으셨습니다!\n\n"
            message += f"> :ballot_box_with_check: *HRD QR 체크 안내* \n"
            message += f"    *퇴실 QR 시간*: {exit_time_minus_10} ~ {exit_time_plus_10}\n\n"
            message += f"> :camera: *줌 스크린샷 안내*\n    *퇴실 스크린샷 시각*: {exit_time}\n\n"
        
        # 줌 정보는 DBE 2기가 아닌 경우에만 추가
        message += f"> :clipboard: *ZOOM 회의장 정보*\n"
        message += f"    *줌 링크*: <{zoom_url}|줌 링크 입장>\n    *회의 ID*: {zoom_id}\n    *회의 PW*: {zoom_pw}\n\n"     
    
    # 입실 공지이고 DBE 2기가 아닌 경우에만 시간표 링크 추가
    if attendance_type == "입실" and workspace_name not in ["DBE 2기", "Upstage AI Lab 5기_인턴십", "PM 7기", "테스트 1"]:
        message += f"> :clock9: *오늘의 시간표*\n    *시간표 링크*: <{schedule_url}|시간표 링크>\n\n"
    
    return message

@app.route('/notices/satisfaction')
def satisfaction_notice_page():
    return render_template('satisfaction_notice.html', title="FASTLM")

@app.route('/notices/satisfaction', methods=['GET', 'POST'])
def satisfaction_notice():
    if request.method == 'POST':
        selected_workspace = session.get('selected_workspace')
        if not selected_workspace:
            return redirect(url_for('select_workspace'))

        # 폼 데이터 가져오기
        workspace_name = selected_workspace[1]
        survey_type = request.form['survey_type']
        module_name = request.form['module_name']
        instructor_name = request.form['instructor_name']
        survey_url = request.form['survey_url']
        deadline = request.form['deadline']
        reservation = request.form['reservation']
        run_date = datetime.fromisoformat(reservation)  # 예약 시간

        # 메시지 생성
        message = create_satisfaction_message(
            survey_type, module_name, instructor_name, survey_url, deadline, workspace_name
        )
        webhook_url = selected_workspace[3]  # 일반 공지 채널 웹훅

        # DB에 공지 저장
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO notices (workspace_id, message, status, run_date) 
                VALUES (?, ?, ?, ?)
            ''', (selected_workspace[0], message, '예약됨', run_date.isoformat()))
            notice_id = cursor.lastrowid  # 마지막으로 삽입된 ID
            conn.commit()

        # 메시지 예약
        schedule_slack_message(notice_id, run_date)

        return redirect(url_for('satisfaction_notice'))

    return render_template('satisfaction_notice.html', title="FASTLM")



def create_satisfaction_message(attendance_type, module_name, instructor_name, survey_url, deadline, workspace_name):

    message = f"<!channel> \n*{attendance_type} 만족도 조사 안내* \n"
    message += f"안녕하세요 {workspace_name} 수강생 여러분!! \n\n"
    message += f"금일 진행한 {instructor_name} 강사님의 {module_name} 강의 만족도 조사에 대한 안내 드리니 해당 조사를 통해 많은 의견 부탁 드립니다!! \n"
    message += f"> :mag: *{attendance_type} 만족도 조사* `필수참여` \n"
    message += f"    * <{survey_url}|{module_name} 만족도 조사 링크>*\n\n"
    message += f"> :bulb: *만족도 조사 제출 기한* \n"
    message += f"     * {format_date_korean_time(deadline)} 까지* \n\n"
    message += f"제출 완료 후에는 :white_check_mark: 이모지 체크주시길 바랍니다!! \n"
    message += f"여러분들의 소중한 의견 기다리겠습니다 :pray:"

    return message


@app.route('/notices/thread', methods=['GET', 'POST'])
def thread_notice():
    if request.method == 'POST':
        selected_workspace = session.get('selected_workspace')
        if not selected_workspace:
            return redirect(url_for('select_workspace'))

        try:
            # 폼 데이터 가져오기
            reservation = request.form['reservation']
            
            # 워크스페이스 정보 가져오기
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM workspaces WHERE id = ?', (selected_workspace[0],))
                workspace = cursor.fetchone()

            # 입실 시간 30분 전으로 설정
            entry_time = workspace[5]  # entry_time
            scheduled_date = reservation.split("T")[0]
            run_date = datetime.fromisoformat(f"{scheduled_date}T{adjust_time(entry_time, -30)}:00")

            # 메시지 생성
            message = create_thread_message(scheduled_date)
            
            print(f"스레드 예약 정보 - 날짜: {scheduled_date}, 실행시간: {run_date}")  # 디버깅용

            # DB에 공지 저장
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO notices (workspace_id, message, status, run_date) 
                    VALUES (?, ?, ?, ?)
                ''', (selected_workspace[0], message, '예약됨', run_date.isoformat()))
                notice_id = cursor.lastrowid
                conn.commit()

            print(f"스레드 공지 등록 완료 - ID: {notice_id}")  # 디버깅용

            # 메시지 예약
            schedule_slack_message(notice_id, run_date)

            return redirect(url_for('thread_notice'))

        except Exception as e:
            print(f"스레드 예약 중 오류 발생: {str(e)}")
            import traceback
            traceback.print_exc()  # 상세한 오류 정보 출력
            return redirect(url_for('thread_notice'))

    return render_template('thread_notice.html', title="FASTLM")

def create_thread_message(scheduled_date):
    """스레드 메시지 생성"""
    formatted_date = format_date_korean(scheduled_date)

    workspace_name = session.get('selected_workspace')[1]
    if workspace_name == "DFE 2기":
        admin_number = "U085EEPTH8B" # 이송제
        lxm_number = "U07LQ4YJFL2" # 김지영
    elif workspace_name == "Upstage AI Lab 4기":
        admin_number = None # 신승현
        lxm_number = "U082E8P3UGM" # 박기준
    elif workspace_name == "Upstage AI Lab 5기":
        admin_number = "U083B3Y1TNK" # 성명기
        lxm_number = "U07NJ2BU5T4"  # 박기준
    elif workspace_name == "Upstage AI Lab 6기":
        admin_number = "U08NURH5B4G" # 이요한
        lxm_number = "U07TU370ZSR" # 박기준
    elif workspace_name == "테스트 1":
        admin_number = "U05N8K9FW20"
        lxm_number = "U05N8K9FW20"
    elif workspace_name == "AI 부트캠프 13기":
        admin_number = "U08H5JRTP6E"
        lxm_number = "U08H5JSN4HG"
    elif workspace_name == "PM 7기":
        admin_number = "U086FGWATTJ"
        lxm_number = "U07M24DPK97"
    elif workspace_name == "AI 부트캠프 14기":
        admin_number = "U08SA12G4MU"
        lxm_number = "U08SA14V3ML"
        lm_number = "U08SA164QLW"
    else:
        admin_number = None
        lxm_number = None

    message = f":speech_balloon: *{formatted_date} 질문 스레드*\n"
    if admin_number == None:
        message += f"<@{lxm_number}>\n"
    elif workspace_name == "AI 부트캠프 14기":
        message += f"<@{admin_number}> <@{lxm_number}> <@{lm_number}>\n" 
    else:
        message += f"<@{admin_number}> <@{lxm_number}>\n"
    message += "궁금한 점은 *댓글*로 달아주세요! (게시물 아닙니다 :woman-gesturing-no:)\n"
    message += "*개인적인 이야기를 제외한 모든 질문은 여기에 남겨 주세요!!*\n"
    message += "DM으로는 모든 문의를 확인하기 어려운 점 양해 부탁드립니다 :pray:"

    return message

def format_date_korean(date_str):
    date = datetime.fromisoformat(date_str)
    weekday_map = ["월", "화", "수", "목", "금", "토", "일"]
    return f"{date.month}월 {date.day}일 {weekday_map[date.weekday()]}요일"

def format_date_korean_time(date_str):
    date = datetime.fromisoformat(date_str)
    weekday_map = ["월", "화", "수", "목", "금", "토", "일"]
    formatted_time = date.strftime("%H시")  # 24시간제로 변경
    return f"{date.month}월 {date.day}일 {weekday_map[date.weekday()]}요일 {formatted_time}"


def send_slack_message(webhook_url, message, workspace_id=None, notice_id=None):
    try:
        print(f"Sending message - Notice ID: {notice_id}, Workspace ID: {workspace_id}")
        
        payload = {
            "text": message,
            "attachments": []
        }
        
        # QR 이미지 첨부 로직
        if workspace_id and ("입실" in message or "퇴실" in message):
            try:
                with sqlite3.connect('workspace.db') as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT w.qr_image, n.no_image 
                        FROM workspaces w 
                        LEFT JOIN notices n ON n.id = ? 
                        WHERE w.id = ?
                    ''', (notice_id, workspace_id))
                    result = cursor.fetchone()
                    
                    # QR 이미지를 첨부하지 않는 경우가 아닐 때만 이미지 첨부
                    if result and result[0] and not (result[1] == 1):
                        qr_path = os.path.join(app.config['UPLOAD_FOLDER'], result[0])
                        print(f"QR file path: {qr_path}")
                        
                        if os.path.exists(qr_path):
                            image_url = f"https://tool.fastlm.site/qr_images/{result[0]}"
                            print(f"QR Image URL: {image_url}")
                            
                            attachment = {
                                "fallback": "QR Code Image",
                                "image_url": image_url,
                                "text": "정해진 시간 내에 QR체크 진행해주시길 바랍니다.",
                                "title": "\n:white_check_mark: HRD QR 체크 안내"
                            }
                            payload["attachments"].append(attachment)
                            print(f"Attachment added: {attachment}")
                        else:
                            print(f"QR 이미지 파일을 찾을 수 없습니다: {qr_path}")
                    else:
                        print(f"QR 이미지 첨부 제외됨")

            except Exception as e:
                print(f"QR 이미지 처리 중 오류: {str(e)}")
                import traceback
                print(traceback.format_exc())

        response = WebhookClient(webhook_url).send(**payload)
        
        # 공지 상태 업데이트
        if notice_id is not None:
            try:
                with sqlite3.connect('workspace.db') as conn:
                    cursor = conn.cursor()
                    if response.status_code == 200:
                        cursor.execute('UPDATE notices SET status = ? WHERE id = ?', 
                                     ('전송 완료', notice_id))
                    else:
                        cursor.execute('UPDATE notices SET status = ? WHERE id = ?', 
                                     ('전송 실패', notice_id))
                    conn.commit()
            except Exception as e:
                print(f"공지 상태 업데이트 중 오류: {str(e)}")
        
        return response.status_code
        
    except Exception as e:
        print(f"메시지 전송 중 오류: {str(e)}")
        if notice_id is not None:
            try:
                with sqlite3.connect('workspace.db') as conn:
                    cursor = conn.cursor()
                    cursor.execute('UPDATE notices SET status = ? WHERE id = ?', 
                                 ('전송 실패', notice_id))
                    conn.commit()
            except:
                pass
        return 500


# 공지 상태 업데이트 함수
def update_notice_status(notice_id, status):
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE notices SET status = ? WHERE id = ?', (status, notice_id))
        conn.commit()



@app.route('/notices/manage')
@login_required
def manage_notice():
    try:
        # 현재 선택된 워크스페이스 확인
        selected_workspace = session.get('selected_workspace')
        if not selected_workspace:
            flash('워크스페이스를 선택해주세요.', 'error')
            return redirect(url_for('workspace_select'))

        status_filter = request.args.get('status', 'all')
        print(f"선택된 상태 필터: {status_filter}")  # 디버깅용
        
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # 공지 목록 조회 쿼리 (워크스페이스 ID로 필터링)
            base_query = '''
                SELECT 
                    n.id,
                    w.name,
                    n.message,
                    n.run_date,
                    COALESCE(n.status, '상태 없음') as status,
                    n.workspace_id
                FROM notices n
                JOIN workspaces w ON n.workspace_id = w.id
                WHERE n.workspace_id = ?
            '''
            
            if status_filter and status_filter != 'all':
                cursor.execute(base_query + ' AND n.status = ? ORDER BY n.run_date DESC', 
                             (selected_workspace[0], status_filter))
            else:
                cursor.execute(base_query + ' ORDER BY n.run_date DESC', 
                             (selected_workspace[0],))
            
            notices = cursor.fetchall()
            print(f"조회된 공지 수: {len(notices)}")  # 디버깅용
            
        return render_template('manage_notice.html', 
                             notices=notices,
                             title="FASTLM")
                             
    except Exception as e:
        print(f"공지 관리 페이지 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        return render_template('manage_notice.html', 
                             notices=[],
                             title="FASTLM")



@app.route('/notices/delete/<int:notice_id>', methods=['POST'])
def delete_notice(notice_id):
    """공지 삭제 및 예약 취소."""
    job_id = f"notice_{notice_id}"

    # 스케줄러에서 작업 제거
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    # DB에서 공지 삭제
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM notices WHERE id = ?', (notice_id,))
        conn.commit()

    return redirect(url_for('manage_notice'))


@app.route('/notices/edit/<int:notice_id>', methods=['POST'])
def edit_notice(notice_id):
    new_message = request.form['message']
    new_run_date = request.form['run_date']

    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE notices 
            SET message = ?, run_date = ?, status = '예약됨' 
            WHERE id = ?
        ''', (new_message, new_run_date, notice_id))
        conn.commit()

    # 예약 시간 갱신
    if new_run_date:
        run_date = datetime.fromisoformat(new_run_date)
        schedule_slack_message(notice_id, run_date)
    return '', 204  # 성공 응답


def get_webhook_url(workspace_id):
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT attendance_webhook FROM workspaces WHERE id = ?', (workspace_id,))
        result = cursor.fetchone()
        return result[0] if result else None

def add_column_question_webhook():
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        
        # 컬럼이 존재하는지 확인
        cursor.execute("PRAGMA table_info(workspaces)")
        columns = [column[1] for column in cursor.fetchall()]  # 두 번째 요소가 컬럼명
        
        if "question_webhook" not in columns:
            # 컬럼이 없을 경우 추가
            cursor.execute('''
                ALTER TABLE workspaces 
                ADD COLUMN question_webhook TEXT NOT NULL DEFAULT ''
            ''')
            conn.commit()
            print("question_webhook 컬럼이 성공적으로 추가되었습니다.")

def add_column_schedule_url():
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(workspaces)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "schedule_url" not in columns:
            cursor.execute('''
                ALTER TABLE workspaces 
                ADD COLUMN schedule_url TEXT NOT NULL DEFAULT ''
            ''')
            conn.commit()
            print("schedule_url 컬럼이 성공적으로 추가되었습니다.")


def schedule_slack_message(notice_id, run_date):
    """개별 메시지 예약 함수"""
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT DISTINCT n.message, 
                       CASE 
                           WHEN n.message LIKE '%질문 스레드%' THEN w.question_webhook
                           WHEN n.message LIKE '%만족도 조사%' THEN w.operations_webhook
                           WHEN n.message LIKE '%입실 안내%' THEN w.attendance_webhook
                           WHEN n.message LIKE '%중간 출석%' THEN w.attendance_webhook
                           WHEN n.message LIKE '%퇴실 안내%' THEN w.attendance_webhook
                           ELSE w.attendance_webhook 
                       END as webhook_url,
                       w.id 
                FROM notices n
                JOIN workspaces w ON n.workspace_id = w.id
                WHERE n.id = ?
            ''', (notice_id,))
            result = cursor.fetchone()
            
            if result:
                message, webhook_url, workspace_id = result
                job_id = f"notice_{notice_id}"
                
                # 기존 작업이 있다면 제거
                if scheduler.get_job(job_id):
                    print(f"기존 작업 제거: {job_id}")
                    scheduler.remove_job(job_id)
                
                # 새 작업 예약
                scheduler.add_job(
                    send_slack_message,
                    trigger='date',
                    run_date=run_date,
                    args=[webhook_url, message, workspace_id, notice_id],
                    id=job_id,
                    replace_existing=True,
                    misfire_grace_time=None  # 지정된 시간에만 실행
                )
                
                print(f"새 공지 예약 완료 - ID: {notice_id}, 실행시간: {run_date}")
                return True
            
            return False
            
    except Exception as e:
        print(f"메시지 예약 중 오류 발생: {str(e)}")
        return False


def load_scheduled_notices():
    """DB에서 예약된 공지를 불러와 스케줄러에 등록합니다."""
    try:
        # 시작할 때 모든 기존 작업 제거
        scheduler.remove_all_jobs()
        print("기존 스케줄러 작업 모두 제거됨")

        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT DISTINCT n.id, n.run_date, n.message,
                       CASE 
                           WHEN n.message LIKE '%질문 스레드%' THEN w.question_webhook
                           WHEN n.message LIKE '%만족도 조사%' THEN w.operations_webhook
                           WHEN n.message LIKE '%입실 안내%' THEN w.attendance_webhook
                           WHEN n.message LIKE '%중간 출석%' THEN w.attendance_webhook
                           WHEN n.message LIKE '%퇴실 안내%' THEN w.attendance_webhook
                           ELSE w.attendance_webhook 
                       END as webhook_url,
                       w.id as workspace_id
                FROM notices n
                JOIN workspaces w ON n.workspace_id = w.id
                WHERE n.status = "예약됨" 
                AND n.run_date > datetime('now')
            ''')
            notices = cursor.fetchall()

        print(f"불러온 예약 공지 수: {len(notices)}")

        for notice in notices:
            notice_id, run_date_str, message, webhook_url, workspace_id = notice
            run_date = datetime.fromisoformat(run_date_str)
            
            job_id = f"notice_{notice_id}"
            if scheduler.get_job(job_id):
                print(f"기존 작업 제거: {job_id}")
                scheduler.remove_job(job_id)
            
            scheduler.add_job(
                send_slack_message,
                trigger='date',
                run_date=run_date,
                args=[webhook_url, message, workspace_id, notice_id],
                id=job_id,
                replace_existing=True,
                misfire_grace_time=None  # 지정된 시간에만 실행
            )
            print(f"공지 예약 완료 - ID: {notice_id}, 실행시간: {run_date}")

    except Exception as e:
        print(f"공지 로딩 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()


@app.template_filter('markdown')
def render_markdown(text):
    """마크다운 텍트를 HTML로 변환합니다."""
    return Markup(markdown.markdown(text))

@app.route('/notices/calendar')
def notice_calendar():
    try:
        # 현재 선택된 워크스페이스 확인
        selected_workspace = session.get('selected_workspace')
        if not selected_workspace:
            flash('워크스페이스를 선택해주세요.', 'error')
            return redirect(url_for('workspace_select'))

        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT n.id, w.name, n.message, n.status, n.run_date
                FROM notices n
                JOIN workspaces w ON n.workspace_id = w.id
                WHERE n.run_date IS NOT NULL
                AND n.workspace_id = ?
                ORDER BY n.run_date ASC
            ''', (selected_workspace[0],))
            notices = cursor.fetchall()
            
            # 디버깅을 위한 로그 추가
            print(f"조회된 공지 수: {len(notices)}")
            
            events = []
            for notice in notices:
                notice_id, workspace_name, message, status, run_date = notice
                
                # 디버깅을 위한 로그 추가
                print(f"공지 정보: ID={notice_id}, Message={message[:50]}..., Date={run_date}")
                
                notice_type = "기타"
                color = "#757575"  # 기본 색상
                
                if "입실 안내" in message:
                    notice_type = "입실"
                    color = "#4CAF50"
                elif "중간 출석" in message:
                    notice_type = "중간"
                    color = "#2196F3"
                elif "퇴실 안내" in message:
                    notice_type = "퇴실"
                    color = "#F44336"
                elif "만족도 조사" in message:
                    notice_type = "만족도"
                    color = "#9C27B0"
                elif "질문 스레드" in message:
                    notice_type = "질문"
                    color = "#FF9800"
                
                event = {
                    'id': notice_id,
                    'title': notice_type,
                    'start': run_date,
                    'status': status,
                    'color': color,
                    'textColor': '#ffffff'  # 텍스트 색상을 흰색으로 설정
                }
                events.append(event)
                
                # 디버깅을 위한 로그 추가
                print(f"생성된 이벤트: {event}")
            
            return render_template('notice_calendar.html', 
                                 events=events, 
                                 title="FASTLM",
                                 workspace_name=selected_workspace[1])  # 워크스페이스 이름 전달
                                 
    except Exception as e:
        print(f"캘린더 페이지 오류: {str(e)}")
        import traceback
        traceback.print_exc()  # 상세한 오류 정보 출력
        return render_template('notice_calendar.html', 
                             events=[], 
                             title="FASTLM",
                             error_message=str(e))

def get_event_color(notice_type):
    """공지 유형별 색상 반환"""
    color_map = {
        "입실": "#4CAF50",  # 녹색
        "중간": "#2196F3",  # 파란색
        "퇴실": "#F44336",  # 빨간색
        "만족도": "#9C27B0",  # 보라색
        "질문": "#FF9800",  # 주황색
        "기타": "#757575"   # 회색
    }
    return color_map.get(notice_type, "#757575")

def init_app():
    """애플리케이션 초기화 함수"""
    print("애플리케이션 초기화 시작...")
    
    # QR 이미지 저장 디렉토리 생성
    ensure_upload_directory()
    print(f"QR 이미지 디렉토리 확인: {app.config['UPLOAD_FOLDER']}")
    
    init_db()
    print("데이터베이스 초기화 완료")
    
    init_qr_db()  # QR 검증용 데이터베이스 초기화
    print("QR 검증용 데이터베이스 초기화 완료")
    
    if not scheduler.running:
        scheduler.start()
        # 기존 스케줄러를 QR 앱과 공유
        init_scheduler(scheduler)
        print("스케줄러 시작됨")
        load_scheduled_notices()
        print("예약된 공지 로드 완료")
    
    print("애플리케이션 초기화 완료")
    init_zoom_db()  # Zoom DB 초기화 추가



# Slack OAuth 관련 설정
SLACK_CLIENT_ID = "8336882909425.8327184761684"
SLACK_CLIENT_SECRET = "36b3e525e87eff0fbab0337f3e5f7ef0"
SLACK_REDIRECT_URI = "https://tool.fastlm.site/slack/oauth/callback"
SLACK_SCOPES = [
    "channels:history",
                "channels:join",
                "channels:manage",
                "channels:read",
                "channels:write.invites",
                "channels:write.topic",
                "chat:write",
                "commands",
                "files:read",
                "files:write",
                "groups:write",
                "groups:write.invites",
                "im:read",
                "mpim:read",
                "users:read",
                "users:read.email",
                "groups:read",
                "groups:history",
                "groups:write.topic"
]

@app.route("/slack/oauth/callback")
def slack_oauth_callback():
    try:
        # OAuth 코드 받기
        code = request.args.get("code")
        if not code:
            print("인증 코드가 없습니다.")
            return "인증 코드가 없습니다.", 400

        print(f"받은 OAuth 코드: {code}")

        # Slack API에 OAuth 토큰 요청
        response = requests.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id": SLACK_CLIENT_ID,
                "client_secret": SLACK_CLIENT_SECRET,
                "code": code,
                "redirect_uri": SLACK_REDIRECT_URI
            }
        )
        
        print(f"Slack API 응답 상태 코드: {response.status_code}")
        print(f"Slack API 응답 내용: {response.text}")
        
        data = response.json()
        if not data.get("ok"):
            error_msg = data.get("error", "알 수 없는 오류")
            print(f"Slack OAuth 오류: {error_msg}")
            return f"앱 설치 중 오류가 발생했습니다. (에러: {error_msg})", 500

        # enterprise_id 안전하게 추출
        enterprise_id = None
        enterprise = data.get("enterprise")
        if enterprise and isinstance(enterprise, dict):
            enterprise_id = enterprise.get("id")

        # 설치 정보 준비 (안전하게 데이터 추출)
        installation_data = {
            "team_id": data.get("team", {}).get("id"),
            "team_name": data.get("team", {}).get("name", "Unknown Team"),
            "enterprise_id": enterprise_id,
            "bot_token": data.get("access_token"),
            "bot_id": data.get("bot_user_id"),
            "bot_scopes": data.get("scope", ""),
            "installed_at": datetime.now().isoformat()  # datetime.datetime.now() 대신 datetime.now() 사용
        }

        # 필수 필드 확인
        required_fields = ["team_id", "bot_token", "bot_id"]
        missing_fields = [field for field in required_fields if not installation_data.get(field)]
        if missing_fields:
            print(f"필수 필드 누락: {missing_fields}")
            print(f"받은 데이터: {data}")
            return f"앱 설치 중 오류가 발생했습니다. (필수 정보 누락: {', '.join(missing_fields)})", 500

        # installations 폴더 경로 확인
        installation_dir = os.path.join("data", "installations")
        os.makedirs(installation_dir, exist_ok=True)

        # 파일 저장
        team_id = installation_data["team_id"]
        installation_path = os.path.join(installation_dir, f"{team_id}.json")
        
        with open(installation_path, "w") as f:
            json.dump(installation_data, f, indent=2)

        print(f"""
[Slack 앱 설치 정보 저장 완료]
파일 경로: {installation_path}
팀 ID: {team_id}
팀 이름: {installation_data['team_name']}
봇 ID: {installation_data['bot_id']}
Enterprise ID: {enterprise_id}
봇 스코프: {installation_data['bot_scopes']}
        """)

        return render_template('slack_oauth_success.html', 
                             team_name=installation_data['team_name'])

    except Exception as e:
        print(f"OAuth 처리 중 오류: {str(e)}")
        print("상세 오류 정보:")
        import traceback
        traceback.print_exc()
        print(f"받은 데이터: {data if 'data' in locals() else 'No data received'}")
        return f"앱 설치 중 오류가 발생했습니다. (에러: {str(e)})", 500

def init_db():
    """데이터베이스 초기화 함수"""
    print("데이터베이스 초기화 시작")
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # Slack 설치 정보 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS slack_installations (
                    team_id TEXT PRIMARY KEY,
                    team_name TEXT NOT NULL,
                    access_token TEXT NOT NULL,
                    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # users 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    is_admin INTEGER DEFAULT 0,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 존 테이블 구조 확인
            cursor.execute('PRAGMA table_info(users)')
            existing_columns = [column[1] for column in cursor.fetchall()]
            print(f"기존 컬럼: {existing_columns}")  # 디버깅 로그
            
            # 필요한 컬럼 추가
            required_columns = {
                'status': 'TEXT DEFAULT "pending"',
                'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                'is_admin': 'INTEGER DEFAULT 0'
            }
            
            for column, type_def in required_columns.items():
                if column not in existing_columns:
                    try:
                        cursor.execute(f'ALTER TABLE users ADD COLUMN {column} {type_def}')
                        print(f"컬럼 추가됨: {column}")  # 디버깅 로그
                    except sqlite3.OperationalError as e:
                        print(f"컬럼 추가 실패 ({column}): {str(e)}")  # 디버깅 로그
            
            # 기본 관리자 계정 확인 및 생성
            cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
            if not cursor.fetchone():
                cursor.execute('''
                    INSERT INTO users (username, password, is_admin, status) 
                    VALUES (?, ?, ?, ?)
                ''', ('admin', generate_password_hash('your_secure_password'), 1, 'approved'))
                print("관리자 계정 생성됨")  # 디버깅 로그
            
            # 사용자-워크스페이스 접근 권한 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_workspace_access (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    workspace_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id),
                    UNIQUE(user_id, workspace_id)
                )
            ''')
            
            conn.commit()
            print("데이터베이스 초기화 완료")
            
    except Exception as e:
        print(f"데이터베이스 초기화 오류: {str(e)}")
        import traceback
        traceback.print_exc()

@app.route('/get_qr_image/<int:workspace_id>')
def get_qr_image(workspace_id):
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT qr_image FROM workspaces WHERE id = ?', (workspace_id,))
            result = cursor.fetchone()
            
            if result and result[0]:
                return send_from_directory(app.config['UPLOAD_FOLDER'], result[0])
            else:
                return "QR 이미지를 찾을 수 없습니다.", 404
    except Exception as e:
        print(f"QR 이미지 조회 중 오류: {str(e)}")
        return "QR 이미지 조회 중 오류가 발생했습니다.", 500

def migrate_qr_image_to_filename():
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        
        # 시 테이블 생성
        cursor.execute('''
            CREATE TABLE workspaces_new (
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
        
        # 데이터 복사 (qr_image는 NULL로 설정)
        cursor.execute('''
            INSERT INTO workspaces_new 
            SELECT id, name, attendance_webhook, operations_webhook, question_webhook,
                   entry_time, mid_time, exit_time, NULL, zoom_url, 
                   zoom_id, zoom_pw, schedule_url
            FROM workspaces
        ''')
        
        # 테이블 교체
        cursor.execute('DROP TABLE workspaces')
        cursor.execute('ALTER TABLE workspaces_new RENAME TO workspaces')
        
        conn.commit()

@app.route('/qr_images/<path:filename>')
def serve_qr_image(filename):
    try:
        # CORS 헤더 추가
        response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        print(f"QR 이미지 서빙 중 오류: {str(e)}")
        return f"Error: {str(e)}", 500

@app.route('/check_workspace_qr/<int:workspace_id>')
def check_workspace_qr(workspace_id):
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT id, name, qr_image FROM workspaces WHERE id = ?', (workspace_id,))
            result = cursor.fetchone()
            if result:
                return f"Workspace ID: {result[0]}, Name: {result[1]}, QR Image: {result[2]}"
            return "Workspace not found"
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/admin/workspace/update_qr/<int:workspace_id>', methods=['POST'])
def update_workspace_qr(workspace_id):
    if not session.get('admin_logged_in'):
        return jsonify({'error': '관리자 로그인이 필요합니다.'}), 401

    try:
        if 'qr_image' not in request.files:
            return jsonify({'error': 'QR 이미지가 없습니다.'}), 400
            
        file = request.files['qr_image']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': '올바른 파일이 아닙니다.'}), 400
            
        # QR 이미지 파일 저장
        filename = f"qr_{workspace_id}.{file.filename.rsplit('.', 1)[1].lower()}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # 데이터베이스 업데이트
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE workspaces SET qr_image = ? WHERE id = ?', 
                         (filename, workspace_id))
            conn.commit()
            
        return jsonify({'message': 'QR 이미지가 업데이트되었습니다.'}), 200
        
    except Exception as e:
        print(f"QR 이미지 업데이트 중 오류: {str(e)}")
        return jsonify({'error': 'QR 이미지 업데이트 중 오류가 발생했습니다.'}), 500

@app.route('/admin/check_workspace/<int:workspace_id>')
def check_workspace(workspace_id):
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM workspaces WHERE id = ?', (workspace_id,))
            workspace = cursor.fetchone()
            if workspace:
                columns = [description[0] for description in cursor.description]
                workspace_dict = dict(zip(columns, workspace))
                return jsonify(workspace_dict)
            return "Workspace not found", 404
    except Exception as e:
        return f"Error: {str(e)}", 500

@app.route('/admin/force_update_qr/<int:workspace_id>')
def force_update_qr(workspace_id):
    try:
        qr_filename = f"qr_{workspace_id}.png"  # 또는 실제 파일 확장자에 맞게 수정
        
        # 파일 존재 여부 확인
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], qr_filename)
        if not os.path.exists(file_path):
            return f"QR 이미지 파일이 없습니다: {file_path}", 404
            
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE workspaces SET qr_image = ? WHERE id = ?', 
                         (qr_filename, workspace_id))
            conn.commit()
            return f"QR 이미지 정보가 업데이트되었습니다: {qr_filename}"
    except Exception as e:
        return f"Error: {str(e)}", 500

def migrate_qr_image_to_text():
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        
        # 임시 테이블 생성 (qr_image를 TEXT 타입으로)
        cursor.execute('''
            CREATE TABLE workspaces_new (
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
        
        # 데이터 복사
        cursor.execute('''
            INSERT INTO workspaces_new 
            SELECT * FROM workspaces
        ''')
        
        # 기존 테이블 삭제 및 새 테이블 이름 변경
        cursor.execute('DROP TABLE workspaces')
        cursor.execute('ALTER TABLE workspaces_new RENAME TO workspaces')
        
        # QR 이미지 정보 업데이트
        cursor.execute('UPDATE workspaces SET qr_image = ? WHERE id = ?', 
                      ('qr_3.png', 3))
        
        conn.commit()

@app.route('/admin/migrate_qr')
def admin_migrate_qr():
    try:
        migrate_qr_image_to_text()
        return "QR 이미지 필드 타입이 성공적으로 변경되었습니다."
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/notices/send-now/<int:notice_id>', methods=['POST'])
def send_notice_now(notice_id):
    try:
        # 스케줄러에서 예약된 작업 제거
        job_id = f"notice_{notice_id}"
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)
        
        # 공지 정보 가져오기
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT n.message, 
                       CASE 
                           WHEN n.message LIKE '%질문 스레드%' THEN w.question_webhook
                           WHEN n.message LIKE '%만족도 조사%' THEN w.operations_webhook
                           ELSE w.attendance_webhook 
                       END as webhook_url,
                       w.id 
                FROM notices n
                JOIN workspaces w ON n.workspace_id = w.id
                WHERE n.id = ?
            ''', (notice_id,))
            result = cursor.fetchone()
            
            if result:
                message, webhook_url, workspace_id = result
                # 즉시 메시지 전송
                response_code = send_slack_message(webhook_url, message, workspace_id, notice_id)
                
                if response_code == 200:
                    return '', 204  # 성공 응답
                else:
                    return '메시지 전송 실패', 500
            else:
                return '공지를 찾을 수 없습니다', 404
                
    except Exception as e:
        print(f"즉시 전송 중 오류 발생: {str(e)}")
        return '메시지 전송 중 오류가 발생했습니다', 500



# 로그인 라우트
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        print(f"로그인 시도 - 사용자명: {username}")  # 디버그 로그
        
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            
            print(f"DB에서 찾은 사용자: {user}")  # 디버그 로그
            
            if user:
                print(f"비밀번호 확인: {check_password_hash(user[2], password)}")  # 디버그 로그
                print(f"관리자 여부: {user[3]}")  # 디버그 로그
                print(f"상태: {user[4]}")  # 디버그 로그
            
            if user and check_password_hash(user[2], password) and user[4] == 'approved':
                session['user_id'] = user[0]
                session['username'] = user[1]
                session['is_admin'] = user[3]
                
                next_page = request.args.get('next')
                if next_page:
                    return redirect(next_page)
                return redirect(url_for('home'))
            
            # 승인 대기 중인 사용자인지 확인
            cursor.execute('''
                SELECT status FROM users 
                WHERE username = ? AND password = ?
            ''', (username, password))
            status = cursor.fetchone()
            
            if status and status[0] == 'pending':
                flash('관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.', 'warning')
            elif status and status[0] == 'rejected':
                flash('원가입이 거부되었습니다. 관리자에게 문의하세요.', 'error')
            else:
                flash('잘못된 사용자명 또는 비밀번호입니다.', 'error')
    
    return render_template('login.html', title="로그인")

# 로그아웃 라우트
@app.route('/logout')
def logout():
    session.clear()
    flash('로그아웃되었습니다.', 'success')
    return redirect(url_for('login'))

@app.route('/admin/users')
@login_required
@admin_required
def manage_users():
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # 삭용자 정보를 가져오는 쿼리 수정
            cursor.execute('''
                SELECT 
                    id, 
                    username, 
                    status,
                    created_at,
                    CASE 
                        WHEN is_admin = 1 THEN 1 
                        ELSE 0 
                    END as is_admin
                FROM users 
                ORDER BY id DESC
            ''')
            users = cursor.fetchall()
            
            # 디버깅을 위한 로그 추가
            print("조회된 사용자 목록:")
            for user in users:
                print(f"ID: {user[0]}, Username: {user[1]}, Status: {user[2]}, Created: {user[3]}, Is Admin: {user[4]}")
            
            return render_template('manage_users.html', 
                                 users=users, 
                                 title="사용자 관리")
                                 
    except Exception as e:
        print(f"사용자 관리 페이지 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        flash('사용자 목록을 불러오는 중 오류가 발생했습니다.', 'error')
        return redirect(url_for('admin_menu'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        password_confirm = request.form['password_confirm']
        
        if password != password_confirm:
            flash('비밀번호가 일치하지 않습니다.', 'error')
            return redirect(url_for('register'))
            
        try:
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                # 이미 존재하는 사용자인지 확인
                cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
                if cursor.fetchone():
                    flash('이미 존재하는 사용자명입니다.', 'error')
                    return redirect(url_for('register'))
                
                # 비밀번호 해싱
                hashed_password = generate_password_hash(password)
                
                cursor.execute('''
                    INSERT INTO users (username, password, status) 
                    VALUES (?, ?, 'pending')
                ''', (username, hashed_password))
                conn.commit()
                flash('회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.', 'success')
                return redirect(url_for('login'))
                
        except Exception as e:
            flash('회원가입 중 오류가 발생했습니다.', 'error')
            print(f"회원가입 오류: {str(e)}")
            
    return render_template('register.html', title="회원가입")

@app.errorhandler(404)
def page_not_found(e):
    return "Not Found", 404

@app.before_request
def block_malicious_requests():
    blocked_paths = [
        "/vendor/phpunit",
        "/phpunit",
        "/eval-stdin.php"
    ]
    if any(path in request.path for path in blocked_paths):
        return "Forbidden", 403

@app.route('/admin/users/<int:user_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_user(user_id):
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET status = "approved" WHERE id = ?', (user_id,))
            conn.commit()
            return jsonify({'message': '사용자가 승인되었습니다.'})
    except Exception as e:
        print(f"사용자 승인 중 오류: {str(e)}")
        return jsonify({'error': '사용자 승인 중 오류가 발생했습니다.'}), 500

@app.route('/admin/users/<int:user_id>/reject', methods=['POST'])
@login_required
@admin_required
def reject_user(user_id):
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('UPDATE users SET status = "rejected" WHERE id = ?', (user_id,))
            conn.commit()
            return jsonify({'message': '사용자가 거부되었습니다.'})
    except Exception as e:
        print(f"사용자 거부 중 오류: {str(e)}")
        return jsonify({'error': '사용자 거부 중 오류가 발생했습니다.'}), 500

@app.route('/admin/users/<int:user_id>/delete', methods=['POST'])
@login_required
@admin_required
def delete_user(user_id):
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            
            # 삭제하려는 사용자가 관리자인지 확인
            cursor.execute('SELECT is_admin FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            
            if user and user[0]:  # 관리자인 경우
                return jsonify({'error': '관리자 계정은 삭제할 수 없습니다.'}), 403
            
            # 사용자 삭제
            cursor.execute('DELETE FROM users WHERE id = ? AND is_admin = 0', (user_id,))
            
            if cursor.rowcount == 0:
                return jsonify({'error': '사용자를 찾을 수 없거나 삭제할 수 없습니다.'}), 404
                
            conn.commit()
            return jsonify({'message': '사용자가 성공적으로 삭제되었습니다.'})
            
    except Exception as e:
        print(f"사용자 삭제 중 오류: {str(e)}")
        return jsonify({'error': '사용자 삭제 중 오류가 발생했습니다.'}), 500

@app.route('/admin/users/workspace_access/<int:user_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def manage_user_workspace_access(user_id):
    if request.method == 'POST':
        workspace_ids = request.form.getlist('workspaces[]')
        try:
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                # 기존 접근 권한 삭제
                cursor.execute('DELETE FROM user_workspace_access WHERE user_id = ?', (user_id,))
                # 새로운 접근 권한 추가
                for workspace_id in workspace_ids:
                    cursor.execute('''
                        INSERT INTO user_workspace_access (user_id, workspace_id)
                        VALUES (?, ?)
                    ''', (user_id, workspace_id))
                conn.commit()
            return jsonify({'message': '워크스페이스 접근 권한이 업데이트되었습니다.'})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # GET 요청 처리
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            # 모든 워크스페이스 조회
            cursor.execute('SELECT id, name FROM workspaces')
            all_workspaces = cursor.fetchall()
            
            # 사용자의 현재 접근 권한 조회
            cursor.execute('''
                SELECT workspace_id FROM user_workspace_access WHERE user_id = ?
            ''', (user_id,))
            user_workspaces = [str(row[0]) for row in cursor.fetchall()]  # 문자열로 변환
            
            # 사용자 정보 조회
            cursor.execute('SELECT username FROM users WHERE id = ?', (user_id,))
            username = cursor.fetchone()[0]
            
        return render_template('manage_user_workspace_access.html',
                             user_id=user_id,
                             username=username,
                             workspaces=all_workspaces,
                             user_workspaces=user_workspaces)
    except Exception as e:
        flash('워크스페이스 접근 권한 관리 중 오류가 발생했습니다.', 'error')
        return redirect(url_for('manage_users'))

def add_no_image_column():
    with sqlite3.connect('workspace.db') as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(notices)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if "no_image" not in columns:
            cursor.execute('''
                ALTER TABLE notices 
                ADD COLUMN no_image INTEGER DEFAULT 0
            ''')
            conn.commit()
            print("no_image 컬럼이 성공적으로 추가되었습니다.")

@app.route('/scheduler/jobs')
@login_required
@admin_required
def list_scheduled_jobs():
    try:
        jobs = scheduler.get_jobs()
        
        # 각 작업의 정보를 수집
        job_list = []
        for job in jobs:
            try:
                # notice_id 추출 (job.id는 'notice_숫자' 형식)
                notice_id = job.id.split('_')[1]
                
                # DB에서 해당 공지 정보 조회
                with sqlite3.connect('workspace.db') as conn:
                    cursor = conn.cursor()
                    cursor.execute('''
                        SELECT n.id, n.message, n.run_date, n.status, w.name
                        FROM notices n
                        JOIN workspaces w ON n.workspace_id = w.id
                        WHERE n.id = ?
                    ''', (notice_id,))
                    notice = cursor.fetchone()
                    
                if notice:
                    job_info = {
                        'job_id': job.id,
                        'notice_id': notice_id,
                        'workspace': notice[4],
                        'next_run': job.next_run_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'message': notice[1][:100] + '...' if len(notice[1]) > 100 else notice[1],
                        'status': notice[3]
                    }
                else:
                    job_info = {
                        'job_id': job.id,
                        'notice_id': notice_id,
                        'workspace': 'Unknown',
                        'next_run': job.next_run_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'message': 'Notice not found in database',
                        'status': 'Unknown'
                    }
                
                job_list.append(job_info)
                
            except Exception as e:
                print(f"작업 정보 처리 중 오류 ({job.id}): {str(e)}")
                continue
        
        # 실행 시간 순으로 정렬
        job_list.sort(key=lambda x: x['next_run'])
        
        return render_template('scheduler_jobs.html', 
                             jobs=job_list,
                             title="스케줄러 작업 목록")
                             
    except Exception as e:
        flash(f'스케줄러 작업 조회 중 오류가 발생했습니다: {str(e)}', 'error')
        return redirect(url_for('home'))
    

def init_zoom_db():
    try:
        with sqlite3.connect('zoom_participation.db') as conn:
            cursor = conn.cursor()
            
            # 퇴실 기록 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS exit_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    meeting_topic TEXT,
                    sender_name TEXT NOT NULL,
                    sender_email TEXT,
                    timestamp TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            print("Zoom 퇴실 기록 데이터베이스 생성 완료")
            
            # 마이그레이션 실행
            migrate_exit_records_table()
            
    except Exception as e:
        print(f"Zoom DB 초기화 중 오류: {str(e)}")

# 상단에 추가
ZOOM_WEBHOOK_SECRET = "4dDerhZxSD6Yc75Sda-Ijg"
def verify_zoom_signature(request):
    zoom_signature = request.headers.get('X-Zm-Signature')
    zoom_timestamp = request.headers.get('X-Zm-Request-Timestamp')
    
    logging.info(f"Verifying Zoom signature:")
    logging.info(f"Received signature: {zoom_signature}")
    logging.info(f"Timestamp: {zoom_timestamp}")
    
    if not zoom_signature or not zoom_timestamp:
        logging.warning("Missing signature or timestamp")
        return False
        
    message = f"v0:{zoom_timestamp}:{request.get_data().decode('utf-8')}"
    logging.info(f"Message to verify: {message}")
    
    expected_signature = f"v0={hmac.new(ZOOM_WEBHOOK_SECRET.encode(), message.encode(), hashlib.sha256).hexdigest()}"
    logging.info(f"Expected signature: {expected_signature}")
    
    is_valid = hmac.compare_digest(zoom_signature, expected_signature)
    logging.info(f"Signature verification result: {'Valid' if is_valid else 'Invalid'}")
    
    return is_valid

@app.route("/zoom_webhook", methods=["POST"])
def zoom_webhook():
    try:
        logging.info("\n=== Zoom Webhook Request ===")
        
        data = request.get_json()
        logging.info(f"Received data: {json.dumps(data, indent=2)}")
        
        if not verify_zoom_signature(request):
            logging.warning("Invalid signature")
            return jsonify({"error": "Invalid signature"}), 401

        if data.get("event") == "chat_message.sent":
            payload = data.get("payload", {})
            object_data = payload.get("object", {})
            
            message = object_data.get("message", "")
            meeting_topic = object_data.get("channel_name", "Untitled Meeting")
            
            # UTC 시간을 KST로 변환
            utc_time = datetime.fromtimestamp(object_data.get("timestamp", 0)/1000)
            kst_time = utc_time
            timestamp = kst_time.strftime('%Y-%m-%d %H%M:%S')  # KST 시간을 문자열로
            
            sender_email = payload.get("operator", "")
            
            # Zoom API로 사용자 정보 가져오기
            display_name = get_zoom_user_info(sender_email)
            logging.info(f"Retrieved display name from Zoom API: {display_name}")
            
            if not display_name:
                display_name = sender_email.split('@')[0]
            
            logging.info(f"""
채팅 메시지 정보:
회의 제목: {meeting_topic}
메시지: {message}
보낸사람: {display_name} 
이메일: {sender_email}
시간: {timestamp}
            """)
            
            if message.strip() == "/퇴실":
                logging.info("퇴실 명령어 감지됨")
                try:
                    with sqlite3.connect('zoom_participation.db') as conn:
                        cursor = conn.cursor()
                        cursor.execute('''
                            INSERT INTO exit_records 
                            (meeting_topic, sender_name, sender_email, timestamp)
                            VALUES (?, ?, ?, ?)
                        ''', (
                            meeting_topic,
                            display_name,
                            sender_email,
                            timestamp
                        ))
                        conn.commit()
                        
                    logging.info(f"퇴실 기록 저장 완료: {display_name} from {meeting_topic}")
                    
                except Exception as e:
                    logging.error(f"퇴실 기록 저장 중 오류: {str(e)}")
                    return jsonify({
                        "status": "error",
                        "message": "퇴실 기록 중 오류가 발생했습니다."
                    }), 500
        
        return jsonify({"status": "success"})
        
    except Exception as e:
        logging.error(f"\nError in webhook handler: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/zoom/exit-records", methods=["GET"])
@login_required
def get_exit_records():
    try:
        print("Fetching exit records...")
        with sqlite3.connect('zoom_participation.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT meeting_topic, sender_name, sender_email, timestamp, created_at
                FROM exit_records
                ORDER BY created_at DESC
            ''')
            records = cursor.fetchall()
            print(f"조회된 퇴실 기록: {len(records)}개")
            
            return render_template(
                'zoom_exit_records.html',
                records=records,
                title="Zoom 퇴실 기록"
            )
                
    except Exception as e:
        print(f"퇴실 기록 조회 중 오류: {str(e)}")
        import traceback
        traceback.print_exc()
        flash(f'퇴실 기록을 불러오는 중 오류가 발생했습니다: {str(e)}', 'error')
        return redirect(url_for('home'))

@app.route('/zoom/oauth/callback')
def zoom_oauth_callback():
    try:
        # OAuth 코드 받기
        code = request.args.get('code')
        if not code:
            logging.error("OAuth code not received")
            return "Authorization failed", 400
            
        logging.info(f"Received OAuth code: {code}")
        
        # Zoom OAuth 토큰 엔드포인트
        token_url = 'https://zoom.us/oauth/token'
        client_id = 'pCLHh_CIQp2FDwrDiGKXOQ'
        client_secret = 'dQV5Z1ZFGKjqvMrP4xCxoVOgTLg6zlI9'  # Zoom 앱 설정에서 확인
        redirect_uri = 'https://tool.fastlm.site/zoom/oauth/callback'
        
        # Base64 인코딩된 client_id:client_secret
        auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
        
        # 토큰 요청
        headers = {
            'Authorization': f'Basic {auth}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        data = {
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }
        
        response = requests.post(token_url, headers=headers, data=data)
        
        if response.status_code == 200:
            token_data = response.json()
            logging.info("Successfully received OAuth token")
            
            # 토큰 저장 (보안을 위해 암호화하여 저장하는 것을 권장)
            with sqlite3.connect('workspace.db') as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS zoom_tokens (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        access_token TEXT NOT NULL,
                        refresh_token TEXT NOT NULL,
                        expires_in INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                cursor.execute('''
                    INSERT INTO zoom_tokens (access_token, refresh_token, expires_in)
                    VALUES (?, ?, ?)
                ''', (
                    token_data['access_token'],
                    token_data['refresh_token'],
                    token_data['expires_in']
                ))
                conn.commit()
            
            return "Authorization successful!", 200
        else:
            logging.error(f"Failed to get OAuth token: {response.text}")
            return "Failed to get authorization token", 400
            
    except Exception as e:
        logging.error(f"OAuth callback error: {str(e)}")
        logging.error(traceback.format_exc())
        return "Authorization error", 500

def migrate_exit_records_table():
    try:
        with sqlite3.connect('zoom_participation.db') as conn:
            cursor = conn.cursor()
            
            # 임시 테이블 생성
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS exit_records_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    meeting_topic TEXT,
                    sender_name TEXT NOT NULL,
                    sender_email TEXT,
                    timestamp TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 기존 데이터 복사 (meeting_topic은 NULL로)
            cursor.execute('''
                INSERT INTO exit_records_new (sender_name, sender_email, timestamp, created_at)
                SELECT sender_name, sender_email, timestamp, created_at
                FROM exit_records
            ''')
            
            # 기존 테이블 삭제
            cursor.execute('DROP TABLE exit_records')
            
            # 새 테이블 이름 변경
            cursor.execute('ALTER TABLE exit_records_new RENAME TO exit_records')
            
            conn.commit()
            print("Exit records table migration completed")
            
    except Exception as e:
        print(f"Migration error: {str(e)}")
        import traceback
        traceback.print_exc()

def get_zoom_token():
    try:
        with sqlite3.connect('workspace.db') as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT access_token FROM zoom_tokens 
                ORDER BY created_at DESC LIMIT 1
            ''')
            result = cursor.fetchone()
            return result[0] if result else None
    except Exception as e:
        logging.error(f"Error getting zoom token: {str(e)}")
        return None

def get_zoom_user_info(user_email):
    try:
        access_token = get_zoom_token()
        if not access_token:
            logging.error("No Zoom access token found")
            return None
            
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # 단일 사용자 정보 API 사용
        response = requests.get(
            f'https://api.zoom.us/v2/users/{user_email}',
            headers=headers
        )
        
        if response.status_code == 200:
            user_data = response.json()
            logging.info(f"Zoom user data: {user_data}")
            return user_data.get('display_name', '')
        else:
            logging.error(f"Failed to get user info: {response.text}")
            return None
            
    except Exception as e:
        logging.error(f"Error getting user info: {str(e)}")
        return None

if __name__ == '__main__':
    init_app()
    add_no_image_column()
    init_zoom_db()  # 추가
    app.run(host='0.0.0.0', port=5020, debug=False)