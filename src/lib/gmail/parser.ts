import Anthropic from '@anthropic-ai/sdk';
import type { GmailMessage } from './client';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export interface ParsedClaimData {
  insuredName?: string;
  insuredPhone?: string;
  insuredEmail?: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  claimNumber?: string;
  policyNumber?: string;
  carrierName?: string;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  dateOfLoss?: string;
  damageType?: string;
  notes?: string;
}

export interface ParseResult {
  data: ParsedClaimData;
  confidence: number;
  isClaimEmail: boolean;
}

const SYSTEM_PROMPT = `You are an expert at parsing insurance claim referral emails for a property restoration company.

Extract the following information from the email if present:
- insuredName: The homeowner/property owner's name
- insuredPhone: The homeowner's phone number
- insuredEmail: The homeowner's email address
- propertyAddress: The street address of the property (without city, state, zip)
- propertyCity: The city
- propertyState: The state (2-letter abbreviation preferred)
- propertyZip: The ZIP code
- claimNumber: The insurance claim number
- policyNumber: The insurance policy number
- carrierName: The insurance company name (e.g., State Farm, Allstate, USAA)
- adjusterName: The insurance adjuster's name
- adjusterPhone: The adjuster's phone number
- adjusterEmail: The adjuster's email address
- dateOfLoss: The date of loss/damage (in YYYY-MM-DD format if possible)
- damageType: Type of damage (water, fire, smoke, mold, wind, hail, impact, vandalism)
- notes: Any other relevant notes or special instructions

Also determine:
- isClaimEmail: Is this a legitimate claim referral or work request? (true/false)
- confidence: How confident are you in the extraction? (0.0 to 1.0)

Return a JSON object with these fields. Use null for any field you cannot find.
Do not make up information. Only extract what is explicitly stated in the email.`;

export async function parseClaimEmail(message: GmailMessage): Promise<ParseResult> {
  const emailContent = `
Subject: ${message.subject}
From: ${message.fromName ? `${message.fromName} <${message.from}>` : message.from}
Date: ${message.receivedAt.toISOString()}

${message.bodyText || stripHtml(message.bodyHtml)}
`.trim();

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: emailContent },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const content = textContent?.type === 'text' ? textContent.text : null;
    if (!content) {
      return { data: {}, confidence: 0, isClaimEmail: false };
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { data: {}, confidence: 0, isClaimEmail: false };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    const data: ParsedClaimData = {};
    const fields: (keyof ParsedClaimData)[] = [
      'insuredName', 'insuredPhone', 'insuredEmail',
      'propertyAddress', 'propertyCity', 'propertyState', 'propertyZip',
      'claimNumber', 'policyNumber', 'carrierName',
      'adjusterName', 'adjusterPhone', 'adjusterEmail',
      'dateOfLoss', 'damageType', 'notes',
    ];

    for (const field of fields) {
      if (parsed[field] && parsed[field] !== null) {
        data[field] = String(parsed[field]);
      }
    }

    return {
      data,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      isClaimEmail: parsed.isClaimEmail === true,
    };
  } catch (error) {
    console.error('Failed to parse email with AI:', error);
    return { data: {}, confidence: 0, isClaimEmail: false };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
