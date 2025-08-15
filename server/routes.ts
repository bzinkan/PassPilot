import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertGradeSchema, insertStudentSchema, insertPassSchema } from "@shared/schema";

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

  // Initialize default pass types
  app.post('/api/setup', isAuthenticated, async (req: any, res) => {
    try {
      const defaultPassTypes = [
        { name: "Bathroom", icon: "fas fa-restroom", color: "blue", isDefault: true },
        { name: "Nurse", icon: "fas fa-user-nurse", color: "red", isDefault: true },
        { name: "Office", icon: "fas fa-building", color: "orange", isDefault: true },
        { name: "Other", icon: "fas fa-ellipsis-h", color: "green", isDefault: true },
      ];

      const existingTypes = await storage.getPassTypes();
      if (existingTypes.length === 0) {
        for (const type of defaultPassTypes) {
          await storage.createPassType(type);
        }
      }

      res.json({ message: "Setup complete" });
    } catch (error) {
      console.error("Error during setup:", error);
      res.status(500).json({ message: "Setup failed" });
    }
  });

  // Grade management
  app.post('/api/grades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gradeData = insertGradeSchema.parse({ ...req.body, teacherId: userId });
      const grade = await storage.createGrade(gradeData);
      res.json(grade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  app.get('/api/grades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const grades = await storage.getGradesByTeacher(userId);
      res.json(grades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });

  app.put('/api/grades/:id', isAuthenticated, async (req: any, res) => {
    try {
      const gradeData = insertGradeSchema.partial().parse(req.body);
      const grade = await storage.updateGrade(req.params.id, gradeData);
      res.json(grade);
    } catch (error) {
      console.error("Error updating grade:", error);
      res.status(500).json({ message: "Failed to update grade" });
    }
  });

  app.delete('/api/grades/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteGrade(req.params.id);
      res.json({ message: "Grade deleted successfully" });
    } catch (error) {
      console.error("Error deleting grade:", error);
      res.status(500).json({ message: "Failed to delete grade" });
    }
  });

  // Student management
  app.post('/api/students', isAuthenticated, async (req: any, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.post('/api/students/bulk', isAuthenticated, async (req: any, res) => {
    try {
      const studentsData = req.body.students.map((s: any) => insertStudentSchema.parse(s));
      const students = await storage.createStudentsBulk(studentsData);
      res.json(students);
    } catch (error) {
      console.error("Error creating students in bulk:", error);
      res.status(500).json({ message: "Failed to create students" });
    }
  });

  app.get('/api/grades/:gradeId/students', isAuthenticated, async (req: any, res) => {
    try {
      const students = await storage.getStudentsByGrade(req.params.gradeId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.delete('/api/students/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Pass management
  app.get('/api/pass-types', isAuthenticated, async (req: any, res) => {
    try {
      const passTypes = await storage.getPassTypes();
      res.json(passTypes);
    } catch (error) {
      console.error("Error fetching pass types:", error);
      res.status(500).json({ message: "Failed to fetch pass types" });
    }
  });

  app.post('/api/passes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const passData = insertPassSchema.parse({ ...req.body, teacherId: userId });
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
      const passes = await storage.getActivePassesByTeacher(userId);
      res.json(passes);
    } catch (error) {
      console.error("Error fetching active passes:", error);
      res.status(500).json({ message: "Failed to fetch active passes" });
    }
  });

  app.get('/api/passes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const passes = await storage.getPassesByTeacher(userId, limit);
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

  app.get('/api/statistics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dateRange = req.query.from && req.query.to ? {
        from: new Date(req.query.from as string),
        to: new Date(req.query.to as string)
      } : undefined;
      
      const stats = await storage.getPassStatistics(userId, dateRange);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Kiosk endpoints
  app.post('/api/kiosk/pass', async (req, res) => {
    try {
      const { studentIdOrName, gradeId, passTypeId } = req.body;
      
      // Find student
      const student = await storage.getStudentByIdOrName(gradeId, studentIdOrName);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Get the teacher for this grade
      const grades = await storage.getGradesByTeacher(student.gradeId);
      const grade = grades.find(g => g.id === student.gradeId);
      if (!grade) {
        return res.status(404).json({ message: "Grade not found" });
      }

      const passData = {
        studentId: student.id,
        passTypeId,
        teacherId: grade.teacherId,
        status: "out" as const,
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
