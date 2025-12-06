// app/api/body-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/config/db'
import { BodyAnalysisTable } from '@/config/schema'
import { currentUser } from '@clerk/nextjs/server'
import { desc, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    
    console.log('Fetching body analysis records for user:', user?.primaryEmailAddress?.emailAddress)
    
    let records: any[] = []
    
    try {
      if (sessionId === 'all') {
        // Get all records for the current user
        if (user?.primaryEmailAddress?.emailAddress) {
          records = await db
            .select()
            .from(BodyAnalysisTable)
            .where(eq(BodyAnalysisTable.userEmail, user.primaryEmailAddress.emailAddress))
            .orderBy(desc(BodyAnalysisTable.createdAt))
          console.log(`Found ${records.length} body analysis records`)
        } else {
          console.log('No user email found')
          records = []
        }
      } else if (sessionId) {
        // Get specific session
        records = await db
          .select()
          .from(BodyAnalysisTable)
          .where(eq(BodyAnalysisTable.sessionId, sessionId))
      } else {
        if (user?.primaryEmailAddress?.emailAddress) {
          records = await db
            .select()
            .from(BodyAnalysisTable)
            .where(eq(BodyAnalysisTable.userEmail, user.primaryEmailAddress.emailAddress))
            .orderBy(desc(BodyAnalysisTable.createdAt))
            .limit(10)
        } else {
          records = []
        }
      }
    } catch (dbError: any) {
      console.error("Database query error:", dbError)
      
      if (dbError.message?.includes('relation "body_analysis" does not exist')) {
        console.log('Body analysis table does not exist yet')
        return NextResponse.json([])
      }
      
      throw dbError
    }
    
    const mappedRecords = records.map(record => ({
      id: record.id,
      sessionId: record.sessionId || record.session_id,
      selectedParts: record.selectedParts || record.selected_parts,
      symptoms: record.symptoms,
      severity: record.severity,
      painLevels: record.painLevels || record.pain_levels,
      duration: record.duration,
      structuredAnalysis: record.structuredAnalysis || record.structured_analysis,
      urgencyLevel: record.urgencyLevel || record.urgency_level,
      createdAt: record.createdAt || record.created_at
    }))
    
    return NextResponse.json(mappedRecords)
  } catch (error: any) {
    console.error("GET body-analysis error:", error)
    return NextResponse.json(
      { error: "Failed to load records", details: error.message },
      { status: 500 }
    )
  }
}

