import { User, Workspace, Notice, ZoomExitRecord, ScheduledJob } from '../types';

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

  async assignWorkspaces(userId: string, workspaceIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/workspaces`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ workspaceIds })
    });
    
    if (!response.ok) throw new Error('Failed to assign workspaces');
  },

  async getUserWorkspaceAccess(userId: string): Promise<Workspace[]> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/workspaces`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch user workspace access');
    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return response.json();
  },

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const response = await fetch(`${API_BASE_URL}/workspaces`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch workspaces');
    return response.json();
  },

  async createWorkspace(workspaceData: any): Promise<Workspace> {
    const response = await fetch(`${API_BASE_URL}/admin/workspaces`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(workspaceData)
    });
    
    if (!response.ok) throw new Error('Failed to create workspace');
    return response.json();
  },

  async updateWorkspace(workspaceId: string, workspaceData: any): Promise<Workspace> {
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

  async uploadQRImage(workspaceId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('qr_image', file);
    
    const response = await fetch(`${API_BASE_URL}/admin/workspaces/${workspaceId}/qr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
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