import { User, Workspace, Notice, ZoomExitRecord, ScheduledJob, NoticeCategory, NoticeTemplate, TemplateCategoryCreateRequest, NoticeTemplateCreateRequest, NoticeTemplateUpdateRequest } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Auth API
export const authAPI = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },

  async register(email: string, password: string, name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, name })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
  },

  async verifyToken(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Token verification failed');
    }
    
    return response.json();
  }
};

// User API
export const userAPI = {
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async approveUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to approve user');
  },

  async rejectUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to reject user');
  },

  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to delete user');
  },

  async assignWorkspaces(userId: string | number, workspaceIds: string[]): Promise<void> {
    // userId를 정수로 변환
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    console.log('🌐 API: assignWorkspaces 호출, userId:', userIdInt, 'workspaceIds:', workspaceIds);
    
    const response = await fetch(`${API_BASE_URL}/admin/users/${userIdInt}/workspaces`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ workspaceIds })
    });
    
    if (!response.ok) throw new Error('Failed to assign workspaces');
  },

  async getUserWorkspaceAccess(userId: string | number): Promise<Workspace[]> {
    console.log('🌐 API: getUserWorkspaceAccess 호출, userId:', userId, 'type:', typeof userId);
    // userId를 정수로 변환
    const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    console.log('🌐 API: 변환된 userId:', userIdInt);
    
    const response = await fetch(`${API_BASE_URL}/admin/users/${userIdInt}/workspaces`, {
      headers: getAuthHeaders()
    });
    
    console.log('🌐 API: getUserWorkspaceAccess 응답 상태:', response.status);
    
    if (!response.ok) {
      console.error('🌐 API: getUserWorkspaceAccess 실패, 상태:', response.status);
      const errorText = await response.text();
      console.error('🌐 API: 오류 내용:', errorText);
      throw new Error('Failed to fetch user workspace access');
    }
    
    const result = await response.json();
    console.log('🌐 API: getUserWorkspaceAccess 결과:', result);
    return result;
  },

  async updateUserWorkspaceAccess(userId: string, workspaceIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/workspaces`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ workspaceIds })
    });
    
    if (!response.ok) throw new Error('Failed to update user workspace access');
  },

  async updateUser(userId: string, userData: any): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  }
};

// Workspace API
export const workspaceAPI = {
  async getAllWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${API_BASE_URL}/admin/workspaces`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return response.json();
  },

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    console.log('🌐 API: Calling getUserWorkspaces for user:', userId);
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      console.error('🌐 API: Failed to fetch workspaces, status:', response.status);
      throw new Error('Failed to fetch workspaces');
    }
    
    const data = await response.json();
    console.log('🌐 API: Raw workspace data received:', data);
    console.log('🌐 API: Workspace IDs and types:', data.map((w: any) => ({ id: w.id, type: typeof w.id, name: w.name })));
    
    return data;
  },

  async createWorkspace(workspaceData: any): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(workspaceData)
    });
    
    if (!response.ok) throw new Error('Failed to create workspace');
    return response.json();
  },

  async getPendingWorkspaces(filter: 'pending' | 'all' = 'pending'): Promise<Workspace[]> {
    const queryParam = filter === 'all' ? '' : '?status=pending';
    const response = await fetch(`${API_BASE_URL}/admin/workspaces/pending${queryParam}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch pending workspaces');
    return response.json();
  },

  async approveWorkspace(workspaceId: string, approval: { status: 'approved' | 'rejected' }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/workspaces/${workspaceId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(approval)
    });
    
    if (!response.ok) throw new Error('Failed to approve workspace');
  },

  async getWorkspaceDetail(workspaceId: number): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch workspace detail');
    return response.json();
  },

  async updateWorkspace(workspaceId: number, workspaceData: any): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(workspaceData)
    });
    
    if (!response.ok) throw new Error('Failed to update workspace');
    return response.json();
  },

  async uploadQRImage(workspaceId: number, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('qrImage', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/qr`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) throw new Error('Failed to upload QR image');
    const result = await response.json();
    return result.qrImageUrl;
  },

  async leaveWorkspace(workspaceId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/leave`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to leave workspace');
  },

  async updateWorkspaceAdmin(workspaceId: string, workspaceData: any): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/admin/workspaces/${workspaceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(workspaceData)
    });
    
    if (!response.ok) throw new Error('Failed to update workspace');
    return response.json();
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/workspaces/${workspaceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to delete workspace');
  },

  // 승인된 워크스페이스만 조회 (사용자 할당용)
  async getApprovedWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${API_BASE_URL}/admin/workspaces/approved`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch approved workspaces');
    return response.json();
  },

};

