from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from apscheduler.schedulers.background import BackgroundScheduler
import requests
import json

app = Flask(__name__)

# 설정
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fastlm.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string-change-this-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# 확장 초기화
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# 스케줄러 초기화
scheduler = BackgroundScheduler()
scheduler.start()

# 데이터베이스 모델
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 관계
    user_workspaces = db.relationship('UserWorkspace', backref='user', lazy=True)

class Workspace(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    slack_webhook_url = db.Column(db.String(500))
    webhook_urls = db.Column(db.Text)  # JSON 형태로 저장
    checkin_time = db.Column(db.Time)  # 입실 시간
    middle_time = db.Column(db.Time)   # 중간 시간
    checkout_time = db.Column(db.Time) # 퇴실 시간
    qr_image_url = db.Column(db.String(500))
    zoom_url = db.Column(db.String(500))
    zoom_id = db.Column(db.String(100))
    zoom_password = db.Column(db.String(100))
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 관계
    creator = db.relationship('User', backref='created_workspaces', lazy=True)
    
    # 관계
    user_workspaces = db.relationship('UserWorkspace', backref='workspace', lazy=True)
    notices = db.relationship('Notice', backref='workspace', lazy=True)

class UserWorkspace(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspace.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)  # attendance, satisfaction, thread
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspace.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, sent, failed
    no_image = db.Column(db.Boolean, default=False)
    form_data = db.Column(db.Text)  # JSON 형태로 저장
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime)
    error_message = db.Column(db.Text)
    
    # 관계
    creator = db.relationship('User', backref='created_notices', lazy=True)

class ScheduledJob(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    notice_id = db.Column(db.Integer, db.ForeignKey('notice.id'), nullable=False)
    job_id = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    scheduled_at = db.Column(db.DateTime, nullable=False)
    executed_at = db.Column(db.DateTime)
    error_message = db.Column(db.Text)
    
    # 관계
    notice = db.relationship('Notice', backref='scheduled_jobs', lazy=True)

class ZoomExitRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    workspace_id = db.Column(db.Integer, db.ForeignKey('workspace.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# JWT 토큰 검증 및 오류 핸들러
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"토큰 만료: header={jwt_header}, payload={jwt_payload}")
    return jsonify({'message': '토큰이 만료되었습니다.'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"유효하지 않은 토큰: error={error}")
    return jsonify({'message': '유효하지 않은 토큰입니다.'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"토큰 누락: error={error}")
    return jsonify({'message': '인증 토큰이 필요합니다.'}), 401

# 인증 관련 API
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': '이미 존재하는 이메일입니다.'}), 400
    
    user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        name=data['name'],
        is_approved=False  # 관리자 승인 필요
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': '이메일 또는 비밀번호가 틀렸습니다.'}), 401
    
    if not user.is_approved:
        return jsonify({'message': '관리자 승인을 기다리고 있습니다.'}), 403
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'token': access_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'isAdmin': user.is_admin,
            'isApproved': user.is_approved
        }
    })

@app.route('/api/auth/verify', methods=['POST'])
@jwt_required()
def verify_token():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': '사용자를 찾을 수 없습니다.'}), 404
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'isAdmin': user.is_admin,
        'isApproved': user.is_approved
    })

# 사용자 관리 API (관리자만)
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        print("get_all_users API 호출됨")
        current_user_id = int(get_jwt_identity())
        print(f"현재 사용자 ID: {current_user_id}")
        current_user = User.query.get(current_user_id)
        print(f"현재 사용자: {current_user}")
        
        if not current_user:
            print("사용자를 찾을 수 없음")
            return jsonify({'message': '사용자를 찾을 수 없습니다.'}), 404
        
        if not current_user.is_admin:
            print("관리자 권한 없음")
            return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
        
        users = User.query.all()
        print(f"총 사용자 수: {len(users)}")
        
        result = [{
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'isAdmin': user.is_admin,
            'isApproved': user.is_approved,
            'status': 'approved' if user.is_approved else 'pending',
            'createdAt': user.created_at.isoformat()
        } for user in users]
        
        return jsonify(result)
    except Exception as e:
        print(f"get_all_users에서 오류 발생: {e}")
        return jsonify({'message': '서버 오류가 발생했습니다.'}), 500

