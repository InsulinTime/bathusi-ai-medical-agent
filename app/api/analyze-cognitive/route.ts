// app/api/analyze-cognitive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { algorithmicResult, rawMetrics, prompt } = await request.json();

    const analysisPrompt = `
${prompt}

ACTUAL DATA TO ANALYZE:
${JSON.stringify(algorithmicResult, null, 2)}

RAW METRICS:
${JSON.stringify(rawMetrics, null, 2)}

Provide enhanced analysis focusing on:
1. Pattern interpretation in layman's terms
2. Cognitive health educational context  
3. Specific, actionable recommendations
4. Professional guidance tailored to risk level: ${algorithmicResult.riskLevel}

Respond in JSON format exactly as specified.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a cognitive health analysis assistant. Always respond with valid JSON." },
        { role: "user", content: analysisPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Cognitive analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}