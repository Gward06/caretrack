import { type User, type InsertUser, type Client, type InsertClient, type Visit, type InsertVisit, type CareNote, type InsertCareNote, type Schedule, type InsertSchedule } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Clients
  getClients(caregiverId?: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined>;
  
  // Visits
  getVisits(caregiverId?: string, clientId?: string): Promise<Visit[]>;
  getVisit(id: string): Promise<Visit | undefined>;
  getCurrentVisit(caregiverId: string): Promise<Visit | undefined>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: string, updates: Partial<Visit>): Promise<Visit | undefined>;
  
  // Care Notes
  getCareNotes(visitId?: string, clientId?: string): Promise<CareNote[]>;
  getCareNote(id: string): Promise<CareNote | undefined>;
  createCareNote(note: InsertCareNote): Promise<CareNote>;
  updateCareNote(id: string, updates: Partial<CareNote>): Promise<CareNote | undefined>;
  
  // Schedules
  getSchedules(caregiverId?: string, date?: Date): Promise<Schedule[]>;
  getSchedule(id: string): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private visits: Map<string, Visit> = new Map();
  private careNotes: Map<string, CareNote> = new Map();
  private schedules: Map<string, Schedule> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create sample caregiver
    const caregiverId = randomUUID();
    const caregiver: User = {
      id: caregiverId,
      username: "sarah.johnson",
      password: "password123",
      name: "Sarah Johnson",
      email: "sarah@caretrack.com",
      phone: "(555) 123-4567",
      role: "caregiver",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(caregiverId, caregiver);

    // Create sample clients
    const client1Id = randomUUID();
    const client1: Client = {
      id: client1Id,
      name: "Margaret Thompson",
      age: 78,
      address: "123 Oak Street, Apt 2B",
      phone: "(555) 234-5678",
      emergencyContact: "David Thompson (Son)",
      emergencyPhone: "(555) 345-6789",
      medicalConditions: ["Diabetes", "Mobility issues"],
      medications: ["Metformin", "Lisinopril"],
      allergies: ["Penicillin"],
      specialInstructions: "Prefers morning medication with breakfast",
      caregiverIds: [caregiverId],
      isActive: true,
      createdAt: new Date(),
    };
    this.clients.set(client1Id, client1);

    const client2Id = randomUUID();
    const client2: Client = {
      id: client2Id,
      name: "Robert Chen",
      age: 82,
      address: "456 Maple Ave, Unit 5",
      phone: "(555) 345-6789",
      emergencyContact: "Lisa Chen (Daughter)",
      emergencyPhone: "(555) 456-7890",
      medicalConditions: ["Heart condition", "Memory care"],
      medications: ["Amlodipine", "Donepezil"],
      allergies: [],
      specialInstructions: "Enjoys conversation about gardening",
      caregiverIds: [caregiverId],
      isActive: true,
      createdAt: new Date(),
    };
    this.clients.set(client2Id, client2);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      role: insertUser.role ?? "caregiver",
      isActive: insertUser.isActive ?? true,
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Client methods
  async getClients(caregiverId?: string): Promise<Client[]> {
    const allClients = Array.from(this.clients.values());
    if (!caregiverId) return allClients;
    
    return allClients.filter(client => 
      client.caregiverIds?.includes(caregiverId) && client.isActive
    );
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { 
      ...insertClient,
      phone: insertClient.phone ?? null,
      age: insertClient.age ?? null,
      emergencyContact: insertClient.emergencyContact ?? null,
      emergencyPhone: insertClient.emergencyPhone ?? null,
      medicalConditions: insertClient.medicalConditions ?? null,
      medications: insertClient.medications ?? null,
      allergies: insertClient.allergies ?? null,
      specialInstructions: insertClient.specialInstructions ?? null,
      caregiverIds: insertClient.caregiverIds ?? null,
      isActive: insertClient.isActive ?? true,
      id, 
      createdAt: new Date() 
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...updates };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  // Visit methods
  async getVisits(caregiverId?: string, clientId?: string): Promise<Visit[]> {
    let visits = Array.from(this.visits.values());
    
    if (caregiverId) {
      visits = visits.filter(visit => visit.caregiverId === caregiverId);
    }
    
    if (clientId) {
      visits = visits.filter(visit => visit.clientId === clientId);
    }
    
    return visits.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async getVisit(id: string): Promise<Visit | undefined> {
    return this.visits.get(id);
  }

  async getCurrentVisit(caregiverId: string): Promise<Visit | undefined> {
    return Array.from(this.visits.values()).find(
      visit => visit.caregiverId === caregiverId && visit.status === "in_progress"
    );
  }

  async createVisit(insertVisit: InsertVisit): Promise<Visit> {
    const id = randomUUID();
    const visit: Visit = { 
      ...insertVisit,
      endTime: insertVisit.endTime ?? null,
      duration: null, // Will be calculated when endTime is set
      scheduledStartTime: insertVisit.scheduledStartTime ?? null,
      scheduledEndTime: insertVisit.scheduledEndTime ?? null,
      location: insertVisit.location ?? null,
      status: insertVisit.status ?? "in_progress",
      notes: insertVisit.notes ?? null,
      id, 
      createdAt: new Date() 
    };
    this.visits.set(id, visit);
    return visit;
  }

  async updateVisit(id: string, updates: Partial<Visit>): Promise<Visit | undefined> {
    const visit = this.visits.get(id);
    if (!visit) return undefined;
    
    // Calculate duration if endTime is being set
    if (updates.endTime && visit.startTime) {
      updates.duration = Math.round((updates.endTime.getTime() - visit.startTime.getTime()) / (1000 * 60));
    }
    
    const updatedVisit = { ...visit, ...updates };
    this.visits.set(id, updatedVisit);
    return updatedVisit;
  }

  // Care Notes methods
  async getCareNotes(visitId?: string, clientId?: string): Promise<CareNote[]> {
    let notes = Array.from(this.careNotes.values());
    
    if (visitId) {
      notes = notes.filter(note => note.visitId === visitId);
    }
    
    if (clientId) {
      notes = notes.filter(note => note.clientId === clientId);
    }
    
    return notes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getCareNote(id: string): Promise<CareNote | undefined> {
    return this.careNotes.get(id);
  }

  async createCareNote(insertNote: InsertCareNote): Promise<CareNote> {
    const id = randomUUID();
    const note: CareNote = { 
      ...insertNote, 
      id, 
      timestamp: insertNote.timestamp || new Date(),
      createdAt: new Date() 
    };
    this.careNotes.set(id, note);
    return note;
  }

  async updateCareNote(id: string, updates: Partial<CareNote>): Promise<CareNote | undefined> {
    const note = this.careNotes.get(id);
    if (!note) return undefined;
    
    const updatedNote = { ...note, ...updates };
    this.careNotes.set(id, updatedNote);
    return updatedNote;
  }

  // Schedule methods
  async getSchedules(caregiverId?: string, date?: Date): Promise<Schedule[]> {
    let schedules = Array.from(this.schedules.values());
    
    if (caregiverId) {
      schedules = schedules.filter(schedule => schedule.caregiverId === caregiverId);
    }
    
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      schedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.scheduledDate);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate >= targetDate && scheduleDate < nextDay;
      });
    }
    
    return schedules.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async getSchedule(id: string): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = randomUUID();
    const schedule: Schedule = { 
      ...insertSchedule,
      status: insertSchedule.status ?? "scheduled",
      isRecurring: insertSchedule.isRecurring ?? false,
      recurringPattern: insertSchedule.recurringPattern ?? null,
      id, 
      createdAt: new Date() 
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...updates };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
}

export const storage = new MemStorage();
