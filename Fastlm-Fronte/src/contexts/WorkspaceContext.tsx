import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workspace, WorkspaceContextType } from '../types';
import { workspaceAPI } from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export { WorkspaceContext };

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const { user } = useAuth();

  const refreshWorkspaces = async () => {
    if (user) {
      try {
        const userWorkspaces = await workspaceAPI.getUserWorkspaces(user.id);
        setWorkspaces(userWorkspaces);
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      }
    }
  };

  useEffect(() => {
    refreshWorkspaces();
  }, [user]);

  const selectWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    localStorage.setItem('selectedWorkspaceId', workspace.id);
  };

  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
    if (savedWorkspaceId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.id === savedWorkspaceId);
      if (workspace) {
        setSelectedWorkspace(workspace);
      }
    }
  }, [workspaces]);

  const value: WorkspaceContextType = {
    selectedWorkspace,
    workspaces,
    selectWorkspace,
    refreshWorkspaces
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};