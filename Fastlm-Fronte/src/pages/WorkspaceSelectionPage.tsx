import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Plus, X, Edit } from 'lucide-react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useAuth } from '../contexts/AuthContext';
import { workspaceAPI } from '../services/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout/Layout';

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

  const handleEditWorkspace = (e: React.MouseEvent, workspaceId: number) => {
    e.stopPropagation(); // 워크스페이스 선택 이벤트 방지
    navigate(`/workspace/edit/${workspaceId}`);
  };

  const handleLeaveWorkspace = async (e: React.MouseEvent, workspaceId: string, workspaceName: string) => {
    e.stopPropagation(); // 워크스페이스 선택 이벤트 방지
    
    if (!window.confirm(`'${workspaceName}' 워크스페이스에서 나가시겠습니까?`)) {
      return;
    }

    try {
      await workspaceAPI.leaveWorkspace(workspaceId);
      toast.success('워크스페이스에서 나갔습니다.');
      refreshWorkspaces();
    } catch (error) {
      console.error('워크스페이스 나가기 실패:', error);
      toast.error('워크스페이스에서 나가는데 실패했습니다.');
    }
  };

  if (workspaces.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Building2 className="w-8 h-8 mr-3 text-blue-600" />
                  워크스페이스 선택
                </h1>
                <p className="text-gray-600 mt-1">작업할 워크스페이스를 선택하세요</p>
              </div>
            </div>
          </div>

          {/* No Workspace Message */}
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">할당된 워크스페이스가 없습니다</h2>
            <p className="text-gray-600 mb-6">
              아직 워크스페이스에 할당되지 않았습니다. 관리자에게 워크스페이스 할당을 요청하세요.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 워크스페이스가 없어도 일부 기능은 사용할 수 있습니다. 왼쪽 메뉴를 확인해보세요.
              </p>
            </div>
            
            {user?.isAdmin && (
              <div className="space-y-4">
                <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
                  🔧 관리자 권한으로 워크스페이스를 생성하거나 관리할 수 있습니다.
                </p>
                <button
                  onClick={() => navigate('/admin/workspace/register')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  새 워크스페이스 만들기
                </button>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building2 className="w-8 h-8 mr-3 text-blue-600" />
                워크스페이스 선택
              </h1>
              <p className="text-gray-600 mt-1">작업할 워크스페이스를 선택하세요</p>
            </div>
            <div className="text-sm text-gray-500">
              총 {workspaces.length}개의 워크스페이스
            </div>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              onClick={() => handleWorkspaceSelect(workspace)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group border border-gray-200 hover:border-blue-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditWorkspace(e, workspace.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="워크스페이스 편집"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
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
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">관리자 옵션</h3>
            <button
              onClick={() => navigate('/admin/workspace/register')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 워크스페이스 만들기
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WorkspaceSelectionPage;