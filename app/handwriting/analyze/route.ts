// app/api/handwriting/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface Point {
  x: number
  y: number
  t: number
}

interface Stroke {
  points: Point[]
  pointCount: number
  durationMs: number
  bboxW: number
  bboxH: number
  slantDeg: number
  lengthPx: number
  meanVelocity: number
  maxVelocity: number
  meanAccel: number
  meanJerk: number
}

function analyzeHandwritingFeatures(data: { strokes: Stroke[] }) {
  if (!data.strokes || data.strokes.length === 0) {
    return {
      error: "No strokes to analyze",
      status: "failed"
    }
  }

  // Calculate kinematics for each stroke
  const analyzedStrokes = data.strokes.map(stroke => {
    const kinematics = computeStrokeKinematics(stroke.points)
    return {
      ...stroke,
      ...kinematics
    }
  })

  // Aggregate metrics
  const totalStrokes = analyzedStrokes.length
  const avgVelocity = analyzedStrokes.reduce((sum, s) => sum + (s.meanVelocity || 0), 0) / totalStrokes
  const avgJerk = analyzedStrokes.reduce((sum, s) => sum + (s.meanJerk || 0), 0) / totalStrokes
  const totalDuration = analyzedStrokes.reduce((sum, s) => sum + s.durationMs, 0)

  // Simple risk assessment
  const velocityScore = Math.min(1, Math.max(0, (avgVelocity - 50) / 450))
  const jerkScore = Math.max(0, 1 - (avgJerk / 5000))
  const overallScore = (velocityScore + jerkScore) / 2

  return {
    status: "success",
    metrics: {
      totalStrokes,
      avgVelocity: Math.round(avgVelocity),
      avgJerk: Math.round(avgJerk),
      totalDuration,
      overallScore: Math.round(overallScore * 100)
    },
    analysis: {
      velocityAssessment: avgVelocity < 100 ? "Slow" : avgVelocity > 500 ? "Fast" : "Normal",
      smoothnessAssessment: avgJerk > 5000 ? "Poor" : avgJerk > 2000 ? "Fair" : "Good",
      recommendations: generateRecommendations(avgVelocity, avgJerk)
    },
    strokes: analyzedStrokes
  }
}

function computeStrokeKinematics(points: Point[]) {
  if (!points || points.length < 2) {
    return {
      meanVelocity: 0,
      maxVelocity: 0,
      meanAccel: 0,
      meanJerk: 0,
      lengthPx: 0,
      bboxW: 0,
      bboxH: 0,
      slantDeg: 0
    }
  }

  const velocities: number[] = []
  const accelerations: number[] = []
  const jerks: number[] = []
  let totalLength = 0

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1]
    const p2 = points[i]

    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    totalLength += distance

    const dt = Math.max((p2.t - p1.t) / 1000, 0.001) // Convert to seconds
    const velocity = distance / dt
    velocities.push(velocity)

    if (i > 1) {
      const prevVelocity = velocities[velocities.length - 2]
      const acceleration = (velocity - prevVelocity) / dt
      accelerations.push(acceleration)

      if (i > 2) {
        const prevAccel = accelerations[accelerations.length - 2]
        const jerk = (acceleration - prevAccel) / dt
        jerks.push(Math.abs(jerk))
      }
    }
  }

  // Calculate bounding box
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  // Calculate slant
  const n = points.length
  const meanX = xs.reduce((s, x) => s + x, 0) / n
  const meanY = ys.reduce((s, y) => s + y, 0) / n
  let cov = 0, varX = 0
  
  for (let i = 0; i < n; i++) {
    cov += (xs[i] - meanX) * (ys[i] - meanY)
    varX += (xs[i] - meanX) ** 2
  }
  
  const slope = varX ? cov / varX : 0
  const slantDeg = Math.atan(slope) * (180 / Math.PI)

  return {
    meanVelocity: velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0,
    maxVelocity: velocities.length > 0 ? Math.max(...velocities) : 0,
    meanAccel: accelerations.length > 0 ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0,
    meanJerk: jerks.length > 0 ? jerks.reduce((a, b) => a + b, 0) / jerks.length : 0,
    lengthPx: totalLength,
    bboxW: maxX - minX,
    bboxH: maxY - minY,
    slantDeg
  }
}

function generateRecommendations(avgVelocity: number, avgJerk: number): string[] {
  const recommendations = []

  if (avgVelocity < 50) {
    recommendations.push("Movement speed is very slow - consider motor assessment")
  } else if (avgVelocity < 100) {
    recommendations.push("Movement speed is below normal range")
  }

  if (avgJerk > 8000) {
    recommendations.push("High jerk values indicate possible tremor")
  } else if (avgJerk > 5000) {
    recommendations.push("Movement smoothness could be improved")
  }

  if (recommendations.length === 0) {
    recommendations.push("Performance within normal limits")
  }

  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const analysis = analyzeHandwritingFeatures(data)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', details: error },
      { status: 500 }
    )
  }
}