@app.route('/api/admin/users/<int:user_id>/approve', methods=['PUT'])
@jwt_required()
def approve_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': '사용자를 찾을 수 없습니다.'}), 404
    
    user.is_approved = True
    db.session.commit()
    
    return jsonify({'message': '사용자가 승인되었습니다.'})

@app.route('/api/admin/users/<int:user_id>/reject', methods=['PUT'])
@jwt_required()
def reject_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': '사용자를 찾을 수 없습니다.'}), 404
    
    user.is_approved = False
    db.session.commit()
    
    return jsonify({'message': '사용자가 거부되었습니다.'})

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': '사용자를 찾을 수 없습니다.'}), 404
    
    # 관리자는 삭제할 수 없음
    if user.is_admin:
        return jsonify({'message': '관리자 계정은 삭제할 수 없습니다.'}), 403
    
    # 자기 자신은 삭제할 수 없음
    if user.id == current_user_id:
        return jsonify({'message': '자기 자신의 계정은 삭제할 수 없습니다.'}), 403
    
    try:
        # 관련된 UserWorkspace 레코드 먼저 삭제
        UserWorkspace.query.filter_by(user_id=user_id).delete()
        
        # 사용자가 생성한 공지사항의 created_by를 현재 관리자로 변경
        Notice.query.filter_by(created_by=user_id).update({'created_by': current_user_id})
        
        # 사용자 삭제
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': '사용자가 삭제되었습니다.'})
    
    except Exception as e:
        db.session.rollback()
        print(f"사용자 삭제 오류: {e}")
        return jsonify({'message': '사용자 삭제 중 오류가 발생했습니다.'}), 500

