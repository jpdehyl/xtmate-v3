import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { estimates, photos, rooms } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import type { Photo, Room } from "@/lib/db/schema";

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

  // Fetch photos and rooms for the estimate
  const [photosList, roomsList] = await Promise.all([
    db.select().from(photos).where(eq(photos.estimateId, id)).orderBy(asc(photos.order)),
    db.select().from(rooms).where(eq(rooms.estimateId, id)).orderBy(asc(rooms.order)),
  ]);

  if (format === "pdf") {
    return generatePDF(estimate, photosList, roomsList);
  } else {
    return generateExcel(estimate, photosList, roomsList);
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

const PHOTO_TYPE_LABELS: Record<string, string> = {
  BEFORE: "Before",
  DURING: "During",
  AFTER: "After",
  DAMAGE: "Damage",
  EQUIPMENT: "Equipment",
  OVERVIEW: "Overview",
};

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

async function generatePDF(
  estimate: typeof estimates.$inferSelect,
  photosList: Photo[],
  roomsList: Room[]
): Promise<NextResponse> {
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

  // Section: Rooms (if any)
  if (roomsList.length > 0) {
    // Check if we need a new page
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    y += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Rooms", 20, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    for (const room of roomsList) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(room.name, 20, y);

      const roomDetails = [];
      if (room.squareFeet) roomDetails.push(`${room.squareFeet.toFixed(0)} sq ft`);
      if (room.category) roomDetails.push(room.category);

      if (roomDetails.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(` - ${roomDetails.join(", ")}`, 20 + doc.getTextWidth(room.name), y);
      }
      y += 8;
    }
  }

  // Section: Photos (if any) - show up to 6 photos
  if (photosList.length > 0) {
    // Always start photos section on a new page
    doc.addPage();
    y = 20;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Photo Documentation", 20, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 15;

    // Display photos in a grid (2 columns)
    const photoWidth = 80;
    const photoHeight = 60;
    const photoGap = 10;
    const maxPhotosPerPage = 6;
    const photosToShow = photosList.slice(0, Math.min(photosList.length, 12)); // Max 12 photos (2 pages)

    let photoIndex = 0;
    for (const photo of photosToShow) {
      if (photoIndex > 0 && photoIndex % maxPhotosPerPage === 0) {
        doc.addPage();
        y = 20;
      }

      const col = photoIndex % 2;
      const row = Math.floor((photoIndex % maxPhotosPerPage) / 2);
      const x = 20 + col * (photoWidth + photoGap);
      const photoY = y + row * (photoHeight + 25);

      // Try to add image
      const imageData = await fetchImageAsBase64(photo.thumbnailUrl || photo.url);
      if (imageData) {
        try {
          doc.addImage(imageData, "JPEG", x, photoY, photoWidth, photoHeight);
        } catch {
          // If image fails, draw placeholder
          doc.setFillColor(240, 240, 240);
          doc.rect(x, photoY, photoWidth, photoHeight, "F");
          doc.setFontSize(9);
          doc.setTextColor(150, 150, 150);
          doc.text("Image unavailable", x + photoWidth / 2, photoY + photoHeight / 2, { align: "center" });
        }
      } else {
        // Draw placeholder
        doc.setFillColor(240, 240, 240);
        doc.rect(x, photoY, photoWidth, photoHeight, "F");
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("Image unavailable", x + photoWidth / 2, photoY + photoHeight / 2, { align: "center" });
      }

      // Add photo type label
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const typeLabel = photo.photoType ? PHOTO_TYPE_LABELS[photo.photoType] || photo.photoType : "Photo";
      doc.text(typeLabel, x, photoY + photoHeight + 5);

      // Add caption if present
      if (photo.caption) {
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const captionText = photo.caption.length > 40 ? photo.caption.substring(0, 37) + "..." : photo.caption;
        doc.text(captionText, x, photoY + photoHeight + 12);
      }

      photoIndex++;
    }

    // Note if more photos exist
    if (photosList.length > photosToShow.length) {
      const lastRow = Math.ceil(photosToShow.length / 2);
      const noteY = y + lastRow * (photoHeight + 25) + 10;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `+ ${photosList.length - photosToShow.length} more photos available in the app`,
        20,
        Math.min(noteY, 270)
      );
    }
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
  estimate: typeof estimates.$inferSelect,
  photosList: Photo[],
  roomsList: Room[]
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

  // Section: Rooms (if any)
  if (roomsList.length > 0) {
    sheet.addRow([]);

    const roomsHeader = sheet.addRow(["Rooms", ""]);
    roomsHeader.getCell(1).font = { bold: true, size: 12 };
    roomsHeader.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    sheet.mergeCells(`A${roomsHeader.number}:B${roomsHeader.number}`);

    for (const room of roomsList) {
      const details = [];
      if (room.squareFeet) details.push(`${room.squareFeet.toFixed(0)} sq ft`);
      if (room.category) details.push(room.category);
      addDataRow(room.name, details.join(", ") || "No dimensions");
    }
  }

  // Section: Photos (if any)
  if (photosList.length > 0) {
    sheet.addRow([]);

    const photosHeader = sheet.addRow(["Photos", ""]);
    photosHeader.getCell(1).font = { bold: true, size: 12 };
    photosHeader.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };
    sheet.mergeCells(`A${photosHeader.number}:B${photosHeader.number}`);

    addDataRow("Total Photos", photosList.length.toString());

    // Count by type
    const typeCounts: Record<string, number> = {};
    for (const photo of photosList) {
      const type = photo.photoType || "Other";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    for (const [type, count] of Object.entries(typeCounts)) {
      addDataRow(PHOTO_TYPE_LABELS[type] || type, `${count} photo${count !== 1 ? "s" : ""}`);
    }
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
