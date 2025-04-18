import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'manager', 'super_admin']);
export const planTypeEnum = pgEnum('plan_type', ['hourly', 'daily', 'weekly', 'monthly']);
export const activityTypeEnum = pgEnum('activity_type', ['check_in', 'check_out', 'payment', 'registration']);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default('user'),
  pin: text("pin").notNull(),
  currentMonthlyQrCode: text("current_monthly_qr_code"),
  qrCodeExpiryDate: timestamp("qr_code_expiry_date"),
  profileImageColor: text("profile_image_color").notNull(),
  planType: planTypeEnum("plan_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pricing
export const pricingTiers = pgTable("pricing_tiers", {
  id: serial("id").primaryKey(),
  planType: planTypeEnum("plan_type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Check-in/Check-out Records
export const checkInRecords = pgTable("check_in_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  checkInTime: timestamp("check_in_time").notNull().defaultNow(),
  checkOutTime: timestamp("check_out_time"),
  duration: integer("duration"),
  planType: planTypeEnum("plan_type").notNull(),
});

// Guest QR Codes
export const guestQrCodes = pgTable("guest_qr_codes", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  guestName: text("guest_name").notNull(),
  qrCode: text("qr_code").notNull(),
  planType: planTypeEnum("plan_type").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activity Log
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: activityTypeEnum("activity_type").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Payment Records
export const paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  planType: planTypeEnum("plan_type").notNull(),
  paymentMethod: text("payment_method").notNull(),
  transactionId: text("transaction_id"),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Price Change History
export const priceChangeHistory = pgTable("price_change_history", {
  id: serial("id").primaryKey(),
  planType: planTypeEnum("plan_type").notNull(),
  oldAmount: integer("old_amount").notNull(),
  newAmount: integer("new_amount").notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  changeReason: text("change_reason"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Scheduled Price Changes
export const scheduledPriceChanges = pgTable("scheduled_price_changes", {
  id: serial("id").primaryKey(),
  planType: planTypeEnum("plan_type").notNull(),
  newAmount: integer("new_amount").notNull(),
  scheduledBy: integer("scheduled_by").notNull().references(() => users.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  isApplied: boolean("is_applied").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas for insertion
export const insertUserSchema = createInsertSchema(users).omit({
  id: true, 
  createdAt: true,
  qrCodeExpiryDate: true,
  currentMonthlyQrCode: true
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers).omit({
  id: true, 
  lastUpdated: true
});

export const insertCheckInRecordSchema = createInsertSchema(checkInRecords).omit({
  id: true, 
  checkOutTime: true,
  duration: true
});

export const insertGuestQrCodeSchema = createInsertSchema(guestQrCodes).omit({
  id: true, 
  createdAt: true
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true, 
  timestamp: true
});

export const insertPaymentRecordSchema = createInsertSchema(paymentRecords).omit({
  id: true, 
  timestamp: true
});

export const insertPriceChangeHistorySchema = createInsertSchema(priceChangeHistory).omit({
  id: true, 
  timestamp: true
});

export const insertScheduledPriceChangeSchema = createInsertSchema(scheduledPriceChanges).omit({
  id: true, 
  createdAt: true,
  isApplied: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;

export type CheckInRecord = typeof checkInRecords.$inferSelect;
export type InsertCheckInRecord = z.infer<typeof insertCheckInRecordSchema>;

export type GuestQrCode = typeof guestQrCodes.$inferSelect;
export type InsertGuestQrCode = z.infer<typeof insertGuestQrCodeSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;

export type PriceChangeHistory = typeof priceChangeHistory.$inferSelect;
export type InsertPriceChangeHistory = z.infer<typeof insertPriceChangeHistorySchema>;

export type ScheduledPriceChange = typeof scheduledPriceChanges.$inferSelect;
export type InsertScheduledPriceChange = z.infer<typeof insertScheduledPriceChangeSchema>;

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const pinLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  pin: z.string().length(4, "PIN must be 4 digits"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type PinLoginData = z.infer<typeof pinLoginSchema>;
