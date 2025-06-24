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
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: Home, label: '대시보드' },
    { to: '/notices', icon: Bell, label: '공지사항' },
    { to: '/calendar', icon: Calendar, label: '캘린더' },
    { to: '/zoom-records', icon: Clock, label: 'Zoom 퇴실 기록' },
  ];

  const adminNavItems = [
    { to: '/admin/users', icon: Users, label: '사용자 관리' },
    { to: '/admin/workspaces', icon: Building2, label: '워크스페이스 관리' },
    { to: '/admin/scheduler', icon: Settings, label: '스케줄러 관리' },
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

      {selectedWorkspace && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <p className="text-sm font-medium text-blue-900">현재 워크스페이스</p>
          <p className="text-lg font-semibold text-blue-700">{selectedWorkspace.name}</p>
        </div>
      )}

      <nav className="mt-6">
        <div className="px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            메인 메뉴
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => (
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

        {user?.isAdmin && (
          <div className="px-4 mt-8">
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

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            {user?.isAdmin && (
              <div className="flex items-center mt-1">
                <Shield className="w-3 h-3 text-red-500 mr-1" />
                <span className="text-xs text-red-500 font-medium">관리자</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3" />
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default Sidebar;