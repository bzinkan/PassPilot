import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { validate } from "./validate";
import "./types"; // Import type extensions
import { invariant, unwrap, safeNumber } from "./utils";
import {
  IdParams,
  SchoolIdParams,
  CreateSchoolBody,
  CreateUserBody,
  CreateKioskDeviceBody,
  KioskDevicesBySchoolParams,
  CreatePassBody,
  ReturnPassParams,
  GetPassesQuery,
  GetStatisticsQuery,
  CreateKioskPassBody,
} from "./schemas";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // School management
  app.post('/api/schools', isAuthenticated, validate({ body: CreateSchoolBody }), async (req: any, res) => {
    try {
      const { name, seatsAllowed } = req.valid.body;
      const school = await storage.createSchool({ name, seatsAllowed });
      res.json(school);
    } catch (error) {
      console.error("Error creating school:", error);
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  app.get('/api/schools/:id', isAuthenticated, validate({ params: IdParams }), async (req: any, res) => {
    try {
      const { id } = req.valid.params;
      const school = await storage.getSchool(id);
      if (!school) {
        res.status(404).json({ message: "School not found" });
        return;
      }
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  // Kiosk device management
  app.post('/api/kiosk-devices', isAuthenticated, validate({ body: CreateKioskDeviceBody }), async (req: any, res) => {
    try {
      const { schoolId, room, pinHash, token } = req.valid.body;
      const device = await storage.createKioskDevice({ schoolId, room, pinHash, token });
      res.json(device);
    } catch (error) {
      console.error("Error creating kiosk device:", error);
      res.status(500).json({ message: "Failed to create kiosk device" });
    }
  });

  app.get('/api/schools/:schoolId/kiosk-devices', isAuthenticated, validate({ params: KioskDevicesBySchoolParams }), async (req: any, res) => {
    try {
      const { schoolId } = req.valid.params;
      const devices = await storage.getKioskDevicesBySchool(schoolId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching kiosk devices:", error);
      res.status(500).json({ message: "Failed to fetch kiosk devices" });
    }
  });

  // Pass management
  app.post('/api/passes', isAuthenticated, validate({ body: CreatePassBody }), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const validUser = unwrap(user, "User not found");
      const validSchoolId = unwrap(validUser.schoolId, "User missing schoolId");
      
      const { studentName, reason } = req.valid!.body;
      const passData = { 
        studentName,
        reason,
        issuedByUserId: userId,
        schoolId: validSchoolId
      };
      const pass = await storage.createPass(passData);
      res.json(pass);
    } catch (error) {
      console.error("Error creating pass:", error);
      res.status(500).json({ message: "Failed to create pass" });
    }
  });

  app.get('/api/passes/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const validUser = unwrap(user, "User not found");
      const validSchoolId = unwrap(validUser.schoolId, "User missing schoolId");
      
      const passes = await storage.getActivePassesBySchool(validSchoolId);
      res.json(passes);
    } catch (error) {
      console.error("Error fetching active passes:", error);
      res.status(500).json({ message: "Failed to fetch active passes" });
    }
  });

  app.get('/api/passes', isAuthenticated, validate({ query: GetPassesQuery }), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const validUser = unwrap(user, "User not found");
      const validSchoolId = unwrap(validUser.schoolId, "User missing schoolId");
      
      const { limit } = req.valid!.query ?? {};
      const safeLimit = limit ? safeNumber(limit, 50) : 50;
      const passes = await storage.getPassesBySchool(validSchoolId, safeLimit);
      res.json(passes);
    } catch (error) {
      console.error("Error fetching passes:", error);
      res.status(500).json({ message: "Failed to fetch passes" });
    }
  });

  app.put('/api/passes/:id/return', isAuthenticated, validate({ params: ReturnPassParams }), async (req: any, res) => {
    try {
      const { id } = req.valid.params;
      const pass = await storage.markPassReturned(id);
      res.json(pass);
    } catch (error) {
      console.error("Error marking pass as returned:", error);
      res.status(500).json({ message: "Failed to mark pass as returned" });
    }
  });

  app.get('/api/statistics', isAuthenticated, validate({ query: GetStatisticsQuery }), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      
      const { from, to } = req.valid.query || {};
      const dateRange = from && to ? {
        from: new Date(from),
        to: new Date(to)
      } : undefined;
      
      const stats = await storage.getPassStatistics(user.schoolId, dateRange);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Kiosk endpoints
  app.post('/api/kiosk/pass', validate({ body: CreateKioskPassBody }), async (req, res) => {
    try {
      const { studentName, reason, kioskToken } = req.valid!.body;
      
      // Verify kiosk device
      const device = await storage.getKioskDeviceByToken(kioskToken);
      if (!device) {
        res.status(401).json({ message: "Invalid kiosk token" });
        return;
      }

      // Create pass data
      const passData = {
        studentName,
        reason,
        issuedByUserId: device.id, // Use device ID as issuer for kiosk passes
        schoolId: device.schoolId,
        status: "active" as const,
      };

      const pass = await storage.createPass(passData);
      res.json({ message: "Pass created successfully", pass });
    } catch (error) {
      console.error("Error creating kiosk pass:", error);
      res.status(500).json({ message: "Failed to create pass" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
