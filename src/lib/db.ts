import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type { Application, AppStatus, Channel, CitizenProfile, Notification } from "./types";
import { SERVICES, DISTRICTS, service, district } from "./reference";

// ---------------------------------------------------------------------------
// Connection (singleton across hot reloads)
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
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

export function getDb(): Database.Database {
  if (!global.__sewasetu_db) global.__sewasetu_db = connect();
  return global.__sewasetu_db;
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
      message_en TEXT, message_hi TEXT, createdAt TEXT, read INTEGER
    );
  `);
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

const FIRST = ["Sunita", "Ramesh", "Phoolwati", "Dinesh", "Jamuna", "Santram", "Budhri", "Mahesh", "Sukhmati", "Rajkumar", "Kaushalya", "Bhupendra", "Lakshmi", "Chhannu", "Parvati", "Ganpat", "Itwari", "Somaru", "Devki", "Hariram"];
const LAST = ["Netam", "Kashyap", "Baghel", "Sahu", "Markam", "Yadav", "Nag", "Dhurwa", "Verma", "Korram", "Sori", "Mandavi", "Dewangan", "Patel", "Uikey"];
const OPERATORS = ["CHOICE Op. Rekha", "CSC Op. Arjun", "Bank Sakhi Meena", "CSC Op. Dilip", "CHOICE Op. Farida"];

function seed(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) c FROM citizens").get() as { c: number }).c;
  if (count > 0) return;

  const rnd = mulberry32(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const now = Date.now();

  const insCit = db.prepare(`INSERT INTO citizens VALUES (@id,@name,@aadhaarMasked,@phone,@districtId,@age,@gender,@category,@annualIncome,@isBPL,@isStudent,@occupation,@hasDisability,@landHectares,@isForestDweller,@household)`);

  // The demo citizen — deliberately rich so the eligibility engine lights up.
  const demo: CitizenProfile = {
    id: "demo", name: "Sukhmati Kashyap", aadhaarMasked: "XXXX XXXX 4821", phone: "+91 94255 1xxxx",
    districtId: "bastar", age: 63, gender: "female", category: "st", annualIncome: 42000,
    isBPL: true, isStudent: false, occupation: "farmer", hasDisability: false,
    landHectares: 0.4, isForestDweller: true, household: 2,
  };
  insCit.run(toRow(demo));

  // A student demo citizen too (nice for a second persona if needed).
  const student: CitizenProfile = {
    id: "cit_student", name: "Dinesh Markam", aadhaarMasked: "XXXX XXXX 7733", phone: "+91 90985 2xxxx",
    districtId: "kanker", age: 19, gender: "male", category: "st", annualIncome: 68000,
    isBPL: true, isStudent: true, occupation: "student", hasDisability: false,
    landHectares: 0, isForestDweller: false, household: 5,
  };
  insCit.run(toRow(student));

  const insApp = db.prepare(`INSERT INTO applications VALUES (@id,@serviceId,@citizenId,@citizenName,@districtId,@status,@channel,@assistedBy,@submittedAt,@slaDays,@dueAt,@updatedAt,@autoVerified)`);

  const rows: Application[] = [];
  let n = 0;

  // Bulk realistic applications across the state for the MIS.
  for (const d of DISTRICTS) {
    // Volume scales with population; plains produce more digital applications.
    const base = Math.round((d.population / 100) * (0.5 + d.digitalReadiness / 100));
    const volume = Math.max(6, Math.min(34, base));
    for (let i = 0; i < volume; i++) {
      const svc = weightedService(rnd);
      const ageDays = Math.floor(rnd() * 90);
      const submittedAt = new Date(now - ageDays * 864e5);
      const dueAt = new Date(submittedAt.getTime() + svc.slaDays * 864e5);
      const status = rollStatus(rnd, ageDays, svc.slaDays, d.digitalReadiness);
      const channel = rollChannel(rnd, d.region);
      rows.push({
        id: `A${(1000 + n++).toString()}`,
        serviceId: svc.id,
        citizenId: `cit_${n}`,
        citizenName: `${pick(FIRST)} ${pick(LAST)}`,
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
  const insNote = db.prepare(`INSERT INTO notifications VALUES (@id,@applicationId,@citizenId,@channel,@message_en,@message_hi,@createdAt,@read)`);
  const notes: Notification[] = [
    { id: "N1", applicationId: "", citizenId: "demo", channel: "whatsapp", message_en: "Your Caste Certificate is issued. Download on WhatsApp.", message_hi: "आपका जाति प्रमाण पत्र जारी हुआ। व्हाट्सएप पर डाउनलोड करें।", createdAt: new Date(now - 2 * 864e5).toISOString(), read: 0 },
    { id: "N2", applicationId: "", citizenId: "demo", channel: "sms", message_en: "Old Age Pension: documents auto-verified, in review.", message_hi: "वृद्धावस्था पेंशन: दस्तावेज़ सत्यापित, समीक्षा में।", createdAt: new Date(now - 5 * 864e5).toISOString(), read: 1 },
  ];
  for (const nt of notes) insNote.run(nt as unknown as Record<string, unknown>);
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
// Queries
// ---------------------------------------------------------------------------
export function getCitizen(id: string): CitizenProfile | null {
  const r = getDb().prepare("SELECT * FROM citizens WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return r ? fromRow(r) : null;
}

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
    id: `A${Date.now().toString().slice(-6)}`,
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

export function advanceApplication(id: string): Application | null {
  const app = getApplication(id);
  if (!app) return null;
  const next = NEXT[app.status];
  getDb().prepare("UPDATE applications SET status = ?, updatedAt = ? WHERE id = ?").run(next, new Date().toISOString(), id);
  return getApplication(id);
}

export function listNotifications(citizenId: string): Notification[] {
  return getDb().prepare("SELECT * FROM notifications WHERE citizenId = ? ORDER BY createdAt DESC").all(citizenId) as Notification[];
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
