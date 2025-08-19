import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("caregiver"), // caregiver, admin, client
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  age: integer("age"),
  address: text("address").notNull(),
  phone: text("phone"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  medicalConditions: text("medical_conditions").array(),
  medications: text("medications").array(),
  allergies: text("allergies").array(),
  specialInstructions: text("special_instructions"),
  caregiverIds: text("caregiver_ids").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caregiverId: varchar("caregiver_id").notNull(),
  clientId: varchar("client_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration_minutes"), // calculated field in minutes
  scheduledStartTime: timestamp("scheduled_start_time"),
  scheduledEndTime: timestamp("scheduled_end_time"),
  location: text("location"), // for GPS verification
  status: text("status").notNull().default("in_progress"), // scheduled, in_progress, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careNotes = pgTable("care_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitId: varchar("visit_id").notNull(),
  caregiverId: varchar("caregiver_id").notNull(),
  clientId: varchar("client_id").notNull(),
  category: text("category").notNull(), // medication, care, mood, safety, meal, exercise
  title: text("title").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caregiverId: varchar("caregiver_id").notNull(),
  clientId: varchar("client_id").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  serviceType: text("service_type").notNull(), // personal_care, companionship, medication, housekeeping
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringPattern: text("recurring_pattern"), // daily, weekly, monthly
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, cancelled, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  createdAt: true,
  duration: true,
});

export const insertCareNoteSchema = createInsertSchema(careNotes).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type CareNote = typeof careNotes.$inferSelect;
export type InsertCareNote = z.infer<typeof insertCareNoteSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
