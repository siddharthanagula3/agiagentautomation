/**
 * AgentSelector Component
 * Manual agent selection dropdown triggered by # in input
 * Features: Search/filter, keyboard navigation, agent info display
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Zap, CheckCircle2 } from 'lucide-react';
import type { AIEmployee } from '@core/types/ai-employee';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/lib/utils';

export interface AgentSelectorProps {
  employees: AIEmployee[];
  query?: string;
  selectedAgent?: string;
  onSelect: (employee: AIEmployee) => void;
  onClose?: () => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  employees,
  query = '',
  selectedAgent,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState(query);

  // Update search when query prop changes
  useEffect(() => {
    setSearchQuery(query);
  }, [query]);

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return employees;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(lowerQuery) ||
        emp.description.toLowerCase().includes(lowerQuery) ||
        emp.tools.some((tool) => tool.toLowerCase().includes(lowerQuery))
    );
  }, [employees, searchQuery]);

  // Group employees by category/role
  const groupedEmployees = useMemo(() => {
    const groups: Record<string, AIEmployee[]> = {};

    filteredEmployees.forEach((emp) => {
      // Extract category from description or default to 'General'
      const category = extractCategory(emp.description);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(emp);
    });

    return groups;
  }, [filteredEmployees]);

  const handleSelect = (employee: AIEmployee) => {
    onSelect(employee);
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    }
  };

  return (
    <Command
      className="rounded-lg border shadow-md"
      onKeyDown={handleKeyDown}
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search agents..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="h-9"
      />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Search className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No agents found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search term
            </p>
          </div>
        </CommandEmpty>

        {Object.entries(groupedEmployees).map(
          ([category, categoryEmployees]) => (
            <CommandGroup key={category} heading={category}>
              {categoryEmployees.map((employee) => (
                <CommandItem
                  key={employee.name}
                  value={employee.name}
                  onSelect={() => handleSelect(employee)}
                  className="flex cursor-pointer items-start gap-3 px-3 py-2"
                >
                  {/* Agent Avatar */}
                  <Avatar className="mt-0.5 h-8 w-8">
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-semibold text-primary">
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>

                  {/* Agent Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {employee.name}
                      </span>
                      {selectedAgent === employee.name && (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {employee.description}
                    </p>

                    {/* Tools */}
                    {employee.tools.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {employee.tools.slice(0, 3).map((tool) => (
                          <Badge
                            key={tool}
                            variant="secondary"
                            className="h-5 px-1.5 py-0 text-xs"
                          >
                            {tool}
                          </Badge>
                        ))}
                        {employee.tools.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 py-0 text-xs"
                          >
                            +{employee.tools.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Indicator */}
                  <div className="flex-shrink-0">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )
        )}
      </CommandList>
    </Command>
  );
};

/**
 * Extract category from employee description
 * Simple heuristic: look for common role keywords
 */
function extractCategory(description: string): string {
  const lowerDesc = description.toLowerCase();

  if (
    lowerDesc.includes('code') ||
    lowerDesc.includes('develop') ||
    lowerDesc.includes('engineer')
  ) {
    return 'Development';
  }
  if (
    lowerDesc.includes('design') ||
    lowerDesc.includes('ui') ||
    lowerDesc.includes('ux')
  ) {
    return 'Design';
  }
  if (
    lowerDesc.includes('data') ||
    lowerDesc.includes('analytics') ||
    lowerDesc.includes('research')
  ) {
    return 'Data & Research';
  }
  if (
    lowerDesc.includes('market') ||
    lowerDesc.includes('sales') ||
    lowerDesc.includes('business')
  ) {
    return 'Business';
  }
  if (
    lowerDesc.includes('test') ||
    lowerDesc.includes('qa') ||
    lowerDesc.includes('quality')
  ) {
    return 'Quality Assurance';
  }
  if (
    lowerDesc.includes('write') ||
    lowerDesc.includes('content') ||
    lowerDesc.includes('document')
  ) {
    return 'Content & Documentation';
  }

  return 'General';
}
