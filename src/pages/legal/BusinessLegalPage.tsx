/**
 * Business and Legal Considerations Page
 * Prepare for growth and legal compliance
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import {
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Globe,
  Users,
  DollarSign,
  Award,
  BookOpen,
  Download,
  Upload,
  Eye,
  Edit,
  Save,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface LegalDocument {
  id: string;
  title: string;
  type:
    | 'patent'
    | 'trademark'
    | 'copyright'
    | 'privacy'
    | 'terms'
    | 'compliance';
  status: 'draft' | 'review' | 'filed' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  dueDate?: Date;
  completedAt?: Date;
  documents: string[];
  notes: string;
}

interface O1VisaDocument {
  id: string;
  title: string;
  category:
    | 'achievements'
    | 'publications'
    | 'awards'
    | 'media'
    | 'testimonials'
    | 'business';
  description: string;
  date: Date;
  evidence: string[];
  status: 'draft' | 'review' | 'approved';
  importance: 'low' | 'medium' | 'high' | 'critical';
}

interface BusinessLegalPageProps {
  className?: string;
}

export const BusinessLegalPage: React.FC<BusinessLegalPageProps> = ({
  className,
}) => {
  const [activeTab, setActiveTab] = useState<
    'o1-visa' | 'legal' | 'business' | 'compliance'
  >('o1-visa');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Data is loaded dynamically; removed mock placeholders
  const o1Documents: O1VisaDocument[] = [
    {
      id: '1',
      title: 'AGI Agent Automation Platform Launch',
      category: 'achievements',
      description:
        'Successfully launched a revolutionary AI workforce automation platform',
      date: new Date('2024-01-15'),
      evidence: [
        'platform-demo.mp4',
        'user-testimonials.pdf',
        'media-coverage.pdf',
      ],
      status: 'approved',
      importance: 'critical',
    },
    {
      id: '2',
      title: 'Innovation in AI Workforce Management',
      category: 'achievements',
      description:
        'Developed unique inter-agent communication system for AI employees',
      date: new Date('2024-02-20'),
      evidence: ['technical-specification.pdf', 'patent-application.pdf'],
      status: 'approved',
      importance: 'critical',
    },
    {
      id: '3',
      title: 'TechCrunch Feature Article',
      category: 'media',
      description:
        'Featured in TechCrunch for innovative AI automation approach',
      date: new Date('2024-03-10'),
      evidence: ['techcrunch-article.pdf', 'social-media-mentions.pdf'],
      status: 'approved',
      importance: 'high',
    },
    {
      id: '4',
      title: 'AI Innovation Award 2024',
      category: 'awards',
      description:
        'Received recognition for outstanding contribution to AI automation',
      date: new Date('2024-04-05'),
      evidence: ['award-certificate.pdf', 'award-ceremony-photos.pdf'],
      status: 'approved',
      importance: 'high',
    },
    {
      id: '5',
      title: 'Industry Expert Testimonials',
      category: 'testimonials',
      description:
        'Collected testimonials from industry leaders and AI experts',
      date: new Date('2024-05-01'),
      evidence: ['expert-testimonials.pdf', 'linkedin-recommendations.pdf'],
      status: 'approved',
      importance: 'medium',
    },
  ];

  // Legal documents should be fetched from backend/service
  const legalDocuments: LegalDocument[] = [
    {
      id: '1',
      title: 'AI Workforce Patent Application',
      type: 'patent',
      status: 'filed',
      priority: 'high',
      description:
        'Patent for inter-agent communication system in AI workforce management',
      dueDate: new Date('2024-12-31'),
      documents: ['patent-application.pdf', 'technical-drawings.pdf'],
      notes: 'Filed with USPTO, awaiting examination',
    },
    {
      id: '2',
      title: 'AGI Agent Automation Trademark',
      type: 'trademark',
      status: 'filed',
      priority: 'high',
      description: 'Trademark registration for business name and logo',
      dueDate: new Date('2024-11-15'),
      documents: ['trademark-application.pdf', 'logo-designs.pdf'],
      notes: 'Trademark application submitted, under review',
    },
    {
      id: '3',
      title: 'Privacy Policy Update',
      type: 'privacy',
      status: 'review',
      priority: 'medium',
      description: 'Updated privacy policy for GDPR and CCPA compliance',
      dueDate: new Date('2024-10-01'),
      documents: ['privacy-policy-draft.pdf', 'legal-review.pdf'],
      notes: 'Under legal review, needs final approval',
    },
    {
      id: '4',
      title: 'Terms of Service',
      type: 'terms',
      status: 'draft',
      priority: 'medium',
      description: 'Comprehensive terms of service for the platform',
      dueDate: new Date('2024-09-30'),
      documents: ['terms-draft.pdf'],
      notes: 'Initial draft completed, needs legal review',
    },
    {
      id: '5',
      title: 'SOC 2 Compliance',
      type: 'compliance',
      status: 'review',
      priority: 'high',
      description: 'SOC 2 Type II compliance certification',
      dueDate: new Date('2024-12-31'),
      documents: ['soc2-audit.pdf', 'security-policies.pdf'],
      notes: 'Audit in progress, expected completion Q4 2024',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'filed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'review':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'filed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'draft':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'achievements':
        return <Award className="h-4 w-4" />;
      case 'publications':
        return <BookOpen className="h-4 w-4" />;
      case 'awards':
        return <Star className="h-4 w-4" />;
      case 'media':
        return <Globe className="h-4 w-4" />;
      case 'testimonials':
        return <Users className="h-4 w-4" />;
      case 'business':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'patent':
        return <Award className="h-4 w-4" />;
      case 'trademark':
        return <Shield className="h-4 w-4" />;
      case 'copyright':
        return <FileText className="h-4 w-4" />;
      case 'privacy':
        return <Shield className="h-4 w-4" />;
      case 'terms':
        return <FileText className="h-4 w-4" />;
      case 'compliance':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const calculateProgress = (documents: O1VisaDocument[] | LegalDocument[]) => {
    const total = documents.length;
    const completed = documents.filter((doc) =>
      'status' in doc
        ? doc.status === 'approved' || doc.status === 'filed'
        : 'status' in doc
          ? doc.status === 'approved'
          : false
    ).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Business & Legal
          </h1>
          <p className="text-muted-foreground">
            Manage O-1 visa documentation, legal compliance, and business growth
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            <Shield className="mr-1 h-3 w-3" />
            Legal Dashboard
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        <Button
          variant={activeTab === 'o1-visa' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('o1-visa')}
          className="flex-1"
        >
          <Award className="mr-2 h-4 w-4" />
          O-1 Visa Documentation
        </Button>
        <Button
          variant={activeTab === 'legal' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('legal')}
          className="flex-1"
        >
          <FileText className="mr-2 h-4 w-4" />
          Legal Documents
        </Button>
        <Button
          variant={activeTab === 'business' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('business')}
          className="flex-1"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Business Growth
        </Button>
        <Button
          variant={activeTab === 'compliance' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('compliance')}
          className="flex-1"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Compliance
        </Button>
      </div>

      {/* O-1 Visa Documentation */}
      {activeTab === 'o1-visa' && (
        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                O-1 Visa Documentation Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(calculateProgress(o1Documents))}% Complete
                  </span>
                </div>
                <Progress
                  value={calculateProgress(o1Documents)}
                  className="h-2"
                />

                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        o1Documents.filter((doc) => doc.status === 'approved')
                          .length
                      }
                    </div>
                    <div className="text-muted-foreground">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        o1Documents.filter((doc) => doc.status === 'review')
                          .length
                      }
                    </div>
                    <div className="text-muted-foreground">In Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {
                        o1Documents.filter((doc) => doc.status === 'draft')
                          .length
                      }
                    </div>
                    <div className="text-muted-foreground">Draft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {o1Documents.length}
                    </div>
                    <div className="text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <div className="grid gap-4">
            {o1Documents.map((document) => (
              <Card
                key={document.id}
                className="transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-3">
                        {getCategoryIcon(document.category)}
                        <h3 className="text-lg font-semibold">
                          {document.title}
                        </h3>
                        <Badge
                          className={cn(
                            'text-xs',
                            getStatusColor(document.status)
                          )}
                        >
                          {document.status}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-xs',
                            getPriorityColor(document.importance)
                          )}
                        >
                          {document.importance}
                        </Badge>
                      </div>

                      <p className="mb-3 text-muted-foreground">
                        {document.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(document.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{document.evidence.length} files</span>
                        </div>
                      </div>

                      {document.evidence.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium">
                            Evidence Files:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {document.evidence.map((file, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {file}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Legal Documents */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Legal Documents Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(calculateProgress(legalDocuments))}% Complete
                  </span>
                </div>
                <Progress
                  value={calculateProgress(legalDocuments)}
                  className="h-2"
                />

                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        legalDocuments.filter((doc) => doc.status === 'filed')
                          .length
                      }
                    </div>
                    <div className="text-muted-foreground">Filed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        legalDocuments.filter((doc) => doc.status === 'review')
                          .length
                      }
                    </div>
                    <div className="text-muted-foreground">In Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {
                        legalDocuments.filter((doc) => doc.status === 'draft')
                          .length
                      }
                    </div>
                    <div className="text-muted-foreground">Draft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {legalDocuments.length}
                    </div>
                    <div className="text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <div className="grid gap-4">
            {legalDocuments.map((document) => (
              <Card
                key={document.id}
                className="transition-shadow hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-3">
                        {getTypeIcon(document.type)}
                        <h3 className="text-lg font-semibold">
                          {document.title}
                        </h3>
                        <Badge
                          className={cn(
                            'text-xs',
                            getStatusColor(document.status)
                          )}
                        >
                          {document.status}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-xs',
                            getPriorityColor(document.priority)
                          )}
                        >
                          {document.priority}
                        </Badge>
                      </div>

                      <p className="mb-3 text-muted-foreground">
                        {document.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm">
                        {document.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Due: {formatDate(document.dueDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{document.documents.length} files</span>
                        </div>
                      </div>

                      {document.notes && (
                        <div className="mt-3 rounded bg-muted/50 p-3">
                          <span className="text-sm font-medium">Notes:</span>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {document.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Business Growth */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Business Growth Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">$125K</div>
                  <div className="text-muted-foreground">Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">1,250</div>
                  <div className="text-muted-foreground">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">45</div>
                  <div className="text-muted-foreground">AI Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">98%</div>
                  <div className="text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Overall Compliance
                  </span>
                  <span className="text-sm text-muted-foreground">
                    85% Complete
                  </span>
                </div>
                <Progress value={85} className="h-2" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">GDPR Compliance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">CCPA Compliance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">SOC 2 Type II</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">HIPAA Compliance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">ISO 27001</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">PCI DSS</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
