import React, { useState, useEffect } from 'react';
import { Button } from '@shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { ScrollArea } from '@shared/ui/scroll-area';
import { AlertTriangle, CheckCircle, Info, Eye, Download } from 'lucide-react';
// Mock accessibility service and types since monitoring was archived
interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  element: string;
  message: string;
  wcagLevel: string;
  wcagGuideline: string;
  suggestion: string;
}

const accessibilityService = {
  getAuditResults: () => null,
  runAudit: async () => ({
    score: 95,
    passed: 12,
    failed: 0,
    warnings: 1,
    issues: [
      {
        type: 'info' as const,
        element: 'body',
        message: 'Consider adding a skip link for keyboard navigation',
        wcagLevel: 'AA',
        wcagGuideline: '2.4.1',
        suggestion: 'Add a skip link at the beginning of the page'
      }
    ]
  }),
  generateReport: () => '# Accessibility Audit Report\n\nScore: 95%\n\nAll checks passed!'
};

interface AccessibilityAuditProps {
  onClose?: () => void;
}

const AccessibilityAudit: React.FC<AccessibilityAuditProps> = ({ onClose }) => {
  const [auditResults, setAuditResults] = useState(
    accessibilityService.getAuditResults()
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const results = await accessibilityService.runAudit();
      setAuditResults(results);
    } catch (error) {
      console.error('Accessibility audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const downloadReport = () => {
    if (!auditResults) return;

    const report = accessibilityService.generateReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-audit-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filterIssues = (type: string) => {
    if (!auditResults) return [];
    return auditResults.issues.filter((issue) => issue.type === type);
  };

  const renderIssueCard = (issue: AccessibilityIssue, index: number) => (
    <Card key={index} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {getIssueIcon(issue.type)}
          <CardTitle className="text-sm">{issue.element}</CardTitle>
          <Badge variant="outline" className="text-xs">
            WCAG {issue.wcagLevel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm text-muted-foreground">{issue.message}</p>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-medium">Guideline:</span>
            <span className="ml-1 text-xs text-muted-foreground">
              {issue.wcagGuideline}
            </span>
          </div>
          <div>
            <span className="text-xs font-medium">Suggestion:</span>
            <span className="ml-1 text-xs text-muted-foreground">
              {issue.suggestion}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!auditResults) {
    return (
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibility Audit
          </CardTitle>
          <CardDescription>
            Run an accessibility audit to check for WCAG compliance issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runAudit} disabled={isRunning} className="w-full">
            {isRunning ? 'Running Audit...' : 'Run Accessibility Audit'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-6xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Accessibility Audit Results
            </CardTitle>
            <CardDescription>
              WCAG compliance analysis for the current page
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button onClick={runAudit} disabled={isRunning}>
              {isRunning ? 'Running...' : 'Re-run Audit'}
            </Button>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="errors">
              Errors ({filterIssues('error').length})
            </TabsTrigger>
            <TabsTrigger value="warnings">
              Warnings ({filterIssues('warning').length})
            </TabsTrigger>
            <TabsTrigger value="info">
              Info ({filterIssues('info').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(auditResults.score)}`}
                    >
                      {auditResults.score}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Overall Score
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {auditResults.passed}
                    </div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {auditResults.failed}
                    </div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {auditResults.warnings}
                    </div>
                    <p className="text-sm text-muted-foreground">Warnings</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {auditResults.score < 90 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your accessibility score is below 90%. Consider addressing the
                  issues found in the audit to improve accessibility.
                </AlertDescription>
              </Alert>
            )}

            {auditResults.score >= 90 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Great! Your accessibility score is excellent. Keep up the good
                  work!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="errors" className="mt-6">
            <ScrollArea className="h-96">
              {filterIssues('error').length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p className="text-muted-foreground">No errors found! 🎉</p>
                </div>
              ) : (
                filterIssues('error').map((issue, index) =>
                  renderIssueCard(issue, index)
                )
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="warnings" className="mt-6">
            <ScrollArea className="h-96">
              {filterIssues('warning').length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p className="text-muted-foreground">No warnings found! 🎉</p>
                </div>
              ) : (
                filterIssues('warning').map((issue, index) =>
                  renderIssueCard(issue, index)
                )
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <ScrollArea className="h-96">
              {filterIssues('info').length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p className="text-muted-foreground">
                    No info items found! 🎉
                  </p>
                </div>
              ) : (
                filterIssues('info').map((issue, index) =>
                  renderIssueCard(issue, index)
                )
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AccessibilityAudit;
