import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";
import bcrypt from "crypto";
import { 
  insertUserSchema, 
  insertActivityLogSchema, 
  insertCheckInRecordSchema,
  insertGuestQrCodeSchema,
  insertPaymentRecordSchema,
  insertPricingTierSchema,
  insertScheduledPriceChangeSchema,
  loginSchema,
  pinLoginSchema
} from "@shared/schema";
import { addDays, addHours, format } from "date-fns";
import { z } from "zod";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Create PostgreSQL session store
const PgStore = connectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware with PostgreSQL session store
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60 // Prune expired sessions every hour (in seconds)
      }),
      secret: process.env.SESSION_SECRET || "coworkflow-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
      }
    })
  );

  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(validated.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Generate a random color for the profile image
      const colors = ["red", "blue", "green", "purple", "yellow", "teal", "indigo", "orange", "emerald", "violet"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Hash the password
      const hashedPassword = await bcrypt.scrypt(validated.password, "salt", 64);
      const passwordHash = hashedPassword.toString("hex");
      
      const user = await storage.createUser({
        ...validated,
        password: passwordHash,
        profileImageColor: randomColor
      });
      
      // Log the registration activity
      await storage.createActivityLog({
        userId: user.id,
        activityType: "registration",
        details: "New user registration"
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      req.session.userId = user.id;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error registering user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validated = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validated.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Verify password
      const hashedPassword = await bcrypt.scrypt(validated.password, "salt", 64);
      const passwordHash = hashedPassword.toString("hex");
      
      if (user.password !== passwordHash) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Log the login activity
      await storage.createActivityLog({
        userId: user.id,
        activityType: "check_in",
        details: "User logged in"
      });
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error logging in" });
    }
  });

  app.post("/api/auth/pin-login", async (req: Request, res: Response) => {
    try {
      const validated = pinLoginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(validated.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or PIN" });
      }
      
      if (user.pin !== validated.pin) {
        return res.status(401).json({ message: "Invalid username or PIN" });
      }
      
      // Log the login activity
      await storage.createActivityLog({
        userId: user.id,
        activityType: "check_in",
        details: "User logged in with PIN"
      });
      
      // Set user ID in session
      req.session.userId = user.id;
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error logging in with PIN" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session.userId) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging out" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Already logged out" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  });

  // QR Code routes
  app.post("/api/qrcode/generate", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const qrCode = await storage.generateMonthlyQRCode(req.session.userId);
      res.status(200).json({ qrCode });
    } catch (error) {
      res.status(500).json({ message: "Error generating QR code" });
    }
  });

  app.post("/api/qrcode/verify", async (req: Request, res: Response) => {
    try {
      const { qrCode } = req.body;
      if (!qrCode) {
        return res.status(400).json({ message: "QR code is required" });
      }
      
      const user = await storage.verifyQRCode(qrCode);
      if (!user) {
        return res.status(404).json({ message: "Invalid or expired QR code" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Error verifying QR code" });
    }
  });

  app.post("/api/qrcode/guest", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const validated = insertGuestQrCodeSchema.parse({
        ...req.body,
        createdBy: req.session.userId,
        qrCode: `GUEST-${randomUUID()}`
      });
      
      // Set expiry date based on plan type
      let expiryDate: Date;
      switch (validated.planType) {
        case "hourly":
          expiryDate = addHours(new Date(), 1);
          break;
        case "daily":
          expiryDate = addDays(new Date(), 1);
          break;
        case "weekly":
          expiryDate = addDays(new Date(), 7);
          break;
        default:
          expiryDate = addHours(new Date(), 24); // Default to 24 hours
      }
      
      const guestQrCode = await storage.createGuestQRCode({
        ...validated,
        expiryDate
      });
      
      res.status(201).json(guestQrCode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating guest QR code" });
    }
  });

  // Check-in / Check-out routes
  app.post("/api/checkin", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Check if user is already checked in
      const activeCheckIn = await storage.getUserActiveCheckIn(req.session.userId);
      if (activeCheckIn) {
        return res.status(400).json({ message: "User already checked in" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Default to hourly if no plan type is set
      const planType = user.planType || "hourly";
      
      const validated = insertCheckInRecordSchema.parse({
        userId: req.session.userId,
        planType
      });
      
      const checkInRecord = await storage.createCheckInRecord(validated);
      
      // Log check-in activity
      await storage.createActivityLog({
        userId: req.session.userId,
        activityType: "check_in",
        details: `Checked in with ${planType} plan`
      });
      
      res.status(201).json(checkInRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error checking in" });
    }
  });

  app.post("/api/checkout", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Find active check-in for the user
      const activeCheckIn = await storage.getUserActiveCheckIn(req.session.userId);
      if (!activeCheckIn) {
        return res.status(400).json({ message: "No active check-in found" });
      }
      
      const checkOutRecord = await storage.checkOutUser(activeCheckIn.id);
      
      // Log check-out activity
      await storage.createActivityLog({
        userId: req.session.userId,
        activityType: "check_out",
        details: `Checked out after ${checkOutRecord.duration} minutes`
      });
      
      res.status(200).json(checkOutRecord);
    } catch (error) {
      res.status(500).json({ message: "Error checking out" });
    }
  });

  app.get("/api/checkins/active", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only managers and super admins can see all active check-ins
      if (user.role !== "manager" && user.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const activeCheckIns = await storage.getActiveCheckIns();
      
      // Enrich check-in data with user information
      const enrichedCheckIns = await Promise.all(
        activeCheckIns.map(async (checkIn) => {
          const user = await storage.getUser(checkIn.userId);
          return {
            ...checkIn,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              profileImageColor: user.profileImageColor
            } : null
          };
        })
      );
      
      res.status(200).json(enrichedCheckIns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active check-ins" });
    }
  });

  // User routes
  app.get("/api/users", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only managers and super admins can see all users
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const users = await storage.getAllUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Users can view their own profile, admins can view any profile
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      if (userId !== req.session.userId && 
          currentUser.role !== "manager" && 
          currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Users can update their own profile, admins can update any profile
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      if (userId !== req.session.userId && 
          currentUser.role !== "manager" && 
          currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow role updates unless super_admin
      if (req.body.role && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized to change roles" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Pricing routes
  app.get("/api/pricing", async (req: Request, res: Response) => {
    try {
      const pricingTiers = await storage.getAllPricingTiers();
      res.status(200).json(pricingTiers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pricing tiers" });
    }
  });

  app.put("/api/pricing/:planType", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { planType } = req.params;
      
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only managers and super admins can update pricing
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const pricingTier = await storage.getPricingTier(planType);
      if (!pricingTier) {
        return res.status(404).json({ message: "Pricing tier not found" });
      }
      
      const updatedTier = await storage.updatePricingTier(planType, {
        ...req.body,
        updatedBy: req.session.userId
      });
      
      res.status(200).json(updatedTier);
    } catch (error) {
      res.status(500).json({ message: "Error updating pricing tier" });
    }
  });

  app.post("/api/pricing/scheduled", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only managers and super admins can schedule price changes
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const validated = insertScheduledPriceChangeSchema.parse({
        ...req.body,
        scheduledBy: req.session.userId
      });
      
      const scheduledChange = await storage.createScheduledPriceChange(validated);
      
      res.status(201).json(scheduledChange);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error scheduling price change" });
    }
  });

  app.get("/api/pricing/scheduled", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only managers and super admins can view scheduled price changes
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const scheduledChanges = await storage.getScheduledPriceChanges();
      
      res.status(200).json(scheduledChanges);
    } catch (error) {
      res.status(500).json({ message: "Error fetching scheduled price changes" });
    }
  });

  app.post("/api/pricing/scheduled/:id/apply", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scheduled price change ID" });
      }
      
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only super admins can manually apply scheduled price changes
      if (currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const appliedChange = await storage.applyScheduledPriceChange(id);
      
      res.status(200).json(appliedChange);
    } catch (error) {
      res.status(500).json({ message: "Error applying scheduled price change" });
    }
  });

  // Payment routes
  app.post("/api/payments", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const validated = insertPaymentRecordSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const paymentRecord = await storage.createPaymentRecord(validated);
      
      // Log payment activity
      await storage.createActivityLog({
        userId: req.session.userId,
        activityType: "payment",
        details: `Made a payment of ${paymentRecord.amount} for ${paymentRecord.planType} plan via ${paymentRecord.paymentMethod}`
      });
      
      res.status(201).json(paymentRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error recording payment" });
    }
  });
  
  // Get receipt for a payment
  app.get("/api/payments/:paymentId/receipt", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const paymentId = parseInt(req.params.paymentId);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      // Fetch the payment record
      const paymentRecords = await storage.getUserPaymentRecords(req.session.userId);
      const payment = paymentRecords.find(p => p.id === paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }
      
      // Get user details
      const user = await storage.getUser(payment.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate receipt data
      const receiptData = {
        receiptNumber: `REC-${payment.id.toString().padStart(6, '0')}`,
        customerName: user.name,
        customerEmail: user.email,
        paymentDate: payment.timestamp,
        paymentMethod: payment.paymentMethod,
        planType: payment.planType,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId || 'N/A',
        companyDetails: {
          name: "CoworkFlow Space",
          address: "123 Workplace Avenue, Business District",
          email: "billing@coworkflow.com",
          phone: "+1 (555) 123-4567"
        }
      };
      
      res.status(200).json(receiptData);
    } catch (error) {
      res.status(500).json({ message: "Error generating receipt" });
    }
  });

  app.get("/api/payments/user/:userId", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Users can view their own payments, admins can view any payments
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      if (userId !== req.session.userId && 
          currentUser.role !== "manager" && 
          currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const paymentRecords = await storage.getUserPaymentRecords(userId);
      
      res.status(200).json(paymentRecords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment records" });
    }
  });

  // Activity log routes
  app.get("/api/activity/recent", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only managers and super admins can view all activity
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activityLogs = await storage.getRecentActivityLogs(limit);
      
      // Enrich activity logs with user information
      const enrichedLogs = await Promise.all(
        activityLogs.map(async (log) => {
          const user = await storage.getUser(log.userId);
          return {
            ...log,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
              profileImageColor: user.profileImageColor
            } : null
          };
        })
      );
      
      res.status(200).json(enrichedLogs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activity logs" });
    }
  });

  app.get("/api/activity/user/:userId", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Users can view their own activity, admins can view any activity
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      
      if (userId !== req.session.userId && 
          currentUser.role !== "manager" && 
          currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const activityLogs = await storage.getUserActivityLogs(userId);
      
      res.status(200).json(activityLogs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activity logs" });
    }
  });

  // Statistics routes
  app.get("/api/stats/today", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only managers and super admins can view statistics
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all activity logs for today
      const allLogs = Array.from((await storage.getRecentActivityLogs(1000)))
        .filter(log => new Date(log.timestamp) >= today);
      
      // Calculate stats
      const checkins = allLogs.filter(log => log.activityType === "check_in").length;
      
      // Active users are those currently checked in
      const activeUsers = (await storage.getActiveCheckIns()).length;
      
      // New registrations today
      const newUsers = allLogs.filter(log => log.activityType === "registration").length;
      
      // Calculate revenue from payments made today
      const todayPayments = Array.from((await storage.getPaymentRecords()))
        .filter(payment => new Date(payment.timestamp) >= today && payment.status === "completed");
      
      const revenue = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      res.status(200).json({
        checkins,
        activeUsers,
        newUsers,
        revenue
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching statistics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
