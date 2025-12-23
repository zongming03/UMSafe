import React, { useState, useRef } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import Sidebar from "../components/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import SessionExpiryBanner from "../components/SessionExpiryBanner";
import SocketListener from "../components/SocketListener";
import SocketTestPanel from "../components/SocketTestPanel";

export default function Layout({ userRole }) {
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const MIN_WIDTH = 180;
  const MAX_WIDTH = 400;

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Check if current route is complaint detail page
  const isComplaintDetailPage = location.pathname.match(/^\/complaints\/[^\/]+$/);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SessionExpiryBanner />
      <SocketListener />
      <Header />

      <div style={{ display: "flex", flex: 1, position: 'relative' }}>
        {!isComplaintDetailPage && (
          <div 
            ref={sidebarRef}
            style={{ 
              width: `${sidebarWidth}px`, 
              minWidth: `${MIN_WIDTH}px`,
              maxWidth: `${MAX_WIDTH}px`,
              position: 'relative',
              transition: isResizing ? 'none' : 'width 0.2s ease'
            }}
          >
            <Sidebar userRole={userRole} />
            <div
              onMouseDown={handleMouseDown}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                cursor: 'ew-resize',
                backgroundColor: isResizing ? '#3b82f6' : 'transparent',
                transition: 'background-color 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                if (!isResizing) e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
          </div>
        )}
        <main style={{ flex: 1, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <Footer />
      <SocketTestPanel />
    </div>
  );
}