@app.route('/api/admin/users/<int:user_id>/workspaces', methods=['GET'])
@jwt_required()
def get_user_workspace_access(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': '사용자를 찾을 수 없습니다.'}), 404
    
    # 사용자가 접근 가능한 워크스페이스 조회
    user_workspace_ids = [uw.workspace_id for uw in user.user_workspaces]
    workspaces = Workspace.query.filter(Workspace.id.in_(user_workspace_ids)).all()
    
    return jsonify([{
        'id': ws.id,
        'name': ws.name,
        'description': ws.description,
        'createdAt': ws.created_at.isoformat()
    } for ws in workspaces])

@app.route('/api/admin/users/<int:user_id>/workspaces', methods=['PUT'])
@jwt_required()
def update_user_workspace_access(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': '사용자를 찾을 수 없습니다.'}), 404
    
    data = request.get_json()
    workspace_ids = data.get('workspaceIds', [])
    
    try:
        # 기존 워크스페이스 접근 권한 삭제
        UserWorkspace.query.filter_by(user_id=user_id).delete()
        
        # 새로운 워크스페이스 접근 권한 추가
        for workspace_id in workspace_ids:
            user_workspace = UserWorkspace(user_id=user_id, workspace_id=workspace_id)
            db.session.add(user_workspace)
        
        db.session.commit()
        return jsonify({'message': '워크스페이스 접근 권한이 업데이트되었습니다.'})
    
    except Exception as e:
        db.session.rollback()
        print(f"워크스페이스 접근 권한 업데이트 오류: {e}")
        return jsonify({'message': '워크스페이스 접근 권한 업데이트 중 오류가 발생했습니다.'}), 500

# 워크스페이스 관리 API
@app.route('/api/workspaces', methods=['GET'])
@jwt_required()
def get_user_workspaces():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    # 모든 사용자(관리자 포함)는 자신에게 할당된 승인된 워크스페이스만 조회
    user_workspace_ids = [uw.workspace_id for uw in current_user.user_workspaces]
    
    if user_workspace_ids:
        workspaces = Workspace.query.filter(
            Workspace.id.in_(user_workspace_ids),
            Workspace.status == 'approved'
        ).all()
    else:
        workspaces = []
    
    return jsonify([{
        'id': ws.id,
        'name': ws.name,
        'description': ws.description,
        'slackWebhookUrl': ws.slack_webhook_url,
        'webhookUrls': json.loads(ws.webhook_urls) if ws.webhook_urls else [],
        'checkinTime': ws.checkin_time.strftime('%H:%M') if ws.checkin_time else None,
        'middleTime': ws.middle_time.strftime('%H:%M') if ws.middle_time else None,
        'checkoutTime': ws.checkout_time.strftime('%H:%M') if ws.checkout_time else None,
        'qrImageUrl': ws.qr_image_url,
        'zoomUrl': ws.zoom_url,
        'zoomId': ws.zoom_id,
        'zoomPassword': ws.zoom_password,
        'status': ws.status,
        'createdBy': ws.creator.name if ws.creator else None,
        'createdAt': ws.created_at.isoformat(),
        'updatedAt': ws.updated_at.isoformat()
    } for ws in workspaces])

@app.route('/api/workspaces', methods=['POST'])
@jwt_required()
def create_workspace_by_user():
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # 웹훅 URL들을 JSON으로 저장
        webhook_urls = json.dumps(data.get('webhookUrls', []))
        
        # 시간 형식 변환
        checkin_time = None
        middle_time = None
        checkout_time = None
        
        if data.get('checkinTime'):
            checkin_time = datetime.strptime(data['checkinTime'], '%H:%M').time()
        if data.get('middleTime'):
            middle_time = datetime.strptime(data['middleTime'], '%H:%M').time()
        if data.get('checkoutTime'):
            checkout_time = datetime.strptime(data['checkoutTime'], '%H:%M').time()
        
        workspace = Workspace(
            name=data['name'],
            description=data.get('description', ''),
            slack_webhook_url=data.get('slackWebhookUrl', ''),
            webhook_urls=webhook_urls,
            checkin_time=checkin_time,
            middle_time=middle_time,
            checkout_time=checkout_time,
            zoom_url=data.get('zoomUrl', ''),
            zoom_id=data.get('zoomId', ''),
            zoom_password=data.get('zoomPassword', ''),
            created_by=current_user_id,
            status='pending'  # 승인 대기 상태로 생성
        )
        
        db.session.add(workspace)
        db.session.commit()
        
        return jsonify({
            'id': workspace.id,
            'name': workspace.name,
            'description': workspace.description,
            'slackWebhookUrl': workspace.slack_webhook_url,
            'webhookUrls': json.loads(workspace.webhook_urls) if workspace.webhook_urls else [],
            'checkinTime': workspace.checkin_time.strftime('%H:%M') if workspace.checkin_time else None,
            'middleTime': workspace.middle_time.strftime('%H:%M') if workspace.middle_time else None,
            'checkoutTime': workspace.checkout_time.strftime('%H:%M') if workspace.checkout_time else None,
            'qrImageUrl': workspace.qr_image_url,
            'zoomUrl': workspace.zoom_url,
            'zoomId': workspace.zoom_id,
            'zoomPassword': workspace.zoom_password,
            'status': workspace.status,
            'createdBy': workspace.creator.name if workspace.creator else None,
            'createdAt': workspace.created_at.isoformat(),
            'updatedAt': workspace.updated_at.isoformat()
        }), 201
        
    except Exception as e:
        print(f"워크스페이스 등록 오류: {str(e)}")
        return jsonify({'message': '워크스페이스 등록에 실패했습니다.'}), 500

@app.route('/api/admin/workspaces', methods=['POST'])
@jwt_required()
def create_workspace():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    data = request.get_json()
    
    workspace = Workspace(
        name=data['name'],
        description=data.get('description'),
        slack_webhook_url=data.get('slackWebhookUrl'),
        created_by=current_user_id,
        status='approved'  # 관리자가 직접 생성하는 경우 즉시 승인
    )
    
    db.session.add(workspace)
    db.session.commit()
    
    return jsonify({
        'id': workspace.id,
        'name': workspace.name,
        'description': workspace.description,
        'slackWebhookUrl': workspace.slack_webhook_url,
        'qrImageUrl': workspace.qr_image_url,
        'status': workspace.status,
        'createdBy': workspace.creator.name if workspace.creator else None,
        'createdAt': workspace.created_at.isoformat(),
        'updatedAt': workspace.updated_at.isoformat()
    }), 201

@app.route('/api/admin/workspaces', methods=['GET'])
@jwt_required()
def get_all_workspaces_admin():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    workspaces = Workspace.query.all()
    
    return jsonify([{
        'id': ws.id,
        'name': ws.name,
        'description': ws.description,
        'slackWebhookUrl': ws.slack_webhook_url,
        'qrImageUrl': ws.qr_image_url,
        'status': ws.status,
        'createdBy': ws.creator.name if ws.creator else None,
        'createdAt': ws.created_at.isoformat(),
        'updatedAt': ws.updated_at.isoformat()
    } for ws in workspaces])

@app.route('/api/admin/workspaces/pending', methods=['GET'])
@jwt_required()
def get_pending_workspaces():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    status_filter = request.args.get('status', 'pending')
    
    if status_filter == 'all':
        workspaces = Workspace.query.all()
    else:
        workspaces = Workspace.query.filter_by(status=status_filter).all()
    
    return jsonify([{
        'id': ws.id,
        'name': ws.name,
        'description': ws.description,
        'slackWebhookUrl': ws.slack_webhook_url,
        'qrImageUrl': ws.qr_image_url,
        'status': ws.status,
        'createdBy': ws.creator.name if ws.creator else None,
        'createdAt': ws.created_at.isoformat(),
        'updatedAt': ws.updated_at.isoformat()
    } for ws in workspaces])

@app.route('/api/admin/workspaces/<int:workspace_id>/approve', methods=['PUT'])
@jwt_required()
def approve_workspace(workspace_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    workspace = Workspace.query.get(workspace_id)
    if not workspace:
        return jsonify({'message': '워크스페이스를 찾을 수 없습니다.'}), 404
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['approved', 'rejected']:
        return jsonify({'message': '유효하지 않은 상태입니다.'}), 400
    
    workspace.status = new_status
    workspace.updated_at = datetime.utcnow()
    
    # 승인된 경우 워크스페이스 생성자에게 접근 권한 부여
    if new_status == 'approved':
        existing_access = UserWorkspace.query.filter_by(
            user_id=workspace.created_by,
            workspace_id=workspace.id
        ).first()
        
        if not existing_access:
            user_workspace = UserWorkspace(
                user_id=workspace.created_by,
                workspace_id=workspace.id
            )
            db.session.add(user_workspace)
    
    db.session.commit()
    
    return jsonify({'message': f'워크스페이스가 {new_status}되었습니다.'})

@app.route('/api/workspaces/<int:workspace_id>', methods=['GET'])
@jwt_required()
def get_workspace_detail(workspace_id):
    try:
        current_user_id = int(get_jwt_identity())
        
        # 사용자가 해당 워크스페이스에 접근 권한이 있는지 확인
        user_workspace = UserWorkspace.query.filter_by(
            user_id=current_user_id,
            workspace_id=workspace_id
        ).first()
        
        if not user_workspace:
            return jsonify({'message': '워크스페이스에 접근 권한이 없습니다.'}), 403
        
        workspace = Workspace.query.get(workspace_id)
        if not workspace:
            return jsonify({'message': '워크스페이스를 찾을 수 없습니다.'}), 404
        
        return jsonify({
            'id': workspace.id,
            'name': workspace.name,
            'description': workspace.description,
            'slackWebhookUrl': workspace.slack_webhook_url,
            'webhookUrls': json.loads(workspace.webhook_urls) if workspace.webhook_urls else [],
            'checkinTime': workspace.checkin_time.strftime('%H:%M') if workspace.checkin_time else None,
            'middleTime': workspace.middle_time.strftime('%H:%M') if workspace.middle_time else None,
            'checkoutTime': workspace.checkout_time.strftime('%H:%M') if workspace.checkout_time else None,
            'qrImageUrl': workspace.qr_image_url,
            'zoomUrl': workspace.zoom_url,
            'zoomId': workspace.zoom_id,
            'zoomPassword': workspace.zoom_password,
            'status': workspace.status,
            'createdBy': workspace.creator.name if workspace.creator else None,
            'createdAt': workspace.created_at.isoformat(),
            'updatedAt': workspace.updated_at.isoformat()
        })
        
    except Exception as e:
        print(f"워크스페이스 조회 오류: {str(e)}")
        return jsonify({'message': '워크스페이스 조회에 실패했습니다.'}), 500

@app.route('/api/workspaces/<int:workspace_id>', methods=['PUT'])
@jwt_required()
def update_workspace(workspace_id):
    try:
        current_user_id = int(get_jwt_identity())
        current_user = User.query.get(current_user_id)
        
        workspace = Workspace.query.get(workspace_id)
        if not workspace:
            return jsonify({'message': '워크스페이스를 찾을 수 없습니다.'}), 404
        
        # 관리자이거나 워크스페이스 생성자인 경우에만 수정 가능
        if not current_user.is_admin and workspace.created_by != current_user_id:
            return jsonify({'message': '워크스페이스 수정 권한이 없습니다.'}), 403
        
        data = request.get_json()
        
        # 웹훅 URL들을 JSON으로 저장
        if 'webhookUrls' in data:
            workspace.webhook_urls = json.dumps(data['webhookUrls'])
        
        # 시간 형식 변환
        if 'checkinTime' in data and data['checkinTime']:
            workspace.checkin_time = datetime.strptime(data['checkinTime'], '%H:%M').time()
        elif 'checkinTime' in data and not data['checkinTime']:
            workspace.checkin_time = None
            
        if 'middleTime' in data and data['middleTime']:
            workspace.middle_time = datetime.strptime(data['middleTime'], '%H:%M').time()
        elif 'middleTime' in data and not data['middleTime']:
            workspace.middle_time = None
            
        if 'checkoutTime' in data and data['checkoutTime']:
            workspace.checkout_time = datetime.strptime(data['checkoutTime'], '%H:%M').time()
        elif 'checkoutTime' in data and not data['checkoutTime']:
            workspace.checkout_time = None
        
        # 다른 필드들 업데이트
        if 'name' in data:
            workspace.name = data['name']
        if 'description' in data:
            workspace.description = data['description']
        if 'slackWebhookUrl' in data:
            workspace.slack_webhook_url = data['slackWebhookUrl']
        if 'zoomUrl' in data:
            workspace.zoom_url = data['zoomUrl']
        if 'zoomId' in data:
            workspace.zoom_id = data['zoomId']
        if 'zoomPassword' in data:
            workspace.zoom_password = data['zoomPassword']
        
        workspace.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'id': workspace.id,
            'name': workspace.name,
            'description': workspace.description,
            'slackWebhookUrl': workspace.slack_webhook_url,
            'webhookUrls': json.loads(workspace.webhook_urls) if workspace.webhook_urls else [],
            'checkinTime': workspace.checkin_time.strftime('%H:%M') if workspace.checkin_time else None,
            'middleTime': workspace.middle_time.strftime('%H:%M') if workspace.middle_time else None,
            'checkoutTime': workspace.checkout_time.strftime('%H:%M') if workspace.checkout_time else None,
            'qrImageUrl': workspace.qr_image_url,
            'zoomUrl': workspace.zoom_url,
            'zoomId': workspace.zoom_id,
            'zoomPassword': workspace.zoom_password,
            'status': workspace.status,
            'createdBy': workspace.creator.name if workspace.creator else None,
            'createdAt': workspace.created_at.isoformat(),
            'updatedAt': workspace.updated_at.isoformat()
        })
        
    except Exception as e:
        print(f"워크스페이스 수정 오류: {str(e)}")
        db.session.rollback()
        return jsonify({'message': '워크스페이스 수정에 실패했습니다.'}), 500

@app.route('/api/workspaces/<int:workspace_id>/qr', methods=['POST'])
@jwt_required()
def upload_workspace_qr_image(workspace_id):
    try:
        current_user_id = int(get_jwt_identity())
        
        # 사용자가 해당 워크스페이스에 접근 권한이 있는지 확인
        user_workspace = UserWorkspace.query.filter_by(
            user_id=current_user_id,
            workspace_id=workspace_id
        ).first()
        
        if not user_workspace:
            return jsonify({'message': '워크스페이스에 접근 권한이 없습니다.'}), 403
        
        workspace = Workspace.query.get(workspace_id)
        if not workspace:
            return jsonify({'message': '워크스페이스를 찾을 수 없습니다.'}), 404
        
        if 'qrImage' not in request.files:
            return jsonify({'message': 'QR 이미지가 없습니다.'}), 400
        
        file = request.files['qrImage']
        if file.filename == '':
            return jsonify({'message': '파일이 선택되지 않았습니다.'}), 400
        
        if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            # 파일명을 워크스페이스 ID로 고유하게 생성
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            filename = f'workspace_{workspace_id}_qr.{file_extension}'
            file_path = os.path.join('static', 'qr_images', filename)
            
            # 디렉토리가 없으면 생성
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            file.save(file_path)
            
            # 데이터베이스에 URL 저장
            qr_url = f'/static/qr_images/{filename}'
            workspace.qr_image_url = qr_url
            workspace.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({
                'message': 'QR 이미지가 업로드되었습니다.',
                'qrImageUrl': qr_url
            })
        else:
            return jsonify({'message': '지원되지 않는 파일 형식입니다.'}), 400
            
    except Exception as e:
        print(f"QR 이미지 업로드 오류: {str(e)}")
        return jsonify({'message': 'QR 이미지 업로드에 실패했습니다.'}), 500

@app.route('/api/workspaces/<int:workspace_id>/leave', methods=['DELETE'])
@jwt_required()
def leave_workspace(workspace_id):
    try:
        current_user_id = int(get_jwt_identity())
        print(f"워크스페이스 나가기 요청 - 사용자 ID: {current_user_id}, 워크스페이스 ID: {workspace_id}")
        
        # 워크스페이스가 존재하는지 확인
        workspace = Workspace.query.get(workspace_id)
        if not workspace:
            print(f"워크스페이스를 찾을 수 없음: {workspace_id}")
            return jsonify({'message': '워크스페이스를 찾을 수 없습니다.'}), 404
        
        # 사용자-워크스페이스 연결 삭제
        user_workspace = UserWorkspace.query.filter_by(
            user_id=current_user_id,
            workspace_id=workspace_id
        ).first()
        
        if not user_workspace:
            print(f"사용자-워크스페이스 연결을 찾을 수 없음: 사용자 {current_user_id}, 워크스페이스 {workspace_id}")
            return jsonify({'message': '워크스페이스에 할당되지 않았습니다.'}), 404
        
        print(f"사용자-워크스페이스 연결 삭제: {user_workspace.id}")
        db.session.delete(user_workspace)
        db.session.commit()
        
        return jsonify({'message': '워크스페이스 할당이 해제되었습니다.'})
        
    except Exception as e:
        print(f"워크스페이스 나가기 오류: {str(e)}")
        db.session.rollback()
        return jsonify({'message': '워크스페이스 나가기 중 오류가 발생했습니다.'}), 500

@app.route('/api/admin/workspaces/<int:workspace_id>/qr', methods=['POST'])
@jwt_required()
def upload_qr_image(workspace_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    workspace = Workspace.query.get(workspace_id)
    if not workspace:
        return jsonify({'message': '워크스페이스를 찾을 수 없습니다.'}), 404
    
    if 'qr_image' not in request.files:
        return jsonify({'message': 'QR 이미지 파일이 필요합니다.'}), 400
    
    file = request.files['qr_image']
    if file.filename == '':
        return jsonify({'message': '파일이 선택되지 않았습니다.'}), 400
    
    if file:
        # 파일 확장자 검증
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
        if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({'message': '지원하지 않는 파일 형식입니다.'}), 400
        
        # 파일명 생성 (타임스탬프 포함)
        import os
        import time
        filename = f"qr_{workspace_id}_{int(time.time())}.{file.filename.rsplit('.', 1)[1].lower()}"
        
        # static/qr 디렉토리 생성 (없는 경우)
        qr_dir = os.path.join(os.path.dirname(__file__), 'static', 'qr')
        if not os.path.exists(qr_dir):
            os.makedirs(qr_dir)
        
        # 파일 저장
        file_path = os.path.join(qr_dir, filename)
        file.save(file_path)
        
        # URL 생성 (절대 경로로)
        image_url = f"http://localhost:5000/static/qr/{filename}"
        
        # 워크스페이스 업데이트
        workspace.qr_image_url = image_url
        db.session.commit()
        
        return jsonify({'imageUrl': image_url}), 200

# 정적 파일 서빙을 위한 라우트
@app.route('/static/qr/<filename>')
def serve_qr_image(filename):
    import os
    from flask import send_from_directory
    qr_dir = os.path.join(os.path.dirname(__file__), 'static', 'qr')
    return send_from_directory(qr_dir, filename)

# 공지사항 관리 API
@app.route('/api/notices', methods=['POST'])
@jwt_required()
def create_notice():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    notice = Notice(
        type=data['type'],
        title=data['title'],
        message=data['message'],
        workspace_id=data['workspaceId'],
        created_by=current_user_id,
        scheduled_at=datetime.fromisoformat(data['scheduledAt'].replace('Z', '+00:00')),
        no_image=data.get('noImage', False),
        form_data=json.dumps(data.get('formData', {}))
    )
    
    db.session.add(notice)
    db.session.commit()
    
    # 스케줄러에 작업 추가
    job_id = f"notice_{notice.id}_{datetime.now().timestamp()}"
    
    scheduled_job = ScheduledJob(
        notice_id=notice.id,
        job_id=job_id,
        scheduled_at=notice.scheduled_at
    )
    
    db.session.add(scheduled_job)
    db.session.commit()
    
    # APScheduler에 작업 등록
    scheduler.add_job(
        func=send_notice,
        trigger="date",
        run_date=notice.scheduled_at,
        args=[notice.id],
        id=job_id
    )
    
    return jsonify({'message': '공지사항이 예약되었습니다.', 'id': notice.id}), 201

@app.route('/api/notices', methods=['GET'])
@jwt_required()
def get_notices():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if current_user.is_admin:
        notices = Notice.query.all()
    else:
        # 사용자가 접근 가능한 워크스페이스의 공지만 조회
        user_workspace_ids = [uw.workspace_id for uw in current_user.user_workspaces]
        notices = Notice.query.filter(Notice.workspace_id.in_(user_workspace_ids)).all()
    
    return jsonify([{
        'id': notice.id,
        'type': notice.type,
        'title': notice.title,
        'message': notice.message,
        'workspaceId': notice.workspace_id,
        'createdBy': notice.created_by,
        'scheduledAt': notice.scheduled_at.isoformat(),
        'status': notice.status,
        'createdAt': notice.created_at.isoformat()
    } for notice in notices])

# 공지 전송 함수
def send_notice(notice_id):
    with app.app_context():
        notice = Notice.query.get(notice_id)
        scheduled_job = ScheduledJob.query.filter_by(notice_id=notice_id).first()
        
        if not notice or not scheduled_job:
            return
        
        try:
            workspace = Workspace.query.get(notice.workspace_id)
            
            if not workspace.slack_webhook_url:
                raise Exception("Slack Webhook URL이 설정되지 않았습니다.")
            
            # Slack 메시지 구성
            slack_data = {
                "text": notice.title,
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": notice.message
                        }
                    }
                ]
            }
            
            # QR 이미지 추가 (no_image가 False인 경우)
            if not notice.no_image and workspace.qr_image_url:
                slack_data["blocks"].append({
                    "type": "image",
                    "image_url": workspace.qr_image_url,
                    "alt_text": "QR Code"
                })
            
            # Slack으로 전송
            response = requests.post(workspace.slack_webhook_url, json=slack_data)
            response.raise_for_status()
            
            # 성공 처리
            notice.status = 'sent'
            notice.sent_at = datetime.utcnow()
            scheduled_job.status = 'completed'
            scheduled_job.executed_at = datetime.utcnow()
            
        except Exception as e:
            # 실패 처리
            notice.status = 'failed'
            notice.error_message = str(e)
            scheduled_job.status = 'failed'
            scheduled_job.executed_at = datetime.utcnow()
            scheduled_job.error_message = str(e)
        
        db.session.commit()

# 스케줄러 작업 조회 (관리자만)
@app.route('/api/admin/scheduler/jobs', methods=['GET'])
@jwt_required()
def get_scheduled_jobs():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({'message': '관리자 권한이 필요합니다.'}), 403
    
    jobs = ScheduledJob.query.all()
    return jsonify([{
        'id': job.id,
        'noticeId': job.notice_id,
        'status': job.status,
        'scheduledAt': job.scheduled_at.isoformat(),
        'executedAt': job.executed_at.isoformat() if job.executed_at else None,
        'error': job.error_message
    } for job in jobs])

# 데이터베이스 초기화 및 관리자 계정 생성
def init_db():
    with app.app_context():
        db.create_all()
        
        # 관리자 계정 생성 (이미 존재하지 않는 경우)
        admin_user = User.query.filter_by(email='admin@day1company.co.kr').first()
        if not admin_user:
            admin_user = User(
                email='admin@day1company.co.kr',
                password_hash=generate_password_hash('Camp1017!!'),
                name='System Administrator',
                is_admin=True,
                is_approved=True
            )
            db.session.add(admin_user)
            db.session.commit()
            print("관리자 계정이 생성되었습니다.")
            print("ID: admin@day1company.co.kr")
            print("PW: Camp1017!!")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000) 