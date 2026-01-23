import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const requestSchema = z.object({
  fieldType: z.enum([
    "estimate_name",
    "room_details",
    "line_item",
    "claim_info",
    "property_info",
  ]),
  currentData: z.record(z.any()).optional(),
  context: z.object({
    jobType: z.enum(["insurance", "private"]).optional(),
    estimateName: z.string().optional(),
    propertyAddress: z.string().optional(),
    roomCategory: z.string().optional(),
    damageType: z.string().optional(),
  }).optional(),
});

export type FillDataResponse = {
  suggestions: Record<string, string | number>;
  reasoning: string;
  alternatives?: Record<string, string | number>[];
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

    const fieldPrompts: Record<string, string> = {
      estimate_name: `Generate a professional estimate name/title based on the context provided. The name should be concise (under 80 characters), professional, and clearly identify the project type.`,
      room_details: `Suggest appropriate room details including dimensions, materials, and category. Use typical industry standards for the room type.`,
      line_item: `Suggest line item details including category, Xactimate selector, description, estimated quantity, and unit. Use accurate restoration industry terminology.`,
      claim_info: `Suggest how to format claim information professionally. Include any standard fields typically needed for insurance claims.`,
      property_info: `Suggest property information formatting and any missing details that would be helpful for the estimate.`,
    };

    const systemPrompt = `You are an expert construction and restoration estimator assistant. Help fill in missing data fields based on the context provided. Your suggestions should be:
1. Professional and industry-standard
2. Accurate for insurance claims when applicable
3. Based on typical values for similar projects
4. Formatted correctly for the field type

Always respond in valid JSON format with this structure:
{
  "suggestions": { "fieldName": "suggested value" },
  "reasoning": "Brief explanation of why these values were suggested",
  "alternatives": [{ "fieldName": "alternative value" }]
}`;

    const contextStr = validatedData.context 
      ? Object.entries(validatedData.context)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "No additional context provided";

    const currentDataStr = validatedData.currentData
      ? Object.entries(validatedData.currentData)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "No current data";

    const userPrompt = `${fieldPrompts[validatedData.fieldType]}

Field Type: ${validatedData.fieldType}

Current Data:
${currentDataStr}

Context:
${contextStr}

Please suggest appropriate values for any empty or missing fields.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
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

    let result: FillDataResponse;
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
        { error: "Failed to parse suggestions" },
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
    console.error("Error generating fill suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
