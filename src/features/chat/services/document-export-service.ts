/**
 * Document Export Service
 *
 * Handles exporting documents to various formats: MD, PDF, DOCX
 * Converts markdown content to formatted documents
 */

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import type { DocumentFormat } from './document-generation-service';

export interface ExportOptions {
  title?: string;
  author?: string;
  metadata?: Record<string, string>;
  pageBreaks?: number[]; // Line numbers where to insert page breaks
}

/**
 * Downloads markdown content as a .md file
 */
export async function downloadAsMarkdown(
  content: string,
  filename: string = 'document.md',
  options?: ExportOptions
): Promise<void> {
  // Add metadata header if provided
  let finalContent = content;
  if (options?.metadata) {
    const metadataHeader = Object.entries(options.metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    finalContent = `---\n${metadataHeader}\n---\n\n${content}`;
  }

  const blob = new Blob([finalContent], { type: 'text/markdown' });
  downloadBlob(blob, filename);
}

/**
 * Downloads markdown content as a PDF file
 */
export async function downloadAsPDF(
  content: string,
  filename: string = 'document.pdf',
  options?: ExportOptions
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Add title if provided
  if (options?.title) {
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(options.title, margin, yPosition);
    yPosition += 15;
  }

  // Add author and date if provided
  if (options?.author) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`By ${options.author}`, margin, yPosition);
    yPosition += 7;
  }

  pdf.text(new Date().toLocaleDateString(), margin, yPosition);
  yPosition += 15;

  // Parse markdown and render to PDF
  const lines = parseMarkdownForPDF(content);

  for (const line of lines) {
    // Check if we need a new page
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    switch (line.type) {
      case 'h1':
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        yPosition += 10;
        break;
      case 'h2':
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        yPosition += 8;
        break;
      case 'h3':
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        yPosition += 6;
        break;
      case 'bold':
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        break;
      case 'code':
        pdf.setFontSize(9);
        pdf.setFont('courier', 'normal');
        pdf.setTextColor(60, 60, 60);
        break;
      case 'quote':
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        break;
      case 'list':
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        break;
      default:
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
    }

    // Handle text wrapping
    const splitText = pdf.splitTextToSize(line.text, maxWidth);

    for (const textLine of splitText) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(textLine, margin + (line.indent || 0), yPosition);
      yPosition += 7;
    }

    // Add extra spacing after headings
    if (line.type.startsWith('h')) {
      yPosition += 3;
    }
  }

  // Save the PDF
  pdf.save(filename);
}

/**
 * Downloads markdown content as a DOCX file
 */
export async function downloadAsDOCX(
  content: string,
  filename: string = 'document.docx',
  options?: ExportOptions
): Promise<void> {
  const sections = parseMarkdownForDOCX(content, options);

  const doc = new Document({
    sections: [{
      properties: {},
      children: sections,
    }],
    creator: options?.author || 'AGI Agent Automation',
    title: options?.title || 'Document',
    description: 'Generated document from chat',
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}

/**
 * Parses markdown content for PDF rendering
 */
function parseMarkdownForPDF(content: string): Array<{
  type: 'h1' | 'h2' | 'h3' | 'text' | 'bold' | 'code' | 'quote' | 'list';
  text: string;
  indent?: number;
}> {
  const lines = content.split('\n');
  const parsed: Array<{
    type: 'h1' | 'h2' | 'h3' | 'text' | 'bold' | 'code' | 'quote' | 'list';
    text: string;
    indent?: number;
  }> = [];

  let inCodeBlock = false;

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      parsed.push({ type: 'text', text: '' });
      continue;
    }

    // Code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      parsed.push({ type: 'code', text: line, indent: 5 });
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      parsed.push({ type: 'h1', text: line.substring(2) });
    } else if (line.startsWith('## ')) {
      parsed.push({ type: 'h2', text: line.substring(3) });
    } else if (line.startsWith('### ')) {
      parsed.push({ type: 'h3', text: line.substring(4) });
    } else if (line.startsWith('> ')) {
      // Blockquote
      parsed.push({ type: 'quote', text: line.substring(2), indent: 5 });
    } else if (line.match(/^[*\-+]\s/)) {
      // Unordered list
      parsed.push({ type: 'list', text: `• ${line.substring(2)}`, indent: 5 });
    } else if (line.match(/^\d+\.\s/)) {
      // Ordered list
      parsed.push({ type: 'list', text: line, indent: 5 });
    } else {
      // Regular text - strip markdown formatting for PDF
      const cleanText = line
        .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
        .replace(/\*(.+?)\*/g, '$1')     // Italic
        .replace(/`(.+?)`/g, '$1')       // Inline code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Links

      parsed.push({ type: 'text', text: cleanText });
    }
  }

  return parsed;
}

