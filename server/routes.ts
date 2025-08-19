import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClientSchema, insertVisitSchema, insertCareNoteSchema, insertScheduleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd use proper session management
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const caregiverId = req.query.caregiverId as string;
      const clients = await storage.getClients(caregiverId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const updates = req.body;
      const client = await storage.updateClient(req.params.id, updates);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Visit routes
  app.get("/api/visits", async (req, res) => {
    try {
      const caregiverId = req.query.caregiverId as string;
      const clientId = req.query.clientId as string;
      const visits = await storage.getVisits(caregiverId, clientId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  app.get("/api/visits/current/:caregiverId", async (req, res) => {
    try {
      const visit = await storage.getCurrentVisit(req.params.caregiverId);
      res.json(visit);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current visit" });
    }
  });

  app.post("/api/visits", async (req, res) => {
    try {
      const visitData = insertVisitSchema.parse({
        ...req.body,
        startTime: new Date(req.body.startTime),
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
        scheduledStartTime: req.body.scheduledStartTime ? new Date(req.body.scheduledStartTime) : undefined,
        scheduledEndTime: req.body.scheduledEndTime ? new Date(req.body.scheduledEndTime) : undefined,
      });
      const visit = await storage.createVisit(visitData);
      res.status(201).json(visit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid visit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create visit" });
    }
  });

  app.patch("/api/visits/:id", async (req, res) => {
    try {
      const updates = { 
        ...req.body,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      const visit = await storage.updateVisit(req.params.id, updates);
      if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
      }
      res.json(visit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update visit" });
    }
  });

  // Care Notes routes
  app.get("/api/care-notes", async (req, res) => {
    try {
      const visitId = req.query.visitId as string;
      const clientId = req.query.clientId as string;
      const notes = await storage.getCareNotes(visitId, clientId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch care notes" });
    }
  });

  app.post("/api/care-notes", async (req, res) => {
    try {
      const noteData = insertCareNoteSchema.parse({
        ...req.body,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      });
      const note = await storage.createCareNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.patch("/api/care-notes/:id", async (req, res) => {
    try {
      const updates = req.body;
      const note = await storage.updateCareNote(req.params.id, updates);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", async (req, res) => {
    try {
      const caregiverId = req.query.caregiverId as string;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const schedules = await storage.getSchedules(caregiverId, date);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse({
        ...req.body,
        scheduledDate: new Date(req.body.scheduledDate),
        startTime: new Date(req.body.startTime),
        endTime: new Date(req.body.endTime),
      });
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  // Reports routes
  app.get("/api/reports/summary/:caregiverId", async (req, res) => {
    try {
      const caregiverId = req.params.caregiverId;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const visits = await storage.getVisits(caregiverId);
      const filteredVisits = visits.filter(visit => 
        visit.startTime >= startDate && 
        visit.startTime <= endDate && 
        visit.status === "completed"
      );

      const totalHours = filteredVisits.reduce((sum, visit) => sum + (visit.duration || 0), 0) / 60;
      const totalVisits = filteredVisits.length;
      const clientsServed = new Set(filteredVisits.map(visit => visit.clientId)).size;
      const avgVisitTime = totalVisits > 0 ? totalHours / totalVisits : 0;

      const dailyBreakdown = filteredVisits.reduce((acc, visit) => {
        const date = visit.startTime.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { visits: 0, hours: 0 };
        }
        acc[date].visits++;
        acc[date].hours += (visit.duration || 0) / 60;
        return acc;
      }, {} as Record<string, { visits: number; hours: number }>);

      res.json({
        totalHours: Math.round(totalHours * 100) / 100,
        totalVisits,
        clientsServed,
        avgVisitTime: Math.round(avgVisitTime * 100) / 100,
        dailyBreakdown,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
