export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isApproved?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  workspaces?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  slackWebhookUrl: string;
  qrImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  type: 'attendance' | 'satisfaction' | 'thread';
  title: string;
  message: string;
  workspaceId: string;
  scheduledAt: string;
  status: 'scheduled' | 'sent' | 'failed';
  createdBy: string;
  noImage?: boolean;
  formData?: Record<string, any>;
}

export interface ZoomExitRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  workspaceId: string;
}

export interface ScheduledJob {
  id: string;
  noticeId: string;
  status: 'pending' | 'completed' | 'failed';
  scheduledAt: string;
  executedAt?: string;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface WorkspaceContextType {
  selectedWorkspace: Workspace | null;
  workspaces: Workspace[];
  selectWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
}

// API 관련 타입들
export interface NoticeCreateRequest {
  type: 'attendance' | 'satisfaction' | 'thread';
  title: string;
  message: string;
  workspaceId: string;
  scheduledAt: string;
  status: 'scheduled' | 'sent' | 'failed';
  createdBy: string;
  noImage?: boolean;
  formData?: any;
}

export interface NoticeUpdateRequest {
  message?: string;
  scheduledAt?: string;
  status?: 'scheduled' | 'sent' | 'failed';
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  isAdmin?: boolean;
  workspaceIds?: string[];
}

export interface WorkspaceCreateRequest {
  name: string;
  description?: string;
  slackWebhookUrl?: string;
}

export interface WorkspaceUpdateRequest {
  name?: string;
  description?: string;
  slackWebhookUrl?: string;
}