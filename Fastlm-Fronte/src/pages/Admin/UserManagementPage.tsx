import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Trash2, 
  Building2,
  Search,
  Filter,
  MoreVertical,
  Shield,
  X
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { userAPI, workspaceAPI } from '../../services/api';
import { User, Workspace } from '../../types';
import toast from 'react-hot-toast';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [usersData, workspacesData] = await Promise.all([
        userAPI.getAllUsers(),
        workspaceAPI.getAllWorkspaces()
      ]);
      setUsers(usersData);
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error('fetchData error:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다');
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await userAPI.approveUser(userId);
      toast.success('사용자가 승인되었습니다');
      fetchData();
    } catch (error) {
      toast.error('사용자 승인에 실패했습니다');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await userAPI.rejectUser(userId);
      toast.success('사용자가 거부되었습니다');
      fetchData();
    } catch (error) {
      toast.error('사용자 거부에 실패했습니다');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
      try {
        await userAPI.deleteUser(userId);
        toast.success('사용자가 삭제되었습니다');
        fetchData();
      } catch (error) {
        toast.error('사용자 삭제에 실패했습니다');
      }
    }
  };

  const handleAssignWorkspaces = async () => {
    if (!selectedUser) return;
    
    try {
      await userAPI.assignWorkspaces(selectedUser.id, selectedWorkspaces);
      toast.success('워크스페이스가 할당되었습니다');
      setShowWorkspaceModal(false);
      setSelectedUser(null);
      setSelectedWorkspaces([]);
      fetchData();
    } catch (error) {
      toast.error('워크스페이스 할당에 실패했습니다');
    }
  };

  const openWorkspaceModal = async (user: User) => {
    console.log('🔍 워크스페이스 모달 열기, 사용자:', user);
    setSelectedUser(user);
    setShowWorkspaceModal(true);
    setModalLoading(true);
    
    try {
      // 승인된 워크스페이스만 가져오기
      const approvedWorkspaces = await workspaceAPI.getApprovedWorkspaces();
      console.log('🏢 승인된 워크스페이스:', approvedWorkspaces);
      setWorkspaces(approvedWorkspaces);
      
      // 사용자의 현재 워크스페이스 할당 정보 가져오기
      const userWorkspaces = await userAPI.getUserWorkspaceAccess(user.id);
      console.log('📋 사용자 할당된 워크스페이스:', userWorkspaces);
      
      const assignedWorkspaceIds = userWorkspaces.map(ws => ws.id.toString());
      console.log('📋 할당된 워크스페이스 ID 목록:', assignedWorkspaceIds);
      
      setSelectedWorkspaces(assignedWorkspaceIds);
    } catch (error) {
      console.error('❌ 워크스페이스 정보 로드 실패:', error);
      toast.error('워크스페이스 정보를 불러오는데 실패했습니다');
      // 기본값으로 빈 배열 설정
      setSelectedWorkspaces([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeWorkspaceModal = () => {
    setShowWorkspaceModal(false);
    setSelectedUser(null);
    setSelectedWorkspaces([]);
    setModalLoading(false);
  };

  const getUserStatus = (user: User): string => {
    // 백엔드에서 status 필드가 있으면 사용, 없으면 isApproved로 판단
    return user.status || (user.isApproved ? 'approved' : 'pending');
  };

  const getStatusBadge = (user: User) => {
    const status = getUserStatus(user);
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">승인됨</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">대기중</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">거부됨</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userStatus = getUserStatus(user);
    const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-600 text-lg font-medium">오류가 발생했습니다</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
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
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                사용자 관리
              </h1>
              <p className="text-gray-600 mt-1">사용자 승인, 워크스페이스 할당 및 관리</p>
            </div>
            <div className="text-sm text-gray-500">
              총 {users.length}명의 사용자
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">모든 상태</option>
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거부됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    권한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    워크스페이스
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isAdmin ? (
                        <div className="flex items-center text-red-600">
                          <Shield className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">관리자</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">일반 사용자</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          {user.workspaces?.length || 0}개
                        </span>
                        <button
                          onClick={() => openWorkspaceModal(user)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          관리
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {getUserStatus(user) === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="text-green-600 hover:text-green-800 p-1 rounded"
                              title="승인"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded"
                              title="거부"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!user.isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workspace Assignment Modal */}
        {showWorkspaceModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  워크스페이스 할당 - {selectedUser.name}
                </h3>
                <button
                  onClick={closeWorkspaceModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {modalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">정보를 불러오는 중...</span>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 체크된 워크스페이스는 이 사용자가 접근할 수 있는 워크스페이스입니다.
                    </p>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {workspaces.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">승인된 워크스페이스가 없습니다.</p>
                    ) : (
                      workspaces.map((workspace) => {
                        const isAssigned = selectedWorkspaces.includes(workspace.id.toString());
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
                              type="checkbox"
                              checked={isAssigned}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedWorkspaces([...selectedWorkspaces, workspace.id.toString()]);
                                } else {
                                  setSelectedWorkspaces(selectedWorkspaces.filter(id => id !== workspace.id.toString()));
                                }
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{workspace.name}</div>
                                  {workspace.description && (
                                    <div className="text-xs text-gray-500">{workspace.description}</div>
                                  )}
                                </div>
                                {isAssigned && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    할당됨
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={closeWorkspaceModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={modalLoading}
                >
                  취소
                </button>
                <button
                  onClick={handleAssignWorkspaces}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  disabled={modalLoading}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagementPage;