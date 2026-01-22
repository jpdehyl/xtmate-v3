import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  real,
  integer,
  boolean,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const estimateStatusEnum = pgEnum("estimate_status", [
  "draft",
  "in_progress",
  "completed",
]);

export const jobTypeEnum = pgEnum("job_type", ["insurance", "private"]);

// ============================================================================
// ORGANIZATIONS (Multi-tenant support)
// ============================================================================

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier

  // Contact
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),

  // Billing (Stripe integration ready)
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionTier: text("subscription_tier").default("free"), // free, pro, enterprise
  subscriptionStatus: text("subscription_status").default("active"),

  // Defaults
  defaultOverheadPercent: real("default_overhead_percent").default(10),
  defaultProfitPercent: real("default_profit_percent").default(10),
  defaultTaxPercent: real("default_tax_percent").default(0),
  timezone: text("timezone").default("America/Chicago"),

  // Branding
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  estimates: many(estimates),
}));

// ============================================================================
// ORGANIZATION MEMBERS (Team management)
// ============================================================================

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id").notNull(), // Clerk user ID

    // Role: admin, general_manager, qa_manager, estimator, pm, project_admin, field_staff, viewer
    role: text("role").notNull().default("viewer"),

    // Profile (cached from Clerk for display)
    displayName: text("display_name"),
    email: text("email"),
    avatarUrl: text("avatar_url"),

    // Permissions (custom overrides)
    permissions: jsonb("permissions"),

    // Status
    status: text("status").default("active"), // active, invited, suspended
    invitedAt: timestamp("invited_at"),
    invitedBy: text("invited_by"),
    joinedAt: timestamp("joined_at"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueMember: unique().on(table.organizationId, table.userId),
  })
);

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
  })
);

// ============================================================================
// ESTIMATES
// ============================================================================

