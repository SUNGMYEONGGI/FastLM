import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { Notice } from '../../types';
import { noticeAPI } from '../../services/api';

const NoticeCalendarPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedNotices, setSelectedNotices] = useState<Notice[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await noticeAPI.getAllNotices();
      setNotices(data);
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

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date, dayNotices: Notice[]) => {
    setSelectedDate(date);
    setSelectedNotices(dayNotices);
    setShowModal(true);
  };

  // +N개 더 클릭 핸들러
  const handleMoreClick = (date: Date, dayNotices: Notice[]) => {
    setSelectedDate(date);
    setSelectedNotices(dayNotices);
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

  const days = getDaysInMonth(currentDate);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

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
              <Link to="/notices/schedule" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 예약</Link>
              <Link to="/notices/customize" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 커스터마이징</Link>
              <Link to="/notices/manage" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 관리</Link>
              <Link to="/notices/calendar" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap">공지 캘린더</Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">공지 캘린더</h1>
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
                      className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
                        isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                      }`}
                      onClick={() => handleDateClick(day, dayNotices)}
                      title={dayNotices.length > 0 ? `${dayNotices.length}개의 공지가 예약되어 있습니다. 클릭하여 자세히 보기` : '클릭하여 공지 목록 보기'}
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
                          <div 
                            className="text-xs text-blue-600 text-center hover:text-blue-800 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoreClick(day, dayNotices);
                            }}
                          >
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
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center">
                              <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                              {notice.type === 'attendance' ? '출결' :
                               notice.type === 'satisfaction' ? '만족도' :
                               notice.type === 'thread' ? '질문' :
                               notice.type}
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
                          {notice.message && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notice.message}
                            </p>
                          )}
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

export default NoticeCalendarPage; 