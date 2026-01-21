// Xactimate Category Codes Reference
// Standard categories used in restoration/construction estimating

export interface XactimateCategory {
  code: string;
  name: string;
  description: string;
  commonUnits: string[];
}

export const XACTIMATE_CATEGORIES: XactimateCategory[] = [
  // General/Labor Categories
  { code: "GEN", name: "General", description: "General labor and supervision", commonUnits: ["HR", "EA"] },
  { code: "GC", name: "General Contractor", description: "General contractor services and overhead", commonUnits: ["HR", "EA"] },

  // Demolition & Prep
  { code: "DEM", name: "Demolition", description: "Tear out and removal work", commonUnits: ["SF", "LF", "EA"] },
  { code: "CLN", name: "Cleaning", description: "Cleaning services", commonUnits: ["SF", "HR"] },
  { code: "HAZ", name: "Hazardous Materials", description: "Asbestos, lead, mold remediation", commonUnits: ["SF", "LF", "EA"] },

  // Water & Drying
  { code: "WTR", name: "Water Mitigation", description: "Water extraction and mitigation", commonUnits: ["SF", "HR", "EA"] },
  { code: "DRY", name: "Drying", description: "Structural drying and dehumidification", commonUnits: ["SF", "HR", "EA", "DAY"] },

  // Structural
  { code: "FRM", name: "Framing", description: "Wood framing and structural lumber", commonUnits: ["LF", "SF", "EA"] },
  { code: "STL", name: "Steel", description: "Structural steel work", commonUnits: ["LF", "EA", "LB"] },
  { code: "CNT", name: "Concrete", description: "Concrete work", commonUnits: ["SF", "CY", "LF"] },
  { code: "MAS", name: "Masonry", description: "Brick, block, and stone work", commonUnits: ["SF", "EA"] },

  // Exterior
  { code: "RFG", name: "Roofing", description: "Roofing materials and installation", commonUnits: ["SQ", "SF", "LF"] },
  { code: "SDG", name: "Siding", description: "Siding materials and installation", commonUnits: ["SF", "LF"] },
  { code: "WDW", name: "Windows", description: "Windows and glazing", commonUnits: ["EA", "SF"] },
  { code: "DOR", name: "Doors", description: "Exterior and interior doors", commonUnits: ["EA"] },
  { code: "GTR", name: "Gutters", description: "Gutters and downspouts", commonUnits: ["LF", "EA"] },
  { code: "AWN", name: "Awnings", description: "Awnings and canopies", commonUnits: ["SF", "EA"] },
  { code: "FNC", name: "Fencing", description: "Fencing and gates", commonUnits: ["LF", "EA"] },
  { code: "DCK", name: "Decking", description: "Decks and porches", commonUnits: ["SF", "LF"] },

  // Interior Finishes
  { code: "DRW", name: "Drywall", description: "Drywall installation and finishing", commonUnits: ["SF", "LF"] },
  { code: "PLS", name: "Plaster", description: "Plaster and stucco work", commonUnits: ["SF", "LF"] },
  { code: "ACM", name: "Acoustical", description: "Acoustical ceilings and treatments", commonUnits: ["SF", "EA"] },
  { code: "PNT", name: "Painting", description: "Painting and wall covering", commonUnits: ["SF", "LF"] },
  { code: "FLR", name: "Flooring", description: "Floor covering and installation", commonUnits: ["SF", "SY", "LF"] },
  { code: "CRP", name: "Carpet", description: "Carpet and padding", commonUnits: ["SY", "SF"] },
  { code: "TLE", name: "Tile", description: "Ceramic and stone tile", commonUnits: ["SF", "LF"] },
  { code: "HWF", name: "Hardwood Flooring", description: "Hardwood floor installation and refinishing", commonUnits: ["SF"] },
  { code: "VNL", name: "Vinyl", description: "Vinyl flooring and sheet goods", commonUnits: ["SF", "SY"] },
  { code: "LMT", name: "Laminate", description: "Laminate flooring", commonUnits: ["SF"] },

  // Trim & Millwork
  { code: "TRM", name: "Trim", description: "Interior trim and molding", commonUnits: ["LF", "EA"] },
  { code: "CAB", name: "Cabinets", description: "Cabinetry installation", commonUnits: ["LF", "EA"] },
  { code: "CTR", name: "Countertops", description: "Countertop installation", commonUnits: ["SF", "LF"] },
  { code: "MIL", name: "Millwork", description: "Custom millwork and built-ins", commonUnits: ["LF", "EA", "SF"] },

  // Systems
  { code: "ELE", name: "Electrical", description: "Electrical work and fixtures", commonUnits: ["EA", "LF"] },
  { code: "PLB", name: "Plumbing", description: "Plumbing work and fixtures", commonUnits: ["EA", "LF"] },
  { code: "HVC", name: "HVAC", description: "Heating, ventilation, and air conditioning", commonUnits: ["EA", "TON", "LF"] },
  { code: "INS", name: "Insulation", description: "Thermal and acoustic insulation", commonUnits: ["SF", "LF"] },
  { code: "FFP", name: "Fire Protection", description: "Fire sprinklers and suppression", commonUnits: ["EA", "LF"] },

  // Appliances & Equipment
  { code: "APP", name: "Appliances", description: "Household appliances", commonUnits: ["EA"] },
  { code: "EQP", name: "Equipment", description: "Rental and specialized equipment", commonUnits: ["EA", "DAY", "WK"] },

  // Specialty
  { code: "FNS", name: "Finish Hardware", description: "Door hardware, locks, hinges", commonUnits: ["EA"] },
  { code: "MRR", name: "Mirrors", description: "Mirrors and glass", commonUnits: ["SF", "EA"] },
  { code: "CLK", name: "Caulking", description: "Caulking and sealants", commonUnits: ["LF", "TB"] },
  { code: "WPR", name: "Waterproofing", description: "Waterproofing and moisture barriers", commonUnits: ["SF", "LF"] },

  // Exterior/Site Work
  { code: "EXC", name: "Excavation", description: "Excavation and grading", commonUnits: ["CY", "HR"] },
  { code: "LAN", name: "Landscaping", description: "Landscaping and irrigation", commonUnits: ["SF", "EA"] },
  { code: "PVG", name: "Paving", description: "Asphalt and concrete paving", commonUnits: ["SF", "SY"] },

  // Contents
  { code: "CNT", name: "Contents", description: "Personal property and contents", commonUnits: ["EA"] },
  { code: "MOV", name: "Moving", description: "Pack-out, storage, and moving", commonUnits: ["HR", "EA"] },

  // Temporary Services
  { code: "TMP", name: "Temporary", description: "Temporary facilities and protection", commonUnits: ["EA", "DAY", "WK"] },
  { code: "SEC", name: "Security", description: "Security services and board-up", commonUnits: ["SF", "EA", "HR"] },
];

