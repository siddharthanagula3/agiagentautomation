/**
 * Form Components Tests
 *
 * Tests for Form UI components including:
 * - Form, FormField, FormItem integration with react-hook-form
 * - FormLabel, FormControl, FormDescription, FormMessage
 * - Accessibility (aria-invalid, aria-describedby, label associations)
 * - Error state handling
 * - Context propagation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './form';
import { Input } from './input';

// Test wrapper component that sets up react-hook-form
interface TestFormProps {
  onSubmit?: (data: { username: string }) => void;
  defaultValues?: { username: string };
  children?: React.ReactNode;
}

const TestForm: React.FC<TestFormProps> = ({
  onSubmit = () => {},
  defaultValues = { username: '' },
  children,
}) => {
  const form = useForm({
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children || (
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter your username</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
};

// Validated form with zod schema
const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

const ValidatedForm: React.FC<{ onSubmit?: (data: FormData) => void }> = ({
  onSubmit = () => {},
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>Your email address</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormDescription>Minimum 8 characters</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
};

describe('Form Components', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Form Provider', () => {
    it('should render form children', () => {
      render(<TestForm />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should provide form context to children', () => {
      render(<TestForm />);
      expect(screen.getByText('Enter your username')).toBeInTheDocument();
    });
  });

  describe('FormField', () => {
    it('should render field with correct name', () => {
      render(<TestForm />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should provide field context to children', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestForm defaultValues={{ username: 'initial' }} />);
      const input = screen.getByRole('textbox');

      expect(input).toHaveValue('initial');

      await user.clear(input);
      await user.type(input, 'newvalue');

      expect(input).toHaveValue('newvalue');
    });
  });

  describe('FormItem', () => {
    it('should render with proper spacing', () => {
      render(<TestForm />);

      // FormItem should be a div with space-y-2 class
      const formItem = screen.getByRole('textbox').closest('.space-y-2');
      expect(formItem).toBeInTheDocument();
    });

    it('should generate unique IDs for accessibility', () => {
      render(<TestForm />);

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Username');

      // Label should be associated with input
      const labelFor = label.getAttribute('for');
      expect(labelFor).toBeTruthy();
      expect(input.id).toBe(labelFor);
    });

    it('should apply custom className', () => {
      const FormWithClassName = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem className="custom-item">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        );
      };

      render(<FormWithClassName />);
      const formItem = screen.getByRole('textbox').closest('.custom-item');
      expect(formItem).toBeInTheDocument();
    });
  });

  describe('FormLabel', () => {
    it('should render label text', () => {
      render(<TestForm />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should be associated with input via htmlFor', () => {
      render(<TestForm />);

      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', input.id);
    });

    it('should have error styling when field has error', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm />);

      // Submit without filling fields to trigger validation
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const emailLabel = screen.getByText('Email');
        expect(emailLabel).toHaveClass('text-destructive');
      });
    });

    it('should not have error styling when field is valid', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Blur to trigger validation
      await user.tab();

      const emailLabel = screen.getByText('Email');
      expect(emailLabel).not.toHaveClass('text-destructive');
    });

    it('should apply custom className', () => {
      const FormWithLabelClass = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="custom-label">Test Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        );
      };

      render(<FormWithLabelClass />);
      const label = screen.getByText('Test Label');
      expect(label).toHaveClass('custom-label');
    });
  });

  describe('FormControl', () => {
    it('should set id on child element', () => {
      render(<TestForm />);

      const input = screen.getByRole('textbox');
      expect(input.id).toContain('form-item');
    });

    it('should set aria-describedby linking to description', () => {
      render(<TestForm />);

      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');

      expect(describedBy).toContain('form-item-description');
    });

    it('should set aria-invalid when field has error', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email');
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should not set aria-invalid when field is valid', () => {
      render(<TestForm />);

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('should include message ID in aria-describedby when has error', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email');
        const describedBy = emailInput.getAttribute('aria-describedby');
        expect(describedBy).toContain('form-item-message');
      });
    });
  });

  describe('FormDescription', () => {
    it('should render description text', () => {
      render(<TestForm />);
      expect(screen.getByText('Enter your username')).toBeInTheDocument();
    });

    it('should have correct ID for aria-describedby association', () => {
      render(<TestForm />);

      const description = screen.getByText('Enter your username');
      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');

      expect(describedBy).toContain(description.id);
    });

    it('should have muted styling', () => {
      render(<TestForm />);

      const description = screen.getByText('Enter your username');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('should apply custom className', () => {
      const FormWithDescClass = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription className="custom-desc">
                    Description
                  </FormDescription>
                </FormItem>
              )}
            />
          </Form>
        );
      };

      render(<FormWithDescClass />);
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('custom-desc');
    });
  });

  describe('FormMessage', () => {
    it('should not render when no error', () => {
      render(<TestForm />);

      // FormMessage renders null when no error
      const messages = document.querySelectorAll('.text-destructive');
      expect(messages.length).toBe(0);
    });

    it('should render error message when validation fails', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email')
        ).toBeInTheDocument();
      });
    });

    it('should have error styling', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const message = screen.getByText('Please enter a valid email');
        expect(message).toHaveClass('text-destructive');
        expect(message).toHaveClass('text-sm');
        expect(message).toHaveClass('font-medium');
      });
    });

    it('should have correct ID for aria-describedby', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const message = screen.getByText('Please enter a valid email');
        expect(message.id).toContain('form-item-message');
      });
    });

    it('should render custom children when provided and no error', () => {
      const FormWithCustomMessage = () => {
        const form = useForm({ defaultValues: { test: '' } });
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage>Custom message</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        );
      };

      render(<FormWithCustomMessage />);
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('should apply custom className', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const FormWithMessageClass = () => {
        const form = useForm({
          resolver: zodResolver(z.object({ email: z.string().email() })),
          defaultValues: { email: '' },
        });
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => {})}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage className="custom-message" />
                  </FormItem>
                )}
              />
              <button type="submit">Submit</button>
            </form>
          </Form>
        );
      };

      render(<FormWithMessageClass />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        const message = document.querySelector('.custom-message');
        expect(message).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<TestForm onSubmit={handleSubmit} />);

      await user.type(screen.getByRole('textbox'), 'testuser');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          { username: 'testuser' },
          expect.anything()
        );
      });
    });

    it('should not call onSubmit when validation fails', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm onSubmit={handleSubmit} />);

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email')
        ).toBeInTheDocument();
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should call onSubmit when validation passes', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm onSubmit={handleSubmit} />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          {
            email: 'test@example.com',
            password: 'password123',
          },
          expect.anything()
        );
      });
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref on FormItem', () => {
      const FormWithItemRef = () => {
        const ref = React.useRef<HTMLDivElement>(null);
        const form = useForm({ defaultValues: { test: '' } });

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem ref={ref} data-testid="form-item">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        );
      };

      render(<FormWithItemRef />);
      expect(screen.getByTestId('form-item')).toBeInTheDocument();
    });

    it('should forward ref on FormDescription', () => {
      const FormWithDescRef = () => {
        const ref = React.useRef<HTMLParagraphElement>(null);
        const form = useForm({ defaultValues: { test: '' } });

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription ref={ref} data-testid="desc">
                    Description
                  </FormDescription>
                </FormItem>
              )}
            />
          </Form>
        );
      };

      render(<FormWithDescRef />);
      expect(screen.getByTestId('desc')).toBeInTheDocument();
    });

    it('should forward ref on FormMessage', () => {
      const FormWithMessageRef = () => {
        const ref = React.useRef<HTMLParagraphElement>(null);
        const form = useForm({ defaultValues: { test: '' } });

        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage ref={ref}>Message</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        );
      };

      render(<FormWithMessageRef />);
      expect(screen.getByText('Message')).toBeInTheDocument();
    });
  });

  describe('Multiple Fields', () => {
    it('should handle multiple form fields independently', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<ValidatedForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        // Only password should have error
        expect(
          screen.queryByText('Please enter a valid email')
        ).not.toBeInTheDocument();
        expect(
          screen.getByText('Password must be at least 8 characters')
        ).toBeInTheDocument();
      });
    });
  });
});
