import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Plus } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';

const WorkspaceSelectionPage: React.FC = () => {
  const { workspaces, selectWorkspace, refreshWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  const handleWorkspaceSelect = (workspace: any) => {
    selectWorkspace(workspace);
    navigate('/dashboard');
  };

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">워크스페이스 없음</h1>
            <p className="text-gray-600 mb-6">
              아직 할당된 워크스페이스가 없습니다. 관리자에게 워크스페이스 할당을 요청하세요.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 관리자가 워크스페이스를 할당하면 이 페이지에서 선택할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">워크스페이스 선택</h1>
          <p className="text-lg text-gray-600">작업할 워크스페이스를 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              onClick={() => handleWorkspaceSelect(workspace)}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-blue-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                  {workspace.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {workspace.description || '워크스페이스 설명이 없습니다.'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>생성일: {new Date(workspace.createdAt).toLocaleDateString()}</span>
                  {workspace.qrImageUrl && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      QR 등록됨
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {user?.isAdmin && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/admin/workspaces')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 워크스페이스 만들기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSelectionPage;