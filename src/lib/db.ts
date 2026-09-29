import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type {
  Application, AppStatus, Channel, CitizenProfile, Notification, CitizenDocument,
  DocType, Grievance, GrievanceStatus, UserRecord, Role, AuditLogEntry,
} from "./types";
import { SERVICES, DEPARTMENTS, DISTRICTS, service, dept } from "./reference";
import { extractDocument, delayRisk, slaRisk } from "./ai";

// ---------------------------------------------------------------------------
// Connection (singleton across hot reloads)
// ---------------------------------------------------------------------------
// Overridable so tests (and any future multi-environment setup) can point
// at an isolated database instead of the dev server's own data/ directory.
const DATA_DIR = process.env.SEWASETU_DB_DIR ?? path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "sewasetu.db");

declare global {
  // eslint-disable-next-line no-var
  var __sewasetu_db: Database.Database | undefined;
}

function connect(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  migrate(db);
  seed(db);
  return db;
}

// Date.now() alone can collide when two records are created within the same
// millisecond (common in tests, and possible under real concurrent load) —
// this counter guarantees every id generated in this process is unique.
let idCounter = 0;
function genId(prefix: string): string {
  idCounter = (idCounter + 1) % 1000;
  return `${prefix}${Date.now().toString().slice(-8)}${idCounter.toString().padStart(3, "0")}`;
}

export function getDb(): Database.Database {
  if (!global.__sewasetu_db) global.__sewasetu_db = connect();
  return global.__sewasetu_db;
}

/** Wipes and re-seeds the database. Used by `npm run db:reset` / the seed
 *  script — never called from request-handling code. */
