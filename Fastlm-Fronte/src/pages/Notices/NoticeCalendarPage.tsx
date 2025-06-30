import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { Notice } from '../../types';
import { noticeAPI } from '../../services/api';

const NoticeCalendarPage: React.FC = () => {
  const { selectedWorkspace } = useContext(WorkspaceContext);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (selectedWorkspace) {
      loadNotices();
    }
  }, [selectedWorkspace]);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await noticeAPI.getAllNotices();
      // 선택된 워크스페이스의 공지만 필터링
      const filteredData = selectedWorkspace 
        ? data.filter(notice => notice.workspaceId === selectedWorkspace.id)
        : data;
      setNotices(filteredData);
    } catch (error) {
      toast.error('공지사항을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 달력 생성 로직
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getNoticesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return notices.filter(notice => notice.scheduledAt.startsWith(dateStr));
  };

  const getNoticeColor = (type: string, status: string) => {
    if (status === 'failed') return 'bg-red-100 border-red-300 text-red-800';
    if (status === 'sent') return 'bg-green-100 border-green-300 text-green-800';
    
    switch (type) {
      case 'attendance': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'satisfaction': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'thread': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'attendance': return '📝';
      case 'satisfaction': return '📋'; 
      case 'thread': return '💬';
      default: return '📄';
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  if (!selectedWorkspace) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">워크스페이스를 먼저 선택해주세요.</p>
              <Link to="/workspace" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
                워크스페이스 선택하기
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 탭 네비게이션 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <Link to="/notices/attendance" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 예약</Link>
              <Link to="/notices/customize" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 커스터마이징</Link>
              <Link to="/notices/manage" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 관리</Link>
              <Link to="/notices/calendar" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap">공지 캘린더</Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">공지 캘린더</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    워크스페이스: {selectedWorkspace?.name} - 예약된 공지사항을 달력 형태로 확인할 수 있습니다.
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    ‹
                  </button>
                  <h2 className="text-lg font-semibold">
                    {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
                  </h2>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>

            {/* 범례 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">상태:</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
                    <span>예약됨</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                    <span>전송 완료</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                    <span>전송 실패</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">유형:</span>
                  <div className="flex items-center space-x-1">
                    <span>📝</span>
                    <span>출결</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>📋</span>
                    <span>만족도</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>💬</span>
                    <span>질문</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 달력 */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center font-medium text-gray-700 bg-gray-100">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const dayNotices = getNoticesForDate(day);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border border-gray-200 ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`text-sm ${
                        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        {dayNotices.slice(0, 3).map(notice => (
                          <div
                            key={notice.id}
                            className={`px-2 py-1 rounded text-xs border ${getNoticeColor(notice.type, notice.status)}`}
                            title={`${notice.title} - ${new Date(notice.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{getTypeIcon(notice.type)}</span>
                              <span className="truncate">
                                {new Date(notice.scheduledAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {dayNotices.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayNotices.length - 3}개 더
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NoticeCalendarPage; 