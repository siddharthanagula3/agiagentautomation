/**
 * AI Employee Testing Page
 * Comprehensive testing interface for all AI employee implementations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  Download,
  RefreshCw,
  Settings,
  Brain,
  Zap,
  Shield,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { aiEmployeeTestingService, TestSuite, TestResult } from '@/services/ai-employee-testing-service';
import { getProviderCapabilities, getAvailableRoles } from '@/prompts/provider-optimized-prompts';
import { getToolsForProvider } from '@/services/provider-tools-integration';

const AIEmployeeTestingPage: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [testReport, setTestReport] = useState('');

  const providers = [
    { name: 'OpenAI', key: 'openai', color: 'bg-green-500', icon: Brain },
    { name: 'Anthropic', key: 'anthropic', color: 'bg-orange-500', icon: Shield },
    { name: 'Google', key: 'google', color: 'bg-blue-500', icon: Zap },
    { name: 'Perplexity', key: 'perplexity', color: 'bg-purple-500', icon: Search }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestSuites([]);
    
    try {
      const suites = await aiEmployeeTestingService.runAllTests();
      setTestSuites(suites);
      
      // Generate test report
      const report = aiEmployeeTestingService.generateTestReport(suites);
      setTestReport(report);
      
      toast.success('All tests completed successfully!');
    } catch (error) {
      console.error('Testing error:', error);
      toast.error('Testing failed. Check console for details.');
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const getOverallStats = () => {
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failedTests = testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = testSuites.reduce((sum, suite) => sum + suite.duration, 0);
    
    return {
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
    };
  };

  const downloadReport = () => {
    const blob = new Blob([testReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-employee-test-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Test report downloaded!');
  };

  const renderTestResult = (test: TestResult) => (
    <motion.div
      key={`${test.provider}-${test.test}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 rounded-lg border"
    >
      <div className="flex items-center gap-3">
        {test.success ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <div>
          <div className="font-medium">{test.test}</div>
          <div className="text-sm text-muted-foreground">
            {test.provider} • {test.role} • {test.duration}ms
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {test.error && (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
        <Badge variant={test.success ? "default" : "destructive"}>
          {test.success ? 'Passed' : 'Failed'}
        </Badge>
      </div>
    </motion.div>
  );

  const renderProviderCard = (provider: typeof providers[0]) => {
    const suite = testSuites.find(s => s.name.includes(provider.name));
    const capabilities = getProviderCapabilities(provider.key as any);
    const tools = getToolsForProvider(provider.key as any);
    
    return (
      <Card key={provider.key} className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", provider.color)}>
              <provider.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <div className="flex items-center gap-2">
                {suite ? (
                  <Badge variant={suite.passedTests === suite.totalTests ? "default" : "secondary"}>
                    {suite.passedTests}/{suite.totalTests} tests passed
                  </Badge>
                ) : (
                  <Badge variant="outline">Not tested</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {suite && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
                <span>{((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(suite.passedTests / suite.totalTests) * 100} 
                className="h-2"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Capabilities</div>
            <div className="flex flex-wrap gap-1">
              {capabilities.map(capability => (
                <Badge key={capability} variant="outline" className="text-xs">
                  {capability}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Tools</div>
            <div className="text-sm text-muted-foreground">
              {tools.length} tools configured
            </div>
          </div>
          
          {suite && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Test Results</div>
              <div className="space-y-1">
                {suite.tests.map(test => (
                  <div key={test.test} className="flex items-center justify-between text-sm">
                    <span>{test.test}</span>
                    <div className="flex items-center gap-2">
                      {test.success ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {test.duration}ms
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const stats = getOverallStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <TestTube className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Employee Testing</h1>
          <p className="text-muted-foreground">
            Comprehensive testing for all AI employee implementations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
        
        {testReport && (
          <Button
            onClick={downloadReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
          </Button>
        )}
      </div>

      {isRunning && (
        <Alert>
          <Clock className="w-4 h-4" />
          <AlertDescription>
            Running comprehensive tests for all AI providers. This may take a few minutes...
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="details">Test Details</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTests}</div>
                <p className="text-xs text-muted-foreground">
                  across all providers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Passed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.passedTests}</div>
                <p className="text-xs text-muted-foreground">
                  successful tests
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failedTests}</div>
                <p className="text-xs text-muted-foreground">
                  failed tests
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  overall success
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map(renderProviderCard)}
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {providers.map(renderProviderCard)}
          </div>
        </TabsContent>

        {/* Test Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {testSuites.map(suite => (
                <Card key={suite.name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{suite.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{suite.passedTests}/{suite.totalTests} passed</span>
                      <span>{suite.duration}ms</span>
                      <span>{((suite.passedTests / suite.totalTests) * 100).toFixed(1)}% success</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {suite.tests.map(renderTestResult)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Report</CardTitle>
            </CardHeader>
            <CardContent>
              {testReport ? (
                <ScrollArea className="h-[600px]">
                  <pre className="whitespace-pre-wrap text-sm">{testReport}</pre>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <TestTube className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No test report available</h3>
                  <p className="text-muted-foreground">
                    Run tests to generate a comprehensive report.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIEmployeeTestingPage;
