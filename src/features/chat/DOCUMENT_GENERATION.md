# Document Generation Feature

## Overview

The Document Generation feature enables users to create high-quality documents directly from chat using Claude AI. It supports multiple document types, formats, and provides advanced markdown rendering with download capabilities.

## Features

### 1. Document Types Supported
- **Reports**: Comprehensive reports with executive summaries and recommendations
- **Articles**: Engaging articles with clear structure
- **Summaries**: Concise summaries of information
- **Proposals**: Persuasive proposals with objectives and timelines
- **Documentation**: Technical documentation with code examples
- **General Documents**: Well-structured general-purpose documents

### 2. Export Formats
- **Markdown (.md)**: Native markdown format with YAML frontmatter
- **PDF (.pdf)**: Professional PDF documents with formatting
- **Word (.docx)**: Microsoft Word documents with styles

### 3. Enhanced Markdown Rendering
The feature includes a comprehensive markdown renderer with support for:

- **Headers**: H1-H6 with consistent styling
- **Text Formatting**: Bold, italic, strikethrough
- **Lists**:
  - Ordered lists (1, 2, 3...)
  - Unordered lists (bullets)
  - Task lists with checkboxes
- **Tables**: Fully styled tables with borders and hover effects
- **Code Blocks**:
  - Syntax highlighting (via highlight.js)
  - Copy button on hover
  - Language indicators
- **Blockquotes**: Styled quotes with left border
- **Links**: External links with indicator
- **Images**: Lazy-loaded with borders and shadows
- **Math**: KaTeX support for mathematical equations
- **Footnotes**: GitHub Flavored Markdown footnotes

### 4. AI Enhancement Options
Documents can be enhanced using Claude:
- **Proofread**: Fix grammatical errors and typos
- **Expand**: Add more details and examples
- **Summarize**: Create concise version
- **Restructure**: Improve flow and organization

## Architecture

### Core Components

```
src/features/chat/
├── services/
│   ├── document-generation-service.ts    # Document generation logic
│   └── document-export-service.ts        # Export to MD/PDF/DOCX
├── components/
│   ├── EnhancedMarkdownRenderer.tsx      # Advanced markdown rendering
│   ├── DocumentMessage.tsx               # Document display component
│   └── DocumentActions.tsx               # Download & enhancement UI
├── hooks/
│   └── use-document-generation.ts        # React hook for document generation
└── examples/
    └── document-generation-integration.tsx  # Integration examples
```

### Service Layer

#### document-generation-service.ts
```typescript
// Detects document requests
isDocumentRequest(message: string): boolean

// Parses request details
parseDocumentRequest(message: string): DocumentRequest

// Generates document with Claude
generateDocument(request: DocumentRequest): Promise<GeneratedDocument>

// Enhances existing document
enhanceDocument(content: string, enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure'): Promise<string>
```

#### document-export-service.ts
```typescript
// Export to markdown
downloadAsMarkdown(content: string, filename: string, options?: ExportOptions): Promise<void>

// Export to PDF
downloadAsPDF(content: string, filename: string, options?: ExportOptions): Promise<void>

// Export to Word
downloadAsDOCX(content: string, filename: string, options?: ExportOptions): Promise<void>

// Unified export function
exportDocument(content: string, format: DocumentFormat, filename: string, options?: ExportOptions): Promise<void>
```

## Usage

### Basic Usage

```typescript
import { useDocumentGeneration } from '@features/chat/hooks/use-document-generation';
import { DocumentMessage } from '@features/chat/components/DocumentMessage';

function ChatComponent() {
  const { isGenerating, generateDocument, isDocumentRequest } = useDocumentGeneration();

  const handleMessage = async (message: string) => {
    if (isDocumentRequest(message)) {
      const document = await generateDocument(message, sessionId);
      // Display document
    }
  };

  return (
    <div>
      {document && <DocumentMessage document={document} />}
    </div>
  );
}
```

### Document Request Detection

The system automatically detects document requests using keywords:

```typescript
// These phrases trigger document generation:
"create document"
"write document"
"generate document"
"write report"
"create article"
"draft proposal"
"write summary"
"create documentation"
// ... and many more
```

### Generating Documents

```typescript
const document = await generateDocument(
  "Create a comprehensive report on AI adoption in healthcare",
  sessionId
);

// Returns:
{
  title: "AI Adoption in Healthcare",
  content: "# AI Adoption in Healthcare\n\n...",
  metadata: {
    type: "report",
    generatedAt: Date,
    wordCount: 1500,
    tokensUsed: 2000,
    model: "claude-3-5-sonnet"
  }
}
```

