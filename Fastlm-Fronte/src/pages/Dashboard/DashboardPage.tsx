import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface NoticeStatistics {
  total: number;
  sent: number;
  scheduled: number;
  failed: number;
}

interface WeeklyNotice {
  id: number;
  title: string;
  scheduledAt: string;
  status: string;
  type: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedWorkspace } = useWorkspace();
  const [statistics, setStatistics] = useState<NoticeStatistics>({
    total: 0,
    sent: 0,
    scheduled: 0,
    failed: 0
  });
  const [weeklyNotices, setWeeklyNotices] = useState<WeeklyNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedNotices, setSelectedNotices] = useState<WeeklyNotice[]>([]);
  const [showModal, setShowModal] = useState(false);

  // 공지 통계 가져오기
  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notices/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('공지 통계를 가져오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  // 금주 예약목록 가져오기
  const fetchWeeklyNotices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notices/weekly', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeeklyNotices(data);
      }
    } catch (error) {
      console.error('금주 예약목록을 가져오는데 실패했습니다:', error);
    } finally {
      setWeeklyLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchWeeklyNotices();
  }, [selectedWorkspace]);

  // 주가 바뀔 때마다 금주 예약목록 업데이트
  useEffect(() => {
    const updateWeeklyNotices = () => {
      fetchWeeklyNotices();
    };

    // 매일 자정에 업데이트
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeoutId = setTimeout(() => {
      updateWeeklyNotices();
      // 이후 24시간마다 반복
      setInterval(updateWeeklyNotices, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date, notices: WeeklyNotice[]) => {
    setSelectedDate(date);
    setSelectedNotices(notices);
    setShowModal(true);
  };

  // +N개 더 클릭 핸들러
  const handleMoreClick = (date: Date, notices: WeeklyNotice[]) => {
    setSelectedDate(date);
    setSelectedNotices(notices);
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setSelectedNotices([]);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);



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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 1. 공지 관리 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">공지 관리</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                to="/notices/calendar"
                className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <span className="text-2xl mb-2">📅</span>
                <span className="text-sm font-medium text-gray-900">공지 캘린더</span>
              </Link>
            </div>
          </div>

          {/* 2. 공지 현황 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 공지 수</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : statistics.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">전송 완료</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : statistics.sent}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">⏰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">대기 중</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : statistics.scheduled}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">❌</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">전송 실패</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : statistics.failed}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 금주 예약목록 - 캘린더 형식 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">금주 예약목록</h2>
            {weeklyLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">로딩 중...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => {
                      const today = new Date();
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // 월요일부터 시작
                      const dayDate = new Date(startOfWeek);
                      dayDate.setDate(startOfWeek.getDate() + index);
                      
                      const isToday = dayDate.toDateString() === today.toDateString();
                      
                      return (
                        <div key={index} className={`text-center p-2 rounded-lg ${isToday ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'}`}>
                          <div className="text-sm font-medium">{day}</div>
                          <div className="text-xs">{dayDate.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 예약목록 */}
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, index) => {
                      const today = new Date();
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
                      const dayDate = new Date(startOfWeek);
                      dayDate.setDate(startOfWeek.getDate() + index);
                      
                      const dayNotices = weeklyNotices.filter(notice => {
                        const noticeDate = new Date(notice.scheduledAt);
                        return noticeDate.toDateString() === dayDate.toDateString();
                      });
                      
                      const isToday = dayDate.toDateString() === today.toDateString();
                      
                      return (
                        <div 
                          key={index} 
                          className={`min-h-24 p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                          onClick={() => handleDateClick(dayDate, dayNotices)}
                          title={dayNotices.length > 0 ? `${dayNotices.length}개의 공지가 예약되어 있습니다. 클릭하여 자세히 보기` : '클릭하여 공지 목록 보기'}
                        >
                          {dayNotices.length > 0 ? (
                            <div className="space-y-1">
                              {dayNotices.slice(0, 3).map((notice) => (
                                <div
                                  key={notice.id}
                                  className={`text-xs p-1 rounded truncate ${
                                    notice.status === 'sent' ? 'bg-green-100 text-green-800' :
                                    notice.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                                    notice.status === 'failed' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}
                                  title={notice.title}
                                >
                                  {notice.title}
                                </div>
                              ))}
                              {dayNotices.length > 3 && (
                                <div 
                                  className="text-xs text-blue-600 text-center hover:text-blue-800 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoreClick(dayDate, dayNotices);
                                  }}
                                >
                                  +{dayNotices.length - 3}개 더
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 text-center mt-2">예약 없음</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. 워크스페이스 관리 */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">워크스페이스 관리</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/workspace"
                className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <span className="text-2xl mb-2">🏢</span>
                <span className="text-sm font-medium text-gray-900">워크스페이스 선택</span>
              </Link>
              {selectedWorkspace && (
                <Link
                  to={`/workspace/edit/${selectedWorkspace.id}`}
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-2xl mb-2">⚙️</span>
                  <span className="text-sm font-medium text-gray-900">워크스페이스 편집</span>
                </Link>
              )}
            </div>
          </div>


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

      {/* 공지 상세 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate?.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })} 공지 목록
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedNotices.length > 0 ? (
                <div className="space-y-4">
                  {selectedNotices.map((notice) => (
                    <div key={notice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{notice.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                              {notice.type}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {new Date(notice.scheduledAt).toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notice.status === 'sent' ? 'bg-green-100 text-green-800' :
                            notice.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                            notice.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notice.status === 'sent' ? '전송 완료' :
                             notice.status === 'scheduled' ? '대기 중' :
                             notice.status === 'failed' ? '전송 실패' :
                             notice.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📅</div>
                  <p className="text-gray-500">이 날짜에는 예약된 공지가 없습니다.</p>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;