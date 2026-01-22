import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const requestSchema = z.object({
  message: z.string().min(1),
  role: z.enum([
    "estimator",
    "project_manager",
    "adjuster",
    "homeowner",
    "technician",
    "admin",
  ]),
  context: z.object({
    estimateId: z.string().uuid().optional(),
    estimateName: z.string().optional(),
    jobType: z.enum(["insurance", "private"]).optional(),
    currentPage: z.string().optional(),
    recentActions: z.array(z.string()).optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

export type AssistantResponse = {
  response: string;
  suggestedActions: {
    label: string;
    action: string;
    parameters?: Record<string, string>;
  }[];
  relatedHelp: string[];
};

const roleSystemPrompts: Record<string, string> = {
  estimator: `You are an AI assistant for professional construction/restoration estimators. Help with:
- Creating accurate scope items and quantities
- Xactimate codes and pricing strategies
- Industry best practices for estimating
- Damage assessment techniques
- Documentation requirements for insurance claims
Speak with technical expertise but remain helpful and practical.`,

  project_manager: `You are an AI assistant for restoration project managers. Help with:
- Project scheduling and resource allocation
- Crew coordination and task prioritization
- Client communication strategies
- Quality control checkpoints
- Progress tracking and reporting
Focus on efficiency, team management, and project delivery.`,

  adjuster: `You are an AI assistant for insurance adjusters reviewing restoration claims. Help with:
- Claim review and documentation requirements
- Industry-standard pricing verification
- Scope of work validation
- Common restoration procedures and timelines
- Compliance with insurance guidelines
Maintain objectivity and focus on accurate claim assessment.`,

  homeowner: `You are a friendly AI assistant helping homeowners understand their restoration project. Help with:
- Explaining technical terms in simple language
- Understanding the restoration process and timeline
- What to expect during different repair phases
- How to prepare their home for work
- Understanding their estimate and insurance process
Be patient, empathetic, and avoid jargon.`,

  technician: `You are an AI assistant for restoration technicians in the field. Help with:
- Proper restoration techniques and procedures
- Safety protocols and equipment usage
- Documentation requirements (photos, moisture readings, etc.)
- Troubleshooting common issues
- Material and equipment specifications
Provide clear, practical, step-by-step guidance.`,

  admin: `You are an AI assistant for administrative staff managing restoration operations. Help with:
- Scheduling and calendar management
- Client communication and follow-ups
- Document organization and tracking
- Invoice and billing questions
- General office workflow optimization
Be organized, efficient, and helpful with administrative tasks.`,
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    const systemPrompt = `${roleSystemPrompts[validatedData.role]}

Current Context:
${validatedData.context ? JSON.stringify(validatedData.context, null, 2) : "No specific context provided"}

Always respond in valid JSON format:
{
  "response": "Your helpful response here",
  "suggestedActions": [
    { "label": "Action button text", "action": "action_name", "parameters": {} }
  ],
  "relatedHelp": ["Related topic 1", "Related topic 2"]
}

Keep responses concise but helpful. Suggest 1-3 relevant actions when appropriate.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    if (validatedData.conversationHistory) {
      for (const msg of validatedData.conversationHistory.slice(-10)) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    messages.push({ role: "user", content: validatedData.message });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    let result: AssistantResponse;
    try {
      let jsonStr = content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      result = JSON.parse(jsonStr.trim());
    } catch {
      result = {
        response: content,
        suggestedActions: [],
        relatedHelp: [],
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error with assistant:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
