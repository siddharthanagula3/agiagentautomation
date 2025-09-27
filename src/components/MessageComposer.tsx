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
  X,
  File,
  Video,
  Music,
  Archive,
  AlertCircle,
  Loader2,
  Square,
  Play,
  Pause
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
import { designTokens, animationPresets } from '@/lib/design-tokens';

export interface MessageOptions {
  temperature: number;
  priority: 'simple' | 'medium' | 'complex';
  tools: string[];
  model: string;
  attachments: File[];
  maxTokens?: number;
  stream?: boolean;
}

export interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  enabled: boolean;
  category: 'search' | 'compute' | 'create' | 'analyze';
  requiresAuth?: boolean;
  premium?: boolean;
}

export interface VoiceRecording {
  blob?: Blob;
  duration: number;
  waveformData: number[];
  isRecording: boolean;
}

export interface AttachmentPreview {
  file: File;
  preview?: string;
  error?: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
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
  }>;
  suggestions?: string[];
  onFileUpload?: (files: File[]) => Promise<void>;
  onVoiceRecording?: (recording: VoiceRecording) => Promise<string>;
  className?: string;
  'data-testid'?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Message AGI Agent Automation...',
  maxTokens = 4000,
  models = [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable', tokensPerMessage: 100, cost: 0.00003, premium: true },
    { id: 'claude-3', name: 'Claude-3', description: 'Great reasoning', tokensPerMessage: 120, cost: 0.000025, premium: true },
    { id: 'gpt-3.5', name: 'GPT-3.5', description: 'Fast & efficient', tokensPerMessage: 50, cost: 0.000002 }
  ],
  suggestions = [],
  onFileUpload,
  onVoiceRecording,
  className,
  'data-testid': dataTestId = 'message-composer'
}) => {
  // State management
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [voiceRecording, setVoiceRecording] = useState<VoiceRecording>({
    duration: 0,
    waveformData: [],
    isRecording: false
  });
  const [temperature, setTemperature] = useState([0.7]);
  const [priority, setPriority] = useState<'simple' | 'medium' | 'complex'>('medium');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [streamResponse, setStreamResponse] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dragCounterRef = useRef(0);

  // Tool configuration
  const [tools, setTools] = useState<Tool[]>([
    {
      id: 'web',
      name: 'Web Search',
      icon: Globe,
      description: 'Search the internet for current information',
      enabled: true,
      category: 'search'
    },
    {
      id: 'calculator',
      name: 'Calculator',
      icon: Calculator,
      description: 'Perform mathematical calculations',
      enabled: false,
      category: 'compute'
    },
    {
      id: 'code',
      name: 'Code Executor',
      icon: Code,
      description: 'Execute code snippets safely',
      enabled: false,
      category: 'compute',
      premium: true
    },
    {
      id: 'image',
      name: 'Image Generator',
      icon: ImageIcon,
      description: 'Generate images from descriptions',
      enabled: false,
      category: 'create',
      premium: true
    }
  ]);

  // Keyboard shortcuts
  useHotkeys('cmd+enter', (e) => {
    e.preventDefault();
    handleSend();
  }, { enableOnFormTags: ['TEXTAREA'] });

  useHotkeys('shift+enter', (e) => {
    // Allow default behavior (new line)
  }, { enableOnFormTags: ['TEXTAREA'] });

  useHotkeys('cmd+k', (e) => {
    e.preventDefault();
    textareaRef.current?.focus();
  });

  useHotkeys('escape', (e) => {
    if (voiceRecording.isRecording) {
      stopVoiceRecording();
    } else if (message) {
      setMessage('');
    }
  }, { enableOnFormTags: ['TEXTAREA'] });

  // Memoized calculations
  const estimatedTokens = useMemo(() => {
    const baseTokens = Math.ceil(message.length / 4);
    const attachmentTokens = attachments.length * 100; // Rough estimate
    const toolTokens = tools.filter(t => t.enabled).length * 10;
    return baseTokens + attachmentTokens + toolTokens;
  }, [message, attachments, tools]);

  const estimatedCost = useMemo(() => {
    const model = models.find(m => m.id === selectedModel);
    if (!model) return 0;
    return estimatedTokens * model.cost;
  }, [estimatedTokens, selectedModel, models]);

  const currentModel = useMemo(() =>
    models.find(m => m.id === selectedModel),
    [models, selectedModel]
  );

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Clean up voice recording on unmount
  useEffect(() => {
    return (
    <div>Component content</div>
  );
};

const handleFiles = useCallback(async (files: File[]) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/*',
      'text/*',
      'application/pdf',
      'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    for (const file of files) {
      // Validate file
      if (file.size > maxSize) {
        setErrors(prev => [...prev, `File ${file.name} is too large (max: 10MB)`]);
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
        file,
        status: 'uploading',
        progress: 0
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments(prev => prev.map(a =>
            a.file === file ? { ...a, preview: e.target?.result as string } : a
          ));
        };
        reader.readAsDataURL(file);
      }

      setAttachments(prev => [...prev, attachmentPreview]);

      // Simulate upload progress (replace with actual upload logic)
      if (onFileUpload) {
        try {
          await onFileUpload([file]);
          setAttachments(prev => prev.map(a =>
            a.file === file ? { ...a, status: 'completed', progress: 100 } : a
          ));
        } catch (error) {
          setAttachments(prev => prev.map(a =>
            a.file === file ? { ...a, status: 'error', error: 'Upload failed' } : a
          ));
        }
      } else {
        // Simulate upload completion
        setTimeout(() => {
          setAttachments(prev => prev.map(a =>
            a.file === file ? { ...a, status: 'completed', progress: 100 } : a
          ));
        }, 1000);
      }
    }
  }, [onFileUpload]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Drag and drop handling
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

  // Voice recording
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setVoiceRecording(prev => ({
          ...prev,
          blob: audioBlob,
          isRecording: false
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setVoiceRecording(prev => ({ ...prev, isRecording: true, duration: 0 }));

      // Simulate waveform data and update duration
      waveformIntervalRef.current = setInterval(() => {
        setVoiceRecording(prev => ({
          ...prev,
          duration: prev.duration + 0.1,
          waveformData: [...prev.waveformData.slice(-50), Math.random() * 100]
        }));
      }, 100);

    } catch (error) {
      setErrors(prev => [...prev, 'Could not access microphone']);
    }
  }, []);

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

  // Tool management
  const toggleTool = useCallback((toolId: string) => {
    setTools(prev => prev.map(tool =>
      tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
    ));
  }, []);

  // File type icon helper
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('video/')) return Video;
    if (file.type.startsWith('audio/')) return Music;
    if (file.type.includes('archive') || file.type.includes('zip')) return Archive;
    return File;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div
      className={cn(
        'border-t border-border bg-background transition-all duration-300',
        isDragOver && 'bg-primary/5 border-primary/50',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid={dataTestId}
    >
      <div className="mx-auto max-w-4xl p-4">
        {/* Error display */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Alert className="border-error/50 bg-error/5">
                <AlertCircle className="h-4 w-4 text-error" />
                <AlertDescription className="text-error">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg backdrop-blur-sm"
            >
              <div className="text-center">
                <Paperclip className="h-12 w-12 text-primary mx-auto mb-2" />
                <p className="text-lg font-medium text-primary">Drop files here</p>
                <p className="text-sm text-muted-foreground">Support for images, documents, and more</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 space-y-2"
            >
              {attachments.map((attachment, index) => {
                const FileIcon = getFileIcon(attachment.file);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-surface rounded-lg border"
                  >
                    <div className="flex-shrink-0">
                      {attachment.preview ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                          <FileIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(attachment.file.size)}</span>
                        <span>•</span>
                        <span>{attachment.file.type}</span>
                      </div>

                      {attachment.status === 'uploading' && (
                        <Progress value={attachment.progress || 0} className="h-1 mt-1" />
                      )}

                      {attachment.error && (
                        <p className="text-xs text-error mt-1">{attachment.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {attachment.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-error"
                        onClick={() => removeAttachment(index)}
                        aria-label={`Remove ${attachment.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice recording display */}
        <AnimatePresence>
          {(voiceRecording.isRecording || voiceRecording.blob) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {voiceRecording.isRecording ? (
                        <>
                          <div className="w-3 h-3 bg-error rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Recording...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-success rounded-full" />
                          <span className="text-sm font-medium">Recording ready</span>
                        </>
                      )}
                    </div>

                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {voiceRecording.duration.toFixed(1)}s
                      </span>

                      {/* Simplified waveform */}
                      <div className="flex items-center gap-1 h-6 flex-1">
                        {voiceRecording.waveformData.slice(-20).map((value, i) => (
                          <div
                            key={i}
                            className="bg-primary rounded-full transition-all"
                            style={{
                              width: '2px',
                              height: `${Math.max(2, value / 5)}px`,
                              opacity: voiceRecording.isRecording ? 0.7 : 0.3
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {!voiceRecording.isRecording && voiceRecording.blob && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setVoiceRecording({ duration: 0, waveformData: [], isRecording: false })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input area */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-xl border border-border bg-surface focus-within:border-primary transition-colors">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[60px] w-full resize-none border-0 bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ maxHeight: '200px' }}
              aria-label="Message input"
              data-testid="message-input"
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between border-t border-border p-3">
              {/* Left controls */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,text/*,.pdf,.doc,.docx,.json"
                  aria-label="File upload input"
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8"
                      disabled={disabled}
                      aria-label="Attach files"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach files</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleVoiceRecording}
                      className={cn(
                        'h-8 w-8',
                        voiceRecording.isRecording && 'text-error bg-error/10'
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
                    {voiceRecording.isRecording ? 'Stop recording' : 'Voice recording'}
                  </TooltipContent>
                </Tooltip>

                {/* Tools selector */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 h-8"
                      disabled={disabled}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Tools ({tools.filter(t => t.enabled).length})</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96" align="start">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Available Tools</h4>
                        <p className="text-sm text-muted-foreground">
                          Select tools for the AI to use in responses
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {tools.map((tool) => (
                          <div
                            key={tool.id}
                            className={cn(
                              'flex items-center gap-3 rounded-lg p-3 border cursor-pointer transition-colors',
                              'hover:bg-accent',
                              tool.enabled && 'border-primary bg-primary/5'
                            )}
                            onClick={() => toggleTool(tool.id)}
                          >
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                              tool.enabled
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}>
                              <tool.icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{tool.name}</p>
                                {tool.premium && (
                                  <Badge variant="secondary" className="text-xs">Pro</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{tool.description}</p>
                            </div>

                            <Switch
                              checked={tool.enabled}
                              onCheckedChange={() => toggleTool(tool.id)}
                              aria-label={`Toggle ${tool.name}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-3">
                {/* Advanced settings toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="h-8 text-xs"
                >
                  Advanced {showAdvancedSettings ? '↑' : '↓'}
                </Button>

                {/* Model selector */}
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={disabled}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          {model.premium && (
                            <Badge variant="secondary" className="text-xs">Pro</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority selector */}
                <Select
                  value={priority}
                  onValueChange={(value: unknown) => setPriority(value as string)}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-28 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="complex">Complex</SelectItem>
                  </SelectContent>
                </Select>

                {/* Send button */}
                <Button
                  onClick={handleSend}
                  disabled={disabled || (!message.trim() && attachments.length === 0 && !voiceRecording.blob)}
                  className="gap-2 px-4 h-8 font-medium"
                  data-testid="send-button"
                >
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced settings panel */}
          <AnimatePresence>
            {showAdvancedSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Advanced Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Temperature: {temperature[0].toFixed(1)}
                        </Label>
                        <Slider
                          value={temperature}
                          onValueChange={setTemperature}
                          max={2}
                          min={0}
                          step={0.1}
                          className="w-full"
                          disabled={disabled}
                        />
                        <p className="text-xs text-muted-foreground">
                          Controls creativity (0 = focused, 2 = creative)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Max Tokens: {maxTokens}</Label>
                        <p className="text-xs text-muted-foreground">
                          Maximum response length
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm">Stream Response</Label>
                          <p className="text-xs text-muted-foreground">
                            Show response as it's generated
                          </p>
                        </div>
                        <Switch
                          checked={streamResponse}
                          onCheckedChange={setStreamResponse}
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Estimation info */}
          <AnimatePresence>
            {(message.trim() || attachments.length > 0) && (
              <motion.div
                className="mt-2 flex justify-between items-center text-xs text-muted-foreground"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-4">
                  <span>~{estimatedTokens.toLocaleString()} tokens</span>
                  <span>~${estimatedCost.toFixed(6)}</span>
                  {currentModel && (
                    <span>({currentModel.name})</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span>⌘⏎ to send</span>
                  <span>⇧⏎ for new line</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
  };

;
};

export default MessageComposer;