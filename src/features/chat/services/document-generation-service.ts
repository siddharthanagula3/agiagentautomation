/**
 * Document Generation Service
 *
 * Uses Claude API to generate high-quality documents in various formats
 * Detects document generation requests and produces formatted content
 */

import { unifiedLLMService } from '@core/ai/llm/unified-language-model';
import type { UnifiedMessage } from '@core/ai/llm/unified-language-model';

export type DocumentFormat = 'markdown' | 'pdf' | 'docx';

export interface DocumentRequest {
  type: 'report' | 'article' | 'summary' | 'proposal' | 'documentation' | 'general';
  topic: string;
  requirements?: string;
  tone?: 'formal' | 'casual' | 'technical' | 'creative';
  length?: 'short' | 'medium' | 'long';
  sections?: string[];
}

export interface GeneratedDocument {
  title: string;
  content: string;
  metadata: {
    type: string;
    generatedAt: Date;
    wordCount: number;
    tokensUsed?: number;
    model?: string;
  };
}

/**
 * Detects if a user message is requesting document generation
 */
export function isDocumentRequest(message: string): boolean {
  const documentKeywords = [
    'create document',
    'write document',
    'generate document',
    'create a document',
    'write a document',
    'generate a document',
    'write report',
    'create report',
    'generate report',
    'write article',
    'create article',
    'write proposal',
    'create proposal',
    'draft proposal',
    'write summary',
    'create summary',
    'generate summary',
    'write documentation',
    'create documentation',
    'generate pdf',
    'create pdf',
    'make a document',
    'make document',
    'prepare document',
    'draft document',
    'compose document',
  ];

  const lowerMessage = message.toLowerCase();
  return documentKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Extracts document request details from user message
 */
export function parseDocumentRequest(message: string): DocumentRequest {
  const lowerMessage = message.toLowerCase();

  // Detect document type
  let type: DocumentRequest['type'] = 'general';
  if (lowerMessage.includes('report')) type = 'report';
  else if (lowerMessage.includes('article')) type = 'article';
  else if (lowerMessage.includes('summary')) type = 'summary';
  else if (lowerMessage.includes('proposal')) type = 'proposal';
  else if (lowerMessage.includes('documentation') || lowerMessage.includes('docs')) type = 'documentation';

  // Detect tone
  let tone: DocumentRequest['tone'] = 'formal';
  if (lowerMessage.includes('casual') || lowerMessage.includes('informal')) tone = 'casual';
  else if (lowerMessage.includes('technical')) tone = 'technical';
  else if (lowerMessage.includes('creative')) tone = 'creative';

  // Detect length
  let length: DocumentRequest['length'] = 'medium';
  if (lowerMessage.includes('short') || lowerMessage.includes('brief')) length = 'short';
  else if (lowerMessage.includes('long') || lowerMessage.includes('detailed') || lowerMessage.includes('comprehensive')) length = 'long';

  return {
    type,
    topic: message,
    tone,
    length,
  };
}

/**
 * Generates document content using Claude API
 */
export async function generateDocument(
  request: DocumentRequest,
  userId?: string,
  sessionId?: string
): Promise<GeneratedDocument> {
  // Build system prompt for document generation
  const systemPrompt = buildDocumentGenerationPrompt(request);

  // Build user message
  const userMessage = buildDocumentRequest(request);

  const messages: UnifiedMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    // Use Claude (Anthropic) as the preferred provider for document generation
    const response = await unifiedLLMService.sendMessage(
      messages,
      sessionId,
      userId,
      'anthropic' // Claude is best for high-quality content generation
    );

    // Extract title from content (first # heading)
    const titleMatch = response.content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} Document`;

    // Calculate word count
    const wordCount = response.content.split(/\s+/).length;

    return {
      title,
      content: response.content,
      metadata: {
        type: request.type,
        generatedAt: new Date(),
        wordCount,
        tokensUsed: response.usage?.total_tokens,
        model: response.model,
      },
    };
  } catch (error) {
    console.error('Document generation failed:', error);
    throw new Error('Failed to generate document. Please try again.');
  }
}

/**
 * Builds system prompt for document generation based on request type
 */
function buildDocumentGenerationPrompt(request: DocumentRequest): string {
  const basePrompt = `You are a professional document writer specializing in creating high-quality, well-structured documents.`;

  const typePrompts: Record<DocumentRequest['type'], string> = {
    report: `Create a comprehensive report with clear sections, data-driven insights, and professional formatting. Include an executive summary, methodology, findings, and recommendations.`,
    article: `Write an engaging article with a compelling introduction, well-developed body sections, and a strong conclusion. Use clear headings and maintain reader interest throughout.`,
    summary: `Create a concise, accurate summary that captures the key points and essential information. Use bullet points and clear structure.`,
    proposal: `Develop a persuasive proposal with clear objectives, methodology, timeline, and benefits. Include an executive summary and detailed sections.`,
    documentation: `Write clear, comprehensive documentation with proper structure, code examples where relevant, and step-by-step instructions. Use tables and lists for clarity.`,
    general: `Create a well-structured document with appropriate headings, clear paragraphs, and professional formatting.`,
  };

  const toneGuidance: Record<NonNullable<DocumentRequest['tone']>, string> = {
    formal: 'Use formal, professional language appropriate for business or academic contexts.',
    casual: 'Use conversational, friendly language while maintaining clarity and professionalism.',
    technical: 'Use precise technical language with appropriate terminology and detailed explanations.',
    creative: 'Use engaging, creative language while maintaining clarity and purpose.',
  };

  const lengthGuidance: Record<NonNullable<DocumentRequest['length']>, string> = {
    short: 'Keep the document concise (500-1000 words). Focus on essential information.',
    medium: 'Create a moderately detailed document (1000-2500 words) with comprehensive coverage.',
    long: 'Develop a comprehensive, detailed document (2500+ words) with thorough analysis.',
  };

  return `${basePrompt}

${typePrompts[request.type]}

${toneGuidance[request.tone || 'formal']}

${lengthGuidance[request.length || 'medium']}

Format the document using Markdown with:
- Clear hierarchical headings (# ## ###)
- Bold and italic for emphasis
- Bullet points and numbered lists
- Tables where appropriate
- Code blocks for technical content
- Blockquotes for important notes
- Horizontal rules to separate major sections

Ensure the document is:
✓ Well-structured with logical flow
✓ Professional and polished
✓ Free of grammatical errors
✓ Properly formatted in Markdown
✓ Ready for immediate use

Start with a clear title using # heading.`;
}

/**
 * Builds the user request message for document generation
 */
function buildDocumentRequest(request: DocumentRequest): string {
  let message = request.topic;

  if (request.requirements) {
    message += `\n\nAdditional Requirements:\n${request.requirements}`;
  }

  if (request.sections && request.sections.length > 0) {
    message += `\n\nRequired Sections:\n${request.sections.map(s => `- ${s}`).join('\n')}`;
  }

  return message;
}

/**
 * Enhances an existing document using Claude
 */
export async function enhanceDocument(
  originalContent: string,
  enhancement: 'proofread' | 'expand' | 'summarize' | 'restructure',
  userId?: string,
  sessionId?: string
): Promise<string> {
  const enhancementPrompts = {
    proofread: 'Proofread this document and fix any grammatical errors, typos, or formatting issues. Maintain the original tone and structure.',
    expand: 'Expand this document with more details, examples, and comprehensive coverage while maintaining the original structure and tone.',
    summarize: 'Create a concise summary of this document, capturing the key points and main ideas.',
    restructure: 'Restructure this document for better flow and organization while preserving all content.',
  };

  const messages: UnifiedMessage[] = [
    {
      role: 'system',
      content: `You are a professional editor. ${enhancementPrompts[enhancement]}`,
    },
    {
      role: 'user',
      content: originalContent,
    },
  ];

  try {
    const response = await unifiedLLMService.sendMessage(
      messages,
      sessionId,
      userId,
      'anthropic'
    );

    return response.content;
  } catch (error) {
    console.error('Document enhancement failed:', error);
    throw new Error('Failed to enhance document. Please try again.');
  }
}

export const documentGenerationService = {
  isDocumentRequest,
  parseDocumentRequest,
  generateDocument,
  enhanceDocument,
};
