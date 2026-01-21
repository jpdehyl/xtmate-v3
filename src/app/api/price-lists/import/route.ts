import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { priceLists, priceListItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";

// Column mapping configuration
interface ColumnMapping {
  category?: number;
  selector?: number;
  description?: number;
  unit?: number;
  unitPrice?: number;
  laborPrice?: number;
  materialPrice?: number;
  equipmentPrice?: number;
}

// Parse CSV content
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (line.trim() === "") continue;

    const row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

// Auto-detect column mapping from headers
function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  const patterns = {
    category: ["category", "cat", "type"],
    selector: ["selector", "code", "item code", "xactimate", "sku"],
    description: ["description", "desc", "name", "item", "item description"],
    unit: ["unit", "uom", "unit of measure"],
    unitPrice: ["unit price", "price", "rate", "unit cost", "cost"],
    laborPrice: ["labor", "labor price", "labor cost", "labour"],
    materialPrice: ["material", "material price", "material cost", "materials"],
    equipmentPrice: ["equipment", "equipment price", "equipment cost", "equip"],
  };

  for (const [field, keywords] of Object.entries(patterns)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      if (keywords.some((kw) => normalizedHeaders[i].includes(kw))) {
        (mapping as Record<string, number>)[field] = i;
        break;
      }
    }
  }

  return mapping;
}

// Extract row data based on column mapping
function extractRowData(row: (string | number | null)[], mapping: ColumnMapping) {
  const getValue = (index: number | undefined): string | null => {
    if (index === undefined) return null;
    const value = row[index];
    if (value === null || value === undefined) return null;
    return String(value).trim() || null;
  };

  const getNumber = (index: number | undefined): number | null => {
    if (index === undefined) return null;
    const value = row[index];
    if (value === null || value === undefined) return null;
    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    return isNaN(num) ? null : num;
  };

  return {
    category: getValue(mapping.category),
    selector: getValue(mapping.selector),
    description: getValue(mapping.description),
    unit: getValue(mapping.unit),
    unitPrice: getNumber(mapping.unitPrice),
    laborPrice: getNumber(mapping.laborPrice),
    materialPrice: getNumber(mapping.materialPrice),
    equipmentPrice: getNumber(mapping.equipmentPrice),
  };
}

// POST /api/price-lists/import - Import CSV/XLSX price list
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
    const region = formData.get("region") as string | null;
    const columnMappingStr = formData.get("columnMapping") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isCSV = fileName.endsWith(".csv");

    if (!isExcel && !isCSV) {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload CSV or Excel file." },
        { status: 400 }
      );
    }

    let rows: (string | number | null)[][] = [];
    let headers: string[] = [];

    if (isCSV) {
      const content = await file.text();
      const parsed = parseCSV(content);
      if (parsed.length === 0) {
        return NextResponse.json({ error: "Empty file" }, { status: 400 });
      }
      headers = parsed[0];
      rows = parsed.slice(1);
    } else {
      // Parse Excel
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return NextResponse.json({ error: "No worksheet found" }, { status: 400 });
      }

      const excelRows: (string | number | null)[][] = [];
      worksheet.eachRow((row, rowNumber) => {
        const values: (string | number | null)[] = [];
        row.eachCell((cell) => {
          values.push(cell.value as string | number | null);
        });
        if (rowNumber === 1) {
          headers = values.map((v) => String(v || ""));
        } else {
          excelRows.push(values);
        }
      });
      rows = excelRows;
    }

    // Determine column mapping
    let mapping: ColumnMapping;
    if (columnMappingStr) {
      try {
        mapping = JSON.parse(columnMappingStr);
      } catch {
        mapping = detectColumnMapping(headers);
      }
    } else {
      mapping = detectColumnMapping(headers);
    }

    // Create price list
    const [newList] = await db
      .insert(priceLists)
      .values({
        userId,
        name: name || file.name.replace(/\.[^.]+$/, ""),
        description: description || `Imported from ${file.name}`,
        region,
        isActive: true,
        itemCount: 0,
      })
      .returning();

    // Process rows and insert items
    const itemsToInsert = [];
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const data = extractRowData(row, mapping);

        // Skip rows without meaningful data
        if (!data.description && !data.selector) {
          continue;
        }

        itemsToInsert.push({
          priceListId: newList.id,
          category: data.category,
          selector: data.selector,
          description: data.description,
          unit: data.unit,
          unitPrice: data.unitPrice,
          laborPrice: data.laborPrice,
          materialPrice: data.materialPrice,
          equipmentPrice: data.equipmentPrice,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    // Bulk insert items
    if (itemsToInsert.length > 0) {
      await db.insert(priceListItems).values(itemsToInsert);
    }

    // Update item count
    await db
      .update(priceLists)
      .set({ itemCount: itemsToInsert.length })
      .where(eq(priceLists.id, newList.id));

    return NextResponse.json({
      priceList: { ...newList, itemCount: itemsToInsert.length },
      imported: successCount,
      errors: errorCount,
      detectedMapping: mapping,
    }, { status: 201 });
  } catch (error) {
    console.error("Error importing price list:", error);
    return NextResponse.json(
      { error: "Failed to import price list" },
      { status: 500 }
    );
  }
}
