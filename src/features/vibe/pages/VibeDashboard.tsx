/**
 * VibeDashboard - Main entry point for the VIBE multi-agent interface
 * Accessible from "Start Building" button in /workforce
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeManagementStore } from '@shared/stores/employee-management-store';
import { useVibeChatStore } from '../stores/vibe-chat-store';
import VibeLayout from '../components/layout/VibeLayout';
import VibeSidebar from '../components/layout/VibeSidebar';
import VibeChatCanvas from '../components/chat/VibeChatCanvas';

const VibeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { hiredEmployees } = useEmployeeManagementStore();
  const { currentSessionId, createNewSession } = useVibeChatStore();

  useEffect(() => {
    // Check if user has hired employees
    if (!hiredEmployees || hiredEmployees.length === 0) {
      // Redirect to workforce to hire employees first
      navigate('/workforce', {
        state: {
          message: 'Please hire at least one AI employee to use the VIBE interface.',
        },
      });
      return;
    }

    // Create a new session if none exists
    if (!currentSessionId) {
      createNewSession('New Chat');
    }
  }, [hiredEmployees, currentSessionId, createNewSession, navigate]);

  // Don't render if no employees
  if (!hiredEmployees || hiredEmployees.length === 0) {
    return null;
  }

  return (
    <VibeLayout>
      <VibeSidebar />
      <VibeChatCanvas />
    </VibeLayout>
  );
};

export default VibeDashboard;
