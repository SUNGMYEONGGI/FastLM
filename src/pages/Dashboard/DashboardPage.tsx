import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Bell, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { noticeAPI, userAPI, zoomAPI } from '../../services/api';

const DashboardPage: React.FC = () => {
  const { selectedWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalNotices: 0,
    scheduledNotices: 0,
    sentNotices: 0,
    totalUsers: 0,
    zoomExits: 0
  });
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [notices, users, zoomRecords] = await Promise.all([
          noticeAPI.getAllNotices(),
          user?.isAdmin ? userAPI.getAllUsers() : Promise.resolve([]),
          zoomAPI.getExitRecords()
        ]);

        setStats({
          totalNotices: notices.length,
          scheduledNotices: notices.filter(n => n.status === 'scheduled').length,
          sentNotices: notices.filter(n => n.status === 'sent').length,
          totalUsers: users.length,
          zoomExits: zoomRecords.length
        });

        setRecentNotices(notices.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const statCards = [
    {
      title: '전체 공지사항',
      value: stats.totalNotices,
      icon: Bell,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: '예약된 공지',
      value: stats.scheduledNotices,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: '전송 완료',
      value: stats.sentNotices,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    ...(user?.isAdmin ? [{
      title: '전체 사용자',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }] : []),
    {
      title: 'Zoom 퇴실 기록',
      value: stats.zoomExits,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
              <p className="text-gray-600 mt-1">
                {selectedWorkspace ? `${selectedWorkspace.name} 워크스페이스` : '워크스페이스를 선택하세요'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">WorkSpace Manager</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notices */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">최근 공지사항</h2>
            </div>
            <div className="p-6">
              {recentNotices.length > 0 ? (
                <div className="space-y-4">
                  {recentNotices.map((notice: any) => (
                    <div key={notice.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        notice.status === 'sent' ? 'bg-green-500' :
                        notice.status === 'scheduled' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{notice.title}</p>
                        <p className="text-xs text-gray-500">
                          {notice.type === 'attendance' ? '출석' : 
                           notice.type === 'satisfaction' ? '만족도' : '스레드'}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(notice.scheduledAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">최근 공지사항이 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">빠른 작업</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">새 공지사항 작성</span>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">캘린더 보기</span>
                  </div>
                  <span className="text-green-600">→</span>
                </button>
                
                {user?.isAdmin && (
                  <>
                    <button className="w-full flex items-center justify-between p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-900">사용자 관리</span>
                      </div>
                      <span className="text-purple-600">→</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-orange-600" />
                        <span className="font-medium text-orange-900">워크스페이스 관리</span>
                      </div>
                      <span className="text-orange-600">→</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Info */}
        {selectedWorkspace && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">현재 워크스페이스 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedWorkspace.name}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {selectedWorkspace.description || '설명이 없습니다.'}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>생성일: {new Date(selectedWorkspace.createdAt).toLocaleDateString()}</span>
                  <span>수정일: {new Date(selectedWorkspace.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {selectedWorkspace.qrImageUrl ? (
                  <div className="text-center">
                    <img 
                      src={selectedWorkspace.qrImageUrl} 
                      alt="QR Code" 
                      className="w-32 h-32 mx-auto mb-2 border border-gray-200 rounded-lg"
                    />
                    <p className="text-sm text-gray-600">QR 코드</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-4xl">📱</span>
                    </div>
                    <p className="text-sm">QR 코드 없음</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;