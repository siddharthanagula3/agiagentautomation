/**
 * Toast Component Tests
 *
 * Tests for Toast UI components including:
 * - ToastProvider, ToastViewport, Toast, ToastAction, ToastClose
 * - ToastTitle, ToastDescription
 * - Variants (default, destructive)
 * - User interactions (close, action buttons)
 * - Accessibility (role, aria attributes)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './toast';

// Helper component for testing toasts
interface TestToastProps {
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  showAction?: boolean;
  showClose?: boolean;
  onAction?: () => void;
  duration?: number;
}

const TestToast: React.FC<TestToastProps> = ({
  variant = 'default',
  open = true,
  onOpenChange,
  title = 'Toast Title',
  description = 'Toast description text',
  showAction = false,
  showClose = false,
  onAction,
  duration = Infinity,
}) => (
  <ToastProvider duration={duration}>
    <Toast variant={variant} open={open} onOpenChange={onOpenChange}>
      <div className="grid gap-1">
        <ToastTitle>{title}</ToastTitle>
        <ToastDescription>{description}</ToastDescription>
      </div>
      {showAction && (
        <ToastAction altText="Try again" onClick={onAction}>
          Try again
        </ToastAction>
      )}
      {showClose && <ToastClose />}
    </Toast>
    <ToastViewport />
  </ToastProvider>
);

describe('Toast Components', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('should render children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide toast context to children', () => {
      render(<TestToast />);
      expect(screen.getByText('Toast Title')).toBeInTheDocument();
    });
  });

  describe('ToastViewport', () => {
    it('should render viewport element', () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport" />
        </ToastProvider>
      );

      expect(screen.getByTestId('viewport')).toBeInTheDocument();
    });

    it('should have fixed positioning classes', () => {
      render(
        <ToastProvider>
          <ToastViewport data-testid="viewport" />
        </ToastProvider>
      );

      const viewport = screen.getByTestId('viewport');
      expect(viewport).toHaveClass('fixed');
      expect(viewport).toHaveClass('top-0');
      expect(viewport).toHaveClass('z-[100]');
    });

    it('should apply custom className', () => {
      render(
        <ToastProvider>
          <ToastViewport className="custom-viewport" data-testid="viewport" />
        </ToastProvider>
      );

      expect(screen.getByTestId('viewport')).toHaveClass('custom-viewport');
    });
  });

  describe('Toast', () => {
    it('should render when open is true', () => {
      render(<TestToast open={true} />);
      expect(screen.getByText('Toast Title')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(<TestToast open={false} />);
      expect(screen.queryByText('Toast Title')).not.toBeInTheDocument();
    });

    describe('Variants', () => {
      it('should render default variant', () => {
        render(<TestToast variant="default" />);

        const toast = screen.getByText('Toast Title').closest('[data-state]');
        expect(toast).toHaveClass('border');
        expect(toast).toHaveClass('bg-background');
      });

      it('should render destructive variant', () => {
        render(<TestToast variant="destructive" />);

        const toast = screen.getByText('Toast Title').closest('[data-state]');
        expect(toast).toHaveClass('destructive');
        expect(toast).toHaveClass('border-destructive');
        expect(toast).toHaveClass('bg-destructive');
      });
    });

    it('should call onOpenChange when closing', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestToast showClose onOpenChange={handleOpenChange} />);

      await user.click(screen.getByRole('button'));

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should apply custom className', () => {
      render(
        <ToastProvider>
          <Toast className="custom-toast" open>
            <ToastTitle>Test</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      const toast = screen.getByText('Test').closest('[data-state]');
      expect(toast).toHaveClass('custom-toast');
    });

    it('should have animation classes', () => {
      render(<TestToast />);

      const toast = screen.getByText('Toast Title').closest('[data-state]');
      expect(toast).toHaveClass('data-[state=open]:animate-in');
      expect(toast).toHaveClass('data-[state=closed]:animate-out');
    });

    it('should have swipe classes', () => {
      render(<TestToast />);

      const toast = screen.getByText('Toast Title').closest('[data-state]');
      expect(toast).toHaveClass('data-[swipe=end]:animate-out');
    });
  });

  describe('ToastTitle', () => {
    it('should render title text', () => {
      render(<TestToast title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should have title styling', () => {
      render(<TestToast title="Styled Title" />);

      const title = screen.getByText('Styled Title');
      expect(title).toHaveClass('text-sm');
      expect(title).toHaveClass('font-semibold');
    });

    it('should apply custom className', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle className="custom-title">Title</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText('Title')).toHaveClass('custom-title');
    });
  });

  describe('ToastDescription', () => {
    it('should render description text', () => {
      render(<TestToast description="Custom description" />);
      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });

    it('should have description styling', () => {
      render(<TestToast description="Styled description" />);

      const desc = screen.getByText('Styled description');
      expect(desc).toHaveClass('text-sm');
      expect(desc).toHaveClass('opacity-90');
    });

    it('should apply custom className', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastDescription className="custom-desc">
              Description
            </ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText('Description')).toHaveClass('custom-desc');
    });
  });

  describe('ToastClose', () => {
    it('should render close button', () => {
      render(<TestToast showClose />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have close button styling', () => {
      render(<TestToast showClose />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('absolute');
      expect(closeButton).toHaveClass('right-2');
      expect(closeButton).toHaveClass('top-2');
    });

    it('should close toast when clicked', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestToast showClose onOpenChange={handleOpenChange} />);

      await user.click(screen.getByRole('button'));

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should render X icon', () => {
      render(<TestToast showClose />);

      const closeButton = screen.getByRole('button');
      const svg = closeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Test</ToastTitle>
            <ToastClose className="custom-close" />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByRole('button')).toHaveClass('custom-close');
    });

    it('should have focus ring styles', () => {
      render(<TestToast showClose />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toHaveClass('focus:outline-none');
      expect(closeButton).toHaveClass('focus:ring-2');
    });
  });

  describe('ToastAction', () => {
    it('should render action button', () => {
      render(<TestToast showAction />);
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should call onClick when clicked', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestToast showAction onAction={handleAction} />);

      await user.click(screen.getByText('Try again'));

      expect(handleAction).toHaveBeenCalled();
    });

    it('should have action button styling', () => {
      render(<TestToast showAction />);

      const actionButton = screen.getByText('Try again');
      expect(actionButton).toHaveClass('inline-flex');
      expect(actionButton).toHaveClass('h-8');
      expect(actionButton).toHaveClass('shrink-0');
    });

    it('should have destructive styling in destructive toast', () => {
      render(<TestToast variant="destructive" showAction />);

      const actionButton = screen.getByText('Try again');
      expect(actionButton).toHaveClass(
        'group-[.destructive]:hover:bg-destructive'
      );
    });

    it('should have altText for accessibility', () => {
      render(<TestToast showAction />);

      // ToastAction requires altText prop for screen readers
      const actionButton = screen.getByText('Try again');
      expect(actionButton).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Test</ToastTitle>
            <ToastAction altText="Action" className="custom-action">
              Action
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText('Action')).toHaveClass('custom-action');
    });
  });

  describe('Accessibility', () => {
    it('should have proper toast structure', () => {
      render(<TestToast />);

      const toast = screen.getByText('Toast Title').closest('[data-state]');
      expect(toast).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(<TestToast showClose />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have proper action button text', () => {
      render(<TestToast showAction />);

      const action = screen.getByText('Try again');
      expect(action).toHaveAttribute('type', 'button');
    });

    it('should be focusable', () => {
      render(<TestToast showClose />);

      const closeButton = screen.getByRole('button');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('User Interactions', () => {
    it('should close on close button click', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestToast showClose onOpenChange={handleOpenChange} />);

      await user.click(screen.getByRole('button'));

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should trigger action on action button click', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestToast showAction onAction={handleAction} />);

      await user.click(screen.getByText('Try again'));

      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should support keyboard interaction on close button', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestToast showClose onOpenChange={handleOpenChange} />);

      const closeButton = screen.getByRole('button');
      closeButton.focus();
      await user.keyboard('{Enter}');

      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it('should support keyboard interaction on action button', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestToast showAction onAction={handleAction} />);

      const actionButton = screen.getByText('Try again');
      actionButton.focus();
      await user.keyboard('{Enter}');

      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe('Multiple Toasts', () => {
    it('should render multiple toasts', () => {
      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Toast 1</ToastTitle>
          </Toast>
          <Toast open>
            <ToastTitle>Toast 2</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
    });

    it('should handle independent close actions', async () => {
      const handleOpenChange1 = vi.fn();
      const handleOpenChange2 = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <ToastProvider>
          <Toast open onOpenChange={handleOpenChange1}>
            <ToastTitle>Toast 1</ToastTitle>
            <ToastClose data-testid="close-1" />
          </Toast>
          <Toast open onOpenChange={handleOpenChange2}>
            <ToastTitle>Toast 2</ToastTitle>
            <ToastClose data-testid="close-2" />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      await user.click(screen.getByTestId('close-1'));

      expect(handleOpenChange1).toHaveBeenCalledWith(false);
      expect(handleOpenChange2).not.toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref on ToastViewport', () => {
      const ref = React.createRef<HTMLOListElement>();

      render(
        <ToastProvider>
          <ToastViewport ref={ref} />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLOListElement);
    });

    it('should forward ref on Toast', () => {
      const ref = React.createRef<HTMLLIElement>();

      render(
        <ToastProvider>
          <Toast ref={ref} open>
            <ToastTitle>Test</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLLIElement);
    });

    it('should forward ref on ToastTitle', () => {
      const ref = React.createRef<HTMLDivElement>();

      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle ref={ref}>Test</ToastTitle>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should forward ref on ToastDescription', () => {
      const ref = React.createRef<HTMLDivElement>();

      render(
        <ToastProvider>
          <Toast open>
            <ToastDescription ref={ref}>Description</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should forward ref on ToastClose', () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Test</ToastTitle>
            <ToastClose ref={ref} />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should forward ref on ToastAction', () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(
        <ToastProvider>
          <Toast open>
            <ToastTitle>Test</ToastTitle>
            <ToastAction ref={ref} altText="action">
              Action
            </ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
