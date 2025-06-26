import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { workspaceAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const WorkspaceRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slackWebhookUrl: '',
    qrImage: null as File | null
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, qrImage: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('워크스페이스명을 입력해주세요');
      return;
    }

    if (!formData.slackWebhookUrl.trim()) {
      toast.error('Slack Webhook URL을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      
      const newWorkspace = await workspaceAPI.createWorkspace({
        name: formData.name,
        description: formData.description,
        slackWebhookUrl: formData.slackWebhookUrl
      });

      // QR 이미지 업로드 (있는 경우)
      if (formData.qrImage) {
        try {
          await workspaceAPI.uploadQRImage(newWorkspace.id.toString(), formData.qrImage);
        } catch (uploadError) {
          console.warn('QR 이미지 업로드 실패:', uploadError);
          // QR 이미지 업로드 실패는 전체 등록을 실패로 처리하지 않음
        }
      }

      // 관리자인 경우와 일반 사용자인 경우 다른 메시지 표시
      if (user?.isAdmin) {
        toast.success('워크스페이스가 등록되었습니다');
        navigate('/admin/workspace/manage');
      } else {
        toast.success('워크스페이스 등록 신청이 완료되었습니다. 관리자 승인 후 사용하실 수 있습니다.');
        navigate('/workspace');
      }
    } catch (error) {
      console.error('워크스페이스 등록 오류:', error);
      toast.error('워크스페이스 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user?.isAdmin) {
      navigate('/admin/workspace/manage');
    } else {
      navigate('/workspace');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">워크스페이스 등록</h1>
              {!user?.isAdmin && (
                <p className="text-sm text-gray-600 mt-2">
                  등록 신청 후 관리자 승인을 받아야 워크스페이스를 사용할 수 있습니다.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    워크스페이스명 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="워크스페이스명을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    설명
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="워크스페이스에 대한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="slackWebhookUrl" className="block text-sm font-medium text-gray-700">
                    Slack Webhook URL *
                  </label>
                  <input
                    type="url"
                    id="slackWebhookUrl"
                    name="slackWebhookUrl"
                    value={formData.slackWebhookUrl}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://hooks.slack.com/services/..."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Slack에서 생성한 Webhook URL을 입력하세요
                  </p>
                </div>

                <div>
                  <label htmlFor="qrImage" className="block text-sm font-medium text-gray-700">
                    QR 코드 이미지
                  </label>
                  <input
                    type="file"
                    id="qrImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    HRD-Net 출결 체크용 QR 코드 이미지를 업로드하세요 (선택사항)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={handleCancel}
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
                  {loading ? '등록 중...' : user?.isAdmin ? '등록' : '신청'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkspaceRegisterPage; 