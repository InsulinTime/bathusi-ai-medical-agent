// app/api/analyze-body/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/config/db'
import { BodyAnalysisTable } from '@/config/schema'
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm'

const openai = new OpenAI({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const { selectedParts, symptoms, severity, painLevels, duration } = await req.json() as {
        selectedParts: string[],
        symptoms: string,
        severity: string,
        painLevels: Record<string, number>,
        duration: string
    };
    const systemPrompt = `You are Bathusi-AI, you're not a licensed medical professional and cannot prescribe medication but you are there for medical guidance and an advanced medical reasoning system. 
    Analyze symptoms using comprehensive medical knowledge and internet-based medical databases.
    
    IMPORTANT INSTRUCTIONS:
    1. Research and identify ALL possible conditions that match the symptoms and affected body parts
    2. Consider rare conditions, not just common ones
    3. Analyze cross-system interactions and referred pain patterns
    4. Rank conditions by probability based on symptom patterns
    5. Include biological, chemical, physical, and psychological aspects
    6. Consider patient demographics if provided
    7. ALWAYS provide multiple differential diagnoses (minimum 3-5)
    
    Return a comprehensive analysis with multiple possible conditions, their mechanisms, and recommendations.
    Be thorough and evidence-based in your analysis.`

    const userPrompt = `Patient presents with:

    AFFECTED BODY PARTS: 
    ${selectedParts.map((part: string) => {
    const pain = painLevels[part] || 0
    return `- ${part} (Pain Level: ${pain}/10)`
    }).join('\n')}

    SYMPTOMS DESCRIBED: ${symptoms || "No additional symptoms provided"}

    SEVERITY: ${severity}
    DURATION: ${duration || "Not specified"}

    PAIN PATTERNS:
    ${Object.entries(painLevels).map(([part, level]) => `- ${part}: ${level}/10 pain intensity`).join('\n')}

    Please provide:
    1. A comprehensive differential diagnosis with at least 3-5 possible conditions
    2. For each condition, explain:
    - Why it matches the symptoms
    - Biological/chemical processes involved
    - Expected progression if untreated
    - Red flag symptoms to watch for
    3. Cross-system analysis of how the affected body parts might be related
    4. Immediate recommendations
    5. When to seek emergency care
    6. Emergency indicators

    Use your medical knowledge to provide a thorough analysis. Consider both common and rare conditions.`

    console.log('Analyzing body symptoms with AI...')

    const completion = await openai.chat.completions.create({
      model: "x-ai/grok-beta",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })

    const aiResponse = completion.choices[0].message.content
    
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Parse the AI response into structured format
    const analysis = parseAIResponse(aiResponse, selectedParts, severity, painLevels)
    
    console.log('Analysis completed successfully')

    await db.insert(BodyAnalysisTable).values({
        sessionId: crypto.randomUUID(),
        userEmail: user?.primaryEmailAddress?.emailAddress || null,
        selectedParts,
        symptoms,
        severity,
        painLevels,
        duration,
        structuredAnalysis: analysis,
        rawResponse: aiResponse,
        urgencyLevel: analysis.urgencyLevel,
    });

    return NextResponse.json({
      success: true,
      analysis,
      rawResponse: aiResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Body analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze symptoms',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to structure the AI response
function parseAIResponse(aiResponse: string, selectedParts: string[], severity: string, painLevels: Record<string, number>) {

  
  const lines = aiResponse.split('\n')
  const conditions: any[] = []
  let currentCondition: any = null
  let recommendations: string[] = []
  let emergencyWarnings: string[] = []
  
  // Basic parsing to extract conditions and recommendations
  lines.forEach(line => {
    if (/^\d+\.\s+\*\*(.+?)\*\*/.test(line) || /^\d+\.\s+(.+?):/.test(line)) {
      if (currentCondition) {
        conditions.push(currentCondition)
      }
      const match = line.match(/^\d+\.\s+\*?\*?(.+?)\*?\*?:?(.*)/)
      if (match) {
        currentCondition = {
          name: match[1].trim(),
          description: match[2]?.trim() || '',
          details: []
        }
      }
    } else if (currentCondition && line.trim().startsWith('-')) {
      currentCondition.details.push(line.trim().substring(1).trim())
    } else if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('immediate')) {
      const nextLineIndex = lines.indexOf(line) + 1
      if (nextLineIndex < lines.length) {
        for (let i = nextLineIndex; i < lines.length; i++) {
          if (lines[i].trim().startsWith('-') || lines[i].trim().startsWith('•')) {
            recommendations.push(lines[i].trim().substring(1).trim())
          } else if (lines[i].trim() === '') {
            continue
          } else {
            break
          }
        }
      }
    } else if (line.toLowerCase().includes('emergency') || line.toLowerCase().includes('red flag')) {
      emergencyWarnings.push(line.trim())
    }
  })
  
  if (currentCondition) {
    conditions.push(currentCondition)
  }
  
  if (conditions.length === 0) {
    conditions.push({
      name: "Comprehensive Analysis",
      description: aiResponse,
      details: []
    })
  }
  
  const avgPain = Object.values(painLevels).reduce((a, b) => a + b, 0) /
                Math.max(Object.keys(painLevels).length, 1)
  
  const urgency = severity === 'emergency' || avgPain > 8 ? 'critical' :
                  severity === 'severe' || avgPain > 6 ? 'high' :
                  severity === 'moderate' || avgPain > 4 ? 'medium' : 'low'
  
  return {
    possibleConditions: conditions.map((condition, index) => ({
      ...condition,
      probability: Math.max(20, 100 - (index * 15)), // Estimate probability
      urgency: index === 0 ? urgency : 'low'
    })),
    recommendations: recommendations.length > 0 ? recommendations : [
      'Monitor symptoms closely',
      'Keep a symptom diary',
      'Stay hydrated and rest',
      'Consult healthcare provider if symptoms worsen'
    ],
    emergencyWarnings,
    systemicConnections: `Analysis involves ${selectedParts.join(', ')} with potential cross-system effects`,
    urgencyLevel: urgency
  }
}