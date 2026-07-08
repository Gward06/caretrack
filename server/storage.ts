import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc, inArray } from "drizzle-orm";
import {
  agencies, users, clients, visits, careNotes, schedules,
  taskTemplates, visitTasks, caregiverProfiles, reviews,
  messageThreads, messages,
  type Agency, type InsertAgency,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Visit, type InsertVisit,
  type CareNote, type InsertCareNote,
  type Schedule, type InsertSchedule,
  type TaskTemplate, type InsertTaskTemplate,
  type VisitTask, type InsertVisitTask,
  type CaregiverProfile, type InsertCaregiverProfile,
  type Review, type InsertReview,
  type MessageThread, type InsertMessageThread,
  type Message, type InsertMessage,
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// ─── Agencies ──────────────────────────────────────────────────────────────────

export async function getAgency(id: string) {
  const [a] = await db.select().from(agencies).where(eq(agencies.id, id));
  return a;
}

export async function createAgency(data: InsertAgency) {
  const [a] = await db.insert(agencies).values(data).returning();
  return a;
}

// ─── Users ─────────────────────────────────────────────────────────────────────

export async function getUser(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id));
  return u;
}

export async function getUserByUsername(username: string) {
  const [u] = await db.select().from(users).where(eq(users.username, username));
  return u;
}

export async function getUserByEmail(email: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email));
  return u;
}

export async function createUser(data: InsertUser) {
  const [u] = await db.insert(users).values(data).returning();
  return u;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const [u] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  return u;
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(users.createdAt);
}

// ─── Clients ───────────────────────────────────────────────────────────────────

export async function getClients(caregiverId?: string, agencyId?: string) {
  let rows = await db.select().from(clients).where(eq(clients.isActive, true));
  if (caregiverId) rows = rows.filter(c => c.caregiverIds?.includes(caregiverId));
  if (agencyId) rows = rows.filter(c => c.agencyId === agencyId);
  return rows;
}

export async function getClientsByFamilyMember(userId: string) {
  const all = await db.select().from(clients).where(eq(clients.isActive, true));
  return all.filter(c => c.familyMemberIds?.includes(userId));
}

export async function getClient(id: string) {
  const [c] = await db.select().from(clients).where(eq(clients.id, id));
  return c;
}

export async function createClient(data: InsertClient) {
  const [c] = await db.insert(clients).values(data).returning();
  return c;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const [c] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
  return c;
}

// ─── Visits ────────────────────────────────────────────────────────────────────

export async function getVisits(caregiverId?: string, clientId?: string) {
  let rows = await db.select().from(visits).orderBy(desc(visits.startTime));
  if (caregiverId) rows = rows.filter(v => v.caregiverId === caregiverId);
  if (clientId) rows = rows.filter(v => v.clientId === clientId);
  return rows;
}

export async function getVisit(id: string) {
  const [v] = await db.select().from(visits).where(eq(visits.id, id));
  return v;
}

export async function getCurrentVisit(caregiverId: string) {
  const [v] = await db.select().from(visits).where(
    and(eq(visits.caregiverId, caregiverId), eq(visits.status, "in_progress"))
  );
  return v;
}

export async function createVisit(data: InsertVisit) {
  const [v] = await db.insert(visits).values(data).returning();
  return v;
}

export async function updateVisit(id: string, updates: Partial<Visit>) {
  const existing = await getVisit(id);
  if (!existing) return undefined;
  if (updates.endTime && existing.startTime) {
    updates.duration = Math.round(
      (new Date(updates.endTime).getTime() - new Date(existing.startTime).getTime()) / 60000
    );
  }
  const [v] = await db.update(visits).set(updates).where(eq(visits.id, id)).returning();
  return v;
}

// ─── Care Notes ────────────────────────────────────────────────────────────────

export async function getCareNotes(visitId?: string, clientId?: string, familyView = false) {
  let rows = await db.select().from(careNotes).orderBy(desc(careNotes.timestamp));
  if (visitId) rows = rows.filter(n => n.visitId === visitId);
  if (clientId) rows = rows.filter(n => n.clientId === clientId);
  if (familyView) rows = rows.filter(n => n.visibleToFamily);
  return rows;
}

export async function getCareNote(id: string) {
  const [n] = await db.select().from(careNotes).where(eq(careNotes.id, id));
  return n;
}

export async function createCareNote(data: InsertCareNote) {
  const [n] = await db.insert(careNotes).values(data).returning();
  return n;
}

export async function updateCareNote(id: string, updates: Partial<CareNote>) {
  const [n] = await db.update(careNotes).set(updates).where(eq(careNotes.id, id)).returning();
  return n;
}

// ─── Schedules ─────────────────────────────────────────────────────────────────

export async function getSchedules(caregiverId?: string, date?: Date) {
  let rows = await db.select().from(schedules).orderBy(schedules.startTime);
  if (caregiverId) rows = rows.filter(s => s.caregiverId === caregiverId);
  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    rows = rows.filter(s => new Date(s.scheduledDate) >= start && new Date(s.scheduledDate) < end);
  }
  return rows;
}

export async function createSchedule(data: InsertSchedule) {
  const [s] = await db.insert(schedules).values(data).returning();
  return s;
}

export async function updateSchedule(id: string, updates: Partial<Schedule>) {
  const [s] = await db.update(schedules).set(updates).where(eq(schedules.id, id)).returning();
  return s;
}

