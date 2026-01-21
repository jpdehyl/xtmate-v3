import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, lineItems } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import { calculateEstimateTotals } from "@/lib/calculations/estimate-totals";
import { getCategoryByCode } from "@/lib/reference/xactimate-categories";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (!format || !["pdf", "excel"].includes(format)) {
    return NextResponse.json(
      { error: "Invalid format. Use 'pdf' or 'excel'" },
      { status: 400 }
    );
  }

  const [estimate] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, id), eq(estimates.userId, userId)));

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  // Fetch line items for the estimate
  const items = await db
    .select()
    .from(lineItems)
    .where(eq(lineItems.estimateId, id))
    .orderBy(asc(lineItems.order), asc(lineItems.createdAt));

  if (format === "pdf") {
    return generatePDF(estimate, items);
  } else {
    return generateExcel(estimate, items);
  }
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatJobType(jobType: string): string {
  return jobType.charAt(0).toUpperCase() + jobType.slice(1);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatAddress(estimate: {
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  propertyZip: string | null;
}): string {
  const parts = [];
  if (estimate.propertyAddress) parts.push(estimate.propertyAddress);
  const cityStateZip = [
    estimate.propertyCity,
    estimate.propertyState,
    estimate.propertyZip,
  ]
    .filter(Boolean)
    .join(", ");
  if (cityStateZip) parts.push(cityStateZip);
  return parts.join("\n") || "Not specified";
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function generatePDF(
  estimate: typeof estimates.$inferSelect,
  items: typeof lineItems.$inferSelect[]
): NextResponse {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  // Calculate totals
  const totals = calculateEstimateTotals(items, {
    overheadPercent: 10,
    profitPercent: 10,
    taxPercent: 0,
  });

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
  };

  // Header with branding
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("XTmate", 20, 28);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Estimate Report", pageWidth - 20, 28, { align: "right" });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  y = 60;

  // Estimate Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(estimate.name, 20, y);
  y += 15;

  // Status badge
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const statusText = formatStatus(estimate.status);
  doc.setFillColor(
    estimate.status === "completed" ? 34 : estimate.status === "in_progress" ? 234 : 156,
    estimate.status === "completed" ? 197 : estimate.status === "in_progress" ? 179 : 163,
    estimate.status === "completed" ? 94 : estimate.status === "in_progress" ? 8 : 175
  );
  doc.roundedRect(20, y - 6, doc.getTextWidth(statusText) + 10, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, 25, y);
  doc.setTextColor(0, 0, 0);
  y += 20;

  // Section: Basic Information
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Basic Information", 20, y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const addField = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(label, 20, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(value, 80, y);
    y += 8;
  };

  addField("Job Type:", formatJobType(estimate.jobType));
  addField("Created:", formatDate(estimate.createdAt));
  addField("Updated:", formatDate(estimate.updatedAt));
  y += 10;

  // Section: Property Address
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Property Address", 20, y);
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const address = formatAddress(estimate);
  const addressLines = address.split("\n");
  addressLines.forEach((line) => {
    doc.text(line, 20, y);
    y += 7;
  });
  y += 10;

  // Section: Insurance Details (if applicable)
  if (estimate.jobType === "insurance") {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Insurance Details", 20, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 12;

    doc.setFontSize(11);
    addField("Claim #:", estimate.claimNumber || "Not specified");
    addField("Policy #:", estimate.policyNumber || "Not specified");
    y += 10;
  }

  // Section: Line Items
  if (items.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Scope of Work", 20, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Table header
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(243, 244, 246);
    doc.rect(20, y - 4, pageWidth - 40, 8, "F");
    doc.text("Category", 22, y);
    doc.text("Description", 55, y);
    doc.text("Qty", 130, y, { align: "right" });
    doc.text("Unit", 145, y);
    doc.text("Price", 165, y, { align: "right" });
    doc.text("Total", pageWidth - 22, y, { align: "right" });
    y += 10;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    for (const item of items) {
      checkPageBreak(10);

      const categoryInfo = getCategoryByCode(item.category || "");
      const categoryDisplay = categoryInfo ? item.category : (item.category || "");
      const description = (item.description || "").substring(0, 50);

      doc.text(categoryDisplay, 22, y);
      doc.text(description, 55, y);
      doc.text(item.quantity?.toFixed(2) || "-", 130, y, { align: "right" });
      doc.text(item.unit || "-", 145, y);
      doc.text(formatCurrency(item.unitPrice), 165, y, { align: "right" });
      doc.text(formatCurrency(item.total), pageWidth - 22, y, { align: "right" });

      y += 7;
    }

    // Totals section
    y += 5;
    checkPageBreak(50);
    doc.setDrawColor(200, 200, 200);
    doc.line(130, y, pageWidth - 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Subtotal
    doc.text("Subtotal:", 130, y);
    doc.text(formatCurrency(totals.subtotal), pageWidth - 22, y, { align: "right" });
    y += 7;

    // Overhead
    doc.text("Overhead (10%):", 130, y);
    doc.text(formatCurrency(totals.overhead), pageWidth - 22, y, { align: "right" });
    y += 7;

    // Profit
    doc.text("Profit (10%):", 130, y);
    doc.text(formatCurrency(totals.profit), pageWidth - 22, y, { align: "right" });
    y += 7;

    // Grand Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Grand Total:", 130, y);
    doc.text(formatCurrency(totals.grandTotal), pageWidth - 22, y, { align: "right" });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated by XTmate on ${new Date().toLocaleDateString("en-US")}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const filename = `estimate-${estimate.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function generateExcel(
  estimate: typeof estimates.$inferSelect,
  items: typeof lineItems.$inferSelect[]
): Promise<NextResponse> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "XTmate";
  workbook.created = new Date();

  // Calculate totals
  const totals = calculateEstimateTotals(items, {
    overheadPercent: 10,
    profitPercent: 10,
    taxPercent: 0,
  });

  // ============ Summary Sheet ============
  const summarySheet = workbook.addWorksheet("Summary");

  // Set column widths
  summarySheet.columns = [
    { key: "label", width: 20 },
    { key: "value", width: 50 },
  ];

  // Header row with branding
  summarySheet.mergeCells("A1:B1");
  const headerCell = summarySheet.getCell("A1");
  headerCell.value = "XTmate Estimate Report";
  headerCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  headerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 35;

  // Estimate name
  summarySheet.mergeCells("A2:B2");
  const nameCell = summarySheet.getCell("A2");
  nameCell.value = estimate.name;
  nameCell.font = { size: 14, bold: true };
  nameCell.alignment = { horizontal: "center" };
  summarySheet.getRow(2).height = 25;

  // Empty row
  summarySheet.addRow([]);

  // Section: Basic Information
  const basicHeader = summarySheet.addRow(["Basic Information", ""]);
  basicHeader.getCell(1).font = { bold: true, size: 12 };
  basicHeader.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  summarySheet.mergeCells(`A${basicHeader.number}:B${basicHeader.number}`);

  const addDataRow = (label: string, value: string) => {
    const row = summarySheet.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: "FF6B7280" } };
    row.getCell(2).alignment = { wrapText: true };
    return row;
  };

  addDataRow("Status", formatStatus(estimate.status));
  addDataRow("Job Type", formatJobType(estimate.jobType));
  addDataRow("Created", formatDate(estimate.createdAt));
  addDataRow("Last Updated", formatDate(estimate.updatedAt));

  // Empty row
  summarySheet.addRow([]);

  // Section: Property Address
  const addressHeader = summarySheet.addRow(["Property Address", ""]);
  addressHeader.getCell(1).font = { bold: true, size: 12 };
  addressHeader.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  summarySheet.mergeCells(`A${addressHeader.number}:B${addressHeader.number}`);

  addDataRow("Street Address", estimate.propertyAddress || "Not specified");
  addDataRow("City", estimate.propertyCity || "Not specified");
  addDataRow("State", estimate.propertyState || "Not specified");
  addDataRow("ZIP Code", estimate.propertyZip || "Not specified");

  // Insurance Details (if applicable)
  if (estimate.jobType === "insurance") {
    summarySheet.addRow([]);

    const insuranceHeader = summarySheet.addRow(["Insurance Details", ""]);
    insuranceHeader.getCell(1).font = { bold: true, size: 12 };
    insuranceHeader.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    summarySheet.mergeCells(`A${insuranceHeader.number}:B${insuranceHeader.number}`);

    addDataRow("Claim Number", estimate.claimNumber || "Not specified");
    addDataRow("Policy Number", estimate.policyNumber || "Not specified");
  }

  // Section: Totals
  summarySheet.addRow([]);
  const totalsHeader = summarySheet.addRow(["Estimate Totals", ""]);
  totalsHeader.getCell(1).font = { bold: true, size: 12 };
  totalsHeader.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  summarySheet.mergeCells(`A${totalsHeader.number}:B${totalsHeader.number}`);

  addDataRow("Line Items", `${items.length}`);
  addDataRow("Subtotal", formatCurrency(totals.subtotal));
  addDataRow("Overhead (10%)", formatCurrency(totals.overhead));
  addDataRow("Profit (10%)", formatCurrency(totals.profit));

  const grandTotalRow = summarySheet.addRow(["Grand Total", formatCurrency(totals.grandTotal)]);
  grandTotalRow.getCell(1).font = { bold: true, size: 12 };
  grandTotalRow.getCell(2).font = { bold: true, size: 12, color: { argb: "FF2563EB" } };

  // Add borders to all data cells
  summarySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 2) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });
    }
  });

  // ============ Line Items Sheet ============
  if (items.length > 0) {
    const itemsSheet = workbook.addWorksheet("Line Items");

    // Set columns
    itemsSheet.columns = [
      { header: "Category", key: "category", width: 12 },
      { header: "Code", key: "selector", width: 15 },
      { header: "Description", key: "description", width: 40 },
      { header: "Quantity", key: "quantity", width: 12 },
      { header: "Unit", key: "unit", width: 8 },
      { header: "Unit Price", key: "unitPrice", width: 14 },
      { header: "Total", key: "total", width: 14 },
      { header: "Source", key: "source", width: 12 },
      { header: "Verified", key: "verified", width: 10 },
    ];

    // Style header row
    const headerRow = itemsSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    headerRow.height = 25;

    // Add data rows
    for (const item of items) {
      itemsSheet.addRow({
        category: item.category || "",
        selector: item.selector || "",
        description: item.description || "",
        quantity: item.quantity || 0,
        unit: item.unit || "",
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        source: item.source || "manual",
        verified: item.verified ? "Yes" : "No",
      });
    }

    // Add totals row
    itemsSheet.addRow([]);
    const subtotalRow = itemsSheet.addRow({
      category: "",
      selector: "",
      description: "",
      quantity: "",
      unit: "",
      unitPrice: "Subtotal:",
      total: totals.subtotal,
      source: "",
      verified: "",
    });
    subtotalRow.getCell(6).font = { bold: true };
    subtotalRow.getCell(7).font = { bold: true };

    const ohRow = itemsSheet.addRow({
      category: "",
      selector: "",
      description: "",
      quantity: "",
      unit: "",
      unitPrice: "Overhead (10%):",
      total: totals.overhead,
      source: "",
      verified: "",
    });
    ohRow.getCell(6).font = { bold: true };

    const profitRow = itemsSheet.addRow({
      category: "",
      selector: "",
      description: "",
      quantity: "",
      unit: "",
      unitPrice: "Profit (10%):",
      total: totals.profit,
      source: "",
      verified: "",
    });
    profitRow.getCell(6).font = { bold: true };

    const grandRow = itemsSheet.addRow({
      category: "",
      selector: "",
      description: "",
      quantity: "",
      unit: "",
      unitPrice: "Grand Total:",
      total: totals.grandTotal,
      source: "",
      verified: "",
    });
    grandRow.getCell(6).font = { bold: true, size: 12 };
    grandRow.getCell(7).font = { bold: true, size: 12, color: { argb: "FF2563EB" } };

    // Format number columns
    itemsSheet.getColumn("unitPrice").numFmt = '"$"#,##0.00';
    itemsSheet.getColumn("total").numFmt = '"$"#,##0.00';

    // Add borders
    itemsSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `estimate-${estimate.name.replace(/[^a-zA-Z0-9]/g, "-")}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
