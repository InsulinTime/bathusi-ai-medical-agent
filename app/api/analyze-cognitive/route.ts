// app/api/analyze-cognitive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Bathusi-AI Cognitive Analysis"
  }
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
      model: "nvidia/nemotron-nano-12b-v2-vl:free",
      messages: [
        { role: "system", content: "You are a cognitive health analysis assistant. Analyze cognitive test data and determine potential cognitive health indicators. Always respond with valid JSON." },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Cognitive analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      riskLevel: 'medium',
      confidence: 0.5,
      patterns: ['Unable to complete analysis'],
      recommendations: ['Please retry the test'],
      professionalGuidance: 'Technical error - please retry'
    }, { status: 200 }); // Return 200 with fallback data
  }
}

