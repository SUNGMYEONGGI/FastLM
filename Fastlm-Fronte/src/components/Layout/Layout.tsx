import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main 
        className="ml-64 pt-16 overflow-y-auto"
        style={{ height: '100vh' }}
        onWheel={(e) => {
          // 메인 콘텐츠 영역의 스크롤이 다른 영역에 간섭하지 않도록 격리
          e.stopPropagation();
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;