/**
 * Document Export Utilities
 * Exports generated documents to PDF and DOCX formats
 */

import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';

export interface ExportOptions {
  title: string;
  content: string;
  author?: string;
  date?: Date;
  metadata?: Record<string, string>;
}

/**
 * Export document to PDF
 * Uses jsPDF for client-side PDF generation
 */
export async function exportToPDF(options: ExportOptions): Promise<Blob> {
  const { title, content, author, date = new Date() } = options;

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set document properties
  doc.setProperties({
    title,
    author: author || 'AGI Agent Automation',
    subject: title,
    creator: 'AGI Agent Automation Platform',
    creationDate: date,
  });

  // PDF styling
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, yPosition);
  yPosition += 12;

  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(date.toLocaleDateString(), margin, yPosition);
  yPosition += 10;

  // Add separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Reset text color
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  // Parse markdown-like content and add to PDF
  const lines = content.split('\n');

  for (const line of lines) {
    // Check if we need a new page
    if (yPosition > pageHeight - margin - 10) {
      doc.addPage();
      yPosition = margin;
    }

    // Handle headings
    if (line.startsWith('# ')) {
      yPosition += 5;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(2).trim();
      const splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('## ')) {
      yPosition += 4;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(3).trim();
      const splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('### ')) {
      yPosition += 3;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(4).trim();
      const splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 6;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet point
      const text = '• ' + line.substring(2).trim();
      const splitText = doc.splitTextToSize(text, maxWidth - 5);
      doc.text(splitText, margin + 5, yPosition);
      yPosition += splitText.length * 5;
    } else if (line.trim() === '') {
      // Empty line
      yPosition += 5;
    } else {
      // Regular paragraph
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(line, maxWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 5;
    }
  }

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
  }

  // Return as Blob
  return doc.output('blob');
}

/**
 * Export document to DOCX
 * Uses docx library for client-side DOCX generation
 */
export async function exportToDOCX(options: ExportOptions): Promise<Blob> {
  const { title, content, author, date = new Date() } = options;

  // Parse content into paragraphs
  const children: Paragraph[] = [];

  // Add title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  );

  // Add date
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: date.toLocaleDateString(),
          size: 20,
          color: '666666',
        }),
      ],
      spacing: {
        after: 400,
      },
    })
  );

  // Parse markdown-like content
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('# ')) {
      // Heading 1
      children.push(
        new Paragraph({
          text: line.substring(2).trim(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (line.startsWith('## ')) {
      // Heading 2
      children.push(
        new Paragraph({
          text: line.substring(3).trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('### ')) {
      // Heading 3
      children.push(
        new Paragraph({
          text: line.substring(4).trim(),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet point
      children.push(
        new Paragraph({
          text: line.substring(2).trim(),
          bullet: {
            level: 0,
          },
          spacing: { after: 80 },
        })
      );
    } else if (line.trim() === '') {
      // Empty paragraph for spacing
      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 120 },
        })
      );
    } else {
      // Regular paragraph
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, // 12pt
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    creator: author || 'AGI Agent Automation',
    title,
    description: `Generated by AGI Agent Automation on ${date.toLocaleDateString()}`,
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  // Generate and return blob
  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
