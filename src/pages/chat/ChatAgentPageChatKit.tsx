/**
 * ChatKit-based Chat Agent Page
 * Clean chat interface using OpenAI ChatKit for AI Employee conversations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Settings, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ChatKitEmployeeChat from '@/components/chat/ChatKitEmployeeChat';
import type { PurchasedEmployee } from '@/types/employee';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ChatAgentPageChatKit: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [employee, setEmployee] = useState<PurchasedEmployee | null>(null);
  const [workflowId, setWorkflowId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
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
        // Assuming workflow_id is stored in the employee metadata
        const workflow = employeeData.metadata?.workflow_id || 
                        employeeData.metadata?.workflowId ||
                        process.env.VITE_DEFAULT_WORKFLOW_ID ||
                        '';

        if (!workflow) {
          throw new Error('No workflow ID configured for this AI Employee');
        }

        setWorkflowId(workflow);
        console.log('Loaded employee:', employeeData.name, 'Workflow:', workflow);
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
        <div className="max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Unable to Load AI Employee
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'Please select an AI Employee from your workforce'}
          </p>
          <Button onClick={() => navigate('/workforce')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workforce
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#0d0e11]">
      {/* Header */}
      <div className="bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/workforce')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Avatar className="w-8 h-8">
            <AvatarImage src={employee.avatar_url} alt={employee.name} />
            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              {employee.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
              {employee.name}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {employee.role}
            </p>
          </div>

          <Badge
            variant="outline"
            className="ml-2 text-xs border-green-500 text-green-600 dark:text-green-400"
          >
            Active
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ChatKit Component */}
      <div className="flex-1 overflow-hidden">
        <ChatKitEmployeeChat
          employeeId={employee.id}
          employeeName={employee.name}
          employeeRole={employee.role}
          workflowId={workflowId}
          capabilities={employee.capabilities || []}
          className="w-full h-full"
        />
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              AI Employee Settings
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {employee.name} - {employee.role}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Capabilities
              </h4>
              <div className="flex flex-wrap gap-2">
                {employee.capabilities?.map((cap, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {cap}
                  </Badge>
                )) || <p className="text-xs text-gray-500">No capabilities listed</p>}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Provider
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {employee.provider} {employee.model && `- ${employee.model}`}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Status
              </h4>
              <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                {employee.status}
              </Badge>
            </div>

            {employee.usage_stats && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Usage Stats
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Messages: {employee.usage_stats.messages_sent}</p>
                  <p>Sessions: {employee.usage_stats.total_sessions}</p>
                  {employee.usage_stats.last_used && (
                    <p>Last used: {new Date(employee.usage_stats.last_used).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatAgentPageChatKit;