export function resetDatabase(): void {
  if (global.__sewasetu_db) {
    global.__sewasetu_db.close();
    global.__sewasetu_db = undefined;
  }
  if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });
  getDb();
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS citizens (
      id TEXT PRIMARY KEY, name TEXT, aadhaarMasked TEXT, phone TEXT,
      districtId TEXT, age INTEGER, gender TEXT, category TEXT,
      annualIncome INTEGER, isBPL INTEGER, isStudent INTEGER, occupation TEXT,
      hasDisability INTEGER, landHectares REAL, isForestDweller INTEGER, household INTEGER
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY, serviceId TEXT, citizenId TEXT, citizenName TEXT,
      districtId TEXT, status TEXT, channel TEXT, assistedBy TEXT,
      submittedAt TEXT, slaDays INTEGER, dueAt TEXT, updatedAt TEXT, autoVerified INTEGER
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, applicationId TEXT, citizenId TEXT, channel TEXT,
      message_en TEXT, message_hi TEXT, createdAt TEXT, read INTEGER,
      type TEXT NOT NULL DEFAULT 'SYSTEM'
    );
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY, citizenId TEXT, type TEXT, label_en TEXT, fileName TEXT,
      fields TEXT, uploadedAt TEXT, verified INTEGER
    );
    CREATE TABLE IF NOT EXISTS grievances (
      id TEXT PRIMARY KEY, applicationId TEXT, citizenId TEXT, serviceName TEXT,
      departmentId TEXT, submittedAt TEXT, slaDays INTEGER, delayDays INTEGER,
      description TEXT, status TEXT, createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS access_log (
      id TEXT PRIMARY KEY, citizenId TEXT, departmentId TEXT, field TEXT, accessedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, phone TEXT, role TEXT,
      districtId TEXT, preferredLanguage TEXT, isActive INTEGER, createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY, actorId TEXT, actorRole TEXT, action TEXT,
      entityType TEXT, entityId TEXT, metadata TEXT, createdAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_apps_citizen ON applications(citizenId);
    CREATE INDEX IF NOT EXISTS idx_apps_service ON applications(serviceId);
    CREATE INDEX IF NOT EXISTS idx_apps_district ON applications(districtId);
    CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_apps_submitted ON applications(submittedAt);
    CREATE INDEX IF NOT EXISTS idx_docs_citizen ON documents(citizenId);
    CREATE INDEX IF NOT EXISTS idx_griev_citizen ON grievances(citizenId);
    CREATE INDEX IF NOT EXISTS idx_notif_citizen ON notifications(citizenId);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actorId);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(createdAt);
    CREATE INDEX IF NOT EXISTS idx_citizens_district ON citizens(districtId);
  `);

  // notifications.type was added after the table first shipped — backfill
  // the column for any database created by an earlier version of the app.
  const cols = db.prepare("PRAGMA table_info(notifications)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "type")) {
    db.exec("ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'SYSTEM'");
  }
}

// ---------------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------------
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Sunita", "Ramesh", "Phoolwati", "Dinesh", "Jamuna", "Santram", "Budhri", "Mahesh", "Sukhmati", "Rajkumar", "Kaushalya", "Bhupendra", "Lakshmi", "Chhannu", "Parvati", "Ganpat", "Itwari", "Somaru", "Devki", "Hariram", "Anita", "Suresh", "Rekha", "Manoj", "Sarita", "Ajay", "Kiran", "Vinod", "Meena", "Ashok"];
const LAST = ["Netam", "Kashyap", "Baghel", "Sahu", "Markam", "Yadav", "Nag", "Dhurwa", "Verma", "Korram", "Sori", "Mandavi", "Dewangan", "Patel", "Uikey", "Kunjam", "Oyam", "Vaishnav", "Gond", "Thakur"];
const OPERATORS = ["CHOICE Op. Rekha", "CSC Op. Arjun", "Bank Sakhi Meena", "CSC Op. Dilip", "CHOICE Op. Farida"];
const OCCUPATIONS: CitizenProfile["occupation"][] = ["farmer", "labour", "self_employed", "salaried", "student", "unemployed"];
const CATEGORIES: CitizenProfile["category"][] = ["general", "obc", "sc", "st"];

/** Builds one synthetic (never real) citizen profile, biased so tribal/LWE
 *  districts skew ST/forest-dweller and plains districts skew general/OBC —
 *  mirrors the real demographic pattern without using any real data. */
function genCitizen(id: string, districtId: string, rnd: () => number, pick: <T>(a: T[]) => T): CitizenProfile {
  const d = DISTRICTS.find((x) => x.id === districtId)!;
  const category: CitizenProfile["category"] = d.region !== "plains" && rnd() < 0.55 ? "st" : pick(CATEGORIES);
  const occupation = pick(OCCUPATIONS);
  const age = 18 + Math.floor(rnd() * 58);
  const isStudent = occupation === "student" || (age < 24 && rnd() < 0.3);
  return {
    id, name: `${pick(FIRST)} ${pick(LAST)}`,
    aadhaarMasked: `XXXX XXXX ${1000 + Math.floor(rnd() * 8999)}`,
    phone: `+91 9${Math.floor(1000000 + rnd() * 8999999)}`,
    districtId, age, gender: rnd() < 0.5 ? "female" : "male", category,
    annualIncome: Math.round(15000 + rnd() * 180000),
    isBPL: rnd() < 0.5, isStudent, occupation,
    hasDisability: rnd() < 0.06,
    landHectares: occupation === "farmer" ? Math.round(rnd() * 3 * 10) / 10 : 0,
    isForestDweller: category === "st" && d.region !== "plains" && rnd() < 0.6,
    household: 1 + Math.floor(rnd() * 6),
  };
}

function seed(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) c FROM citizens").get() as { c: number }).c;
  if (count > 0) return;

  const rnd = mulberry32(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const now = Date.now();

  const insCit = db.prepare(`INSERT INTO citizens VALUES (@id,@name,@aadhaarMasked,@phone,@districtId,@age,@gender,@category,@annualIncome,@isBPL,@isStudent,@occupation,@hasDisability,@landHectares,@isForestDweller,@household)`);

  // The two "principal" demo citizens — deliberately rich so the eligibility
  // engine and the citizen-side UI (hardcoded to citizenId "demo") light up.
  const demo: CitizenProfile = {
    id: "demo", name: "Sukhmati Kashyap", aadhaarMasked: "XXXX XXXX 4821", phone: "+91 94255 1xxxx",
    districtId: "bastar", age: 63, gender: "female", category: "st", annualIncome: 42000,
    isBPL: true, isStudent: false, occupation: "farmer", hasDisability: false,
    landHectares: 0.4, isForestDweller: true, household: 2,
  };
  const student: CitizenProfile = {
    id: "cit_student", name: "Dinesh Markam", aadhaarMasked: "XXXX XXXX 7733", phone: "+91 90985 2xxxx",
    districtId: "kanker", age: 19, gender: "male", category: "st", annualIncome: 68000,
    isBPL: true, isStudent: true, occupation: "student", hasDisability: false,
    landHectares: 0, isForestDweller: false, household: 5,
  };
  insCit.run(toRow(demo));
  insCit.run(toRow(student));

  // ~58 more synthetic citizens: 2 guaranteed per district, the rest spread
  // by population weight — so every district has real, inspectable records
  // for the admin portal, and the bulk application seed below can reference
  // real citizens instead of orphan ids.
  const generated: CitizenProfile[] = [];
  let gi = 0;
  for (const d of DISTRICTS) {
    for (let k = 0; k < 2; k++) generated.push(genCitizen(`cit_gen_${gi++}`, d.id, rnd, pick));
  }
  const totalPop = DISTRICTS.reduce((s, d) => s + d.population, 0);
  while (generated.length < 60) {
    let r = rnd() * totalPop;
    let chosen = DISTRICTS[0];
    for (const d of DISTRICTS) { r -= d.population; if (r <= 0) { chosen = d; break; } }
    generated.push(genCitizen(`cit_gen_${gi++}`, chosen.id, rnd, pick));
  }
  for (const c of generated) insCit.run(toRow(c));

  const citizenPool = [demo, student, ...generated];
  const byDistrict = new Map<string, CitizenProfile[]>();
  for (const c of citizenPool) byDistrict.set(c.districtId, [...(byDistrict.get(c.districtId) ?? []), c]);

  const insApp = db.prepare(`INSERT INTO applications VALUES (@id,@serviceId,@citizenId,@citizenName,@districtId,@status,@channel,@assistedBy,@submittedAt,@slaDays,@dueAt,@updatedAt,@autoVerified)`);

  const rows: Application[] = [];
  let n = 0;

  // Bulk realistic applications across the state for the MIS — each one now
  // references a REAL citizen row (not an orphan id), so the admin portal's
  // citizen drill-down actually has applications to show.
  for (const d of DISTRICTS) {
    const base = Math.round((d.population / 100) * (0.5 + d.digitalReadiness / 100));
    const volume = Math.max(6, Math.min(34, base));
    const pool = byDistrict.get(d.id) ?? [demo];
    for (let i = 0; i < volume; i++) {
      const svc = weightedService(rnd);
      const citizen = pick(pool);
      const ageDays = Math.floor(rnd() * 90);
      const submittedAt = new Date(now - ageDays * 864e5);
      const dueAt = new Date(submittedAt.getTime() + svc.slaDays * 864e5);
      const status = rollStatus(rnd, ageDays, svc.slaDays, d.digitalReadiness);
      const channel = rollChannel(rnd, d.region);
      rows.push({
        id: `A${(1000 + n++).toString()}`,
        serviceId: svc.id,
        citizenId: citizen.id,
        citizenName: citizen.name,
        districtId: d.id,
        status,
        channel,
        assistedBy: channel === "assisted" ? pick(OPERATORS) : null,
        submittedAt: submittedAt.toISOString(),
        slaDays: svc.slaDays,
        dueAt: dueAt.toISOString(),
        updatedAt: new Date(submittedAt.getTime() + Math.floor(rnd() * ageDays) * 864e5).toISOString(),
        autoVerified: rnd() < 0.72 ? 1 : 0,
      });
    }
  }

  // Demo citizen's own applications, in varied states for the tracker.
  const demoApps: [string, AppStatus, number, Channel][] = [
    ["old_pension", "in_review", 12, "assisted"],
    ["caste_cert", "delivered", 40, "whatsapp"],
    ["forest_rights", "auto_verifying", 3, "voice"],
  ];
  for (const [sid, st, ageDays, ch] of demoApps) {
    const svc = service(sid);
    const submittedAt = new Date(now - ageDays * 864e5);
    rows.push({
      id: `A${(1000 + n++).toString()}`,
      serviceId: sid, citizenId: "demo", citizenName: demo.name, districtId: demo.districtId,
      status: st, channel: ch, assistedBy: ch === "assisted" ? "CHOICE Op. Rekha" : null,
      submittedAt: submittedAt.toISOString(), slaDays: svc.slaDays,
      dueAt: new Date(submittedAt.getTime() + svc.slaDays * 864e5).toISOString(),
      updatedAt: new Date().toISOString(), autoVerified: 1,
    });
  }

  const insMany = db.transaction((items: Application[]) => {
    for (const a of items) insApp.run(a as unknown as Record<string, unknown>);
  });
  insMany(rows);

  // Notifications for the demo citizen.
  const insNote = db.prepare(`INSERT INTO notifications VALUES (@id,@applicationId,@citizenId,@channel,@message_en,@message_hi,@createdAt,@read,@type)`);
  const notes: (Notification & { type: string })[] = [
    { id: "N1", applicationId: "", citizenId: "demo", channel: "whatsapp", message_en: "Your Caste Certificate is issued. Download on WhatsApp.", message_hi: "आपका जाति प्रमाण पत्र जारी हुआ। व्हाट्सएप पर डाउनलोड करें।", createdAt: new Date(now - 2 * 864e5).toISOString(), read: 0, type: "APPLICATION_UPDATE" },
    { id: "N2", applicationId: "", citizenId: "demo", channel: "sms", message_en: "Old Age Pension: documents auto-verified, in review.", message_hi: "वृद्धावस्था पेंशन: दस्तावेज़ सत्यापित, समीक्षा में।", createdAt: new Date(now - 5 * 864e5).toISOString(), read: 1, type: "APPLICATION_UPDATE" },
  ];
  for (const nt of notes) insNote.run(nt as unknown as Record<string, unknown>);

  // Document vault seed for the demo citizen (Feature 4).
  const insDoc = db.prepare(`INSERT INTO documents VALUES (@id,@citizenId,@type,@label_en,@fileName,@fields,@uploadedAt,@verified)`);
  const seedDocs: [DocType, string, number][] = [
    ["aadhaar", "aadhaar_card.jpg", 60],
    ["ration_card", "ration_card_scan.pdf", 55],
    ["land_record", "b1_khasra_copy.pdf", 40],
  ];
  let dn = 0;
  for (const [type, fileName, ageDays] of seedDocs) {
    const ext = extractDocument(fileName);
    insDoc.run({
      id: `D${(100 + dn++).toString()}`, citizenId: "demo", type, label_en: ext.label_en, fileName,
      fields: JSON.stringify(ext.fields), uploadedAt: new Date(now - ageDays * 864e5).toISOString(), verified: 1,
    });
  }

  // Access log seed — Privacy / Trust dashboard (Feature 18).
  const insAccess = db.prepare(`INSERT INTO access_log VALUES (@id,@citizenId,@departmentId,@field,@accessedAt)`);
  const accesses: [string, string, number][] = [
    ["social", "Age, bank account (DBT eligibility check)", 3],
    ["revenue", "Caste certificate record", 12],
    ["food", "Household member count (ration card)", 20],
    ["panchayat", "Gram Sabha forest claim register", 33],
  ];
  let an = 0;
  for (const [d2, field, ageDays] of accesses) {
    insAccess.run({ id: `AC${(1 + an++).toString()}`, citizenId: "demo", departmentId: d2, field, accessedAt: new Date(now - ageDays * 864e5).toISOString() });
  }

  // Canonical demo login accounts (see README "Demo accounts"). The citizen
  // account's id is "demo" on purpose — it IS the citizens.demo row, so every
  // existing citizenId:"demo" reference across the app keeps working.
  const insUser = db.prepare(`INSERT INTO users VALUES (@id,@name,@email,@phone,@role,@districtId,@preferredLanguage,@isActive,@createdAt)`);
  const users: UserRecord[] = [
    { id: "demo", name: demo.name, email: "citizen@demo.com", phone: demo.phone, role: "citizen", districtId: demo.districtId, preferredLanguage: "hi", isActive: 1, createdAt: new Date(now - 200 * 864e5).toISOString() },
    { id: "u_operator_demo", name: "Rekha (CHOICE Operator)", email: "operator@demo.com", phone: "+91 90000 00001", role: "operator", districtId: "bastar", preferredLanguage: "hi", isActive: 1, createdAt: new Date(now - 300 * 864e5).toISOString() },
    { id: "u_officer_demo", name: "Revenue Officer", email: "officer@demo.com", phone: "+91 90000 00002", role: "officer", districtId: null, preferredLanguage: "en", isActive: 1, createdAt: new Date(now - 300 * 864e5).toISOString() },
    { id: "u_admin_demo", name: "System Admin", email: "admin@demo.com", phone: "+91 90000 00003", role: "admin", districtId: null, preferredLanguage: "en", isActive: 1, createdAt: new Date(now - 300 * 864e5).toISOString() },
  ];
  for (const u of users) insUser.run(u);
}

function weightedService(rnd: () => number) {
  const total = SERVICES.reduce((s, x) => s + x.popularity, 0);
  let r = rnd() * total;
  for (const s of SERVICES) {
    r -= s.popularity;
    if (r <= 0) return s;
  }
  return SERVICES[0];
}

function rollStatus(rnd: () => number, ageDays: number, sla: number, readiness: number): AppStatus {
  if (ageDays < 2) return "submitted";
  const processedChance = 0.35 + 0.5 * (readiness / 100); // 0.35..0.85
  if (rnd() < 0.06) return "rejected";
  if (rnd() < processedChance && ageDays > sla * 0.4) {
    return rnd() < 0.7 ? "delivered" : "approved";
  }
  const r = rnd();
  if (r < 0.4) return "in_review";
  if (r < 0.7) return "auto_verifying";
  return "submitted";
}

function rollChannel(rnd: () => number, region: string): Channel {
  const r = rnd();
  if (region === "plains") {
    if (r < 0.45) return "web";
    if (r < 0.8) return "whatsapp";
    if (r < 0.92) return "assisted";
    return "voice";
  }
  // tribal / lwe — assisted & voice dominate (the last-mile story)
  if (r < 0.2) return "web";
  if (r < 0.5) return "whatsapp";
  if (r < 0.85) return "assisted";
  return "voice";
}

function toRow(p: CitizenProfile): Record<string, unknown> {
  return { ...p, isBPL: p.isBPL ? 1 : 0, isStudent: p.isStudent ? 1 : 0, hasDisability: p.hasDisability ? 1 : 0, isForestDweller: p.isForestDweller ? 1 : 0 };
}

function fromRow(r: Record<string, unknown>): CitizenProfile {
  return { ...(r as unknown as CitizenProfile), isBPL: !!r.isBPL, isStudent: !!r.isStudent, hasDisability: !!r.hasDisability, isForestDweller: !!r.isForestDweller };
}

// ---------------------------------------------------------------------------
// Citizens
// ---------------------------------------------------------------------------
export function getCitizen(id: string): CitizenProfile | null {
  const r = getDb().prepare("SELECT * FROM citizens WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return r ? fromRow(r) : null;
}

export function listCitizens(opts: { search?: string; districtId?: string; page?: number; limit?: number } = {}): { rows: CitizenProfile[]; total: number } {
  const db = getDb();
  const limit = Math.min(100, opts.limit ?? 20);
  const page = Math.max(1, opts.page ?? 1);
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (opts.search) { where.push("(name LIKE @q OR id LIKE @q)"); params.q = `%${opts.search}%`; }
  if (opts.districtId) { where.push("districtId = @districtId"); params.districtId = opts.districtId; }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = (db.prepare(`SELECT COUNT(*) c FROM citizens ${clause}`).get(params) as { c: number }).c;
  const rows = db.prepare(`SELECT * FROM citizens ${clause} ORDER BY name LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset: (page - 1) * limit }) as Record<string, unknown>[];
  return { rows: rows.map(fromRow), total };
}

