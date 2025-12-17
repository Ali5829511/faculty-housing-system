import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Vehicles table - stores all registered vehicles in the system
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  plateNumber: varchar("plateNumber", { length: 20 }).notNull().unique(),
  ownerName: varchar("ownerName", { length: 255 }).notNull(),
  ownerType: mysqlEnum("ownerType", ["student", "faculty", "staff", "visitor"]).notNull(),
  nationalId: varchar("nationalId", { length: 20 }),
  mobile: varchar("mobile", { length: 20 }),
  email: varchar("email", { length: 320 }),
  make: varchar("make", { length: 100 }),
  model: varchar("model", { length: 100 }),
  year: int("year"),
  color: varchar("color", { length: 50 }),
  vehicleType: mysqlEnum("vehicleType", ["sedan", "suv", "truck", "van", "motorcycle", "other"]).default("sedan"),
  stickerNumber: varchar("stickerNumber", { length: 50 }),
  status: mysqlEnum("status", ["active", "suspended", "expired"]).default("active").notNull(),
  violationsCount: int("violationsCount").default(0).notNull(),
  entriesCount: int("entriesCount").default(0).notNull(),
  visitCount: int("visitCount").default(0).notNull(),
  // File storage references
  vehicleImageUrl: text("vehicleImageUrl"),
  vehicleImageKey: varchar("vehicleImageKey", { length: 500 }),
  licenseImageUrl: text("licenseImageUrl"),
  licenseImageKey: varchar("licenseImageKey", { length: 500 }),
  registrationImageUrl: text("registrationImageUrl"),
  registrationImageKey: varchar("registrationImageKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Violations table - stores all traffic violations
 */
export const violations = mysqlTable("violations", {
  id: int("id").autoincrement().primaryKey(),
  violationNumber: varchar("violationNumber", { length: 50 }).notNull().unique(),
  vehicleId: int("vehicleId").notNull(),
  plateNumber: varchar("plateNumber", { length: 20 }).notNull(),
  violationType: varchar("violationType", { length: 255 }).notNull(),
  points: int("points").default(0).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "paid", "appealed", "cancelled", "resolved"]).default("pending").notNull(),
  isAppealed: int("isAppealed").default(0).notNull(),
  appealedAt: timestamp("appealedAt"),
  appealReason: text("appealReason"),
  // File storage references
  evidenceImageUrl: text("evidenceImageUrl"),
  evidenceImageKey: varchar("evidenceImageKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Violation = typeof violations.$inferSelect;
export type InsertViolation = typeof violations.$inferInsert;

/**
 * Vehicle entries table - tracks vehicle entry/exit logs
 */
export const vehicleEntries = mysqlTable("vehicleEntries", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  plateNumber: varchar("plateNumber", { length: 20 }).notNull(),
  entryType: mysqlEnum("entryType", ["entry", "exit"]).notNull(),
  gateLocation: varchar("gateLocation", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  // File storage references
  captureImageUrl: text("captureImageUrl"),
  captureImageKey: varchar("captureImageKey", { length: 500 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
});

export type VehicleEntry = typeof vehicleEntries.$inferSelect;
export type InsertVehicleEntry = typeof vehicleEntries.$inferInsert;

/**
 * Security alerts table - tracks security incidents
 */
export const securityAlerts = mysqlTable("securityAlerts", {
  id: int("id").autoincrement().primaryKey(),
  alertType: mysqlEnum("alertType", ["unauthorized_vehicle", "suspended_vehicle", "expired_sticker", "security_threat", "other"]).notNull(),
  vehicleId: int("vehicleId"),
  plateNumber: varchar("plateNumber", { length: 20 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  status: mysqlEnum("status", ["open", "investigating", "resolved", "dismissed"]).default("open").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type InsertSecurityAlert = typeof securityAlerts.$inferInsert;

/**
 * Cameras table - stores camera information for ParkPow integration
 */
export const cameras = mysqlTable("cameras", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["entrance", "exit", "both"]).notNull(),
  location: varchar("location", { length: 255 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = typeof cameras.$inferInsert;

/**
 * Visits table - stores vehicle visit logs from ParkPow
 */
export const visits = mysqlTable("visits", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId"),
  plateNumber: varchar("plateNumber", { length: 20 }).notNull(),
  cameraId: int("cameraId"),
  cameraCode: varchar("cameraCode", { length: 50 }),
  visitType: mysqlEnum("visitType", ["entry", "exit", "pass_through"]).notNull(),
  confidence: int("confidence").default(0),
  region: varchar("region", { length: 50 }),
  // File storage references
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 500 }),
  plateImageUrl: text("plateImageUrl"),
  plateImageKey: varchar("plateImageKey", { length: 500 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  parkpowVisitId: varchar("parkpowVisitId", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Visit = typeof visits.$inferSelect;
export type InsertVisit = typeof visits.$inferInsert;

/**
 * Tags table - stores vehicle tags for categorization
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameAr: varchar("nameAr", { length: 100 }),
  color: varchar("color", { length: 50 }).default("#045D84"),
  description: text("description"),
  category: mysqlEnum("category", ["authorization", "status", "priority", "custom"]).default("custom").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Vehicle Tags junction table - many-to-many relationship between vehicles and tags
 */
export const vehicleTags = mysqlTable("vehicleTags", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicleId").notNull(),
  tagId: int("tagId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedBy: int("assignedBy"),
});

export type VehicleTag = typeof vehicleTags.$inferSelect;
export type InsertVehicleTag = typeof vehicleTags.$inferInsert;
/**
 * Settings table - stores system settings and API keys
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  category: mysqlEnum("category", ["api", "system", "notification", "security"]).default("system").notNull(),
  description: text("description"),
  isEncrypted: int("isEncrypted").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
