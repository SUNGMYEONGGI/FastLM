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
  id: number;
  name: string;
  description?: string;
  slackWebhookUrl?: string;
  webhookUrls?: string[];
  checkinTime?: string;
  middleTime?: string;
  checkoutTime?: string;
  qrImageUrl?: string;
  zoomUrl?: string;
  zoomId?: string;
  zoomPassword?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// 공지 카테고리
export interface NoticeCategory {
  id: string;
  name: string;
  type: 'predefined' | 'custom';
  description?: string;
  workspaceId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 템플릿 변수
export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  example: string;
  required: boolean;
  type: 'string' | 'date' | 'time' | 'url' | 'number';
}

// 공지 템플릿
export interface NoticeTemplate {
  id: string;
  categoryId: string;
  name: string;
  title: string;
  content: string;
  workspaceId: string;
  variables: TemplateVariable[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  type: 'attendance' | 'satisfaction' | 'thread' | 'custom';
  categoryId?: string;
  templateId?: string;
  title: string;
  message: string;
  workspaceId: string;
  scheduledAt: string;
  status: 'scheduled' | 'sent' | 'failed';
  createdBy: string;
  noImage?: boolean;
  formData?: Record<string, any>;
  variableData?: Record<string, any>;
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
  selectWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
}

// API 관련 타입들
export interface NoticeCreateRequest {
  type: 'attendance' | 'satisfaction' | 'thread' | 'custom';
  categoryId?: string;
  templateId?: string;
  title: string;
  message: string;
  workspaceId: string;
  scheduledAt: string;
  status: 'scheduled' | 'sent' | 'failed';
  createdBy: string;
  noImage?: boolean;
  formData?: any;
  variableData?: Record<string, any>;
}

export interface NoticeUpdateRequest {
  message?: string;
  scheduledAt?: string;
  status?: 'scheduled' | 'sent' | 'failed';
}

// 템플릿 관련 API 타입들
export interface TemplateCategoryCreateRequest {
  name: string;
  description?: string;
  workspaceId: string;
}

export interface NoticeTemplateCreateRequest {
  categoryId: string;
  name: string;
  title: string;
  content: string;
  workspaceId: string;
  variables: TemplateVariable[];
  isDefault?: boolean;
}

export interface NoticeTemplateUpdateRequest {
  name?: string;
  title?: string;
  content?: string;
  variables?: TemplateVariable[];
  isDefault?: boolean;
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

export interface WorkspaceApprovalRequest {
  status: 'approved' | 'rejected';
}

// 워크스페이스 변수들 (실제 값으로 대체될 변수들)
export const WORKSPACE_VARIABLES: TemplateVariable[] = [
  {
    key: 'name',
    label: '워크스페이스 이름',
    description: '현재 선택된 워크스페이스의 이름',
    example: 'AI 14기',
    required: false,
    type: 'string'
  },
  {
    key: 'checkin_time',
    label: '입실 시간',
    description: '워크스페이스에 설정된 입실 시간',
    example: '09:00',
    required: false,
    type: 'time'
  },
  {
    key: 'middle_time',
    label: '중간 시간',
    description: '워크스페이스에 설정된 중간 시간',
    example: '13:00',
    required: false,
    type: 'time'
  },
  {
    key: 'checkout_time',
    label: '퇴실 시간',
    description: '워크스페이스에 설정된 퇴실 시간',
    example: '18:00',
    required: false,
    type: 'time'
  },
  {
    key: 'zoom_url',
    label: 'Zoom URL',
    description: '워크스페이스에 설정된 Zoom 회의실 URL',
    example: 'https://zoom.us/j/123456789',
    required: false,
    type: 'url'
  },
  {
    key: 'zoom_id',
    label: 'Zoom ID',
    description: '워크스페이스에 설정된 Zoom 회의실 ID',
    example: '123 456 789',
    required: false,
    type: 'string'
  },
  {
    key: 'zoom_password',
    label: 'Zoom 비밀번호',
    description: '워크스페이스에 설정된 Zoom 회의실 비밀번호',
    example: 'password123',
    required: false,
    type: 'string'
  },
  {
    key: 'current_date',
    label: '현재 날짜',
    description: '공지가 전송되는 날짜 (YYYY-MM-DD 형식)',
    example: '2024-01-15',
    required: false,
    type: 'date'
  },
  {
    key: 'current_time',
    label: '현재 시간',
    description: '공지가 전송되는 시간 (HH:mm 형식)',
    example: '09:30',
    required: false,
    type: 'time'
  },
  {
    key: 'checkin_time_minus_10',
    label: '입실 시간 -10분',
    description: '입실 시간에서 10분 전 시간',
    example: '08:50',
    required: false,
    type: 'time'
  },
  {
    key: 'checkout_time_plus_10',
    label: '퇴실 시간 +10분',
    description: '퇴실 시간에서 10분 후 시간',
    example: '18:10',
    required: false,
    type: 'time'
  },
  {
    key: 'current_date_kr',
    label: '현재 날짜 (한국어)',
    description: '공지가 전송되는 날짜 (M월 N일 형식)',
    example: '1월 15일',
    required: false,
    type: 'string'
  }
];

// 기본 공지 카테고리들
export const DEFAULT_NOTICE_CATEGORIES: Omit<NoticeCategory, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '출결 공지',
    type: 'predefined',
    description: '입실, 중간, 퇴실 관련 출결 공지',
    isActive: true
  },
  {
    name: '만족도 공지',
    type: 'predefined',
    description: '강의 및 모듈 만족도 조사 공지',
    isActive: true
  },
  {
    name: '운영 질문 스레드',
    type: 'predefined',
    description: '운영 관련 질문 스레드 공지',
    isActive: true
  },
  {
    name: '기타 공지',
    type: 'custom',
    description: '커스텀 공지 템플릿',
    isActive: true
  }
];