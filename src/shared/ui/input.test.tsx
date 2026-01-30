/**
 * Input Component Tests
 *
 * Tests for the Input UI component including:
 * - Rendering with different types and props
 * - Error states and validation
 * - Accessibility attributes (aria-invalid, aria-describedby)
 * - User interactions (typing, focus, blur)
 * - Controlled and uncontrolled modes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Input } from './input';

describe('Input Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('should render with value', () => {
      render(<Input value="test value" readOnly />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test value');
    });

    it('should render with defaultValue', () => {
      render(<Input defaultValue="default value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default value');
    });

    it('should render with name attribute', () => {
      render(<Input name="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });

    it('should render with id attribute', () => {
      render(<Input id="my-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'my-input');
    });
  });

  describe('Input Types', () => {
    it('should render text input by default', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      // When type is undefined, browsers treat it as text but don't set the attribute
      expect(input.getAttribute('type')).toBeNull();
    });

    it('should render email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render search input', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render tel input', () => {
      render(<Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render url input', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const handleChange = vi.fn();

      render(<Input disabled onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should have disabled styling', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Read-Only State', () => {
    it('should be read-only when readOnly prop is true', () => {
      render(<Input readOnly value="Read only text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readOnly');
    });

    it('should not accept input when read-only', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Input readOnly value="fixed" />);
      const input = screen.getByRole('textbox');

      await user.type(input, ' more text');
      expect(input).toHaveValue('fixed');
    });
  });

  describe('Required State', () => {
    it('should be required when required prop is true', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });
  });

  describe('Error State', () => {
    it('should have aria-invalid when hasError is true', () => {
      render(<Input hasError />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have error styling when hasError is true', () => {
      render(<Input hasError />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive');
    });

    it('should respect explicit aria-invalid over hasError', () => {
      render(<Input hasError aria-invalid={false} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have aria-invalid=false when hasError is false', () => {
      render(<Input hasError={false} />);
      const input = screen.getByRole('textbox');
      // The component sets aria-invalid="false" when hasError is explicitly false
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should link to error message via aria-describedby', () => {
      render(
        <>
          <Input hasError errorMessageId="error-msg" />
          <span id="error-msg">This field is required</span>
        </>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-msg');
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Email address" />);
      expect(
        screen.getByRole('textbox', { name: 'Email address' })
      ).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
      render(
        <>
          <label id="label">Username</label>
          <Input aria-labelledby="label" />
        </>
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-labelledby', 'label');
    });

    it('should combine aria-describedby with errorMessageId', () => {
      render(
        <>
          <Input aria-describedby="hint" errorMessageId="error" />
          <span id="hint">Enter your full name</span>
          <span id="error">Name is required</span>
        </>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'hint error');
    });

    it('should have focus ring styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:outline-none');
      expect(input).toHaveClass('focus-visible:ring-2');
      expect(input).toHaveClass('focus-visible:ring-ring');
    });

    it('should be focusable', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when typing', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'hello');
      expect(handleChange).toHaveBeenCalledTimes(5);
    });

    it('should update value when typing in uncontrolled mode', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test value');
      expect(input).toHaveValue('test value');
    });

    it('should call onFocus when focused', async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when losing focus', async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <>
          <Input onBlur={handleBlur} />
          <button>Other</button>
        </>
      );

      await user.tab(); // Focus input
      await user.tab(); // Move to button
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should call onKeyDown when key is pressed', async () => {
      const handleKeyDown = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Input onKeyDown={handleKeyDown} />);
      const input = screen.getByRole('textbox');

      input.focus();
      await user.keyboard('{Enter}');
      expect(handleKeyDown).toHaveBeenCalled();
    });

    it('should support paste events', async () => {
      const handlePaste = vi.fn();

      render(<Input onPaste={handlePaste} />);
      const input = screen.getByRole('textbox');

      fireEvent.paste(input, {
        clipboardData: { getData: () => 'pasted text' },
      });

      expect(handlePaste).toHaveBeenCalled();
    });
  });

  describe('Controlled Mode', () => {
    it('should work as controlled input', async () => {
      const ControlledInput = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
        );
      };

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<ControlledInput />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'controlled');
      expect(input).toHaveValue('controlled');
    });

    it('should not change when value is controlled and no onChange', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // This should show console warning but maintain value
      render(<Input value="fixed" onChange={() => {}} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'extra');
      expect(input).toHaveValue('fixed');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    });

    it('should allow programmatic focus via ref', () => {
      const TestComponent = () => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        return (
          <>
            <Input ref={inputRef} />
            <button onClick={() => inputRef.current?.focus()}>Focus</button>
          </>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Focus'));
      expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });

    it('should allow programmatic value setting via ref', () => {
      const TestComponent = () => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        return (
          <>
            <Input ref={inputRef} />
            <button
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.value = 'set via ref';
                }
              }}
            >
              Set Value
            </button>
          </>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Set Value'));
      expect(screen.getByRole('textbox')).toHaveValue('set via ref');
    });
  });

  describe('Input Attributes', () => {
    it('should support maxLength', () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '10');
    });

    it('should support minLength', () => {
      render(<Input minLength={3} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('minLength', '3');
    });

    it('should support pattern', () => {
      render(<Input pattern="[A-Za-z]+" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    });

    it('should support autocomplete', () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });

    it('should support autofocus', () => {
      render(<Input autoFocus />);
      const input = screen.getByRole('textbox');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Styling', () => {
    it('should have base styling classes', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-md');
      expect(input).toHaveClass('border');
    });

    it('should have error styling when hasError', () => {
      render(<Input hasError />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive');
      expect(input).toHaveClass('focus-visible:ring-destructive');
    });

    it('should merge custom classes with base classes', () => {
      render(<Input className="my-4 text-lg" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('my-4');
      expect(input).toHaveClass('text-lg');
      expect(input).toHaveClass('flex'); // Base class still present
    });
  });

  describe('Number Input Specific', () => {
    it('should support min and max for number input', () => {
      render(<Input type="number" min={0} max={100} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should support step for number input', () => {
      render(<Input type="number" step={0.1} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', '0.1');
    });
  });
});
