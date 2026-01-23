import { cache } from 'react';
import { db } from '@/lib/db';
import { estimates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Cached database queries using React.cache() for per-request deduplication.
 * These functions prevent redundant database calls within the same request.
 */

/**
 * Get all estimates for a user, cached per request.
 * Use this instead of direct db queries in Server Components.
 * Note: Explicitly selecting columns to avoid issues with missing columns during migrations.
 */
export const getEstimatesByUserId = cache(async (userId: string) => {
  return db
    .select({
      id: estimates.id,
      userId: estimates.userId,
      name: estimates.name,
      status: estimates.status,
      jobType: estimates.jobType,
      projectType: estimates.projectType,
      projectNumber: estimates.projectNumber,
      organizationId: estimates.organizationId,
      propertyAddress: estimates.propertyAddress,
      propertyCity: estimates.propertyCity,
      propertyState: estimates.propertyState,
      propertyZip: estimates.propertyZip,
      claimNumber: estimates.claimNumber,
      policyNumber: estimates.policyNumber,
      carrierId: estimates.carrierId,
      workflowStatus: estimates.workflowStatus,
      assignedPmId: estimates.assignedPmId,
      assignedEstimatorId: estimates.assignedEstimatorId,
      pmCompletedAt: estimates.pmCompletedAt,
      estimatorStartedAt: estimates.estimatorStartedAt,
      insuredName: estimates.insuredName,
      insuredPhone: estimates.insuredPhone,
      insuredEmail: estimates.insuredEmail,
      adjusterName: estimates.adjusterName,
      adjusterPhone: estimates.adjusterPhone,
      adjusterEmail: estimates.adjusterEmail,
      dateOfLoss: estimates.dateOfLoss,
      createdAt: estimates.createdAt,
      updatedAt: estimates.updatedAt,
    })
    .from(estimates)
    .where(eq(estimates.userId, userId))
    .orderBy(desc(estimates.updatedAt));
});

/**
 * Get a single estimate by ID, cached per request.
 * Returns null if not found or user doesn't have access.
 */
export const getEstimateById = cache(async (id: string, userId: string) => {
  const result = await db
    .select()
    .from(estimates)
    .where(eq(estimates.id, id))
    .limit(1);

  const estimate = result[0];

  // Verify ownership
  if (!estimate || estimate.userId !== userId) {
    return null;
  }

  return estimate;
});

/**
 * Get estimates with only the fields needed for the dashboard metrics.
 * This reduces serialization overhead for client components.
 */
export const getEstimatesForMetrics = cache(async (userId: string) => {
  const allEstimates = await getEstimatesByUserId(userId);

  return allEstimates.map(e => ({
    id: e.id,
    status: e.status,
    createdAt: e.createdAt,
    jobType: e.jobType,
  }));
});

/**
 * Get estimates with only the fields needed for the recent estimates list.
 */
export const getEstimatesForRecentList = cache(async (userId: string) => {
  const allEstimates = await getEstimatesByUserId(userId);

  return allEstimates.slice(0, 5).map(e => ({
    id: e.id,
    name: e.name,
    propertyAddress: e.propertyAddress,
    propertyCity: e.propertyCity,
    propertyState: e.propertyState,
    status: e.status,
    updatedAt: e.updatedAt,
    jobType: e.jobType,
  }));
});

/**
 * Get estimates with only the fields needed for the projects map.
 */
export const getEstimatesForMap = cache(async (userId: string) => {
  const allEstimates = await getEstimatesByUserId(userId);

  return allEstimates.map(e => ({
    id: e.id,
    name: e.name,
    propertyAddress: e.propertyAddress,
    propertyCity: e.propertyCity,
    propertyState: e.propertyState,
    status: e.status,
    jobType: e.jobType,
  }));
});

/**
 * Get count of active (in_progress) estimates for a user.
 */
export const getActiveEstimatesCount = cache(async (userId: string) => {
  const allEstimates = await getEstimatesByUserId(userId);
  return allEstimates.filter(e => e.status === 'in_progress').length;
});
