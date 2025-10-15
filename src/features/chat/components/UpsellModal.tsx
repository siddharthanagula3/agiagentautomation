/**
 * Upsell Modal
 * Prompts user to hire required AI employee when skill is missing
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Card, CardContent } from '@shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Separator } from '@shared/ui/separator';
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { AI_EMPLOYEES } from '@/data/ai-employees';
import {
  usePendingUpsell,
  useCompanyHubStore,
} from '@shared/stores/company-hub-store';
import { toast } from 'sonner';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import { purchaseEmployee } from '@features/workforce/services/supabase-employees';

const getProviderColor = (provider: string) => {
  const colors = {
    chatgpt: 'bg-green-500/20 text-green-400 border-green-500/30',
    openai: 'bg-green-500/20 text-green-400 border-green-500/30',
    claude: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    anthropic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    gemini: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    google: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    perplexity: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return (
    colors[provider as keyof typeof colors] ||
    'bg-gray-500/20 text-gray-400 border-gray-500/30'
  );
};

export const UpsellModal: React.FC = () => {
  const pendingUpsell = usePendingUpsell();
  const { user } = useAuthStore();
  const resolveUpsell = useCompanyHubStore((state) => state.resolveUpsell);
  const [isHiring, setIsHiring] = useState(false);

  const handleApprove = async () => {
    if (!pendingUpsell || !user) return;

    setIsHiring(true);
    try {
      // Purchase the employee
      await purchaseEmployee(user.id, {
        employeeId: pendingUpsell.requiredEmployeeId,
        provider: pendingUpsell.provider,
      });

      toast.success(`Hired ${pendingUpsell.requiredEmployeeName}!`, {
        description: 'Employee added to your team',
      });

      // Resolve the upsell as approved
      resolveUpsell(pendingUpsell.id, 'approved');
    } catch (error) {
      console.error('Failed to hire employee:', error);
      toast.error('Failed to hire employee', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsHiring(false);
    }
  };

  const handleDeny = () => {
    if (!pendingUpsell) return;

    toast.info('Skipped hiring', {
      description: 'Continuing with available employees',
    });

    resolveUpsell(pendingUpsell.id, 'denied');
  };

  if (!pendingUpsell) return null;

  const employee = AI_EMPLOYEES.find(
    (e) => e.id === pendingUpsell.requiredEmployeeId
  );
  if (!employee) return null;

  return (
    <Dialog
      open={!!pendingUpsell}
      onOpenChange={() => !isHiring && handleDeny()}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Required AI Employee</DialogTitle>
          </div>
          <DialogDescription>
            To complete this task, an additional AI employee is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback className="bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {employee.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {pendingUpsell.requiredEmployeeRole}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          getProviderColor(pendingUpsell.provider)
                        )}
                      >
                        {pendingUpsell.provider}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {employee.specialty}
                    </p>

                    {/* Skills */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {employee.skills.slice(0, 4).map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {employee.skills.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{employee.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Separator />

          {/* Reason for Requirement */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">
                Why is this employee needed?
              </h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {pendingUpsell.reason}
            </p>
          </motion.div>

          {/* Task Context */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-border bg-background/50 p-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground">
                Current Task
              </p>
            </div>
            <p className="text-sm text-foreground">
              {pendingUpsell.taskDescription}
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                What you get
              </h4>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Complete the current task successfully</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>
                  Permanent access to {employee.name} for future tasks
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Specialized expertise in {employee.category}</span>
              </li>
            </ul>
          </motion.div>

          {/* Pricing (if applicable) */}
          {pendingUpsell.price > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-lg border border-primary/30 bg-primary/5 p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  One-time cost:
                </span>
                <span className="text-2xl font-bold text-primary">
                  ${pendingUpsell.price.toFixed(2)}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={isHiring}
            className="w-full sm:w-auto"
          >
            Skip This Step
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isHiring}
            className="w-full bg-primary hover:bg-primary/90 sm:w-auto"
          >
            {isHiring ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                Hiring...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Hire & Continue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
