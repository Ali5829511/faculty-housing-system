import { eq, desc, and, like, or, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  vehicles, 
  violations, 
  vehicleEntries, 
  securityAlerts,
  InsertVehicle,
  InsertViolation,
  InsertVehicleEntry,
  InsertSecurityAlert
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Vehicle Functions =====
export async function getAllVehicles(searchTerm?: string) {
  const db = await getDb();
  if (!db) return [];

  if (searchTerm) {
    return await db
      .select()
      .from(vehicles)
      .where(
        or(
          like(vehicles.plateNumber, `%${searchTerm}%`),
          like(vehicles.ownerName, `%${searchTerm}%`),
          like(vehicles.nationalId, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(vehicles.createdAt));
  }

  return await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVehicleByPlate(plateNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(vehicles).where(eq(vehicles.plateNumber, plateNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVehicle(vehicle: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicles).values(vehicle);
  return result;
}

export async function updateVehicle(id: number, updates: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(vehicles).set(updates).where(eq(vehicles.id, id));
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(vehicles).where(eq(vehicles.id, id));
}

export async function getVehicleStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalResult] = await db.select({ count: count() }).from(vehicles);
  const [activeResult] = await db.select({ count: count() }).from(vehicles).where(eq(vehicles.status, 'active'));
  const [suspendedResult] = await db.select({ count: count() }).from(vehicles).where(eq(vehicles.status, 'suspended'));
  const [expiredResult] = await db.select({ count: count() }).from(vehicles).where(eq(vehicles.status, 'expired'));

  return {
    total: totalResult?.count || 0,
    active: activeResult?.count || 0,
    suspended: suspendedResult?.count || 0,
    expired: expiredResult?.count || 0,
  };
}

// ===== Violation Functions =====
export async function getAllViolations(searchTerm?: string) {
  const db = await getDb();
  if (!db) return [];

  if (searchTerm) {
    return await db
      .select()
      .from(violations)
      .where(
        or(
          like(violations.violationNumber, `%${searchTerm}%`),
          like(violations.plateNumber, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(violations.createdAt));
  }

  return await db.select().from(violations).orderBy(desc(violations.createdAt));
}

export async function getViolationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(violations).where(eq(violations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getViolationsByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(violations).where(eq(violations.vehicleId, vehicleId)).orderBy(desc(violations.createdAt));
}

export async function createViolation(violation: InsertViolation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const timestamp = Date.now();
  const violationNumber = `V-${new Date().getFullYear()}-${String(timestamp).slice(-6)}`;
  
  const result = await db.insert(violations).values({
    ...violation,
    violationNumber,
  });

  if (violation.vehicleId) {
    await db.execute(sql`
      UPDATE vehicles 
      SET violationsCount = violationsCount + 1 
      WHERE id = ${violation.vehicleId}
    `);
  }

  return result;
}

export async function updateViolation(id: number, updates: Partial<InsertViolation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(violations).set(updates).where(eq(violations.id, id));
}

export async function deleteViolation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(violations).where(eq(violations.id, id));
}

export async function getViolationStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalResult] = await db.select({ count: count() }).from(violations);
  const [pendingResult] = await db.select({ count: count() }).from(violations).where(eq(violations.status, 'pending'));
  const [paidResult] = await db.select({ count: count() }).from(violations).where(eq(violations.status, 'paid'));
  const [appealedResult] = await db.select({ count: count() }).from(violations).where(eq(violations.status, 'appealed'));

  return {
    total: totalResult?.count || 0,
    pending: pendingResult?.count || 0,
    paid: paidResult?.count || 0,
    appealed: appealedResult?.count || 0,
  };
}

// ===== Vehicle Entry Functions =====
export async function createVehicleEntry(entry: InsertVehicleEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicleEntries).values(entry);

  if (entry.vehicleId && entry.entryType === 'entry') {
    await db.execute(sql`
      UPDATE vehicles 
      SET entriesCount = entriesCount + 1 
      WHERE id = ${entry.vehicleId}
    `);
  }

  return result;
}

export async function getRecentEntries(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(vehicleEntries).orderBy(desc(vehicleEntries.timestamp)).limit(limit);
}

// ===== Security Alert Functions =====
export async function createSecurityAlert(alert: InsertSecurityAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(securityAlerts).values(alert);
}

export async function getActiveSecurityAlerts() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(securityAlerts)
    .where(
      or(
        eq(securityAlerts.status, 'open'),
        eq(securityAlerts.status, 'investigating')
      )
    )
    .orderBy(desc(securityAlerts.createdAt));
}

// ===== Camera Functions =====
export async function createCamera(camera: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { cameras } = await import("../drizzle/schema");
  return await db.insert(cameras).values(camera);
}

export async function getAllCameras() {
  const db = await getDb();
  if (!db) return [];

  const { cameras } = await import("../drizzle/schema");
  return await db.select().from(cameras).orderBy(desc(cameras.createdAt));
}

export async function getCameraByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const { cameras } = await import("../drizzle/schema");
  const result = await db.select().from(cameras).where(eq(cameras.code, code)).limit(1);
  return result[0];
}

export async function updateCamera(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { cameras } = await import("../drizzle/schema");
  return await db.update(cameras).set(updates).where(eq(cameras.id, id));
}

export async function deleteCamera(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { cameras } = await import("../drizzle/schema");
  return await db.delete(cameras).where(eq(cameras.id, id));
}

// ===== Visit Functions =====
export async function createVisit(visit: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { visits } = await import("../drizzle/schema");
  return await db.insert(visits).values(visit);
}

export async function getAllVisits(searchTerm?: string) {
  const db = await getDb();
  if (!db) return [];

  const { visits } = await import("../drizzle/schema");
  
  if (searchTerm) {
    return await db
      .select()
      .from(visits)
      .where(like(visits.plateNumber, `%${searchTerm}%`))
      .orderBy(desc(visits.timestamp));
  }

  return await db.select().from(visits).orderBy(desc(visits.timestamp));
}

export async function getVisitsByVehicle(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];

  const { visits } = await import("../drizzle/schema");
  return await db
    .select()
    .from(visits)
    .where(eq(visits.vehicleId, vehicleId))
    .orderBy(desc(visits.timestamp));
}