export const estimates = pgTable("estimates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  status: estimateStatusEnum("status").notNull().default("draft"),
  jobType: jobTypeEnum("job_type").notNull().default("private"),

  // Organization (multi-tenant support)
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),

  // Property
  propertyAddress: text("property_address"),
  propertyCity: text("property_city"),
  propertyState: text("property_state"),
  propertyZip: text("property_zip"),

  // Claim info
  claimNumber: text("claim_number"),
  policyNumber: text("policy_number"),

  // M6: Carrier for SLA tracking (insurance jobs)
  carrierId: uuid("carrier_id"),

  // PM/Estimator workflow tracking
  workflowStatus: text("workflow_status").default("draft"), // draft, pm_assigned, pm_in_progress, pm_completed, estimator_review, ready_for_export, exported, submitted
  assignedPmId: text("assigned_pm_id"), // Clerk user ID of assigned PM
  assignedEstimatorId: text("assigned_estimator_id"), // Clerk user ID of assigned Estimator
  pmCompletedAt: timestamp("pm_completed_at"),
  estimatorStartedAt: timestamp("estimator_started_at"),
  
  // Insured contact info
  insuredName: text("insured_name"),
  insuredPhone: text("insured_phone"),
  insuredEmail: text("insured_email"),
  
  // Adjuster info (from RMS or manual entry)
  adjusterName: text("adjuster_name"),
  adjusterPhone: text("adjuster_phone"),
  adjusterEmail: text("adjuster_email"),
  
  // Date of loss
  dateOfLoss: timestamp("date_of_loss"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const estimatesRelations = relations(estimates, ({ one }) => ({
  organization: one(organizations, {
    fields: [estimates.organizationId],
    references: [organizations.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

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

// M4-4: Price Lists table
export const priceLists = pgTable('price_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  region: text('region'), // Geographic region for pricing
  effectiveDate: timestamp('effective_date'),
  expirationDate: timestamp('expiration_date'),
  isActive: boolean('is_active').default(true),
  itemCount: integer('item_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// M4-4: Price List Items table
export const priceListItems = pgTable('price_list_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  priceListId: uuid('price_list_id').references(() => priceLists.id, { onDelete: 'cascade' }).notNull(),
  category: text('category'),
  selector: text('selector'), // Xactimate code
  description: text('description'),
  unit: text('unit'),
  unitPrice: real('unit_price'),
  laborPrice: real('labor_price'),
  materialPrice: real('material_price'),
  equipmentPrice: real('equipment_price'),
  createdAt: timestamp('created_at').defaultNow(),
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

export type PriceList = typeof priceLists.$inferSelect;
export type NewPriceList = typeof priceLists.$inferInsert;

export type PriceListItem = typeof priceListItems.$inferSelect;
export type NewPriceListItem = typeof priceListItems.$inferInsert;

// ============================================================================
// M6: SLA & Workflow
// ============================================================================

// M6-1: Carriers table (insurance companies)
export const carriers = pgTable('carriers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // "SF", "ALL", "FAR"
  name: text('name').notNull(), // "State Farm", "Allstate"
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// M6-1: SLA Milestones enum
export const slaMilestoneEnum = pgEnum('sla_milestone', [
  'assigned',           // Job received
  'contacted',          // Insured contacted
  'site_visit',         // On-site inspection
  'estimate_uploaded',  // Estimate submitted
  'revision_requested', // Changes needed
  'approved',           // Approved by adjuster
  'closed',             // Job complete
]);

// M6-1: Carrier SLA Rules table
export const carrierSlaRules = pgTable('carrier_sla_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  carrierId: uuid('carrier_id').references(() => carriers.id, { onDelete: 'cascade' }),
  milestone: slaMilestoneEnum('milestone').notNull(),
  targetHours: integer('target_hours').notNull(),
  isBusinessHours: boolean('is_business_hours').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// M6-2: SLA Events table (actual milestone completions)
export const slaEvents = pgTable('sla_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  milestone: slaMilestoneEnum('milestone').notNull(),
  targetAt: timestamp('target_at'),
  completedAt: timestamp('completed_at'),
  isOverdue: boolean('is_overdue').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Export types for M6 tables
export type Carrier = typeof carriers.$inferSelect;
export type NewCarrier = typeof carriers.$inferInsert;

export type CarrierSlaRule = typeof carrierSlaRules.$inferSelect;
export type NewCarrierSlaRule = typeof carrierSlaRules.$inferInsert;

export type SlaEvent = typeof slaEvents.$inferSelect;
export type NewSlaEvent = typeof slaEvents.$inferInsert;

// SLA milestone labels for display
export const SLA_MILESTONE_LABELS: Record<string, string> = {
  assigned: 'Job Assigned',
  contacted: 'Insured Contacted',
  site_visit: 'Site Visit',
  estimate_uploaded: 'Estimate Uploaded',
  revision_requested: 'Revision Requested',
  approved: 'Approved',
  closed: 'Job Closed',
};

// Default SLA target hours (used when no carrier-specific rules exist)
export const DEFAULT_SLA_TARGETS: Record<string, number> = {
  assigned: 0,
  contacted: 4,
  site_visit: 24,
  estimate_uploaded: 48,
  revision_requested: 0, // Triggered by external event
  approved: 0, // Triggered by external event
  closed: 0, // Triggered by external event
};

// ============================================================================
// M8: Vendor Portal
// ============================================================================

// M8-1: Quote Request Status enum
export const quoteRequestStatusEnum = pgEnum('quote_request_status', [
  'pending',   // Request sent, awaiting vendor view
  'viewed',    // Vendor has viewed the request
  'quoted',    // Vendor has submitted a quote
  'accepted',  // Quote has been accepted
  'rejected',  // Quote has been rejected
  'expired',   // Request has expired
]);

// M8-1: Vendors table (subcontractors)
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Owner's Clerk ID (who created this vendor)
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  specialty: text('specialty'), // plumbing, electrical, flooring, roofing, HVAC, etc.
  notes: text('notes'),
  accessToken: text('access_token').unique(), // For portal login (no Clerk)
  tokenExpiresAt: timestamp('token_expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// M8-1: Quote Requests table
export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'cascade' }),
  status: quoteRequestStatusEnum('status').default('pending'),
  message: text('message'), // Optional message to vendor
  expiresAt: timestamp('expires_at'),
  viewedAt: timestamp('viewed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// M8-1: Quote Request Items table (line items included in request)
export const quoteRequestItems = pgTable('quote_request_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').references(() => quoteRequests.id, { onDelete: 'cascade' }),
  lineItemId: uuid('line_item_id').references(() => lineItems.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

// M8-1: Vendor Quotes table (vendor responses)
export const vendorQuotes = pgTable('vendor_quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').references(() => quoteRequests.id, { onDelete: 'cascade' }),
  totalAmount: real('total_amount'),
  laborAmount: real('labor_amount'),
  materialAmount: real('material_amount'),
  notes: text('notes'),
  validUntil: timestamp('valid_until'),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

// M8-1: Vendor Quote Line Items (individual pricing per line item)
export const vendorQuoteItems = pgTable('vendor_quote_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorQuoteId: uuid('vendor_quote_id').references(() => vendorQuotes.id, { onDelete: 'cascade' }),
  lineItemId: uuid('line_item_id').references(() => lineItems.id, { onDelete: 'cascade' }),
  unitPrice: real('unit_price'),
  quantity: real('quantity'),
  total: real('total'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Export types for M8 tables
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type NewQuoteRequest = typeof quoteRequests.$inferInsert;

export type QuoteRequestItem = typeof quoteRequestItems.$inferSelect;
export type NewQuoteRequestItem = typeof quoteRequestItems.$inferInsert;

export type VendorQuote = typeof vendorQuotes.$inferSelect;
export type NewVendorQuote = typeof vendorQuotes.$inferInsert;

export type VendorQuoteItem = typeof vendorQuoteItems.$inferSelect;
export type NewVendorQuoteItem = typeof vendorQuoteItems.$inferInsert;

// Vendor specialty options
export const VENDOR_SPECIALTIES = [
  'plumbing',
  'electrical',
  'flooring',
  'roofing',
  'hvac',
  'painting',
  'drywall',
  'carpentry',
  'demolition',
  'cleaning',
  'mold_remediation',
  'water_mitigation',
  'fire_restoration',
  'general_contractor',
  'other',
] as const;

export type VendorSpecialty = typeof VENDOR_SPECIALTIES[number];

// ============================================================================
// PM/ESTIMATOR WORKFLOW
// ============================================================================

// Workflow status enum - tracks where estimate is in PM→Estimator flow
export const workflowStatusEnum = pgEnum('workflow_status', [
  'draft',              // Initial creation
  'pm_assigned',        // PM has been assigned
  'pm_in_progress',     // PM is at site capturing data
  'pm_completed',       // PM has finished site capture
  'estimator_review',   // Estimator is reviewing/building estimate
  'ready_for_export',   // Estimate complete, ready for ESX export
  'exported',           // ESX has been generated
  'submitted',          // Submitted to carrier/Xactimate
]);

// PM Scope Items - PM's plain-language damage observations
// These are converted to proper line items by the estimator
export const pmScopeItems = pgTable('pm_scope_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  
  // Damage details
  damageType: text('damage_type'), // water, fire, smoke, mold, impact, wind
  severity: text('severity'), // minor, moderate, severe
  category: text('category'), // cat1, cat2, cat3 (for water)
  
  // PM's observations
  affectedArea: text('affected_area'), // "floor and lower 2ft of drywall"
  notes: text('notes'), // Detailed notes from PM
  suggestedActions: jsonb('suggested_actions'), // ["Remove baseboards", "Cut drywall 2ft"]
  
  // Photos linked to this scope item
  photoIds: jsonb('photo_ids'), // Array of photo UUIDs
  
  // Conversion tracking
  convertedToLineItemId: uuid('converted_to_line_item_id').references(() => lineItems.id, { onDelete: 'set null' }),
  convertedAt: timestamp('converted_at'),
  convertedBy: text('converted_by'), // User ID who converted
  
  // Metadata
  capturedAt: timestamp('captured_at').defaultNow(),
  capturedBy: text('captured_by'), // PM's user ID
  deviceId: text('device_id'), // iOS device identifier
  localId: text('local_id'), // Client-side UUID for offline sync
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ESX Export History - track all exports
export const esxExports = pgTable('esx_exports', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  
  // Export details
  filename: text('filename').notNull(),
  fileUrl: text('file_url'), // Blob storage URL
  fileSizeBytes: integer('file_size_bytes'),
  
  // What was included
  roomCount: integer('room_count'),
  lineItemCount: integer('line_item_count'),
  photoCount: integer('photo_count'),
  totalAmount: real('total_amount'),
  
  // Export metadata
  exportedBy: text('exported_by').notNull(), // User ID
  exportedAt: timestamp('exported_at').defaultNow(),
  
  // Version tracking
  version: integer('version').default(1),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Sync Queue - for offline iOS app sync
export const syncQueue = pgTable('sync_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Device info
  deviceId: text('device_id').notNull(),
  userId: text('user_id').notNull(),
  
  // Sync data
  entityType: text('entity_type').notNull(), // room, photo, pm_scope_item
  entityId: text('entity_id').notNull(), // Local or server UUID
  action: text('action').notNull(), // create, update, delete
  payload: jsonb('payload'), // Full entity data
  
  // Sync status
  status: text('status').default('pending'), // pending, processing, completed, failed
  attempts: integer('attempts').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  errorMessage: text('error_message'),
  
  // Timestamps
  queuedAt: timestamp('queued_at').defaultNow(),
  processedAt: timestamp('processed_at'),
});

// Export types for new tables
export type PmScopeItem = typeof pmScopeItems.$inferSelect;
export type NewPmScopeItem = typeof pmScopeItems.$inferInsert;

export type EsxExport = typeof esxExports.$inferSelect;
export type NewEsxExport = typeof esxExports.$inferInsert;

export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;

// Damage type options
export const DAMAGE_TYPES = [
  'water',
  'fire',
  'smoke',
  'mold',
  'impact',
  'wind',
  'vandalism',
  'other',
] as const;

export type DamageType = typeof DAMAGE_TYPES[number];

// Severity options
export const SEVERITY_LEVELS = [
  'minor',
  'moderate',
  'severe',
] as const;

export type SeverityLevel = typeof SEVERITY_LEVELS[number];

// Water category options (for water damage)
export const WATER_CATEGORIES = [
  'cat1', // Clean water
  'cat2', // Gray water
  'cat3', // Black water
] as const;

export type WaterCategory = typeof WATER_CATEGORIES[number];
