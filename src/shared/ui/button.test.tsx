/**
 * Button Component Tests
 *
 * Tests for the core Button UI component including:
 * - Rendering with different variants and sizes
 * - Accessibility attributes (aria-label, aria-busy, aria-disabled)
 * - User interactions (click, keyboard)
 * - Loading states
 * - asChild composition pattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should render children correctly', () => {
      render(<Button>Test Content</Button>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should support different button types', () => {
      const { rerender } = render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');

      rerender(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');

      rerender(<Button type="button">Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should render icon-only button with fallback sr-only text', () => {
      render(
        <Button>
          <svg data-testid="icon" />
        </Button>
      );
      expect(screen.getByText('Button')).toHaveClass('sr-only');
    });

    it('should not render fallback sr-only when aria-label is provided', () => {
      render(
        <Button aria-label="Close menu">
          <svg data-testid="icon" />
        </Button>
      );
      expect(screen.queryByText('Button')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-input');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
    });

    it('should render icon size', () => {
      render(
        <Button size="icon" aria-label="Menu">
          <svg data-testid="icon" />
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('w-11');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not be clickable when disabled', async () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have disabled styling', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Loading State', () => {
    it('should be disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have aria-busy when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-disabled when loading', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should show loading sr-only text', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText('Loading, please wait')).toHaveClass('sr-only');
    });

    it('should not be clickable when loading', async () => {
      const handleClick = vi.fn();
      render(
        <Button isLoading onClick={handleClick}>
          Loading
        </Button>
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible name from children', () => {
      render(<Button>Submit Form</Button>);
      expect(
        screen.getByRole('button', { name: /submit form/i })
      ).toBeInTheDocument();
    });

    it('should support aria-label for icon buttons', () => {
      render(
        <Button aria-label="Close dialog">
          <svg data-testid="close-icon" />
        </Button>
      );
      expect(
        screen.getByRole('button', { name: 'Close dialog' })
      ).toBeInTheDocument();
    });

    it('should have focus ring styles for keyboard navigation', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ring');
    });

    it('should be focusable by keyboard', () => {
      render(<Button>Focus</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should not have aria-busy when not loading', () => {
      render(<Button>Normal</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-busy');
    });
  });

  describe('User Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Button onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Enter key press', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Button onClick={handleClick}>Press Enter</Button>);
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Space key press', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Button onClick={handleClick}>Press Space</Button>);
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should pass event object to onClick handler', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Button onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
      expect(handleClick.mock.calls[0][0].type).toBe('click');
    });
  });

  describe('asChild Composition', () => {
    it('should render as child element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/link');
      expect(link).toHaveClass('bg-primary');
    });

    it('should apply button classes to child element', () => {
      render(
        <Button asChild variant="destructive" size="lg">
          <a href="/delete">Delete Link</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-destructive');
      expect(link).toHaveClass('h-11');
    });

    it('should pass disabled state to asChild', () => {
      render(
        <Button asChild disabled>
          <a href="/link">Disabled Link</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-disabled', 'true');
    });

    it('should pass loading state to asChild', () => {
      render(
        <Button asChild isLoading>
          <a href="/link">Loading Link</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-busy', 'true');
      expect(link).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });

    it('should allow accessing DOM methods via ref', () => {
      const TestComponent = () => {
        const buttonRef = React.useRef<HTMLButtonElement>(null);
        return (
          <>
            <Button ref={buttonRef}>Button</Button>
            <button onClick={() => buttonRef.current?.focus()}>
              Focus Button
            </button>
          </>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Focus Button'));
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: /^button$/i })
      );
    });
  });

  describe('Event Handlers', () => {
    it('should support onMouseEnter and onMouseLeave', async () => {
      const onMouseEnter = vi.fn();
      const onMouseLeave = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <Button onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          Hover
        </Button>
      );

      const button = screen.getByRole('button');
      await user.hover(button);
      expect(onMouseEnter).toHaveBeenCalled();

      await user.unhover(button);
      expect(onMouseLeave).toHaveBeenCalled();
    });

    it('should support onFocus and onBlur', async () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <>
          <Button onFocus={onFocus} onBlur={onBlur}>
            Focus
          </Button>
          <button>Other</button>
        </>
      );

      await user.tab();
      expect(onFocus).toHaveBeenCalled();

      await user.tab();
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Combined States', () => {
    it('should handle disabled and loading together', () => {
      render(
        <Button disabled isLoading>
          Combined
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should handle variant and size together', () => {
      render(
        <Button variant="destructive" size="lg">
          Delete
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('h-11');
    });
  });
});

// Import React for ref test
import React from 'react';
