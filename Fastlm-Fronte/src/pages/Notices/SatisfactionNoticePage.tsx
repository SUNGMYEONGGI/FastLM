import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { noticeAPI } from '../../services/api';

const SatisfactionNoticePage: React.FC = () => {
  const { selectedWorkspace } = useContext(WorkspaceContext);
  const [formData, setFormData] = useState({
    attendanceType: '입실',
    moduleName: '',
    instructorName: '',
    surveyUrl: '',
    deadline: '',
    scheduledDateTime: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorkspace) {
      toast.error('워크스페이스를 선택해주세요');
      return;
    }

    if (!formData.moduleName.trim()) {
      toast.error('모듈명을 입력해주세요');
      return;
    }

    if (!formData.instructorName.trim()) {
      toast.error('강사명을 입력해주세요');
      return;
    }

    if (!formData.surveyUrl.trim()) {
      toast.error('설문 URL을 입력해주세요');
      return;
    }

    if (!formData.scheduledDateTime) {
      toast.error('예약 시간을 선택해주세요');
      return;
    }

    try {
      setLoading(true);
      
      const title = '📋 만족도 조사 안내';
      const message = `안녕하세요! 만족도 조사 안내드립니다.\n\n` +
                     `📚 모듈명: ${formData.moduleName}\n` +
                     `👨‍🏫 강사명: ${formData.instructorName}\n\n` +
                     `📝 설문조사 링크: ${formData.surveyUrl}\n\n` +
                     (formData.deadline ? `⏰ 마감일: ${formData.deadline}\n\n` : '') +
                     `만족도 조사에 참여해주셔서 감사합니다! 😊\n` +
                     `여러분의 소중한 의견이 더 나은 교육을 만들어갑니다.`;

      const scheduledAt = new Date(formData.scheduledDateTime).toISOString();

      await noticeAPI.createNotice({
        type: 'satisfaction',
        title,
        message,
        workspaceId: selectedWorkspace.id,
        scheduledAt,
        status: 'scheduled',
        createdBy: 'current-user', // TODO: 실제 사용자 ID로 교체
        formData: formData
      });

      toast.success('만족도 공지가 예약되었습니다');
      
      // 폼 초기화
      setFormData({
        attendanceType: '입실',
        moduleName: '',
        instructorName: '',
        surveyUrl: '',
        deadline: '',
        scheduledDateTime: ''
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
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                출결 공지
              </Link>
              <Link
                to="/notices/satisfaction"
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
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
              <h1 className="text-2xl font-bold text-gray-900">만족도 공지</h1>
              <p className="text-sm text-gray-600 mt-1">
                워크스페이스: {selectedWorkspace.name}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="attendanceType" className="block text-sm font-medium text-gray-700">
                    출결 종류
                  </label>
                  <select
                    id="attendanceType"
                    name="attendanceType"
                    value={formData.attendanceType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="입실">입실</option>
                    <option value="중간">중간</option>
                    <option value="퇴실">퇴실</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="scheduledDateTime" className="block text-sm font-medium text-gray-700">
                    예약 시간 *
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledDateTime"
                    name="scheduledDateTime"
                    value={formData.scheduledDateTime}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="moduleName" className="block text-sm font-medium text-gray-700">
                    모듈명 *
                  </label>
                  <input
                    type="text"
                    id="moduleName"
                    name="moduleName"
                    value={formData.moduleName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: Python 기초"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="instructorName" className="block text-sm font-medium text-gray-700">
                    강사명 *
                  </label>
                  <input
                    type="text"
                    id="instructorName"
                    name="instructorName"
                    value={formData.instructorName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 김강사"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="surveyUrl" className="block text-sm font-medium text-gray-700">
                    설문조사 URL *
                  </label>
                  <input
                    type="url"
                    id="surveyUrl"
                    name="surveyUrl"
                    value={formData.surveyUrl}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://forms.google.com/..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                    마감일 (선택사항)
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 미리보기 */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">메시지 미리보기:</h3>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  📋 만족도 조사 안내{'\n\n'}
                  안녕하세요! 만족도 조사 안내드립니다.{'\n\n'}
                  📚 모듈명: {formData.moduleName || '[모듈명]'}{'\n'}
                  👨‍🏫 강사명: {formData.instructorName || '[강사명]'}{'\n\n'}
                  📝 설문조사 링크: {formData.surveyUrl || '[설문조사 URL]'}{'\n\n'}
                  {formData.deadline && `⏰ 마감일: ${formData.deadline}\n\n`}
                  만족도 조사에 참여해주셔서 감사합니다! 😊{'\n'}
                  여러분의 소중한 의견이 더 나은 교육을 만들어갑니다.
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

export default SatisfactionNoticePage; 