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
    
    let records:any
    
    if (sessionId === 'all') {
      // Get all records for the current user
      if (user?.primaryEmailAddress?.emailAddress) {
        records = await db
          .select()
          .from(BodyAnalysisTable)
          .where(eq(BodyAnalysisTable.userEmail, user.primaryEmailAddress.emailAddress))
          .orderBy(desc(BodyAnalysisTable.createdAt))
      } else {
        records = []
      }
    } else if (sessionId) {
      // Get specific session
      records = await db
        .select()
        .from(BodyAnalysisTable)
        .where(eq(BodyAnalysisTable.sessionId, sessionId))
    } else {
      // Get recent records for current user
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
    
    return NextResponse.json(records)
  } catch (error) {
    console.error("GET body-analysis error:", error)
    return NextResponse.json({ error: "Failed to load records" }, { status: 500 })
  }
}

