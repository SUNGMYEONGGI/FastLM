import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { User, Workspace } from '../../types';
import { userAPI, workspaceAPI } from '../../services/api';

const UserWorkspaceAccessPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 데이터 로딩 시작, userId:', userId);
      
      // 모든 사용자 가져오기
      const users = await userAPI.getAllUsers();
      const targetUser = users.find(u => u.id === userId);
      
      if (!targetUser) {
        toast.error('사용자를 찾을 수 없습니다');
        navigate('/admin/users');
        return;
      }
      
      console.log('👤 대상 사용자:', targetUser);
      setUser(targetUser);
      
      // 승인된 워크스페이스만 가져오기 (거절된 워크스페이스 제외)
      const workspaces = await workspaceAPI.getApprovedWorkspaces();
      console.log('🏢 승인된 워크스페이스 목록:', workspaces);
      setAllWorkspaces(workspaces);
      
      // 사용자의 현재 워크스페이스 할당 정보 가져오기
      try {
        if (userId) {
          console.log('📋 사용자 워크스페이스 할당 정보 조회 중...');
          const userWorkspaces = await userAPI.getUserWorkspaceAccess(userId);
          console.log('📋 API 응답 - 할당된 워크스페이스:', userWorkspaces);
          
          const assignedWorkspaceIds = userWorkspaces.map(ws => ws.id.toString());
          console.log('📋 할당된 워크스페이스 ID 목록:', assignedWorkspaceIds);
          
          setSelectedWorkspaces(new Set(assignedWorkspaceIds));
          console.log('✅ selectedWorkspaces 상태 설정 완료');
        }
      } catch (error) {
        console.error('❌ 사용자 워크스페이스 할당 정보 조회 실패:', error);
        setSelectedWorkspaces(new Set());
      }
      
    } catch (error) {
      console.error('❌ 전체 데이터 로딩 실패:', error);
      toast.error('데이터를 불러오는데 실패했습니다');
      navigate('/admin/users');
    } finally {
      setLoading(false);
      console.log('🔍 데이터 로딩 완료');
    }
  };

  const handleWorkspaceToggle = (workspaceId: string) => {
    setSelectedWorkspaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceId)) {
        newSet.delete(workspaceId);
      } else {
        newSet.add(workspaceId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      await userAPI.assignWorkspaces(userId, Array.from(selectedWorkspaces));
      toast.success('워크스페이스 접근 권한이 업데이트되었습니다');
      navigate('/admin/users');
    } catch (error) {
      toast.error('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">
                워크스페이스 접근 권한 관리
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                사용자: {user.name} ({user.email})
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  접근 가능한 워크스페이스 선택
                </h2>
                
                {allWorkspaces.length === 0 ? (
                  <p className="text-gray-500">등록된 워크스페이스가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 체크된 워크스페이스는 이 사용자가 접근할 수 있는 워크스페이스입니다.
                      </p>
                    </div>
                    {allWorkspaces.map((workspace) => {
                      const isAssigned = selectedWorkspaces.has(workspace.id.toString());
                      return (
                        <div 
                          key={workspace.id} 
                          className={`flex items-center p-3 rounded-lg border transition-colors ${
                            isAssigned 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            id={`workspace-${workspace.id}`}
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => handleWorkspaceToggle(workspace.id.toString())}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`workspace-${workspace.id}`}
                            className="ml-3 flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{workspace.name}</div>
                                {workspace.description && (
                                  <div className="text-sm text-gray-500">{workspace.description}</div>
                                )}
                              </div>
                              {isAssigned && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  할당됨
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/users')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserWorkspaceAccessPage; 