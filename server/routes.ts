import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSchoolSchema, insertUserSchema, insertKioskDeviceSchema, insertPassSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
  app.post('/api/schools', isAuthenticated, async (req: any, res) => {
    try {
      const schoolData = insertSchoolSchema.parse(req.body);
      const school = await storage.createSchool(schoolData);
      res.json(school);
    } catch (error) {
      console.error("Error creating school:", error);
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  app.get('/api/schools/:id', isAuthenticated, async (req: any, res): Promise<void> => {
    try {
      const school = await storage.getSchool(req.params.id);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  // Kiosk device management
  app.post('/api/kiosk-devices', isAuthenticated, async (req: any, res) => {
    try {
      const deviceData = insertKioskDeviceSchema.parse(req.body);
      const device = await storage.createKioskDevice(deviceData);
      res.json(device);
    } catch (error) {
      console.error("Error creating kiosk device:", error);
      res.status(500).json({ message: "Failed to create kiosk device" });
    }
  });

  app.get('/api/schools/:schoolId/kiosk-devices', isAuthenticated, async (req: any, res) => {
    try {
      const devices = await storage.getKioskDevicesBySchool(req.params.schoolId);
      res.json(devices);
    } catch (error) {
      console.error("Error fetching kiosk devices:", error);
      res.status(500).json({ message: "Failed to fetch kiosk devices" });
    }
  });

  // Pass management
  app.post('/api/passes', isAuthenticated, async (req: any, res): Promise<void> => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const passData = insertPassSchema.parse({ 
        ...req.body, 
        issuedByUserId: userId,
        schoolId: user.schoolId 
      });
      const pass = await storage.createPass(passData);
      res.json(pass);
    } catch (error) {
      console.error("Error creating pass:", error);
      res.status(500).json({ message: "Failed to create pass" });
    }
  });

  app.get('/api/passes/active', isAuthenticated, async (req: any, res): Promise<void> => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const passes = await storage.getActivePassesBySchool(user.schoolId);
      res.json(passes);
    } catch (error) {
      console.error("Error fetching active passes:", error);
      res.status(500).json({ message: "Failed to fetch active passes" });
    }
  });

  app.get('/api/passes', isAuthenticated, async (req: any, res): Promise<void> => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const passes = await storage.getPassesBySchool(user.schoolId, limit);
      res.json(passes);
    } catch (error) {
      console.error("Error fetching passes:", error);
      res.status(500).json({ message: "Failed to fetch passes" });
    }
  });

  app.put('/api/passes/:id/return', isAuthenticated, async (req: any, res) => {
    try {
      const pass = await storage.markPassReturned(req.params.id);
      res.json(pass);
    } catch (error) {
      console.error("Error marking pass as returned:", error);
      res.status(500).json({ message: "Failed to mark pass as returned" });
    }
  });

  app.get('/api/statistics', isAuthenticated, async (req: any, res): Promise<void> => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const dateRange = req.query.from && req.query.to ? {
        from: new Date(req.query.from as string),
        to: new Date(req.query.to as string)
      } : undefined;
      
      const stats = await storage.getPassStatistics(user.schoolId, dateRange);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Kiosk endpoints
  app.post('/api/kiosk/pass', async (req, res): Promise<void> => {
    try {
      const { studentName, reason, kioskToken } = req.body;
      
      // Verify kiosk device
      const device = await storage.getKioskDeviceByToken(kioskToken);
      if (!device) {
        return res.status(401).json({ message: "Invalid kiosk token" });
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