/**
 * Parses markdown content for DOCX rendering
 */
function parseMarkdownForDOCX(content: string, options?: ExportOptions): Paragraph[] {
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  // Add title if provided
  if (options?.title) {
    paragraphs.push(
      new Paragraph({
        text: options.title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      })
    );
  }

  // Add author and date
  if (options?.author) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `By ${options.author}`,
            italics: true,
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString(),
          size: 20,
          color: '666666',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (const line of lines) {
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeBlockLines.join('\n'),
                font: 'Courier New',
                size: 20,
              }),
            ],
            shading: {
              fill: 'F5F5F5',
            },
            spacing: { before: 100, after: 100 },
          })
        );
        codeBlockLines = [];
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('> ')) {
      // Blockquote
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.substring(2),
              italics: true,
              color: '666666',
            }),
          ],
          indent: { left: 720 },
          spacing: { before: 100, after: 100 },
        })
      );
    } else if (line.match(/^[*\-+]\s/)) {
      // Unordered list
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          bullet: {
            level: 0,
          },
        })
      );
    } else if (line.match(/^\d+\.\s/)) {
      // Ordered list
      paragraphs.push(
        new Paragraph({
          text: line.substring(line.indexOf('.') + 2),
          numbering: {
            reference: 'default-numbering',
            level: 0,
          },
        })
      );
    } else {
      // Regular text with inline formatting
      const children = parseInlineMarkdown(line);
      paragraphs.push(
        new Paragraph({
          children,
          spacing: { after: 120 },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Parses inline markdown formatting (bold, italic, code, links)
 */
function parseInlineMarkdown(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    // Bold **text**
    if (text[i] === '*' && text[i + 1] === '*') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }
      i += 2;
      let boldText = '';
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '*')) {
        boldText += text[i];
        i++;
      }
      runs.push(new TextRun({ text: boldText, bold: true }));
      i += 2;
    }
    // Italic *text*
    else if (text[i] === '*') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }
      i++;
      let italicText = '';
      while (i < text.length && text[i] !== '*') {
        italicText += text[i];
        i++;
      }
      runs.push(new TextRun({ text: italicText, italics: true }));
      i++;
    }
    // Inline code `text`
    else if (text[i] === '`') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }
      i++;
      let codeText = '';
      while (i < text.length && text[i] !== '`') {
        codeText += text[i];
        i++;
      }
      runs.push(
        new TextRun({
          text: codeText,
          font: 'Courier New',
          shading: { fill: 'F5F5F5' },
        })
      );
      i++;
    }
    // Links [text](url)
    else if (text[i] === '[') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }
      i++;
      let linkText = '';
      while (i < text.length && text[i] !== ']') {
        linkText += text[i];
        i++;
      }
      i++; // Skip ]
      i++; // Skip (
      let url = '';
      while (i < text.length && text[i] !== ')') {
        url += text[i];
        i++;
      }
      runs.push(
        new TextRun({
          text: linkText,
          color: '0563C1',
          underline: {},
        })
      );
      i++;
    } else {
      currentText += text[i];
      i++;
    }
  }

  if (currentText) {
    runs.push(new TextRun({ text: currentText }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text: '' })];
}

/**
 * Helper function to download a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export all formats at once
 */
export async function exportDocument(
  content: string,
  format: DocumentFormat,
  filename: string,
  options?: ExportOptions
): Promise<void> {
  // Ensure filename has correct extension
  const baseFilename = filename.replace(/\.(md|pdf|docx)$/, '');

  switch (format) {
    case 'markdown':
      await downloadAsMarkdown(content, `${baseFilename}.md`, options);
      break;
    case 'pdf':
      await downloadAsPDF(content, `${baseFilename}.pdf`, options);
      break;
    case 'docx':
      await downloadAsDOCX(content, `${baseFilename}.docx`, options);
      break;
  }
}

export const documentExportService = {
  downloadAsMarkdown,
  downloadAsPDF,
  downloadAsDOCX,
  exportDocument,
};
