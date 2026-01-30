/**
 * LoadingSpinner Component Tests
 *
 * Tests for the LoadingSpinner UI component including:
 * - Rendering with different sizes
 * - Accessibility (role, aria-label, sr-only text)
 * - Custom styling via className
 * - Animation classes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './loading-spinner';

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with screen reader text', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });

    it('should have status role', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<LoadingSpinner size="sm" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-4');
      expect(spinner).toHaveClass('w-4');
    });

    it('should render medium size by default', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-6');
      expect(spinner).toHaveClass('w-6');
    });

    it('should render medium size explicitly', () => {
      render(<LoadingSpinner size="md" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-6');
      expect(spinner).toHaveClass('w-6');
    });

    it('should render large size', () => {
      render(<LoadingSpinner size="lg" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-8');
      expect(spinner).toHaveClass('w-8');
    });
  });

  describe('Styling', () => {
    it('should have animation class', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should have border styling', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('rounded-full');
      expect(spinner).toHaveClass('border-2');
      expect(spinner).toHaveClass('border-current');
      expect(spinner).toHaveClass('border-t-transparent');
    });

    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-class" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-class');
    });

    it('should merge custom className with base classes', () => {
      render(<LoadingSpinner className="text-blue-500" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-blue-500');
      expect(spinner).toHaveClass('animate-spin'); // Base class still present
    });

    it('should allow overriding default styles', () => {
      render(<LoadingSpinner className="h-10 w-10" size="sm" />);
      const spinner = screen.getByRole('status');
      // The custom class should be applied (though h-4 from size might also be present)
      expect(spinner).toHaveClass('h-10');
      expect(spinner).toHaveClass('w-10');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible name from aria-label', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('should have sr-only text for additional context', () => {
      render(<LoadingSpinner />);
      const srText = screen.getByText('Loading...');
      expect(srText).toHaveClass('sr-only');
    });

    it('should be perceivable by screen readers', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');

      // Should have role="status" which announces to screen readers
      expect(spinner).toHaveAttribute('role', 'status');

      // Should have aria-label for accessible name
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Use Cases', () => {
    it('should work in a button loading state', () => {
      render(
        <button disabled>
          <LoadingSpinner size="sm" className="mr-2" />
          Loading...
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toContainElement(screen.getByRole('status'));
    });

    it('should work as a page loading indicator', () => {
      render(
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner size="lg" />
        </div>
      );

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-8');
    });

    it('should work with custom colors via className', () => {
      render(<LoadingSpinner className="text-primary" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('text-primary');
      expect(spinner).toHaveClass('border-current'); // Will inherit from text color
    });

    it('should work in a card or container', () => {
      render(
        <div data-testid="card">
          <LoadingSpinner className="mx-auto" />
          <p>Loading content...</p>
        </div>
      );

      const card = screen.getByTestId('card');
      expect(card).toContainElement(screen.getByRole('status'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined size gracefully (use default)', () => {
      render(<LoadingSpinner size={undefined} />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('h-6'); // Default md size
    });

    it('should handle undefined className gracefully', () => {
      render(<LoadingSpinner className={undefined} />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should handle empty className string', () => {
      render(<LoadingSpinner className="" />);
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Visual Appearance', () => {
    it('should have circular shape', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('rounded-full');
    });

    it('should have transparent top border for spinning effect', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-t-transparent');
    });

    it('should use current text color for border', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-current');
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple spinners independently', () => {
      render(
        <>
          <LoadingSpinner size="sm" data-testid="spinner-1" />
          <LoadingSpinner size="md" data-testid="spinner-2" />
          <LoadingSpinner size="lg" data-testid="spinner-3" />
        </>
      );

      const spinners = screen.getAllByRole('status');
      expect(spinners).toHaveLength(3);
    });

    it('should apply different sizes to different instances', () => {
      render(
        <>
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="lg" />
        </>
      );

      const spinners = screen.getAllByRole('status');
      expect(spinners[0]).toHaveClass('h-4');
      expect(spinners[1]).toHaveClass('h-8');
    });
  });

  describe('Inline Usage', () => {
    it('should work inline with text', () => {
      render(
        <span>
          <LoadingSpinner size="sm" className="inline-block mr-1" />
          <span>Processing...</span>
        </span>
      );

      expect(screen.getByRole('status')).toHaveClass('inline-block');
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });
});
