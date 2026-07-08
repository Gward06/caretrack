import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Existing tables (expanded) ───────────────────────────────────────────────

export const agencies = pgTable("agencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  subscriptionTier: text("subscription_tier").notNull().default("basic"), // basic, pro, enterprise
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  // roles: caregiver, family, agency_admin, platform_admin, independent_caregiver
  role: text("role").notNull().default("caregiver"),
  agencyId: varchar("agency_id").references(() => agencies.id),
  isActive: boolean("is_active").notNull().default(true),
  // Stripe billing
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // inactive | active | past_due | canceled
  subscriptionPlan: text("subscription_plan"), // family_monthly | caregiver_monthly
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
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
  familyMemberIds: text("family_member_ids").array(), // user IDs with family role
  agencyId: varchar("agency_id").references(() => agencies.id),
  aiCarePlan: jsonb("ai_care_plan"), // cached AI-generated care suggestions
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caregiverId: varchar("caregiver_id").notNull(),
  clientId: varchar("client_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration_minutes"),
  scheduledStartTime: timestamp("scheduled_start_time"),
  scheduledEndTime: timestamp("scheduled_end_time"),
  gpsLat: real("gps_lat"),
  gpsLng: real("gps_lng"),
  status: text("status").notNull().default("in_progress"), // scheduled, in_progress, completed, cancelled
  familyApproved: boolean("family_approved"),
  familyApprovedAt: timestamp("family_approved_at"),
  familyApprovedBy: varchar("family_approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careNotes = pgTable("care_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitId: varchar("visit_id").notNull(),
  caregiverId: varchar("caregiver_id").notNull(),
  clientId: varchar("client_id").notNull(),
  category: text("category").notNull(), // medication, care, mood, safety, meal, exercise, incident
  title: text("title").notNull(),
  content: text("content").notNull(),
  visibleToFamily: boolean("visible_to_family").notNull().default(true),
  visibleToAgency: boolean("visible_to_agency").notNull().default(true),
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
  serviceType: text("service_type").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringPattern: text("recurring_pattern"),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Task system ───────────────────────────────────────────────────────────────

export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // personal_care, exercise, medication, meal, social, cognitive, safety
  conditionTags: text("condition_tags").array(), // ms, dementia, mobility, elderly, parkinson
  estimatedMinutes: integer("estimated_minutes"),
  agencyId: varchar("agency_id").references(() => agencies.id), // null = platform default
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const visitTasks = pgTable("visit_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  visitId: varchar("visit_id").notNull(),
  templateId: varchar("template_id").references(() => taskTemplates.id),
  title: text("title").notNull(), // copied from template or AI-generated
  category: text("category").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Caregiver marketplace ─────────────────────────────────────────────────────

export const caregiverProfiles = pgTable("caregiver_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  bio: text("bio"),
  videoUrl: text("video_url"),
  certifications: text("certifications").array(), // CNA, HHA, CPR, etc.
  specializations: text("specializations").array(), // ms, dementia, pediatric, etc.
  languages: text("languages").array(),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  availabilityNotes: text("availability_notes"),
  backgroundCheckVerified: boolean("background_check_verified").notNull().default(false),
  backgroundCheckDate: timestamp("background_check_date"),
  yearsExperience: integer("years_experience"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  isPublic: boolean("is_public").notNull().default(false), // listed in marketplace
  averageRating: real("average_rating"),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caregiverProfileId: varchar("caregiver_profile_id").notNull().references(() => caregiverProfiles.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  reviewerRole: text("reviewer_role").notNull(), // family, agency_admin
  rating: integer("rating").notNull(), // 1-5
  body: text("body"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Messaging ─────────────────────────────────────────────────────────────────

export const messageThreads = pgTable("message_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id),
  visitId: varchar("visit_id").references(() => visits.id),
  subject: text("subject"),
  participantIds: text("participant_ids").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => messageThreads.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  visibleToRoles: text("visible_to_roles").array().notNull(), // which roles can see this message
  readBy: text("read_by").array().notNull().default(sql`'{}'`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Insert schemas ────────────────────────────────────────────────────────────

export const insertAgencySchema = createInsertSchema(agencies).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertVisitSchema = createInsertSchema(visits).omit({ id: true, createdAt: true, duration: true });
export const insertCareNoteSchema = createInsertSchema(careNotes).omit({ id: true, createdAt: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true, createdAt: true });
export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({ id: true, createdAt: true });
export const insertVisitTaskSchema = createInsertSchema(visitTasks).omit({ id: true, createdAt: true });
export const insertCaregiverProfileSchema = createInsertSchema(caregiverProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertMessageThreadSchema = createInsertSchema(messageThreads).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = z.infer<typeof insertAgencySchema>;
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
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type VisitTask = typeof visitTasks.$inferSelect;
export type InsertVisitTask = z.infer<typeof insertVisitTaskSchema>;
export type CaregiverProfile = typeof caregiverProfiles.$inferSelect;
export type InsertCaregiverProfile = z.infer<typeof insertCaregiverProfileSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type MessageThread = typeof messageThreads.$inferSelect;
export type InsertMessageThread = z.infer<typeof insertMessageThreadSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
