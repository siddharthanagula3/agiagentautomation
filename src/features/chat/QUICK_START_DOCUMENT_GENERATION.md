# Document Generation - Quick Start Guide

## 5-Minute Setup

### Step 1: Import the Hook and Components

```typescript
import { useDocumentGeneration } from '@features/chat/hooks/use-document-generation';
import { DocumentMessage } from '@features/chat/components/DocumentMessage';
import { EnhancedMarkdownRenderer } from '@features/chat/components/EnhancedMarkdownRenderer';
```

### Step 2: Add to Your Chat Component

```typescript
function YourChatComponent() {
  const { isGenerating, generateDocument, isDocumentRequest } = useDocumentGeneration();
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMsg = { id: crypto.randomUUID(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);

    // Check for document request
    if (isDocumentRequest(content)) {
      const document = await generateDocument(content);

      if (document) {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: document.content,
          metadata: { isDocument: true, documentData: document }
        }]);
      }
    }
    // ... rest of your chat logic
  };

  return (
    <div>
      {messages.map(msg => (
        msg.metadata?.isDocument ? (
          <DocumentMessage key={msg.id} document={msg.metadata.documentData} />
        ) : (
          <div key={msg.id}>{msg.content}</div>
        )
      ))}
    </div>
  );
}
```

### Step 3: Try It Out!

Send these messages in your chat:

```
"Create a report on AI trends in 2024"
"Write a technical documentation for REST APIs"
"Generate a proposal for implementing ChatGPT in customer service"
"Create a summary of machine learning algorithms"
```

## Common Use Cases

### 1. Simple Document Preview

```typescript
import { EnhancedMarkdownRenderer } from '@features/chat/components/EnhancedMarkdownRenderer';

<EnhancedMarkdownRenderer content={markdownContent} />
```

### 2. Document with Download Options

```typescript
import { DocumentMessage } from '@features/chat/components/DocumentMessage';

<DocumentMessage
  document={generatedDocument}
  onEnhance={(enhancement) => handleEnhance(enhancement)}
/>
```

### 3. Manual Export

```typescript
import { documentExportService } from '@features/chat/services/document-export-service';

// Export as PDF
await documentExportService.downloadAsPDF(content, 'document.pdf', {
  title: 'My Document',
  author: 'Your Name',
});
```

### 4. Enhance Existing Document

```typescript
const { enhanceDocument } = useDocumentGeneration();

const proofread = await enhanceDocument(content, 'proofread');
const expanded = await enhanceDocument(content, 'expand');
const summary = await enhanceDocument(content, 'summarize');
```

## Example: Full Chat Integration

```typescript
import React, { useState } from 'react';
import { useDocumentGeneration } from '@features/chat/hooks/use-document-generation';
import { DocumentMessage } from '@features/chat/components/DocumentMessage';

export function DocumentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const { isGenerating, generateDocument, isDocumentRequest } = useDocumentGeneration();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: input
    }]);

    // Generate document if request detected
    if (isDocumentRequest(input)) {
      const document = await generateDocument(input);

      if (document) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: document.content,
          metadata: { isDocument: true, documentData: document }
        }]);
      }
    }

    setInput('');
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'user' ? (
              <div className="text-right">
                <div className="inline-block bg-primary text-primary-foreground rounded-lg px-4 py-2">
                  {msg.content}
                </div>
              </div>
            ) : msg.metadata?.isDocument ? (
              <DocumentMessage document={msg.metadata.documentData} />
            ) : (
              <div className="bg-muted rounded-lg px-4 py-2">
                {msg.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or request a document..."
            className="flex-1 rounded-lg border px-4 py-2"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="rounded-lg bg-primary px-6 py-2 text-primary-foreground disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

## Trigger Phrases

These phrases will automatically trigger document generation:

**General Documents:**

- "create document"
- "write document"
- "generate document"
- "make a document"

**Reports:**

- "create report"
- "write report"
- "generate report"

**Articles:**

- "write article"
- "create article"

**Proposals:**

- "write proposal"
- "draft proposal"

**Documentation:**

- "write documentation"
- "create docs"

**Summaries:**

- "write summary"
- "create summary"
- "summarize this"

## Customization

### Custom Styling

```typescript
<DocumentMessage
  document={document}
  className="border-blue-500 shadow-xl"
/>

<EnhancedMarkdownRenderer
  content={content}
  className="prose-lg prose-headings:text-blue-600"
/>
```

### Disable Features

```typescript
<EnhancedMarkdownRenderer
  content={content}
  enableMath={false}        // Disable math rendering
  enableCodeCopy={false}    // Disable code copy button
/>
```

### Custom Export Options

```typescript
await documentExportService.exportDocument(content, 'pdf', 'my-document', {
  title: 'Custom Title',
  author: 'Your Name',
  metadata: {
    company: 'Your Company',
    date: new Date().toISOString(),
  },
});
```

## Troubleshooting

### Document Not Generating?

1. Check the console for errors
2. Verify your trigger phrase matches the keywords
3. Ensure Claude API is configured
4. Check network connectivity

### Export Not Working?

1. Check browser download permissions
2. Try a different format (MD, PDF, or DOCX)
3. Check browser console for errors
4. Verify content is not too large

### Styling Issues?

1. Import required CSS files:

```typescript
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';
```

2. Ensure Tailwind prose plugin is configured in `tailwind.config.js`:

```javascript
plugins: [
  require('@tailwindcss/typography'),
],
```

## Next Steps

- Read the [full documentation](./DOCUMENT_GENERATION.md)
- Check out [integration examples](./examples/document-generation-integration.tsx)
- Explore the [source code](./services/document-generation-service.ts)
- Join our community for support

## Tips for Best Results

1. **Be Specific**: The more specific your request, the better the result
   - ✅ "Create a technical report on REST API security best practices with code examples"
   - ❌ "make doc"

2. **Specify Document Type**: Include the type of document you want
   - "Write a **report** on..."
   - "Create an **article** about..."
   - "Draft a **proposal** for..."

3. **Mention Tone**: Specify formal, casual, technical, or creative
   - "Write a **formal technical** report..."
   - "Create a **casual** article..."

4. **Indicate Length**: Use short, medium, or long
   - "Write a **brief** summary..."
   - "Create a **comprehensive** report..."

5. **List Sections**: Specify required sections if needed
   - "Create a report with sections on: introduction, methodology, results, conclusions"

## Performance

- Document generation typically takes 5-15 seconds depending on length
- PDF export is instant (client-side)
- DOCX export is instant (client-side)
- No server upload required for exports

## Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Support

For issues or questions:

- Check the [troubleshooting section](#troubleshooting)
- Review the [full documentation](./DOCUMENT_GENERATION.md)
- File an issue on GitHub
- Contact support

---

**Happy Document Generation! 🚀**
