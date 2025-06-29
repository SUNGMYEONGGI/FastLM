import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { Workspace } from '../../types';
import { workspaceAPI } from '../../services/api';

const WorkspaceEditPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slackWebhookUrl: '',
    qrImage: null as File | null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      // TODO: API에서 단일 워크스페이스 가져오기 구현 필요
      const workspaces = await workspaceAPI.getAllWorkspaces();
      const targetWorkspace = workspaces.find(w => w.id === workspaceId);
      
      if (targetWorkspace) {
        setWorkspace(targetWorkspace);
        setFormData({
          name: targetWorkspace.name,
          description: targetWorkspace.description,
          slackWebhookUrl: targetWorkspace.slackWebhookUrl,
          qrImage: null
        });
      } else {
        toast.error('워크스페이스를 찾을 수 없습니다');
        navigate('/admin/workspace/manage');
      }
    } catch (error) {
      toast.error('워크스페이스를 불러오는데 실패했습니다');
      navigate('/admin/workspace/manage');
    } finally {
      setLoading(false);
    }
  };

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

    if (!workspaceId) return;

    try {
      setSaving(true);
      
      await workspaceAPI.updateWorkspace(workspaceId, {
        name: formData.name,
        description: formData.description,
        slackWebhookUrl: formData.slackWebhookUrl
      });

      // QR 이미지 업로드 (있는 경우)
      if (formData.qrImage) {
        await workspaceAPI.uploadQRImage(workspaceId, formData.qrImage);
      }

      toast.success('워크스페이스가 수정되었습니다');
      navigate('/admin/workspace/manage');
    } catch (error) {
      toast.error('워크스페이스 수정에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">워크스페이스 수정</h1>
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
                    새로운 QR 코드 이미지를 업로드하려면 파일을 선택하세요
                  </p>
                  {workspace.qrImageUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">현재 QR 코드:</p>
                      <img 
                        src={workspace.qrImageUrl} 
                        alt="QR Code" 
                        className="mt-1 w-32 h-32 object-contain border border-gray-300 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => navigate('/admin/workspace/manage')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkspaceEditPage; 