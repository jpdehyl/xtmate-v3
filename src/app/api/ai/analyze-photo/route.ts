import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const requestSchema = z.object({
  photoUrl: z.string().url(),
  jobType: z.enum(["insurance", "private"]).optional().default("insurance"),
  roomCategory: z.string().optional(),
  propertyType: z.string().optional(),
  existingContext: z.string().optional(),
});

export type DamageAssessment = {
  damageType: string;
  severity: "minor" | "moderate" | "severe";
  affectedArea: string;
  description: string;
};

export type ScopeItem = {
  id: string;
  category: string;
  selector: string;
  description: string;
  estimatedQuantity: string;
  unit: string;
  priority: "high" | "medium" | "low";
  notes: string;
};

export type AnalyzePhotoResponse = {
  summary: string;
  damageAssessments: DamageAssessment[];
  suggestedScopes: ScopeItem[];
  additionalNotes: string[];
  confidence: number;
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    const contextParts = [];
    if (validatedData.roomCategory) {
      contextParts.push(`Room Type: ${validatedData.roomCategory}`);
    }
    if (validatedData.propertyType) {
      contextParts.push(`Property Type: ${validatedData.propertyType}`);
    }
    if (validatedData.existingContext) {
      contextParts.push(`Additional Context: ${validatedData.existingContext}`);
    }

    const systemPrompt = `You are an expert insurance restoration and construction estimator with deep knowledge of Xactimate pricing software. Your role is to analyze property damage photos and provide detailed scope assessments.

When analyzing photos, you must:
1. Identify all visible damage types (water, fire, mold, structural, etc.)
2. Assess severity levels accurately
3. Suggest specific Xactimate line items with appropriate selectors
4. Consider both direct damage and consequential repairs
5. Account for industry-standard practices and insurance requirements

${validatedData.jobType === "insurance" ? "This is an insurance claim - include proper documentation items, moisture testing, and tear-out procedures as required." : "This is private work - focus on practical repair solutions."}

Respond in valid JSON format with this exact structure:
{
  "summary": "Brief overall assessment of the damage shown",
  "damageAssessments": [
    {
      "damageType": "Type of damage (Water, Fire, Mold, Impact, etc.)",
      "severity": "minor|moderate|severe",
      "affectedArea": "Specific area affected (ceiling, wall, floor, etc.)",
      "description": "Detailed description of the damage"
    }
  ],
  "suggestedScopes": [
    {
      "id": "unique-id",
      "category": "Category (WTR, DRY, DEM, DRW, FLR, PNT, CLN, etc.)",
      "selector": "Xactimate selector code if known, or descriptive code",
      "description": "Detailed scope item description",
      "estimatedQuantity": "Estimated quantity or TBD",
      "unit": "SF|LF|EA|SY|HR",
      "priority": "high|medium|low",
      "notes": "Additional notes for this scope item"
    }
  ],
  "additionalNotes": ["Any important observations or recommendations"],
  "confidence": 0.85
}`;

    const userPrompt = `Please analyze this property damage photo and provide a comprehensive scope assessment.

${contextParts.length > 0 ? `Context:\n${contextParts.join("\n")}` : ""}

Analyze the image for:
1. All visible damage and its extent
2. Recommended repair scope items with Xactimate codes where applicable
3. Priority levels for each repair item
4. Any safety concerns or immediate actions needed`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image", source: { type: "url", url: validatedData.photoUrl } },
          ],
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    let result: AnalyzePhotoResponse;
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
        { error: "Failed to parse photo analysis" },
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
    console.error("Error analyzing photo:", error);
    return NextResponse.json(
      { error: "Failed to analyze photo" },
      { status: 500 }
    );
  }
}