export async function getVisitsByCamera(cameraId: number) {
  const db = await getDb();
  if (!db) return [];

  const { visits } = await import("../drizzle/schema");
  return await db
    .select()
    .from(visits)
    .where(eq(visits.cameraId, cameraId))
    .orderBy(desc(visits.timestamp));
}

// ===== Tag Functions =====
export async function createTag(tag: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tags } = await import("../drizzle/schema");
  return await db.insert(tags).values(tag);
}

export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];

  const { tags } = await import("../drizzle/schema");
  return await db.select().from(tags).where(eq(tags.isActive, 1)).orderBy(desc(tags.createdAt));
}

export async function getTagById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const { tags } = await import("../drizzle/schema");
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result[0];
}

export async function updateTag(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tags } = await import("../drizzle/schema");
  return await db.update(tags).set(updates).where(eq(tags.id, id));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tags } = await import("../drizzle/schema");
  return await db.update(tags).set({ isActive: 0 }).where(eq(tags.id, id));
}

// ===== Vehicle Tag Functions =====
export async function assignTagToVehicle(vehicleId: number, tagId: number, assignedBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { vehicleTags } = await import("../drizzle/schema");
  return await db.insert(vehicleTags).values({
    vehicleId,
    tagId,
    assignedBy,
  });
}

export async function removeTagFromVehicle(vehicleId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { vehicleTags } = await import("../drizzle/schema");
  return await db
    .delete(vehicleTags)
    .where(
      and(
        eq(vehicleTags.vehicleId, vehicleId),
        eq(vehicleTags.tagId, tagId)
      )
    );
}

export async function getVehicleTags(vehicleId: number) {
  const db = await getDb();
  if (!db) return [];

  const { vehicleTags, tags } = await import("../drizzle/schema");
  return await db
    .select({
      id: tags.id,
      name: tags.name,
      nameAr: tags.nameAr,
      color: tags.color,
      category: tags.category,
    })
    .from(vehicleTags)
    .innerJoin(tags, eq(vehicleTags.tagId, tags.id))
    .where(eq(vehicleTags.vehicleId, vehicleId));
}

// ===== Settings Functions =====
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const { settings } = await import("../drizzle/schema");
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0];
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];

  const { settings } = await import("../drizzle/schema");
  return await db.select().from(settings).orderBy(desc(settings.updatedAt));
}

export async function getSettingsByCategory(category: "api" | "system" | "notification" | "security") {
  const db = await getDb();
  if (!db) return [];

  const { settings } = await import("../drizzle/schema");
  return await db.select().from(settings).where(eq(settings.category, category));
}

export async function upsertSetting(
  key: string, 
  value: string, 
  category: "api" | "system" | "notification" | "security" = "system", 
  description?: string, 
  updatedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { settings } = await import("../drizzle/schema");
  
  // Check if setting exists
  const existing = await getSetting(key);
  
  if (existing) {
    // Update existing setting
    return await db.update(settings).set({
      value,
      category,
      description: description || existing.description,
      updatedBy,
    }).where(eq(settings.key, key));
  } else {
    // Insert new setting
    return await db.insert(settings).values({
      key,
      value,
      category,
      description,
      updatedBy,
    });
  }
}

export async function deleteSetting(key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { settings } = await import("../drizzle/schema");
  return await db.delete(settings).where(eq(settings.key, key));
}
