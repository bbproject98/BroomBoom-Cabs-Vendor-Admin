import { Pool } from "pg";
import fs from "fs";
import path from "path";
import {
  FranchiseLead,
  PackageTier,
  VendorLead,
  LeadStatus,
  VendorSubscription,
  PlanChangeTicket,
  VendorUser,
  AdminActivityLog,
  ActivityActionType,
  ManualPaymentPayload,
  ProfileActivityGroup,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_STORE_FILE = path.join(DATA_DIR, "admin-unified-store.json");

interface LocalStoreState {
  franchiseLeads: FranchiseLead[];
  vendorLeads: VendorLead[];
  vendorSubscriptions?: VendorSubscription[];
  tickets?: PlanChangeTicket[];
  vendorUsers?: VendorUser[];
  auditLogs: (AdminActivityLog | { id: string; action?: string; details?: string; timestamp?: string; [key: string]: any })[];
}

let primaryPool: Pool | null = null;
let fallbackPool: Pool | null = null;
let activePool: Pool | null = null;
let tablesInitialized = false;

function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 4000,
  });
}

export async function getDbPool(): Promise<Pool | null> {
  if (activePool) return activePool;

  const url1 =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";
  const url2 =
    process.env.DATABASE_URL_FALLBACK ||
    "postgresql://postgres:postgress@127.0.0.1:5432/postgres?schema=public";

  try {
    if (!primaryPool) primaryPool = createPool(url1);
    const client = await primaryPool.connect();
    await client.query("SELECT 1;");
    client.release();
    activePool = primaryPool;
    return activePool;
  } catch (err: any) {
    console.warn(
      "[ADMIN DB] Primary PostgreSQL connection failed, trying fallback connection string:",
      err.message
    );
  }

  try {
    if (!fallbackPool) fallbackPool = createPool(url2);
    const client = await fallbackPool.connect();
    await client.query("SELECT 1;");
    client.release();
    activePool = fallbackPool;
    return activePool;
  } catch (err2: any) {
    console.warn(
      "[ADMIN DB] Fallback PostgreSQL connection also failed:",
      err2.message
    );
  }

  return null;
}

export async function initTables(): Promise<boolean> {
  if (tablesInitialized) return true;
  try {
    const pool = await getDbPool();
    if (!pool) return false;

    const ddl = `
      CREATE TABLE IF NOT EXISTS franchise_leads (
        id VARCHAR(64) PRIMARY KEY,
        application_id VARCHAR(64) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        alternate_phone VARCHAR(50),
        email VARCHAR(255),
        state VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        pincode VARCHAR(20),
        proposed_address TEXT,
        space_status VARCHAR(100),
        carpet_area VARCHAR(100),
        preferred_package VARCHAR(50) NOT NULL,
        package_name VARCHAR(150),
        investment_budget VARCHAR(100),
        finance_required VARCHAR(100) DEFAULT 'Self-Funded',
        loan_assistance VARCHAR(50) DEFAULT 'No',
        current_profession VARCHAR(150),
        has_experience VARCHAR(150),
        message TEXT,
        source VARCHAR(50) DEFAULT 'apply_page',
        status VARCHAR(50) DEFAULT 'new',
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vendor_leads (
        id VARCHAR(64) PRIMARY KEY,
        application_id VARCHAR(64) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        alternate_phone VARCHAR(50),
        email VARCHAR(255),
        state VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        pincode VARCHAR(20),
        proposed_address TEXT,
        space_status VARCHAR(100),
        carpet_area VARCHAR(100),
        preferred_package VARCHAR(50) NOT NULL,
        package_name VARCHAR(150),
        investment_budget VARCHAR(100),
        finance_required VARCHAR(100) DEFAULT 'Self-Funded / Ready Capital',
        loan_assistance VARCHAR(50) DEFAULT 'No (Self-Funded)',
        current_profession VARCHAR(150),
        has_experience VARCHAR(150),
        message TEXT,
        source VARCHAR(50) DEFAULT 'vendor_portal',
        status VARCHAR(50) DEFAULT 'new',
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vendor_subscriptions (
        id VARCHAR(64) PRIMARY KEY,
        subscription_id VARCHAR(64) UNIQUE NOT NULL,
        application_id VARCHAR(64) NOT NULL,
        vendor_name VARCHAR(255) NOT NULL,
        vendor_mobile VARCHAR(50) NOT NULL,
        vendor_email VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        plan_tier VARCHAR(50) NOT NULL,
        plan_name VARCHAR(150) NOT NULL,
        billing_cycle VARCHAR(150) DEFAULT 'One-Time Onboarding & Annual Licensing',
        status VARCHAR(50) DEFAULT 'active',
        start_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMPTZ,
        territory_scope VARCHAR(150),
        has_exclusivity BOOLEAN DEFAULT true,
        order_id VARCHAR(100) UNIQUE NOT NULL,
        cf_order_id VARCHAR(100),
        cf_payment_id VARCHAR(100),
        payment_session_id VARCHAR(255),
        payment_method VARCHAR(100),
        payment_status VARCHAR(50) DEFAULT 'pending',
        base_amount DOUBLE PRECISION NOT NULL,
        gateway_fee DOUBLE PRECISION DEFAULT 0,
        gst_amount DOUBLE PRECISION DEFAULT 0,
        total_amount DOUBLE PRECISION NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        paid_at TIMESTAMPTZ,
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plan_change_tickets (
        id VARCHAR(64) PRIMARY KEY,
        ticket_id VARCHAR(64) UNIQUE NOT NULL,
        application_id VARCHAR(64) NOT NULL,
        vendor_name VARCHAR(255) NOT NULL,
        vendor_mobile VARCHAR(50) NOT NULL,
        vendor_email VARCHAR(255),
        current_plan VARCHAR(50) NOT NULL,
        requested_plan VARCHAR(50) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        admin_notes TEXT,
        new_user_id VARCHAR(100),
        new_password VARCHAR(100),
        approved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vendor_users (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        application_id VARCHAR(64) NOT NULL,
        vendor_name VARCHAR(255) NOT NULL,
        vendor_mobile VARCHAR(50) NOT NULL,
        vendor_email VARCHAR(255),
        current_plan VARCHAR(50) DEFAULT 'gold',
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_franchise_created ON franchise_leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_vendor_created ON vendor_leads(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sub_created ON vendor_subscriptions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sub_status ON vendor_subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_sub_app_id ON vendor_subscriptions(application_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_created ON plan_change_tickets(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ticket_status ON plan_change_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_ticket_app_id ON plan_change_tickets(application_id);
      CREATE INDEX IF NOT EXISTS idx_vuser_id ON vendor_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_vuser_app ON vendor_users(application_id);

      CREATE TABLE IF NOT EXISTS admin_activity_logs (
        id VARCHAR(64) PRIMARY KEY,
        admin_name VARCHAR(100) DEFAULT 'Super Admin',
        action_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        person_name VARCHAR(255),
        person_phone VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE admin_activity_logs ADD COLUMN IF NOT EXISTS person_name VARCHAR(255);
      ALTER TABLE admin_activity_logs ADD COLUMN IF NOT EXISTS person_phone VARCHAR(50);

      CREATE INDEX IF NOT EXISTS idx_activity_created ON admin_activity_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_action ON admin_activity_logs(action_type);
      CREATE INDEX IF NOT EXISTS idx_activity_entity ON admin_activity_logs(entity_type);
      CREATE INDEX IF NOT EXISTS idx_activity_phone ON admin_activity_logs(person_phone);
    `;

    await pool.query(ddl);
    tablesInitialized = true;
    return true;
  } catch (e: any) {
    console.error("[ADMIN DB] Error initializing tables:", e.message);
    return false;
  }
}

// --- Local File Store Fallback & Aggregator ---
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readLocalStore(): LocalStoreState {
  ensureDataDir();
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    const init: LocalStoreState = {
      franchiseLeads: [],
      vendorLeads: [],
      vendorSubscriptions: [],
      tickets: [],
      vendorUsers: [],
      auditLogs: [],
    };
    writeLocalStore(init);
    return init;
  }
  try {
    const raw = fs.readFileSync(LOCAL_STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.franchiseLeads) parsed.franchiseLeads = [];
    if (!parsed.vendorSubscriptions) parsed.vendorSubscriptions = [];
    if (!parsed.tickets) parsed.tickets = [];
    if (!parsed.vendorUsers) parsed.vendorUsers = [];
    return parsed;
  } catch {
    return {
      franchiseLeads: [],
      vendorLeads: [],
      vendorSubscriptions: [],
      tickets: [],
      vendorUsers: [],
      auditLogs: [],
    };
  }
}

function writeLocalStore(state: LocalStoreState) {
  ensureDataDir();
  const tmp = `${LOCAL_STORE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
  fs.renameSync(tmp, LOCAL_STORE_FILE);
}

export async function logAdminActivity(data: {
  adminName?: string;
  actionType: ActivityActionType | string;
  entityType: "vendor" | "franchise" | "subscription" | "ticket" | "credential" | string;
  entityId: string;
  personName?: string;
  personPhone?: string;
  title: string;
  details?: string;
}): Promise<AdminActivityLog> {
  const now = new Date().toISOString();
  let personName = data.personName;
  let personPhone = data.personPhone;

  // Auto-resolve Name and Phone Number from leads if not explicitly provided
  if (!personName || !personPhone) {
    try {
      const local = readLocalStore();
      const vLead = (local.vendorLeads || []).find(
        (l) =>
          (l.applicationId && l.applicationId.toLowerCase() === data.entityId.toLowerCase()) ||
          l.id === data.entityId ||
          l.mobile === data.entityId
      );
      if (vLead) {
        personName = personName || vLead.fullName;
        personPhone = personPhone || vLead.mobile;
      } else {
        const fLead = (local.franchiseLeads || []).find(
          (l) =>
            (l.applicationId && l.applicationId.toLowerCase() === data.entityId.toLowerCase()) ||
            l.id === data.entityId ||
            l.mobile === data.entityId
        );
        if (fLead) {
          personName = personName || fLead.fullName;
          personPhone = personPhone || fLead.mobile;
        }
      }
    } catch {}
  }

  const logEntry: AdminActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    adminName: data.adminName || "Super Admin (HQ)",
    actionType: data.actionType,
    entityType: data.entityType,
    entityId: data.entityId,
    personName: personName || undefined,
    personPhone: personPhone || undefined,
    title: data.title,
    details: data.details,
    createdAt: now,
  };

  const pool = await getDbPool();
  if (pool) {
    try {
      await initTables();
      await pool.query(
        `INSERT INTO admin_activity_logs (id, admin_name, action_type, entity_type, entity_id, person_name, person_phone, title, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          logEntry.id,
          logEntry.adminName,
          logEntry.actionType,
          logEntry.entityType,
          logEntry.entityId,
          logEntry.personName || null,
          logEntry.personPhone || null,
          logEntry.title,
          logEntry.details || null,
        ]
      );
    } catch (e: any) {
      console.warn("[ADMIN DB] Error inserting activity log:", e.message);
    }
  }

  try {
    const local = readLocalStore();
    if (!local.auditLogs) local.auditLogs = [];
    local.auditLogs.unshift(logEntry);
    if (local.auditLogs.length > 500) {
      local.auditLogs = local.auditLogs.slice(0, 500);
    }
    writeLocalStore(local);
  } catch (err: any) {
    console.warn("[ADMIN DB] Error saving local activity log:", err.message);
  }

  return logEntry;
}

