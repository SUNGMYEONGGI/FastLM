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

  // selectedWorkspace 변화 추적
  useEffect(() => {
    console.log('🏢 Selected workspace changed:', selectedWorkspace);
  }, [selectedWorkspace]);

  const refreshWorkspaces = async () => {
    if (user) {
      try {
        console.log('👤 Fetching workspaces for user:', user.id);
        const userWorkspaces = await workspaceAPI.getUserWorkspaces(user.id);
        console.log('📋 Fetched workspaces:', userWorkspaces);
        setWorkspaces(userWorkspaces);
      } catch (error) {
        console.error('❌ Failed to fetch workspaces:', error);
        setWorkspaces([]);
      }
    } else {
      console.log('👤 No user, clearing workspaces');
      setWorkspaces([]);
      setSelectedWorkspace(null);
      localStorage.removeItem('selectedWorkspaceId');
    }
  };

  useEffect(() => {
    console.log('👤 User changed:', user?.id, user?.name);
    refreshWorkspaces();
  }, [user]);

  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem('selectedWorkspaceId');
    console.log('💾 localStorage inspection:');
    console.log('  - Raw value:', savedWorkspaceId);
    console.log('  - All localStorage keys:', Object.keys(localStorage));
    console.log('  - localStorage.selectedWorkspaceId:', localStorage.getItem('selectedWorkspaceId'));
    console.log('💾 Trying to restore workspace from localStorage:', savedWorkspaceId);
    console.log('📋 Available workspaces:', workspaces.map(w => ({ id: w.id, name: w.name })));
    
    if (savedWorkspaceId && workspaces.length > 0) {
      const workspaceId = parseInt(savedWorkspaceId, 10);
      console.log('🔢 Parsed workspace ID:', workspaceId, 'isNaN:', isNaN(workspaceId));
      
      if (!isNaN(workspaceId)) {
        const workspace = workspaces.find(w => {
          console.log('🔍 Comparing:', w.id, '===', workspaceId, '?', w.id === workspaceId);
          return w.id === workspaceId;
        });
        
        if (workspace) {
          console.log('✅ Restored workspace:', workspace.name, workspace.id);
          setSelectedWorkspace(workspace);
        } else {
          console.log('❌ Workspace not found in user\'s workspaces, removing from localStorage');
          localStorage.removeItem('selectedWorkspaceId');
          setSelectedWorkspace(null);
        }
      } else {
        console.log('❌ Invalid workspace ID format, removing from localStorage');
        localStorage.removeItem('selectedWorkspaceId');
        setSelectedWorkspace(null);
      }
    } else if (savedWorkspaceId && workspaces.length === 0) {
      console.log('⏳ Saved workspace ID exists but no workspaces loaded yet');
    } else if (!savedWorkspaceId && workspaces.length > 0) {
      console.log('📝 No saved workspace ID, but workspaces are available');
    } else {
      console.log('🔍 No saved workspace ID and no workspaces available');
    }
  }, [workspaces]);

  const selectWorkspace = (workspace: Workspace | null) => {
    console.log('🎯 Manually selecting workspace:', workspace?.name, workspace?.id);
    setSelectedWorkspace(workspace);
    if (workspace) {
      const idString = workspace.id.toString();
      console.log('💾 Attempting to save to localStorage:', idString);
      
      try {
        localStorage.setItem('selectedWorkspaceId', idString);
        
        // 저장 검증
        const savedValue = localStorage.getItem('selectedWorkspaceId');
        console.log('💾 Verification - saved value:', savedValue);
        console.log('💾 Verification - save successful:', savedValue === idString);
        
        if (savedValue !== idString) {
          console.error('💾 ERROR: localStorage save failed!');
        }
      } catch (error) {
        console.error('💾 ERROR: Failed to save to localStorage:', error);
      }
    } else {
      console.log('💾 Removing from localStorage');
      
      try {
        localStorage.removeItem('selectedWorkspaceId');
        
        // 삭제 검증
        const removedValue = localStorage.getItem('selectedWorkspaceId');
        console.log('💾 Verification - after removal:', removedValue);
        
        if (removedValue !== null) {
          console.error('💾 ERROR: localStorage removal failed!');
        }
      } catch (error) {
        console.error('💾 ERROR: Failed to remove from localStorage:', error);
      }
    }
  };

  const value: WorkspaceContextType = {
    selectedWorkspace,
    workspaces,
    selectWorkspace,
    refreshWorkspaces
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};