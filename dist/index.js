var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  activityTypeEnum: () => activityTypeEnum,
  checkInRecords: () => checkInRecords,
  guestQrCodes: () => guestQrCodes,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertCheckInRecordSchema: () => insertCheckInRecordSchema,
  insertGuestQrCodeSchema: () => insertGuestQrCodeSchema,
  insertPaymentRecordSchema: () => insertPaymentRecordSchema,
  insertPriceChangeHistorySchema: () => insertPriceChangeHistorySchema,
  insertPricingTierSchema: () => insertPricingTierSchema,
  insertScheduledPriceChangeSchema: () => insertScheduledPriceChangeSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  paymentRecords: () => paymentRecords,
  pinLoginSchema: () => pinLoginSchema,
  planTypeEnum: () => planTypeEnum,
  priceChangeHistory: () => priceChangeHistory,
  pricingTiers: () => pricingTiers,
  scheduledPriceChanges: () => scheduledPriceChanges,
  userRoleEnum: () => userRoleEnum,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var userRoleEnum, planTypeEnum, activityTypeEnum, users, pricingTiers, checkInRecords, guestQrCodes, activityLogs, paymentRecords, priceChangeHistory, scheduledPriceChanges, insertUserSchema, insertPricingTierSchema, insertCheckInRecordSchema, insertGuestQrCodeSchema, insertActivityLogSchema, insertPaymentRecordSchema, insertPriceChangeHistorySchema, insertScheduledPriceChangeSchema, loginSchema, pinLoginSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    userRoleEnum = pgEnum("user_role", ["user", "manager", "super_admin"]);
    planTypeEnum = pgEnum("plan_type", ["hourly", "daily", "weekly", "monthly"]);
    activityTypeEnum = pgEnum("activity_type", ["check_in", "check_out", "payment", "registration"]);
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      name: text("name").notNull(),
      email: text("email").notNull().unique(),
      role: userRoleEnum("role").notNull().default("user"),
      pin: text("pin").notNull(),
      currentMonthlyQrCode: text("current_monthly_qr_code"),
      qrCodeExpiryDate: timestamp("qr_code_expiry_date"),
      profileImageColor: text("profile_image_color").notNull(),
      planType: planTypeEnum("plan_type"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    pricingTiers = pgTable("pricing_tiers", {
      id: serial("id").primaryKey(),
      planType: planTypeEnum("plan_type").notNull(),
      amount: integer("amount").notNull(),
      description: text("description").notNull(),
      lastUpdated: timestamp("last_updated").notNull().defaultNow(),
      updatedBy: integer("updated_by").references(() => users.id)
    });
    checkInRecords = pgTable("check_in_records", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      checkInTime: timestamp("check_in_time").notNull().defaultNow(),
      checkOutTime: timestamp("check_out_time"),
      duration: integer("duration"),
      planType: planTypeEnum("plan_type").notNull()
    });
    guestQrCodes = pgTable("guest_qr_codes", {
      id: serial("id").primaryKey(),
      createdBy: integer("created_by").notNull().references(() => users.id),
      guestName: text("guest_name").notNull(),
      qrCode: text("qr_code").notNull(),
      planType: planTypeEnum("plan_type").notNull(),
      expiryDate: timestamp("expiry_date").notNull(),
      isUsed: boolean("is_used").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    activityLogs = pgTable("activity_logs", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      activityType: activityTypeEnum("activity_type").notNull(),
      details: text("details"),
      timestamp: timestamp("timestamp").notNull().defaultNow()
    });
    paymentRecords = pgTable("payment_records", {
      id: serial("id").primaryKey(),
      userId: integer("user_id").notNull().references(() => users.id),
      amount: integer("amount").notNull(),
      planType: planTypeEnum("plan_type").notNull(),
      paymentMethod: text("payment_method").notNull(),
      transactionId: text("transaction_id"),
      status: text("status").notNull(),
      timestamp: timestamp("timestamp").notNull().defaultNow()
    });
    priceChangeHistory = pgTable("price_change_history", {
      id: serial("id").primaryKey(),
      planType: planTypeEnum("plan_type").notNull(),
      oldAmount: integer("old_amount").notNull(),
      newAmount: integer("new_amount").notNull(),
      changedBy: integer("changed_by").notNull().references(() => users.id),
      changeReason: text("change_reason"),
      timestamp: timestamp("timestamp").notNull().defaultNow()
    });
    scheduledPriceChanges = pgTable("scheduled_price_changes", {
      id: serial("id").primaryKey(),
      planType: planTypeEnum("plan_type").notNull(),
      newAmount: integer("new_amount").notNull(),
      scheduledBy: integer("scheduled_by").notNull().references(() => users.id),
      scheduledDate: timestamp("scheduled_date").notNull(),
      isApplied: boolean("is_applied").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      qrCodeExpiryDate: true,
      currentMonthlyQrCode: true
    });
    insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
      id: true,
      lastUpdated: true
    });
    insertCheckInRecordSchema = createInsertSchema(checkInRecords).omit({
      id: true,
      checkOutTime: true,
      duration: true
    });
    insertGuestQrCodeSchema = createInsertSchema(guestQrCodes).omit({
      id: true,
      createdAt: true
    });
    insertActivityLogSchema = createInsertSchema(activityLogs).omit({
      id: true,
      timestamp: true
    });
    insertPaymentRecordSchema = createInsertSchema(paymentRecords).omit({
      id: true,
      timestamp: true
    });
    insertPriceChangeHistorySchema = createInsertSchema(priceChangeHistory).omit({
      id: true,
      timestamp: true
    });
    insertScheduledPriceChangeSchema = createInsertSchema(scheduledPriceChanges).omit({
      id: true,
      createdAt: true,
      isApplied: true
    });
    loginSchema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters")
    });
    pinLoginSchema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      pin: z.string().length(4, "PIN must be 4 digits")
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import "dotenv/config";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_schema();
import { randomUUID } from "crypto";
import { addMonths } from "date-fns";
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    this.initDefaultPricingTiers();
  }
  async initDefaultPricingTiers() {
    const tiers = await this.getAllPricingTiers();
    if (tiers.length === 0) {
      const pricingTiers3 = [
        {
          planType: "hourly",
          amount: 1e3,
          description: "Pay-as-you-go usage",
          updatedBy: null
        },
        {
          planType: "daily",
          amount: 4e3,
          description: "Full day access",
          updatedBy: null
        },
        {
          planType: "weekly",
          amount: 2e4,
          description: "7 days of access",
          updatedBy: null
        },
        {
          planType: "monthly",
          amount: 68e3,
          description: "30 days of access",
          updatedBy: null
        }
      ];
      for (const tier of pricingTiers3) {
        await this.createPricingTier(tier);
      }
    }
  }
  // User management
  async getUser(id) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const [user] = await db2.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const [user] = await db2.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const [user] = await db2.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(user) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const [newUser] = await db2.insert(users).values({
      ...user,
      currentMonthlyQrCode: null,
      qrCodeExpiryDate: null,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return newUser;
  }
  async updateUser(id, data) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [updatedUser] = await db2.update(users2).set(data).where(eq2(users2.id, id)).returning();
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    return updatedUser;
  }
  async getAllUsers() {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(users2);
  }
  // QR code management
  async generateMonthlyQRCode(userId) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    const qrCode = `COWORKFLOW-${userId}-${randomUUID()}`;
    const expiryDate = addMonths(/* @__PURE__ */ new Date(), 1);
    await this.updateUser(userId, {
      currentMonthlyQrCode: qrCode,
      qrCodeExpiryDate: expiryDate
    });
    return qrCode;
  }
  async verifyQRCode(qrCode) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2, and: and2, gt: gt2 } = await import("drizzle-orm");
    const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [user] = await db2.select().from(users2).where(
      and2(
        eq2(users2.currentMonthlyQrCode, qrCode),
        gt2(users2.qrCodeExpiryDate, /* @__PURE__ */ new Date())
      )
    );
    if (user) {
      return user;
    }
    const { guestQrCodes: guestQrCodes3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [guestQrCode] = await db2.select().from(guestQrCodes3).where(
      and2(
        eq2(guestQrCodes3.qrCode, qrCode),
        eq2(guestQrCodes3.isUsed, false),
        gt2(guestQrCodes3.expiryDate, /* @__PURE__ */ new Date())
      )
    );
    if (guestQrCode) {
      const guestUser = await this.getUser(guestQrCode.createdBy);
      await this.markGuestQRCodeAsUsed(guestQrCode.id);
      return guestUser;
    }
    return void 0;
  }
  async createGuestQRCode(guestQrCode) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { guestQrCodes: guestQrCodes3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [newGuestQrCode] = await db2.insert(guestQrCodes3).values({
      ...guestQrCode,
      createdAt: /* @__PURE__ */ new Date(),
      isUsed: false
    }).returning();
    return newGuestQrCode;
  }
  async getGuestQRCodeById(id) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { guestQrCodes: guestQrCodes3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [guestQrCode] = await db2.select().from(guestQrCodes3).where(eq2(guestQrCodes3.id, id));
    return guestQrCode;
  }
  async getGuestQRCodeByCode(qrCode) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { guestQrCodes: guestQrCodes3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [guestQrCode] = await db2.select().from(guestQrCodes3).where(eq2(guestQrCodes3.qrCode, qrCode));
    return guestQrCode;
  }
  async markGuestQRCodeAsUsed(id) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { guestQrCodes: guestQrCodes3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [updatedQrCode] = await db2.update(guestQrCodes3).set({ isUsed: true }).where(eq2(guestQrCodes3.id, id)).returning();
    if (!updatedQrCode) {
      throw new Error(`Guest QR code with ID ${id} not found`);
    }
    return updatedQrCode;
  }
  // Check-in/Check-out
  async createCheckInRecord(checkIn) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { checkInRecords: checkInRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [newCheckIn] = await db2.insert(checkInRecords3).values({
      ...checkIn,
      checkInTime: /* @__PURE__ */ new Date(),
      checkOutTime: null,
      duration: null
    }).returning();
    return newCheckIn;
  }
  async getCheckInRecord(id) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { checkInRecords: checkInRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [checkInRecord] = await db2.select().from(checkInRecords3).where(eq2(checkInRecords3.id, id));
    return checkInRecord;
  }
  async getUserActiveCheckIn(userId) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2, isNull: isNull2, and: and2 } = await import("drizzle-orm");
    const { checkInRecords: checkInRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [activeCheckIn] = await db2.select().from(checkInRecords3).where(
      and2(
        eq2(checkInRecords3.userId, userId),
        isNull2(checkInRecords3.checkOutTime)
      )
    );
    return activeCheckIn;
  }
  async checkOutUser(id) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { checkInRecords: checkInRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const checkInRecord = await this.getCheckInRecord(id);
    if (!checkInRecord) {
      throw new Error(`Check-in record with ID ${id} not found`);
    }
    const checkOutTime = /* @__PURE__ */ new Date();
    const checkInTime = new Date(checkInRecord.checkInTime);
    const durationInMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1e3 * 60));
    const [updatedCheckIn] = await db2.update(checkInRecords3).set({
      checkOutTime,
      duration: durationInMinutes
    }).where(eq2(checkInRecords3.id, id)).returning();
    return updatedCheckIn;
  }
  async getActiveCheckIns() {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { isNull: isNull2, desc: desc2 } = await import("drizzle-orm");
    const { checkInRecords: checkInRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(checkInRecords3).where(isNull2(checkInRecords3.checkOutTime)).orderBy(desc2(checkInRecords3.checkInTime));
  }
  async getUserCheckInHistory(userId) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2, desc: desc2 } = await import("drizzle-orm");
    const { checkInRecords: checkInRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(checkInRecords3).where(eq2(checkInRecords3.userId, userId)).orderBy(desc2(checkInRecords3.checkInTime));
  }
  // Pricing management
  async getAllPricingTiers() {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { pricingTiers: pricingTiers3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(pricingTiers3);
  }
  async getPricingTier(planType) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { pricingTiers: pricingTiers3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [tier] = await db2.select().from(pricingTiers3).where(eq2(pricingTiers3.planType, planType));
    return tier;
  }
  async createPricingTier(tier) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { pricingTiers: pricingTiers3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [newTier] = await db2.insert(pricingTiers3).values({
      ...tier,
      lastUpdated: /* @__PURE__ */ new Date()
    }).returning();
    return newTier;
  }
  async updatePricingTier(planType, data) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { pricingTiers: pricingTiers3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const tier = await this.getPricingTier(planType);
    if (!tier) {
      throw new Error(`Pricing tier '${planType}' not found`);
    }
    const oldAmount = tier.amount;
    const [updatedTier] = await db2.update(pricingTiers3).set({
      ...data,
      lastUpdated: /* @__PURE__ */ new Date()
    }).where(eq2(pricingTiers3.planType, planType)).returning();
    if (data.amount && data.amount !== oldAmount && data.updatedBy) {
      await this.createPriceChangeHistory({
        planType,
        oldAmount,
        newAmount: data.amount,
        changedBy: data.updatedBy,
        changeReason: "Price update"
      });
    }
    return updatedTier;
  }
  // Activity logging
  async createActivityLog(log2) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { activityLogs: activityLogs3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [newLog] = await db2.insert(activityLogs3).values({
      ...log2,
      timestamp: /* @__PURE__ */ new Date()
    }).returning();
    return newLog;
  }
  async getUserActivityLogs(userId) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2, desc: desc2 } = await import("drizzle-orm");
    const { activityLogs: activityLogs3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(activityLogs3).where(eq2(activityLogs3.userId, userId)).orderBy(desc2(activityLogs3.timestamp));
  }
  async getRecentActivityLogs(limit) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { desc: desc2 } = await import("drizzle-orm");
    const { activityLogs: activityLogs3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(activityLogs3).orderBy(desc2(activityLogs3.timestamp)).limit(limit);
  }
  // Payment records
  async createPaymentRecord(payment) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { paymentRecords: paymentRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [newPayment] = await db2.insert(paymentRecords3).values({
      ...payment,
      timestamp: /* @__PURE__ */ new Date()
    }).returning();
    return newPayment;
  }
  async getUserPaymentRecords(userId) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2, desc: desc2 } = await import("drizzle-orm");
    const { paymentRecords: paymentRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(paymentRecords3).where(eq2(paymentRecords3.userId, userId)).orderBy(desc2(paymentRecords3.timestamp));
  }
  async getPaymentRecords() {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { desc: desc2 } = await import("drizzle-orm");
    const { paymentRecords: paymentRecords3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(paymentRecords3).orderBy(desc2(paymentRecords3.timestamp));
  }
  // Price change history
  async createPriceChangeHistory(history) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { priceChangeHistory: priceChangeHistory3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [newHistory] = await db2.insert(priceChangeHistory3).values({
      ...history,
      timestamp: /* @__PURE__ */ new Date()
    }).returning();
    return newHistory;
  }
  async getPriceChangeHistory(planType) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2, desc: desc2 } = await import("drizzle-orm");
    const { priceChangeHistory: priceChangeHistory3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(priceChangeHistory3).where(eq2(priceChangeHistory3.planType, planType)).orderBy(desc2(priceChangeHistory3.timestamp));
  }
  // Scheduled price changes
  async createScheduledPriceChange(scheduledChange) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { scheduledPriceChanges: scheduledPriceChanges3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [newScheduledChange] = await db2.insert(scheduledPriceChanges3).values({
      ...scheduledChange,
      isApplied: false,
      createdAt: /* @__PURE__ */ new Date()
    }).returning();
    return newScheduledChange;
  }
  async getScheduledPriceChanges() {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { asc: asc2 } = await import("drizzle-orm");
    const { scheduledPriceChanges: scheduledPriceChanges3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    return db2.select().from(scheduledPriceChanges3).orderBy(asc2(scheduledPriceChanges3.scheduledDate));
  }
  async applyScheduledPriceChange(id) {
    const db2 = await Promise.resolve().then(() => (init_db(), db_exports)).then((module) => module.db);
    const { eq: eq2 } = await import("drizzle-orm");
    const { scheduledPriceChanges: scheduledPriceChanges3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const [scheduledChange] = await db2.select().from(scheduledPriceChanges3).where(eq2(scheduledPriceChanges3.id, id));
    if (!scheduledChange) {
      throw new Error(`Scheduled price change with ID ${id} not found`);
    }
    if (scheduledChange.isApplied) {
      return scheduledChange;
    }
    const tier = await this.getPricingTier(scheduledChange.planType);
    if (!tier) {
      throw new Error(`Pricing tier '${scheduledChange.planType}' not found`);
    }
    await this.updatePricingTier(scheduledChange.planType, {
      amount: scheduledChange.newAmount,
      updatedBy: scheduledChange.scheduledBy
    });
    const [updatedChange] = await db2.update(scheduledPriceChanges3).set({ isApplied: true, appliedAt: /* @__PURE__ */ new Date() }).where(eq2(scheduledPriceChanges3.id, id)).returning();
    return updatedChange;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
init_schema();
import { randomUUID as randomUUID2 } from "crypto";
import bcrypt from "crypto";
import { addDays, addHours } from "date-fns";
import { z as z2 } from "zod";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
var PgStore = connectPgSimple(session);
async function registerRoutes(app2) {
  app2.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "session",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60
        // Prune expired sessions every hour (in seconds)
      }),
      secret: process.env.SESSION_SECRET || "coworkflow-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1e3,
        // 24 hours
        httpOnly: true
      }
    })
  );
  app2.post("/api/auth/register", async (req, res) => {
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
      const colors = ["red", "blue", "green", "purple", "yellow", "teal", "indigo", "orange", "emerald", "violet"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const hashedPassword = await bcrypt.scrypt(validated.password, "salt", 64);
      const passwordHash = hashedPassword.toString("hex");
      const user = await storage.createUser({
        ...validated,
        password: passwordHash,
        profileImageColor: randomColor
      });
      await storage.createActivityLog({
        userId: user.id,
        activityType: "registration",
        details: "New user registration"
      });
      const { password, ...userWithoutPassword } = user;
      req.session.userId = user.id;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error registering user" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validated.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      const hashedPassword = await bcrypt.scrypt(validated.password, "salt", 64);
      const passwordHash = hashedPassword.toString("hex");
      if (user.password !== passwordHash) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      await storage.createActivityLog({
        userId: user.id,
        activityType: "check_in",
        details: "User logged in"
      });
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error logging in" });
    }
  });
  app2.post("/api/auth/pin-login", async (req, res) => {
    try {
      const validated = pinLoginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validated.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or PIN" });
      }
      if (user.pin !== validated.pin) {
        return res.status(401).json({ message: "Invalid username or PIN" });
      }
      await storage.createActivityLog({
        userId: user.id,
        activityType: "check_in",
        details: "User logged in with PIN"
      });
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error logging in with PIN" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
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
  app2.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  });
  app2.post("/api/qrcode/generate", async (req, res) => {
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
  app2.post("/api/qrcode/verify", async (req, res) => {
    try {
      const { qrCode } = req.body;
      if (!qrCode) {
        return res.status(400).json({ message: "QR code is required" });
      }
      const user = await storage.verifyQRCode(qrCode);
      if (!user) {
        return res.status(404).json({ message: "Invalid or expired QR code" });
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Error verifying QR code" });
    }
  });
  app2.post("/api/qrcode/guest", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const validated = insertGuestQrCodeSchema.parse({
        ...req.body,
        createdBy: req.session.userId,
        qrCode: `GUEST-${randomUUID2()}`
      });
      let expiryDate;
      switch (validated.planType) {
        case "hourly":
          expiryDate = addHours(/* @__PURE__ */ new Date(), 1);
          break;
        case "daily":
          expiryDate = addDays(/* @__PURE__ */ new Date(), 1);
          break;
        case "weekly":
          expiryDate = addDays(/* @__PURE__ */ new Date(), 7);
          break;
        default:
          expiryDate = addHours(/* @__PURE__ */ new Date(), 24);
      }
      const guestQrCode = await storage.createGuestQRCode({
        ...validated,
        expiryDate
      });
      res.status(201).json(guestQrCode);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error creating guest QR code" });
    }
  });
  app2.post("/api/checkin", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const activeCheckIn = await storage.getUserActiveCheckIn(req.session.userId);
      if (activeCheckIn) {
        return res.status(400).json({ message: "User already checked in" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const planType = user.planType || "hourly";
      const validated = insertCheckInRecordSchema.parse({
        userId: req.session.userId,
        planType
      });
      const checkInRecord = await storage.createCheckInRecord(validated);
      await storage.createActivityLog({
        userId: req.session.userId,
        activityType: "check_in",
        details: `Checked in with ${planType} plan`
      });
      res.status(201).json(checkInRecord);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error checking in" });
    }
  });
  app2.post("/api/checkout", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const activeCheckIn = await storage.getUserActiveCheckIn(req.session.userId);
      if (!activeCheckIn) {
        return res.status(400).json({ message: "No active check-in found" });
      }
      const checkOutRecord = await storage.checkOutUser(activeCheckIn.id);
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
  app2.get("/api/checkins/active", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role !== "manager" && user.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const activeCheckIns = await storage.getActiveCheckIns();
      const enrichedCheckIns = await Promise.all(
        activeCheckIns.map(async (checkIn) => {
          const user2 = await storage.getUser(checkIn.userId);
          return {
            ...checkIn,
            user: user2 ? {
              id: user2.id,
              name: user2.name,
              email: user2.email,
              username: user2.username,
              profileImageColor: user2.profileImageColor
            } : null
          };
        })
      );
      res.status(200).json(enrichedCheckIns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active check-ins" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const users2 = await storage.getAllUsers();
      const usersWithoutPasswords = users2.map(({ password, ...user }) => user);
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      if (userId !== req.session.userId && currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  app2.put("/api/users/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      if (userId !== req.session.userId && currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (req.body.role && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized to change roles" });
      }
      const updatedUser = await storage.updateUser(userId, req.body);
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });
  app2.get("/api/pricing", async (req, res) => {
    try {
      const pricingTiers3 = await storage.getAllPricingTiers();
      res.status(200).json(pricingTiers3);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pricing tiers" });
    }
  });
  app2.put("/api/pricing/:planType", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { planType } = req.params;
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
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
  app2.post("/api/pricing/scheduled", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error scheduling price change" });
    }
  });
  app2.get("/api/pricing/scheduled", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const scheduledChanges = await storage.getScheduledPriceChanges();
      res.status(200).json(scheduledChanges);
    } catch (error) {
      res.status(500).json({ message: "Error fetching scheduled price changes" });
    }
  });
  app2.post("/api/pricing/scheduled/:id/apply", async (req, res) => {
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
      if (currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const appliedChange = await storage.applyScheduledPriceChange(id);
      res.status(200).json(appliedChange);
    } catch (error) {
      res.status(500).json({ message: "Error applying scheduled price change" });
    }
  });
  app2.post("/api/payments", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const validated = insertPaymentRecordSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      const paymentRecord = await storage.createPaymentRecord(validated);
      await storage.createActivityLog({
        userId: req.session.userId,
        activityType: "payment",
        details: `Made a payment of ${paymentRecord.amount} for ${paymentRecord.planType} plan via ${paymentRecord.paymentMethod}`
      });
      res.status(201).json(paymentRecord);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Error recording payment" });
    }
  });
  app2.get("/api/payments/:paymentId/receipt", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const paymentId = parseInt(req.params.paymentId);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      const paymentRecords3 = await storage.getUserPaymentRecords(req.session.userId);
      const payment = paymentRecords3.find((p) => p.id === paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment record not found" });
      }
      const user = await storage.getUser(payment.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const receiptData = {
        receiptNumber: `REC-${payment.id.toString().padStart(6, "0")}`,
        customerName: user.name,
        customerEmail: user.email,
        paymentDate: payment.timestamp,
        paymentMethod: payment.paymentMethod,
        planType: payment.planType,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId || "N/A",
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
  app2.get("/api/payments/user/:userId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      if (userId !== req.session.userId && currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const paymentRecords3 = await storage.getUserPaymentRecords(userId);
      res.status(200).json(paymentRecords3);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment records" });
    }
  });
  app2.get("/api/activity/recent", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const activityLogs3 = await storage.getRecentActivityLogs(limit);
      const enrichedLogs = await Promise.all(
        activityLogs3.map(async (log2) => {
          const user = await storage.getUser(log2.userId);
          return {
            ...log2,
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
  app2.get("/api/activity/user/:userId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Current user not found" });
      }
      if (userId !== req.session.userId && currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const activityLogs3 = await storage.getUserActivityLogs(userId);
      res.status(200).json(activityLogs3);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activity logs" });
    }
  });
  app2.get("/api/stats/today", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (currentUser.role !== "manager" && currentUser.role !== "super_admin") {
        return res.status(403).json({ message: "Not authorized" });
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const allLogs = Array.from(await storage.getRecentActivityLogs(1e3)).filter((log2) => new Date(log2.timestamp) >= today);
      const checkins = allLogs.filter((log2) => log2.activityType === "check_in").length;
      const activeUsers = (await storage.getActiveCheckIns()).length;
      const newUsers = allLogs.filter((log2) => log2.activityType === "registration").length;
      const todayPayments = Array.from(await storage.getPaymentRecords()).filter((payment) => new Date(payment.timestamp) >= today && payment.status === "completed");
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import "dotenv/config";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import "dotenv/config";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
