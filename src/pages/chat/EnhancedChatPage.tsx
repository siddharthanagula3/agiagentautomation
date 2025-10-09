/**
 * Enhanced Chat Page - Next-gen AI chat experience
 * Inspired by bolt.new and Cursor
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/unified-auth-store';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { EnhancedChatInterface } from '@/components/chat/EnhancedChatInterface';

interface EmployeeData {
  id: string;
  name: string;
  role: string;
  provider: string;
  capabilities?: string[];
}

const EnhancedChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const employeeIdFromParams = searchParams.get('employee');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!employeeIdFromParams) {
      navigate('/workforce');
      return;
    }

    loadEmployee();
  }, [user, employeeIdFromParams]);

  const loadEmployee = async () => {
    if (!user || !employeeIdFromParams) return;

    try {
      setIsLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('purchased_employees')
        .select('*')
        .eq('id', employeeIdFromParams)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !data) {
        console.error('Error fetching employee:', fetchError);
        setError('Employee not found or not purchased.');
        toast.error('Employee not found');
        return;
      }

      setEmployee({
        id: data.id,
        name: data.name,
        role: data.role,
        provider: data.provider,
        capabilities: data.capabilities,
      });
    } catch (err: any) {
      console.error('Failed to load employee:', err);
      setError(err.message || 'Failed to load employee details.');
      toast.error('Failed to load employee');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-6">
        <Card className="max-w-md p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Chat</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'Something went wrong. Please try again.'}
          </p>
          <Button onClick={() => navigate('/workforce')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workforce
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col bg-background"
    >
      <EnhancedChatInterface
        employeeId={employee.id}
        employeeName={employee.name}
        employeeRole={employee.role}
        provider={employee.provider}
        userId={user.id}
        className="flex-1"
      />
    </motion.div>
  );
};

export default EnhancedChatPage;

