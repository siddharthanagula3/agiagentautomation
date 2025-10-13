import React from 'react';
import { cn } from '@/lib/utils';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  className,
}) => {
  return <span className={cn('sr-only', className)}>{children}</span>;
};

export default ScreenReaderOnly;
