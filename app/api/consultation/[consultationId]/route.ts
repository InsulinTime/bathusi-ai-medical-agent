// File: app/api/consultations/route.ts
import { db } from "@/config/db";
import { DoctorConsultationTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get("consultationId");

    if (!consultationId) {
      return NextResponse.json(
        { error: "Consultation ID required" },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(DoctorConsultationTable)
      .where(eq(DoctorConsultationTable.consultationId, consultationId));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    const consultation = result[0];

    return NextResponse.json({
      consultationId: consultation.consultationId,
      transcription: consultation.transcription,
      summary: consultation.summary,
      medicalPointers: consultation.medicalPointers,
      recommendations: consultation.recommendations,
      consultationDate: consultation.consultationDate,
    });
  } catch (error) {
    console.error("Error fetching consultation:", error);
    return NextResponse.json(
      { error: "Failed to fetch consultation" },
      { status: 500 }
    );
  }
}

