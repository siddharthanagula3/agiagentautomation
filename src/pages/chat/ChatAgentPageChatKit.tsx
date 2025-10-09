/**
 * ChatKit Chat Agent Page - Simple Full-Screen Chat
 * Clean interface with just the ChatKit component
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase-client';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ChatKitEmployeeChat from '@/components/chat/ChatKitEmployeeChat';
import type { PurchasedEmployee } from '@/types/employee';

const ChatAgentPageChatKit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [employee, setEmployee] = useState<PurchasedEmployee | null>(null);
  const [workflowId, setWorkflowId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Get employee ID from URL params
  const employeeIdFromParams = searchParams.get('employee');

  // Load employee data
  useEffect(() => {
    if (!user || !employeeIdFromParams) {
      navigate('/workforce');
      return;
    }

    const loadEmployee = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Fetch employee data
        const { data: employeeData, error: employeeError } = await supabase
          .from('purchased_employees')
          .select('*')
          .eq('id', employeeIdFromParams)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (employeeError || !employeeData) {
          throw new Error('AI Employee not found or not active');
        }

        setEmployee(employeeData);

        // Get workflow ID from metadata
        const workflow =
          employeeData.metadata?.workflow_id ||
          employeeData.metadata?.workflowId ||
          process.env.VITE_DEFAULT_WORKFLOW_ID ||
          '';

        if (!workflow) {
          throw new Error('No workflow ID configured for this AI Employee');
        }

        setWorkflowId(workflow);
      } catch (err: any) {
        console.error('Load employee error:', err);
        setError(err.message || 'Failed to load AI Employee');
        toast.error(err.message || 'Failed to load AI Employee');
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployee();
  }, [user, employeeIdFromParams, navigate]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#0d0e11]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading AI Employee...
        </p>
      </div>
    );
  }

  if (error || !employee || !workflowId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#0d0e11] px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load AI Employee
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          {error || 'Please select an AI Employee from your workforce'}
        </p>
        <button
          onClick={() => navigate('/workforce')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Back to Workforce
        </button>
      </div>
    );
  }

  // Full-screen ChatKit - no header, no sidebar, just chat
  return (
    <div className="h-screen w-full">
      <ChatKitEmployeeChat
        employeeId={employee.id}
        employeeName={employee.name}
        employeeRole={employee.role}
        workflowId={workflowId}
        capabilities={employee.capabilities || []}
        className="w-full h-full"
      />
    </div>
  );
};

export default ChatAgentPageChatKit;
