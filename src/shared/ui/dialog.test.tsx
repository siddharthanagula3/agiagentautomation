/**
 * Dialog Component Tests
 *
 * Tests for the Dialog UI component including:
 * - Opening and closing behavior
 * - Accessibility (aria-modal, focus management, escape key)
 * - Content rendering (header, footer, title, description)
 * - Close button customization
 * - User interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog';

describe('Dialog Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should not render content when closed', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render trigger button', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    });

    it('should render content when open is true', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });

    it('should render with defaultOpen', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Default Open</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('should open when trigger is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Content</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.click(screen.getByText('Open'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should close when close button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /close dialog/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close when escape key is pressed', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close when clicking overlay', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // The overlay is the parent element with the dark background
      const overlay = document.querySelector('[data-state="open"]');
      if (overlay) {
        await user.click(overlay);
      }

      await waitFor(
        () => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should call onOpenChange when state changes', async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open'));
      expect(handleOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Dialog Content', () => {
    it('should render DialogHeader', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Header Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Header Title')).toBeInTheDocument();
    });

    it('should render DialogFooter', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
            <DialogFooter>
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should render DialogTitle', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>My Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(
        screen.getByRole('heading', { name: 'My Dialog Title' })
      ).toBeInTheDocument();
    });

    it('should render DialogDescription', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>
              This is the dialog description text.
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );

      expect(
        screen.getByText('This is the dialog description text.')
      ).toBeInTheDocument();
    });

    it('should render custom content', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Form Dialog</DialogTitle>
            <form>
              <input placeholder="Name" />
              <button type="submit">Submit</button>
            </form>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should render close button by default', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(
        screen.getByRole('button', { name: /close dialog/i })
      ).toBeInTheDocument();
    });

    it('should hide close button when hideCloseButton is true', () => {
      render(
        <Dialog open>
          <DialogContent hideCloseButton>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(
        screen.queryByRole('button', { name: /close dialog/i })
      ).not.toBeInTheDocument();
    });

    it('should support custom close button label', () => {
      render(
        <Dialog open>
          <DialogContent closeButtonLabel="Dismiss modal">
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(
        screen.getByRole('button', { name: /dismiss modal/i })
      ).toBeInTheDocument();
    });

    it('should render DialogClose component', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog defaultOpen>
          <DialogContent hideCloseButton>
            <DialogTitle>Dialog</DialogTitle>
            <DialogClose asChild>
              <button>Custom Close</button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Custom Close')).toBeInTheDocument();

      await user.click(screen.getByText('Custom Close'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible close button with aria-label', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('should have sr-only text for close button', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Close dialog')).toHaveClass('sr-only');
    });

    it('should hide icon from screen readers', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      const svg = closeButton.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be labelledby DialogTitle', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Accessible Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      const title = screen.getByRole('heading', { name: 'Accessible Title' });

      expect(dialog).toHaveAttribute('aria-labelledby', title.id);
    });

    it('should be describedby DialogDescription', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description text</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      const description = screen.getByText('Description text');

      expect(dialog).toHaveAttribute('aria-describedby', description.id);
    });
  });

  describe('Focus Management', () => {
    it('should trap focus within dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
            <button>First</button>
            <button>Second</button>
          </DialogContent>
        </Dialog>
      );

      // Tab through the dialog
      await user.tab();
      await user.tab();
      await user.tab();

      // Focus should stay within dialog (wrap around or stay on last element)
      const dialog = screen.getByRole('dialog');
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('should focus first focusable element when opened', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
            <input placeholder="First input" />
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open'));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to DialogContent', () => {
      render(
        <Dialog open>
          <DialogContent className="custom-dialog">
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-dialog');
    });

    it('should apply custom className to DialogHeader', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader className="custom-header">
              <DialogTitle>Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen
        .getByRole('heading', { name: 'Dialog' })
        .closest('div');
      expect(header).toHaveClass('custom-header');
    });

    it('should apply custom className to DialogFooter', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
            <DialogFooter className="custom-footer">
              <button>OK</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByText('OK').closest('div');
      expect(footer).toHaveClass('custom-footer');
    });

    it('should apply custom className to DialogTitle', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle className="custom-title">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByRole('heading', { name: 'Title' });
      expect(title).toHaveClass('custom-title');
    });

    it('should apply custom className to DialogDescription', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
            <DialogDescription className="custom-desc">
              Description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('Controlled Mode', () => {
    it('should work as controlled component', async () => {
      const ControlledDialog = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Open</DialogTrigger>
            <DialogContent>
              <DialogTitle>Controlled</DialogTitle>
              <button onClick={() => setOpen(false)}>Close Manually</button>
            </DialogContent>
          </Dialog>
        );
      };

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ControlledDialog />);

      // Open
      await user.click(screen.getByText('Open'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close via custom button
      await user.click(screen.getByText('Close Manually'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Nested Dialogs', () => {
    it('should support nested dialogs', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Dialog>
          <DialogTrigger>Open Outer</DialogTrigger>
          <DialogContent>
            <DialogTitle>Outer Dialog</DialogTitle>
            <Dialog>
              <DialogTrigger>Open Inner</DialogTrigger>
              <DialogContent>
                <DialogTitle>Inner Dialog</DialogTitle>
              </DialogContent>
            </Dialog>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText('Open Outer'));
      expect(screen.getByText('Outer Dialog')).toBeInTheDocument();

      await user.click(screen.getByText('Open Inner'));
      expect(screen.getByText('Inner Dialog')).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    it('should have animation classes on content', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('data-[state=open]:animate-in');
      expect(dialog).toHaveClass('data-[state=closed]:animate-out');
    });

    it('should have animation classes on overlay', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/80');
      expect(overlay).toHaveClass('data-[state=open]:animate-in');
      expect(overlay).toHaveClass('data-[state=closed]:animate-out');
    });
  });
});
