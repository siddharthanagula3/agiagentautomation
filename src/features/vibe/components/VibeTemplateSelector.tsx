/**
 * VibeTemplateSelector - Project template selection dialog
 * Allows users to scaffold new projects from pre-built templates
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import {
  projectTemplates,
  type ProjectTemplate,
} from '../services/vibe-templates';
import { vibeFileSystem } from '@features/vibe/services/vibe-file-system';

interface VibeTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelected?: (templateId: string) => void;
}

export function VibeTemplateSelector({
  open,
  onOpenChange,
  onTemplateSelected,
}: VibeTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'frontend' | 'fullstack' | 'utility'
  >('all');
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProjectTemplate | null>(null);

  const filteredTemplates =
    selectedCategory === 'all'
      ? projectTemplates
      : projectTemplates.filter((t) => t.category === selectedCategory);

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    try {
      // Check if there are existing files
      const existingFiles = vibeFileSystem.searchFiles('');
      if (existingFiles.length > 0) {
        const confirmed = window.confirm(
          `This will clear all existing files (${existingFiles.length} files). Continue?`
        );
        if (!confirmed) {
          return;
        }

        // Clear existing files
        for (const file of existingFiles) {
          try {
            vibeFileSystem.deleteFile(file.path);
          } catch (error) {
            console.error(`Failed to delete file ${file.path}:`, error);
          }
        }
      }

      // Create template files
      for (const file of selectedTemplate.files) {
        try {
          // Create parent directories if needed
          const pathParts = file.path.split('/').filter(Boolean);
          if (pathParts.length > 1) {
            // Has parent directories
            let currentPath = '';
            for (let i = 0; i < pathParts.length - 1; i++) {
              currentPath += '/' + pathParts[i];
              try {
                vibeFileSystem.createFolder(currentPath);
              } catch (error) {
                // Folder might already exist, ignore
              }
            }
          }

          // Create the file
          vibeFileSystem.createFile(file.path, file.content);
        } catch (error) {
          console.error(`Failed to create file ${file.path}:`, error);
          toast.error(`Failed to create ${file.path}`);
        }
      }

      toast.success(
        `Created ${selectedTemplate.name} with ${selectedTemplate.files.length} files`
      );
      onTemplateSelected?.(selectedTemplate.id);
      onOpenChange(false);
      setSelectedTemplate(null);

      // Trigger a page reload to refresh the file tree and editor
      window.location.reload();
    } catch (error) {
      console.error('[VIBE] Failed to scaffold template:', error);
      toast.error('Failed to create template files');
    }
  };

  const handleCancel = () => {
    setSelectedTemplate(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Project Template</DialogTitle>
          <DialogDescription>
            Start with a pre-configured template to speed up your development
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Templates
          </Button>
          <Button
            variant={selectedCategory === 'frontend' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('frontend')}
          >
            Frontend
          </Button>
          <Button
            variant={selectedCategory === 'fullstack' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('fullstack')}
          >
            Full Stack
          </Button>
          <Button
            variant={selectedCategory === 'utility' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('utility')}
          >
            Utility
          </Button>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={cn(
                'flex flex-col items-start gap-3 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent',
                selectedTemplate?.id === template.id
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent'
              )}
            >
              {/* Template Icon and Name */}
              <div className="flex w-full items-center gap-3">
                <div className="text-3xl">{template.icon}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{template.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {template.description}
              </p>

              {/* File Count */}
              <div className="text-xs text-muted-foreground">
                {template.files.length} file
                {template.files.length !== 1 ? 's' : ''}
              </div>

              {/* File List (compact) */}
              <div className="flex flex-wrap gap-1">
                {template.files.slice(0, 4).map((file) => (
                  <Badge
                    key={`template-file-${file.path}`}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {file.path.split('/').pop()}
                  </Badge>
                ))}
                {template.files.length > 4 && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    +{template.files.length - 4} more
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTemplate}
            className="min-w-[120px]"
          >
            {selectedTemplate
              ? `Create ${selectedTemplate.name}`
              : 'Select a Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
