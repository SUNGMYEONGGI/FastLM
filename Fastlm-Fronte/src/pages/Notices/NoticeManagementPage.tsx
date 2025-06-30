import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { Notice } from '../../types';
import { noticeAPI } from '../../services/api';

const NoticeManagementPage: React.FC = () => {
  const { selectedWorkspace } = useContext(WorkspaceContext);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    status: 'scheduled'
  });
  const [editingNotice, setEditingNotice] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    message: '', 
    scheduledAt: '',
    selectedWebhook: ''
  });
  const [selectedNotices, setSelectedNotices] = useState<string[]>([]);

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

  const getAvailableWebhooks = () => {
    if (!selectedWorkspace) return [];
    
    const webhooks: { name: string; url: string }[] = [];
    
    // 기본 슬랙 웹훅
    if (selectedWorkspace.slackWebhookUrl) {
      const slackWebhookName = (selectedWorkspace as any).slackWebhookName || '기본 슬랙';
      webhooks.push({ name: slackWebhookName, url: selectedWorkspace.slackWebhookUrl });
    }
    
    // 추가 웹훅들
    if (selectedWorkspace.webhookUrls && selectedWorkspace.webhookUrls.length > 0) {
      selectedWorkspace.webhookUrls.forEach((webhook: any) => {
        if (typeof webhook === 'object' && webhook.name && webhook.url) {
          webhooks.push(webhook);
        } else if (typeof webhook === 'string' && webhook.trim()) {
          webhooks.push({ name: `웹훅 ${webhooks.length + 1}`, url: webhook });
        }
      });
    }
    
    return webhooks;
  };

  const getWebhookNameByUrl = (url: string) => {
    const webhooks = getAvailableWebhooks();
    const webhook = webhooks.find(w => w.url === url);
    return webhook?.name || '알 수 없는 웹훅';
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice.id);
    
    // 현재 선택된 웹훅 이름 찾기
    let selectedWebhookName = '';
    if (notice.selectedWebhookUrl) {
      selectedWebhookName = getWebhookNameByUrl(notice.selectedWebhookUrl);
    } else if (notice.webhookInfo?.name) {
      selectedWebhookName = notice.webhookInfo.name;
    }
    
    setEditForm({
      message: notice.message,
      scheduledAt: notice.scheduledAt.slice(0, 16), // datetime-local format
      selectedWebhook: selectedWebhookName
    });
  };

  const handleSaveEdit = async (noticeId: string) => {
    try {
      // 선택된 웹훅 URL 찾기
      const webhooks = getAvailableWebhooks();
      const selectedWebhook = webhooks.find(w => w.name === editForm.selectedWebhook);
      
      await noticeAPI.updateNotice(noticeId, {
        message: editForm.message,
        scheduledAt: new Date(editForm.scheduledAt).toISOString(),
        selectedWebhookUrl: selectedWebhook?.url || ''
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

  const handleBulkDelete = async () => {
    if (selectedNotices.length === 0) {
      toast.error('삭제할 공지사항을 선택해주세요');
      return;
    }
    
    if (!window.confirm(`선택한 ${selectedNotices.length}개의 공지사항을 삭제하시겠습니까?`)) return;
    
    try {
      await noticeAPI.bulkDeleteNotices(selectedNotices);
      toast.success(`${selectedNotices.length}개의 공지사항이 삭제되었습니다`);
      setSelectedNotices([]);
      loadNotices();
    } catch (error) {
      toast.error('일괄 삭제에 실패했습니다');
    }
  };

  const handleSelectNotice = (noticeId: string) => {
    setSelectedNotices(prev => 
      prev.includes(noticeId) 
        ? prev.filter(id => id !== noticeId)
        : [...prev, noticeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotices.length === filteredNotices.length) {
      setSelectedNotices([]);
    } else {
      setSelectedNotices(filteredNotices.map(notice => notice.id));
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 탭 네비게이션 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <Link to="/notices/attendance" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 예약</Link>
              <Link to="/notices/customize" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 커스터마이징</Link>
              <Link to="/notices/manage" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap">공지 관리</Link>
              <Link to="/notices/calendar" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 캘린더</Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">공지 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                워크스페이스: {selectedWorkspace?.name} - 예약된 공지사항을 관리하고 수정할 수 있습니다.
              </p>
            </div>

            {/* 필터 및 대량 삭제 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-4 items-end justify-between">
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
                
                {selectedNotices.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    선택한 {selectedNotices.length}개 삭제
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedNotices.length === filteredNotices.length && filteredNotices.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목/예약시간</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메시지</th>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">웹훅</th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedNotices.includes(notice.id)}
                          onChange={() => handleSelectNotice(notice.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-44" title={notice.title}>{notice.title}</div>
                        <div className="text-xs text-gray-500">{new Date(notice.scheduledAt).toLocaleString('ko-KR')}</div>
                      </td>
                      <td className="px-4 py-4">
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
                            <select
                              value={editForm.selectedWebhook}
                              onChange={(e) => setEditForm(prev => ({ ...prev, selectedWebhook: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">웹훅을 선택하세요</option>
                              {getAvailableWebhooks().map((webhook, index) => (
                                <option key={index} value={webhook.name}>
                                  {webhook.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={notice.message}>{notice.message}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {notice.webhookInfo ? (
                          <div className="text-xs">
                            <div className="text-gray-900 font-medium truncate max-w-28" title={notice.webhookInfo.name}>{notice.webhookInfo.name}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">웹훅 없음</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(notice.status)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          {editingNotice === notice.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(notice.id)}
                                className="text-green-600 hover:text-green-900 text-xs"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingNotice(null)}
                                className="text-gray-600 hover:text-gray-900 text-xs"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(notice)}
                                className="text-blue-600 hover:text-blue-900 text-xs"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleSendNow(notice.id)}
                                className="text-green-600 hover:text-green-900 text-xs"
                              >
                                전송
                              </button>
                              <button
                                onClick={() => handleDelete(notice.id)}
                                className="text-red-600 hover:text-red-900 text-xs"
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