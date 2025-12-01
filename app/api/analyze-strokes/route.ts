// app/api/analyze-strokes/route.ts
import { NextRequest, NextResponse } from "next/server"

interface StrokeKinematics {
  points: { x: number; y: number; t: number }[]
  lengthPx: number
  meanVelocity: number
  maxVelocity: number
  meanAccel: number
  meanJerk: number
  bboxW: number
  bboxH: number
  slantDeg: number
  pointCount: number
  durationMs: number
}

interface SessionFeatures {
  taskName: string
  numStrokes: number
  totalTimeMs: number
  inAirTimeMs: number
  inAirMoves: number
  avgMeanVelocity: number
  avgJerk: number
  avgBboxW: number
  avgBboxH: number
  strokeKinematics: StrokeKinematics[]
}

const NORMAL_RANGES = {
  velocity: { min: 100, max: 500 },
  jerk: { max: 5000 }, 
  inAirRatio: { max: 0.3 }, 
  strokeRate: { min: 0.5, max: 3 }, 
}

// Add the LLM function using OpenRouter with Grok
async function callLLM(prompt: string) {
  const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY
  
  if (!OPEN_ROUTER_API_KEY) {
    console.warn("OpenRouter API key not configured")
    return null
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPEN_ROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://bathusi-ai-medical-agent-tbe9.vercel.app/",
        "X-Title": "Bathusi-AI Handwriting Analysis"
      },
      body: JSON.stringify({
        model: "x-ai/grok-4.1-fast:free",
        messages: [
          {
            role: "system",
            content: `You are Bathusi-AI Neuro, a specialized cognitive health assessment system. 
            Analyze handwriting and drawing test results with medical precision. 
            Focus on objective motor control findings and neurological indicators.
            Provide clear, professional interpretations with trying to make narrowed down diagnoses.
            But always Suggest appropriate clinical follow-up when patterns warrant further evaluation.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("OpenRouter API error:", error)
      return null
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
  } catch (error) {
    console.error("LLM call failed:", error)
    return null
  }
}

function computeMedicalMetrics(features: SessionFeatures) {
  const { 
    avgMeanVelocity, 
    avgJerk, 
    totalTimeMs, 
    inAirTimeMs,
    numStrokes 
  } = features
  
  // Normalize metrics to 0-1 scale
  const velocityScore = Math.min(1, Math.max(0, 
    (avgMeanVelocity - NORMAL_RANGES.velocity.min) / 
    (NORMAL_RANGES.velocity.max - NORMAL_RANGES.velocity.min)
  ))
  
  const jerkScore = Math.max(0, 1 - (avgJerk / NORMAL_RANGES.jerk.max))
  
  const inAirRatio = totalTimeMs > 0 ? inAirTimeMs / totalTimeMs : 0
  const inAirScore = Math.max(0, 1 - (inAirRatio / NORMAL_RANGES.inAirRatio.max))
  
  const strokeRate = numStrokes / Math.max(totalTimeMs / 1000, 1)
  const strokeRateScore = strokeRate >= NORMAL_RANGES.strokeRate.min && 
                          strokeRate <= NORMAL_RANGES.strokeRate.max ? 1 : 0.5
  
  const patterns = {
    bradykinesia: avgMeanVelocity < 50,
    tremor: avgJerk > 8000,
    micrographia: detectMicrographia(features),
    hesitation: inAirRatio > 0.4,
  }
  
  const riskScore = 1 - ((velocityScore + jerkScore + inAirScore + strokeRateScore) / 4)
  
  return {
    scores: {
      velocity: velocityScore,
      jerk: jerkScore,
      inAir: inAirScore,
      strokeRate: strokeRateScore,
      overall: 1 - riskScore
    },
    patterns,
    riskScore,
    metrics: {
      avgVelocity: Math.round(avgMeanVelocity),
      avgJerk: Math.round(avgJerk),
      inAirRatio: Math.round(inAirRatio * 100),
      strokeRate: strokeRate.toFixed(2)
    }
  }
}

function detectMicrographia(features: SessionFeatures): boolean {
  const strokes = features.strokeKinematics
  if (strokes.length < 3) return false
  
  const third = Math.floor(strokes.length / 3)
  const firstThirdAvg = strokes.slice(0, third)
    .reduce((sum, s) => sum + s.bboxW * s.bboxH, 0) / Math.max(third, 1)
  const lastThirdAvg = strokes.slice(-third)
    .reduce((sum, s) => sum + s.bboxW * s.bboxH, 0) / Math.max(third, 1)
  
  return lastThirdAvg < firstThirdAvg * 0.7
}

function generateClinicalSummary(metrics: any, features: SessionFeatures): string {
  const { patterns, riskScore } = metrics
  const taskName = features.taskName
  
  let summary = `${taskName} task analysis: `
  
  if (riskScore < 0.3) {
    summary += "Performance within normal limits. "
  } else if (riskScore < 0.6) {
    summary += "Some atypical patterns detected. "
  } else {
    summary += "Significant abnormalities noted. "
  }
  
  const findings = []
  if (patterns.bradykinesia) findings.push("bradykinesia (slow movement)")
  if (patterns.tremor) findings.push("tremor-like oscillations")
  if (patterns.micrographia) findings.push("progressive size reduction")
  if (patterns.hesitation) findings.push("excessive hesitation")
  
  if (findings.length > 0) {
    summary += `Detected: ${findings.join(", ")}. `
  }
  
  summary += `Velocity: ${metrics.metrics.avgVelocity} px/s (normal: 100-500). `
  summary += `Smoothness: ${100 - Math.min(100, metrics.metrics.avgJerk / 100)}% `
  
  return summary
}

function computeKinematicsForStroke(points: { x: number, y: number, t: number }[]) {
  if (!points || points.length < 3) return null

  const velocities = []
  const accelerations = []
  const jerks = []

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1]
    const p2 = points[i]

    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const distance = Math.sqrt(dx*dx + dy*dy)

    const dt = (p2.t - p1.t) / 1000 // convert ms → seconds
    if (dt === 0) continue

    const velocity = distance / dt
    velocities.push(velocity)

    if (velocities.length > 1) {
      const accel = (velocities[velocities.length - 1] - velocities[velocities.length - 2]) / dt
      accelerations.push(accel)

      if (accelerations.length > 1) {
        const jerk = (accelerations[accelerations.length - 1] - accelerations[accelerations.length - 2]) / dt
        jerks.push(jerk)
      }
    }
  }

  if (velocities.length === 0) return null

  return {
    meanVelocity: velocities.reduce((a, b) => a + b, 0) / velocities.length,
    maxVelocity: Math.max(...velocities),
    meanAccel: accelerations.length ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0,
    meanJerk: jerks.length ? jerks.reduce((a, b) => a + b, 0) / jerks.length : 0
  }
}

function generateRecommendations(metrics: any): string[] {
  const recommendations = []
  const { patterns, riskScore } = metrics
  
  if (riskScore > 0.6) {
    recommendations.push("Consider neurological evaluation")
  }
  
  if (patterns.bradykinesia || patterns.micrographia) {
    recommendations.push("Screen for Parkinsonian symptoms")
  }
  
  if (patterns.tremor) {
    recommendations.push("Evaluate for essential tremor or other movement disorders")
  }
  
  if (patterns.hesitation) {
    recommendations.push("Assess executive function and motor planning")
  }
  
  if (recommendations.length === 0 && riskScore < 0.3) {
    recommendations.push("Continue routine monitoring")
    recommendations.push("Results within normal limits")
  }
  
  return recommendations
}

export async function POST(req: NextRequest) {
  try {
    const features: SessionFeatures = await req.json()
    
    // Validate input
    if (!features.taskName || features.numStrokes === undefined) {
      return NextResponse.json(
        { error: "Invalid input data - missing taskName or numStrokes" },
        { status: 400 }
      )
    }

    // Process stroke kinematics if raw points are provided
    if (features.strokeKinematics && features.strokeKinematics.length > 0) {
      for (const stroke of features.strokeKinematics) {
        if (stroke.points && stroke.points.length > 0) {
          const kin = computeKinematicsForStroke(stroke.points)
          if (kin) {
            stroke.meanVelocity = kin.meanVelocity
            stroke.maxVelocity = kin.maxVelocity
            stroke.meanAccel = kin.meanAccel
            stroke.meanJerk = kin.meanJerk
          }
        }
      }
    }
    
    // Compute medical metrics
    const medicalMetrics = computeMedicalMetrics(features)
    
    // Generate clinical summary
    const clinicalSummary = generateClinicalSummary(medicalMetrics, features)
    
    // Build LLM prompt
    const llmPrompt = `
Analyze these handwriting/drawing test results:

TEST: ${features.taskName}
Duration: ${(features.totalTimeMs / 1000).toFixed(1)} seconds
Number of Strokes: ${features.numStrokes}

KINEMATIC METRICS:
- Average Velocity: ${medicalMetrics.metrics.avgVelocity} px/s (normal range: 100-500 px/s)
- Average Jerk: ${medicalMetrics.metrics.avgJerk} px/s³ (lower values indicate smoother movement)
- In-Air Time: ${medicalMetrics.metrics.inAirRatio}% of total time
- Stroke Rate: ${medicalMetrics.metrics.strokeRate} strokes/second

DETECTED PATTERNS:
${Object.entries(medicalMetrics.patterns)
  .filter(([_, detected]) => detected)
  .map(([pattern, _]) => {
    switch(pattern) {
      case 'bradykinesia': return '- Bradykinesia: Abnormally slow movement velocity'
      case 'tremor': return '- Tremor: High jerk values suggesting oscillatory movement'
      case 'micrographia': return '- Micrographia: Progressive reduction in writing/drawing size'
      case 'hesitation': return '- Hesitation: Excessive pauses between strokes'
      default: return `- ${pattern}`
    }
  })
  .join('\n') || '- No significant abnormal patterns detected'}

PERFORMANCE SCORES:
- Velocity Score: ${(medicalMetrics.scores.velocity * 100).toFixed(0)}%
- Smoothness Score: ${(medicalMetrics.scores.jerk * 100).toFixed(0)}%
- Fluency Score: ${(medicalMetrics.scores.inAir * 100).toFixed(0)}%
- Overall Score: ${(medicalMetrics.scores.overall * 100).toFixed(0)}%

Provide a professional clinical interpretation focusing on:
1. Motor control assessment
2. Potential neurological indicators
3. Recommendations for follow-up if warranted

Keep the response concise (3-4 paragraphs) and objective.`.trim()
    
    // Call LLM for AI interpretation
    const aiInterpretation = await callLLM(llmPrompt)
    
    // Prepare final response
    const response = {
      status: "success",
      heuristics: medicalMetrics,
      clinicalSummary,
      aiInterpretation,
      recommendations: generateRecommendations(medicalMetrics),
      timestamp: new Date().toISOString(),
      debug: {
        llmUsed: aiInterpretation ? "grok-4.1-fast" : "none",
        strokeCount: features.numStrokes,
        totalTime: features.totalTimeMs
      }
    }
    
    return NextResponse.json(response)
    
  } catch (err) {
    console.error("Analysis error:", err)
    return NextResponse.json(
      { 
        error: "Analysis failed", 
        details: err instanceof Error ? err.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}