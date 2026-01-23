/**
 * ESX Parser - Parse Xactimate ESX files (XML format)
 * This is the reverse of generator.ts
 */

export interface ParsedESXEstimate {
  name: string;
  claimNumber?: string;
  policyNumber?: string;
  dateOfLoss?: string;
  insuredName?: string;
  insuredPhone?: string;
  insuredEmail?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  totalAmount?: number;
}

export interface ParsedESXLevel {
  name: string;
  label?: string;
}

export interface ParsedESXRoom {
  name: string;
  levelName: string;
  category?: string;
  squareFeet?: number;
  perimeterLf?: number;
  wallSf?: number;
  ceilingSf?: number;
  heightIn?: number;
}

export interface ParsedESXLineItem {
  roomName: string;
  levelName: string;
  selector: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface ParsedESXPhoto {
  filename: string;
  roomName?: string;
  type?: string;
  caption?: string;
  takenAt?: string;
  url?: string;
}

export interface ESXParseResult {
  success: boolean;
  estimate?: ParsedESXEstimate;
  levels?: ParsedESXLevel[];
  rooms?: ParsedESXRoom[];
  lineItems?: ParsedESXLineItem[];
  photos?: ParsedESXPhoto[];
  error?: string;
}

function getTextContent(element: Element | null, tagName: string): string | undefined {
  if (!element) return undefined;
  const child = element.getElementsByTagName(tagName)[0];
  return child?.textContent?.trim() || undefined;
}

function getNumberContent(element: Element | null, tagName: string): number | undefined {
  const text = getTextContent(element, tagName);
  if (!text) return undefined;
  const num = parseFloat(text);
  return isNaN(num) ? undefined : num;
}

function getAttribute(element: Element, attrName: string): string | undefined {
  return element.getAttribute(attrName) || undefined;
}

export function parseESX(xmlContent: string): ESXParseResult {
  try {
    // Parse XML using DOMParser (browser) or external parser (Node)
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");

    // Check for parse errors
    const parseError = doc.getElementsByTagName("parsererror")[0];
    if (parseError) {
      return {
        success: false,
        error: `XML Parse Error: ${parseError.textContent}`,
      };
    }

    const project = doc.getElementsByTagName("Project")[0];
    if (!project) {
      return {
        success: false,
        error: "Invalid ESX format: Missing Project element",
      };
    }

    // Parse Project Info
    const projectInfo = project.getElementsByTagName("ProjectInfo")[0];
    const insuredInfo = project.getElementsByTagName("InsuredInfo")[0];
    const adjusterInfo = project.getElementsByTagName("AdjusterInfo")[0];
    const estimateElement = project.getElementsByTagName("Estimate")[0];
    const address = insuredInfo?.getElementsByTagName("Address")[0];

    const estimate: ParsedESXEstimate = {
      name: getTextContent(projectInfo, "ProjectName") || "Imported Estimate",
      claimNumber: getTextContent(projectInfo, "ClaimNumber"),
      policyNumber: getTextContent(projectInfo, "PolicyNumber"),
      dateOfLoss: getTextContent(projectInfo, "DateOfLoss"),
      insuredName: getTextContent(insuredInfo, "Name"),
      insuredPhone: getTextContent(insuredInfo, "Phone"),
      insuredEmail: getTextContent(insuredInfo, "Email"),
      propertyAddress: getTextContent(address, "Street"),
      propertyCity: getTextContent(address, "City"),
      propertyState: getTextContent(address, "State"),
      propertyZip: getTextContent(address, "Zip"),
      adjusterName: getTextContent(adjusterInfo, "Name"),
      adjusterPhone: getTextContent(adjusterInfo, "Phone"),
      adjusterEmail: getTextContent(adjusterInfo, "Email"),
      totalAmount: getNumberContent(estimateElement, "TotalAmount"),
    };

    // Parse Levels and Rooms
    const levels: ParsedESXLevel[] = [];
    const rooms: ParsedESXRoom[] = [];
    const lineItems: ParsedESXLineItem[] = [];

    const levelsElement = estimateElement?.getElementsByTagName("Levels")[0];
    const levelElements = levelsElement?.getElementsByTagName("Level") || [];

    for (let i = 0; i < levelElements.length; i++) {
      const levelEl = levelElements[i];
      const levelName = getAttribute(levelEl, "name") || `Level ${i + 1}`;

      levels.push({
        name: levelName,
        label: levelName,
      });

      // Parse rooms in this level
      const roomElements = levelEl.getElementsByTagName("Room");
      for (let j = 0; j < roomElements.length; j++) {
        const roomEl = roomElements[j];
        const roomName = getAttribute(roomEl, "name") || `Room ${j + 1}`;
        const roomCategory = getAttribute(roomEl, "category");

        const dimensions = roomEl.getElementsByTagName("Dimensions")[0];
        const heightFt = getNumberContent(dimensions, "HeightFT");

        rooms.push({
          name: roomName,
          levelName: levelName,
          category: roomCategory,
          squareFeet: getNumberContent(dimensions, "SquareFeet"),
          perimeterLf: getNumberContent(dimensions, "PerimeterLF"),
          wallSf: getNumberContent(dimensions, "WallSF"),
          ceilingSf: getNumberContent(dimensions, "CeilingSF"),
          heightIn: heightFt ? heightFt * 12 : undefined,
        });

        // Parse line items in this room
        const lineItemElements = roomEl.getElementsByTagName("LineItem");
        for (let k = 0; k < lineItemElements.length; k++) {
          const itemEl = lineItemElements[k];

          lineItems.push({
            roomName: roomName,
            levelName: levelName,
            selector: getTextContent(itemEl, "Selector") || "",
            description: getTextContent(itemEl, "Description") || "",
            quantity: getNumberContent(itemEl, "Quantity") || 0,
            unit: getTextContent(itemEl, "Unit") || "EA",
            unitPrice: getNumberContent(itemEl, "UnitPrice") || 0,
            total: getNumberContent(itemEl, "Total") || 0,
            category: getTextContent(itemEl, "Category"),
          });
        }
      }
    }

    // Parse Photos
    const photos: ParsedESXPhoto[] = [];
    const photosElement = project.getElementsByTagName("Photos")[0];
    const photoElements = photosElement?.getElementsByTagName("Photo") || [];

    for (let i = 0; i < photoElements.length; i++) {
      const photoEl = photoElements[i];
      photos.push({
        filename: getTextContent(photoEl, "Filename") || `photo_${i + 1}`,
        roomName: getTextContent(photoEl, "Room"),
        type: getTextContent(photoEl, "Type"),
        caption: getTextContent(photoEl, "Caption"),
        takenAt: getTextContent(photoEl, "TakenAt"),
        url: getTextContent(photoEl, "URL"),
      });
    }

    return {
      success: true,
      estimate,
      levels,
      rooms,
      lineItems,
      photos,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error parsing ESX file",
    };
  }
}

/**
 * Parse ESX file from a File object (for browser use)
 */
export async function parseESXFile(file: File): Promise<ESXParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        resolve({ success: false, error: "Failed to read file content" });
        return;
      }
      resolve(parseESX(content));
    };

    reader.onerror = () => {
      resolve({ success: false, error: "Failed to read file" });
    };

    reader.readAsText(file);
  });
}
