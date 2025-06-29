import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Main Pages
import WorkspaceSelectionPage from './pages/WorkspaceSelectionPage';
import DashboardPage from './pages/Dashboard/DashboardPage';

// Workspace Pages
import WorkspaceRegisterPage from './pages/WorkspaceRegisterPage';
import WorkspaceEditPage from './pages/WorkspaceEditPage';

// Admin Pages
import UserManagementPage from './pages/Admin/UserManagementPage';
import AdminMenuPage from './pages/Admin/AdminMenuPage';
import WorkspaceManagementPage from './pages/Admin/WorkspaceManagementPage';
import UserWorkspaceAccessPage from './pages/Admin/UserWorkspaceAccessPage';
import ScheduledJobsPage from './pages/Admin/ScheduledJobsPage';
import WorkspaceApprovalPage from './pages/Admin/WorkspaceApprovalPage';

// Notice Pages
import CustomNoticePage from './pages/Notices/CustomNoticePage';
import NoticeCustomizePage from './pages/Notices/NoticeCustomizePage';
import NoticeManagementPage from './pages/Notices/NoticeManagementPage';
import NoticeCalendarPage from './pages/Notices/NoticeCalendarPage';

// Settings Pages  
import BotSettingPage from './pages/Settings/BotSettingPage';

// Zoom Pages
import ZoomExitRecordsPage from './pages/Zoom/ZoomExitRecordsPage';

// QR Pages
import QRPage from './pages/QR/QRPage';

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route path="/workspace" element={
                <ProtectedRoute>
                  <WorkspaceSelectionPage />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />

              {/* Settings Routes */}
              <Route path="/bot-setting" element={
                <ProtectedRoute>
                  <BotSettingPage />
                </ProtectedRoute>
              } />
              
              {/* Workspace Routes - 모든 사용자 접근 가능 */}
              <Route path="/workspace/register" element={
                <ProtectedRoute>
                  <WorkspaceRegisterPage />
                </ProtectedRoute>
              } />
              
              <Route path="/workspace/edit/:workspaceId" element={
                <ProtectedRoute>
                  <WorkspaceEditPage />
                </ProtectedRoute>
              } />
              
              {/* Notice Routes */}
              <Route path="/notices/schedule" element={
                <ProtectedRoute>
                  <CustomNoticePage />
                </ProtectedRoute>
              } />
              
              <Route path="/notices/customize" element={
                <ProtectedRoute>
                  <NoticeCustomizePage />
                </ProtectedRoute>
              } />
              
              <Route path="/notices/manage" element={
                <ProtectedRoute>
                  <NoticeManagementPage />
                </ProtectedRoute>
              } />
              
              <Route path="/notices/calendar" element={
                <ProtectedRoute>
                  <NoticeCalendarPage />
                </ProtectedRoute>
              } />

              {/* QR Routes */}
              <Route path="/qr" element={
                <ProtectedRoute>
                  <QRPage />
                </ProtectedRoute>
              } />

              {/* Zoom Routes */}
              <Route path="/zoom/exit-records" element={
                <ProtectedRoute>
                  <ZoomExitRecordsPage />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminMenuPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/users" element={
                <ProtectedRoute requireAdmin>
                  <UserManagementPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/users/:userId/workspace-access" element={
                <ProtectedRoute requireAdmin>
                  <UserWorkspaceAccessPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/workspace/manage" element={
                <ProtectedRoute requireAdmin>
                  <WorkspaceManagementPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/workspace/approval" element={
                <ProtectedRoute requireAdmin>
                  <WorkspaceApprovalPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/workspace/edit/:workspaceId" element={
                <ProtectedRoute requireAdmin>
                  <WorkspaceEditPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/scheduler/jobs" element={
                <ProtectedRoute requireAdmin>
                  <ScheduledJobsPage />
                </ProtectedRoute>
              } />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/workspace" replace />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

export default App;