// Notice API
export const noticeAPI = {
  async getAllNotices(): Promise<Notice[]> {
    const response = await fetch(`${API_BASE_URL}/notices`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch notices');
    return response.json();
  },

  async createNotice(noticeData: any): Promise<Notice> {
    const response = await fetch(`${API_BASE_URL}/notices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(noticeData)
    });
    
    if (!response.ok) throw new Error('Failed to create notice');
    return response.json();
  },

  async updateNotice(noticeId: string, noticeData: any): Promise<Notice> {
    const response = await fetch(`${API_BASE_URL}/notices/${noticeId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(noticeData)
    });
    
    if (!response.ok) throw new Error('Failed to update notice');
    return response.json();
  },

  async deleteNotice(noticeId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/${noticeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to delete notice');
  },

  async bulkDeleteNotices(noticeIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/bulk-delete`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ noticeIds })
    });
    
    if (!response.ok) throw new Error('Failed to bulk delete notices');
  },

  async sendNoticeImmediately(noticeId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/${noticeId}/send`, {
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
  },

  async initiateOAuth(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/zoom/oauth/initiate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to initiate OAuth');
    const data = await response.json();
    return data.authUrl;
  },

  async handleOAuthCallback(code: string, state: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/zoom/oauth/callback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, state })
    });
    
    if (!response.ok) throw new Error('OAuth callback failed');
  }
};

// Scheduler API
export const schedulerAPI = {
  async getJobs(): Promise<ScheduledJob[]> {
    const response = await fetch(`${API_BASE_URL}/admin/scheduler/jobs`, {
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

// Template Category API
export const templateCategoryAPI = {
  async getCategories(workspaceId?: string): Promise<NoticeCategory[]> {
    const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
    const response = await fetch(`${API_BASE_URL}/template-categories${params}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch template categories');
    return response.json();
  },

  async createCategory(categoryData: TemplateCategoryCreateRequest): Promise<NoticeCategory> {
    const response = await fetch(`${API_BASE_URL}/template-categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    
    if (!response.ok) throw new Error('Failed to create template category');
    return response.json();
  },

  async updateCategory(categoryId: string, categoryData: Partial<TemplateCategoryCreateRequest>): Promise<NoticeCategory> {
    const response = await fetch(`${API_BASE_URL}/template-categories/${categoryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    
    if (!response.ok) throw new Error('Failed to update template category');
    return response.json();
  },

  async deleteCategory(categoryId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/template-categories/${categoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to delete template category');
  }
};

// Notice Template API
export const noticeTemplateAPI = {
  async getTemplates(workspaceId?: string, categoryId?: string): Promise<NoticeTemplate[]> {
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspaceId', workspaceId);
    if (categoryId) params.append('categoryId', categoryId);
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/notice-templates?${queryString}` : `${API_BASE_URL}/notice-templates`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch notice templates');
    return response.json();
  },

  async getTemplate(templateId: string): Promise<NoticeTemplate> {
    const response = await fetch(`${API_BASE_URL}/notice-templates/${templateId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch notice template');
    return response.json();
  },

  async createTemplate(templateData: NoticeTemplateCreateRequest): Promise<NoticeTemplate> {
    const response = await fetch(`${API_BASE_URL}/notice-templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) throw new Error('Failed to create notice template');
    return response.json();
  },

  async updateTemplate(templateId: string, templateData: NoticeTemplateUpdateRequest): Promise<NoticeTemplate> {
    const response = await fetch(`${API_BASE_URL}/notice-templates/${templateId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) throw new Error('Failed to update notice template');
    return response.json();
  },

  async deleteTemplate(templateId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notice-templates/${templateId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to delete notice template');
  },

  async previewTemplate(templateId: string, variableData: Record<string, any>, workspaceId: string): Promise<{ title: string; content: string }> {
    const response = await fetch(`${API_BASE_URL}/notice-templates/${templateId}/preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ variableData, workspaceId })
    });
    
    if (!response.ok) throw new Error('Failed to preview template');
    return response.json();
  }
};