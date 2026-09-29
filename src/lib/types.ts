// Shared domain types for SewaSetu Sahaayak

export type Lang = "en" | "hi" | "cg";

export type Region = "plains" | "tribal" | "lwe";

export interface District {
  id: string;
  name_en: string;
  name_hi: string;
  region: Region; // used for MIS colouring + last-mile flags
  population: number; // in thousands
  digitalReadiness: number; // 0-100, drives the "where to send a camp" logic
}

export interface Department {
  id: string;
  name_en: string;
  name_hi: string;
  color: string;
}

export type ServiceCategory =
  | "certificate"
  | "welfare"
  | "land"
  | "license"
  | "pension"
  | "utility";

export interface ServiceDef {
  id: string;
  code: string;
  name_en: string;
  name_hi: string;
  name_cg: string;
  departmentId: string;
  category: ServiceCategory;
  slaDays: number; // Lok Seva Guarantee stipulated time
  fee: number; // INR
  requiredDocs: string[];
  // fields the department systems can auto-verify (interoperability demo)
  autoVerify: { source: string; field: string }[];
  // eligibility rule keys this service maps to (proactive discovery)
  eligibilityRules: string[];
  lifeEvents: string[]; // life-event bundle ids
  popularity: number; // seed weighting
}

export interface LifeEvent {
  id: string;
  emoji: string;
  name_en: string;
  name_hi: string;
  desc_en: string;
  desc_hi: string;
  serviceIds: string[];
}

// Citizen household profile — the "write once" data locker.
export interface CitizenProfile {
  id: string;
  name: string;
  aadhaarMasked: string;
  phone: string;
  districtId: string;
  age: number;
  gender: "male" | "female" | "other";
  category: "general" | "obc" | "sc" | "st";
  annualIncome: number;
  isBPL: boolean;
  isStudent: boolean;
  occupation: "farmer" | "labour" | "self_employed" | "salaried" | "student" | "unemployed";
  hasDisability: boolean;
  landHectares: number;
  isForestDweller: boolean;
  household: number;
}

export type AppStatus =
  | "submitted"
  | "auto_verifying"
  | "in_review"
  | "approved"
  | "rejected"
  | "delivered";

export type Channel = "web" | "whatsapp" | "assisted" | "voice";

export interface Application {
  id: string;
  serviceId: string;
  citizenId: string;
  citizenName: string;
  districtId: string;
  status: AppStatus;
  channel: Channel;
  assistedBy: string | null; // operator name when channel = assisted
  submittedAt: string; // ISO
  slaDays: number;
  dueAt: string; // ISO — submittedAt + slaDays
  updatedAt: string;
  autoVerified: number; // 0/1
}

export interface Notification {
  id: string;
  applicationId: string;
  citizenId: string;
  channel: "whatsapp" | "sms" | "app";
  message_en: string;
  message_hi: string;
  createdAt: string;
  read: number;
}

export interface EligibilityHit {
  serviceId: string;
  reason_en: string;
  reason_hi: string;
  benefit_en: string;
  benefit_hi: string;
}
