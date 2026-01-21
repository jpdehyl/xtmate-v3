import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  real,
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
