import * as React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper function to create sortable header
export const createSortableHeader = (label: string) => {
  return ({ column }: { column: unknown }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="p-0 font-medium hover:bg-transparent"
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  };
};
