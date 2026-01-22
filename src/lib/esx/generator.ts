import { Estimate, Level, Room, LineItem, Photo } from "@/lib/db/schema";

interface ESXGeneratorOptions {
  estimate: Estimate & {
    levels?: Level[];
    rooms?: Room[];
    lineItems?: LineItem[];
    photos?: Photo[];
  };
  includePhotos?: boolean;
}

interface ESXLineItem {
  selector: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  total?: number;
  category?: string;
  roomId?: string;
}

interface ESXRoom {
  id: string;
  name: string;
  category?: string;
  levelName?: string;
  squareFeet?: number;
  perimeterLf?: number;
  wallSf?: number;
  ceilingSf?: number;
  heightFt?: number;
  lineItems: ESXLineItem[];
}

interface ESXLevel {
  name: string;
  label?: string;
  rooms: ESXRoom[];
}

function escapeXml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export function generateESX(options: ESXGeneratorOptions): string {
  const { estimate, includePhotos = true } = options;
  const levels = estimate.levels || [];
  const rooms = estimate.rooms || [];
  const lineItems = estimate.lineItems || [];
  const photos = estimate.photos || [];

  const levelsMap = new Map(levels.map(l => [l.id, l]));
  const roomsMap = new Map(rooms.map(r => [r.id, r]));

  const roomLineItems = new Map<string, LineItem[]>();
  const unassignedLineItems: LineItem[] = [];
  
  for (const item of lineItems) {
    if (item.roomId) {
      const existing = roomLineItems.get(item.roomId) || [];
      existing.push(item);
      roomLineItems.set(item.roomId, existing);
    } else {
      unassignedLineItems.push(item);
    }
  }

  const levelData: ESXLevel[] = [];
  const processedRoomIds = new Set<string>();

  for (const level of levels) {
    const levelRooms = rooms.filter(r => r.levelId === level.id);
    const esxRooms: ESXRoom[] = [];

    for (const room of levelRooms) {
      processedRoomIds.add(room.id);
      const items = roomLineItems.get(room.id) || [];
      esxRooms.push({
        id: room.id,
        name: room.name,
        category: room.category || undefined,
        levelName: level.label || level.name,
        squareFeet: room.squareFeet || undefined,
        perimeterLf: room.perimeterLf || undefined,
        wallSf: room.wallSf || undefined,
        ceilingSf: room.ceilingSf || undefined,
        heightFt: room.heightIn ? room.heightIn / 12 : undefined,
        lineItems: items.map(i => ({
          selector: i.selector || "",
          description: i.description || "",
          quantity: i.quantity || 0,
          unit: i.unit || "EA",
          unitPrice: i.unitPrice || undefined,
          total: i.total || undefined,
          category: i.category || undefined,
          roomId: room.id,
        })),
      });
    }

    if (esxRooms.length > 0) {
      levelData.push({
        name: level.name,
        label: level.label || undefined,
        rooms: esxRooms,
      });
    }
  }

  const unassignedRooms = rooms.filter(r => !processedRoomIds.has(r.id));
  if (unassignedRooms.length > 0 || unassignedLineItems.length > 0) {
    const miscRooms: ESXRoom[] = unassignedRooms.map(room => ({
      id: room.id,
      name: room.name,
      category: room.category || undefined,
      squareFeet: room.squareFeet || undefined,
      perimeterLf: room.perimeterLf || undefined,
      wallSf: room.wallSf || undefined,
      ceilingSf: room.ceilingSf || undefined,
      heightFt: room.heightIn ? room.heightIn / 12 : undefined,
      lineItems: (roomLineItems.get(room.id) || []).map(i => ({
        selector: i.selector || "",
        description: i.description || "",
        quantity: i.quantity || 0,
        unit: i.unit || "EA",
        unitPrice: i.unitPrice || undefined,
        total: i.total || undefined,
        category: i.category || undefined,
        roomId: room.id,
      })),
    }));

    if (unassignedLineItems.length > 0) {
      miscRooms.push({
        id: "general",
        name: "General",
        lineItems: unassignedLineItems.map(i => ({
          selector: i.selector || "",
          description: i.description || "",
          quantity: i.quantity || 0,
          unit: i.unit || "EA",
          unitPrice: i.unitPrice || undefined,
          total: i.total || undefined,
          category: i.category || undefined,
        })),
      });
    }

    if (miscRooms.length > 0) {
      levelData.push({
        name: "1",
        label: "First Floor",
        rooms: miscRooms,
      });
    }
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Xactimate version="28" xmlns="http://www.xactware.com/xactimate">
  <Project>
    <ProjectInfo>
      <ProjectName>${escapeXml(estimate.name)}</ProjectName>
      <ClaimNumber>${escapeXml(estimate.claimNumber)}</ClaimNumber>
      <PolicyNumber>${escapeXml(estimate.policyNumber)}</PolicyNumber>
      <DateOfLoss>${formatDate(estimate.dateOfLoss)}</DateOfLoss>
      <DateCreated>${formatDate(estimate.createdAt)}</DateCreated>
      <DateModified>${formatDate(estimate.updatedAt)}</DateModified>
    </ProjectInfo>
    <InsuredInfo>
      <Name>${escapeXml(estimate.insuredName)}</Name>
      <Phone>${escapeXml(estimate.insuredPhone)}</Phone>
      <Email>${escapeXml(estimate.insuredEmail)}</Email>
      <Address>
        <Street>${escapeXml(estimate.propertyAddress)}</Street>
        <City>${escapeXml(estimate.propertyCity)}</City>
        <State>${escapeXml(estimate.propertyState)}</State>
        <Zip>${escapeXml(estimate.propertyZip)}</Zip>
      </Address>
    </InsuredInfo>
    <AdjusterInfo>
      <Name>${escapeXml(estimate.adjusterName)}</Name>
      <Phone>${escapeXml(estimate.adjusterPhone)}</Phone>
      <Email>${escapeXml(estimate.adjusterEmail)}</Email>
    </AdjusterInfo>
    <Estimate>
      <TotalAmount>${totalAmount.toFixed(2)}</TotalAmount>
      <Levels>
`;

  for (const level of levelData) {
    xml += `        <Level name="${escapeXml(level.label || level.name)}">
`;
    for (const room of level.rooms) {
      xml += `          <Room name="${escapeXml(room.name)}"${room.category ? ` category="${escapeXml(room.category)}"` : ""}>
            <Dimensions>
              <SquareFeet>${room.squareFeet?.toFixed(2) || "0.00"}</SquareFeet>
              <PerimeterLF>${room.perimeterLf?.toFixed(2) || "0.00"}</PerimeterLF>
              <WallSF>${room.wallSf?.toFixed(2) || "0.00"}</WallSF>
              <CeilingSF>${room.ceilingSf?.toFixed(2) || "0.00"}</CeilingSF>
              <HeightFT>${room.heightFt?.toFixed(2) || "8.00"}</HeightFT>
            </Dimensions>
            <LineItems>
`;
      for (const item of room.lineItems) {
        xml += `              <LineItem>
                <Selector>${escapeXml(item.selector)}</Selector>
                <Description>${escapeXml(item.description)}</Description>
                <Quantity>${item.quantity.toFixed(2)}</Quantity>
                <Unit>${escapeXml(item.unit)}</Unit>
                <UnitPrice>${(item.unitPrice || 0).toFixed(2)}</UnitPrice>
                <Total>${(item.total || 0).toFixed(2)}</Total>
                <Category>${escapeXml(item.category)}</Category>
              </LineItem>
`;
      }
      xml += `            </LineItems>
          </Room>
`;
    }
    xml += `        </Level>
`;
  }

  xml += `      </Levels>
    </Estimate>
`;

  if (includePhotos && photos.length > 0) {
    xml += `    <Photos>
`;
    for (const photo of photos) {
      const roomName = photo.roomId && roomsMap.has(photo.roomId) 
        ? roomsMap.get(photo.roomId)!.name 
        : "General";
      xml += `      <Photo>
        <Filename>${escapeXml(photo.filename)}</Filename>
        <Room>${escapeXml(roomName)}</Room>
        <Type>${escapeXml(photo.photoType)}</Type>
        <Caption>${escapeXml(photo.caption)}</Caption>
        <TakenAt>${formatDate(photo.takenAt)}</TakenAt>
        <URL>${escapeXml(photo.url)}</URL>
      </Photo>
`;
    }
    xml += `    </Photos>
`;
  }

  xml += `  </Project>
</Xactimate>`;

  return xml;
}

export function generateESXFilename(estimate: Estimate): string {
  const claimPart = estimate.claimNumber 
    ? estimate.claimNumber.replace(/[^a-zA-Z0-9]/g, "-")
    : "no-claim";
  const datePart = new Date().toISOString().split("T")[0];
  return `${claimPart}_${datePart}.esx`;
}
