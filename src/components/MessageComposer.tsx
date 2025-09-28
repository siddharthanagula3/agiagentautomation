import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  Code,
  Calculator,
  Globe,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  File,
  Video,
  Music,
  Archive,
  AlertCircle,
  Loader2,
  Square,
  Play,
  Pause,
  Wand2,
  Brain,
  Database,
  Camera,
  Smile,
  Hash,
  AtSign,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
  Bot,
  MessageSquare,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface MessageOptions {
  temperature: number;
  priority: 'simple' | 'medium' | 'complex';
  tools: string[];
  model: string;
  attachments: File[];
  maxTokens?: number;
  stream?: boolean;
  employee?: string; // Specific AI employee to target
  urgent?: boolean;
}

export interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  enabled: boolean;
  category: 'search' | 'compute' | 'create' | 'analyze' | 'communication';
  requiresAuth?: boolean;
  premium?: boolean;
  cost?: number;
}

export interface VoiceRecording {
  blob?: Blob;
  duration: number;
  waveformData: number[];
  isRecording: boolean;
  isPaused?: boolean;
  transcription?: string;
}

export interface AttachmentPreview {
  file: File;
  preview?: string;
  error?: string;
  status: 'uploading' | 'completed' | 'error' | 'processing';
  progress?: number;
  id: string;
}

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'busy' | 'offline';
  specialties: string[];
}