### Enhancing Documents

```typescript
const enhancedContent = await enhanceDocument(
  originalContent,
  'proofread',  // or 'expand', 'summarize', 'restructure'
  sessionId
);
```

### Exporting Documents

```typescript
import { documentExportService } from '@features/chat/services/document-export-service';

// Export as PDF
await documentExportService.downloadAsPDF(
  content,
  'my-document.pdf',
  {
    title: 'My Document',
    author: 'John Doe'
  }
);

// Export as Word
await documentExportService.downloadAsDOCX(
  content,
  'my-document.docx',
  {
    title: 'My Document',
    author: 'John Doe'
  }
);

// Export as Markdown
await documentExportService.downloadAsMarkdown(
  content,
  'my-document.md',
  {
    metadata: {
      title: 'My Document',
      author: 'John Doe',
      date: new Date().toISOString()
    }
  }
);
```

### Complete Integration Example

```typescript
import { useDocumentGeneration } from '@features/chat/hooks/use-document-generation';
import { DocumentMessage } from '@features/chat/components/DocumentMessage';
import type { GeneratedDocument } from '@features/chat/services/document-generation-service';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [enhancingId, setEnhancingId] = useState(null);

  const {
    isGenerating,
    generateDocument,
    enhanceDocument,
    isDocumentRequest
  } = useDocumentGeneration();

  const handleSendMessage = async (content: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);

    // Check if document request
    if (isDocumentRequest(content)) {
      const document = await generateDocument(content, sessionId);

      if (document) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: document.content,
          metadata: {
            isDocument: true,
            documentData: document
          }
        }]);
      }
    } else {
      // Regular chat logic
      // ...
    }
  };

  const handleEnhance = async (
    messageId: string,
    enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure'
  ) => {
    setEnhancingId(messageId);
    const message = messages.find(m => m.id === messageId);

    const enhanced = await enhanceDocument(
      message.content,
      enhancement,
      sessionId
    );

    if (enhanced) {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, content: enhanced } : m
      ));
    }

    setEnhancingId(null);
  };

  return (
    <div>
      {messages.map(message => (
        message.metadata?.isDocument ? (
          <DocumentMessage
            key={message.id}
            document={message.metadata.documentData}
            onEnhance={(enhancement) => handleEnhance(message.id, enhancement)}
            isEnhancing={enhancingId === message.id}
          />
        ) : (
          <div key={message.id}>{message.content}</div>
        )
      ))}
    </div>
  );
}
```

## Component Reference

### EnhancedMarkdownRenderer

Renders markdown with full feature support.

```typescript
<EnhancedMarkdownRenderer
  content={markdownContent}
  className="my-custom-class"
  enableMath={true}
  enableCodeCopy={true}
/>
```

**Props:**
- `content` (string): Markdown content to render
- `className?` (string): Additional CSS classes
- `enableMath?` (boolean): Enable KaTeX math rendering (default: true)
- `enableCodeCopy?` (boolean): Enable copy button on code blocks (default: true)

### DocumentMessage

Displays a generated document with all features.

```typescript
<DocumentMessage
  document={generatedDocument}
  onEnhance={(enhancement) => handleEnhance(enhancement)}
  isEnhancing={false}
  className="my-custom-class"
/>
```

**Props:**
- `document` (GeneratedDocument): The generated document object
- `onEnhance?` (function): Callback for document enhancement
- `isEnhancing?` (boolean): Whether document is being enhanced
- `className?` (string): Additional CSS classes

### DocumentActions

Provides download and enhancement actions.

```typescript
<DocumentActions
  content={documentContent}
  title="My Document"
  author="John Doe"
  onEnhance={(enhancement) => handleEnhance(enhancement)}
  variant="default" // or "compact"
  className="my-custom-class"
/>
```

**Props:**
- `content` (string): Document content
- `title?` (string): Document title
- `author?` (string): Document author
- `onEnhance?` (function): Callback for enhancement
- `variant?` ('default' | 'compact'): UI variant
- `className?` (string): Additional CSS classes

## Styling

The components use Tailwind CSS and follow the application's design system:

- Light/dark mode support via `prose-sm dark:prose-invert`
- Consistent spacing and typography
- Hover effects and transitions
- Responsive design (mobile-friendly)
- Accessible components

