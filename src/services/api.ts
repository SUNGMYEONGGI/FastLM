import { User, Workspace, Notice, ZoomExitRecord, ScheduledJob } from '../types';

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Auth API
export const authAPI = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // 테스트용 admin 계정
    if (email === 'admin@example.com' && password === 'admin') {
      const mockUser: User = {
        id: 'admin-1',
        email: 'admin@example.com',
        name: '관리자',
        isAdmin: true,
        status: 'approved',
        createdAt: new Date().toISOString(),
        workspaces: ['workspace-1', 'workspace-2']
      };
      const mockToken = 'mock-admin-token-12345';
      return { user: mockUser, token: mockToken };
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  async register(email: string, password: string, name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    if (!response.ok) throw new Error('Registration failed');
  },

  async verifyToken(token: string): Promise<User> {
    // 테스트용 admin 토큰 검증
    if (token === 'mock-admin-token-12345') {
      const mockUser: User = {
        id: 'admin-1',
        email: 'admin@example.com',
        name: '관리자',
        isAdmin: true,
        status: 'approved',
        createdAt: new Date().toISOString(),
        workspaces: ['workspace-1', 'workspace-2']
      };
      return mockUser;
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Token verification failed');
    return response.json();
  }
};

// User API
export const userAPI = {
  async getAllUsers(): Promise<User[]> {
    // 테스트용 사용자 데이터
    const token = localStorage.getItem('token');
    if (token === 'mock-admin-token-12345') {
      const mockUsers: User[] = [
        {
          id: 'admin-1',
          email: 'admin@example.com',
          name: '관리자',
          isAdmin: true,
          status: 'approved',
          createdAt: new Date().toISOString(),
          workspaces: ['workspace-1', 'workspace-2']
        },
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: '사용자1',
          isAdmin: false,
          status: 'approved',
          createdAt: new Date().toISOString(),
          workspaces: ['workspace-1']
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: '사용자2',
          isAdmin: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
          workspaces: []
        }
      ];
      return mockUsers;
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async approveUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to approve user');
  },

  async rejectUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to reject user');
  },

  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  async assignWorkspaces(userId: string, workspaceIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/workspaces`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ workspaceIds })
    });
    if (!response.ok) throw new Error('Failed to assign workspaces');
  }
};

// Workspace API
export const workspaceAPI = {
  async getAllWorkspaces(): Promise<Workspace[]> {
    // 테스트용 워크스페이스 데이터
    const token = localStorage.getItem('token');
    if (token === 'mock-admin-token-12345') {
      const mockWorkspaces: Workspace[] = [
        {
          id: 'workspace-1',
          name: '개발팀 워크스페이스',
          description: '개발팀을 위한 워크스페이스입니다.',
          slackWebhookUrl: 'https://hooks.slack.com/services/mock/url/1',
          qrImageUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'workspace-2',
          name: '디자인팀 워크스페이스',
          description: '디자인팀을 위한 워크스페이스입니다.',
          slackWebhookUrl: 'https://hooks.slack.com/services/mock/url/2',
          qrImageUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return mockWorkspaces;
    }

    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return response.json();
  },

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    // 테스트용 사용자 워크스페이스 데이터
    const token = localStorage.getItem('token');
    if (token === 'mock-admin-token-12345' && userId === 'admin-1') {
      const mockWorkspaces: Workspace[] = [
        {
          id: 'workspace-1',
          name: '개발팀 워크스페이스',
          description: '개발팀을 위한 워크스페이스입니다.',
          slackWebhookUrl: 'https://hooks.slack.com/services/mock/url/1',
          qrImageUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'workspace-2',
          name: '디자인팀 워크스페이스',
          description: '디자인팀을 위한 워크스페이스입니다.',
          slackWebhookUrl: 'https://hooks.slack.com/services/mock/url/2',
          qrImageUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return mockWorkspaces;
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/workspaces`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch user workspaces');
    return response.json();
  },

  async createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create workspace');
    return response.json();
  },

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update workspace');
    return response.json();
  },

  async deleteWorkspace(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete workspace');
  },

  async uploadQRImage(workspaceId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('qrImage', file);
    
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/qr-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload QR image');
    const { imageUrl } = await response.json();
    return imageUrl;
  }
};

// Notice API
export const noticeAPI = {
  async getAllNotices(): Promise<Notice[]> {
    // 테스트용 알림 데이터
    const token = localStorage.getItem('token');
    if (token === 'mock-admin-token-12345') {
      const mockNotices: Notice[] = [
        {
          id: 'notice-1',
          type: 'attendance',
          title: '출석 확인 알림',
          message: '오늘 수업 출석을 확인해주세요.',
          workspaceId: 'workspace-1',
          scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1시간 후
          status: 'scheduled',
          createdBy: 'admin-1',
          noImage: false
        },
        {
          id: 'notice-2',
          type: 'satisfaction',
          title: '만족도 조사',
          message: '오늘 수업에 대한 만족도를 평가해주세요.',
          workspaceId: 'workspace-1',
          scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
          status: 'scheduled',
          createdBy: 'admin-1',
          noImage: true
        }
      ];
      return mockNotices;
    }

    const response = await fetch(`${API_BASE_URL}/notices`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch notices');
    return response.json();
  },

  async createNotice(data: Omit<Notice, 'id'>): Promise<Notice> {
    const response = await fetch(`${API_BASE_URL}/notices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create notice');
    return response.json();
  },

  async updateNotice(id: string, data: Partial<Notice>): Promise<Notice> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update notice');
    return response.json();
  },

  async deleteNotice(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete notice');
  },

  async sendNoticeImmediately(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}/send`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to send notice');
  }
};

// Zoom API
export const zoomAPI = {
  async getExitRecords(): Promise<ZoomExitRecord[]> {
    const response = await fetch(`${API_BASE_URL}/zoom/exit-records`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch exit records');
    return response.json();
  }
};

// Scheduler API
export const schedulerAPI = {
  async getJobs(): Promise<ScheduledJob[]> {
    const response = await fetch(`${API_BASE_URL}/scheduler/jobs`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch scheduled jobs');
    return response.json();
  }
};

// Slack API
export const slackAPI = {
  async initiateOAuth(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/slack/oauth/start`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to initiate Slack OAuth');
    const { authUrl } = await response.json();
    return authUrl;
  },

  async handleOAuthCallback(code: string, state: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/slack/oauth/callback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, state })
    });
    if (!response.ok) throw new Error('Failed to handle OAuth callback');
  }
};