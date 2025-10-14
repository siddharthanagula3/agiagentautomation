/**
 * Media Generation Panel
 * Interface for image and video generation using Nano Banana and Veo3
 * Integrated with Google AI Studio (Gemini) for enhanced prompts
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Progress } from '@shared/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import {
  Image,
  Video,
  Play,
  Download,
  Share2,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Settings,
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import {
  mediaGenerationService,
  type ImageGenerationRequest,
  type VideoGenerationRequest,
  type MediaGenerationResult,
  type MediaGenerationStats,
} from '@_core/api/media-generation-service';

interface MediaGenerationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaGenerated?: (result: MediaGenerationResult) => void;
}

type GenerationTab = 'image' | 'video';
type ImageStyle = NonNullable<ImageGenerationRequest['style']>;
type ImageSize = NonNullable<ImageGenerationRequest['size']>;
type ImageQuality = NonNullable<ImageGenerationRequest['quality']>;
type ImageAspectRatio = NonNullable<ImageGenerationRequest['aspectRatio']>;
type VideoStyle = NonNullable<VideoGenerationRequest['style']>;
type VideoResolution = NonNullable<VideoGenerationRequest['resolution']>;
type VideoAspectRatio = NonNullable<VideoGenerationRequest['aspectRatio']>;

type ServiceStatus = {
  nanoBanana: boolean;
  veo3: boolean;
  gemini: boolean;
};

const MediaGenerationPanel: React.FC<MediaGenerationPanelProps> = ({
  isOpen,
  onClose,
  onMediaGenerated,
}) => {
  const [activeTab, setActiveTab] = useState<GenerationTab>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] =
    useState<MediaGenerationResult | null>(null);
  const [generationHistory, setGenerationHistory] = useState<
    MediaGenerationResult[]
  >([]);
  const [stats, setStats] = useState<MediaGenerationStats | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('realistic');
  const [imageSize, setImageSize] = useState<ImageSize>('1024x1024');
  const [imageQuality, setImageQuality] = useState<ImageQuality>('standard');
  const [imageAspectRatio, setImageAspectRatio] =
    useState<ImageAspectRatio>('1:1');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageSeed, setImageSeed] = useState<number | undefined>();

  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('realistic');
  const [videoResolution, setVideoResolution] =
    useState<VideoResolution>('1080p');
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoAspectRatio, setVideoAspectRatio] =
    useState<VideoAspectRatio>('16:9');
  const [videoFps, setVideoFps] = useState(24);
  const [videoSeed, setVideoSeed] = useState<number | undefined>();

  // Service availability
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    nanoBanana: false,
    veo3: false,
    gemini: false,
  });
  const imageSizes = imageSizes as ImageSize[];
  const videoStyles = videoStyles as VideoStyle[];
  const videoResolutions = videoResolutions as VideoResolution[];
  const handleTabChange = (value: string) => {
    if (value === 'image' || value === 'video') {
      setActiveTab(value);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const history = mediaGenerationService.getGenerationHistory();
    const stats = mediaGenerationService.getGenerationStats();
    const status = mediaGenerationService.isServiceAvailable();

    setGenerationHistory(history);
    setStats(stats);
    setServiceStatus(status);
  };

  const handleImageGeneration = async () => {
    if (!imagePrompt.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const request: ImageGenerationRequest = {
        prompt: imagePrompt,
        style: imageStyle,
        size: imageSize,
        quality: imageQuality,
        aspectRatio: imageAspectRatio,
        negativePrompt: negativePrompt || undefined,
        seed: imageSeed,
        steps: 20,
        guidance: 7.5,
      };

      const result = await mediaGenerationService.generateImage(request);

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setCurrentGeneration(result);
      setGenerationHistory(mediaGenerationService.getGenerationHistory());
      setStats(mediaGenerationService.getGenerationStats());

      if (onMediaGenerated) {
        onMediaGenerated(result);
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleVideoGeneration = async () => {
    if (!videoPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 5;
        });
      }, 1000);

      const request: VideoGenerationRequest = {
        prompt: videoPrompt,
        duration: videoDuration,
        resolution: videoResolution,
        style: videoStyle,
        aspectRatio: videoAspectRatio,
        fps: videoFps,
        seed: videoSeed,
      };

      const result = await mediaGenerationService.generateVideo(request);

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setCurrentGeneration(result);
      setGenerationHistory(mediaGenerationService.getGenerationHistory());
      setStats(mediaGenerationService.getGenerationStats());

      if (onMediaGenerated) {
        onMediaGenerated(result);
      }
    } catch (error) {
      console.error('Video generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleDownload = (result: MediaGenerationResult) => {
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `${result.type}-${result.id}`;
    link.click();
  };

  const handleDelete = (id: string) => {
    mediaGenerationService.deleteGeneration(id);
    setGenerationHistory(mediaGenerationService.getGenerationHistory());
    setStats(mediaGenerationService.getGenerationStats());
  };

  const getStatusIcon = (status: MediaGenerationResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: MediaGenerationResult['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'generating':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Media Generation
            <Badge variant="outline" className="ml-auto">
              {stats?.totalGenerations || 0} generations
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Generate images with Nano Banana and videos with Veo3, enhanced by
            Google AI Studio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Image className="h-4 w-4" />
              <span className="text-sm font-medium">Nano Banana</span>
              <Badge
                variant={serviceStatus.nanoBanana ? 'default' : 'secondary'}
                className="ml-auto"
              >
                {serviceStatus.nanoBanana ? 'Available' : 'Not configured'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Video className="h-4 w-4" />
              <span className="text-sm font-medium">Veo3</span>
              <Badge
                variant={serviceStatus.veo3 ? 'default' : 'secondary'}
                className="ml-auto"
              >
                {serviceStatus.veo3 ? 'Available' : 'Not configured'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Gemini</span>
              <Badge
                variant={serviceStatus.gemini ? 'default' : 'secondary'}
                className="ml-auto"
              >
                {serviceStatus.gemini ? 'Available' : 'Not configured'}
              </Badge>
            </div>
          </div>

          {/* Generation Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">Image Generation</TabsTrigger>
              <TabsTrigger value="video">Video Generation</TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Generate Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prompt</label>
                    <Textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Style</label>
                      <Select
                        value={imageStyle}
                        onValueChange={(value) =>
                          setImageStyle(value as ImageStyle)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mediaGenerationService
                            .getImageStyles()
                            .map((style) => (
                              <SelectItem key={style} value={style}>
                                {style.charAt(0).toUpperCase() + style.slice(1)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Size</label>
                      <Select
                        value={imageSize}
                        onValueChange={(value) =>
                          setImageSize(value as ImageSize)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mediaGenerationService
                            .getImageSizes()
                            .map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quality</label>
                      <Select
                        value={imageQuality}
                        onValueChange={(value) =>
                          setImageQuality(value as ImageQuality)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="hd">HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Aspect Ratio
                      </label>
                      <Select
                        value={imageAspectRatio}
                        onValueChange={(value) =>
                          setImageAspectRatio(value as ImageAspectRatio)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="16:9">16:9 (Wide)</SelectItem>
                          <SelectItem value="9:16">9:16 (Tall)</SelectItem>
                          <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                          <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Negative Prompt (Optional)
                    </label>
                    <Input
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="What you don't want in the image..."
                    />
                  </div>

                  <Button
                    onClick={handleImageGeneration}
                    disabled={!imagePrompt.trim() || isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Image className="mr-2 h-4 w-4" />
                        Generate Image
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Generate Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prompt</label>
                    <Textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Describe the video you want to generate..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Style</label>
                      <Select
                        value={videoStyle}
                        onValueChange={(value) =>
                          setVideoStyle(value as VideoStyle)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mediaGenerationService
                            .getVideoStyles()
                            .map((style) => (
                              <SelectItem key={style} value={style}>
                                {style.charAt(0).toUpperCase() + style.slice(1)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Resolution</label>
                      <Select
                        value={videoResolution}
                        onValueChange={(value) =>
                          setVideoResolution(value as VideoResolution)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mediaGenerationService
                            .getVideoResolutions()
                            .map((res) => (
                              <SelectItem key={res} value={res}>
                                {res}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Duration (seconds)
                      </label>
                      <Input
                        type="number"
                        value={videoDuration}
                        onChange={(e) =>
                          setVideoDuration(Number(e.target.value))
                        }
                        min="1"
                        max="60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">FPS</label>
                      <Input
                        type="number"
                        value={videoFps}
                        onChange={(e) => setVideoFps(Number(e.target.value))}
                        min="12"
                        max="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Aspect Ratio</label>
                    <Select
                      value={videoAspectRatio}
                      onValueChange={(value) =>
                        setVideoAspectRatio(value as VideoAspectRatio)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Wide)</SelectItem>
                        <SelectItem value="9:16">9:16 (Tall)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleVideoGeneration}
                    disabled={!videoPrompt.trim() || isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4" />
                        Generate Video
                      </>
                    )}
                  </Button>

                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generation History */}
          {generationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generation History</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mediaGenerationService.clearHistory()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 space-y-3 overflow-y-auto">
                  {generationHistory
                    .slice(-10)
                    .reverse()
                    .map((result) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-2">
                          {result.type === 'image' ? (
                            <Image className="h-4 w-4" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                          {getStatusIcon(result.status)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {result.prompt}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{result.type}</span>
                            <span>•</span>
                            <span>
                              {result.metadata.size ||
                                result.metadata.resolution}
                            </span>
                            <span>•</span>
                            <span>${result.cost.toFixed(4)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {result.status === 'completed' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(result)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(result.url, '_blank')
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Generation Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stats.totalGenerations}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stats.imagesGenerated}
                    </div>
                    <div className="text-sm text-muted-foreground">Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {stats.videosGenerated}
                    </div>
                    <div className="text-sm text-muted-foreground">Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      ${stats.totalCost.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Cost
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaGenerationPanel;
