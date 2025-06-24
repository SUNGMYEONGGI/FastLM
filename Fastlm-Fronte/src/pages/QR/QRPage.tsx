import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { WorkspaceContext } from '../../contexts/WorkspaceContext';
import { workspaceAPI } from '../../services/api';

const QRPage: React.FC = () => {
  const { selectedWorkspace, workspaces } = useContext(WorkspaceContext);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedWorkspace) return;

    try {
      setUploading(true);
      await workspaceAPI.uploadQRImage(selectedWorkspace.id, file);
      toast.success('QR 코드가 업로드되었습니다');
      // 워크스페이스 정보 새로고침이 필요할 수 있음
    } catch (error) {
      toast.error('QR 코드 업로드에 실패했습니다');
    } finally {
      setUploading(false);
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">QR 코드 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                워크스페이스: {selectedWorkspace.name}
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* QR 코드 업로드 */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">QR 코드 업로드</h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="qr-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="qr-upload"
                      className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
                    >
                      <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        {uploading ? '업로드 중...' : 'QR 코드 이미지를 선택하세요'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        PNG, JPG, JPEG, GIF 파일만 지원
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">📌 업로드 가이드</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• HRD-Net 출결 체크용 QR 코드를 업로드하세요</li>
                      <li>• 이미지는 선명하고 QR 코드가 잘 보이는 것으로 선택하세요</li>
                      <li>• 업로드한 QR 코드는 출결 공지에 자동으로 포함됩니다</li>
                    </ul>
                  </div>
                </div>

                {/* 현재 QR 코드 */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">현재 QR 코드</h2>
                  
                  {selectedWorkspace.qrImageUrl ? (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <img
                        src={selectedWorkspace.qrImageUrl}
                        alt="QR Code"
                        className="w-full max-w-xs mx-auto h-auto border border-gray-300 rounded"
                      />
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                          QR 코드가 등록되어 있습니다
                        </p>
                        <button
                          onClick={() => window.open(selectedWorkspace.qrImageUrl, '_blank')}
                          className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
                        >
                          원본 이미지 보기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-8 text-center">
                      <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">
                        아직 QR 코드가 등록되지 않았습니다
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        좌측에서 QR 코드를 업로드하세요
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR 코드 사용법 */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">QR 코드 사용법</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">1. HRD-Net에서 QR 코드 다운로드</h4>
                    <p className="text-sm text-gray-600">
                      HRD-Net 출결 관리 페이지에서 해당 과정의 QR 코드를 다운로드합니다.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">2. 워크스페이스에 QR 코드 등록</h4>
                    <p className="text-sm text-gray-600">
                      다운로드한 QR 코드를 해당 워크스페이스에 업로드합니다.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">3. 출결 공지 발송</h4>
                    <p className="text-sm text-gray-600">
                      출결 공지를 작성하면 등록된 QR 코드가 자동으로 포함되어 발송됩니다.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">4. 학습자 출결 체크</h4>
                    <p className="text-sm text-gray-600">
                      학습자들이 Slack에서 QR 코드를 스캔하여 HRD-Net 출결을 체크합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QRPage; 