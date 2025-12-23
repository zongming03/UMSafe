import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

export default function SessionExpiryBanner() {
  const { sessionExpiring, formattedTimeLeft, extendSession, logout } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (!sessionExpiring) return null;

  const handleExtend = async () => {
    setRefreshing(true);
    setError(null);
    const ok = await extendSession();
    setRefreshing(false);
    if (!ok) setError('Failed to extend session. Please re-login soon.');
  };

  const handleLogout = async () => {
    try {
      console.log("🔐 Session expiry logout initiated...");
      await logout();
      console.log("✅ Logout complete, redirecting to login...");
      navigate('/login', { replace: true });
    } catch (err) {
      console.error("❌ Logout error:", err);
      navigate('/login', { replace: true });
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderBottom: '2px solid #f59e0b',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '14px',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        .session-expiry-time {
          animation: pulse 2s ease-in-out infinite;
        }
        .stay-btn:hover {
          background: #1d4ed8 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .logout-btn:hover {
          background: #fee2e2 !important;
          border-color: #b91c1c !important;
          color: #b91c1c !important;
        }
      `}</style>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          background: '#f59e0b',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: '#92400e', fontSize: '15px' }}>
              Session Expiring Soon
            </span>
            <span style={{ 
              background: '#dc2626',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }} className="session-expiry-time">
              <FontAwesomeIcon icon={faClock} style={{ fontSize: '10px' }} />
              {formattedTimeLeft() || 'calculating...'}
            </span>
          </div>
          <span style={{ color: '#78350f', fontSize: '13px' }}>
            Stay signed in or you will be logged out automatically
          </span>
          {error && (
            <span style={{ 
              color: '#dc2626', 
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '2px' 
            }}>
              ⚠️ {error}
            </span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleExtend}
          disabled={refreshing}
          className="stay-btn"
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s ease',
            opacity: refreshing ? 0.7 : 1,
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
          }}
        >
          {refreshing ? (
            <>
              <span style={{ 
                display: 'inline-block', 
                width: '12px', 
                height: '12px', 
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                marginRight: '6px'
              }}></span>
              Extending...
            </>
          ) : (
            '🔐 Stay Signed In'
          )}
        </button>
        <button
          onClick={handleLogout}
          className="logout-btn"
          style={{
            background: '#fff',
            color: '#dc2626',
            border: '2px solid #dc2626',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          Logout Now
        </button>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