export async function getActivityLogs(filters?: {
  actionType?: string;
  entityType?: string;
  entityId?: string;
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AdminActivityLog[]; total: number; profileGroups: ProfileActivityGroup[] }> {
  const pool = await getDbPool();
  let logs: AdminActivityLog[] = [];
  let total = 0;

  if (pool) {
    try {
      await initTables();
      let sql = "SELECT * FROM admin_activity_logs WHERE 1=1";
      let countSql = "SELECT COUNT(*) FROM admin_activity_logs WHERE 1=1";
      const values: any[] = [];
      let idx = 1;

      if (filters?.entityId && filters.entityId !== "all") {
        sql += ` AND (LOWER(entity_id) = LOWER($${idx}) OR person_phone = $${idx})`;
        countSql += ` AND (LOWER(entity_id) = LOWER($${idx}) OR person_phone = $${idx})`;
        values.push(filters.entityId);
        idx++;
      }

      if (filters?.actionType && filters.actionType !== "all") {
        sql += ` AND action_type = $${idx}`;
        countSql += ` AND action_type = $${idx}`;
        values.push(filters.actionType);
        idx++;
      }

      if (filters?.entityType && filters.entityType !== "all") {
        sql += ` AND entity_type = $${idx}`;
        countSql += ` AND entity_type = $${idx}`;
        values.push(filters.entityType);
        idx++;
      }

      if (filters?.query) {
        const q = `%${filters.query}%`;
        sql += ` AND (LOWER(title) LIKE LOWER($${idx}) OR LOWER(entity_id) LIKE LOWER($${idx}) OR LOWER(COALESCE(person_name, '')) LIKE LOWER($${idx}) OR LOWER(COALESCE(person_phone, '')) LIKE LOWER($${idx}) OR LOWER(COALESCE(details, '')) LIKE LOWER($${idx}) OR LOWER(admin_name) LIKE LOWER($${idx}))`;
        countSql += ` AND (LOWER(title) LIKE LOWER($${idx}) OR LOWER(entity_id) LIKE LOWER($${idx}) OR LOWER(COALESCE(person_name, '')) LIKE LOWER($${idx}) OR LOWER(COALESCE(person_phone, '')) LIKE LOWER($${idx}) OR LOWER(COALESCE(details, '')) LIKE LOWER($${idx}) OR LOWER(admin_name) LIKE LOWER($${idx}))`;
        values.push(q);
        idx++;
      }

      const countRes = await pool.query(countSql, values);
      total = parseInt(countRes.rows[0]?.count || "0", 10);

      sql += ` ORDER BY created_at DESC`;
      const limit = filters?.limit || 150;
      const offset = filters?.offset || 0;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;

      const res = await pool.query(sql, values);
      logs = res.rows.map((r) => ({
        id: r.id,
        adminName: r.admin_name,
        actionType: r.action_type,
        entityType: r.entity_type,
        entityId: r.entity_id,
        personName: r.person_name || undefined,
        personPhone: r.person_phone || undefined,
        title: r.title,
        details: r.details || undefined,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (e: any) {
      console.warn("[ADMIN DB] Error fetching activity logs from PG:", e.message);
    }
  }

  if (logs.length === 0) {
    const local = readLocalStore();
    let list: AdminActivityLog[] = (local.auditLogs || []).map((l: any) => {
      if (l.actionType) return l as AdminActivityLog;
      return {
        id: l.id || `act-${Date.now()}`,
        adminName: l.adminName || "Super Admin",
        actionType: (l.action as any) || "UPDATE",
        entityType: l.entityType || "vendor",
        entityId: l.entityId || l.id || "system",
        personName: l.personName || undefined,
        personPhone: l.personPhone || undefined,
        title: l.title || l.action || "Admin Operation",
        details: l.details || "",
        createdAt: l.createdAt || l.timestamp || new Date().toISOString(),
      };
    });

    if (filters?.entityId && filters.entityId !== "all") {
      const eid = filters.entityId.toLowerCase();
      list = list.filter((l) => (l.entityId && l.entityId.toLowerCase() === eid) || l.personPhone === filters.entityId);
    }
    if (filters?.actionType && filters.actionType !== "all") {
      list = list.filter((l) => l.actionType === filters.actionType);
    }
    if (filters?.entityType && filters.entityType !== "all") {
      list = list.filter((l) => l.entityType === filters.entityType);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q) ||
          (l.personName && l.personName.toLowerCase().includes(q)) ||
          (l.personPhone && l.personPhone.includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }
    total = list.length;
    const limit = filters?.limit || 150;
    const offset = filters?.offset || 0;
    logs = list.slice(offset, offset + limit);
  }

  // Build profile dictionary
  const vendorMap = new Map<string, any>();
  const franchiseMap = new Map<string, any>();
  try {
    const local = readLocalStore();
    (local.vendorLeads || []).forEach((v) => {
      if (v.applicationId) vendorMap.set(v.applicationId.toLowerCase(), v);
      if (v.id) vendorMap.set(v.id.toLowerCase(), v);
      if (v.mobile) vendorMap.set(v.mobile, v);
    });
    (local.franchiseLeads || []).forEach((f) => {
      if (f.applicationId) franchiseMap.set(f.applicationId.toLowerCase(), f);
      if (f.id) franchiseMap.set(f.id.toLowerCase(), f);
      if (f.mobile) franchiseMap.set(f.mobile, f);
    });
  } catch {}

  // Enrich logs with personName & personPhone
  logs = logs.map((l) => {
    let pName = l.personName;
    let pPhone = l.personPhone;
    const v = vendorMap.get(l.entityId.toLowerCase());
    const f = franchiseMap.get(l.entityId.toLowerCase());
    if (v) {
      pName = pName || v.fullName;
      pPhone = pPhone || v.mobile;
    } else if (f) {
      pName = pName || f.fullName;
      pPhone = pPhone || f.mobile;
    }
    return {
      ...l,
      personName: pName || "Applicant Partner",
      personPhone: pPhone || "—",
    };
  });

  // Group by Profile (entityId or personPhone)
  const groupMap = new Map<string, ProfileActivityGroup>();
  logs.forEach((log) => {
    const key = (log.entityId || log.personPhone || log.id).toLowerCase();
    const v = vendorMap.get(log.entityId.toLowerCase());
    const f = franchiseMap.get(log.entityId.toLowerCase());
    const lead = v || f;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        entityId: lead?.applicationId || log.entityId,
        entityType: v ? "vendor" : f ? "franchise" : log.entityType,
        personName: lead?.fullName || log.personName || "Valued Partner",
        personPhone: lead?.mobile || log.personPhone || "—",
        city: lead?.city || "",
        state: lead?.state || "",
        planTier: lead?.preferredPackage || "",
        status: lead?.status || "new",
        profileLink: v ? `/vendor/manage/${v.id}` : f ? `/franchise` : undefined,
        activities: [],
        lastActivityAt: log.createdAt,
      });
    }

    const group = groupMap.get(key)!;
    group.activities.push(log);
    if (new Date(log.createdAt).getTime() > new Date(group.lastActivityAt).getTime()) {
      group.lastActivityAt = log.createdAt;
    }
  });

  const profileGroups = Array.from(groupMap.values()).sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  );

  return { logs, total, profileGroups };
}

export async function clearActivityLogs(): Promise<boolean> {
  const pool = await getDbPool();
  if (pool) {
    try {
      await pool.query("DELETE FROM admin_activity_logs");
    } catch (e: any) {
      console.warn("[ADMIN DB] Error clearing activity logs:", e.message);
    }
  }
  const local = readLocalStore();
  local.auditLogs = [];
  writeLocalStore(local);
  return true;
}

// Read from sibling landing pages if present
export function syncSiblingLandingPageStores(): { franchiseCount: number; vendorCount: number } {
  let franchiseCount = 0;
  let vendorCount = 0;

  const franchisePath = path.resolve(
    process.cwd(),
    "../Broom boom franchise landing page/data/broomboom-store.json"
  );
  const vendorPath = path.resolve(
    process.cwd(),
    "../broomboomvendor page/data/broomboom-vendor-store.json"
  );

  const localState = readLocalStore();
  const existingFranchiseIds = new Set(localState.franchiseLeads.map((l) => l.applicationId || l.id));
  const existingVendorIds = new Set(localState.vendorLeads.map((l) => l.applicationId || l.id));

  // Sync Franchise Leads from sibling project
  if (fs.existsSync(franchisePath)) {
    try {
      const raw = fs.readFileSync(franchisePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.leads)) {
        parsed.leads.forEach((l: any) => {
          const key = l.applicationId || l.id;
          if (!existingFranchiseIds.has(key)) {
            localState.franchiseLeads.push(l);
            existingFranchiseIds.add(key);
            franchiseCount++;
          }
        });
      }
    } catch (err: any) {
      console.warn("Could not sync franchise store:", err.message);
    }
  }

  // Sync Vendor Leads from sibling project
  if (fs.existsSync(vendorPath)) {
    try {
      const raw = fs.readFileSync(vendorPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.leads)) {
        parsed.leads.forEach((l: any) => {
          const key = l.applicationId || l.id;
          if (!existingVendorIds.has(key)) {
            localState.vendorLeads.push(l);
            existingVendorIds.add(key);
            vendorCount++;
          }
        });
      }
    } catch (err: any) {
      console.warn("Could not sync vendor store:", err.message);
    }
  }

  if (franchiseCount > 0 || vendorCount > 0) {
    writeLocalStore(localState);
  }

  return { franchiseCount, vendorCount };
}

