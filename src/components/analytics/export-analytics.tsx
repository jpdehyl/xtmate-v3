'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DateRange } from './date-range-picker';

interface ExportAnalyticsProps {
  dateRange: DateRange;
  onExport?: (format: 'pdf' | 'excel') => Promise<void>;
  className?: string;
}

export function ExportAnalytics({ dateRange, onExport, className }: ExportAnalyticsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | null>(null);

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (isExporting) return;

    setIsExporting(true);
    setExportFormat(format);

    try {
      if (onExport) {
        await onExport(format);
      } else {
        // Default export behavior - generate PDF client-side
        await generateAnalyticsReport(dateRange, format);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        className="gap-2"
      >
        {isExporting && exportFormat === 'pdf' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Export PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('excel')}
        disabled={isExporting}
        className="gap-2"
      >
        {isExporting && exportFormat === 'excel' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export Excel
      </Button>
    </div>
  );
}

// Client-side PDF generation for analytics report
async function generateAnalyticsReport(dateRange: DateRange, format: 'pdf' | 'excel') {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (format === 'pdf') {
    // Dynamic import of jsPDF for code splitting
    const { default: jsPDF } = await import('jspdf');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(13, 110, 253); // Primary blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Analytics Report', 20, 25);

    // Date range
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`, 20, 35);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Report generation timestamp
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 55);

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, 75);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryY = 85;
    const summaryItems = [
      ['Report Period:', dateRange.label || `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`],
      ['Total Claims:', 'Data will be populated from server'],
      ['Total Revenue:', 'Data will be populated from server'],
      ['Completion Rate:', 'Data will be populated from server'],
    ];

    summaryItems.forEach(([label, value], index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, summaryY + (index * 10));
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, summaryY + (index * 10));
    });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('XTmate V3 - Analytics Report', 20, pageHeight - 10);
    doc.text(`Page 1 of 1`, pageWidth - 30, pageHeight - 10);

    // Save the PDF
    const filename = `xtmate-analytics-${formatDate(dateRange.start).replace(/[^a-z0-9]/gi, '')}-${formatDate(dateRange.end).replace(/[^a-z0-9]/gi, '')}.pdf`;
    doc.save(filename);
  } else {
    // Dynamic import of ExcelJS for code splitting
    const ExcelJS = await import('exceljs');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'XTmate V3';
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');

    // Header
    summarySheet.mergeCells('A1:D1');
    summarySheet.getCell('A1').value = 'XTmate Analytics Report';
    summarySheet.getCell('A1').font = { size: 18, bold: true };

    summarySheet.mergeCells('A2:D2');
    summarySheet.getCell('A2').value = `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    summarySheet.getCell('A2').font = { size: 12, italic: true };

    // Column headers
    summarySheet.getRow(4).values = ['Metric', 'Value'];
    summarySheet.getRow(4).font = { bold: true };

    // Data rows (placeholder - will be filled from server)
    summarySheet.getRow(5).values = ['Report Period', dateRange.label];
    summarySheet.getRow(6).values = ['Total Claims', 'N/A'];
    summarySheet.getRow(7).values = ['Total Revenue', 'N/A'];
    summarySheet.getRow(8).values = ['Completion Rate', 'N/A'];

    // Set column widths
    summarySheet.getColumn('A').width = 25;
    summarySheet.getColumn('B').width = 35;

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xtmate-analytics-${formatDate(dateRange.start).replace(/[^a-z0-9]/gi, '')}-${formatDate(dateRange.end).replace(/[^a-z0-9]/gi, '')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
