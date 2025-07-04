import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspace();

  const menuItems = [
    {
      title: '공지사항 관리',
      description: '공지 예약, 커스터마이징, 관리를 수행합니다',
      icon: '📢',
      links: [
        { name: '공지 예약', path: '/notices/schedule' },
        { name: '공지 커스터마이징', path: '/notices/customize' },
        { name: '공지 관리', path: '/notices/manage' },
        { name: '공지 캘린더', path: '/notices/calendar' }
      ]
    },
    {
      title: '워크스페이스 관리',
      description: '워크스페이스를 관리 합니다',
      icon: '🏢',
      links: [
        { name: '워크스페이스 선택', path: '/workspace' },
        ...(selectedWorkspace ? [{ name: '워크스페이스 편집', path: `/workspace/edit/${selectedWorkspace.id}` }] : []),
      ]
    },
  ];

  const adminMenuItems = [
    {
      title: '관리자 기능',
      description: '시스템 관리 기능입니다',
      icon: '👑',
      links: [
        { name: '관리자 메뉴', path: '/admin' },
        { name: '사용자 관리', path: '/admin/users' },
        { name: '워크스페이스 관리', path: '/admin/workspace/manage' },
        { name: '워크스페이스 승인', path: '/admin/workspace/approval' },
        { name: '스케줄러 작업', path: '/admin/scheduler/jobs' },
        { name: 'Zoom 퇴실 기록', path: '/zoom/exit-records' }
      ]
    }
  ];

  return (
    <Layout>
      <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
                <p className="text-gray-600 mt-1">
                  안녕하세요, {user?.name}님! FastLM 관리 시스템에 오신 것을 환영합니다.
                </p>
                {selectedWorkspace ? (
                  <p className="text-sm text-blue-600 mt-1">
                    현재 워크스페이스: {selectedWorkspace.name}
                  </p>
                ) : (
                  <p className="text-sm text-yellow-600 mt-1">
                    ⚠️ 워크스페이스가 선택되지 않았습니다. 일부 기능이 제한될 수 있습니다.
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      <div className="min-h-screen bg-gray-50">
        {/* 빠른 액션 - 상단으로 이동 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 액션</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/notices/schedule"
                className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="text-2xl mb-2">📝</span>
                <span className="text-sm font-medium text-gray-900">공지 예약</span>
              </Link>
              <Link
                to="/notices/customize"
                className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl mb-2">🛠️</span>
                <span className="text-sm font-medium text-gray-900">공지 커스터마이징</span>
              </Link>
              <Link
                to="/notices/manage"
                className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <span className="text-2xl mb-2">⚙️</span>
                <span className="text-sm font-medium text-gray-900">공지 관리</span>
              </Link>
              <Link
                to={`/workspace/edit/${selectedWorkspace?.id}`}
                className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <span className="text-2xl mb-2">🏢</span>
                <span className="text-sm font-medium text-gray-900">워크스페이스 편집</span>
              </Link>
            </div>
          </div>
        </div>
        

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 메인 기능 카드들 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {menuItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {item.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      to={link.path}
                      className="block text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                      → {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 관리자 기능 (관리자에게만 표시) */}
          {user?.isAdmin && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">관리자 기능</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {adminMenuItems.map((item, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow p-6 border border-purple-200">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{item.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {item.links.map((link, linkIndex) => (
                        <Link
                          key={linkIndex}
                          to={link.path}
                          className="block text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                        >
                          → {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 시스템 정보 */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">시스템 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">사용자 유형:</span>
                <span className="ml-2 text-gray-600">
                  {user?.isAdmin ? '관리자' : '일반 사용자'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">선택된 워크스페이스:</span>
                <span className="ml-2 text-gray-600">
                  {selectedWorkspace ? selectedWorkspace.name : '없음'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">마지막 로그인:</span>
                <span className="ml-2 text-gray-600">
                  {new Date().toLocaleString('ko-KR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;