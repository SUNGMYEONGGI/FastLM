import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { noticeAPI } from '../../services/api';

const ThreadNoticePage: React.FC = () => {
  const { selectedWorkspace } = useContext(WorkspaceContext);
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '09:00'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      
      const title = '💬 운영 질문 스레드';
      const message = `안녕하세요! 오늘(${formData.scheduledDate}) 운영 질문 스레드를 시작합니다.\n\n` +
                     `🔸 수업 관련 질문\n` +
                     `🔸 과제 관련 질문\n` +
                     `🔸 기타 궁금한 사항\n\n` +
                     `언제든지 이 스레드에서 자유롭게 질문해주세요! 📝\n` +
                     `빠른 답변을 위해 구체적으로 질문해주시면 더욱 좋습니다. 😊`;

      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString();

      await noticeAPI.createNotice({
        type: 'thread',
        title,
        message,
        workspaceId: selectedWorkspace.id,
        scheduledAt,
        status: 'scheduled',
        createdBy: 'current-user',
        formData: formData
      });

      toast.success('운영 질문 스레드가 예약되었습니다');
      
      setFormData({
        scheduledDate: '',
        scheduledTime: '09:00'
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
              <Link to="/notices/attendance" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">출결 공지</Link>
              <Link to="/notices/satisfaction" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">만족도 공지</Link>
              <Link to="/notices/thread" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap">운영 질문 스레드</Link>
              <Link to="/notices/manage" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 관리</Link>
              <Link to="/notices/calendar" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 캘린더</Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">운영 질문 스레드</h1>
              <p className="text-sm text-gray-600 mt-1">워크스페이스: {selectedWorkspace.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">예약 날짜 *</label>
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
                  <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700">예약 시간 *</label>
                  <input
                    type="time"
                    id="scheduledTime"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">메시지 미리보기:</h3>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  💬 운영 질문 스레드{'\n\n'}
                  안녕하세요! 오늘({formData.scheduledDate || '[예약 날짜]'}) 운영 질문 스레드를 시작합니다.{'\n\n'}
                  🔸 수업 관련 질문{'\n'}
                  🔸 과제 관련 질문{'\n'}
                  🔸 기타 궁금한 사항{'\n\n'}
                  언제든지 이 스레드에서 자유롭게 질문해주세요! 📝{'\n'}
                  빠른 답변을 위해 구체적으로 질문해주시면 더욱 좋습니다. 😊
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
                  {loading ? '예약 중...' : '스레드 예약'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ThreadNoticePage; 