import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/unified-auth-store';
import { useLocation, useNavigate } from 'react-router-dom';

export const AuthDebugMonitor: React.FC = () => {
  const authState = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const newLog = `${new Date().toISOString().split('T')[1].split('.')[0]} - Auth: ${authState.isAuthenticated}, User: ${authState.user?.email || 'None'}, Loading: ${authState.isLoading}, Path: ${location.pathname}`;
    setLogs(prev => [newLog, ...prev.slice(0, 9)]); // Keep last 10 logs
  }, [authState.isAuthenticated, authState.user, authState.isLoading, location.pathname]);

  // Only show in development and when there's activity
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white p-3 rounded-lg text-xs font-mono max-w-md z-50 border border-gray-600">
      <div className="mb-2 font-bold text-yellow-400">🔍 Auth Flow Debug</div>
      
      <div className="mb-2 space-y-1">
        <div>Status: {authState.isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</div>
        <div>User: {authState.user?.email || 'None'}</div>
        <div>Loading: {authState.isLoading ? '⏳ Yes' : '✅ No'}</div>
        <div>Error: {authState.error || 'None'}</div>
        <div>Path: {location.pathname}</div>
      </div>

      <div className="border-t border-gray-600 pt-2">
        <div className="text-gray-400 mb-1">Recent Activity:</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="text-xs text-gray-300">
              {log}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-600 pt-2 mt-2">
        <button
          onClick={() => navigate('/debug')}
          className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          Full Debug Page
        </button>
      </div>
    </div>
  );
};
