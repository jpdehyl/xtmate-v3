import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const requestSchema = z.object({
  name: z.string().min(1),
  jobType: z.enum(["insurance", "private"]),
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyState: z.string().optional(),
});

export type EnhanceDescriptionResponse = {
  enhancedName: string;
  explanation: string;
};

// POST /api/ai/enhance-description - Enhance estimate name/description
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

    const prompt = `You are a professional construction/restoration estimator. Improve the following estimate name to be more professional, clear, and descriptive while keeping it concise (under 100 characters).

Current Estimate Name: "${validatedData.name}"
Job Type: ${validatedData.jobType === "insurance" ? "Insurance Claim" : "Private/Direct Work"}
${locationContext ? `Property Location: ${locationContext}` : ""}

Guidelines:
- Make it professional and suitable for client-facing documents
- Include key details like project type or scope if identifiable
- ${validatedData.jobType === "insurance" ? "Include relevant insurance terminology (e.g., 'Water Damage Restoration', 'Storm Damage Repairs')" : "Use clear, homeowner-friendly language"}
- Keep it concise but descriptive
- Don't include specific dates or claim numbers in the name
- If the original is already professional, make minimal improvements

Respond in JSON format:
{
  "enhancedName": "The improved estimate name",
  "explanation": "Brief explanation of the improvements made"
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 256,
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
    let result: EnhanceDescriptionResponse;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      result = JSON.parse(jsonStr.trim());
    } catch {
      console.error("Failed to parse AI response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse enhanced description" },
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
    console.error("Error enhancing description:", error);
    return NextResponse.json(
      { error: "Failed to enhance description" },
      { status: 500 }
    );
  }
}
