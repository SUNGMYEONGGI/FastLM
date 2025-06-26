import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { noticeAPI } from '../../services/api';

const AttendanceNoticePage: React.FC = () => {
  const { selectedWorkspace } = useContext(WorkspaceContext);
  const [formData, setFormData] = useState({
    attendanceType: '입실', // 입실, 중간, 퇴실
    scheduledDate: '',
    entryTime: '09:00',
    midTime: '14:00',
    exitTime: '18:00',
    zoomUrl: '',
    zoomId: '',
    zoomPassword: '',
    scheduleUrl: '',
    noImage: false
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorkspace) {
      toast.error('워크스페이스를 선택해주세요');
      return;
    }

    if (!formData.scheduledDate) {
      toast.error('예약 날짜를 선택해주세요');
      return;
    }

    try {
      setLoading(true);
      
      // 시간 설정에 따른 메시지 생성
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.entryTime}`).toISOString();
      
      let title = '';
      let message = '';
      
      switch (formData.attendanceType) {
        case '입실':
          title = '📝 입실 안내';
          message = `안녕하세요! 오늘(${formData.scheduledDate}) 입실 안내드립니다.\n\n` +
                   `⏰ 입실 시간: ${formData.entryTime}\n` +
                   `📋 HRD-Net 입실체크를 진행해주세요.\n\n` +
                   (formData.zoomUrl ? `🔗 Zoom 링크: ${formData.zoomUrl}\n` : '') +
                   (formData.zoomId ? `🆔 회의 ID: ${formData.zoomId}\n` : '') +
                   (formData.zoomPassword ? `🔐 비밀번호: ${formData.zoomPassword}\n` : '') +
                   (formData.scheduleUrl ? `📅 일정 확인: ${formData.scheduleUrl}\n` : '');
          break;
        case '중간':
          title = '🕐 중간 체크 안내';
          message = `안녕하세요! 오늘(${formData.scheduledDate}) 중간 체크 안내드립니다.\n\n` +
                   `⏰ 중간 체크 시간: ${formData.midTime}\n` +
                   `📋 HRD-Net 중간체크를 진행해주세요.\n\n`;
          break;
        case '퇴실':
          title = '🏠 퇴실 안내';
          message = `안녕하세요! 오늘(${formData.scheduledDate}) 퇴실 안내드립니다.\n\n` +
                   `⏰ 퇴실 시간: ${formData.exitTime}\n` +
                   `📋 HRD-Net 퇴실체크를 진행해주세요.\n\n` +
                   `수고하셨습니다! 😊`;
          break;
      }

      await noticeAPI.createNotice({
        type: 'attendance',
        title,
        message,
        workspaceId: selectedWorkspace.id,
        scheduledAt: scheduledDateTime,
        status: 'scheduled',
        createdBy: 'current-user', // TODO: 실제 사용자 ID로 교체
        noImage: formData.noImage,
        formData: formData
      });

      toast.success('출결 공지가 예약되었습니다');
      
      // 폼 초기화
      setFormData({
        attendanceType: '입실',
        scheduledDate: '',
        entryTime: '09:00',
        midTime: '14:00', 
        exitTime: '18:00',
        zoomUrl: '',
        zoomId: '',
        zoomPassword: '',
        scheduleUrl: '',
        noImage: false
      });
      
    } catch (error) {
      toast.error('공지 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedWorkspace) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 탭 네비게이션 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <Link
                to="/notices/attendance"
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                출결 공지
              </Link>
              <Link
                to="/notices/satisfaction"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                만족도 공지
              </Link>
              <Link
                to="/notices/thread"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                운영 질문 스레드
              </Link>
              <Link
                to="/notices/custom"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                기타 공지
              </Link>
              <Link
                to="/notices/customize"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                공지 커스터마이징
              </Link>
              <Link
                to="/notices/manage"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                공지 관리
              </Link>
              <Link
                to="/notices/calendar"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                공지 캘린더
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">출결 공지</h1>
              <p className="text-sm text-gray-600 mt-1">
                워크스페이스: {selectedWorkspace.name}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="attendanceType" className="block text-sm font-medium text-gray-700">
                    출결 종류 *
                  </label>
                  <select
                    id="attendanceType"
                    name="attendanceType"
                    value={formData.attendanceType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="입실">입실</option>
                    <option value="중간">중간</option>
                    <option value="퇴실">퇴실</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                    예약 날짜 *
                  </label>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="entryTime" className="block text-sm font-medium text-gray-700">
                    입실 시간
                  </label>
                  <input
                    type="time"
                    id="entryTime"
                    name="entryTime"
                    value={formData.entryTime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="midTime" className="block text-sm font-medium text-gray-700">
                    중간 시간
                  </label>
                  <input
                    type="time"
                    id="midTime"
                    name="midTime"
                    value={formData.midTime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="exitTime" className="block text-sm font-medium text-gray-700">
                    퇴실 시간
                  </label>
                  <input
                    type="time"
                    id="exitTime"
                    name="exitTime"
                    value={formData.exitTime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="zoomUrl" className="block text-sm font-medium text-gray-700">
                    Zoom URL
                  </label>
                  <input
                    type="url"
                    id="zoomUrl"
                    name="zoomUrl"
                    value={formData.zoomUrl}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>

                <div>
                  <label htmlFor="zoomId" className="block text-sm font-medium text-gray-700">
                    Zoom 회의 ID
                  </label>
                  <input
                    type="text"
                    id="zoomId"
                    name="zoomId"
                    value={formData.zoomId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 456 789"
                  />
                </div>

                <div>
                  <label htmlFor="zoomPassword" className="block text-sm font-medium text-gray-700">
                    Zoom 비밀번호
                  </label>
                  <input
                    type="text"
                    id="zoomPassword"
                    name="zoomPassword"
                    value={formData.zoomPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="scheduleUrl" className="block text-sm font-medium text-gray-700">
                    일정 URL
                  </label>
                  <input
                    type="url"
                    id="scheduleUrl"
                    name="scheduleUrl"
                    value={formData.scheduleUrl}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="일정 확인 링크"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      id="noImage"
                      name="noImage"
                      type="checkbox"
                      checked={formData.noImage}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="noImage" className="ml-2 block text-sm text-gray-900">
                      QR 이미지 없이 전송
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '예약 중...' : '공지 예약'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceNoticePage; 