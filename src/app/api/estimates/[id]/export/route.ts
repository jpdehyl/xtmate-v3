import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";

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

  if (format === "pdf") {
    return generatePDF(estimate);
  } else {
    return generateExcel(estimate);
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

function generatePDF(
  estimate: typeof estimates.$inferSelect
): NextResponse {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

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
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
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
  estimate: typeof estimates.$inferSelect
): Promise<NextResponse> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "XTmate";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Estimate");

  // Set column widths
  sheet.columns = [
    { key: "label", width: 20 },
    { key: "value", width: 50 },
  ];

  // Header row with branding
  sheet.mergeCells("A1:B1");
  const headerCell = sheet.getCell("A1");
  headerCell.value = "XTmate Estimate Report";
  headerCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  headerCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  headerCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 35;

  // Estimate name
  sheet.mergeCells("A2:B2");
  const nameCell = sheet.getCell("A2");
  nameCell.value = estimate.name;
  nameCell.font = { size: 14, bold: true };
  nameCell.alignment = { horizontal: "center" };
  sheet.getRow(2).height = 25;

  // Empty row
  sheet.addRow([]);

  // Section: Basic Information
  const basicHeader = sheet.addRow(["Basic Information", ""]);
  basicHeader.getCell(1).font = { bold: true, size: 12 };
  basicHeader.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  sheet.mergeCells(`A${basicHeader.number}:B${basicHeader.number}`);

  const addDataRow = (label: string, value: string) => {
    const row = sheet.addRow([label, value]);
    row.getCell(1).font = { bold: true, color: { argb: "FF6B7280" } };
    row.getCell(2).alignment = { wrapText: true };
    return row;
  };

  addDataRow("Status", formatStatus(estimate.status));
  addDataRow("Job Type", formatJobType(estimate.jobType));
  addDataRow("Created", formatDate(estimate.createdAt));
  addDataRow("Last Updated", formatDate(estimate.updatedAt));

  // Empty row
  sheet.addRow([]);

  // Section: Property Address
  const addressHeader = sheet.addRow(["Property Address", ""]);
  addressHeader.getCell(1).font = { bold: true, size: 12 };
  addressHeader.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF3F4F6" },
  };
  sheet.mergeCells(`A${addressHeader.number}:B${addressHeader.number}`);

  addDataRow("Street Address", estimate.propertyAddress || "Not specified");
  addDataRow("City", estimate.propertyCity || "Not specified");
  addDataRow("State", estimate.propertyState || "Not specified");
  addDataRow("ZIP Code", estimate.propertyZip || "Not specified");

  // Insurance Details (if applicable)
  if (estimate.jobType === "insurance") {
    sheet.addRow([]);

    const insuranceHeader = sheet.addRow(["Insurance Details", ""]);
    insuranceHeader.getCell(1).font = { bold: true, size: 12 };
    insuranceHeader.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    sheet.mergeCells(`A${insuranceHeader.number}:B${insuranceHeader.number}`);

    addDataRow("Claim Number", estimate.claimNumber || "Not specified");
    addDataRow("Policy Number", estimate.policyNumber || "Not specified");
  }

  // Add borders to all data cells
  sheet.eachRow((row, rowNumber) => {
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
