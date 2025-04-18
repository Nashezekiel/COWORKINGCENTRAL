import { 
  User, InsertUser, 
  PricingTier, InsertPricingTier,
  CheckInRecord, InsertCheckInRecord,
  GuestQrCode, InsertGuestQrCode,
  ActivityLog, InsertActivityLog,
  PaymentRecord, InsertPaymentRecord,
  PriceChangeHistory, InsertPriceChangeHistory,
  ScheduledPriceChange, InsertScheduledPriceChange
} from "@shared/schema";

import { randomUUID } from "crypto";
import { addMonths } from "date-fns";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // QR code management
  generateMonthlyQRCode(userId: number): Promise<string>;
  verifyQRCode(qrCode: string): Promise<User | undefined>;
  createGuestQRCode(guestQrCode: InsertGuestQrCode): Promise<GuestQrCode>;
  getGuestQRCodeById(id: number): Promise<GuestQrCode | undefined>;
  getGuestQRCodeByCode(qrCode: string): Promise<GuestQrCode | undefined>;
  markGuestQRCodeAsUsed(id: number): Promise<GuestQrCode>;
  
  // Check-in/Check-out
  createCheckInRecord(checkIn: InsertCheckInRecord): Promise<CheckInRecord>;
  getCheckInRecord(id: number): Promise<CheckInRecord | undefined>;
  getUserActiveCheckIn(userId: number): Promise<CheckInRecord | undefined>;
  checkOutUser(id: number): Promise<CheckInRecord>;
  getActiveCheckIns(): Promise<CheckInRecord[]>;
  getUserCheckInHistory(userId: number): Promise<CheckInRecord[]>;
  
  // Pricing management
  getAllPricingTiers(): Promise<PricingTier[]>;
  getPricingTier(planType: string): Promise<PricingTier | undefined>;
  createPricingTier(tier: InsertPricingTier): Promise<PricingTier>;
  updatePricingTier(planType: string, data: Partial<PricingTier>): Promise<PricingTier>;
  
  // Activity logging
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getUserActivityLogs(userId: number): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
  
  // Payment records
  createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord>;
  getUserPaymentRecords(userId: number): Promise<PaymentRecord[]>;
  getPaymentRecords(): Promise<PaymentRecord[]>;
  
  // Price change history
  createPriceChangeHistory(history: InsertPriceChangeHistory): Promise<PriceChangeHistory>;
  getPriceChangeHistory(planType: string): Promise<PriceChangeHistory[]>;
  
  // Scheduled price changes
  createScheduledPriceChange(scheduledChange: InsertScheduledPriceChange): Promise<ScheduledPriceChange>;
  getScheduledPriceChanges(): Promise<ScheduledPriceChange[]>;
  applyScheduledPriceChange(id: number): Promise<ScheduledPriceChange>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pricingTiers: Map<string, PricingTier>;
  private checkInRecords: Map<number, CheckInRecord>;
  private guestQrCodes: Map<number, GuestQrCode>;
  private activityLogs: Map<number, ActivityLog>;
  private paymentRecords: Map<number, PaymentRecord>;
  private priceChangeHistory: Map<number, PriceChangeHistory>;
  private scheduledPriceChanges: Map<number, ScheduledPriceChange>;
  
  private currentId: { [key: string]: number } = {};

  constructor() {
    this.users = new Map();
    this.pricingTiers = new Map();
    this.checkInRecords = new Map();
    this.guestQrCodes = new Map();
    this.activityLogs = new Map();
    this.paymentRecords = new Map();
    this.priceChangeHistory = new Map();
    this.scheduledPriceChanges = new Map();
    
    this.currentId = {
      user: 1,
      pricingTier: 1,
      checkInRecord: 1,
      guestQrCode: 1,
      activityLog: 1,
      paymentRecord: 1,
      priceChangeHistory: 1,
      scheduledPriceChange: 1
    };
    
    // Initialize default pricing tiers
    this.initDefaultPricingTiers();
  }

  private initDefaultPricingTiers() {
    const pricingTiers: InsertPricingTier[] = [
      {
        planType: 'hourly',
        amount: 1000,
        description: 'Pay-as-you-go usage',
        updatedBy: null
      },
      {
        planType: 'daily',
        amount: 4000,
        description: 'Full day access',
        updatedBy: null
      },
      {
        planType: 'weekly',
        amount: 20000,
        description: '7 days of access',
        updatedBy: null
      },
      {
        planType: 'monthly',
        amount: 68000,
        description: '30 days of access',
        updatedBy: null
      },
    ];

    pricingTiers.forEach(tier => {
      this.createPricingTier(tier);
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.user++;
    const user: User = { 
      ...insertUser, 
      id,
      currentMonthlyQrCode: null,
      qrCodeExpiryDate: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // QR code management
  async generateMonthlyQRCode(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    const qrCode = `COWORKFLOW-${userId}-${randomUUID()}`;
    const expiryDate = addMonths(new Date(), 1);

    await this.updateUser(userId, {
      currentMonthlyQrCode: qrCode,
      qrCodeExpiryDate: expiryDate
    });

    return qrCode;
  }

  async verifyQRCode(qrCode: string): Promise<User | undefined> {
    // Check if it's a user's monthly QR code
    const user = Array.from(this.users.values()).find(
      (user) => user.currentMonthlyQrCode === qrCode && 
      (user.qrCodeExpiryDate ? new Date(user.qrCodeExpiryDate) > new Date() : false)
    );

    if (user) {
      return user;
    }

    // Check if it's a guest QR code
    const guestQrCode = Array.from(this.guestQrCodes.values()).find(
      (code) => code.qrCode === qrCode && 
      !code.isUsed &&
      new Date(code.expiryDate) > new Date()
    );

    if (guestQrCode) {
      const guestUser = await this.getUser(guestQrCode.createdBy);
      await this.markGuestQRCodeAsUsed(guestQrCode.id);
      return guestUser;
    }

    return undefined;
  }

  async createGuestQRCode(insertGuestQrCode: InsertGuestQrCode): Promise<GuestQrCode> {
    const id = this.currentId.guestQrCode++;
    const guestQrCode: GuestQrCode = { 
      ...insertGuestQrCode, 
      id,
      createdAt: new Date()
    };
    this.guestQrCodes.set(id, guestQrCode);
    return guestQrCode;
  }

  async getGuestQRCodeById(id: number): Promise<GuestQrCode | undefined> {
    return this.guestQrCodes.get(id);
  }

  async getGuestQRCodeByCode(qrCode: string): Promise<GuestQrCode | undefined> {
    return Array.from(this.guestQrCodes.values()).find(
      (code) => code.qrCode === qrCode
    );
  }

  async markGuestQRCodeAsUsed(id: number): Promise<GuestQrCode> {
    const guestQrCode = await this.getGuestQRCodeById(id);
    if (!guestQrCode) {
      throw new Error(`Guest QR code with id ${id} not found`);
    }

    const updatedGuestQrCode = { ...guestQrCode, isUsed: true };
    this.guestQrCodes.set(id, updatedGuestQrCode);
    return updatedGuestQrCode;
  }

  // Check-in/Check-out
  async createCheckInRecord(insertCheckIn: InsertCheckInRecord): Promise<CheckInRecord> {
    const id = this.currentId.checkInRecord++;
    const checkInRecord: CheckInRecord = { 
      ...insertCheckIn, 
      id,
      checkInTime: new Date(),
      checkOutTime: null,
      duration: null
    };
    this.checkInRecords.set(id, checkInRecord);
    return checkInRecord;
  }

  async getCheckInRecord(id: number): Promise<CheckInRecord | undefined> {
    return this.checkInRecords.get(id);
  }

  async getUserActiveCheckIn(userId: number): Promise<CheckInRecord | undefined> {
    return Array.from(this.checkInRecords.values()).find(
      (record) => record.userId === userId && record.checkOutTime === null
    );
  }

  async checkOutUser(id: number): Promise<CheckInRecord> {
    const checkInRecord = await this.getCheckInRecord(id);
    if (!checkInRecord) {
      throw new Error(`Check-in record with id ${id} not found`);
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(checkInRecord.checkInTime);
    const durationInMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));

    const updatedRecord = { 
      ...checkInRecord, 
      checkOutTime,
      duration: durationInMinutes
    };
    this.checkInRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async getActiveCheckIns(): Promise<CheckInRecord[]> {
    return Array.from(this.checkInRecords.values())
      .filter(record => record.checkOutTime === null)
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  }

  async getUserCheckInHistory(userId: number): Promise<CheckInRecord[]> {
    return Array.from(this.checkInRecords.values())
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
  }

  // Pricing management
  async getAllPricingTiers(): Promise<PricingTier[]> {
    return Array.from(this.pricingTiers.values());
  }

  async getPricingTier(planType: string): Promise<PricingTier | undefined> {
    return this.pricingTiers.get(planType);
  }

  async createPricingTier(insertTier: InsertPricingTier): Promise<PricingTier> {
    const id = this.currentId.pricingTier++;
    const tier: PricingTier = { 
      ...insertTier, 
      id,
      lastUpdated: new Date()
    };
    this.pricingTiers.set(tier.planType, tier);
    return tier;
  }

  async updatePricingTier(planType: string, data: Partial<PricingTier>): Promise<PricingTier> {
    const tier = await this.getPricingTier(planType);
    if (!tier) {
      throw new Error(`Pricing tier with plan type ${planType} not found`);
    }

    const oldAmount = tier.amount;
    const updatedTier = { 
      ...tier, 
      ...data,
      lastUpdated: new Date()
    };
    this.pricingTiers.set(planType, updatedTier);

    // Record price change history if amount was changed
    if (data.amount && data.amount !== oldAmount && data.updatedBy) {
      await this.createPriceChangeHistory({
        planType: planType as any,
        oldAmount,
        newAmount: data.amount,
        changedBy: data.updatedBy,
        changeReason: "Price update"
      });
    }

    return updatedTier;
  }

  // Activity logging
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentId.activityLog++;
    const activityLog: ActivityLog = { 
      ...insertLog, 
      id,
      timestamp: new Date()
    };
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }

  async getUserActivityLogs(userId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Payment records
  async createPaymentRecord(insertPayment: InsertPaymentRecord): Promise<PaymentRecord> {
    const id = this.currentId.paymentRecord++;
    const paymentRecord: PaymentRecord = { 
      ...insertPayment, 
      id,
      timestamp: new Date()
    };
    this.paymentRecords.set(id, paymentRecord);
    return paymentRecord;
  }

  async getUserPaymentRecords(userId: number): Promise<PaymentRecord[]> {
    return Array.from(this.paymentRecords.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getPaymentRecords(): Promise<PaymentRecord[]> {
    return Array.from(this.paymentRecords.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Price change history
  async createPriceChangeHistory(insertHistory: InsertPriceChangeHistory): Promise<PriceChangeHistory> {
    const id = this.currentId.priceChangeHistory++;
    const priceChangeHistory: PriceChangeHistory = { 
      ...insertHistory, 
      id,
      timestamp: new Date()
    };
    this.priceChangeHistory.set(id, priceChangeHistory);
    return priceChangeHistory;
  }

  async getPriceChangeHistory(planType: string): Promise<PriceChangeHistory[]> {
    return Array.from(this.priceChangeHistory.values())
      .filter(history => history.planType === planType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Scheduled price changes
  async createScheduledPriceChange(insertScheduledChange: InsertScheduledPriceChange): Promise<ScheduledPriceChange> {
    const id = this.currentId.scheduledPriceChange++;
    const scheduledPriceChange: ScheduledPriceChange = { 
      ...insertScheduledChange, 
      id,
      isApplied: false,
      createdAt: new Date()
    };
    this.scheduledPriceChanges.set(id, scheduledPriceChange);
    return scheduledPriceChange;
  }

  async getScheduledPriceChanges(): Promise<ScheduledPriceChange[]> {
    return Array.from(this.scheduledPriceChanges.values())
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  async applyScheduledPriceChange(id: number): Promise<ScheduledPriceChange> {
    const scheduledChange = this.scheduledPriceChanges.get(id);
    if (!scheduledChange) {
      throw new Error(`Scheduled price change with id ${id} not found`);
    }

    if (scheduledChange.isApplied) {
      return scheduledChange;
    }

    // Apply the price change to the pricing tier
    await this.updatePricingTier(scheduledChange.planType, {
      amount: scheduledChange.newAmount,
      updatedBy: scheduledChange.scheduledBy
    });

    // Mark the scheduled change as applied
    const updatedScheduledChange = { ...scheduledChange, isApplied: true };
    this.scheduledPriceChanges.set(id, updatedScheduledChange);
    return updatedScheduledChange;
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default pricing tiers if they don't exist
    this.initDefaultPricingTiers();
  }

  private async initDefaultPricingTiers() {
    const tiers = await this.getAllPricingTiers();
    
    if (tiers.length === 0) {
      // Create default pricing tiers
      const pricingTiers: InsertPricingTier[] = [
        {
          planType: 'hourly',
          amount: 1000,
          description: 'Pay-as-you-go usage',
          updatedBy: null
        },
        {
          planType: 'daily',
          amount: 4000,
          description: 'Full day access',
          updatedBy: null
        },
        {
          planType: 'weekly',
          amount: 20000,
          description: '7 days of access',
          updatedBy: null
        },
        {
          planType: 'monthly',
          amount: 68000,
          description: '30 days of access',
          updatedBy: null
        },
      ];

      for (const tier of pricingTiers) {
        await this.createPricingTier(tier);
      }
    }
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const db = await import('./db').then(module => module.db);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await import('./db').then(module => module.db);
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await import('./db').then(module => module.db);
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const db = await import('./db').then(module => module.db);
    const [newUser] = await db.insert(users).values({
      ...user,
      currentMonthlyQrCode: null,
      qrCodeExpiryDate: null,
      createdAt: new Date()
    }).returning();
    
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { users } = await import('@shared/schema');
    
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    const db = await import('./db').then(module => module.db);
    const { users } = await import('@shared/schema');
    return db.select().from(users);
  }

  // QR code management
  async generateMonthlyQRCode(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Generate QR code (in real app, use a secure unique code)
    const qrCode = `COWORKFLOW-${userId}-${randomUUID()}`;
    const expiryDate = addMonths(new Date(), 1);
    
    // Update user
    await this.updateUser(userId, {
      currentMonthlyQrCode: qrCode,
      qrCodeExpiryDate: expiryDate
    });
    
    return qrCode;
  }

  async verifyQRCode(qrCode: string): Promise<User | undefined> {
    const db = await import('./db').then(module => module.db);
    const { eq, and, gt } = await import('drizzle-orm');
    const { users } = await import('@shared/schema');
    
    // Check if it's a user monthly QR code
    const [user] = await db.select()
      .from(users)
      .where(
        and(
          eq(users.currentMonthlyQrCode, qrCode),
          gt(users.qrCodeExpiryDate, new Date())
        )
      );
    
    if (user) {
      return user;
    }
    
    // Check if it's a guest QR code
    const { guestQrCodes } = await import('@shared/schema');
    
    const [guestQrCode] = await db.select()
      .from(guestQrCodes)
      .where(
        and(
          eq(guestQrCodes.qrCode, qrCode),
          eq(guestQrCodes.isUsed, false),
          gt(guestQrCodes.expiryDate, new Date())
        )
      );
    
    if (guestQrCode) {
      const guestUser = await this.getUser(guestQrCode.createdBy);
      await this.markGuestQRCodeAsUsed(guestQrCode.id);
      return guestUser;
    }
    
    return undefined;
  }

  async createGuestQRCode(guestQrCode: InsertGuestQrCode): Promise<GuestQrCode> {
    const db = await import('./db').then(module => module.db);
    const { guestQrCodes } = await import('@shared/schema');
    
    const [newGuestQrCode] = await db.insert(guestQrCodes).values({
      ...guestQrCode,
      createdAt: new Date(),
      isUsed: false
    }).returning();
    
    return newGuestQrCode;
  }

  async getGuestQRCodeById(id: number): Promise<GuestQrCode | undefined> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { guestQrCodes } = await import('@shared/schema');
    
    const [guestQrCode] = await db.select().from(guestQrCodes).where(eq(guestQrCodes.id, id));
    return guestQrCode;
  }

  async getGuestQRCodeByCode(qrCode: string): Promise<GuestQrCode | undefined> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { guestQrCodes } = await import('@shared/schema');
    
    const [guestQrCode] = await db.select().from(guestQrCodes).where(eq(guestQrCodes.qrCode, qrCode));
    return guestQrCode;
  }

  async markGuestQRCodeAsUsed(id: number): Promise<GuestQrCode> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { guestQrCodes } = await import('@shared/schema');
    
    const [updatedQrCode] = await db.update(guestQrCodes)
      .set({ isUsed: true })
      .where(eq(guestQrCodes.id, id))
      .returning();
    
    if (!updatedQrCode) {
      throw new Error(`Guest QR code with ID ${id} not found`);
    }
    
    return updatedQrCode;
  }

  // Check-in/Check-out
  async createCheckInRecord(checkIn: InsertCheckInRecord): Promise<CheckInRecord> {
    const db = await import('./db').then(module => module.db);
    const { checkInRecords } = await import('@shared/schema');
    
    const [newCheckIn] = await db.insert(checkInRecords).values({
      ...checkIn,
      checkInTime: new Date(),
      checkOutTime: null,
      duration: null
    }).returning();
    
    return newCheckIn;
  }

  async getCheckInRecord(id: number): Promise<CheckInRecord | undefined> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { checkInRecords } = await import('@shared/schema');
    
    const [checkInRecord] = await db.select().from(checkInRecords).where(eq(checkInRecords.id, id));
    return checkInRecord;
  }

  async getUserActiveCheckIn(userId: number): Promise<CheckInRecord | undefined> {
    const db = await import('./db').then(module => module.db);
    const { eq, isNull, and } = await import('drizzle-orm');
    const { checkInRecords } = await import('@shared/schema');
    
    const [activeCheckIn] = await db.select()
      .from(checkInRecords)
      .where(
        and(
          eq(checkInRecords.userId, userId),
          isNull(checkInRecords.checkOutTime)
        )
      );
    
    return activeCheckIn;
  }

  async checkOutUser(id: number): Promise<CheckInRecord> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { checkInRecords } = await import('@shared/schema');
    
    const checkInRecord = await this.getCheckInRecord(id);
    if (!checkInRecord) {
      throw new Error(`Check-in record with ID ${id} not found`);
    }
    
    const checkOutTime = new Date();
    const checkInTime = new Date(checkInRecord.checkInTime);
    const durationInMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));
    
    const [updatedCheckIn] = await db.update(checkInRecords)
      .set({ 
        checkOutTime: checkOutTime,
        duration: durationInMinutes
      })
      .where(eq(checkInRecords.id, id))
      .returning();
    
    return updatedCheckIn;
  }

  async getActiveCheckIns(): Promise<CheckInRecord[]> {
    const db = await import('./db').then(module => module.db);
    const { isNull, desc } = await import('drizzle-orm');
    const { checkInRecords } = await import('@shared/schema');
    
    return db.select()
      .from(checkInRecords)
      .where(isNull(checkInRecords.checkOutTime))
      .orderBy(desc(checkInRecords.checkInTime));
  }

  async getUserCheckInHistory(userId: number): Promise<CheckInRecord[]> {
    const db = await import('./db').then(module => module.db);
    const { eq, desc } = await import('drizzle-orm');
    const { checkInRecords } = await import('@shared/schema');
    
    return db.select()
      .from(checkInRecords)
      .where(eq(checkInRecords.userId, userId))
      .orderBy(desc(checkInRecords.checkInTime));
  }

  // Pricing management
  async getAllPricingTiers(): Promise<PricingTier[]> {
    const db = await import('./db').then(module => module.db);
    const { pricingTiers } = await import('@shared/schema');
    
    return db.select().from(pricingTiers);
  }

  async getPricingTier(planType: string): Promise<PricingTier | undefined> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { pricingTiers } = await import('@shared/schema');
    
    const [tier] = await db.select().from(pricingTiers).where(eq(pricingTiers.planType, planType));
    return tier;
  }

  async createPricingTier(tier: InsertPricingTier): Promise<PricingTier> {
    const db = await import('./db').then(module => module.db);
    const { pricingTiers } = await import('@shared/schema');
    
    const [newTier] = await db.insert(pricingTiers).values({
      ...tier,
      lastUpdated: new Date()
    }).returning();
    
    return newTier;
  }

  async updatePricingTier(planType: string, data: Partial<PricingTier>): Promise<PricingTier> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { pricingTiers } = await import('@shared/schema');
    
    const tier = await this.getPricingTier(planType);
    if (!tier) {
      throw new Error(`Pricing tier '${planType}' not found`);
    }
    
    const oldAmount = tier.amount;
    
    const [updatedTier] = await db.update(pricingTiers)
      .set({ 
        ...data,
        lastUpdated: new Date()
      })
      .where(eq(pricingTiers.planType, planType))
      .returning();
    
    // Record price change history if amount was changed
    if (data.amount && data.amount !== oldAmount && data.updatedBy) {
      await this.createPriceChangeHistory({
        planType: planType as any,
        oldAmount,
        newAmount: data.amount,
        changedBy: data.updatedBy,
        changeReason: "Price update"
      });
    }
    
    return updatedTier;
  }

  // Activity logging
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const db = await import('./db').then(module => module.db);
    const { activityLogs } = await import('@shared/schema');
    
    const [newLog] = await db.insert(activityLogs).values({
      ...log,
      timestamp: new Date()
    }).returning();
    
    return newLog;
  }

  async getUserActivityLogs(userId: number): Promise<ActivityLog[]> {
    const db = await import('./db').then(module => module.db);
    const { eq, desc } = await import('drizzle-orm');
    const { activityLogs } = await import('@shared/schema');
    
    return db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    const db = await import('./db').then(module => module.db);
    const { desc } = await import('drizzle-orm');
    const { activityLogs } = await import('@shared/schema');
    
    return db.select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
  }

  // Payment records
  async createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord> {
    const db = await import('./db').then(module => module.db);
    const { paymentRecords } = await import('@shared/schema');
    
    const [newPayment] = await db.insert(paymentRecords).values({
      ...payment,
      timestamp: new Date()
    }).returning();
    
    return newPayment;
  }

  async getUserPaymentRecords(userId: number): Promise<PaymentRecord[]> {
    const db = await import('./db').then(module => module.db);
    const { eq, desc } = await import('drizzle-orm');
    const { paymentRecords } = await import('@shared/schema');
    
    return db.select()
      .from(paymentRecords)
      .where(eq(paymentRecords.userId, userId))
      .orderBy(desc(paymentRecords.timestamp));
  }

  async getPaymentRecords(): Promise<PaymentRecord[]> {
    const db = await import('./db').then(module => module.db);
    const { desc } = await import('drizzle-orm');
    const { paymentRecords } = await import('@shared/schema');
    
    return db.select()
      .from(paymentRecords)
      .orderBy(desc(paymentRecords.timestamp));
  }

  // Price change history
  async createPriceChangeHistory(history: InsertPriceChangeHistory): Promise<PriceChangeHistory> {
    const db = await import('./db').then(module => module.db);
    const { priceChangeHistory } = await import('@shared/schema');
    
    const [newHistory] = await db.insert(priceChangeHistory).values({
      ...history,
      timestamp: new Date()
    }).returning();
    
    return newHistory;
  }

  async getPriceChangeHistory(planType: string): Promise<PriceChangeHistory[]> {
    const db = await import('./db').then(module => module.db);
    const { eq, desc } = await import('drizzle-orm');
    const { priceChangeHistory } = await import('@shared/schema');
    
    return db.select()
      .from(priceChangeHistory)
      .where(eq(priceChangeHistory.planType, planType))
      .orderBy(desc(priceChangeHistory.timestamp));
  }

  // Scheduled price changes
  async createScheduledPriceChange(scheduledChange: InsertScheduledPriceChange): Promise<ScheduledPriceChange> {
    const db = await import('./db').then(module => module.db);
    const { scheduledPriceChanges } = await import('@shared/schema');
    
    const [newScheduledChange] = await db.insert(scheduledPriceChanges).values({
      ...scheduledChange,
      isApplied: false,
      createdAt: new Date()
    }).returning();
    
    return newScheduledChange;
  }

  async getScheduledPriceChanges(): Promise<ScheduledPriceChange[]> {
    const db = await import('./db').then(module => module.db);
    const { asc } = await import('drizzle-orm');
    const { scheduledPriceChanges } = await import('@shared/schema');
    
    return db.select()
      .from(scheduledPriceChanges)
      .orderBy(asc(scheduledPriceChanges.scheduledDate));
  }

  async applyScheduledPriceChange(id: number): Promise<ScheduledPriceChange> {
    const db = await import('./db').then(module => module.db);
    const { eq } = await import('drizzle-orm');
    const { scheduledPriceChanges } = await import('@shared/schema');
    
    // Get the scheduled change
    const [scheduledChange] = await db.select()
      .from(scheduledPriceChanges)
      .where(eq(scheduledPriceChanges.id, id));
    
    if (!scheduledChange) {
      throw new Error(`Scheduled price change with ID ${id} not found`);
    }
    
    if (scheduledChange.isApplied) {
      return scheduledChange;
    }
    
    // Get the pricing tier
    const tier = await this.getPricingTier(scheduledChange.planType);
    if (!tier) {
      throw new Error(`Pricing tier '${scheduledChange.planType}' not found`);
    }
    
    // Apply the price change to the pricing tier
    await this.updatePricingTier(scheduledChange.planType, {
      amount: scheduledChange.newAmount,
      updatedBy: scheduledChange.scheduledBy
    });
    
    // Mark the scheduled change as applied
    const [updatedChange] = await db.update(scheduledPriceChanges)
      .set({ isApplied: true, appliedAt: new Date() })
      .where(eq(scheduledPriceChanges.id, id))
      .returning();
    
    return updatedChange;
  }
}

// Import database schema
import { 
  users, pricingTiers, checkInRecords, guestQrCodes,
  activityLogs, paymentRecords, priceChangeHistory, scheduledPriceChanges 
} from "@shared/schema";
import { eq, and, gt, isNull, desc, asc } from "drizzle-orm";

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();
