// app/api/save-cognitive-results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/db';
import { CognitiveResultsTable } from '@/config/schema';

export async function POST(request: NextRequest) {
  try {
    const { cognitiveResults, cognitiveAssessment, sessionId, userId } = await request.json();

    const savedResult = await db.insert(CognitiveResultsTable).values({
      userId: userId,
      sessionId: sessionId,
      riskLevel: cognitiveResults.riskLevel,
      confidence: Math.round(cognitiveResults.confidence * 100),
      biomarkers: cognitiveResults.biomarkers,
      patterns: cognitiveResults.patterns,
      recommendations: cognitiveResults.recommendations,
      professionalGuidance: cognitiveResults.professionalGuidance
    }).returning();

    return NextResponse.json({ success: true, id: savedResult[0].id });
  } catch (error) {
    console.error('Error saving cognitive results:', error);
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }
}