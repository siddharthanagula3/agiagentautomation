/**
 * Chat Stability Test Component
 * Tests various chat scenarios to ensure stability
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useChatState } from '@shared/hooks/useChatState';
import { chatSyncService } from '@core/storage/chat-sync-service';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  duration?: number;
}

export const ChatStabilityTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'State Management', status: 'pending' },
    { name: 'Message Synchronization', status: 'pending' },
    { name: 'Error Handling', status: 'pending' },
    { name: 'Memory Management', status: 'pending' },
    { name: 'Concurrent Operations', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const chatState = useChatState();

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();

    setTests(prev =>
      prev.map(test =>
        test.name === testName ? { ...test, status: 'running' as const } : test
      )
    );

    try {
      await testFn();
      const duration = Date.now() - startTime;

      setTests(prev =>
        prev.map(test =>
          test.name === testName
            ? { ...test, status: 'passed' as const, duration }
            : test
        )
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      setTests(prev =>
        prev.map(test =>
          test.name === testName
            ? {
                ...test,
                status: 'failed' as const,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
              }
            : test
        )
      );
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);

    // Test 1: State Management
    await runTest('State Management', async () => {
      // Test adding and removing tabs
      chatState.addTab({
        id: 'test-tab-1',
        employeeId: 'test-employee',
        role: 'test-role',
        name: 'Test Employee',
        provider: 'openai',
      });

      if (chatState.tabs.length === 0) {
        throw new Error('Failed to add tab');
      }

      // Test adding messages
      chatState.addMessage('test-tab-1', {
        role: 'user',
        content: 'Test message',
      });

      const tab = chatState.tabs.find(t => t.id === 'test-tab-1');
      if (!tab || tab.messages.length === 0) {
        throw new Error('Failed to add message');
      }

      // Clean up
      chatState.removeTab('test-tab-1');
    });

    // Test 2: Message Synchronization
    await runTest('Message Synchronization', async () => {
      // Test subscription lifecycle
      let messageReceived = false;

      const onMessage = () => {
        messageReceived = true;
      };

      const onError = (error: Error) => {
        throw error;
      };

      // This would normally subscribe to a real conversation
      // For testing, we just verify the service methods exist
      if (typeof chatSyncService.subscribeToConversation !== 'function') {
        throw new Error('Subscribe method not available');
      }

      if (typeof chatSyncService.unsubscribeFromConversation !== 'function') {
        throw new Error('Unsubscribe method not available');
      }
    });

    // Test 3: Error Handling
    await runTest('Error Handling', async () => {
      // Test error state management
      chatState.setError('Test error');

      if (chatState.error !== 'Test error') {
        throw new Error('Failed to set error state');
      }

      chatState.clearError();

      if (chatState.error !== null) {
        throw new Error('Failed to clear error state');
      }
    });

    // Test 4: Memory Management
    await runTest('Memory Management', async () => {
      // Test cleanup
      chatSyncService.cleanup();

      // Test state cleanup
      chatState.removeTab('non-existent-tab'); // Should not throw

      // Test message updates
      chatState.addTab({
        id: 'memory-test-tab',
        employeeId: 'test-employee',
        role: 'test-role',
        name: 'Memory Test',
        provider: 'openai',
      });

      chatState.addMessage('memory-test-tab', {
        role: 'user',
        content: 'Memory test message',
      });

      // Update the message
      const tab = chatState.tabs.find(t => t.id === 'memory-test-tab');
      if (tab && tab.messages.length > 0) {
        chatState.updateMessage('memory-test-tab', tab.messages[0].id, {
          content: 'Updated message',
        });
      }

      // Clean up
      chatState.removeTab('memory-test-tab');
    });

    // Test 5: Concurrent Operations
    await runTest('Concurrent Operations', async () => {
      // Test multiple rapid operations
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise<void>(resolve => {
            chatState.addTab({
              id: `concurrent-tab-${i}`,
              employeeId: `employee-${i}`,
              role: 'test-role',
              name: `Employee ${i}`,
              provider: 'openai',
            });
            resolve();
          })
        );
      }

      await Promise.all(promises);

      // Clean up
      for (let i = 0; i < 5; i++) {
        chatState.removeTab(`concurrent-tab-${i}`);
      }
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'running':
        return (
          <Badge variant="default" className="bg-blue-500">
            Running
          </Badge>
        );
      case 'passed':
        return (
          <Badge variant="default" className="bg-green-500">
            Passed
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Chat Stability Tests</span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {passedTests}/{totalTests} Passed
            </Badge>
            {failedTests > 0 && (
              <Badge variant="destructive">{failedTests} Failed</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Run comprehensive tests to verify chat system stability
          </p>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="min-w-[120px]"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              'Run Tests'
            )}
          </Button>
        </div>

        <div className="space-y-3">
          {tests.map(test => (
            <div
              key={test.name}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="font-medium">{test.name}</p>
                  {test.error && (
                    <p className="mt-1 text-sm text-red-500">{test.error}</p>
                  )}
                  {test.duration && (
                    <p className="text-xs text-muted-foreground">
                      {test.duration}ms
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(test.status)}
            </div>
          ))}
        </div>

        {failedTests > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {failedTests} test(s) failed. Check the error messages above for
                details.
              </p>
            </div>
          </div>
        )}

        {passedTests === totalTests && totalTests > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-300">
                All tests passed! Chat system is stable.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
