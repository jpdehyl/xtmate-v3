import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

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
