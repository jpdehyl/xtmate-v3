import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/lib/db";
import { estimates, rooms, lineItems, photos, levels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const requestSchema = z.object({
  estimateId: z.string().uuid(),
  reportType: z.enum([
    "executive_summary",
    "detailed_scope",
    "damage_assessment",
    "insurance_narrative",
    "homeowner_summary",
  ]),
  includePhotos: z.boolean().optional().default(true),
  customInstructions: z.string().optional(),
});

export type GenerateReportResponse = {
  title: string;
  content: string;
  sections: {
    heading: string;
    content: string;
  }[];
  metadata: {
    generatedAt: string;
    reportType: string;
    estimateId: string;
  };
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    const estimate = await db.query.estimates.findFirst({
      where: eq(estimates.id, validatedData.estimateId),
    });

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    if (estimate.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [estimateLevels, estimateRooms, estimateLineItems, estimatePhotos] = await Promise.all([
      db.select().from(levels).where(eq(levels.estimateId, validatedData.estimateId)),
      db.select().from(rooms).where(eq(rooms.estimateId, validatedData.estimateId)),
      db.select().from(lineItems).where(eq(lineItems.estimateId, validatedData.estimateId)),
      db.select().from(photos).where(eq(photos.estimateId, validatedData.estimateId)),
    ]);

    const totalAmount = estimateLineItems.reduce((sum, item) => sum + (item.total || 0), 0);

    const reportTypeInstructions: Record<string, string> = {
      executive_summary: `Create a concise executive summary suitable for stakeholders. Include key findings, total scope, and timeline recommendations. Keep it under 500 words.`,
      detailed_scope: `Create a comprehensive detailed scope document listing all work items, organized by room/area. Include quantities, descriptions, and any special requirements.`,
      damage_assessment: `Create a professional damage assessment report documenting all identified damage, affected areas, and recommended repairs. Use technical terminology appropriate for insurance adjusters.`,
      insurance_narrative: `Create an insurance-friendly narrative report that clearly explains the cause of loss, extent of damage, and necessity of each repair item. Use Xactimate-compatible terminology.`,
      homeowner_summary: `Create a homeowner-friendly summary that explains the project in clear, non-technical language. Include what work will be done, approximate timeline, and what to expect during repairs.`,
    };

    const systemPrompt = `You are a professional restoration project manager creating reports for construction and insurance restoration projects. Your reports should be:
1. Professional and well-organized
2. Accurate to the data provided
3. Appropriate for the intended audience
4. Clear and comprehensive

Format your response as valid JSON with this structure:
{
  "title": "Report Title",
  "content": "Brief overall summary",
  "sections": [
    { "heading": "Section Heading", "content": "Section content..." }
  ],
  "metadata": {
    "generatedAt": "ISO date string",
    "reportType": "report type",
    "estimateId": "estimate id"
  }
}`;

    const estimateData = {
      name: estimate.name,
      status: estimate.status,
      jobType: estimate.jobType,
      propertyAddress: [
        estimate.propertyAddress,
        estimate.propertyCity,
        estimate.propertyState,
        estimate.propertyZip,
      ].filter(Boolean).join(", "),
      claimNumber: estimate.claimNumber,
      policyNumber: estimate.policyNumber,
      levels: estimateLevels.map(l => ({ name: l.name, label: l.label })),
      rooms: estimateRooms.map(r => ({
        name: r.name,
        category: r.category,
        squareFeet: r.squareFeet,
        materials: {
          floor: r.floorMaterial,
          wall: r.wallMaterial,
          ceiling: r.ceilingMaterial,
        },
      })),
      lineItems: estimateLineItems.map(li => ({
        category: li.category,
        selector: li.selector,
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        total: li.total,
        verified: li.verified,
      })),
      photoCount: estimatePhotos.length,
      totalAmount,
    };

    const userPrompt = `${reportTypeInstructions[validatedData.reportType]}

${validatedData.customInstructions ? `Additional Instructions: ${validatedData.customInstructions}` : ""}

Estimate Data:
${JSON.stringify(estimateData, null, 2)}

Generate the ${validatedData.reportType.replace(/_/g, " ")} report now.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    let result: GenerateReportResponse;
    try {
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      result = JSON.parse(jsonStr.trim());
    } catch {
      console.error("Failed to parse AI response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to generate report" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
