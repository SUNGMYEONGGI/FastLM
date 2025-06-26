import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Layout from "../../components/Layout/Layout";
import { workspaceAPI } from "../../services/api";
import { Workspace } from "../../types";

const WorkspaceApprovalPage: React.FC = () => {
  const [pendingWorkspaces, setPendingWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  useEffect(() => {
    loadPendingWorkspaces();
  }, [filter]);

  const loadPendingWorkspaces = async () => {
    setLoading(true);
    try {
      const workspaces = await workspaceAPI.getPendingWorkspaces(filter);
      setPendingWorkspaces(workspaces);
    } catch (error) {
      console.error("워크스페이스 목록 로드 실패:", error);
      toast.error("워크스페이스 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (workspaceId: string, status: "approved" | "rejected") => {
    try {
      await workspaceAPI.approveWorkspace(workspaceId, { status });
      toast.success(status === "approved" ? "워크스페이스가 승인되었습니다." : "워크스페이스가 거부되었습니다.");
      loadPendingWorkspaces();
    } catch (error) {
      console.error("워크스페이스 승인/거부 실패:", error);
      toast.error("워크스페이스 처리에 실패했습니다.");
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">승인 대기</span>;
      case "approved":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">승인됨</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">거부됨</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">워크스페이스 승인 관리</h1>
            <p className="text-gray-600 mt-2">사용자가 등록한 워크스페이스를 승인하거나 거부할 수 있습니다.</p>
          </div>

          {/* 필터 탭 */}
          <div className="p-6 border-b">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === "pending"
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                승인 대기
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === "all"
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                전체
              </button>
            </div>
          </div>

          {/* 워크스페이스 목록 */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">로딩 중...</p>
              </div>
            ) : pendingWorkspaces.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-500">
                  {filter === "pending" ? "승인 대기 중인 워크스페이스가 없습니다." : "워크스페이스가 없습니다."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingWorkspaces.map((workspace) => (
                  <div key={workspace.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
                          {getStatusBadge(workspace.status)}
                        </div>
                        
                        <p className="text-gray-600 mb-2">{workspace.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">신청자:</span> {workspace.createdBy || "알 수 없음"}
                          </div>
                          <div>
                            <span className="font-medium">신청일:</span> {new Date(workspace.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Slack Webhook:</span>{" "}
                            {workspace.slackWebhookUrl ? "설정됨" : "설정되지 않음"}
                          </div>
                          {workspace.qrImageUrl && (
                            <div>
                              <span className="font-medium">QR 이미지:</span> 업로드됨
                            </div>
                          )}
                        </div>
                      </div>

                      {workspace.status === "pending" && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleApproval(workspace.id, "approved")}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleApproval(workspace.id, "rejected")}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            거부
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkspaceApprovalPage;
