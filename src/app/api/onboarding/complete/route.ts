import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations, organizationMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { type Role, ROLES } from "@/lib/auth/types";

// POST /api/onboarding/complete - Complete user onboarding
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { organizationName, role } = body;

    // Validate inputs
    if (!organizationName || typeof organizationName !== "string") {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    if (!role || !Object.values(ROLES).includes(role as Role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user already has an organization
    const existingMembership = await db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.userId, userId),
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User already belongs to an organization" },
        { status: 400 }
      );
    }

    // Generate slug from organization name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug is unique, append random suffix if not
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    const finalSlug = existingOrg
      ? `${slug}-${Math.random().toString(36).substring(2, 7)}`
      : slug;

    // Create organization
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: organizationName.trim(),
        slug: finalSlug,
        email: user.emailAddresses[0]?.emailAddress,
      })
      .returning();

    // Add user as member with selected role
    // If user selected admin, they become admin; otherwise, they still get the role they chose
    // (In a real app, you might want to make the first user always admin)
    const effectiveRole = role === ROLES.ADMIN ? ROLES.ADMIN : (role as Role);

    await db.insert(organizationMembers).values({
      organizationId: newOrg.id,
      userId,
      role: effectiveRole,
      displayName:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.emailAddresses[0]?.emailAddress || "User",
      email: user.emailAddresses[0]?.emailAddress,
      avatarUrl: user.imageUrl,
      status: "active",
      joinedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
      },
      role: effectiveRole,
    });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
