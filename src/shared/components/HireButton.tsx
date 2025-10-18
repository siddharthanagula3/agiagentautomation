/**
 * Optimistic Hire Button Component
 * Provides instant UI feedback for hiring AI employees
 */

import React, { useEffect, useState, useTransition } from 'react';
import { Button } from '@shared/ui/button';
import { CheckCircle, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared/stores/authentication-store';
import { supabase } from '@shared/lib/supabase-client';
import { cn } from '@shared/lib/utils';

interface HireButtonProps {
  employeeId: string;
  employeeName?: string;
  initialHired?: boolean;
  onHired?: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const HireButton: React.FC<HireButtonProps> = ({
  employeeId,
  employeeName = 'AI Employee',
  initialHired = false,
  onHired,
  className,
  size = 'sm',
}) => {
  const [hired, setHired] = useState(initialHired);
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    setHired(initialHired);
  }, [initialHired]);

  const hire = async () => {
    // Prevent double-clicks and concurrent executions
    if (hired || isPending || isProcessing) return;

    setIsProcessing(true);

    // Check authentication
    if (!user) {
      setIsProcessing(false);
      toast.error('Please sign in to hire AI employees', {
        description: 'You need to be signed in to hire AI employees',
        duration: 4000,
      });
      navigate('/auth/login');
      return;
    }

    // Optimistic update
    setHired(true);

    startTransition(async () => {
      try {
        // Check if already hired
        const { data: existingHire } = await supabase
          .from('purchased_employees')
          .select('id')
          .eq('user_id', user.id)
          .eq('employee_id', employeeId)
          .single();

        if (existingHire) {
          setIsProcessing(false);
          toast.info('You have already hired this employee', {
            description: 'Check your workforce page to start chatting',
          });
          return;
        }

        // Insert hire record
        const { error } = await supabase.from('purchased_employees').insert({
          user_id: user.id,
          employee_id: employeeId,
          name: employeeName,
          role: employeeName,
          provider: 'chatgpt', // Default provider
          is_active: true,
        });

        if (error) {
          // Revert optimistic update on error
          setHired(false);

          if (error.code === '23505') {
            // Unique constraint violation - already hired
            setIsProcessing(false);
            toast.info('You have already hired this employee', {
              description: 'Check your workforce page to start chatting',
            });
            return;
          }

          console.error('[HireButton] Insert failed:', error);
          setIsProcessing(false);
          toast.error('Failed to hire employee', {
            description: 'Please try again or contact support',
            duration: 5000,
          });
          return;
        }

        // Dispatch custom event for workforce sync
        window.dispatchEvent(new CustomEvent('team:refresh'));

        toast.success('AI Employee hired successfully!', {
          description: 'Redirecting to your workforce...',
          duration: 3000,
        });

        // Call onHired callback after showing toast
        onHired?.();

        // Navigate to chat after a short delay
        setTimeout(() => {
          navigate(`/workforce?employee=${employeeId}`);
        }, 1500);
      } catch (error) {
        // Revert optimistic update on error
        setHired(false);
        setIsProcessing(false);
        console.error('[HireButton] Unexpected error:', error);
        toast.error('An unexpected error occurred', {
          description: 'Please try again or contact support',
          duration: 5000,
        });
      } finally {
        setIsProcessing(false);
      }
    });
  };

  if (hired) {
    return (
      <Button
        onClick={() => navigate(`/chat?employee=${employeeId}`)}
        size={size}
        className={cn('bg-green-600 text-white hover:bg-green-700', className)}
      >
        <CheckCircle className="mr-1 h-4 w-4" />
        Open Chat
      </Button>
    );
  }

  return (
    <Button
      onClick={hire}
      disabled={isPending || isProcessing}
      size={size}
      className={cn(
        'bg-primary text-primary-foreground hover:bg-primary/90',
        className
      )}
    >
      {isPending ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-1 h-4 w-4" />
      )}
      Hire Now
    </Button>
  );
};

export default HireButton;