// ─── Task Templates ────────────────────────────────────────────────────────────

export async function getTaskTemplates(conditionTags?: string[], agencyId?: string) {
  let rows = await db.select().from(taskTemplates).where(eq(taskTemplates.isActive, true));
  if (conditionTags?.length) {
    rows = rows.filter(t =>
      !t.conditionTags?.length || // platform defaults apply to everyone
      t.conditionTags.some(tag => conditionTags.includes(tag))
    );
  }
  if (agencyId) {
    rows = rows.filter(t => !t.agencyId || t.agencyId === agencyId);
  }
  return rows;
}

export async function createTaskTemplate(data: InsertTaskTemplate) {
  const [t] = await db.insert(taskTemplates).values(data).returning();
  return t;
}

// ─── Visit Tasks ───────────────────────────────────────────────────────────────

export async function getVisitTasks(visitId: string) {
  return db.select().from(visitTasks).where(eq(visitTasks.visitId, visitId));
}

export async function createVisitTask(data: InsertVisitTask) {
  const [t] = await db.insert(visitTasks).values(data).returning();
  return t;
}

export async function updateVisitTask(id: string, updates: Partial<VisitTask>) {
  if (updates.completed && !updates.completedAt) updates.completedAt = new Date();
  const [t] = await db.update(visitTasks).set(updates).where(eq(visitTasks.id, id)).returning();
  return t;
}

export async function bulkCreateVisitTasks(tasks: InsertVisitTask[]) {
  if (!tasks.length) return [];
  return db.insert(visitTasks).values(tasks).returning();
}

// ─── Caregiver Profiles ────────────────────────────────────────────────────────

export async function getCaregiverProfiles(filters?: {
  specializations?: string[];
  city?: string;
  state?: string;
  maxRate?: number;
}) {
  let rows = await db.select().from(caregiverProfiles).where(eq(caregiverProfiles.isPublic, true));
  if (filters?.specializations?.length) {
    rows = rows.filter(p => p.specializations?.some(s => filters.specializations!.includes(s)));
  }
  if (filters?.city) rows = rows.filter(p => p.city?.toLowerCase().includes(filters.city!.toLowerCase()));
  if (filters?.state) rows = rows.filter(p => p.state === filters.state);
  if (filters?.maxRate) rows = rows.filter(p => !p.hourlyRate || Number(p.hourlyRate) <= filters.maxRate!);
  return rows;
}

export async function getCaregiverProfileByUser(userId: string) {
  const [p] = await db.select().from(caregiverProfiles).where(eq(caregiverProfiles.userId, userId));
  return p;
}

export async function createCaregiverProfile(data: InsertCaregiverProfile) {
  const [p] = await db.insert(caregiverProfiles).values(data).returning();
  return p;
}

export async function updateCaregiverProfile(id: string, updates: Partial<CaregiverProfile>) {
  const [p] = await db.update(caregiverProfiles).set({ ...updates, updatedAt: new Date() })
    .where(eq(caregiverProfiles.id, id)).returning();
  return p;
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

export async function getReviews(caregiverProfileId: string) {
  return db.select().from(reviews)
    .where(and(eq(reviews.caregiverProfileId, caregiverProfileId), eq(reviews.isPublic, true)))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: InsertReview) {
  const [r] = await db.insert(reviews).values(data).returning();
  // Recalculate average rating
  const all = await db.select().from(reviews).where(eq(reviews.caregiverProfileId, data.caregiverProfileId));
  const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  await db.update(caregiverProfiles)
    .set({ averageRating: avg, reviewCount: all.length })
    .where(eq(caregiverProfiles.id, data.caregiverProfileId));
  return r;
}

// ─── Messages ──────────────────────────────────────────────────────────────────

export async function getMessageThreads(userId: string) {
  const all = await db.select().from(messageThreads);
  return all.filter(t => t.participantIds.includes(userId));
}

export async function createMessageThread(data: InsertMessageThread) {
  const [t] = await db.insert(messageThreads).values(data).returning();
  return t;
}

export async function getMessages(threadId: string, viewerRole: string) {
  const rows = await db.select().from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(messages.createdAt);
  return rows.filter(m => m.visibleToRoles.includes(viewerRole) || m.visibleToRoles.includes("all"));
}

export async function createMessage(data: InsertMessage) {
  const [m] = await db.insert(messages).values(data).returning();
  return m;
}

export async function markMessagesRead(threadId: string, userId: string) {
  const rows = await db.select().from(messages).where(eq(messages.threadId, threadId));
  for (const msg of rows) {
    if (!msg.readBy.includes(userId)) {
      await db.update(messages)
        .set({ readBy: [...msg.readBy, userId] })
        .where(eq(messages.id, msg.id));
    }
  }
}

// legacy compat shim used by old routes
export const storage = {
  getUser, getUserByUsername, createUser, updateUser, getAllUsers,
  getClients: (caregiverId?: string) => getClients(caregiverId),
  getClient, createClient, updateClient,
  getVisits, getVisit, getCurrentVisit, createVisit, updateVisit,
  getCareNotes: (visitId?: string, clientId?: string) => getCareNotes(visitId, clientId),
  getCareNote, createCareNote, updateCareNote,
  getSchedules, createSchedule, updateSchedule,
  getSchedule: async (id: string) => {
    const [s] = await db.select().from(schedules).where(eq(schedules.id, id));
    return s;
  },
};