/** Everything the admin portal needs to "inspect" one citizen's data. */
export function getCitizenDetail(id: string) {
  const citizen = getCitizen(id);
  if (!citizen) return null;
  return {
    citizen,
    applications: listApplications(id),
    documents: listDocuments(id),
    grievances: listGrievances(id),
    notifications: listNotifications(id),
  };
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------
export function listApplications(citizenId?: string): Application[] {
  const db = getDb();
  const rows = citizenId
    ? db.prepare("SELECT * FROM applications WHERE citizenId = ? ORDER BY submittedAt DESC").all(citizenId)
    : db.prepare("SELECT * FROM applications ORDER BY submittedAt DESC").all();
  return rows as Application[];
}

export function getApplication(id: string): Application | null {
  return (getDb().prepare("SELECT * FROM applications WHERE id = ?").get(id) as Application) ?? null;
}

export function createApplication(input: {
  serviceId: string; citizenId: string; citizenName: string; districtId: string;
  channel: Channel; assistedBy: string | null;
}): Application {
  const svc = service(input.serviceId);
  const now = new Date();
  const app: Application = {
    id: genId("A"),
    serviceId: input.serviceId, citizenId: input.citizenId, citizenName: input.citizenName,
    districtId: input.districtId, status: "auto_verifying", channel: input.channel,
    assistedBy: input.assistedBy, submittedAt: now.toISOString(), slaDays: svc.slaDays,
    dueAt: new Date(now.getTime() + svc.slaDays * 864e5).toISOString(),
    updatedAt: now.toISOString(), autoVerified: 1,
  };
  getDb().prepare(`INSERT INTO applications VALUES (@id,@serviceId,@citizenId,@citizenName,@districtId,@status,@channel,@assistedBy,@submittedAt,@slaDays,@dueAt,@updatedAt,@autoVerified)`).run(app as unknown as Record<string, unknown>);
  return app;
}

const NEXT: Record<AppStatus, AppStatus> = {
  submitted: "auto_verifying", auto_verifying: "in_review", in_review: "approved",
  approved: "delivered", delivered: "delivered", rejected: "rejected",
};

const TERMINAL: AppStatus[] = ["delivered", "rejected"];
export const canTransition = (app: Application): boolean => !TERMINAL.includes(app.status);

// approve()/reject() are decisions, not workflow steps — once an application
// has been approved, delivered, or rejected, neither can fire again. This is
// a stricter guard than canTransition() (which the generic step-advancer
// uses, since "approved" must still be allowed to advance on to "delivered").
const ALREADY_DECIDED: AppStatus[] = ["approved", "delivered", "rejected"];

function setStatus(id: string, status: AppStatus): Application | null {
  getDb().prepare("UPDATE applications SET status = ?, updatedAt = ? WHERE id = ?").run(status, new Date().toISOString(), id);
  return getApplication(id);
}

/** Advances one step through the workflow. No-op (returns the app
 *  unchanged) once an application has reached a terminal state. */
export function advanceApplication(id: string): Application | null {
  const app = getApplication(id);
  if (!app) return null;
  if (!canTransition(app)) return app;
  return setStatus(id, NEXT[app.status]);
}

export function approveApplication(id: string): { app: Application | null; error?: string } {
  const app = getApplication(id);
  if (!app) return { app: null, error: "not_found" };
  if (ALREADY_DECIDED.includes(app.status)) return { app, error: "already_terminal" };
  return { app: setStatus(id, "approved") };
}

export function rejectApplication(id: string, _reason?: string): { app: Application | null; error?: string } {
  const app = getApplication(id);
  if (!app) return { app: null, error: "not_found" };
  if (ALREADY_DECIDED.includes(app.status)) return { app, error: "already_terminal" };
  return { app: setStatus(id, "rejected") };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export type NotificationType =
  | "APPLICATION_UPDATE" | "SLA_WARNING" | "SLA_EXCEEDED" | "DOCUMENT_REQUIRED"
  | "ELIGIBILITY_DISCOVERY" | "GRIEVANCE_UPDATE" | "SYSTEM";

export function listNotifications(citizenId: string): Notification[] {
  return getDb().prepare("SELECT * FROM notifications WHERE citizenId = ? ORDER BY createdAt DESC").all(citizenId) as Notification[];
}

export function createNotification(input: {
  citizenId: string; applicationId?: string; channel: "whatsapp" | "sms" | "app";
  type: NotificationType; message_en: string; message_hi: string;
}): Notification {
  const n = {
    id: `N${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`,
    applicationId: input.applicationId ?? "", citizenId: input.citizenId, channel: input.channel,
    message_en: input.message_en, message_hi: input.message_hi,
    createdAt: new Date().toISOString(), read: 0, type: input.type,
  };
  getDb().prepare(`INSERT INTO notifications VALUES (@id,@applicationId,@citizenId,@channel,@message_en,@message_hi,@createdAt,@read,@type)`).run(n);
  return n as unknown as Notification;
}

export function markNotificationRead(id: string): boolean {
  const r = getDb().prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
  return r.changes > 0;
}

export function markAllNotificationsRead(citizenId: string): number {
  const r = getDb().prepare("UPDATE notifications SET read = 1 WHERE citizenId = ?").run(citizenId);
  return r.changes;
}

// ---------------------------------------------------------------------------
// Documents (Feature 4 — Document Intelligence)
// ---------------------------------------------------------------------------
export function listDocuments(citizenId: string): CitizenDocument[] {
  const rows = getDb().prepare("SELECT * FROM documents WHERE citizenId = ? ORDER BY uploadedAt DESC").all(citizenId) as (Omit<CitizenDocument, "fields"> & { fields: string })[];
  return rows.map((r) => ({ ...r, fields: JSON.parse(r.fields) }));
}

export function createDocument(citizenId: string, fileName: string): CitizenDocument {
  const ext = extractDocument(fileName);
  const doc: CitizenDocument = {
    id: genId("D"), citizenId, type: ext.type, label_en: ext.label_en,
    fileName, fields: ext.fields, uploadedAt: new Date().toISOString(), verified: 1,
  };
  getDb().prepare(`INSERT INTO documents VALUES (@id,@citizenId,@type,@label_en,@fileName,@fields,@uploadedAt,@verified)`)
    .run({ ...doc, fields: JSON.stringify(doc.fields) });
  return doc;
}

// ---------------------------------------------------------------------------
// Grievances (Feature 17 — Smart Grievance / Escalation)
// ---------------------------------------------------------------------------
export function listGrievances(citizenId?: string): Grievance[] {
  const db = getDb();
  return (citizenId
    ? db.prepare("SELECT * FROM grievances WHERE citizenId = ? ORDER BY createdAt DESC").all(citizenId)
    : db.prepare("SELECT * FROM grievances ORDER BY createdAt DESC").all()) as Grievance[];
}

export function getGrievance(id: string): Grievance | null {
  return (getDb().prepare("SELECT * FROM grievances WHERE id = ?").get(id) as Grievance) ?? null;
}

export function createGrievance(applicationId: string, description: string): Grievance | null {
  const app = getApplication(applicationId);
  if (!app) return null;
  const svc = service(app.serviceId);
  const delayDays = Math.max(0, Math.ceil((Date.now() - new Date(app.dueAt).getTime()) / 864e5));
  const g: Grievance = {
    id: genId("G"), applicationId, citizenId: app.citizenId,
    serviceName: svc.name_en, departmentId: svc.departmentId, submittedAt: app.submittedAt,
    slaDays: app.slaDays, delayDays, description, status: "open", createdAt: new Date().toISOString(),
  };
  getDb().prepare(`INSERT INTO grievances VALUES (@id,@applicationId,@citizenId,@serviceName,@departmentId,@submittedAt,@slaDays,@delayDays,@description,@status,@createdAt)`).run(g as unknown as Record<string, unknown>);
  return g;
}

const GRIEVANCE_TRANSITIONS: Record<GrievanceStatus, GrievanceStatus[]> = {
  open: ["acknowledged", "resolved"],
  acknowledged: ["resolved"],
  resolved: [],
};

export function updateGrievanceStatus(id: string, status: GrievanceStatus): { grievance: Grievance | null; error?: string } {
  const g = getGrievance(id);
  if (!g) return { grievance: null, error: "not_found" };
  if (g.status !== status && !GRIEVANCE_TRANSITIONS[g.status as GrievanceStatus].includes(status)) {
    return { grievance: g, error: "invalid_transition" };
  }
  getDb().prepare("UPDATE grievances SET status = ? WHERE id = ?").run(status, id);
  return { grievance: getGrievance(id) };
}

// ---------------------------------------------------------------------------
// Access log (Feature 18 — Privacy / Trust dashboard)
// ---------------------------------------------------------------------------
export interface AccessEntry { id: string; departmentId: string; field: string; accessedAt: string }
export function listAccessLog(citizenId: string): AccessEntry[] {
  return getDb().prepare("SELECT id, departmentId, field, accessedAt FROM access_log WHERE citizenId = ? ORDER BY accessedAt DESC").all(citizenId) as AccessEntry[];
}

// ---------------------------------------------------------------------------
// Users (mock auth identities — see src/lib/auth.ts)
// ---------------------------------------------------------------------------
export function getUser(id: string): UserRecord | null {
  return (getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRecord) ?? null;
}

export function getUserByEmail(email: string): UserRecord | null {
  return (getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRecord) ?? null;
}

export function listUsers(): UserRecord[] {
  return getDb().prepare("SELECT * FROM users ORDER BY createdAt").all() as UserRecord[];
}

const CANONICAL_EMAIL: Record<Role, string> = {
  citizen: "citizen@demo.com", operator: "operator@demo.com",
  officer: "officer@demo.com", admin: "admin@demo.com",
};

/** Mock login has no password to check — it resolves to the one canonical
 *  demo account for the chosen role (seeded above), creating it on the fly
 *  if a fresh database somehow doesn't have it yet. */
export function resolveDemoUser(role: Role): UserRecord {
  const existing = getUserByEmail(CANONICAL_EMAIL[role]);
  if (existing) return existing;
  const id = role === "citizen" ? "demo" : `u_${role}_demo`;
  const user: UserRecord = {
    id, name: `${role[0].toUpperCase()}${role.slice(1)} (Demo)`, email: CANONICAL_EMAIL[role],
    phone: "+91 90000 00000", role, districtId: null, preferredLanguage: "hi",
    isActive: 1, createdAt: new Date().toISOString(),
  };
  getDb().prepare(`INSERT INTO users VALUES (@id,@name,@email,@phone,@role,@districtId,@preferredLanguage,@isActive,@createdAt)`).run(user);
  return user;
}

// ---------------------------------------------------------------------------
// Audit log (Feature 39)
// ---------------------------------------------------------------------------
export function logAudit(entry: {
  actorId: string; actorRole: Role | "anonymous"; action: string;
  entityType: string; entityId: string; metadata?: Record<string, unknown>;
}): void {
  const row: AuditLogEntry = {
    id: `AL${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`,
    actorId: entry.actorId, actorRole: entry.actorRole, action: entry.action,
    entityType: entry.entityType, entityId: entry.entityId,
    metadata: JSON.stringify(entry.metadata ?? {}), createdAt: new Date().toISOString(),
  };
  getDb().prepare(`INSERT INTO audit_log VALUES (@id,@actorId,@actorRole,@action,@entityType,@entityId,@metadata,@createdAt)`).run(row);
}

export function listAuditLog(opts: { limit?: number; actorRole?: string; entityType?: string } = {}): AuditLogEntry[] {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, unknown> = { limit: Math.min(500, opts.limit ?? 100) };
  if (opts.actorRole) { where.push("actorRole = @actorRole"); params.actorRole = opts.actorRole; }
  if (opts.entityType) { where.push("entityType = @entityType"); params.entityType = opts.entityType; }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return db.prepare(`SELECT * FROM audit_log ${clause} ORDER BY createdAt DESC LIMIT @limit`).all(params) as AuditLogEntry[];
}

// ---------------------------------------------------------------------------
// System / admin "backend page" stats
// ---------------------------------------------------------------------------
export function dbStats() {
  const db = getDb();
  const count = (t: string) => (db.prepare(`SELECT COUNT(*) c FROM ${t}`).get() as { c: number }).c;
  return {
    tables: {
      citizens: count("citizens"), applications: count("applications"),
      documents: count("documents"), grievances: count("grievances"),
      notifications: count("notifications"), users: count("users"),
      auditLog: count("audit_log"), accessLog: count("access_log"),
    },
    catalog: { services: SERVICES.length, departments: DEPARTMENTS.length, districts: DISTRICTS.length },
    dbPath: DB_PATH,
    aiProvider: process.env.AI_PROVIDER ?? "mock",
    environment: process.env.NODE_ENV ?? "development",
  };
}

// ---------------------------------------------------------------------------
// MIS aggregation (data-driven governance)
// ---------------------------------------------------------------------------
export interface MisData {
  totals: { total: number; pending: number; breached: number; delivered: number; breachRate: number };
  byStatus: { status: string; count: number }[];
  byChannel: { channel: string; count: number }[];
  byDistrict: { id: string; name: string; region: string; total: number; breached: number; breachRate: number; readiness: number }[];
  byService: { id: string; name: string; dept: string; total: number }[];
  trend: { day: string; submitted: number; delivered: number }[];
  campAlerts: { district: string; region: string; reason: string; metric: string }[];
}

export function computeMis(): MisData {
  const apps = listApplications();
  const now = Date.now();
  const isPending = (a: Application) => a.status !== "delivered" && a.status !== "approved" && a.status !== "rejected";
  const isBreached = (a: Application) => isPending(a) && new Date(a.dueAt).getTime() < now;

  const total = apps.length;
  const pending = apps.filter(isPending).length;
  const breached = apps.filter(isBreached).length;
  const delivered = apps.filter((a) => a.status === "delivered").length;

  const group = <T extends string>(fn: (a: Application) => T) => {
    const m = new Map<T, number>();
    for (const a of apps) m.set(fn(a), (m.get(fn(a)) ?? 0) + 1);
    return m;
  };

  const statusMap = group((a) => a.status);
  const channelMap = group((a) => a.channel);

  const byDistrict = DISTRICTS.map((d) => {
    const da = apps.filter((a) => a.districtId === d.id);
    const b = da.filter(isBreached).length;
    return { id: d.id, name: d.name_en, region: d.region, total: da.length, breached: b, breachRate: da.length ? Math.round((b / da.length) * 100) : 0, readiness: d.digitalReadiness };
  }).sort((a, b) => b.breachRate - a.breachRate);

  const svcMap = group((a) => a.serviceId);
  const byService = [...svcMap.entries()]
    .map(([id, count]) => ({ id, name: service(id).name_en, dept: service(id).departmentId, total: count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // 14-day trend
  const trend: { day: string; submitted: number; delivered: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now - i * 864e5);
    const key = day.toISOString().slice(0, 10);
    const sub = apps.filter((a) => a.submittedAt.slice(0, 10) === key).length;
    const del = apps.filter((a) => a.status === "delivered" && a.updatedAt.slice(0, 10) === key).length;
    trend.push({ day: key.slice(5), submitted: sub, delivered: del });
  }

  // Camp / outreach recommendations: low readiness + low volume OR high breach.
  const campAlerts = byDistrict
    .filter((d) => (d.readiness < 45 && d.total < 18) || d.breachRate > 45)
    .slice(0, 5)
    .map((d) => ({
      district: d.name,
      region: d.region,
      reason: d.breachRate > 45 ? "High SLA breach — deploy verification support" : "Low digital uptake — schedule an assisted camp",
      metric: d.breachRate > 45 ? `${d.breachRate}% breached` : `readiness ${d.readiness}/100`,
    }));

  return {
    totals: { total, pending, breached, delivered, breachRate: total ? Math.round((breached / total) * 100) : 0 },
    byStatus: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
    byChannel: [...channelMap.entries()].map(([channel, count]) => ({ channel, count })),
    byDistrict,
    byService,
    trend,
    campAlerts,
  };
}

// ---------------------------------------------------------------------------
// Governance Intelligence (Features 11–13) — bottleneck + root cause
// ---------------------------------------------------------------------------
export interface GovernanceData {
  today: { submitted: number; completed: number; pending: number; delayed: number; atRisk: number };
  pipeline: { stage: string; count: number }[];
  bottleneck: { stage: string; pctOfDelayed: number };
  rootCause: { reason: string; pct: number }[];
  insight_en: string;
  insight_hi: string;
  byDepartment: { id: string; name: string; total: number; breached: number; breachRate: number }[];
  heatmap: { district: string; region: string; department: string; service: string; applications: number; avgDays: number; slaViolationPct: number }[];
}

export function computeGovernance(): GovernanceData {
  const apps = listApplications();
  const now = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10);

  const isPending = (a: Application) => !["delivered", "approved", "rejected"].includes(a.status);
  const isBreached = (a: Application) => isPending(a) && new Date(a.dueAt).getTime() < now;
  const isAtRisk = (a: Application) => isPending(a) && !isBreached(a) && slaRisk(a).risk === "high";

  const today = {
    submitted: apps.filter((a) => a.submittedAt.slice(0, 10) === todayKey).length,
    completed: apps.filter((a) => a.status === "delivered" || a.status === "approved").length,
    pending: apps.filter(isPending).length,
    delayed: apps.filter(isBreached).length,
    atRisk: apps.filter(isAtRisk).length,
  };

  // Pipeline funnel: how many applications have PASSED each stage.
  const passedDocVerification = apps.filter((a) => a.status !== "submitted").length;
  const passedDeptReview = apps.filter((a) => ["approved", "delivered"].includes(a.status)).length;
  const approved = apps.filter((a) => ["approved", "delivered"].includes(a.status)).length;
  const pipeline = [
    { stage: "Submitted", count: apps.length },
    { stage: "Document Verification", count: passedDocVerification },
    { stage: "Department Review", count: passedDeptReview },
    { stage: "Approval", count: approved },
  ];
  let maxDrop = { stage: "Document Verification", pct: 0 };
  for (let i = 1; i < pipeline.length; i++) {
    const prev = pipeline[i - 1].count || 1;
    const dropPct = Math.round(((prev - pipeline[i].count) / prev) * 100);
    if (dropPct > maxDrop.pct) maxDrop = { stage: pipeline[i].stage, pct: dropPct };
  }

  // Root cause analysis over delayed + at-risk applications.
  const troubled = apps.filter((a) => isBreached(a) || isAtRisk(a));
  let missingDocs = 0, docVerification = 0, officerApproval = 0, other = 0;
  for (const a of troubled) {
    if (!a.autoVerified) missingDocs++;
    else if (a.status === "auto_verifying") docVerification++;
    else if (a.status === "in_review") officerApproval++;
    else other++;
  }
  const totalTroubled = Math.max(1, troubled.length);
  const rootCause = [
    { reason: "Document verification", pct: Math.round((docVerification / totalTroubled) * 100) },
    { reason: "Officer approval", pct: Math.round((officerApproval / totalTroubled) * 100) },
    { reason: "Missing documents", pct: Math.round((missingDocs / totalTroubled) * 100) },
    { reason: "Other", pct: Math.round((other / totalTroubled) * 100) },
  ].sort((a, b) => b.pct - a.pct);

  const top = rootCause[0];
  const insight_en = `${top.reason} is currently the largest contributor to processing delays (${top.pct}% of ${troubled.length} at-risk/delayed applications). Consider workload redistribution or additional verification capacity.`;
  const insight_hi = `${top.reason} वर्तमान में देरी का सबसे बड़ा कारण है (${troubled.length} जोखिम/विलंबित आवेदनों में से ${top.pct}%)। कार्यभार पुनर्वितरण या अतिरिक्त सत्यापन क्षमता पर विचार करें।`;

  const byDepartment = DEPARTMENTS.map((d) => {
    const svcIds = new Set(SERVICES.filter((s) => s.departmentId === d.id).map((s) => s.id));
    const da = apps.filter((a) => svcIds.has(a.serviceId));
    const b = da.filter(isBreached).length;
    return { id: d.id, name: d.name_en, total: da.length, breached: b, breachRate: da.length ? Math.round((b / da.length) * 100) : 0 };
  }).sort((a, b) => b.total - a.total);

  // Heatmap grid: district x top service, with mock avg-processing-days.
  const heatmap = DISTRICTS.flatMap((d) => {
    const da = apps.filter((a) => a.districtId === d.id);
    const bySvc = new Map<string, Application[]>();
    for (const a of da) bySvc.set(a.serviceId, [...(bySvc.get(a.serviceId) ?? []), a]);
    return [...bySvc.entries()].slice(0, 2).map(([sid, list]) => {
      const svc = service(sid);
      const avgDays = list.reduce((sum, a) => sum + (Date.now() - new Date(a.submittedAt).getTime()) / 864e5, 0) / list.length;
      const viol = list.filter(isBreached).length;
      return {
        district: d.name_en, region: d.region, department: dept(svc.departmentId).name_en, service: svc.name_en,
        applications: list.length, avgDays: Math.round(avgDays * 10) / 10,
        slaViolationPct: list.length ? Math.round((viol / list.length) * 100) : 0,
      };
    });
  });

  return {
    today, pipeline, bottleneck: { stage: maxDrop.stage, pctOfDelayed: maxDrop.pct },
    rootCause, insight_en, insight_hi, byDepartment, heatmap,
  };
}

// Re-exported so callers only need one import for the common risk helpers.
export { delayRisk, slaRisk };
