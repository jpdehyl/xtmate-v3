import { pgTable, text, timestamp, uuid, pgEnum, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const estimateStatusEnum = pgEnum("estimate_status", [
  "draft",
  "in_progress",
  "completed",
]);

export const jobTypeEnum = pgEnum("job_type", ["insurance", "private"]);

export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  status: estimateStatusEnum("status").notNull().default("draft"),
  jobType: jobTypeEnum("job_type").notNull().default("private"),
  propertyAddress: text("property_address"),
  propertyCity: text("property_city"),
  propertyState: text("property_state"),
  propertyZip: text("property_zip"),
  claimNumber: text("claim_number"),
  policyNumber: text("policy_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Estimate = typeof estimates.$inferSelect;
export type NewEstimate = typeof estimates.$inferInsert;

// ============================================================================
// M2: Database Schema Expansion
// ============================================================================

// M2-1: Levels table (floor levels)
export const levels = pgTable('levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "1", "2", "B", "A"
  label: text('label'), // "First Floor", "Basement"
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// M2-2: Rooms table
export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  levelId: uuid('level_id').references(() => levels.id),
  name: text('name').notNull(),
  category: text('category'), // kitchen, bathroom, bedroom, living, dining, etc.
  lengthIn: real('length_in'),
  widthIn: real('width_in'),
  heightIn: real('height_in').default(96), // 8ft default
  squareFeet: real('square_feet'),
  cubicFeet: real('cubic_feet'),
  perimeterLf: real('perimeter_lf'),
  wallSf: real('wall_sf'),
  ceilingSf: real('ceiling_sf'),
  floorMaterial: text('floor_material'),
  wallMaterial: text('wall_material'),
  ceilingMaterial: text('ceiling_material'),
  geometry: jsonb('geometry'), // For sketch editor
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// M2-3: Annotations table (damage markers)
export const annotations = pgTable('annotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  damageType: text('damage_type'), // water, fire, smoke, mold, impact, wind
  severity: text('severity'), // light, moderate, heavy, severe
  category: text('category'), // cat1, cat2, cat3 (water contamination)
  positionX: real('position_x'),
  positionY: real('position_y'),
  positionZ: real('position_z'),
  affectedSurfaces: jsonb('affected_surfaces'), // ['floor', 'wall', 'ceiling']
  affectedHeightIn: real('affected_height_in'),
  affectedAreaSf: real('affected_area_sf'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// M2-4: Line Items table
export const lineItems = pgTable('line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id),
  annotationId: uuid('annotation_id').references(() => annotations.id),
  category: text('category'), // WTR, DRY, DEM, DRW, FLR, PNT, CLN
  selector: text('selector'), // Xactimate code
  description: text('description'),
  quantity: real('quantity'),
  unit: text('unit'), // SF, LF, EA, SY, HR
  unitPrice: real('unit_price'),
  total: real('total'),
  source: text('source').default('manual'), // manual, ai_generated, template
  aiConfidence: real('ai_confidence'),
  verified: boolean('verified').default(false),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// M2-5: Photos table
export const photoTypeEnum = pgEnum('photo_type', ['BEFORE', 'DURING', 'AFTER', 'DAMAGE', 'EQUIPMENT', 'OVERVIEW']);

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id),
  annotationId: uuid('annotation_id').references(() => annotations.id),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  filename: text('filename'),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  photoType: photoTypeEnum('photo_type'),
  caption: text('caption'),
  takenAt: timestamp('taken_at'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// M2-6: Assignments table
export const assignmentTypeEnum = pgEnum('assignment_type', ['E', 'A', 'R', 'P', 'C', 'Z']);
export const assignmentStatusEnum = pgEnum('assignment_status', ['pending', 'in_progress', 'submitted', 'approved', 'completed']);

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  type: assignmentTypeEnum('type').notNull(),
  status: assignmentStatusEnum('status').default('pending'),
  subtotal: real('subtotal').default(0),
  overhead: real('overhead').default(0),
  profit: real('profit').default(0),
  tax: real('tax').default(0),
  total: real('total').default(0),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Export types for all new tables
export type Level = typeof levels.$inferSelect;
export type NewLevel = typeof levels.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type Annotation = typeof annotations.$inferSelect;
export type NewAnnotation = typeof annotations.$inferInsert;

export type LineItem = typeof lineItems.$inferSelect;
export type NewLineItem = typeof lineItems.$inferInsert;

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