// Common unit types for reference
export const UNIT_TYPES = {
  SF: "Square Feet",
  SY: "Square Yards",
  SQ: "Squares (100 SF)",
  LF: "Linear Feet",
  CY: "Cubic Yards",
  EA: "Each",
  HR: "Hour",
  DAY: "Day",
  WK: "Week",
  MO: "Month",
  TON: "Ton",
  LB: "Pound",
  GAL: "Gallon",
  TB: "Tube",
};

// Get category by code
export function getCategoryByCode(code: string): XactimateCategory | undefined {
  return XACTIMATE_CATEGORIES.find(cat => cat.code === code.toUpperCase());
}

// Get categories for dropdown
export function getCategoryOptions(): { value: string; label: string }[] {
  return XACTIMATE_CATEGORIES.map(cat => ({
    value: cat.code,
    label: `${cat.code} - ${cat.name}`,
  }));
}

// Get unit options
export function getUnitOptions(): { value: string; label: string }[] {
  return Object.entries(UNIT_TYPES).map(([value, label]) => ({
    value,
    label: `${value} (${label})`,
  }));
}

// Group categories by type
export const CATEGORY_GROUPS = {
  "General/Labor": ["GEN", "GC"],
  "Demolition & Prep": ["DEM", "CLN", "HAZ"],
  "Water & Drying": ["WTR", "DRY"],
  "Structural": ["FRM", "STL", "CNT", "MAS"],
  "Exterior": ["RFG", "SDG", "WDW", "DOR", "GTR", "AWN", "FNC", "DCK"],
  "Interior Finishes": ["DRW", "PLS", "ACM", "PNT", "FLR", "CRP", "TLE", "HWF", "VNL", "LMT"],
  "Trim & Millwork": ["TRM", "CAB", "CTR", "MIL"],
  "Systems": ["ELE", "PLB", "HVC", "INS", "FFP"],
  "Appliances & Equipment": ["APP", "EQP"],
  "Specialty": ["FNS", "MRR", "CLK", "WPR"],
  "Site Work": ["EXC", "LAN", "PVG"],
  "Contents": ["CNT", "MOV"],
  "Temporary Services": ["TMP", "SEC"],
};

// Get grouped categories for UI
export function getGroupedCategories(): { group: string; categories: XactimateCategory[] }[] {
  return Object.entries(CATEGORY_GROUPS).map(([group, codes]) => ({
    group,
    categories: codes
      .map(code => getCategoryByCode(code))
      .filter((cat): cat is XactimateCategory => cat !== undefined),
  }));
}
