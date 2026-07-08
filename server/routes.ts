import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { stripe, PLANS, type PlanKey } from "./stripe";
import { requireAuth, requireRole, requireAdmin } from "./middleware";
import { storage, getAllUsers, getClientsByFamilyMember, getVisitTasks, createVisitTask, updateVisitTask,
  bulkCreateVisitTasks, getCaregiverProfiles, getCaregiverProfileByUser, createCaregiverProfile,
  updateCaregiverProfile, getReviews, createReview, getMessageThreads, createMessageThread,
  getMessages, createMessage, markMessagesRead, getCareNotes, getVisits, updateClient,
  createAgency } from "./storage";
import { generateShiftTasks, generateCarePlan, generateNutritionPlan, getDailyHealthTip } from "./ai";
import { insertUserSchema, insertClientSchema, insertVisitSchema, insertCareNoteSchema, insertScheduleSchema } from "@shared/schema";
import { z } from "zod";

const BCRYPT_ROUNDS = 12;

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      (req.session as any).userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.json({ ...user, password: undefined });
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
      userData.password = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);
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

  // ─── Visit Tasks ────────────────────────────────────────────────────────────

  app.get("/api/visits/:visitId/tasks", async (req, res) => {
    try {
      const tasks = await getVisitTasks(req.params.visitId);
      res.json(tasks);
    } catch { res.status(500).json({ message: "Failed to fetch tasks" }); }
  });

  app.post("/api/visits/:visitId/tasks", async (req, res) => {
    try {
      const task = await createVisitTask({ ...req.body, visitId: req.params.visitId });
      res.status(201).json(task);
    } catch { res.status(500).json({ message: "Failed to create task" }); }
  });

  app.patch("/api/visit-tasks/:id", async (req, res) => {
    try {
      const task = await updateVisitTask(req.params.id, req.body);
      res.json(task);
    } catch { res.status(500).json({ message: "Failed to update task" }); }
  });

  // AI: generate tasks for a visit based on client conditions
  app.post("/api/visits/:visitId/tasks/generate", async (req, res) => {
    try {
      const visit = await storage.getVisit(req.params.visitId);
      if (!visit) return res.status(404).json({ message: "Visit not found" });

      const client = await storage.getClient(visit.clientId);
      if (!client) return res.status(404).json({ message: "Client not found" });

      const shiftDuration = req.body.shiftDurationMinutes || 240;
      const aiTasks = await generateShiftTasks(client, shiftDuration);

      const tasks = await bulkCreateVisitTasks(
        aiTasks.map(t => ({
          visitId: req.params.visitId,
          title: t.title,
          category: t.category,
          completed: false,
          aiGenerated: true,
          notes: t.rationale,
        }))
      );
      res.status(201).json(tasks);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate tasks" });
    }
  });

  // ─── AI Care Plan ────────────────────────────────────────────────────────────

  app.get("/api/clients/:id/care-plan", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) return res.status(404).json({ message: "Client not found" });

      // Return cached plan if recent (< 7 days)
      if (client.aiCarePlan) {
        const plan = client.aiCarePlan as any;
        const age = Date.now() - new Date(plan.generatedAt).getTime();
        if (age < 7 * 24 * 60 * 60 * 1000) return res.json(plan);
      }

      const plan = await generateCarePlan(client);
      await updateClient(req.params.id, { aiCarePlan: plan });
      res.json(plan);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate care plan" });
    }
  });

  app.get("/api/clients/:id/nutrition-plan", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) return res.status(404).json({ message: "Client not found" });
      // Nutrition plan is part of care plan cache — regenerate standalone if needed
      const cached = client.aiCarePlan as any;
      if (cached?.nutrition?.generatedAt) {
        const age = Date.now() - new Date(cached.nutrition.generatedAt).getTime();
        if (age < 7 * 24 * 60 * 60 * 1000) return res.json(cached.nutrition);
      }
      const plan = await generateNutritionPlan(client);
      // Merge into existing care plan cache
      const updated = { ...(cached || {}), nutrition: plan };
      await updateClient(req.params.id, { aiCarePlan: updated });
      res.json(plan);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate nutrition plan" });
    }
  });

  app.get("/api/clients/:id/daily-tip", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) return res.status(404).json({ message: "Client not found" });
      const tip = await getDailyHealthTip(client.medicalConditions || []);
      res.json({ tip });
    } catch { res.status(500).json({ message: "Failed to get tip" }); }
  });

  // ─── Family Portal (family + platform_admin only) ────────────────────────────

  app.get("/api/family/clients",
    requireRole("family"),
    async (req, res) => {
      try {
        const userId = (req.session as any).userId;
        const myClients = await getClientsByFamilyMember(userId);
        res.json(myClients);
      } catch { res.status(500).json({ message: "Failed to fetch family clients" }); }
    });

  app.get("/api/family/clients/:clientId/notes",
    requireRole("family"),
    async (req, res) => {
      try {
        const notes = await getCareNotes(undefined, req.params.clientId, true);
        res.json(notes);
      } catch { res.status(500).json({ message: "Failed to fetch notes" }); }
    });

  app.get("/api/family/clients/:clientId/visits",
    requireRole("family"),
    async (req, res) => {
      try {
        const clientVisits = await getVisits(undefined, req.params.clientId);
        const visitsWithTasks = await Promise.all(
          clientVisits.map(async v => ({ ...v, tasks: await getVisitTasks(v.id) }))
        );
        res.json(visitsWithTasks);
      } catch { res.status(500).json({ message: "Failed to fetch visits" }); }
    });

  app.patch("/api/family/visits/:visitId/approve",
    requireRole("family"),
    async (req, res) => {
      try {
        const userId = (req.session as any).userId;
        const visit = await storage.updateVisit(req.params.visitId, {
          familyApproved: req.body.approved,
          familyApprovedAt: new Date(),
          familyApprovedBy: userId,
        });
        res.json(visit);
      } catch { res.status(500).json({ message: "Failed to update approval" }); }
    });

  // ─── Caregiver Marketplace ───────────────────────────────────────────────────

  app.get("/api/marketplace/caregivers", async (req, res) => {
    try {
      const { specializations, city, state, maxRate } = req.query;
      const profiles = await getCaregiverProfiles({
        specializations: specializations ? (specializations as string).split(",") : undefined,
        city: city as string,
        state: state as string,
        maxRate: maxRate ? Number(maxRate) : undefined,
      });
      res.json(profiles);
    } catch { res.status(500).json({ message: "Failed to fetch caregivers" }); }
  });

  app.get("/api/marketplace/caregivers/:id", async (req, res) => {
    try {
      const [profile] = await getCaregiverProfiles();
      // fetch by id — refetch cleanly
      const { db } = await import("./storage");
      const { caregiverProfiles } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [p] = await db.select().from(caregiverProfiles).where(eq(caregiverProfiles.id, req.params.id));
      if (!p) return res.status(404).json({ message: "Profile not found" });
      const profileReviews = await getReviews(p.id);
      res.json({ ...p, reviews: profileReviews });
    } catch { res.status(500).json({ message: "Failed to fetch profile" }); }
  });

  app.get("/api/my/caregiver-profile", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const profile = await getCaregiverProfileByUser(userId);
      res.json(profile || null);
    } catch { res.status(500).json({ message: "Failed to fetch profile" }); }
  });

  app.post("/api/my/caregiver-profile", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const existing = await getCaregiverProfileByUser(userId);
      if (existing) {
        const updated = await updateCaregiverProfile(existing.id, req.body);
        return res.json(updated);
      }
      const profile = await createCaregiverProfile({ ...req.body, userId });
      res.status(201).json(profile);
    } catch { res.status(500).json({ message: "Failed to save profile" }); }
  });

  app.post("/api/marketplace/caregivers/:profileId/reviews", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const review = await createReview({
        ...req.body,
        caregiverProfileId: req.params.profileId,
        reviewerId: userId,
        reviewerRole: user.role,
      });
      res.status(201).json(review);
    } catch { res.status(500).json({ message: "Failed to create review" }); }
  });

  // ─── Messaging ───────────────────────────────────────────────────────────────

  app.get("/api/messages/threads", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const threads = await getMessageThreads(userId);
      res.json(threads);
    } catch { res.status(500).json({ message: "Failed to fetch threads" }); }
  });

  app.post("/api/messages/threads", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const thread = await createMessageThread({
        ...req.body,
        participantIds: Array.from(new Set([userId, ...(req.body.participantIds || [])])),
      });
      res.status(201).json(thread);
    } catch { res.status(500).json({ message: "Failed to create thread" }); }
  });

  app.get("/api/messages/threads/:threadId", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const msgs = await getMessages(req.params.threadId, user.role);
      await markMessagesRead(req.params.threadId, userId);
      res.json(msgs);
    } catch { res.status(500).json({ message: "Failed to fetch messages" }); }
  });

  app.post("/api/messages/threads/:threadId", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const msg = await createMessage({
        threadId: req.params.threadId,
        senderId: userId,
        body: req.body.body,
        visibleToRoles: req.body.visibleToRoles || ["caregiver", "family", "agency_admin"],
        readBy: [userId],
      });
      res.status(201).json(msg);
    } catch { res.status(500).json({ message: "Failed to send message" }); }
  });

  // ─── Agencies ────────────────────────────────────────────────────────────────

  app.post("/api/agencies", async (req, res) => {
    try {
      const agency = await createAgency(req.body);
      res.status(201).json(agency);
    } catch { res.status(500).json({ message: "Failed to create agency" }); }
  });

  // ─── Platform Admin ──────────────────────────────────────────────────────────
  // All routes here require platform_admin role.

  // List all users (with optional role filter)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { role } = req.query;
      let allUsers = await getAllUsers();
      if (role) allUsers = allUsers.filter(u => u.role === role);
      res.json(allUsers.map(u => ({ ...u, password: undefined })));
    } catch { res.status(500).json({ message: "Failed to fetch users" }); }
  });

  // Update a user's role or active status
  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const allowed = ["role", "isActive", "name", "email"] as const;
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const user = await storage.updateUser(req.params.id, updates);
      res.json({ ...user, password: undefined });
    } catch { res.status(500).json({ message: "Failed to update user" }); }
  });

  // Platform metrics overview
  app.get("/api/admin/metrics", requireAdmin, async (req, res) => {
    try {
      const allUsers = await getAllUsers();
      const allClients = await storage.getClients();
      const metrics = {
        totalUsers: allUsers.length,
        byRole: {
          platform_admin:        allUsers.filter(u => u.role === "platform_admin").length,
          agency_admin:          allUsers.filter(u => u.role === "agency_admin").length,
          caregiver:             allUsers.filter(u => u.role === "caregiver").length,
          independent_caregiver: allUsers.filter(u => u.role === "independent_caregiver").length,
          family:                allUsers.filter(u => u.role === "family").length,
        },
        activeSubscriptions: allUsers.filter(u => u.subscriptionStatus === "active").length,
        totalClients: allClients.length,
      };
      res.json(metrics);
    } catch { res.status(500).json({ message: "Failed to fetch metrics" }); }
  });

  // ─── Stripe Billing ───────────────────────────────────────────────────────────

  // POST /api/billing/checkout — create Stripe Checkout session
  app.post("/api/billing/checkout", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });

      const { plan } = req.body as { plan: PlanKey };
      if (!PLANS[plan]) return res.status(400).json({ message: "Invalid plan" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      // Create or reuse Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.name,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      const appUrl = process.env.APP_URL || "http://localhost:5000";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
        success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/billing/cancel`,
        metadata: { userId, plan },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/billing/status — current user's subscription info
  app.get("/api/billing/status", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      res.json({
        status: user.subscriptionStatus || "inactive",
        plan: user.subscriptionPlan || null,
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/billing/portal — Stripe customer portal (manage/cancel)
  app.post("/api/billing/portal", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) return res.status(400).json({ message: "No billing account found" });

      const appUrl = process.env.APP_URL || "http://localhost:5000";
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${appUrl}/dashboard`,
      });
      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/webhooks/stripe — handle subscription lifecycle events
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody || req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return res.status(400).json({ message: `Webhook error: ${err.message}` });
    }

    const sub = (event.data.object as any);

    switch (event.type) {
      case "checkout.session.completed": {
        const userId = sub.metadata?.userId;
        const plan = sub.metadata?.plan as PlanKey;
        if (userId && plan) {
          await storage.updateUser(userId, {
            stripeSubscriptionId: sub.subscription,
            subscriptionStatus: "active",
            subscriptionPlan: plan,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const customer = await stripe.customers.retrieve(sub.customer) as any;
        const userId = customer.metadata?.userId;
        if (userId) {
          await storage.updateUser(userId, {
            subscriptionStatus: sub.status,
            subscriptionCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const customer = await stripe.customers.retrieve(sub.customer) as any;
        const userId = customer.metadata?.userId;
        if (userId) {
          await storage.updateUser(userId, {
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            subscriptionPlan: null,
          });
        }
        break;
      }
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
