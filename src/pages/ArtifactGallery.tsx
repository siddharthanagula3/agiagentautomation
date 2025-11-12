import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Badge } from '@shared/ui/badge';
import { Avatar, AvatarFallback } from '@shared/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  Search,
  Code,
  Image as ImageIcon,
  FileCode,
  Sparkles,
  Eye,
  Heart,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@shared/lib/supabase-client';

interface PublicArtifact {
  id: string;
  title: string;
  type: 'html' | 'react' | 'svg' | 'mermaid' | 'code';
  description: string;
  content: string;
  language?: string;
  author: string;
  authorId: string;
  views: number;
  likes: number;
  createdAt: string;
  tags: string[];
}

interface DatabaseArtifact {
  id: string;
  title: string;
  type: string;
  description: string;
  content: string;
  language?: string;
  author: string;
  author_id: string;
  views: number;
  likes: number;
  created_at: string;
  tags: string[];
}

/**
 * Artifact Gallery Page
 *
 * Public showcase of community-created artifacts.
 * Users can browse, search, and view live previews of artifacts shared by the community.
 *
 * Inspired by:
 * - Claude Artifacts Gallery
 * - CodePen Community Showcase
 * - Replit Community
 */
const ArtifactGalleryPage: React.FC = () => {
  const [artifacts, setArtifacts] = useState<PublicArtifact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>(
    'recent'
  );

  const loadPublicArtifacts = useCallback(async () => {
    try {
      setIsLoading(true);

      let query = supabase.from('public_artifacts').select('*');

      // Filter by type
      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      // Sort
      switch (sortBy) {
        case 'popular':
          query = query.order('likes', { ascending: false });
          break;
        case 'trending':
          query = query.order('views', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      query = query.limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('[Artifact Gallery] Error loading artifacts:', error);
        // FIXED: Don't silently fall back to demo data
        // Show empty state instead to indicate the feature needs setup
        setArtifacts([]);
      } else {
        const mappedArtifacts =
          data?.map((artifact: DatabaseArtifact) => ({
            id: artifact.id,
            title: artifact.title,
            type: artifact.type as
              | 'html'
              | 'react'
              | 'svg'
              | 'mermaid'
              | 'code',
            description: artifact.description,
            content: artifact.content,
            language: artifact.language,
            author: artifact.author,
            authorId: artifact.author_id,
            views: artifact.views || 0,
            likes: artifact.likes || 0,
            createdAt: artifact.created_at,
            tags: artifact.tags || [],
          })) || [];

        setArtifacts(mappedArtifacts);
      }
    } catch (error) {
      console.error('[Artifact Gallery] Error:', error);
      // FIXED: Show empty state on error, not demo data
      setArtifacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, selectedType]);

  useEffect(() => {
    loadPublicArtifacts();
  }, [loadPublicArtifacts]);

  const filteredArtifacts = artifacts.filter(
    (artifact) =>
      artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'html':
        return Code;
      case 'react':
        return Sparkles;
      case 'svg':
        return ImageIcon;
      case 'mermaid':
        return FileCode;
      default:
        return Code;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'html':
        return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30';
      case 'react':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
      case 'svg':
        return 'text-purple-500 bg-purple-50 dark:bg-purple-950/30';
      case 'mermaid':
        return 'text-green-500 bg-green-50 dark:bg-green-950/30';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-950/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="mb-2 text-4xl font-bold">Artifact Gallery</h1>
            <p className="text-lg text-muted-foreground">
              Discover and explore interactive artifacts created by the
              community
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="mermaid">Mermaid</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v) =>
                setSortBy(v as 'recent' | 'popular' | 'trending')
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Liked</SelectItem>
                <SelectItem value="trending">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Artifact Grid */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-lg font-medium">
                Loading artifacts...
              </div>
              <div className="text-sm text-muted-foreground">
                Fetching amazing community creations
              </div>
            </div>
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-lg font-medium">No artifacts found</div>
              <div className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to share an artifact!'}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArtifacts.map((artifact) => {
              const TypeIcon = getTypeIcon(artifact.type);

              return (
                <Card
                  key={artifact.id}
                  className="group transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1 text-lg">
                          {artifact.title}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {artifact.description}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'ml-2 flex items-center gap-1',
                          getTypeColor(artifact.type)
                        )}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {artifact.type}
                      </Badge>
                    </div>

                    {/* Author */}
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {artifact.author.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{artifact.author}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(artifact.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Tags */}
                    {artifact.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {artifact.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{artifact.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{artifact.likes}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button className="w-full gap-2" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                      View Artifact
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Coming Soon Message */}
        <div className="mt-12 rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold">✨ Gallery Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            The Artifact Gallery is currently in development. Soon you'll be
            able to share your creations with the community and discover amazing
            artifacts from other users!
          </p>
        </div>
      </div>
    </div>
  );
};

// Demo data for development
const DEMO_ARTIFACTS: PublicArtifact[] = [
  {
    id: '1',
    title: 'Interactive Button Component',
    type: 'html',
    description: 'A beautiful animated button with hover effects',
    content: '<button>Demo</button>',
    author: 'Alice Chen',
    authorId: 'user1',
    views: 1250,
    likes: 89,
    createdAt: '2025-01-10T12:00:00Z',
    tags: ['button', 'animation', 'css'],
  },
  {
    id: '2',
    title: 'React Counter App',
    type: 'react',
    description: 'Simple counter with increment and decrement buttons',
    content: 'function Counter() { ... }',
    author: 'Bob Smith',
    authorId: 'user2',
    views: 2340,
    likes: 156,
    createdAt: '2025-01-09T10:30:00Z',
    tags: ['react', 'hooks', 'tutorial'],
  },
  {
    id: '3',
    title: 'SVG Logo Animation',
    type: 'svg',
    description: 'Animated logo with smooth transitions',
    content: '<svg>...</svg>',
    author: 'Charlie Davis',
    authorId: 'user3',
    views: 890,
    likes: 67,
    createdAt: '2025-01-08T15:45:00Z',
    tags: ['svg', 'animation', 'logo'],
  },
];

export default ArtifactGalleryPage;