### Customization

```typescript
// Custom styling for markdown
<EnhancedMarkdownRenderer
  content={content}
  className="prose-lg prose-headings:text-primary"
/>

// Custom card styling for documents
<DocumentMessage
  document={document}
  className="border-blue-500"
/>
```

## API Integration

### Claude API (Anthropic)

The service uses the unified LLM service with Claude as the preferred provider:

```typescript
import { unifiedLLMService } from '@core/integrations/chat-completion-handler';

const response = await unifiedLLMService.sendMessage(
  messages,
  sessionId,
  userId,
  'anthropic' // Claude provider
);
```

### System Prompts

Document generation uses specialized system prompts optimized for each document type:

```typescript
// Report generation
"Create a comprehensive report with clear sections, data-driven insights,
and professional formatting. Include an executive summary, methodology,
findings, and recommendations."

// Article generation
"Write an engaging article with a compelling introduction, well-developed
body sections, and a strong conclusion. Use clear headings and maintain
reader interest throughout."
```

## Best Practices

### 1. Document Request Formatting

Be specific in your requests:
```
✅ "Create a technical report on machine learning best practices with code examples"
✅ "Write a formal proposal for implementing AI in customer service"
❌ "make doc"
❌ "create something"
```

### 2. Document Enhancement

Use enhancement features strategically:
- **Proofread**: Before finalizing documents
- **Expand**: When you need more detail
- **Summarize**: For executive summaries
- **Restructure**: To improve flow

### 3. Export Format Selection

- **Markdown**: For version control, editing, web publishing
- **PDF**: For sharing, printing, archiving
- **DOCX**: For further editing in Word, collaboration

### 4. Performance Optimization

- Documents are generated asynchronously
- Loading states are provided via `isGenerating`
- Large documents use expandable previews
- Exports happen client-side (no server upload needed)

## Error Handling

```typescript
const { isGenerating, error, generateDocument } = useDocumentGeneration();

try {
  const document = await generateDocument(message, sessionId);
  if (!document) {
    // Handle generation failure
    console.error('Document generation failed:', error);
  }
} catch (err) {
  // Handle error
  toast.error('Failed to generate document');
}
```

## Testing

### Unit Tests

```typescript
import { documentGenerationService } from './document-generation-service';

test('detects document requests', () => {
  expect(documentGenerationService.isDocumentRequest('create a report')).toBe(true);
  expect(documentGenerationService.isDocumentRequest('hello')).toBe(false);
});

test('parses document requests', () => {
  const request = documentGenerationService.parseDocumentRequest(
    'Write a formal technical report on AI'
  );
  expect(request.type).toBe('report');
  expect(request.tone).toBe('formal');
});
```

### Integration Tests

```typescript
test('generates and exports document', async () => {
  const document = await generateDocument('Create a summary of AI trends');
  expect(document).toBeDefined();
  expect(document.title).toBeDefined();
  expect(document.content).toContain('#');

  // Test export
  await documentExportService.downloadAsPDF(document.content, 'test.pdf');
});
```

## Troubleshooting

### Document Not Generating

1. Check if request matches detection keywords
2. Verify Claude API credentials
3. Check network connectivity
4. Review browser console for errors

### Export Failing

1. Check browser download permissions
2. Verify file size is reasonable
3. Check for special characters in filename
4. Review browser console for PDF/DOCX generation errors

### Rendering Issues

1. Verify markdown syntax is correct
2. Check for missing highlight.js/KaTeX styles
3. Test in different browsers
4. Review custom CSS conflicts

## Future Enhancements

- [ ] Multi-language document generation
- [ ] Custom templates
- [ ] Collaborative editing
- [ ] Version history
- [ ] Export to additional formats (HTML, LaTeX)
- [ ] Batch document generation
- [ ] Document comparison/diff
- [ ] AI-powered document analysis

## Dependencies

```json
{
  "react-markdown": "^10.1.0",
  "remark-gfm": "^4.0.1",
  "remark-math": "^6.0.0",
  "remark-breaks": "^4.0.0",
  "rehype-highlight": "^7.0.2",
  "rehype-katex": "^7.0.1",
  "rehype-raw": "^7.0.0",
  "jspdf": "^2.x.x",
  "docx": "^8.x.x",
  "highlight.js": "^11.x.x",
  "katex": "^0.16.x"
}
```

## License

This feature is part of the AGI Agent Automation platform and follows the same license.
