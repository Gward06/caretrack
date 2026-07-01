import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc } from "drizzle-orm";
import {
  users, clients, visits, careNotes, schedules,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Visit, type InsertVisit,
  type CareNote, type InsertCareNote,
  type Schedule, type InsertSchedule,
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  getClients(caregiverId?: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined>;

  getVisits(caregiverId?: string, clientId?: string): Promise<Visit[]>;
  getVisit(id: string): Promise<Visit | undefined>;
  getCurrentVisit(caregiverId: string): Promise<Visit | undefined>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: string, updates: Partial<Visit>): Promise<Visit | undefined>;

  getCareNotes(visitId?: string, clientId?: string): Promise<CareNote[]>;
  getCareNote(id: string): Promise<CareNote | undefined>;
  createCareNote(note: InsertCareNote): Promise<CareNote>;
  updateCareNote(id: string, updates: Partial<CareNote>): Promise<CareNote | undefined>;

  getSchedules(caregiverId?: string, date?: Date): Promise<Schedule[]>;
  getSchedule(id: string): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined>;
}

class DrizzleStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(data: InsertUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>) {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getClients(caregiverId?: string) {
    const all = await db.select().from(clients).where(eq(clients.isActive, true));
    if (!caregiverId) return all;
    return all.filter(c => c.caregiverIds?.includes(caregiverId));
  }

  async getClient(id: string) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(data: InsertClient) {
    const [client] = await db.insert(clients).values(data).returning();
    return client;
  }

  async updateClient(id: string, updates: Partial<Client>) {
    const [client] = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
    return client;
  }

  async getVisits(caregiverId?: string, clientId?: string) {
    let rows = await db.select().from(visits).orderBy(desc(visits.startTime));
    if (caregiverId) rows = rows.filter(v => v.caregiverId === caregiverId);
    if (clientId) rows = rows.filter(v => v.clientId === clientId);
    return rows;
  }

  async getVisit(id: string) {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async getCurrentVisit(caregiverId: string) {
    const [visit] = await db.select().from(visits).where(
      and(eq(visits.caregiverId, caregiverId), eq(visits.status, "in_progress"))
    );
    return visit;
  }

  async createVisit(data: InsertVisit) {
    const [visit] = await db.insert(visits).values(data).returning();
    return visit;
  }

  async updateVisit(id: string, updates: Partial<Visit>) {
    const existing = await this.getVisit(id);
    if (!existing) return undefined;
    if (updates.endTime && existing.startTime) {
      updates.duration = Math.round(
        (new Date(updates.endTime).getTime() - new Date(existing.startTime).getTime()) / 60000
      );
    }
    const [visit] = await db.update(visits).set(updates).where(eq(visits.id, id)).returning();
    return visit;
  }

  async getCareNotes(visitId?: string, clientId?: string) {
    let rows = await db.select().from(careNotes).orderBy(desc(careNotes.timestamp));
    if (visitId) rows = rows.filter(n => n.visitId === visitId);
    if (clientId) rows = rows.filter(n => n.clientId === clientId);
    return rows;
  }

  async getCareNote(id: string) {
    const [note] = await db.select().from(careNotes).where(eq(careNotes.id, id));
    return note;
  }

  async createCareNote(data: InsertCareNote) {
    const [note] = await db.insert(careNotes).values(data).returning();
    return note;
  }

  async updateCareNote(id: string, updates: Partial<CareNote>) {
    const [note] = await db.update(careNotes).set(updates).where(eq(careNotes.id, id)).returning();
    return note;
  }

  async getSchedules(caregiverId?: string, date?: Date) {
    let rows = await db.select().from(schedules).orderBy(schedules.startTime);
    if (caregiverId) rows = rows.filter(s => s.caregiverId === caregiverId);
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      rows = rows.filter(s => {
        const d = new Date(s.scheduledDate);
        return d >= start && d < end;
      });
    }
    return rows;
  }

  async getSchedule(id: string) {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule;
  }

  async createSchedule(data: InsertSchedule) {
    const [schedule] = await db.insert(schedules).values(data).returning();
    return schedule;
  }

  async updateSchedule(id: string, updates: Partial<Schedule>) {
    const [schedule] = await db.update(schedules).set(updates).where(eq(schedules.id, id)).returning();
    return schedule;
  }
}

export const storage = new DrizzleStorage();
