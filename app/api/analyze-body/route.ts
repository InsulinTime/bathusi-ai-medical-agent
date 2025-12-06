// app/api/analyze-body/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/config/db'
import { BodyAnalysisTable } from '@/config/schema'
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm'

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Bathusi-AI Body Analyzer"
  }
})

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

    if (!process.env.OPEN_ROUTER_API_KEY) {
      console.error('OPEN_ROUTER_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'API configuration error - missing API key' },
        { status: 500 }
      )
    }

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

    SYMPTOMS: ${symptoms || "No additional symptoms provided"}
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
      model: "openai/gpt-oss-20b:free", // You can also use "x-ai/grok-beta" or other models
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.7
    })

    const aiResponse = completion.choices[0].message.content
    
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    const analysis = parseAIResponse(aiResponse, selectedParts, severity, painLevels)
    
    console.log('Analysis completed successfully')
    
    // Generate sessionId ONCE
    const sessionId = crypto.randomUUID()
    
    try {
      await db.insert(BodyAnalysisTable).values({
          sessionId, // Use the variable, not generate a new UUID
          userEmail: user?.primaryEmailAddress?.emailAddress || null,
          selectedParts,
          symptoms,
          severity,
          painLevels,
          duration,
          structuredAnalysis: analysis,
          rawResponse: aiResponse,
          urgencyLevel: analysis.urgencyLevel,
      })
      console.log('Saved to database successfully')
    } catch (dbError) {
      console.error('Database save failed:', dbError)
      console.log('Returning analysis without saving')
    }

    return NextResponse.json({
      success: true,
      analysis,
      sessionId, // Return the same sessionId
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Body analysis error:', error)
    console.error('Error details:', error.response?.data || error.message)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze symptoms',
        details: error.message || 'Unknown error',
        apiKeyExists: !!process.env.OPEN_ROUTER_API_KEY
      },
      { status: 500 }
    )
  }
}

// Helper function to structure the AI response
function parseAIResponse(aiResponse: string, selectedParts: string[], severity: string, painLevels: Record<string, number>) {
  const conditions: any[] = []
  let currentCondition: any = null
  let recommendations: string[] = []
  let emergencyWarnings: string[] = []
  
  // First, try to parse table format (what Grok is returning)
  const tableRegex = /\|\s*\d+\s*\|\s*\*\*([^*]+)\*\*\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/g
  let tableMatch
  
  while ((tableMatch = tableRegex.exec(aiResponse)) !== null) {
    const conditionName = tableMatch[1].trim()
    const whyItFits = tableMatch[2].trim()
    const pathophysiology = tableMatch[3].trim()
    const progression = tableMatch[4].trim()
    const redFlags = tableMatch[5].trim()
    
    if (conditionName && conditionName !== 'Condition') {
      conditions.push({
        name: conditionName,
        description: whyItFits,
        details: [
          `Clinical reasoning: ${whyItFits}`,
          `Pathophysiology: ${pathophysiology}`,
          `If untreated: ${progression}`,
          `Warning signs: ${redFlags}`
        ].filter(d => d.length > 20) // Filter out empty details
      })
    }
  }
  
  // If no table found, fall back to numbered list parsing
  if (conditions.length === 0) {
    const lines = aiResponse.split('\n')
    
    lines.forEach(line => {
      // Check for numbered conditions (1. **Condition Name** or 1. Condition Name:)
      if (/^\d+\.\s+/.test(line)) {
        if (currentCondition) {
          conditions.push(currentCondition)
        }
        const match = line.match(/^\d+\.\s+\*?\*?(.+?)\*?\*?[:|-]?(.*)/)
        if (match) {
          currentCondition = {
            name: match[1].trim().replace(/\*\*/g, ''),
            description: match[2]?.trim() || '',
            details: []
          }
        }
      } else if (currentCondition && line.trim().startsWith('-')) {
        currentCondition.details.push(line.trim().substring(1).trim())
      }
    })
    
    if (currentCondition) {
      conditions.push(currentCondition)
    }
  }
  
  // Extract recommendations
  const lines = aiResponse.split('\n')
  let inRecommendations = false
  
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('immediate')) {
      inRecommendations = true
    } else if (inRecommendations) {
      if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().match(/^\d+\./)) {
        const rec = line.trim().replace(/^[-•\d.]\s*/, '').trim()
        if (rec && rec.length > 5) {
          recommendations.push(rec)
        }
      } else if (line.trim() === '' || line.includes('##')) {
        inRecommendations = false
      }
    }
    
    // Extract emergency warnings
    if (line.toLowerCase().includes('emergency') || line.toLowerCase().includes('red flag') || line.toLowerCase().includes('red‑flag')) {
      // Look for the actual warning content in the next few lines
      for (let i = index; i < Math.min(index + 3, lines.length); i++) {
        const warningLine = lines[i].trim()
        if (warningLine && !warningLine.toLowerCase().includes('red flag') && warningLine.length > 10) {
          emergencyWarnings.push(warningLine)
          break
        }
      }
    }
  })
  
  // Clean up emergency warnings - remove duplicates and headers
  emergencyWarnings = [...new Set(emergencyWarnings)]
    .filter(w => !w.toLowerCase().includes('disclaimer') && !w.startsWith('#'))
  
  // Ensure we have at least one condition
  if (conditions.length === 0) {
    // Extract any condition-like content from the response
    const conditionMatches = aiResponse.match(/(?:condition|diagnosis|possibility):\s*([^\n]+)/gi)
    if (conditionMatches) {
      conditionMatches.forEach(match => {
        const name = match.replace(/^[^:]+:\s*/, '').trim()
        conditions.push({
          name: name,
          description: "Based on symptoms analysis",
          details: []
        })
      })
    }
    
    // Final fallback
    if (conditions.length === 0) {
      conditions.push({
        name: "Medical Evaluation Required",
        description: `Symptoms involving ${selectedParts.join(' and ')} require professional assessment`,
        details: [
          `Areas affected: ${selectedParts.join(', ')}`,
          `Pain severity: ${Object.entries(painLevels).map(([p, l]) => `${p} (${l}/10)`).join(', ')}`,
          `Overall severity: ${severity}`
        ]
      })
    }
  }
  
  // Default recommendations if none found
  if (recommendations.length === 0) {
    recommendations = [
      'Monitor symptoms closely for any changes',
      'Keep a detailed symptom diary with times and triggers',
      'Stay well hydrated and get adequate rest',
      'Seek medical attention if symptoms worsen or new symptoms appear',
      'Consider scheduling a medical consultation for proper evaluation'
    ]
  }
  
  const avgPain = Object.values(painLevels).reduce((a, b) => a + b, 0) / 
                  Math.max(Object.keys(painLevels).length, 1)
  
  const urgency = severity === 'emergency' || avgPain > 8 ? 'critical' :
                  severity === 'severe' || avgPain > 6 ? 'high' :
                  severity === 'moderate' || avgPain > 4 ? 'medium' : 'low'
  
  return {
    possibleConditions: conditions.slice(0, 5).map((condition, index) => ({
      ...condition,
      probability: Math.max(20, 100 - (index * 15)),
      urgency: index === 0 ? urgency : 'low'
    })),
    recommendations: recommendations.slice(0, 8), // Limit to 8 recommendations
    emergencyWarnings: emergencyWarnings.slice(0, 5), // Limit to 5 warnings
    systemicConnections: `Analysis of ${selectedParts.join(', ')} with cross-system considerations`,
    urgencyLevel: urgency
  }
}