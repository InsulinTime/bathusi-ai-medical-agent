//this file is config/schema.tsx
import { integer, json, pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer()
});

export const SessionChatTable=pgTable('sessionChatTable', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar().notNull(),
  notes: text(),
  selectedBathusi: json(),
  conversation: json(),
  report: json(),
  createdBy: varchar().references(() => usersTable.email),
  createdOn: varchar(),
  type: varchar().default('voice'),
});

export const DoctorConsultationTable = pgTable('doctor_consultation', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  consultationId: varchar().notNull().unique(),
  patientName: varchar(),
  patientAge: integer(),
  patientGender: varchar(),
  doctorName: varchar(),
  consultationDate: timestamp(),
  audioFileUrl: text(),
  transcription: text(),
  summary: text(),
  medicalPointers: json(),
  recommendations: json(),
  status: varchar().default('recorded'),
  createdBy: varchar().references(() => usersTable.email),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

export const CognitiveResultsTable = pgTable('cognitive_results', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar().references(() => usersTable.email),
  sessionId: varchar(),
  riskLevel: varchar(),
  confidence: integer(),
  biomarkers: json(),
  patterns: json(),
  recommendations: json(),
  professionalGuidance: text(),
  createdAt: timestamp().defaultNow()
});
