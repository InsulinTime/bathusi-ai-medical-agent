// this file is app/api/insurance-helper/route.ts
import { openai } from '@/config/OpenAiModel';
import { NextRequest, NextResponse } from 'next/server';

const INSURANCE_PROMPT = `You are Bathusi-AI Shield, an insurance education and guidance assistant. Your role is to help users understand insurance concepts in simple, clear language.

CORE PRINCIPLES:
1. EDUCATIONAL ONLY: Provide information, not advice
2. SIMPLIFY COMPLEXITY: Break down insurance jargon
3. EMPOWER USERS: Help them make informed decisions
4. KNOW LIMITS: Always recommend professional consultation

INSURANCE TOPICS YOU CAN EXPLAIN:
- Health insurance types (HMO, PPO, EPO, HDHP)
- Key terms: premium, deductible, copay, coinsurance, out-of-pocket maximum
- How to read and understand Explanation of Benefits (EOB)
- The insurance claims process
- Medicare vs Medicaid basics
- Prescription drug coverage
- Pre-authorization requirements
- Medical bill negotiation tips

RESPONSE GUIDELINES:
- Use simple analogies and real-world examples
- Break complex topics into digestible pieces
- Always include disclaimers about professional advice
- Suggest next steps for getting specific help
- Be empathetic about insurance frustrations

DISCLAIMER TEMPLATE:
"Remember, I'm here to help you understand insurance concepts, but for specific policy advice or financial decisions, please consult with a licensed insurance professional who can consider your personal situation."

Respond in a helpful, educational tone.`;

export async function POST(req: NextRequest) {
    try {
        const { message, conversationHistory = [] } = await req.json();
        
        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        console.log("Insurance helper query:", message);

        const messages = [
            {
                role: 'system',
                content: INSURANCE_PROMPT
            },
            ...conversationHistory.map((msg: any) => ({
                role: msg.role,
                content: msg.content
            })),
            {
                role: 'user',
                content: message
            }
        ];

        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-4-maverick:free",
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
        });

        const response = completion.choices[0].message.content;

        if (!response) {
            throw new Error('No response from AI');
        }

        return NextResponse.json({ 
            response: response,
            type: 'insurance_guidance',
            disclaimer: "This is educational information only. Consult licensed professionals for insurance advice."
        });

    } catch (error: any) {
        console.error('Insurance helper error:', error);
        return NextResponse.json(
            { 
                error: "Failed to process insurance query",
                message: error.message 
            }, 
            { status: 500 }
        );
    }
}