// Franchise & Vendor Admin DB Operations
export const adminDb = {
  franchise: {
    async getAll(filters?: {
      status?: string;
      package?: string;
      query?: string;
    }): Promise<FranchiseLead[]> {
      syncSiblingLandingPageStores();

      const pool = await getDbPool();
      let pgLeads: FranchiseLead[] = [];

      if (pool) {
        try {
          await initTables();
          let sql = "SELECT * FROM franchise_leads WHERE 1=1";
          const values: any[] = [];
          let idx = 1;

          if (filters?.status && filters.status !== "all") {
            sql += ` AND LOWER(status) = LOWER($${idx++})`;
            values.push(filters.status);
          }
          if (filters?.package && filters.package !== "all") {
            sql += ` AND LOWER(preferred_package) = LOWER($${idx++})`;
            values.push(filters.package);
          }
          if (filters?.query) {
            sql += ` AND (
              LOWER(full_name) LIKE LOWER($${idx})
              OR LOWER(city) LIKE LOWER($${idx})
              OR mobile LIKE $${idx}
              OR LOWER(application_id) LIKE LOWER($${idx})
            )`;
            values.push(`%${filters.query}%`);
            idx++;
          }
          sql += " ORDER BY created_at DESC";

          const res = await pool.query(sql, values);
          pgLeads = res.rows.map((r) => ({
            id: r.id,
            applicationId: r.application_id,
            fullName: r.full_name,
            mobile: r.mobile,
            alternatePhone: r.alternate_phone || undefined,
            email: r.email || "",
            state: r.state || "",
            city: r.city,
            pincode: r.pincode || undefined,
            proposedAddress: r.proposed_address || undefined,
            spaceStatus: r.space_status || undefined,
            carpetArea: r.carpet_area || undefined,
            preferredPackage: r.preferred_package,
            packageName: r.package_name,
            investmentBudget: r.investment_budget || undefined,
            financeRequired: r.finance_required || undefined,
            loanAssistance: r.loan_assistance || undefined,
            currentProfession: r.current_profession || undefined,
            hasExperience: r.has_experience || undefined,
            message: r.message || undefined,
            source: r.source || "apply_page",
            status: (r.status as LeadStatus) || "new",
            adminNotes: r.admin_notes || undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          }));
        } catch (e: any) {
          console.warn("[ADMIN DB] Error querying franchise leads from pg:", e.message);
        }
      }

      const localState = readLocalStore();
      const combinedMap = new Map<string, FranchiseLead>();

      localState.franchiseLeads.forEach((l) => {
        const key = l.applicationId || l.id;
        combinedMap.set(key, l);
      });

      pgLeads.forEach((l) => {
        const key = l.applicationId || l.id;
        combinedMap.set(key, l);
      });

      let all = Array.from(combinedMap.values());

      if (filters?.status && filters.status !== "all") {
        all = all.filter((l) => l.status === filters.status);
      }
      if (filters?.package && filters.package !== "all") {
        all = all.filter((l) => l.preferredPackage === filters.package);
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase().trim();
        all = all.filter(
          (l) =>
            l.fullName.toLowerCase().includes(q) ||
            l.mobile.includes(q) ||
            l.city.toLowerCase().includes(q) ||
            l.applicationId.toLowerCase().includes(q)
        );
      }

      all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return all;
    },

    async getById(id: string): Promise<FranchiseLead | null> {
      const all = await adminDb.franchise.getAll();
      return all.find((l) => l.id === id || l.applicationId === id) || null;
    },

    async create(data: Partial<FranchiseLead>): Promise<FranchiseLead> {
      const now = new Date().toISOString();
      const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const randomSerial = Math.floor(1000 + Math.random() * 9000);
      const applicationId = data.applicationId || `BB-2026-${randomSerial}`;

      const newLead: FranchiseLead = {
        id,
        applicationId,
        fullName: data.fullName || "Unnamed Applicant",
        mobile: data.mobile || "",
        alternatePhone: data.alternatePhone,
        email: data.email || "",
        state: data.state || "",
        city: data.city || "",
        pincode: data.pincode,
        proposedAddress: data.proposedAddress,
        spaceStatus: data.spaceStatus,
        carpetArea: data.carpetArea,
        preferredPackage: (data.preferredPackage as any) || "gold",
        packageName: data.packageName || `${(data.preferredPackage || "gold").toUpperCase()} Partner`,
        investmentBudget: data.investmentBudget || "Flexible",
        financeRequired: data.financeRequired || "Self-Funded",
        loanAssistance: data.loanAssistance || "No",
        currentProfession: data.currentProfession,
        hasExperience: data.hasExperience,
        message: data.message,
        source: data.source || "admin_manual_entry",
        status: data.status || "new",
        adminNotes: data.adminNotes || "Created via Admin Portal",
        createdAt: now,
        updatedAt: now,
      };

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();
          await pool.query(
            `INSERT INTO franchise_leads (
              id, application_id, full_name, mobile, alternate_phone, email, state, city,
              pincode, proposed_address, space_status, carpet_area, preferred_package,
              package_name, investment_budget, finance_required, loan_assistance,
              current_profession, has_experience, message, source, status, admin_notes,
              created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
            ON CONFLICT (application_id) DO UPDATE SET status = EXCLUDED.status`,
            [
              newLead.id,
              newLead.applicationId,
              newLead.fullName,
              newLead.mobile,
              newLead.alternatePhone || null,
              newLead.email,
              newLead.state || null,
              newLead.city,
              newLead.pincode || null,
              newLead.proposedAddress || null,
              newLead.spaceStatus || null,
              newLead.carpetArea || null,
              newLead.preferredPackage,
              newLead.packageName || null,
              newLead.investmentBudget || null,
              newLead.financeRequired || "Self-Funded",
              newLead.loanAssistance || "No",
              newLead.currentProfession || null,
              newLead.hasExperience || null,
              newLead.message || null,
              newLead.source,
              newLead.status,
              newLead.adminNotes || null,
              new Date(newLead.createdAt),
              new Date(newLead.updatedAt),
            ]
          );
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres insert error, continuing to local store:", e.message);
        }
      }

      const local = readLocalStore();
      local.franchiseLeads.unshift(newLead);
      local.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        action: "FRANCHISE_LEAD_CREATED",
        details: `Created franchise lead ${newLead.applicationId} for ${newLead.fullName}`,
        timestamp: now,
      });
      writeLocalStore(local);

      return newLead;
    },

    async update(id: string, updates: Partial<FranchiseLead>): Promise<FranchiseLead | null> {
      const now = new Date().toISOString();
      const pool = await getDbPool();

      if (pool) {
        try {
          await initTables();
          const setClauses: string[] = ["updated_at = NOW()"];
          const values: any[] = [];
          let idx = 1;

          if (updates.status !== undefined) {
            setClauses.push(`status = $${idx++}`);
            values.push(updates.status);
          }
          if (updates.adminNotes !== undefined) {
            setClauses.push(`admin_notes = $${idx++}`);
            values.push(updates.adminNotes);
          }
          if (updates.fullName !== undefined) {
            setClauses.push(`full_name = $${idx++}`);
            values.push(updates.fullName);
          }
          if (updates.mobile !== undefined) {
            setClauses.push(`mobile = $${idx++}`);
            values.push(updates.mobile);
          }
          if (updates.alternatePhone !== undefined) {
            setClauses.push(`alternate_phone = $${idx++}`);
            values.push(updates.alternatePhone || null);
          }
          if (updates.email !== undefined) {
            setClauses.push(`email = $${idx++}`);
            values.push(updates.email);
          }
          if (updates.state !== undefined) {
            setClauses.push(`state = $${idx++}`);
            values.push(updates.state || null);
          }
          if (updates.city !== undefined) {
            setClauses.push(`city = $${idx++}`);
            values.push(updates.city);
          }
          if (updates.pincode !== undefined) {
            setClauses.push(`pincode = $${idx++}`);
            values.push(updates.pincode || null);
          }
          if (updates.proposedAddress !== undefined) {
            setClauses.push(`proposed_address = $${idx++}`);
            values.push(updates.proposedAddress || null);
          }
          if (updates.spaceStatus !== undefined) {
            setClauses.push(`space_status = $${idx++}`);
            values.push(updates.spaceStatus || null);
          }
          if (updates.carpetArea !== undefined) {
            setClauses.push(`carpet_area = $${idx++}`);
            values.push(updates.carpetArea || null);
          }
          if (updates.preferredPackage !== undefined) {
            setClauses.push(`preferred_package = $${idx++}`);
            values.push(updates.preferredPackage);
          }
          if (updates.packageName !== undefined) {
            setClauses.push(`package_name = $${idx++}`);
            values.push(updates.packageName || null);
          }
          if (updates.investmentBudget !== undefined) {
            setClauses.push(`investment_budget = $${idx++}`);
            values.push(updates.investmentBudget || null);
          }
          if (updates.financeRequired !== undefined) {
            setClauses.push(`finance_required = $${idx++}`);
            values.push(updates.financeRequired || null);
          }
          if (updates.loanAssistance !== undefined) {
            setClauses.push(`loan_assistance = $${idx++}`);
            values.push(updates.loanAssistance || null);
          }
          if (updates.currentProfession !== undefined) {
            setClauses.push(`current_profession = $${idx++}`);
            values.push(updates.currentProfession || null);
          }
          if (updates.hasExperience !== undefined) {
            setClauses.push(`has_experience = $${idx++}`);
            values.push(updates.hasExperience || null);
          }
          if (updates.message !== undefined) {
            setClauses.push(`message = $${idx++}`);
            values.push(updates.message || null);
          }
          if (updates.source !== undefined) {
            setClauses.push(`source = $${idx++}`);
            values.push(updates.source);
          }

          values.push(id);
          const sql = `UPDATE franchise_leads SET ${setClauses.join(", ")} WHERE id = $${idx} OR application_id = $${idx}`;
          await pool.query(sql, values);
        } catch (e: any) {
          console.warn("[ADMIN DB] Error updating postgres lead:", e.message);
        }
      }

      const local = readLocalStore();
      const index = local.franchiseLeads.findIndex(
        (l) => l.id === id || l.applicationId === id
      );
      if (index !== -1) {
        local.franchiseLeads[index] = {
          ...local.franchiseLeads[index],
          ...updates,
          updatedAt: now,
        };
        local.auditLogs.unshift({
          id: `audit-${Date.now()}`,
          action: "FRANCHISE_LEAD_UPDATED",
          details: `Updated lead ${id}`,
          timestamp: now,
        });
        writeLocalStore(local);

        if (updates.status !== undefined) {
          await logAdminActivity({
            actionType: updates.status === "approved" ? "APPROVE" : updates.status === "rejected" ? "REJECT" : "STATUS_CHANGE",
            entityType: "franchise",
            entityId: local.franchiseLeads[index]?.applicationId || id,
            title: `Franchise Status Changed to ${String(updates.status).toUpperCase()}`,
            details: `Updated status for franchise lead ${local.franchiseLeads[index]?.fullName || id} to ${updates.status}`,
          });
        } else {
          await logAdminActivity({
            actionType: "UPDATE",
            entityType: "franchise",
            entityId: local.franchiseLeads[index]?.applicationId || id,
            title: `Franchise Lead Updated: ${local.franchiseLeads[index]?.fullName || id}`,
            details: `Updated details for franchise lead ${id}`,
          });
        }

        return local.franchiseLeads[index];
      }

      return adminDb.franchise.getById(id);
    },

    async delete(id: string): Promise<boolean> {
      const pool = await getDbPool();
      if (pool) {
        try {
          await pool.query("DELETE FROM franchise_leads WHERE id = $1 OR application_id = $1", [id]);
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres delete failed:", e.message);
        }
      }

      const local = readLocalStore();
      const prevLen = local.franchiseLeads.length;
      const targetLead = local.franchiseLeads.find((l) => l.id === id || l.applicationId === id);
      local.franchiseLeads = local.franchiseLeads.filter(
        (l) => l.id !== id && l.applicationId !== id
      );
      if (local.franchiseLeads.length !== prevLen) {
        writeLocalStore(local);
      }

      await logAdminActivity({
        actionType: "DELETE",
        entityType: "franchise",
        entityId: targetLead?.applicationId || id,
        title: `Franchise Lead Deleted: ${targetLead?.fullName || id}`,
        details: `Deleted franchise applicant ${targetLead?.fullName || id} (${targetLead?.applicationId || id})`,
      });

      return true;
    },
  },

  vendor: {
    async getAll(filters?: {
      status?: string;
      tier?: string;
      query?: string;
    }): Promise<VendorLead[]> {
      syncSiblingLandingPageStores();

      const pool = await getDbPool();
      let pgLeads: VendorLead[] = [];

      if (pool) {
        try {
          await initTables();
          let sql = "SELECT * FROM vendor_leads WHERE 1=1";
          const values: any[] = [];
          let idx = 1;

          if (filters?.status && filters.status !== "all") {
            sql += ` AND LOWER(status) = LOWER($${idx++})`;
            values.push(filters.status);
          }
          if (filters?.tier && filters.tier !== "all") {
            sql += ` AND LOWER(preferred_package) = LOWER($${idx++})`;
            values.push(filters.tier);
          }
          if (filters?.query) {
            sql += ` AND (
              LOWER(full_name) LIKE LOWER($${idx})
              OR LOWER(city) LIKE LOWER($${idx})
              OR mobile LIKE $${idx}
              OR LOWER(application_id) LIKE LOWER($${idx})
            )`;
            values.push(`%${filters.query}%`);
            idx++;
          }
          sql += " ORDER BY created_at DESC";

          const res = await pool.query(sql, values);
          pgLeads = res.rows.map((r) => ({
            id: r.id,
            applicationId: r.application_id,
            fullName: r.full_name,
            mobile: r.mobile,
            alternatePhone: r.alternate_phone || undefined,
            email: r.email || "",
            state: r.state || "",
            city: r.city,
            pincode: r.pincode || undefined,
            proposedAddress: r.proposed_address || undefined,
            spaceStatus: r.space_status || undefined,
            carpetArea: r.carpet_area || undefined,
            preferredPackage: r.preferred_package,
            packageName: r.package_name,
            investmentBudget: r.investment_budget || undefined,
            financeRequired: r.finance_required || undefined,
            loanAssistance: r.loan_assistance || undefined,
            currentProfession: r.current_profession || undefined,
            hasExperience: r.has_experience || undefined,
            message: r.message || undefined,
            source: r.source || "vendor_portal",
            status: (r.status as LeadStatus) || "new",
            adminNotes: r.admin_notes || undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          }));
        } catch (e: any) {
          console.warn("[ADMIN DB] Error querying vendor leads from pg:", e.message);
        }
      }

      const localState = readLocalStore();
      const combinedMap = new Map<string, VendorLead>();

      localState.vendorLeads.forEach((l) => {
        const key = l.applicationId || l.id;
        combinedMap.set(key, l);
      });

      pgLeads.forEach((l) => {
        const key = l.applicationId || l.id;
        combinedMap.set(key, l);
      });

      let all = Array.from(combinedMap.values());

      if (filters?.status && filters.status !== "all") {
        all = all.filter((l) => l.status === filters.status);
      }
      if (filters?.tier && filters.tier !== "all") {
        all = all.filter((l) => l.preferredPackage === filters.tier);
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase().trim();
        all = all.filter(
          (l) =>
            l.fullName.toLowerCase().includes(q) ||
            l.mobile.includes(q) ||
            l.city.toLowerCase().includes(q) ||
            l.applicationId.toLowerCase().includes(q)
        );
      }

      all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Attach vendor user credentials and plan tickets to each lead
      try {
        const allUsers = await adminDb.vendorUser.getAll();
        const allTickets = await adminDb.ticket.getAll();

        all = all.map((lead) => {
          const user = allUsers.find(
            (u) =>
              (u.applicationId && lead.applicationId && u.applicationId.toLowerCase() === lead.applicationId.toLowerCase()) ||
              (u.vendorMobile && lead.mobile && u.vendorMobile === lead.mobile)
          );
          const leadTickets = allTickets.filter(
            (t) =>
              (t.applicationId && lead.applicationId && t.applicationId.toLowerCase() === lead.applicationId.toLowerCase()) ||
              (t.vendorMobile && lead.mobile && t.vendorMobile === lead.mobile)
          );
          const pendingCount = leadTickets.filter((t) => (t.status || "").toUpperCase() === "PENDING").length;

          return {
            ...lead,
            credentials: user
              ? {
                  userId: user.userId,
                  password: user.password,
                  isActive: user.isActive,
                }
              : undefined,
            pendingTicketCount: pendingCount,
            latestTicket: leadTickets[0] || undefined,
            tickets: leadTickets,
          };
        });
      } catch (enrichErr) {
        console.warn("[ADMIN DB] Error enriching vendor leads with tickets/users:", enrichErr);
      }

      return all;
    },

    async getById(id: string): Promise<VendorLead | null> {
      const all = await adminDb.vendor.getAll();
      const lead = all.find((l) => l.id === id || l.applicationId === id) || null;
      if (!lead) return null;

      try {
        const leadTickets = await adminDb.ticket.getAll();
        const matchingTickets = leadTickets.filter(
          (t) =>
            (t.applicationId && lead.applicationId && t.applicationId.toLowerCase() === lead.applicationId.toLowerCase()) ||
            (t.vendorMobile && lead.mobile && t.vendorMobile === lead.mobile)
        );
        lead.tickets = matchingTickets;
        lead.pendingTicketCount = matchingTickets.filter((t) => (t.status || "").toUpperCase() === "PENDING").length;
        lead.latestTicket = matchingTickets[0] || undefined;
      } catch {}

      return lead;
    },

    async create(data: Partial<VendorLead>): Promise<VendorLead> {
      const now = new Date().toISOString();
      const id = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const randomSerial = Math.floor(1000 + Math.random() * 9000);
      const applicationId = data.applicationId || `BB-VENDOR-2026-${randomSerial}`;

      const newLead: VendorLead = {
        id,
        applicationId,
        fullName: data.fullName || "Unnamed Vendor",
        mobile: data.mobile || "",
        alternatePhone: data.alternatePhone,
        email: data.email || "",
        state: data.state || "",
        city: data.city || "",
        pincode: data.pincode,
        proposedAddress: data.proposedAddress,
        spaceStatus: data.spaceStatus,
        carpetArea: data.carpetArea,
        preferredPackage: data.preferredPackage || "gold",
        packageName: data.packageName || `${(data.preferredPackage || "gold").toUpperCase()} Partner`,
        investmentBudget: data.investmentBudget || "Flexible",
        financeRequired: data.financeRequired || "Self-Funded / Ready Capital",
        loanAssistance: data.loanAssistance || "No (Self-Funded)",
        currentProfession: data.currentProfession,
        hasExperience: data.hasExperience,
        message: data.message,
        source: data.source || "admin_manual_entry",
        status: data.status || "new",
        adminNotes: data.adminNotes || "Created via Admin Portal",
        createdAt: now,
        updatedAt: now,
      };

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();
          await pool.query(
            `INSERT INTO vendor_leads (
              id, application_id, full_name, mobile, alternate_phone, email, state, city,
              pincode, proposed_address, space_status, carpet_area, preferred_package,
              package_name, investment_budget, finance_required, loan_assistance,
              current_profession, has_experience, message, source, status, admin_notes,
              created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
            ON CONFLICT (application_id) DO UPDATE SET status = EXCLUDED.status`,
            [
              newLead.id,
              newLead.applicationId,
              newLead.fullName,
              newLead.mobile,
              newLead.alternatePhone || null,
              newLead.email || null,
              newLead.state || null,
              newLead.city,
              newLead.pincode || null,
              newLead.proposedAddress || null,
              newLead.spaceStatus || null,
              newLead.carpetArea || null,
              newLead.preferredPackage,
              newLead.packageName || null,
              newLead.investmentBudget || null,
              newLead.financeRequired || "Self-Funded / Ready Capital",
              newLead.loanAssistance || "No (Self-Funded)",
              newLead.currentProfession || null,
              newLead.hasExperience || null,
              newLead.message || null,
              newLead.source,
              newLead.status,
              newLead.adminNotes || null,
              new Date(newLead.createdAt),
              new Date(newLead.updatedAt),
            ]
          );
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres vendor insert error:", e.message);
        }
      }

      const local = readLocalStore();
      local.vendorLeads.unshift(newLead);
      local.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        action: "VENDOR_LEAD_CREATED",
        details: `Created vendor lead ${newLead.applicationId} for ${newLead.fullName}`,
        timestamp: now,
      });
      writeLocalStore(local);

      return newLead;
    },

    async update(
      id: string,
      updates: Partial<VendorLead> & { userId?: string; password?: string }
    ): Promise<VendorLead | null> {
      const now = new Date().toISOString();
      const pool = await getDbPool();

      if (pool) {
        try {
          await initTables();
          const setClauses: string[] = ["updated_at = NOW()"];
          const values: any[] = [];
          let idx = 1;

          if (updates.status !== undefined) {
            setClauses.push(`status = $${idx++}`);
            values.push(updates.status);
          }
          if (updates.adminNotes !== undefined) {
            setClauses.push(`admin_notes = $${idx++}`);
            values.push(updates.adminNotes);
          }
          if (updates.fullName !== undefined) {
            setClauses.push(`full_name = $${idx++}`);
            values.push(updates.fullName);
          }
          if (updates.mobile !== undefined) {
            setClauses.push(`mobile = $${idx++}`);
            values.push(updates.mobile);
          }
          if (updates.alternatePhone !== undefined) {
            setClauses.push(`alternate_phone = $${idx++}`);
            values.push(updates.alternatePhone || null);
          }
          if (updates.email !== undefined) {
            setClauses.push(`email = $${idx++}`);
            values.push(updates.email);
          }
          if (updates.state !== undefined) {
            setClauses.push(`state = $${idx++}`);
            values.push(updates.state || null);
          }
          if (updates.city !== undefined) {
            setClauses.push(`city = $${idx++}`);
            values.push(updates.city);
          }
          if (updates.pincode !== undefined) {
            setClauses.push(`pincode = $${idx++}`);
            values.push(updates.pincode || null);
          }
          if (updates.proposedAddress !== undefined) {
            setClauses.push(`proposed_address = $${idx++}`);
            values.push(updates.proposedAddress || null);
          }
          if (updates.spaceStatus !== undefined) {
            setClauses.push(`space_status = $${idx++}`);
            values.push(updates.spaceStatus || null);
          }
          if (updates.carpetArea !== undefined) {
            setClauses.push(`carpet_area = $${idx++}`);
            values.push(updates.carpetArea || null);
          }
          if (updates.preferredPackage !== undefined) {
            setClauses.push(`preferred_package = $${idx++}`);
            values.push(updates.preferredPackage);
          }
          if (updates.packageName !== undefined) {
            setClauses.push(`package_name = $${idx++}`);
            values.push(updates.packageName || null);
          }
          if (updates.investmentBudget !== undefined) {
            setClauses.push(`investment_budget = $${idx++}`);
            values.push(updates.investmentBudget || null);
          }
          if (updates.financeRequired !== undefined) {
            setClauses.push(`finance_required = $${idx++}`);
            values.push(updates.financeRequired || null);
          }
          if (updates.loanAssistance !== undefined) {
            setClauses.push(`loan_assistance = $${idx++}`);
            values.push(updates.loanAssistance || null);
          }
          if (updates.currentProfession !== undefined) {
            setClauses.push(`current_profession = $${idx++}`);
            values.push(updates.currentProfession || null);
          }
          if (updates.hasExperience !== undefined) {
            setClauses.push(`has_experience = $${idx++}`);
            values.push(updates.hasExperience || null);
          }
          if (updates.message !== undefined) {
            setClauses.push(`message = $${idx++}`);
            values.push(updates.message || null);
          }
          if (updates.source !== undefined) {
            setClauses.push(`source = $${idx++}`);
            values.push(updates.source);
          }

          values.push(id);
          const sql = `UPDATE vendor_leads SET ${setClauses.join(", ")} WHERE id = $${idx} OR application_id = $${idx}`;
          const res = await pool.query(sql, values);

          // If the lead was only in localStore, insert it into postgres
          const currentLead = await adminDb.vendor.getById(id);
          if (res.rowCount === 0 && currentLead) {
            const fullLead = { ...currentLead, ...updates };
            await pool.query(
              `INSERT INTO vendor_leads (
                id, application_id, full_name, mobile, alternate_phone, email, state, city,
                pincode, proposed_address, space_status, carpet_area, preferred_package,
                package_name, investment_budget, finance_required, loan_assistance,
                current_profession, has_experience, message, source, status, admin_notes,
                created_at, updated_at
              ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
              ON CONFLICT (application_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()`,
              [
                fullLead.id,
                fullLead.applicationId,
                fullLead.fullName,
                fullLead.mobile,
                fullLead.alternatePhone || null,
                fullLead.email || null,
                fullLead.state || null,
                fullLead.city,
                fullLead.pincode || null,
                fullLead.proposedAddress || null,
                fullLead.spaceStatus || null,
                fullLead.carpetArea || null,
                fullLead.preferredPackage,
                fullLead.packageName || null,
                fullLead.investmentBudget || null,
                fullLead.financeRequired || "Self-Funded / Ready Capital",
                fullLead.loanAssistance || "No (Self-Funded)",
                fullLead.currentProfession || null,
                fullLead.hasExperience || null,
                fullLead.message || null,
                fullLead.source || "vendor_portal",
                fullLead.status,
                fullLead.adminNotes || null,
                new Date(fullLead.createdAt),
                new Date(),
              ]
            );
          }

          // If status is updated to approved, activate vendor subscription in PG
          if (updates.status === "approved" && currentLead) {
            const tier = (currentLead.preferredPackage || "silver").toLowerCase();
            const baseAmount = tier === "silver" ? 10000 : tier === "platinum" ? 50000 : 20000;
            const gatewayFee = Math.round(baseAmount * 0.03);
            const gstAmount = Math.round(baseAmount * 0.05);
            const totalAmount = baseAmount + gatewayFee + gstAmount;

            await pool.query("DELETE FROM vendor_subscriptions WHERE application_id = $1", [currentLead.applicationId]);
            await pool.query(
              `INSERT INTO vendor_subscriptions (
                id, subscription_id, application_id, vendor_name, vendor_mobile, vendor_email,
                city, state, plan_tier, plan_name, billing_cycle, status, start_date,
                has_exclusivity, order_id, payment_status, base_amount, gateway_fee, gst_amount, total_amount, currency, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'annual', 'active', NOW(), true, $10, 'PAID', $11, $12, $13, $14, 'INR', NOW(), NOW()
              )`,
              [
                `SUB-BB-2026-${currentLead.applicationId.slice(-4)}`,
                currentLead.applicationId,
                currentLead.fullName,
                currentLead.mobile,
                currentLead.email || null,
                currentLead.city,
                currentLead.state || "West Bengal",
                tier,
                currentLead.packageName || `${tier.toUpperCase()} Partner`,
                `ORD-BB-${Date.now().toString().slice(-6)}`,
                baseAmount,
                gatewayFee,
                gstAmount,
                totalAmount,
              ]
            );
            // Automatically generate vendor login credentials upon approval
            try {
              await adminDb.vendorUser.generateCredentials(
                currentLead.applicationId,
                tier
              );
            } catch (credErr: any) {
              console.warn("[ADMIN DB] Error auto-generating credentials on approve:", credErr.message);
            }
          }

          if (updates.userId && updates.password && currentLead) {
            try {
              await adminDb.vendorUser.saveCredentials(
                currentLead.applicationId,
                updates.userId,
                updates.password,
                updates.preferredPackage || currentLead.preferredPackage
              );
            } catch (custCredErr: any) {
              console.warn("[ADMIN DB] Error saving custom credentials on lead update:", custCredErr.message);
            }
          }
        } catch (e: any) {
          console.warn("[ADMIN DB] Error updating postgres vendor lead:", e.message);
        }
      }

      const local = readLocalStore();
      const index = local.vendorLeads.findIndex(
        (l) => l.id === id || l.applicationId === id
      );
      if (index !== -1) {
        local.vendorLeads[index] = {
          ...local.vendorLeads[index],
          ...updates,
          updatedAt: now,
        };
        local.auditLogs.unshift({
          id: `audit-${Date.now()}`,
          action: "VENDOR_LEAD_UPDATED",
          details: `Updated vendor lead ${id}`,
          timestamp: now,
        });
        writeLocalStore(local);

        if (updates.status === "approved") {
          try {
            const vLead = local.vendorLeads[index];
            const vTier = (vLead.preferredPackage || "silver").toLowerCase();
            const vBaseAmount = vTier === "silver" ? 10000 : vTier === "platinum" ? 50000 : 20000;
            const vGatewayFee = Math.round(vBaseAmount * 0.03);
            const vGstAmount = Math.round(vBaseAmount * 0.05);
            const vTotalAmount = vBaseAmount + vGatewayFee + vGstAmount;

            if (!local.vendorSubscriptions) local.vendorSubscriptions = [];
            const subExistingIdx = local.vendorSubscriptions.findIndex(
              (s) => s.applicationId === vLead.applicationId
            );
            const activeSubObj: VendorSubscription = {
              id: `sub-${Date.now()}`,
              subscriptionId: `SUB-BB-2026-${vLead.applicationId.slice(-4)}`,
              applicationId: vLead.applicationId,
              vendorName: vLead.fullName,
              vendorMobile: vLead.mobile,
              vendorEmail: vLead.email,
              city: vLead.city,
              state: vLead.state || "West Bengal",
              planTier: vTier,
              planName: vLead.packageName || `${vTier.toUpperCase()} Partner`,
              billingCycle: "annual",
              status: "active",
              startDate: now,
              hasExclusivity: vTier !== "silver",
              orderId: `ORD-BB-${Date.now().toString().slice(-6)}`,
              paymentStatus: "PAID",
              baseAmount: vBaseAmount,
              gatewayFee: vGatewayFee,
              gstAmount: vGstAmount,
              totalAmount: vTotalAmount,
              currency: "INR",
              createdAt: now,
              updatedAt: now,
            };
            if (subExistingIdx !== -1) {
              local.vendorSubscriptions[subExistingIdx] = {
                ...local.vendorSubscriptions[subExistingIdx],
                ...activeSubObj,
              };
            } else {
              local.vendorSubscriptions.unshift(activeSubObj);
            }
            writeLocalStore(local);

            await adminDb.vendorUser.generateCredentials(
              vLead.applicationId,
              vTier
            );
          } catch (err: any) {
            console.warn("[ADMIN DB] Error in auto-approval workflow:", err.message);
          }
        }

        if (updates.status !== undefined) {
          await logAdminActivity({
            actionType: updates.status === "approved" ? "APPROVE" : updates.status === "rejected" ? "REJECT" : "STATUS_CHANGE",
            entityType: "vendor",
            entityId: local.vendorLeads[index]?.applicationId || id,
            title: `Vendor Status Changed to ${String(updates.status).toUpperCase()}`,
            details: `Updated status for ${local.vendorLeads[index]?.fullName || id} (${local.vendorLeads[index]?.applicationId || id}) to ${updates.status}`,
          });
        } else {
          await logAdminActivity({
            actionType: "UPDATE",
            entityType: "vendor",
            entityId: local.vendorLeads[index]?.applicationId || id,
            title: `Vendor Lead Updated: ${local.vendorLeads[index]?.fullName || id}`,
            details: `Updated details for ${local.vendorLeads[index]?.fullName || id} (${local.vendorLeads[index]?.applicationId || id})`,
          });
        }

        return local.vendorLeads[index];
      }

      const fresh = await adminDb.vendor.getById(id);
      if (fresh) {
        if (updates.status !== undefined) {
          await logAdminActivity({
            actionType: updates.status === "approved" ? "APPROVE" : updates.status === "rejected" ? "REJECT" : "STATUS_CHANGE",
            entityType: "vendor",
            entityId: fresh.applicationId || id,
            title: `Vendor Status Changed to ${String(updates.status).toUpperCase()}`,
            details: `Updated status for ${fresh.fullName || id} (${fresh.applicationId || id}) to ${updates.status}`,
          });
        } else {
          await logAdminActivity({
            actionType: "UPDATE",
            entityType: "vendor",
            entityId: fresh.applicationId || id,
            title: `Vendor Lead Updated: ${fresh.fullName || id}`,
            details: `Updated details for ${fresh.fullName || id} (${fresh.applicationId || id})`,
          });
        }
      }
      return fresh;
    },

    async delete(id: string): Promise<boolean> {
      const targetLead = await adminDb.vendor.getById(id);
      const pool = await getDbPool();
      if (pool) {
        try {
          await pool.query("DELETE FROM vendor_leads WHERE id = $1 OR application_id = $1", [id]);
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres vendor delete failed:", e.message);
        }
      }

      const local = readLocalStore();
      const prevLen = local.vendorLeads.length;
      local.vendorLeads = local.vendorLeads.filter(
        (l) => l.id !== id && l.applicationId !== id
      );
      if (local.vendorLeads.length !== prevLen) {
        writeLocalStore(local);
      }

      await logAdminActivity({
        actionType: "DELETE",
        entityType: "vendor",
        entityId: targetLead?.applicationId || id,
        title: `Deleted Vendor Lead: ${targetLead?.fullName || id}`,
        details: `Vendor lead ${targetLead?.applicationId || id} was permanently deleted by Admin HQ.`,
      });

      return true;
    },

    async recordPayment(payload: ManualPaymentPayload): Promise<{
      lead: VendorLead;
      subscription?: VendorSubscription;
      credentials?: VendorUser;
    }> {
      const {
        applicationId,
        amount,
        paymentMode,
        paymentReference,
        paymentDate,
        notes,
        setApproved = false,
      } = payload;

      const lead = await adminDb.vendor.getById(applicationId);
      if (!lead) throw new Error(`Vendor lead with ID ${applicationId} not found`);

      const tier = (lead.preferredPackage || "silver").toLowerCase();
      const planName = lead.packageName || `${tier.toUpperCase()} Partner`;
      const baseAmount = tier === "silver" ? 10000 : tier === "platinum" ? 50000 : 20000;
      const gatewayFee = Math.round(baseAmount * 0.03);
      const gstAmount = Math.round(baseAmount * 0.05);
      const orderId = `ORD-MANUAL-${Date.now().toString().slice(-6)}`;
      const newStatus: LeadStatus = setApproved ? "approved" : "in_progress";
      const payRef = paymentReference || `MANUAL-${Date.now().toString().slice(-6)}`;
      const payDate = paymentDate ? new Date(paymentDate) : new Date();

      const pool = await getDbPool();
      let updatedLead: VendorLead = { ...lead, status: newStatus };
      let updatedSub: any = undefined;
      let generatedCreds: any = undefined;

      if (pool) {
        try {
          await initTables();

          // 1. Update Vendor Lead status & notes
          const noteAppend = `\n[${new Date().toLocaleString()}] Manual Payment ₹${amount.toLocaleString()} received via ${paymentMode} (Ref: ${payRef}). Status set to ${newStatus.toUpperCase()}.${notes ? ` Notes: ${notes}` : ""}`;
          const currentNotes = lead.adminNotes ? `${lead.adminNotes}\n${noteAppend}` : noteAppend;

          await pool.query(
            `UPDATE vendor_leads SET status = $1, admin_notes = $2, updated_at = NOW() WHERE LOWER(application_id) = LOWER($3) OR id = $3`,
            [newStatus, currentNotes, applicationId]
          );

          // 2. Upsert Vendor Subscription as PAID
          const subCheck = await pool.query(
            `SELECT id, subscription_id FROM vendor_subscriptions WHERE LOWER(application_id) = LOWER($1) OR vendor_mobile = $2 LIMIT 1`,
            [applicationId, lead.mobile]
          );

          if (subCheck.rowCount && subCheck.rowCount > 0) {
            const subRes = await pool.query(
              `UPDATE vendor_subscriptions
               SET status = $1, payment_status = 'PAID', payment_method = $2, cf_payment_id = $3,
                   total_amount = $4, paid_at = $5,
                   admin_notes = CONCAT(COALESCE(admin_notes, ''), '\n', $6),
                   updated_at = NOW()
               WHERE id = $7 RETURNING *`,
              [
                setApproved ? "active" : "pending",
                `MANUAL_${paymentMode.toUpperCase()}`,
                payRef,
                amount,
                payDate,
                `Manual payment recorded: ₹${amount} via ${paymentMode} (Ref: ${payRef})`,
                subCheck.rows[0].id,
              ]
            );
            if (subRes.rows[0]) {
              updatedSub = subRes.rows[0];
            }
          } else {
            const subRes = await pool.query(
              `INSERT INTO vendor_subscriptions (
                id, subscription_id, application_id, vendor_name, vendor_mobile, vendor_email,
                city, state, plan_tier, plan_name, billing_cycle, status, start_date,
                has_exclusivity, order_id, cf_payment_id, payment_method, payment_status,
                base_amount, gateway_fee, gst_amount, total_amount, currency, paid_at, admin_notes, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'annual', $10, NOW(),
                true, $11, $12, $13, 'PAID', $14, $15, $16, $17, 'INR', $18, $19, NOW(), NOW()
              ) RETURNING *`,
              [
                `SUB-BB-2026-${lead.applicationId.slice(-4)}`,
                lead.applicationId,
                lead.fullName,
                lead.mobile,
                lead.email || null,
                lead.city,
                lead.state || "West Bengal",
                tier,
                planName,
                setApproved ? "active" : "pending",
                orderId,
                payRef,
                `MANUAL_${paymentMode.toUpperCase()}`,
                baseAmount,
                gatewayFee,
                gstAmount,
                amount,
                payDate,
                `Manual payment recorded: ₹${amount} via ${paymentMode} (Ref: ${payRef})`,
              ]
            );
            if (subRes.rows[0]) {
              updatedSub = subRes.rows[0];
            }
          }

          // 3. If setApproved is TRUE, auto-generate & activate credentials!
          if (setApproved) {
            generatedCreds = await adminDb.vendorUser.generateCredentials(lead.applicationId, tier);
          }
        } catch (e: any) {
          console.warn("[ADMIN DB] Error in recordPayment PG:", e.message);
        }
      }

      // Update local store fallback
      const local = readLocalStore();
      const lIdx = local.vendorLeads.findIndex(
        (l) => l.applicationId === applicationId || l.id === applicationId
      );
      if (lIdx !== -1) {
        local.vendorLeads[lIdx].status = newStatus;
        local.vendorLeads[lIdx].updatedAt = new Date().toISOString();
        updatedLead = local.vendorLeads[lIdx];
      }
      writeLocalStore(local);

      // Log this activity
      await logAdminActivity({
        actionType: "PAYMENT_RECORDED",
        entityType: "vendor",
        entityId: lead.applicationId,
        title: `Manual Payment Recorded: ₹${amount.toLocaleString()} for ${lead.fullName}`,
        details: `Recorded ₹${amount.toLocaleString()} via ${paymentMode} (Ref: ${payRef}). Status updated to ${newStatus.toUpperCase()}.${setApproved ? " Vendor approved & credentials generated." : ""}`,
      });

      return {
        lead: updatedLead,
        subscription: updatedSub,
        credentials: generatedCreds,
      };
    },
  },

  subscription: {
    async getAll(filters?: {
      status?: string;
      paymentStatus?: string;
      tier?: string;
      query?: string;
    }): Promise<VendorSubscription[]> {
      const pool = await getDbPool();
      let pgSubs: VendorSubscription[] = [];

      if (pool) {
        try {
          await initTables();
          let sql = "SELECT * FROM vendor_subscriptions WHERE 1=1";
          const values: any[] = [];
          let idx = 1;

          if (filters?.status && filters.status !== "all") {
            sql += ` AND LOWER(status) = LOWER($${idx++})`;
            values.push(filters.status);
          }
          if (filters?.paymentStatus && filters.paymentStatus !== "all") {
            sql += ` AND LOWER(payment_status) = LOWER($${idx++})`;
            values.push(filters.paymentStatus);
          }
          if (filters?.tier && filters.tier !== "all") {
            sql += ` AND LOWER(plan_tier) = LOWER($${idx++})`;
            values.push(filters.tier);
          }
          if (filters?.query) {
            sql += ` AND (
              LOWER(subscription_id) LIKE LOWER($${idx})
              OR LOWER(application_id) LIKE LOWER($${idx})
              OR LOWER(vendor_name) LIKE LOWER($${idx})
              OR vendor_mobile LIKE $${idx}
              OR LOWER(city) LIKE LOWER($${idx})
              OR LOWER(order_id) LIKE LOWER($${idx})
            )`;
            values.push(`%${filters.query}%`);
            idx++;
          }
          sql += " ORDER BY created_at DESC";

          const res = await pool.query(sql, values);
          pgSubs = res.rows.map((r) => ({
            id: r.id,
            subscriptionId: r.subscription_id,
            applicationId: r.application_id,
            vendorName: r.vendor_name,
            vendorMobile: r.vendor_mobile,
            vendorEmail: r.vendor_email || undefined,
            city: r.city,
            state: r.state || undefined,
            planTier: r.plan_tier,
            planName: r.plan_name,
            billingCycle: r.billing_cycle || "One-Time Onboarding & Annual Licensing",
            status: r.status || "active",
            startDate: r.start_date ? new Date(r.start_date).toISOString() : new Date().toISOString(),
            endDate: r.end_date ? new Date(r.end_date).toISOString() : undefined,
            territoryScope: r.territory_scope || undefined,
            hasExclusivity: r.has_exclusivity !== false,
            orderId: r.order_id,
            cfOrderId: r.cf_order_id || undefined,
            cfPaymentId: r.cf_payment_id || undefined,
            paymentSessionId: r.payment_session_id || undefined,
            paymentMethod: r.payment_method || undefined,
            paymentStatus: r.payment_status || "pending",
            baseAmount: Number(r.base_amount) || 0,
            gatewayFee: Number(r.gateway_fee) || 0,
            gstAmount: Number(r.gst_amount) || 0,
            totalAmount: Number(r.total_amount) || 0,
            currency: r.currency || "INR",
            paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : undefined,
            adminNotes: r.admin_notes || undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          }));
        } catch (e: any) {
          console.warn("[ADMIN DB] Error querying vendor subscriptions from pg:", e.message);
        }
      }

      const localState = readLocalStore();
      const localSubs = localState.vendorSubscriptions || [];
      const combinedMap = new Map<string, VendorSubscription>();

      localSubs.forEach((s) => {
        const key = s.subscriptionId || s.orderId || s.id;
        combinedMap.set(key, s);
      });

      pgSubs.forEach((s) => {
        const key = s.subscriptionId || s.orderId || s.id;
        combinedMap.set(key, s);
      });

      let all = Array.from(combinedMap.values());

      if (filters?.status && filters.status !== "all") {
        all = all.filter((s) => (s.status || "").toLowerCase() === filters.status?.toLowerCase());
      }
      if (filters?.paymentStatus && filters.paymentStatus !== "all") {
        all = all.filter((s) => (s.paymentStatus || "").toLowerCase() === filters.paymentStatus?.toLowerCase());
      }
      if (filters?.tier && filters.tier !== "all") {
        all = all.filter((s) => (s.planTier || "").toLowerCase() === filters.tier?.toLowerCase());
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase().trim();
        all = all.filter(
          (s) =>
            s.subscriptionId.toLowerCase().includes(q) ||
            s.applicationId.toLowerCase().includes(q) ||
            s.vendorName.toLowerCase().includes(q) ||
            s.vendorMobile.includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.orderId.toLowerCase().includes(q)
        );
      }

      all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return all;
    },

    async getById(id: string): Promise<VendorSubscription | null> {
      const all = await adminDb.subscription.getAll();
      return (
        all.find(
          (s) =>
            s.id === id ||
            s.subscriptionId === id ||
            s.applicationId === id ||
            s.orderId === id
        ) || null
      );
    },

    async create(data: Partial<VendorSubscription>): Promise<VendorSubscription> {
      const now = new Date().toISOString();
      const id = data.id || `sub-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const subNumber = Math.floor(100000 + Math.random() * 900000);
      const subscriptionId = data.subscriptionId || `SUB-BB-2026-${subNumber}`;
      const applicationId = data.applicationId || `BB-VENDOR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const planTier = data.planTier || "gold";
      const baseAmount = data.baseAmount ?? (planTier === "silver" ? 10000 : planTier === "platinum" ? 50000 : 20000);
      const gatewayFee = data.gatewayFee ?? Math.round(baseAmount * 0.03);
      const gstAmount = data.gstAmount ?? Math.round(baseAmount * 0.05);
      const totalAmount = data.totalAmount ?? (baseAmount + gatewayFee + gstAmount);

      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      const newSub: VendorSubscription = {
        id,
        subscriptionId,
        applicationId,
        vendorName: data.vendorName || "Valued Vendor Partner",
        vendorMobile: data.vendorMobile || "",
        vendorEmail: data.vendorEmail,
        city: data.city || "Kolkata",
        state: data.state || "West Bengal",
        planTier,
        planName:
          data.planName ||
          (planTier === "silver"
            ? "Silver Partner (Booking Kiosk)"
            : planTier === "platinum"
            ? "Platinum Partner (Regional Master Hub)"
            : "Gold Partner (District Exclusive Hub)"),
        billingCycle: data.billingCycle || "One-Time Onboarding & Annual Licensing",
        status: data.status || "active",
        startDate: data.startDate || now,
        endDate: data.endDate || oneYearLater.toISOString(),
        territoryScope:
          data.territoryScope ||
          (planTier === "silver"
            ? "Local Ward / Pin Code Hub"
            : planTier === "gold"
            ? "Exclusive District Zone"
            : "State / Regional Master Territory"),
        hasExclusivity: data.hasExclusivity ?? planTier !== "silver",
        orderId: data.orderId || `BB_ORDER_${Date.now()}`,
        cfOrderId: data.cfOrderId,
        cfPaymentId: data.cfPaymentId,
        paymentSessionId: data.paymentSessionId,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus || "PAID",
        baseAmount,
        gatewayFee,
        gstAmount,
        totalAmount,
        currency: data.currency || "INR",
        paidAt: data.paidAt || now,
        adminNotes: data.adminNotes || "Created via Admin Portal",
        createdAt: now,
        updatedAt: now,
      };

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();
          await pool.query(
            `INSERT INTO vendor_subscriptions (
              id, subscription_id, application_id, vendor_name, vendor_mobile,
              vendor_email, city, state, plan_tier, plan_name, billing_cycle,
              status, start_date, end_date, territory_scope, has_exclusivity,
              order_id, cf_order_id, cf_payment_id, payment_session_id,
              payment_method, payment_status, base_amount, gateway_fee,
              gst_amount, total_amount, currency, paid_at, admin_notes,
              created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
            ON CONFLICT (subscription_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()`,
            [
              newSub.id,
              newSub.subscriptionId,
              newSub.applicationId,
              newSub.vendorName,
              newSub.vendorMobile,
              newSub.vendorEmail || null,
              newSub.city,
              newSub.state || null,
              newSub.planTier,
              newSub.planName,
              newSub.billingCycle,
              newSub.status,
              new Date(newSub.startDate),
              newSub.endDate ? new Date(newSub.endDate) : null,
              newSub.territoryScope || null,
              newSub.hasExclusivity,
              newSub.orderId,
              newSub.cfOrderId || null,
              newSub.cfPaymentId || null,
              newSub.paymentSessionId || null,
              newSub.paymentMethod || null,
              newSub.paymentStatus,
              newSub.baseAmount,
              newSub.gatewayFee,
              newSub.gstAmount,
              newSub.totalAmount,
              newSub.currency,
              newSub.paidAt ? new Date(newSub.paidAt) : null,
              newSub.adminNotes || null,
              new Date(newSub.createdAt),
              new Date(newSub.updatedAt),
            ]
          );
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres subscription insert error:", e.message);
        }
      }

      const local = readLocalStore();
      if (!local.vendorSubscriptions) local.vendorSubscriptions = [];
      local.vendorSubscriptions.unshift(newSub);
      local.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        action: "VENDOR_SUBSCRIPTION_CREATED",
        details: `Created subscription ${newSub.subscriptionId} for ${newSub.vendorName}`,
        timestamp: now,
      });
      writeLocalStore(local);

      return newSub;
    },

    async update(id: string, updates: Partial<VendorSubscription>): Promise<VendorSubscription | null> {
      const now = new Date().toISOString();
      const pool = await getDbPool();

      if (pool) {
        try {
          await initTables();
          const setClauses: string[] = ["updated_at = NOW()"];
          const values: any[] = [];
          let idx = 1;

          if (updates.status !== undefined) {
            setClauses.push(`status = $${idx++}`);
            values.push(updates.status);
          }
          if (updates.paymentStatus !== undefined) {
            setClauses.push(`payment_status = $${idx++}`);
            values.push(updates.paymentStatus);
          }
          if (updates.adminNotes !== undefined) {
            setClauses.push(`admin_notes = $${idx++}`);
            values.push(updates.adminNotes);
          }
          if (updates.planTier !== undefined) {
            setClauses.push(`plan_tier = $${idx++}`);
            values.push(updates.planTier);
          }
          if (updates.planName !== undefined) {
            setClauses.push(`plan_name = $${idx++}`);
            values.push(updates.planName);
          }
          if (updates.endDate !== undefined) {
            setClauses.push(`end_date = $${idx++}`);
            values.push(updates.endDate ? new Date(updates.endDate) : null);
          }

          values.push(id);
          const sql = `UPDATE vendor_subscriptions SET ${setClauses.join(", ")} WHERE id = $${idx} OR subscription_id = $${idx} OR order_id = $${idx}`;
          await pool.query(sql, values);
        } catch (e: any) {
          console.warn("[ADMIN DB] Error updating postgres vendor subscription:", e.message);
        }
      }

      const local = readLocalStore();
      if (!local.vendorSubscriptions) local.vendorSubscriptions = [];
      const index = local.vendorSubscriptions.findIndex(
        (s) => s.id === id || s.subscriptionId === id || s.orderId === id
      );
      if (index !== -1) {
        local.vendorSubscriptions[index] = {
          ...local.vendorSubscriptions[index],
          ...updates,
          updatedAt: now,
        };
        local.auditLogs.unshift({
          id: `audit-${Date.now()}`,
          action: "VENDOR_SUBSCRIPTION_UPDATED",
          details: `Updated subscription ${id}`,
          timestamp: now,
        });
        writeLocalStore(local);
        return local.vendorSubscriptions[index];
      }

      return adminDb.subscription.getById(id);
    },

    async delete(id: string): Promise<boolean> {
      const pool = await getDbPool();
      if (pool) {
        try {
          await pool.query(
            "DELETE FROM vendor_subscriptions WHERE id = $1 OR subscription_id = $1 OR order_id = $1",
            [id]
          );
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres subscription delete failed:", e.message);
        }
      }

      const local = readLocalStore();
      if (local.vendorSubscriptions) {
        const prevLen = local.vendorSubscriptions.length;
        local.vendorSubscriptions = local.vendorSubscriptions.filter(
          (s) => s.id !== id && s.subscriptionId !== id && s.orderId !== id
        );
        if (local.vendorSubscriptions.length !== prevLen) {
          writeLocalStore(local);
        }
      }
      return true;
    },
  },

  ticket: {
    async getAll(filters?: { status?: string; query?: string; applicationId?: string }): Promise<PlanChangeTicket[]> {
      const pool = await getDbPool();
      let pgTickets: PlanChangeTicket[] = [];

      if (pool) {
        try {
          await initTables();
          let sql = "SELECT * FROM plan_change_tickets WHERE 1=1";
          const values: any[] = [];
          let idx = 1;

          if (filters?.applicationId) {
            sql += ` AND (LOWER(application_id) = LOWER($${idx}) OR vendor_mobile = $${idx})`;
            values.push(filters.applicationId);
            idx++;
          }
          if (filters?.status && filters.status !== "all") {
            sql += ` AND UPPER(status) = UPPER($${idx++})`;
            values.push(filters.status);
          }
          if (filters?.query) {
            sql += ` AND (
              LOWER(ticket_id) LIKE LOWER($${idx})
              OR LOWER(application_id) LIKE LOWER($${idx})
              OR LOWER(vendor_name) LIKE LOWER($${idx})
              OR vendor_mobile LIKE $${idx}
              OR LOWER(current_plan) LIKE LOWER($${idx})
              OR LOWER(requested_plan) LIKE LOWER($${idx})
            )`;
            values.push(`%${filters.query}%`);
            idx++;
          }
          sql += " ORDER BY created_at DESC";

          const res = await pool.query(sql, values);
          pgTickets = res.rows.map((r) => ({
            id: r.id,
            ticketId: r.ticket_id,
            applicationId: r.application_id,
            vendorName: r.vendor_name,
            vendorMobile: r.vendor_mobile,
            vendorEmail: r.vendor_email || undefined,
            currentPlan: r.current_plan,
            requestedPlan: r.requested_plan,
            reason: r.reason || undefined,
            status: r.status || "PENDING",
            adminNotes: r.admin_notes || undefined,
            upgradeAmount: r.upgrade_amount != null ? Number(r.upgrade_amount) : undefined,
            gatewayFee: r.gateway_fee != null ? Number(r.gateway_fee) : undefined,
            gstAmount: r.gst_amount != null ? Number(r.gst_amount) : undefined,
            totalAmount: r.total_amount != null ? Number(r.total_amount) : undefined,
            paymentStatus: r.payment_status || undefined,
            paymentId: r.payment_id || undefined,
            paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : undefined,
            newUserId: r.new_user_id || undefined,
            newPassword: r.new_password || undefined,
            approvedAt: r.approved_at ? new Date(r.approved_at).toISOString() : undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          }));
        } catch (e: any) {
          console.warn("[ADMIN DB] Error querying tickets from pg:", e.message);
        }
      }

      const localState = readLocalStore();
      const localTickets = localState.tickets || [];
      const combinedMap = new Map<string, PlanChangeTicket>();

      localTickets.forEach((t) => combinedMap.set(t.ticketId || t.id, t));
      pgTickets.forEach((t) => combinedMap.set(t.ticketId || t.id, t));

      let all = Array.from(combinedMap.values());

      if (filters?.applicationId) {
        const app = filters.applicationId.toLowerCase().trim();
        all = all.filter(
          (t) =>
            (t.applicationId && t.applicationId.toLowerCase() === app) ||
            t.vendorMobile === filters.applicationId
        );
      }
      if (filters?.status && filters.status !== "all") {
        all = all.filter((t) => (t.status || "").toUpperCase() === filters.status?.toUpperCase());
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase().trim();
        all = all.filter(
          (t) =>
            t.ticketId.toLowerCase().includes(q) ||
            t.applicationId.toLowerCase().includes(q) ||
            t.vendorName.toLowerCase().includes(q) ||
            t.vendorMobile.includes(q)
        );
      }

      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return all;
    },

    async getById(ticketId: string): Promise<PlanChangeTicket | null> {
      const all = await adminDb.ticket.getAll();
      return all.find((t) => t.ticketId === ticketId || t.id === ticketId) || null;
    },

    // -------------------------------------------------------------
    // STEP 1: APPROVE PLAN CHANGE REQUEST (Enables Vendor "Pay Now")
    // -------------------------------------------------------------
    async step1ApprovePlan(
      ticketId: string,
      adminNotes?: string
    ): Promise<PlanChangeTicket> {
      const ticket = await adminDb.ticket.getById(ticketId);
      if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

      const currPlanKey = (ticket.currentPlan || "silver").toLowerCase();
      const newPlanKey = (ticket.requestedPlan || "gold").toLowerCase();

      const getBaseAmount = (tier: string) =>
        tier === "silver" ? 10000 : tier === "platinum" ? 50000 : 20000;

      const currBase = getBaseAmount(currPlanKey);
      const newBase = getBaseAmount(newPlanKey);

      // Upgrade payment requirement: Vendor pays the full new plan value
      const upgradeAmount = newBase;
      const gatewayFee = Math.round(upgradeAmount * 0.03);
      const gstAmount = Math.round(upgradeAmount * 0.05);
      const totalAmount = upgradeAmount + gatewayFee + gstAmount;

      const newPlanName =
        newPlanKey === "silver"
          ? "Silver Partner (Booking Kiosk)"
          : newPlanKey === "platinum"
          ? "Platinum Partner (Regional Master Hub)"
          : "Gold Partner (District Exclusive Hub)";

      const now = new Date().toISOString();
      const notes =
        adminNotes ||
        `Approved by Admin HQ. Upgrade to ${newPlanName} confirmed. Upgrade fee: ₹${totalAmount.toLocaleString(
          "en-IN"
        )} payable by vendor.`;

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();
          await pool.query(
            `UPDATE plan_change_tickets
             SET status = 'AWAITING_PAYMENT',
                 payment_status = $1,
                 upgrade_amount = $2,
                 gateway_fee = $3,
                 gst_amount = $4,
                 total_amount = $5,
                 admin_notes = $6,
                 updated_at = NOW()
             WHERE ticket_id = $7 OR id = $7`,
            [
              totalAmount === 0 ? "PAID" : "UNPAID",
              upgradeAmount,
              gatewayFee,
              gstAmount,
              totalAmount,
              notes,
              ticketId,
            ]
          );
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres step1ApprovePlan error:", e.message);
        }
      }

      const localState = readLocalStore();
      if (!localState.tickets) localState.tickets = [];
      const tIdx = localState.tickets.findIndex((t) => t.ticketId === ticketId || t.id === ticketId);
      const updatedTicket: PlanChangeTicket = {
        ...ticket,
        status: "AWAITING_PAYMENT",
        paymentStatus: totalAmount === 0 ? "PAID" : "UNPAID",
        upgradeAmount,
        gatewayFee,
        gstAmount,
        totalAmount,
        adminNotes: notes,
        updatedAt: now,
      };
      if (tIdx !== -1) {
        localState.tickets[tIdx] = updatedTicket;
      } else {
        localState.tickets.push(updatedTicket);
      }
      writeLocalStore(localState);

      await logAdminActivity({
        actionType: "STATUS_CHANGE",
        entityType: "ticket",
        entityId: updatedTicket.ticketId,
        title: `Ticket #${updatedTicket.ticketId} Approved (Awaiting Payment)`,
        details: `Approved plan upgrade to ${updatedTicket.requestedPlan} for ${updatedTicket.vendorName}. Total amount: ₹${totalAmount}`,
      });

      return updatedTicket;
    },

    // -------------------------------------------------------------
    // MARK PAYMENT AS RECEIVED (Offline or Direct Confirmation)
    // -------------------------------------------------------------
    async markPaymentReceived(
      ticketId: string,
      paymentId?: string
    ): Promise<PlanChangeTicket> {
      const ticket = await adminDb.ticket.getById(ticketId);
      if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

      const now = new Date().toISOString();
      const payRef = paymentId || `CF_UPG_${Date.now().toString().slice(-8)}`;

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();
          await pool.query(
            `UPDATE plan_change_tickets
             SET status = 'PAYMENT_COMPLETED',
                 payment_status = 'PAID',
                 payment_id = $1,
                 paid_at = NOW(),
                 updated_at = NOW()
             WHERE ticket_id = $2 OR id = $2`,
            [payRef, ticketId]
          );
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres markPaymentReceived error:", e.message);
        }
      }

      const localState = readLocalStore();
      if (!localState.tickets) localState.tickets = [];
      const tIdx = localState.tickets.findIndex((t) => t.ticketId === ticketId || t.id === ticketId);
      const updatedTicket: PlanChangeTicket = {
        ...ticket,
        status: "PAYMENT_COMPLETED",
        paymentStatus: "PAID",
        paymentId: payRef,
        paidAt: now,
        updatedAt: now,
      };
      if (tIdx !== -1) {
        localState.tickets[tIdx] = updatedTicket;
      } else {
        localState.tickets.push(updatedTicket);
      }
      writeLocalStore(localState);

      await logAdminActivity({
        actionType: "PAYMENT_RECORDED",
        entityType: "ticket",
        entityId: updatedTicket.ticketId,
        title: `Ticket #${updatedTicket.ticketId} Payment Verified`,
        details: `Verified payment of ₹${updatedTicket.totalAmount || 0} for upgrade ticket #${updatedTicket.ticketId} (Ref: ${payRef})`,
      });

      return updatedTicket;
    },

    // -------------------------------------------------------------
    // STEP 2: CONFIRM PAYMENT & ISSUE UPGRADED LOGIN CREDENTIALS
    // -------------------------------------------------------------
    async step2ConfirmPaymentAndIssueCredentials(
      ticketId: string,
      adminNotes?: string
    ): Promise<{
      ticket: PlanChangeTicket;
      newCredentials: { userId: string; password: string; planName: string };
    }> {
      const ticket = await adminDb.ticket.getById(ticketId);
      if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

      const newPlanKey = (ticket.requestedPlan || "gold").toLowerCase();
      let normalizedTier: "silver" | "gold" | "platinum" = "silver";
      if (newPlanKey.includes("plat")) normalizedTier = "platinum";
      else if (newPlanKey.includes("gold")) normalizedTier = "gold";
      else normalizedTier = "silver";

      const newPlanName =
        normalizedTier === "silver"
          ? "Silver Partner (Booking Kiosk)"
          : normalizedTier === "platinum"
          ? "Platinum Partner (Regional Master Hub)"
          : "Gold Partner (District Exclusive Hub)";
      const newScope =
        normalizedTier === "silver"
          ? "Local Ward / Pin Code Hub"
          : normalizedTier === "platinum"
          ? "State / Regional Master Territory"
          : "Exclusive District Hub";

      const baseAmount = normalizedTier === "silver" ? 10000 : normalizedTier === "platinum" ? 50000 : 20000;
      const gatewayFee = Math.round(baseAmount * 0.03);
      const gstAmount = Math.round(baseAmount * 0.05);
      const totalAmount = baseAmount + gatewayFee + gstAmount;

      const uniqueSuffix = ticket.ticketId.slice(-4) || ticket.applicationId.slice(-4);
      const newUserId = `BB-${normalizedTier.toUpperCase()}-${uniqueSuffix}`;
      const newPassword = `BroomBoom@${normalizedTier.toUpperCase()}2026`;
      const approvedAt = new Date().toISOString();
      const notes = `${adminNotes || "Payment verified by Admin HQ"}. Plan upgraded to ${newPlanName}. Upgraded credentials issued.`;

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();

          // 1. Update Ticket
          await pool.query(
            `UPDATE plan_change_tickets
             SET status = 'COMPLETED',
                 payment_status = 'PAID',
                 admin_notes = $1,
                 new_user_id = $2,
                 new_password = $3,
                 approved_at = NOW(),
                 updated_at = NOW()
             WHERE ticket_id = $4 OR id = $4`,
            [notes, newUserId, newPassword, ticketId]
          );

          // 2. Remove old user entry and insert new credentials
          await pool.query(
            `DELETE FROM vendor_users WHERE application_id = $1 AND user_id != $2`,
            [ticket.applicationId, newUserId]
          );

          await pool.query(
            `INSERT INTO vendor_users (id, user_id, password, application_id, vendor_name, vendor_mobile, vendor_email, current_plan, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
             ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password, current_plan = EXCLUDED.current_plan, is_active = true, updated_at = NOW()`,
            [
              `user-${Date.now()}`,
              newUserId,
              newPassword,
              ticket.applicationId,
              ticket.vendorName,
              ticket.vendorMobile,
              ticket.vendorEmail || null,
              normalizedTier,
            ]
          );

          // Also update existing user matching applicationId or mobile to new plan
          await pool.query(
            `UPDATE vendor_users SET current_plan = $1, updated_at = NOW() WHERE LOWER(application_id) = LOWER($2) OR vendor_mobile = $3 OR user_id = $4`,
            [normalizedTier, ticket.applicationId, ticket.vendorMobile, newUserId]
          );

          // 3. Update VendorSubscription
          const subRes = await pool.query(
            `UPDATE vendor_subscriptions
             SET plan_tier = $1, plan_name = $2, territory_scope = $3, has_exclusivity = $4,
                 status = 'active', payment_status = 'PAID',
                 base_amount = $5, gateway_fee = $6, gst_amount = $7, total_amount = $8,
                 admin_notes = CONCAT(COALESCE(admin_notes, ''), ' | Upgraded to ', $2, ' via Ticket ', $9),
                 updated_at = NOW()
             WHERE LOWER(application_id) = LOWER($10) OR vendor_mobile = $11`,
            [
              normalizedTier,
              newPlanName,
              newScope,
              normalizedTier !== "silver",
              baseAmount,
              gatewayFee,
              gstAmount,
              totalAmount,
              ticket.ticketId,
              ticket.applicationId,
              ticket.vendorMobile,
            ]
          );

          if (subRes.rowCount === 0) {
            await pool.query(
              `INSERT INTO vendor_subscriptions (
                id, subscription_id, application_id, vendor_name, vendor_mobile, vendor_email,
                city, state, plan_tier, plan_name, billing_cycle, status, start_date,
                has_exclusivity, order_id, payment_status, base_amount, gateway_fee, gst_amount, total_amount, currency, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, 'Kolkata', 'West Bengal', $6, $7, 'annual', 'active', NOW(), $8, $9, 'PAID', $10, $11, $12, $13, 'INR', NOW(), NOW()
              )`,
              [
                `SUB-BB-2026-${ticket.applicationId.slice(-4)}`,
                ticket.applicationId,
                ticket.vendorName,
                ticket.vendorMobile,
                ticket.vendorEmail || null,
                normalizedTier,
                newPlanName,
                normalizedTier !== "silver",
                `ORD-BB-${Date.now().toString().slice(-6)}`,
                baseAmount,
                gatewayFee,
                gstAmount,
                totalAmount,
              ]
            );
          }

          // 4. Update VendorLead
          await pool.query(
            `UPDATE vendor_leads
             SET preferred_package = $1, package_name = $2, status = 'approved',
                 admin_notes = CONCAT(COALESCE(admin_notes, ''), ' | Upgraded to ', $2, ' (Ticket ', $3, ')'),
                 updated_at = NOW()
             WHERE LOWER(application_id) = LOWER($4) OR mobile = $5`,
            [normalizedTier, newPlanName, ticket.ticketId, ticket.applicationId, ticket.vendorMobile]
          );
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres ticket approval error:", e.message);
        }
      }

      // Update local store fallback
      const localState = readLocalStore();
      if (!localState.tickets) localState.tickets = [];
      const tIdx = localState.tickets.findIndex((t) => t.ticketId === ticketId || t.id === ticketId);
      const updatedTicket: PlanChangeTicket = {
        ...ticket,
        status: "COMPLETED",
        paymentStatus: "PAID",
        adminNotes: notes,
        newUserId,
        newPassword,
        approvedAt,
        updatedAt: approvedAt,
      };
      if (tIdx !== -1) {
        localState.tickets[tIdx] = updatedTicket;
      } else {
        localState.tickets.push(updatedTicket);
      }

      // Update local vendor lead if present
      const leadIdx = localState.vendorLeads.findIndex(
        (l) => l.applicationId === ticket.applicationId || l.mobile === ticket.vendorMobile
      );
      if (leadIdx !== -1) {
        localState.vendorLeads[leadIdx].preferredPackage = normalizedTier;
        localState.vendorLeads[leadIdx].packageName = newPlanName;
        localState.vendorLeads[leadIdx].status = "approved";
      }

      // Update local vendor subscriptions
      if (!localState.vendorSubscriptions) localState.vendorSubscriptions = [];
      const subIdx = localState.vendorSubscriptions.findIndex(
        (s) =>
          (s.applicationId && s.applicationId.toLowerCase() === ticket.applicationId.toLowerCase()) ||
          s.vendorMobile === ticket.vendorMobile
      );
      if (subIdx !== -1) {
        localState.vendorSubscriptions[subIdx] = {
          ...localState.vendorSubscriptions[subIdx],
          planTier: normalizedTier,
          planName: newPlanName,
          baseAmount,
          gatewayFee,
          gstAmount,
          totalAmount,
          updatedAt: approvedAt,
        };
      }

      // Update local vendor users
      if (!localState.vendorUsers) localState.vendorUsers = [];
      localState.vendorUsers = localState.vendorUsers.filter(
        (u) => u.applicationId !== ticket.applicationId || u.userId === newUserId
      );
      localState.vendorUsers.push({
        id: `user-${Date.now()}`,
        userId: newUserId,
        password: newPassword,
        applicationId: ticket.applicationId,
        vendorName: ticket.vendorName,
        vendorMobile: ticket.vendorMobile,
        vendorEmail: ticket.vendorEmail,
        currentPlan: normalizedTier,
        isActive: true,
        createdAt: approvedAt,
        updatedAt: approvedAt,
      });

      writeLocalStore(localState);

      await logAdminActivity({
        actionType: "TICKET_APPROVED",
        entityType: "ticket",
        entityId: updatedTicket.ticketId,
        title: `Ticket #${updatedTicket.ticketId} Approved & Upgraded to ${newPlanName}`,
        details: `Issued upgraded credentials (${newUserId}) for ${updatedTicket.vendorName} (${updatedTicket.applicationId})`,
      });

      return {
        ticket: updatedTicket,
        newCredentials: {
          userId: newUserId,
          password: newPassword,
          planName: newPlanName,
        },
      };
    },

    // Alias for backward compatibility
    async approve(ticketId: string, adminNotes?: string) {
      return adminDb.ticket.step2ConfirmPaymentAndIssueCredentials(ticketId, adminNotes);
    },

    async reject(ticketId: string, adminNotes?: string): Promise<PlanChangeTicket> {
      const ticket = await adminDb.ticket.getById(ticketId);
      if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

      const now = new Date().toISOString();
      const notes = adminNotes || "Plan change request rejected by Admin HQ Operations.";

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();
          await pool.query(
            `UPDATE plan_change_tickets SET status = 'REJECTED', admin_notes = $1, updated_at = NOW() WHERE ticket_id = $2 OR id = $2`,
            [notes, ticketId]
          );
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres ticket reject error:", e.message);
        }
      }

      const localState = readLocalStore();
      if (!localState.tickets) localState.tickets = [];
      const tIdx = localState.tickets.findIndex((t) => t.ticketId === ticketId || t.id === ticketId);
      const updatedTicket: PlanChangeTicket = {
        ...ticket,
        status: "REJECTED",
        adminNotes: notes,
        updatedAt: now,
      };
      if (tIdx !== -1) {
        localState.tickets[tIdx] = updatedTicket;
      } else {
        localState.tickets.push(updatedTicket);
      }
      writeLocalStore(localState);

      await logAdminActivity({
        actionType: "TICKET_REJECTED",
        entityType: "ticket",
        entityId: updatedTicket.ticketId,
        title: `Ticket #${updatedTicket.ticketId} Rejected`,
        details: `Rejected plan change request for ${updatedTicket.vendorName}. Reason: ${notes}`,
      });

      return updatedTicket;
    },
  },

  vendorUser: {
    async getAll(): Promise<VendorUser[]> {
      const pool = await getDbPool();
      let pgUsers: VendorUser[] = [];
      if (pool) {
        try {
          await initTables();
          const res = await pool.query("SELECT * FROM vendor_users ORDER BY created_at DESC");
          pgUsers = res.rows.map((r) => ({
            id: r.id,
            userId: r.user_id,
            password: r.password,
            applicationId: r.application_id,
            vendorName: r.vendor_name,
            vendorMobile: r.vendor_mobile,
            vendorEmail: r.vendor_email || undefined,
            currentPlan: r.current_plan,
            isActive: r.is_active !== false,
            lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : undefined,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          }));
        } catch (e: any) {
          console.warn("[ADMIN DB] Error querying vendor users:", e.message);
        }
      }

      const local = readLocalStore();
      const localUsers = local.vendorUsers || [];
      const map = new Map<string, VendorUser>();
      localUsers.forEach((u) => map.set(u.userId, u));
      pgUsers.forEach((u) => map.set(u.userId, u));
      return Array.from(map.values());
    },

    async getByAppOrMobile(appIdOrMobile: string): Promise<VendorUser | null> {
      const all = await adminDb.vendorUser.getAll();
      return (
        all.find(
          (u) =>
            (u.applicationId && u.applicationId.toLowerCase() === appIdOrMobile.toLowerCase()) ||
            u.vendorMobile === appIdOrMobile ||
            u.userId.toLowerCase() === appIdOrMobile.toLowerCase()
        ) || null
      );
    },

    async generateCredentials(
      applicationId: string,
      planTier?: string,
      customPassword?: string
    ): Promise<VendorUser> {
      const lead = await adminDb.vendor.getById(applicationId);

      // Strictly normalize plan tier based on lead or input
      const candidatePlan = (
        planTier ||
        lead?.preferredPackage ||
        lead?.packageName ||
        "silver"
      ).toLowerCase();

      let normalizedTier: "silver" | "gold" | "platinum" = "silver";
      if (candidatePlan.includes("plat")) {
        normalizedTier = "platinum";
      } else if (candidatePlan.includes("gold")) {
        normalizedTier = "gold";
      } else {
        normalizedTier = "silver";
      }

      const uniqueSuffix = applicationId.replace(/[^0-9]/g, "").slice(-4) || Date.now().toString().slice(-4);
      const userId = `BB-${normalizedTier.toUpperCase()}-${uniqueSuffix}`;
      const password = customPassword || `BroomBoom@${normalizedTier.toUpperCase()}2026`;
      const now = new Date().toISOString();

      const user: VendorUser = {
        id: `user-${Date.now()}`,
        userId,
        password,
        applicationId,
        vendorName: lead?.fullName || "Valued Partner",
        vendorMobile: lead?.mobile || "9999999999",
        vendorEmail: lead?.email,
        currentPlan: normalizedTier,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();

          // Remove any outdated user for this applicationId with a different tier userId
          await pool.query(
            `DELETE FROM vendor_users WHERE application_id = $1 AND user_id != $2`,
            [applicationId, userId]
          );

          await pool.query(
            `INSERT INTO vendor_users (id, user_id, password, application_id, vendor_name, vendor_mobile, vendor_email, current_plan, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
             ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password, current_plan = EXCLUDED.current_plan, is_active = true, updated_at = NOW()`,
            [
              user.id,
              user.userId,
              user.password,
              user.applicationId,
              user.vendorName,
              user.vendorMobile,
              user.vendorEmail || null,
              user.currentPlan,
            ]
          );

          // Ensure active PAID subscription exists in PG for vendor portal access
          const subCheck = await pool.query(
            `SELECT id FROM vendor_subscriptions WHERE LOWER(application_id) = LOWER($1) OR vendor_mobile = $2`,
            [applicationId, user.vendorMobile]
          );
          if (subCheck.rowCount === 0) {
            const baseAmount = normalizedTier === "silver" ? 10000 : normalizedTier === "platinum" ? 50000 : 20000;
            const gatewayFee = Math.round(baseAmount * 0.03);
            const gstAmount = Math.round(baseAmount * 0.05);
            const totalAmount = baseAmount + gatewayFee + gstAmount;
            const planName = lead?.packageName || `${normalizedTier.toUpperCase()} Partner`;
            await pool.query(
              `INSERT INTO vendor_subscriptions (
                id, subscription_id, application_id, vendor_name, vendor_mobile, vendor_email,
                city, state, plan_tier, plan_name, billing_cycle, status, start_date,
                has_exclusivity, order_id, payment_status, base_amount, gateway_fee, gst_amount, total_amount, currency, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'annual', 'active', NOW(), true, $10, 'PAID', $11, $12, $13, $14, 'INR', NOW(), NOW()
              )`,
              [
                `SUB-BB-2026-${applicationId.slice(-4)}`,
                applicationId,
                user.vendorName,
                user.vendorMobile,
                user.vendorEmail || null,
                lead?.city || "Kolkata",
                lead?.state || "West Bengal",
                normalizedTier,
                planName,
                `ORD-BB-${Date.now().toString().slice(-6)}`,
                baseAmount,
                gatewayFee,
                gstAmount,
                totalAmount,
              ]
            );
          }
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres generateCredentials error:", e.message);
        }
      }

      const local = readLocalStore();
      if (!local.vendorUsers) local.vendorUsers = [];
      // Remove any outdated entry for this application
      local.vendorUsers = local.vendorUsers.filter(
        (u) => u.applicationId !== applicationId || u.userId === userId
      );
      const idx = local.vendorUsers.findIndex((u) => u.userId === userId);
      if (idx !== -1) {
        local.vendorUsers[idx] = user;
      } else {
        local.vendorUsers.push(user);
      }
      writeLocalStore(local);

      await logAdminActivity({
        actionType: "CREDENTIALS_GENERATED",
        entityType: "credential",
        entityId: applicationId,
        title: `Credentials Generated: ${userId}`,
        details: `Generated active portal credentials for ${user.vendorName} (${applicationId}) - Plan: ${normalizedTier.toUpperCase()}`,
      });

      return user;
    },

    async saveCredentials(
      applicationId: string,
      userId: string,
      password: string,
      planTier?: string
    ): Promise<VendorUser> {
      const lead = await adminDb.vendor.getById(applicationId);

      const candidatePlan = (
        planTier ||
        lead?.preferredPackage ||
        lead?.packageName ||
        "silver"
      ).toLowerCase();

      let normalizedTier: "silver" | "gold" | "platinum" = "silver";
      if (candidatePlan.includes("plat")) {
        normalizedTier = "platinum";
      } else if (candidatePlan.includes("gold")) {
        normalizedTier = "gold";
      } else {
        normalizedTier = "silver";
      }

      const cleanUserId = userId.trim();
      const cleanPassword = password.trim();
      const now = new Date().toISOString();

      const user: VendorUser = {
        id: `user-${Date.now()}`,
        userId: cleanUserId,
        password: cleanPassword,
        applicationId,
        vendorName: lead?.fullName || "Valued Partner",
        vendorMobile: lead?.mobile || "9999999999",
        vendorEmail: lead?.email,
        currentPlan: normalizedTier,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const pool = await getDbPool();
      if (pool) {
        try {
          await initTables();

          // Check if user already exists for this application_id or mobile
          const existingRes = await pool.query(
            `SELECT id, user_id FROM vendor_users WHERE LOWER(application_id) = LOWER($1) OR vendor_mobile = $2 LIMIT 1`,
            [applicationId, lead?.mobile || ""]
          );

          if (existingRes.rowCount && existingRes.rowCount > 0) {
            const existingId = existingRes.rows[0].id;
            user.id = existingId;
            await pool.query(
              `UPDATE vendor_users 
               SET user_id = $1, password = $2, current_plan = $3, vendor_name = $4, vendor_mobile = $5, vendor_email = $6, is_active = true, updated_at = NOW()
               WHERE id = $7`,
              [
                user.userId,
                user.password,
                user.currentPlan,
                user.vendorName,
                user.vendorMobile,
                user.vendorEmail || null,
                existingId,
              ]
            );
          } else {
            await pool.query(
              `INSERT INTO vendor_users (id, user_id, password, application_id, vendor_name, vendor_mobile, vendor_email, current_plan, is_active, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
               ON CONFLICT (user_id) DO UPDATE SET password = EXCLUDED.password, current_plan = EXCLUDED.current_plan, is_active = true, updated_at = NOW()`,
              [
                user.id,
                user.userId,
                user.password,
                user.applicationId,
                user.vendorName,
                user.vendorMobile,
                user.vendorEmail || null,
                user.currentPlan,
              ]
            );
          }

          // Ensure active PAID subscription exists in PG for vendor portal access
          const subCheck = await pool.query(
            `SELECT id FROM vendor_subscriptions WHERE LOWER(application_id) = LOWER($1) OR vendor_mobile = $2`,
            [applicationId, user.vendorMobile]
          );
          if (subCheck.rowCount === 0) {
            const baseAmount = normalizedTier === "silver" ? 10000 : normalizedTier === "platinum" ? 50000 : 20000;
            const gatewayFee = Math.round(baseAmount * 0.03);
            const gstAmount = Math.round(baseAmount * 0.05);
            const totalAmount = baseAmount + gatewayFee + gstAmount;
            const planName = lead?.packageName || `${normalizedTier.toUpperCase()} Partner`;
            await pool.query(
              `INSERT INTO vendor_subscriptions (
                id, subscription_id, application_id, vendor_name, vendor_mobile, vendor_email,
                city, state, plan_tier, plan_name, billing_cycle, status, start_date,
                has_exclusivity, order_id, payment_status, base_amount, gateway_fee, gst_amount, total_amount, currency, created_at, updated_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'annual', 'active', NOW(), true, $10, 'PAID', $11, $12, $13, $14, 'INR', NOW(), NOW()
              )`,
              [
                `SUB-BB-2026-${applicationId.slice(-4)}`,
                applicationId,
                user.vendorName,
                user.vendorMobile,
                user.vendorEmail || null,
                lead?.city || "Kolkata",
                lead?.state || "West Bengal",
                normalizedTier,
                planName,
                `ORD-BB-${Date.now().toString().slice(-6)}`,
                baseAmount,
                gatewayFee,
                gstAmount,
                totalAmount,
              ]
            );
          } else {
            await pool.query(
              `UPDATE vendor_subscriptions
               SET status = 'active', payment_status = 'PAID', plan_tier = $1, updated_at = NOW()
               WHERE LOWER(application_id) = LOWER($2) OR vendor_mobile = $3`,
              [normalizedTier, applicationId, user.vendorMobile]
            );
          }
        } catch (e: any) {
          console.warn("[ADMIN DB] Postgres saveCredentials error:", e.message);
        }
      }

      const local = readLocalStore();
      if (!local.vendorUsers) local.vendorUsers = [];
      local.vendorUsers = local.vendorUsers.filter(
        (u) => u.applicationId !== applicationId && u.userId !== cleanUserId
      );
      local.vendorUsers.push(user);
      writeLocalStore(local);

      await logAdminActivity({
        actionType: "CREDENTIALS_UPDATED",
        entityType: "credential",
        entityId: applicationId,
        title: `Custom Credentials Saved: ${cleanUserId}`,
        details: `Saved custom credentials for ${user.vendorName} (${applicationId}) - Plan: ${normalizedTier.toUpperCase()}`,
      });

      return user;
    },
  },

  async getGlobalStats() {
    const franchise = await adminDb.franchise.getAll();
    const vendor = await adminDb.vendor.getAll();
    const subscriptions = await adminDb.subscription.getAll();
    const tickets = await adminDb.ticket.getAll();

    const todayStr = new Date().toISOString().slice(0, 10);

    const fNewToday = franchise.filter((l) => l.createdAt.slice(0, 10) === todayStr).length;
    const fContacted = franchise.filter((l) => l.status === "contacted").length;
    const fApproved = franchise.filter((l) => l.status === "approved").length;
    const fSilver = franchise.filter((l) => l.preferredPackage === "silver").length;
    const fGold = franchise.filter((l) => l.preferredPackage === "gold").length;
    const fPlatinum = franchise.filter((l) => l.preferredPackage === "platinum").length;

    const vNewToday = vendor.filter((l) => l.createdAt.slice(0, 10) === todayStr).length;
    const vContacted = vendor.filter((l) => l.status === "contacted").length;
    const vApproved = vendor.filter((l) => l.status === "approved").length;
    const vSilver = vendor.filter((l) => l.preferredPackage === "silver").length;
    const vGold = vendor.filter((l) => l.preferredPackage === "gold").length;
    const vPlatinum = vendor.filter((l) => l.preferredPackage === "platinum").length;

    const subActive = subscriptions.filter((s) => s.status === "active").length;
    const subPending = subscriptions.filter((s) => s.status === "pending").length;
    const subRevenue = subscriptions
      .filter((s) => s.paymentStatus === "PAID" || s.status === "active")
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const subSilver = subscriptions.filter((s) => (s.planTier || "").toLowerCase() === "silver").length;
    const subGold = subscriptions.filter((s) => (s.planTier || "").toLowerCase() === "gold").length;
    const subPlatinum = subscriptions.filter((s) => (s.planTier || "").toLowerCase() === "platinum").length;

    const pendingTickets = tickets.filter((t) => (t.status || "").toUpperCase() === "PENDING").length;

    const cityMap: Record<string, number> = {};
    franchise.forEach((l) => {
      const c = l.city?.trim() || "Other";
      cityMap[c] = (cityMap[c] || 0) + 1;
    });
    vendor.forEach((l) => {
      const c = l.city?.trim() || "Other";
      cityMap[c] = (cityMap[c] || 0) + 1;
    });

    const topCities = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const recentActivity: Array<{
      id: string;
      type: "franchise" | "vendor";
      title: string;
      subtitle: string;
      status: LeadStatus;
      timestamp: string;
    }> = [
      ...franchise.map((l) => ({
        id: l.id,
        type: "franchise" as const,
        title: `${l.fullName} applied for ${l.packageName || `${l.preferredPackage.toUpperCase()} Franchise`}`,
        subtitle: `${l.city}${l.state ? `, ${l.state}` : ""} • ${l.applicationId}`,
        status: l.status,
        timestamp: l.createdAt,
      })),
      ...vendor.map((l) => ({
        id: l.id,
        type: "vendor" as const,
        title: `${l.fullName} registered as ${l.packageName || `${l.preferredPackage.toUpperCase()} Vendor`}`,
        subtitle: `${l.city}${l.state ? `, ${l.state}` : ""} • ${l.applicationId}`,
        status: l.status,
        timestamp: l.createdAt,
      })),
    ]
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    return {
      franchise: {
        total: franchise.length,
        newToday: fNewToday,
        contacted: fContacted,
        approved: fApproved,
        silver: fSilver,
        gold: fGold,
        platinum: fPlatinum,
      },
      vendor: {
        total: vendor.length,
        newToday: vNewToday,
        contacted: vContacted,
        approved: vApproved,
        silver: vSilver,
        gold: vGold,
        platinum: vPlatinum,
      },
      subscriptions: {
        total: subscriptions.length,
        active: subActive,
        pending: subPending,
        totalRevenue: subRevenue,
        silver: subSilver,
        gold: subGold,
        platinum: subPlatinum,
      },
      pendingTickets,
      combined: {
        totalLeads: franchise.length + vendor.length,
        totalNewToday: fNewToday + vNewToday,
        totalApproved: fApproved + vApproved,
        totalContacted: fContacted + vContacted,
      },
      topCities,
      recentActivity,
    };
  },

  activity: {
    log: logAdminActivity,
    getAll: getActivityLogs,
    clear: clearActivityLogs,
  },
};