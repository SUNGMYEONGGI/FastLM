import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workspaceAPI } from '../services/api';
import Layout from '../components/Layout/Layout';
import { Plus, X, Upload } from 'lucide-react';
import { Workspace } from '../types';

const WorkspaceEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slackWebhookName: '기본 슬랙',
    slackWebhookUrl: '',
    webhookUrls: [{ name: '', url: '' }],
    checkinTime: '',
    middleTime: '',
    checkoutTime: '',
    zoomUrl: '',
    zoomId: '',
    zoomPassword: ''
  });
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string>('');

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      const workspaceData = await workspaceAPI.getWorkspaceDetail(Number(workspaceId));
      setWorkspace(workspaceData);
      setFormData({
        name: workspaceData.name || '',
        description: workspaceData.description || '',
        slackWebhookName: workspaceData.slackWebhookName || '기본 슬랙',
        slackWebhookUrl: workspaceData.slackWebhookUrl || '',
        webhookUrls: workspaceData.webhookUrls && workspaceData.webhookUrls.length > 0 
          ? (Array.isArray(workspaceData.webhookUrls) && typeof workspaceData.webhookUrls[0] === 'object' 
             ? workspaceData.webhookUrls as { name: string; url: string; }[]
             : (workspaceData.webhookUrls as unknown as string[]).map(url => ({ name: '', url })))
          : [{ name: '', url: '' }],
        checkinTime: workspaceData.checkinTime || '',
        middleTime: workspaceData.middleTime || '',
        checkoutTime: workspaceData.checkoutTime || '',
        zoomUrl: workspaceData.zoomUrl || '',
        zoomId: workspaceData.zoomId || '',
        zoomPassword: workspaceData.zoomPassword || ''
      });
      if (workspaceData.qrImageUrl) {
        setQrPreview(`http://localhost:5000${workspaceData.qrImageUrl}`);
      }
    } catch (error: any) {
      alert(`워크스페이스 로드 실패: ${error.message}`);
      navigate('/workspace');
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWebhookChange = (index: number, field: 'name' | 'url', value: string) => {
    const newWebhookUrls = [...formData.webhookUrls];
    newWebhookUrls[index] = { ...newWebhookUrls[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      webhookUrls: newWebhookUrls
    }));
  };

  const addWebhookUrl = () => {
    setFormData(prev => ({
      ...prev,
      webhookUrls: [...prev.webhookUrls, { name: '', url: '' }]
    }));
  };

  const removeWebhookUrl = (index: number) => {
    if (formData.webhookUrls.length > 1) {
      const newWebhookUrls = formData.webhookUrls.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        webhookUrls: newWebhookUrls
      }));
    }
  };

  const handleQrImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('워크스페이스 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 빈 웹훅 URL 제거
      const cleanWebhookUrls = formData.webhookUrls.filter(webhook => webhook.name.trim() !== '' && webhook.url.trim() !== '');
      
      const workspaceData = {
        ...formData,
        webhookUrls: cleanWebhookUrls
      };

      await workspaceAPI.updateWorkspace(Number(workspaceId), workspaceData);
      
      // QR 이미지가 새로 선택되었으면 업로드
      if (qrImage) {
        await workspaceAPI.uploadQRImage(Number(workspaceId), qrImage);
      }

      alert('워크스페이스가 성공적으로 수정되었습니다.');
      navigate('/workspace');
    } catch (error: any) {
      console.error('워크스페이스 수정 중 오류:', error);
      alert(`수정 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingWorkspace) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">워크스페이스 정보를 불러오는 중...</div>
        </div>
      </Layout>
    );
  }

  if (!workspace) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">워크스페이스를 찾을 수 없습니다.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">워크스페이스 편집</h1>
          <p className="text-gray-600 mt-2">{workspace.name} 워크스페이스의 정보를 수정하세요.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 워크스페이스 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                워크스페이스 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="워크스페이스 이름을 입력하세요"
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="워크스페이스에 대한 설명을 입력하세요"
              />
            </div>

            {/* 기본 슬랙 웹훅 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기본 슬랙 웹훅 설정</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  name="slackWebhookName"
                  value={formData.slackWebhookName}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="웹훅 이름 (예: 기본 슬랙)"
                />
                <input
                  type="url"
                  name="slackWebhookUrl"
                  value={formData.slackWebhookUrl}
                  onChange={handleInputChange}
                  className="col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
            </div>

            {/* 웹훅 URL들 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추가 웹훅 URL
                <span className="text-sm text-gray-500 ml-2">(선택사항)</span>
              </label>
              {formData.webhookUrls.map((webhook, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    name="name"
                    value={webhook.name}
                    onChange={(e) => handleWebhookChange(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="웹훅 이름"
                  />
                  <input
                    type="url"
                    name="url"
                    value={webhook.url}
                    onChange={(e) => handleWebhookChange(index, 'url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="웹훅 URL"
                  />
                  {formData.webhookUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWebhookUrl(index)}
                      className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addWebhookUrl}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                <Plus className="w-4 h-4" />
                웹훅 추가
              </button>
            </div>

            {/* 시간 설정 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">입실 시간</label>
                <input
                  type="time"
                  name="checkinTime"
                  value={formData.checkinTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">중간 시간</label>
                <input
                  type="time"
                  name="middleTime"
                  value={formData.middleTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">퇴실 시간</label>
                <input
                  type="time"
                  name="checkoutTime"
                  value={formData.checkoutTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* QR 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">QR 이미지</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  이미지 변경
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrImageChange}
                    className="hidden"
                  />
                </label>
                {qrPreview && (
                  <div className="w-20 h-20 border border-gray-300 rounded-md overflow-hidden">
                    <img src={qrPreview} alt="QR Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">PNG, JPG, JPEG, GIF 형식만 지원됩니다.</p>
            </div>

            {/* 줌 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">줌 설정</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">줌 URL</label>
                <input
                  type="url"
                  name="zoomUrl"
                  value={formData.zoomUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">줌 ID</label>
                  <input
                    type="text"
                    name="zoomId"
                    value={formData.zoomId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 456 7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">줌 비밀번호</label>
                  <input
                    type="text"
                    name="zoomPassword"
                    value={formData.zoomPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="비밀번호"
                  />
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-4 justify-end pt-6">
              <button
                type="button"
                onClick={() => navigate('/workspace')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '수정 중...' : '수정하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default WorkspaceEditPage; 