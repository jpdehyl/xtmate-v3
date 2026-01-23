import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const requestSchema = z.object({
  jobType: z.enum(["insurance", "private"]),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().optional(),
  estimateName: z.string().optional(),
});

export type ScopeSuggestion = {
  id: string;
  category: string;
  item: string;
  description: string;
  estimatedQuantity?: string;
  unit?: string;
};

export type SuggestScopeResponse = {
  suggestions: ScopeSuggestion[];
};

// POST /api/ai/suggest-scope - Get AI-generated scope suggestions
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

    const locationContext = [
      validatedData.propertyAddress,
      validatedData.propertyCity,
      validatedData.propertyState,
    ]
      .filter(Boolean)
      .join(", ");

    const prompt = `You are an expert construction/landscaping estimator. Based on the following project details, suggest relevant scope items that should be considered for this estimate.

Project Details:
- Job Type: ${validatedData.jobType === "insurance" ? "Insurance Claim" : "Private/Direct Work"}
- Estimate Name: ${validatedData.estimateName || "Not specified"}
${locationContext ? `- Property Location: ${locationContext}` : ""}

Please provide a list of 5-10 relevant scope items that a professional estimator should consider for this type of project. For each item, include:
1. Category (e.g., "Demolition", "Roofing", "Siding", "Interior", "Landscaping", "Cleanup")
2. Item name (specific work item)
3. Brief description of the work
4. Estimated quantity (if applicable, use "TBD" if needs site assessment)
5. Unit of measurement (SF, LF, EA, HR, etc.)

${validatedData.jobType === "insurance" ? "Since this is an insurance claim, include items commonly required by insurance adjusters like documentation, moisture testing, and proper tear-out procedures." : "Since this is private work, focus on common items that provide clear value to homeowners."}

Respond in JSON format with this structure:
{
  "suggestions": [
    {
      "id": "unique-id",
      "category": "Category Name",
      "item": "Item Name",
      "description": "Brief description",
      "estimatedQuantity": "TBD or specific number",
      "unit": "SF/LF/EA/HR/etc"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text content from the response
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "Invalid AI response" },
        { status: 500 }
      );
    }

    // Parse the JSON response from Claude
    let suggestions: SuggestScopeResponse;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      suggestions = JSON.parse(jsonStr.trim());
    } catch {
      console.error("Failed to parse AI response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse AI suggestions" },
        { status: 500 }
      );
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error generating scope suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
