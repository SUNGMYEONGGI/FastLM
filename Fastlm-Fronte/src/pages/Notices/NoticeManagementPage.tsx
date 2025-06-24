import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { Notice } from '../../types';
import { noticeAPI } from '../../services/api';

const NoticeManagementPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    status: 'scheduled'
  });
  const [editingNotice, setEditingNotice] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ message: '', scheduledAt: '' });

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

  const filteredNotices = notices.filter(notice => {
    const matchesDate = !filters.date || notice.scheduledAt.startsWith(filters.date);
    const matchesStatus = !filters.status || notice.status === filters.status;
    return matchesDate && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    const statusText = {
      scheduled: '예약됨',
      sent: '전송 완료',
      failed: '전송 실패'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice.id);
    setEditForm({
      message: notice.message,
      scheduledAt: notice.scheduledAt.slice(0, 16) // datetime-local format
    });
  };

  const handleSaveEdit = async (noticeId: string) => {
    try {
      await noticeAPI.updateNotice(noticeId, {
        message: editForm.message,
        scheduledAt: new Date(editForm.scheduledAt).toISOString()
      });
      toast.success('공지사항이 수정되었습니다');
      setEditingNotice(null);
      loadNotices();
    } catch (error) {
      toast.error('수정에 실패했습니다');
    }
  };

  const handleDelete = async (noticeId: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await noticeAPI.deleteNotice(noticeId);
      toast.success('공지사항이 삭제되었습니다');
      loadNotices();
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleSendNow = async (noticeId: string) => {
    if (!window.confirm('지금 바로 전송하시겠습니까?')) return;
    
    try {
      await noticeAPI.sendNoticeImmediately(noticeId);
      toast.success('공지사항이 전송되었습니다');
      loadNotices();
    } catch (error) {
      toast.error('전송에 실패했습니다');
    }
  };

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
              <Link to="/notices/attendance" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">출결 공지</Link>
              <Link to="/notices/satisfaction" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">만족도 공지</Link>
              <Link to="/notices/thread" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">운영 질문 스레드</Link>
              <Link to="/notices/manage" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap">공지 관리</Link>
              <Link to="/notices/calendar" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 캘린더</Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">공지 관리</h1>
            </div>

            {/* 필터 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">날짜 필터</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태 필터</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">모든 상태</option>
                    <option value="scheduled">예약됨</option>
                    <option value="sent">전송 완료</option>
                    <option value="failed">전송 실패</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메시지</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{notice.id}</td>
                      <td className="px-6 py-4">
                        {editingNotice === notice.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editForm.message}
                              onChange={(e) => setEditForm(prev => ({ ...prev, message: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                            />
                            <input
                              type="datetime-local"
                              value={editForm.scheduledAt}
                              onChange={(e) => setEditForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 max-w-md truncate">{notice.message}</div>
                            <div className="text-xs text-gray-500">{new Date(notice.scheduledAt).toLocaleString('ko-KR')}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(notice.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {editingNotice === notice.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(notice.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingNotice(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(notice)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleSendNow(notice.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                전송
                              </button>
                              <button
                                onClick={() => handleDelete(notice.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredNotices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">조건에 맞는 공지사항이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NoticeManagementPage; 