export interface MessageComposerProps {
  onSendMessage: (message: string, options: MessageOptions) => void;
  disabled?: boolean;
  placeholder?: string;
  maxTokens?: number;
  models?: Array<{
    id: string;
    name: string;
    description: string;
    tokensPerMessage: number;
    cost: number;
    premium?: boolean;
    provider: string;
  }>;
  employees?: AIEmployee[];
  suggestions?: string[];
  onFileUpload?: (files: File[]) => Promise<void>;
  onVoiceRecording?: (recording: VoiceRecording) => Promise<string>;
  className?: string;
  'data-testid'?: string;
  isTyping?: boolean;
  lastActivity?: Date;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Message your AI workforce...',
  maxTokens = 4000,
  models = [
    { id: 'gpt-4', name: 'GPT-4 Turbo', description: 'Most capable', tokensPerMessage: 100, cost: 0.00003, premium: true, provider: 'OpenAI' },
    { id: 'claude-3', name: 'Claude 3 Opus', description: 'Great reasoning', tokensPerMessage: 120, cost: 0.000025, premium: true, provider: 'Anthropic' },
    { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', description: 'Fast & efficient', tokensPerMessage: 50, cost: 0.000002, provider: 'OpenAI' }
  ],
  employees = [],
  suggestions = [
    'Analyze the latest sales data and create a report',
    'Create a React component for user authentication',
    'Write a marketing email for our new product launch',
    'Generate a financial forecast for Q4',
    'Debug the authentication issue in our app'
  ],
  onFileUpload,
  onVoiceRecording,
  className,
  'data-testid': dataTestId = 'message-composer',
  isTyping = false,
  lastActivity
}) => {
  // State management
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording>({
    duration: 0,
    waveformData: [],
    isRecording: false,
    isPaused: false
  });
  const [temperature, setTemperature] = useState([0.7]);
  const [priority, setPriority] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [streamResponse, setStreamResponse] = useState(true);
  const [urgentMode, setUrgentMode] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dragCounterRef = useRef(0);
  const composerRef = useRef<HTMLDivElement>(null);

  // Enhanced tool configuration with AI Agent platform tools
  const [tools, setTools] = useState<Tool[]>([
    {
      id: 'web-search',
      name: 'Web Search',
      icon: Globe,
      description: 'Search the internet for current information',
      enabled: true,
      category: 'search',
      cost: 0.001
    },
    {
      id: 'code-generation',
      name: 'Code Generation',
      icon: Code,
      description: 'Generate and analyze code',
      enabled: true,
      category: 'create',
      premium: true,
      cost: 0.005
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis',
      icon: Database,
      description: 'Analyze datasets and generate insights',
      enabled: false,
      category: 'analyze',
      premium: true,
      cost: 0.01
    },
    {
      id: 'ai-workforce',
      name: 'AI Workforce',
      icon: Bot,
      description: 'Delegate tasks to AI employees',
      enabled: true,
      category: 'communication',
      premium: true,
      cost: 0.02
    },
    {
      id: 'workflow-automation',
      name: 'Workflow Automation',
      icon: Zap,
      description: 'Create automated workflows',
      enabled: false,
      category: 'create',
      premium: true,
      cost: 0.015
    },
    {
      id: 'image-generation',
      name: 'Image Generation',
      icon: ImageIcon,
      description: 'Generate images and visual content',
      enabled: false,
      category: 'create',
      premium: true,
      cost: 0.008
    }
  ]);

  // Token count estimation
  const estimatedTokens = useMemo(() => {
    const baseTokens = Math.ceil(message.length / 4);
    const modelTokens = models.find(m => m.id === selectedModel)?.tokensPerMessage || 0;
    const toolTokens = tools.filter(t => t.enabled).length * 20;
    const attachmentTokens = attachments.length * 50;
    return baseTokens + modelTokens + toolTokens + attachmentTokens;
  }, [message, selectedModel, tools, attachments, models]);

  const estimatedCost = useMemo(() => {
    const model = models.find(m => m.id === selectedModel);
    const modelCost = model ? estimatedTokens * model.cost : 0;
    const toolCost = tools.filter(t => t.enabled).reduce((sum, tool) => sum + (tool.cost || 0), 0);
    return modelCost + toolCost;
  }, [estimatedTokens, selectedModel, tools, models]);

  // Hotkeys
  useHotkeys('meta+enter,ctrl+enter', (e) => {
    e.preventDefault();
    handleSendMessage();
  }, { enableOnFormTags: ['textarea'] });

  useHotkeys('meta+k,ctrl+k', (e) => {
    e.preventDefault();
    setShowEmployeeSelector(true);
  }, { enableOnFormTags: ['textarea'] });

  useHotkeys('escape', () => {
    setShowSuggestions(false);
    setShowEmployeeSelector(false);
    setShowAdvancedSettings(false);
  });

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && voiceRecording.isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
    };
  }, [voiceRecording.isRecording]);

  const handleFiles = useCallback(async (files: File[]) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'image/*',
      'text/*',
      'application/pdf',
      'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/*',
      'audio/*'
    ];

    for (const file of files) {
      // Validate file
      if (file.size > maxSize) {
        setErrors(prev => [...prev, `File ${file.name} is too large (max: 50MB)`]);
        continue;
      }

      const isAllowedType = allowedTypes.some(type => {
        if (type.endsWith('*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!isAllowedType) {
        setErrors(prev => [...prev, `File type ${file.type} not supported`]);
        continue;
      }

      const attachmentPreview: AttachmentPreview = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'uploading',
        progress: 0
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments(prev => prev.map(a =>
            a.id === attachmentPreview.id ? { ...a, preview: e.target?.result as string } : a
          ));
        };
        reader.readAsDataURL(file);
      }

      setAttachments(prev => [...prev, attachmentPreview]);

      // Handle upload
      if (onFileUpload) {
        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            setAttachments(prev => prev.map(a => {
              if (a.id === attachmentPreview.id && a.progress !== undefined && a.progress < 90) {
                return { ...a, progress: a.progress + 10 };
              }
              return a;
            }));
          }, 200);

          await onFileUpload([file]);
          
          clearInterval(progressInterval);
          setAttachments(prev => prev.map(a =>
            a.id === attachmentPreview.id ? { ...a, status: 'completed', progress: 100 } : a
          ));
        } catch (error) {
          setAttachments(prev => prev.map(a =>
            a.id === attachmentPreview.id ? { ...a, status: 'error', error: 'Upload failed' } : a
          ));
        }
      } else {
        // Simulate upload completion
        setTimeout(() => {
          setAttachments(prev => prev.map(a =>
            a.id === attachmentPreview.id ? { ...a, status: 'completed', progress: 100 } : a
          ));
        }, 1500);
      }
    }
  }, [onFileUpload]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // Enhanced drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  }, [handleFiles]);

  // Enhanced voice recording
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        setVoiceRecording(prev => ({
          ...prev,
          blob: audioBlob,
          isRecording: false
        }));

        // Attempt transcription
        if (onVoiceRecording) {
          try {
            const transcription = await onVoiceRecording({ ...voiceRecording, blob: audioBlob });
            setVoiceRecording(prev => ({ ...prev, transcription }));
            setMessage(prev => prev + (prev ? ' ' : '') + transcription);
          } catch (error) {
            console.error('Transcription failed:', error);
          }
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setVoiceRecording(prev => ({ ...prev, isRecording: true, duration: 0, waveformData: [] }));

      // Enhanced waveform visualization
      waveformIntervalRef.current = setInterval(() => {
        setVoiceRecording(prev => {
          const newData = [...prev.waveformData, Math.random() * 100].slice(-50);
          return {
            ...prev,
            duration: prev.duration + 0.1,
            waveformData: newData
          };
        });
      }, 100);

    } catch (error) {
      setErrors(prev => [...prev, 'Could not access microphone. Please check permissions.']);
    }
  }, [onVoiceRecording, voiceRecording]);

  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && voiceRecording.isRecording) {
      mediaRecorderRef.current.stop();
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
        waveformIntervalRef.current = null;
      }
    }
  }, [voiceRecording.isRecording]);

  const toggleVoiceRecording = useCallback(() => {
    if (voiceRecording.isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  }, [voiceRecording.isRecording, startVoiceRecording, stopVoiceRecording]);

  const clearVoiceRecording = useCallback(() => {
    setVoiceRecording({
      duration: 0,
      waveformData: [],
      isRecording: false,
      isPaused: false
    });
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, [handleFiles]);

  const toggleTool = useCallback((toolId: string) => {
    setTools(prev => prev.map(tool =>
      tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
    ));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() && attachments.length === 0 && !voiceRecording.blob) {
      return;
    }

    if (disabled || isProcessing) {
      return;
    }

    setIsProcessing(true);

    const options: MessageOptions = {
      temperature: temperature[0],
      priority,
      tools: tools.filter(t => t.enabled).map(t => t.id),
      model: selectedModel,
      attachments: attachments.filter(a => a.status === 'completed').map(a => a.file),
      maxTokens,
      stream: streamResponse,
      employee: selectedEmployee,
      urgent: urgentMode
    };

    try {
      await onSendMessage(message, options);
      
      // Reset form
      setMessage('');
      setAttachments([]);
      clearVoiceRecording();
      setErrors([]);
      setShowSuggestions(false);
      
      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        setIsProcessing(false);
      }, 100);
    } catch (error) {
      setErrors(prev => [...prev, 'Failed to send message. Please try again.']);
      setIsProcessing(false);
    }
  }, [
    message, 
    attachments, 
    voiceRecording.blob, 
    disabled, 
    isProcessing, 
    temperature, 
    priority, 
    tools, 
    selectedModel, 
    maxTokens, 
    streamResponse, 
    selectedEmployee, 
    urgentMode, 
    onSendMessage, 
    clearVoiceRecording
  ]);

  const applySuggestion = useCallback((suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.startsWith('audio/')) return Music;
    if (file.type.includes('archive') || file.type.includes('zip')) return Archive;
    if (file.type.includes('pdf')) return File;
    if (file.type.includes('word')) return File;
    if (file.type.includes('excel') || file.type.includes('sheet')) return Calculator;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentModel = models.find(m => m.id === selectedModel);
  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);

  return (
    <div
      ref={composerRef}
      className={cn(
        'relative bg-gradient-to-br from-slate-800/50 to-slate-900/50',
        'backdrop-blur-xl border border-slate-700/50 rounded-2xl',
        'shadow-2xl shadow-slate-900/20 transition-all duration-300',
        isDragOver && 'border-blue-500/50 bg-blue-500/5 shadow-blue-500/10',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid={dataTestId}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-blue-500/50"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                <Paperclip className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-lg font-medium text-blue-400">Drop files to attach</p>
              <p className="text-sm text-slate-400">Images, documents, videos, and more</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 space-y-4">
        {/* Error Messages */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive" className="bg-red-500/10 border-red-500/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">
                    {error}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setErrors(prev => prev.filter((_, i) => i !== index))}
                      className="ml-2 h-auto p-0 text-red-400 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Employee Selector */}
        <AnimatePresence>
          {selectedEmployee && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-400">
                  Messaging {selectedEmployeeData?.name || 'AI Employee'}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedEmployeeData?.role} • {selectedEmployeeData?.status}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEmployee('')}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Recording Display */}
        <AnimatePresence>
          {(voiceRecording.isRecording || voiceRecording.blob) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-slate-700/30 border border-slate-600/30 rounded-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    voiceRecording.isRecording ? "bg-red-500 animate-pulse" : "bg-slate-500"
                  )} />
                  <span className="text-sm font-medium text-white">
                    {voiceRecording.isRecording ? 'Recording...' : 'Voice Recording'}
                  </span>
                  <span className="text-sm text-slate-400">
                    {formatDuration(voiceRecording.duration)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {voiceRecording.blob && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Play audio logic
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearVoiceRecording}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Waveform Visualization */}
              <div className="h-12 bg-slate-800/50 rounded-lg p-2 flex items-end justify-center space-x-1">
                {voiceRecording.waveformData.map((height, index) => (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-full transition-all duration-100"
                    style={{
                      width: '2px',
                      height: `${Math.max(height / 5, 4)}px`
                    }}
                  />
                ))}
              </div>

              {/* Transcription */}
              {voiceRecording.transcription && (
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-300">{voiceRecording.transcription}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.file);
                return (
                  <motion.div
                    key={attachment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center space-x-3 p-3 bg-slate-700/30 border border-slate-600/30 rounded-xl"
                  >
                    {attachment.preview ? (
                      <img
                        src={attachment.preview}
                        alt={attachment.file.name}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                        <FileIcon className="h-5 w-5 text-slate-300" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {attachment.file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(attachment.file.size)}
                      </p>
                      
                      {attachment.status === 'uploading' && (
                        <Progress 
                          value={attachment.progress} 
                          className="mt-1 h-1"
                        />
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {attachment.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {attachment.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {attachment.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Area */}
        <div className="relative">
          {/* Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && !message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">Suggestions</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSuggestions(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {suggestions.slice(0, 5).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full text-left p-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative bg-slate-700/30 border border-slate-600/30 rounded-xl overflow-hidden">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => !message && setShowSuggestions(true)}
              placeholder={placeholder}
              disabled={disabled || isProcessing}
              className={cn(
                "min-h-[80px] w-full resize-none border-0 bg-transparent px-4 py-3",
                "text-white placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                "scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600"
              )}
              style={{ maxHeight: '200px' }}
              aria-label="Message input"
              data-testid="message-input"
            />

            {/* Character/Token Counter */}
            <div className="absolute top-2 right-2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs bg-slate-800/50 text-slate-400",
                  estimatedTokens > maxTokens && "bg-red-500/20 text-red-400"
                )}
              >
                {estimatedTokens}/{maxTokens}
              </Badge>
            </div>
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-2">
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,text/*,.pdf,.doc,.docx,.json,.xlsx,.xls,video/*,audio/*"
              aria-label="File upload input"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  disabled={disabled}
                  aria-label="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files (⌘+U)</TooltipContent>
            </Tooltip>

            {/* Voice Recording */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoiceRecording}
                  className={cn(
                    'text-slate-400 hover:text-white hover:bg-slate-700/50',
                    voiceRecording.isRecording && 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                  )}
                  disabled={disabled}
                  aria-label={voiceRecording.isRecording ? 'Stop recording' : 'Start voice recording'}
                >
                  {voiceRecording.isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {voiceRecording.isRecording ? 'Stop recording' : 'Voice recording (⌘+Shift+V)'}
              </TooltipContent>
            </Tooltip>

            {/* Employee Selector */}
            <Popover open={showEmployeeSelector} onOpenChange={setShowEmployeeSelector}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  disabled={disabled}
                  aria-label="Select AI employee"
                >
                  <Bot className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-slate-800 border-slate-700" align="start">
                <div className="p-4">
                  <h4 className="font-medium text-white mb-3">Select AI Employee</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedEmployee('');
                        setShowEmployeeSelector(false);
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        "hover:bg-slate-700/50",
                        !selectedEmployee && "bg-blue-500/20 border border-blue-500/30"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">AI Workforce</p>
                          <p className="text-xs text-slate-400">Let AI choose the best employee</p>
                        </div>
                      </div>
                    </button>
                    
                    {employees.map((employee) => (
                      <button
                        key={employee.id}
                        onClick={() => {
                          setSelectedEmployee(employee.id);
                          setShowEmployeeSelector(false);
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors",
                          "hover:bg-slate-700/50",
                          selectedEmployee === employee.id && "bg-blue-500/20 border border-blue-500/30"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-white">{employee.name}</p>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                employee.status === 'online' && "bg-green-500",
                                employee.status === 'busy' && "bg-yellow-500",
                                employee.status === 'offline' && "bg-slate-500"
                              )} />
                            </div>
                            <p className="text-xs text-slate-400">{employee.role}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {employee.specialties.slice(0, 2).map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Tools */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  disabled={disabled}
                  aria-label="Configure tools"
                >
                  <Zap className="h-4 w-4" />
                  {tools.filter(t => t.enabled).length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-blue-500">
                      {tools.filter(t => t.enabled).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-slate-800 border-slate-700" align="start">
                <div className="p-4">
                  <h4 className="font-medium text-white mb-3">Available Tools</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {tools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/30"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            tool.enabled ? "bg-blue-500/20 text-blue-400" : "bg-slate-700 text-slate-400"
                          )}>
                            <tool.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-white">{tool.name}</p>
                              {tool.premium && (
                                <Badge variant="secondary" className="text-xs">Pro</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{tool.description}</p>
                            {tool.cost && (
                              <p className="text-xs text-slate-500">${tool.cost}/use</p>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={() => toggleTool(tool.id)}
                          disabled={tool.requiresAuth || (tool.premium && false)} // Add premium check
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Center Info */}
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            {/* Model Info */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40 h-8 bg-slate-700/30 border-slate-600/30 text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="text-slate-300">
                    <div className="flex items-center justify-between w-full">
                      <span>{model.name}</span>
                      {model.premium && (
                        <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cost Estimate */}
            {estimatedCost > 0 && (
              <span className="text-slate-500">
                ~${estimatedCost.toFixed(4)}
              </span>
            )}

            {/* Advanced Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-slate-400 hover:text-white p-1"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Urgent Mode */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUrgentMode(!urgentMode)}
                  className={cn(
                    'text-slate-400 hover:text-white hover:bg-slate-700/50',
                    urgentMode && 'text-orange-500 bg-orange-500/10'
                  )}
                  disabled={disabled}
                  aria-label="Urgent mode"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {urgentMode ? 'Urgent mode enabled' : 'Enable urgent mode'}
              </TooltipContent>
            </Tooltip>

            {/* Send Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    disabled || 
                    isProcessing || 
                    (!message.trim() && attachments.length === 0 && !voiceRecording.blob) ||
                    estimatedTokens > maxTokens
                  }
                  className={cn(
                    "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                    "text-white border-0 shadow-lg shadow-blue-500/25",
                    "transition-all duration-200 hover:scale-105",
                    isProcessing && "cursor-not-allowed opacity-50"
                  )}
                  aria-label="Send message"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message (⌘+Enter)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Advanced Settings */}
        <AnimatePresence>
          {showAdvancedSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-slate-700/20 border border-slate-600/20 rounded-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">Advanced Settings</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Temperature */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">
                    Creativity: {temperature[0].toFixed(1)}
                  </Label>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Task Priority</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger className="bg-slate-700/30 border-slate-600/30 text-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="simple" className="text-slate-300">Simple</SelectItem>
                      <SelectItem value="medium" className="text-slate-300">Medium</SelectItem>
                      <SelectItem value="complex" className="text-slate-300">Complex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stream Response */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-slate-300">Stream Response</Label>
                  <Switch
                    checked={streamResponse}
                    onCheckedChange={setStreamResponse}
                  />
                </div>

                {/* Model Details */}
                {currentModel && (
                  <div className="space-y-1">
                    <Label className="text-sm text-slate-300">Model Details</Label>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Provider: {currentModel.provider}</p>
                      <p>Cost: ${currentModel.cost}/token</p>
                      <p>Context: {currentModel.tokensPerMessage} tokens</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Status */}
        {(isTyping || lastActivity) && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            {isTyping && (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>AI is typing...</span>
              </div>
            )}
            {lastActivity && !isTyping && (
              <span>Last seen {lastActivity.toLocaleTimeString()}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComposer;