import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Building2, 
  Bell, 
  Calendar, 
  Settings, 
  LogOut,
  Shield,
  Clock,
  QrCode,
  Bot,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { workspaceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedWorkspace, selectWorkspace, refreshWorkspaces } = useWorkspace();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLeaveCurrentWorkspace = async () => {
    if (!selectedWorkspace) return;
    
    if (!window.confirm(`'${selectedWorkspace.name}' 워크스페이스에서 나가시겠습니까?`)) {
      return;
    }

    try {
      await workspaceAPI.leaveWorkspace(selectedWorkspace.id);
      toast.success('워크스페이스에서 나갔습니다.');
      selectWorkspace(null); // 현재 선택 해제
      refreshWorkspaces();
      navigate('/workspace');
    } catch (error) {
      console.error('워크스페이스 나가기 실패:', error);
      toast.error('워크스페이스에서 나가는데 실패했습니다.');
    }
  };

  // 워크스페이스가 없어도 접근 가능한 메뉴
  const generalNavItems = [
    { to: '/workspace', icon: Building2, label: '워크스페이스 선택' },
    { to: '/workspace/register', icon: Plus, label: '워크스페이스 등록' },
  ];

  // 워크스페이스가 있을 때만 접근 가능한 메뉴
  const workspaceNavItems = [
    { to: '/dashboard', icon: Home, label: '대시보드' },
    { to: '/notices/attendance', icon: Bell, label: '출결 공지' },
    { to: '/notices/satisfaction', icon: Bell, label: '만족도 공지' },
    { to: '/notices/thread', icon: Bell, label: '스레드 공지' },
    { to: '/notices/manage', icon: Calendar, label: '공지 관리' },
    { to: '/notices/calendar', icon: Calendar, label: '공지 캘린더' },
    { to: '/qr', icon: QrCode, label: 'QR 관리' },
    { to: '/bot-setting', icon: Bot, label: '봇 설정' },
    { to: '/zoom/exit-records', icon: Clock, label: 'Zoom 퇴실 기록' },
  ];

  const adminNavItems = [
    { to: '/admin', icon: Shield, label: '관리자 메뉴' },
    { to: '/admin/users', icon: Users, label: '사용자 관리' },
    { to: '/admin/workspace/manage', icon: Building2, label: '워크스페이스 관리' },
    { to: '/admin/workspace/approval', icon: Shield, label: '워크스페이스 승인' },
    { to: '/admin/scheduler/jobs', icon: Settings, label: '스케줄러 관리' },
  ];

  return (
    <div className="bg-white shadow-lg h-screen w-64 fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WorkSpace</h1>
            <p className="text-sm text-gray-500">Management</p>
          </div>
        </div>
      </div>

      {selectedWorkspace ? (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900">현재 워크스페이스</p>
              <p className="text-lg font-semibold text-blue-700 truncate">{selectedWorkspace.name}</p>
            </div>
            <button
              onClick={handleLeaveCurrentWorkspace}
              className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
              title="워크스페이스에서 나가기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm font-medium text-yellow-900">워크스페이스 미선택</p>
          <p className="text-xs text-yellow-700">워크스페이스를 선택해주세요</p>
        </div>
      )}

      <nav 
        className="mt-6 overflow-y-auto" 
        style={{ height: 'calc(100vh - 200px)', paddingBottom: '120px' }}
        onWheel={(e) => {
          const element = e.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = element;
          const isAtTop = scrollTop === 0;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1; // 1px 여유
          
          // 스크롤이 끝에 도달했을 때 이벤트 전파 방지
          if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {/* 일반 메뉴 (항상 표시) */}
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            일반 메뉴
          </p>
          <ul className="space-y-1">
            {generalNavItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* 워크스페이스 메뉴 (워크스페이스가 선택된 경우에만 표시) */}
        {selectedWorkspace && (
          <div className="px-4 mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              워크스페이스 메뉴
            </p>
            <ul className="space-y-1">
              {workspaceNavItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 관리자 메뉴 (관리자인 경우에만 표시) */}
        {user?.isAdmin && (
          <div className="px-4 mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              관리자 메뉴
            </p>
            <ul className="space-y-1">
              {adminNavItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
              {user?.isAdmin && (
                <div className="flex items-center ml-2 flex-shrink-0">
                  <Shield className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-500 font-medium ml-1 whitespace-nowrap">관리자</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-2 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default Sidebar;