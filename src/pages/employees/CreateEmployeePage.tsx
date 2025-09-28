/**
 * Create Custom AI Employee Page
 * Allows users to create their own specialized AI employees
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Settings, 
  Zap,
  Shield,
  Globe,
  Code,
  Palette,
  BarChart3,
  FileText,
  Camera,
  Music,
  Gamepad2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CustomEmployee {
  id?: string;
  name: string;
  role: string;
  category: string;
  description: string;
  systemPrompt: string;
  skills: string[];
  tools: string[];
  integrations: string[];
  personality: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal';
    communication: 'concise' | 'detailed' | 'conversational' | 'technical';
    approach: 'analytical' | 'creative' | 'systematic' | 'adaptive';
  };
  capabilities: {
    maxTokens: number;
    responseTime: string;
    languages: string[];
    specializations: string[];
  };
  pricing: {
    model: 'free' | 'pay-per-use' | 'subscription';
    pricePerToken?: number;
    monthlyFee?: number;
    freeTokens?: number;
  };
  visibility: 'private' | 'team' | 'public';
  isActive: boolean;
}

const categories = [
  { id: 'development', label: 'Development', icon: Code, color: 'bg-blue-100 text-blue-800' },
  { id: 'design', label: 'Design', icon: Palette, color: 'bg-purple-100 text-purple-800' },
  { id: 'marketing', label: 'Marketing', icon: BarChart3, color: 'bg-green-100 text-green-800' },
  { id: 'writing', label: 'Writing', icon: FileText, color: 'bg-orange-100 text-orange-800' },
  { id: 'media', label: 'Media', icon: Camera, color: 'bg-pink-100 text-pink-800' },
  { id: 'entertainment', label: 'Entertainment', icon: Music, color: 'bg-yellow-100 text-yellow-800' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, color: 'bg-red-100 text-red-800' },
  { id: 'custom', label: 'Custom', icon: Bot, color: 'bg-gray-100 text-gray-800' },
];

const availableTools = [
  { id: 'web-search', name: 'Web Search', description: 'Search the internet for information' },
  { id: 'code-execution', name: 'Code Execution', description: 'Run and test code snippets' },
  { id: 'file-processing', name: 'File Processing', description: 'Read and process various file types' },
  { id: 'data-analysis', name: 'Data Analysis', description: 'Analyze and visualize data' },
  { id: 'image-generation', name: 'Image Generation', description: 'Create and edit images' },
  { id: 'api-integration', name: 'API Integration', description: 'Connect to external APIs' },
  { id: 'database-access', name: 'Database Access', description: 'Query and manage databases' },
  { id: 'email-automation', name: 'Email Automation', description: 'Send and manage emails' },
  { id: 'calendar-management', name: 'Calendar Management', description: 'Manage schedules and appointments' },
  { id: 'social-media', name: 'Social Media', description: 'Manage social media accounts' },
];

const availableIntegrations = [
  { id: 'google-workspace', name: 'Google Workspace', description: 'Gmail, Drive, Docs, Sheets' },
  { id: 'microsoft-365', name: 'Microsoft 365', description: 'Outlook, OneDrive, Word, Excel' },
  { id: 'slack', name: 'Slack', description: 'Team communication and collaboration' },
  { id: 'discord', name: 'Discord', description: 'Community and gaming communication' },
  { id: 'github', name: 'GitHub', description: 'Code repository and project management' },
  { id: 'notion', name: 'Notion', description: 'Note-taking and project management' },
  { id: 'trello', name: 'Trello', description: 'Project management and task tracking' },
  { id: 'salesforce', name: 'Salesforce', description: 'Customer relationship management' },
  { id: 'hubspot', name: 'HubSpot', description: 'Marketing and sales automation' },
  { id: 'zapier', name: 'Zapier', description: 'Workflow automation and integrations' },
];

export const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [employee, setEmployee] = useState<CustomEmployee>({
    name: '',
    role: '',
    category: '',
    description: '',
    systemPrompt: '',
    skills: [],
    tools: [],
    integrations: [],
    personality: {
      tone: 'professional',
      communication: 'detailed',
      approach: 'analytical',
    },
    capabilities: {
      maxTokens: 4000,
      responseTime: '2-4 hours',
      languages: ['English'],
      specializations: [],
    },
    pricing: {
      model: 'free',
      freeTokens: 1000,
    },
    visibility: 'private',
    isActive: true,
  });

  const [newSkill, setNewSkill] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: CustomEmployee) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { ...employeeData, id: Math.random().toString(36).substr(2, 9) };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('AI Employee created successfully!');
      navigate(`/workforce/employee/${data.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create AI Employee');
      console.error('Create employee error:', error);
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setEmployee(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setEmployee(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof CustomEmployee],
        [field]: value,
      },
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !employee.skills.includes(newSkill.trim())) {
      setEmployee(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setEmployee(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !employee.capabilities.specializations.includes(newSpecialization.trim())) {
      setEmployee(prev => ({
        ...prev,
        capabilities: {
          ...prev.capabilities,
          specializations: [...prev.capabilities.specializations, newSpecialization.trim()],
        },
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (specialization: string) => {
    setEmployee(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        specializations: prev.capabilities.specializations.filter(s => s !== specialization),
      },
    }));
  };

  const toggleTool = (toolId: string) => {
    setEmployee(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId],
    }));
  };

  const toggleIntegration = (integrationId: string) => {
    setEmployee(prev => ({
      ...prev,
      integrations: prev.integrations.includes(integrationId)
        ? prev.integrations.filter(i => i !== integrationId)
        : [...prev.integrations, integrationId],
    }));
  };

  const handleSubmit = () => {
    if (!employee.name || !employee.role || !employee.description || !employee.systemPrompt) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    createEmployeeMutation.mutate(employee);
  };

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Name, role, and description' },
    { id: 2, title: 'Personality', description: 'Tone, communication style' },
    { id: 3, title: 'Capabilities', description: 'Skills, tools, integrations' },
    { id: 4, title: 'Pricing', description: 'Pricing model and visibility' },
    { id: 5, title: 'Review', description: 'Review and create employee' },
  ];

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || Bot;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create AI Employee</h1>
          <p className="text-muted-foreground">
            Design and configure your own specialized AI employee
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate('/workforce')}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-muted mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Employee Name *</Label>
                    <Input
                      id="name"
                      value={employee.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Alex Developer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role/Title *</Label>
                    <Input
                      id="role"
                      value={employee.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      placeholder="e.g., Senior Full-Stack Developer"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant={employee.category === category.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleInputChange('category', category.id)}
                          className="justify-start"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {category.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={employee.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this AI employee does and their expertise..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="systemPrompt">System Prompt *</Label>
                  <Textarea
                    id="systemPrompt"
                    value={employee.systemPrompt}
                    onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                    placeholder="Define the AI's behavior, instructions, and personality..."
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This is the core instruction that defines how your AI employee behaves and responds.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Personality */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Personality & Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Communication Tone</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { id: 'professional', label: 'Professional' },
                      { id: 'friendly', label: 'Friendly' },
                      { id: 'casual', label: 'Casual' },
                      { id: 'formal', label: 'Formal' },
                    ].map((tone) => (
                      <Button
                        key={tone.id}
                        variant={employee.personality.tone === tone.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleNestedInputChange('personality', 'tone', tone.id)}
                      >
                        {tone.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Communication Style</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { id: 'concise', label: 'Concise' },
                      { id: 'detailed', label: 'Detailed' },
                      { id: 'conversational', label: 'Conversational' },
                      { id: 'technical', label: 'Technical' },
                    ].map((style) => (
                      <Button
                        key={style.id}
                        variant={employee.personality.communication === style.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleNestedInputChange('personality', 'communication', style.id)}
                      >
                        {style.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Approach to Tasks</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { id: 'analytical', label: 'Analytical' },
                      { id: 'creative', label: 'Creative' },
                      { id: 'systematic', label: 'Systematic' },
                      { id: 'adaptive', label: 'Adaptive' },
                    ].map((approach) => (
                      <Button
                        key={approach.id}
                        variant={employee.personality.approach === approach.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleNestedInputChange('personality', 'approach', approach.id)}
                      >
                        {approach.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Capabilities */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Specializations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Skills</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <Button onClick={addSkill} disabled={!newSkill.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {employee.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSkill(skill)}
                            className="h-4 w-4 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Specializations</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        placeholder="Add a specialization..."
                        onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                      />
                      <Button onClick={addSpecialization} disabled={!newSpecialization.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {employee.capabilities.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                          {spec}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSpecialization(spec)}
                            className="h-4 w-4 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Available Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {availableTools.map((tool) => (
                      <div
                        key={tool.id}
                        className={cn(
                          'p-3 border rounded-lg cursor-pointer transition-colors',
                          employee.tools.includes(tool.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        )}
                        onClick={() => toggleTool(tool.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={employee.tools.includes(tool.id)}
                            onChange={() => toggleTool(tool.id)}
                            className="rounded"
                          />
                          <div>
                            <div className="font-medium text-sm">{tool.name}</div>
                            <div className="text-xs text-muted-foreground">{tool.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {availableIntegrations.map((integration) => (
                      <div
                        key={integration.id}
                        className={cn(
                          'p-3 border rounded-lg cursor-pointer transition-colors',
                          employee.integrations.includes(integration.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        )}
                        onClick={() => toggleIntegration(integration.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={employee.integrations.includes(integration.id)}
                            onChange={() => toggleIntegration(integration.id)}
                            className="rounded"
                          />
                          <div>
                            <div className="font-medium text-sm">{integration.name}</div>
                            <div className="text-xs text-muted-foreground">{integration.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Pricing Model</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: 'free', label: 'Free', description: 'No cost' },
                      { id: 'pay-per-use', label: 'Pay-per-use', description: 'Pay per token' },
                      { id: 'subscription', label: 'Subscription', description: 'Monthly fee' },
                    ].map((model) => (
                      <Button
                        key={model.id}
                        variant={employee.pricing.model === model.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleNestedInputChange('pricing', 'model', model.id)}
                        className="flex flex-col h-auto p-3"
                      >
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {employee.pricing.model === 'pay-per-use' && (
                  <div>
                    <Label htmlFor="pricePerToken">Price per Token ($)</Label>
                    <Input
                      id="pricePerToken"
                      type="number"
                      step="0.001"
                      value={employee.pricing.pricePerToken || ''}
                      onChange={(e) => handleNestedInputChange('pricing', 'pricePerToken', parseFloat(e.target.value))}
                      placeholder="0.001"
                    />
                  </div>
                )}
                
                {employee.pricing.model === 'subscription' && (
                  <div>
                    <Label htmlFor="monthlyFee">Monthly Fee ($)</Label>
                    <Input
                      id="monthlyFee"
                      type="number"
                      value={employee.pricing.monthlyFee || ''}
                      onChange={(e) => handleNestedInputChange('pricing', 'monthlyFee', parseFloat(e.target.value))}
                      placeholder="29.99"
                    />
                  </div>
                )}
                
                <div>
                  <Label>Visibility</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: 'private', label: 'Private', description: 'Only you' },
                      { id: 'team', label: 'Team', description: 'Your team' },
                      { id: 'public', label: 'Public', description: 'Everyone' },
                    ].map((visibility) => (
                      <Button
                        key={visibility.id}
                        variant={employee.visibility === visibility.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleInputChange('visibility', visibility.id)}
                        className="flex flex-col h-auto p-3"
                      >
                        <div className="font-medium">{visibility.label}</div>
                        <div className="text-xs text-muted-foreground">{visibility.description}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Create</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {employee.name}</div>
                      <div><strong>Role:</strong> {employee.role}</div>
                      <div><strong>Category:</strong> {employee.category}</div>
                      <div><strong>Description:</strong> {employee.description}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Personality</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Tone:</strong> {employee.personality.tone}</div>
                      <div><strong>Communication:</strong> {employee.personality.communication}</div>
                      <div><strong>Approach:</strong> {employee.personality.approach}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Skills & Tools</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Skills:</strong> {employee.skills.join(', ') || 'None'}
                    </div>
                    <div>
                      <strong>Tools:</strong> {employee.tools.length} selected
                    </div>
                    <div>
                      <strong>Integrations:</strong> {employee.integrations.length} selected
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Pricing & Visibility</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Model:</strong> {employee.pricing.model}</div>
                    <div><strong>Visibility:</strong> {employee.visibility}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{employee.name || 'Employee Name'}</h3>
                  <p className="text-sm text-muted-foreground">{employee.role || 'Role'}</p>
                </div>
                {employee.category && (
                  <Badge className={cn('text-xs', getCategoryColor(employee.category))}>
                    {employee.category}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  {employee.description || 'Employee description will appear here...'}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {employee.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {employee.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{employee.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (currentStep < 5) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      handleSubmit();
                    }
                  }}
                  disabled={createEmployeeMutation.isPending}
                >
                  {createEmployeeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : currentStep === 5 ? (
                    <Save className="h-4 w-4 mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {currentStep === 5 ? 'Create Employee' : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
