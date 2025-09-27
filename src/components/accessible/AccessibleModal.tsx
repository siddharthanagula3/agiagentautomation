import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useModal, useScreenReader } from '../../hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;

  // Accessibility options
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  returnFocusToTrigger?: boolean;

  // ARIA attributes
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  returnFocusToTrigger = true,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}) => {
  const { announceSuccess } = useScreenReader();

  useEffect(() => {
    if (isOpen) {
      announceSuccess('Dialog opened');
    }
  }, [isOpen, announceSuccess]);

  const handleClose = () => {
    announceSuccess('Dialog closed');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(className)}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
        onInteractOutside={closeOnOutsideClick ? undefined : (e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle id={ariaLabelledBy || 'modal-title'}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription id={ariaDescribedBy || 'modal-description'}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessibleModal;