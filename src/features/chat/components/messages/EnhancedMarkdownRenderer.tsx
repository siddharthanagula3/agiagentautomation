/**
 * Enhanced Markdown Renderer
 *
 * Comprehensive markdown rendering with all features:
 * - Headers (H1-H6)
 * - Bold, italic, strikethrough
 * - Lists (ordered, unordered, task lists)
 * - Tables with styling
 * - Code blocks with syntax highlighting
 * - Blockquotes
 * - Links and images
 * - Footnotes
 * - Math (KaTeX)
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/ui/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

// Import highlight.js styles and KaTeX styles
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

interface EnhancedMarkdownRendererProps {
  content: string;
  className?: string;
  enableMath?: boolean;
  enableCodeCopy?: boolean;
}

// Custom code block component with copy button and syntax highlighting
const CodeBlock = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inline code
  if (!match) {
    return (
      <code
        className={cn(
          'rounded bg-muted px-1.5 py-0.5 font-mono text-sm',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  // Code block with syntax highlighting
  return (
    <div className="group relative my-4">
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-gray-900 dark:bg-gray-950">
        {language && (
          <div className="border-b border-gray-700 px-4 py-2">
            <span className="text-xs font-medium text-gray-400">
              {language}
            </span>
          </div>
        )}
        <pre className="m-0 p-4">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    </div>
  );
};

// Custom table components with enhanced styling
const TableComponent = ({ children }: { children: React.ReactNode }) => (
  <div className="my-4 overflow-x-auto rounded-lg border border-border">
    <table className="w-full border-collapse">{children}</table>
  </div>
);

const TableHead = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-muted/50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="divide-y divide-border">{children}</tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="transition-colors hover:bg-muted/30">{children}</tr>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left text-sm font-semibold">{children}</th>
);

const TableCell = ({ children }: { children: React.ReactNode }) => (
  <td className="px-4 py-3 text-sm">{children}</td>
);

// Custom link component with external link indicator
const LinkComponent = ({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) => {
  const isExternal = href?.startsWith('http');
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
    >
      {children}
      {isExternal && (
        <span className="ml-1 inline-block text-xs opacity-60">↗</span>
      )}
    </a>
  );
};

// Custom image component with lazy loading
const ImageComponent = ({ src, alt }: { src?: string; alt?: string }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    className="my-4 max-w-full rounded-lg border border-border shadow-sm"
  />
);

// Custom blockquote component
const BlockquoteComponent = ({ children }: { children: React.ReactNode }) => (
  <blockquote className="my-4 border-l-4 border-primary/30 bg-muted/30 py-3 pl-4 pr-4 italic">
    {children}
  </blockquote>
);

// Custom horizontal rule
const HorizontalRule = () => <hr className="my-8 border-t border-border" />;

// Custom list components
const OrderedList = ({ children }: { children: React.ReactNode }) => (
  <ol className="my-4 ml-6 list-decimal space-y-2">{children}</ol>
);

const UnorderedList = ({ children }: { children: React.ReactNode }) => (
  <ul className="my-4 ml-6 list-disc space-y-2">{children}</ul>
);

const ListItem = ({ children }: { children: React.ReactNode }) => {
  // Check if this is a task list item
  const childText = React.Children.toArray(children)[0];
  if (typeof childText === 'string') {
    const taskMatch = childText.match(/^\[([ x])\]\s(.*)$/);
    if (taskMatch) {
      const [, checked, text] = taskMatch;
      return (
        <li className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={checked === 'x'}
            readOnly
            className="mt-1 h-4 w-4 rounded border-border"
          />
          <span className={checked === 'x' ? 'line-through opacity-60' : ''}>
            {text}
          </span>
        </li>
      );
    }
  }
  return <li>{children}</li>;
};

// Enhanced markdown components
const markdownComponents: Components = {
  code: CodeBlock as React.ComponentType<
    React.HTMLAttributes<HTMLElement> & { inline?: boolean }
  >,
  h1: ({ children }) => (
    <h1 className="mb-4 mt-8 scroll-m-20 border-b border-border pb-2 text-3xl font-bold tracking-tight first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 scroll-m-20 text-xl font-semibold tracking-tight">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 scroll-m-20 text-lg font-semibold tracking-tight">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="mb-2 mt-3 scroll-m-20 text-base font-semibold tracking-tight">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="mb-2 mt-3 scroll-m-20 text-sm font-semibold tracking-tight">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="mb-4 leading-7 [&:not(:first-child)]:mt-4">{children}</p>
  ),
  table: TableComponent as React.ComponentType<{ children: React.ReactNode }>,
  thead: TableHead as React.ComponentType<{ children: React.ReactNode }>,
  tbody: TableBody as React.ComponentType<{ children: React.ReactNode }>,
  tr: TableRow as React.ComponentType<{ children: React.ReactNode }>,
  th: TableHeader as React.ComponentType<{ children: React.ReactNode }>,
  td: TableCell as React.ComponentType<{ children: React.ReactNode }>,
  a: LinkComponent as React.ComponentType<{
    href?: string;
    children: React.ReactNode;
  }>,
  img: ImageComponent as React.ComponentType<{ src?: string; alt?: string }>,
  blockquote: BlockquoteComponent as React.ComponentType<{
    children: React.ReactNode;
  }>,
  hr: HorizontalRule as React.ComponentType<Record<string, never>>,
  ol: OrderedList as React.ComponentType<{ children: React.ReactNode }>,
  ul: UnorderedList as React.ComponentType<{ children: React.ReactNode }>,
  li: ListItem as React.ComponentType<{ children: React.ReactNode }>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => (
    <del className="line-through opacity-70">{children}</del>
  ),
};

export const EnhancedMarkdownRenderer: React.FC<
  EnhancedMarkdownRendererProps
> = ({ content, className, enableMath = true, enableCodeCopy = true }) => {
  // Build remark plugins
  const remarkPlugins = [remarkGfm, remarkBreaks];
  if (enableMath) {
    remarkPlugins.push(remarkMath);
  }

  // Build rehype plugins
  const rehypePlugins: unknown[] = [rehypeHighlight, rehypeRaw];
  if (enableMath) {
    rehypePlugins.push(rehypeKatex);
  }

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-headings:scroll-m-20',
        'prose-p:leading-7',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-blockquote:border-l-primary/30 prose-blockquote:bg-muted/30',
        'prose-code:text-foreground',
        'prose-pre:bg-gray-900 prose-pre:text-gray-100',
        'prose-img:rounded-lg prose-img:shadow-md',
        'prose-hr:border-border',
        'prose-strong:font-semibold prose-strong:text-foreground',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default EnhancedMarkdownRenderer;
