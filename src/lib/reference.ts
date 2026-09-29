import type { District, Department, ServiceDef, LifeEvent, DocType } from "./types";

// A representative set of Chhattisgarh districts, tagged by region so the MIS
// can highlight tribal / LWE-affected blocks where last-mile uptake lags.
export const DISTRICTS: District[] = [
  { id: "raipur", name_en: "Raipur", name_hi: "रायपुर", region: "plains", population: 4063, digitalReadiness: 82 },
  { id: "durg", name_en: "Durg", name_hi: "दुर्ग", region: "plains", population: 3343, digitalReadiness: 78 },
  { id: "bilaspur", name_en: "Bilaspur", name_hi: "बिलासपुर", region: "plains", population: 2663, digitalReadiness: 71 },
  { id: "raigarh", name_en: "Raigarh", name_hi: "रायगढ़", region: "plains", population: 1493, digitalReadiness: 66 },
  { id: "korba", name_en: "Korba", name_hi: "कोरबा", region: "plains", population: 1206, digitalReadiness: 64 },
  { id: "rajnandgaon", name_en: "Rajnandgaon", name_hi: "राजनांदगांव", region: "plains", population: 1537, digitalReadiness: 63 },
  { id: "surguja", name_en: "Surguja", name_hi: "सरगुजा", region: "tribal", population: 840, digitalReadiness: 48 },
  { id: "jashpur", name_en: "Jashpur", name_hi: "जशपुर", region: "tribal", population: 852, digitalReadiness: 45 },
  { id: "korea", name_en: "Korea (Koriya)", name_hi: "कोरिया", region: "tribal", population: 659, digitalReadiness: 47 },
  { id: "kanker", name_en: "Kanker", name_hi: "कांकेर", region: "lwe", population: 748, digitalReadiness: 41 },
  { id: "bastar", name_en: "Bastar", name_hi: "बस्तर", region: "lwe", population: 1413, digitalReadiness: 36 },
  { id: "kondagaon", name_en: "Kondagaon", name_hi: "कोंडागांव", region: "lwe", population: 578, digitalReadiness: 34 },
  { id: "narayanpur", name_en: "Narayanpur", name_hi: "नारायणपुर", region: "lwe", population: 139, digitalReadiness: 28 },
  { id: "dantewada", name_en: "Dantewada", name_hi: "दंतेवाड़ा", region: "lwe", population: 533, digitalReadiness: 26 },
  { id: "sukma", name_en: "Sukma", name_hi: "सुकमा", region: "lwe", population: 250, digitalReadiness: 22 },
  { id: "bijapur", name_en: "Bijapur", name_hi: "बीजापुर", region: "lwe", population: 255, digitalReadiness: 21 },
];

export const DEPARTMENTS: Department[] = [
  { id: "revenue", name_en: "Revenue", name_hi: "राजस्व", color: "#2563eb" },
  { id: "social", name_en: "Social Welfare", name_hi: "समाज कल्याण", color: "#7c3aed" },
  { id: "food", name_en: "Food & PDS", name_hi: "खाद्य एवं पीडीएस", color: "#059669" },
  { id: "labour", name_en: "Labour", name_hi: "श्रम", color: "#d97706" },
  { id: "education", name_en: "Education", name_hi: "शिक्षा", color: "#db2777" },
  { id: "health", name_en: "Health", name_hi: "स्वास्थ्य", color: "#dc2626" },
  { id: "panchayat", name_en: "Panchayat & Rural", name_hi: "पंचायत एवं ग्रामीण", color: "#0891b2" },
];

export const SERVICES: ServiceDef[] = [
  {
    id: "income_cert", code: "REV-INC", name_en: "Income Certificate", name_hi: "आय प्रमाण पत्र", name_cg: "आमदनी परमान पत्तर",
    departmentId: "revenue", category: "certificate", slaDays: 15, fee: 30,
    requiredDocs: ["Aadhaar", "Ration Card", "Self-declaration"],
    autoVerify: [{ source: "Aadhaar e-KYC", field: "Name & Address" }, { source: "PDS", field: "Household income band" }],
    eligibilityRules: [], lifeEvents: ["shop", "education"], popularity: 95,
  },
  {
    id: "caste_cert", code: "REV-CST", name_en: "Caste Certificate", name_hi: "जाति प्रमाण पत्र", name_cg: "जात परमान पत्तर",
    departmentId: "revenue", category: "certificate", slaDays: 30, fee: 30,
    requiredDocs: ["Aadhaar", "Parent caste proof", "Residence proof"],
    autoVerify: [{ source: "Aadhaar e-KYC", field: "Identity" }, { source: "Revenue records", field: "Parental caste entry" }],
    eligibilityRules: ["is_sc_st_obc"], lifeEvents: ["education", "newborn"], popularity: 88,
  },
  {
    id: "domicile_cert", code: "REV-DOM", name_en: "Domicile Certificate", name_hi: "मूल निवास प्रमाण पत्र", name_cg: "मूल निवासी परमान",
    departmentId: "revenue", category: "certificate", slaDays: 15, fee: 30,
    requiredDocs: ["Aadhaar", "Residence proof"],
    autoVerify: [{ source: "Aadhaar e-KYC", field: "Address (>15 yrs)" }],
    eligibilityRules: [], lifeEvents: ["education"], popularity: 74,
  },
  {
    id: "birth_cert", code: "HLT-BRT", name_en: "Birth Certificate", name_hi: "जन्म प्रमाण पत्र", name_cg: "जनम परमान पत्तर",
    departmentId: "health", category: "certificate", slaDays: 7, fee: 0,
    requiredDocs: ["Hospital record", "Parent Aadhaar"],
    autoVerify: [{ source: "Health MIS", field: "Institutional delivery record" }],
    eligibilityRules: [], lifeEvents: ["newborn"], popularity: 80,
  },
  {
    id: "death_cert", code: "HLT-DTH", name_en: "Death Certificate", name_hi: "मृत्यु प्रमाण पत्र", name_cg: "मउत परमान पत्तर",
    departmentId: "health", category: "certificate", slaDays: 7, fee: 0,
    requiredDocs: ["Medical certificate of cause of death", "Aadhaar"],
    autoVerify: [{ source: "Health MIS", field: "Facility death record" }],
    eligibilityRules: [], lifeEvents: ["bereavement"], popularity: 55,
  },
  {
    id: "ration_card", code: "FOD-RTN", name_en: "New Ration Card", name_hi: "नया राशन कार्ड", name_cg: "नवा राशन कार्ड",
    departmentId: "food", category: "welfare", slaDays: 30, fee: 0,
    requiredDocs: ["Aadhaar (all members)", "Residence proof"],
    autoVerify: [{ source: "Aadhaar e-KYC", field: "Family members" }, { source: "PDS", field: "No duplicate card" }],
    eligibilityRules: ["is_bpl"], lifeEvents: ["newborn", "bereavement", "marriage"], popularity: 90,
  },
  {
    id: "old_pension", code: "SOC-OAP", name_en: "Old Age Pension", name_hi: "वृद्धावस्था पेंशन", name_cg: "बुढ़ती पेंसन",
    departmentId: "social", category: "pension", slaDays: 30, fee: 0,
    requiredDocs: ["Aadhaar", "Age proof", "BPL proof", "Bank passbook"],
    autoVerify: [{ source: "Aadhaar e-KYC", field: "Age (>60)" }, { source: "PFMS", field: "Bank account (DBT)" }],
    eligibilityRules: ["age_60_plus", "is_bpl"], lifeEvents: [], popularity: 70,
  },
  {
    id: "widow_pension", code: "SOC-WDP", name_en: "Widow Pension", name_hi: "विधवा पेंशन", name_cg: "विधवा पेंसन",
    departmentId: "social", category: "pension", slaDays: 30, fee: 0,
    requiredDocs: ["Aadhaar", "Husband death certificate", "Bank passbook"],
    autoVerify: [{ source: "Health MIS", field: "Spouse death record" }, { source: "PFMS", field: "Bank account" }],
    eligibilityRules: ["is_widow"], lifeEvents: ["bereavement"], popularity: 40,
  },
  {
    id: "disability_pension", code: "SOC-DIS", name_en: "Disability Pension", name_hi: "दिव्यांग पेंशन", name_cg: "दिव्यांग पेंसन",
    departmentId: "social", category: "pension", slaDays: 30, fee: 0,
    requiredDocs: ["Aadhaar", "UDID / disability certificate", "Bank passbook"],
    autoVerify: [{ source: "UDID", field: "Disability %" }, { source: "PFMS", field: "Bank account" }],
    eligibilityRules: ["has_disability"], lifeEvents: [], popularity: 35,
  },
  {
    id: "scholarship", code: "EDU-SCH", name_en: "Post-Matric Scholarship", name_hi: "पोस्ट-मैट्रिक छात्रवृत्ति", name_cg: "पढ़ई छात्रवृत्ति",
    departmentId: "education", category: "welfare", slaDays: 45, fee: 0,
    requiredDocs: ["Aadhaar", "Caste certificate", "Income certificate", "Marksheet", "Bank passbook"],
    autoVerify: [{ source: "Revenue records", field: "Caste certificate" }, { source: "Revenue records", field: "Income certificate" }],
    eligibilityRules: ["is_student", "is_sc_st_obc"], lifeEvents: ["education"], popularity: 60,
  },
  {
    id: "labour_card", code: "LAB-REG", name_en: "Labour Card (e-Shram link)", name_hi: "श्रमिक कार्ड", name_cg: "मजदूर कार्ड",
    departmentId: "labour", category: "welfare", slaDays: 15, fee: 0,
    requiredDocs: ["Aadhaar", "Bank passbook"],
    autoVerify: [{ source: "e-Shram", field: "Worker registration" }],
    eligibilityRules: ["is_labour"], lifeEvents: [], popularity: 58,
  },
  {
    id: "kisan_credit", code: "AGR-KCC", name_en: "Kisan Credit Card", name_hi: "किसान क्रेडिट कार्ड", name_cg: "किसान करेडिट कार्ड",
    departmentId: "revenue", category: "welfare", slaDays: 21, fee: 0,
    requiredDocs: ["Aadhaar", "Land record (B-1/RoR)", "Bank passbook"],
    autoVerify: [{ source: "Bhuiyan (Land records)", field: "Land ownership (RoR)" }],
    eligibilityRules: ["is_farmer"], lifeEvents: [], popularity: 50,
  },
  {
    id: "land_ror", code: "REV-ROR", name_en: "Land Record (RoR / B-1)", name_hi: "भू-अभिलेख (बी-1)", name_cg: "जमीन के रिकॉर्ड",
    departmentId: "revenue", category: "land", slaDays: 7, fee: 20,
    requiredDocs: ["Khasra number"],
    autoVerify: [{ source: "Bhuiyan (Land records)", field: "Khasra / owner" }],
    eligibilityRules: [], lifeEvents: ["bereavement"], popularity: 65,
  },
  {
    id: "forest_rights", code: "TRB-FRA", name_en: "Forest Rights (FRA) Title", name_hi: "वन अधिकार पट्टा (FRA)", name_cg: "जंगल अधिकार पट्टा",
    departmentId: "panchayat", category: "land", slaDays: 60, fee: 0,
    requiredDocs: ["Aadhaar", "Gram Sabha resolution", "Occupation evidence"],
    autoVerify: [{ source: "Gram Sabha register", field: "Claim resolution" }],
    eligibilityRules: ["is_forest_dweller", "is_sc_st_obc"], lifeEvents: [], popularity: 30,
  },
  {
    id: "shop_reg", code: "LAB-SHP", name_en: "Shop & Establishment Reg.", name_hi: "दुकान पंजीयन", name_cg: "दुकान रजिस्ट्री",
    departmentId: "labour", category: "license", slaDays: 15, fee: 100,
    requiredDocs: ["Aadhaar", "Address proof", "Shop details"],
    autoVerify: [{ source: "Aadhaar e-KYC", field: "Proprietor identity" }],
    eligibilityRules: [], lifeEvents: ["shop"], popularity: 45,
  },
  {
    id: "marriage_reg", code: "REV-MRG", name_en: "Marriage Registration", name_hi: "विवाह पंजीयन", name_cg: "बिहाव रजिस्ट्री",
    departmentId: "revenue", category: "certificate", slaDays: 30, fee: 50,
    requiredDocs: ["Aadhaar (both)", "Marriage proof", "Witnesses"],
    autoVerify: [{ source: "Aadhaar e-KYC", field: "Both identities & age" }],
    eligibilityRules: [], lifeEvents: ["marriage"], popularity: 42,
  },
  {
    id: "land_mutation", code: "REV-MUT", name_en: "Land Mutation (Naamantaran)", name_hi: "भूमि नामांतरण", name_cg: "जमीन नामांतरण",
    departmentId: "revenue", category: "land", slaDays: 45, fee: 50,
    requiredDocs: ["Aadhaar", "Registered deed / legal heir certificate", "Land record (B-1/RoR)", "Death certificate (if inherited)"],
    autoVerify: [{ source: "Bhuiyan (Land records)", field: "Current khasra / owner" }, { source: "Registrar", field: "Deed registration" }],
    eligibilityRules: [], lifeEvents: [], popularity: 38,
  },
  {
    id: "legal_heir_cert", code: "REV-LHC", name_en: "Legal Heir Certificate", name_hi: "वारिस प्रमाण पत्र", name_cg: "वारिस परमान पत्तर",
    departmentId: "revenue", category: "certificate", slaDays: 30, fee: 30,
    requiredDocs: ["Aadhaar", "Death certificate of owner", "Family tree declaration"],
    autoVerify: [{ source: "Health MIS", field: "Death record" }, { source: "Revenue records", field: "Family register" }],
    eligibilityRules: [], lifeEvents: ["bereavement"], popularity: 28,
  },
  {
    id: "disaster_relief", code: "REV-DIS", name_en: "Disaster Relief Assistance", name_hi: "आपदा राहत सहायता", name_cg: "आपदा राहत मदद",
    departmentId: "revenue", category: "welfare", slaDays: 10, fee: 0,
    requiredDocs: ["Aadhaar", "Residence proof", "Damage photos"],
    autoVerify: [{ source: "Revenue records", field: "Residence in affected area" }],
    eligibilityRules: [], lifeEvents: ["disaster"], popularity: 20,
  },
  {
    id: "lost_document_assist", code: "REV-LDA", name_en: "Lost Document Re-issue", name_hi: "खोया दस्तावेज़ पुनः जारी", name_cg: "खोवाइस कागज फेर जारी",
    departmentId: "revenue", category: "certificate", slaDays: 15, fee: 20,
    requiredDocs: ["Aadhaar", "Police / disaster loss report"],
    autoVerify: [{ source: "Revenue records", field: "Prior certificate on file" }],
    eligibilityRules: [], lifeEvents: ["disaster"], popularity: 15,
  },
];

// Document Intelligence — types citizens commonly hold, and how each maps
// onto the vault + reuse graph (Feature 4).
export const DOC_TYPE_LABEL: Record<DocType, { en: string; hi: string }> = {
  income_certificate: { en: "Income Certificate", hi: "आय प्रमाण पत्र" },
  caste_certificate: { en: "Caste Certificate", hi: "जाति प्रमाण पत्र" },
  domicile_certificate: { en: "Domicile Certificate", hi: "मूल निवास प्रमाण पत्र" },
  aadhaar: { en: "Aadhaar Card", hi: "आधार कार्ड" },
  ration_card: { en: "Ration Card", hi: "राशन कार्ड" },
  land_record: { en: "Land Record (B-1/RoR)", hi: "भू-अभिलेख" },
  bank_passbook: { en: "Bank Passbook", hi: "बैंक पासबुक" },
  marksheet: { en: "Marksheet", hi: "अंकसूची" },
  disability_certificate: { en: "Disability (UDID) Certificate", hi: "दिव्यांगता प्रमाण पत्र" },
  death_certificate: { en: "Death Certificate", hi: "मृत्यु प्रमाण पत्र" },
};

// Maps a document type to the substring it satisfies inside a service's
// requiredDocs list — powers "this document can be reused for N services".
const DOC_MATCH_HINT: Record<string, string> = {
  income_certificate: "income",
  caste_certificate: "caste",
  domicile_certificate: "domicile",
  aadhaar: "aadhaar",
  ration_card: "ration",
  land_record: "land record",
  bank_passbook: "bank passbook",
  marksheet: "marksheet",
  disability_certificate: "udid",
  death_certificate: "death certificate",
};

export function servicesReusingDoc(docType: string): ServiceDef[] {
  const hint = DOC_MATCH_HINT[docType];
  if (!hint) return [];
  return SERVICES.filter((s) => s.requiredDocs.some((d) => d.toLowerCase().includes(hint)));
}

export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: "newborn", emoji: "👶", name_en: "New Baby", name_hi: "नया शिशु",
    desc_en: "Register the birth and unlock everything a newborn needs.",
    desc_hi: "जन्म पंजीकरण करें और नवजात के लिए ज़रूरी सेवाएँ पाएँ।",
    serviceIds: ["birth_cert", "ration_card", "caste_cert"],
  },
  {
    id: "bereavement", emoji: "🕯️", name_en: "Bereavement", name_hi: "परिवार में निधन",
    desc_en: "One place for the death certificate, succession and pension transfer.",
    desc_hi: "मृत्यु प्रमाण पत्र, उत्तराधिकार और पेंशन — एक ही जगह।",
    serviceIds: ["death_cert", "land_ror", "widow_pension", "ration_card"],
  },
  {
    id: "shop", emoji: "🏪", name_en: "Open a Shop", name_hi: "दुकान शुरू करें",
    desc_en: "Everything to register and run a small business.",
    desc_hi: "छोटा व्यवसाय शुरू करने की सभी सेवाएँ।",
    serviceIds: ["shop_reg", "income_cert"],
  },
  {
    id: "education", emoji: "🎓", name_en: "Student Support", name_hi: "छात्र सहायता",
    desc_en: "Certificates and scholarships for a student in the family.",
    desc_hi: "छात्र के लिए प्रमाण पत्र और छात्रवृत्ति।",
    serviceIds: ["scholarship", "caste_cert", "income_cert", "domicile_cert"],
  },
  {
    id: "marriage", emoji: "💍", name_en: "Marriage", name_hi: "विवाह",
    desc_en: "Register a marriage and update household records.",
    desc_hi: "विवाह पंजीकरण और घरेलू रिकॉर्ड अद्यतन।",
    serviceIds: ["marriage_reg", "ration_card"],
  },
  {
    id: "land_transfer", emoji: "🏞️", name_en: "Transfer Family Land", name_hi: "पैतृक भूमि हस्तांतरण",
    desc_en: "Move land records into your name after inheritance or a deed.",
    desc_hi: "विरासत या दस्तावेज़ के बाद भूमि अपने नाम कराएँ।",
    serviceIds: ["legal_heir_cert", "land_mutation", "land_ror"],
  },
  {
    id: "disaster", emoji: "🌊", name_en: "Disaster / Damage", name_hi: "आपदा / क्षति",
    desc_en: "Report damage and claim relief assistance.",
    desc_hi: "क्षति की रिपोर्ट करें और राहत सहायता पाएँ।",
    serviceIds: ["disaster_relief", "lost_document_assist"],
  },
];

// Land / Revenue Service Navigator — guided question sequence (Feature 20).
export interface GuidedQuestion {
  id: string;
  q_en: string;
  q_hi: string;
  options?: { value: string; label_en: string; label_hi: string }[];
}

export const LAND_TRANSFER_QUESTIONS: GuidedQuestion[] = [
  { id: "owner", q_en: "Who is the current registered owner of the land?", q_hi: "भूमि के वर्तमान पंजीकृत मालिक कौन हैं?" },
  {
    id: "relationship", q_en: "What is your relationship to the owner?", q_hi: "मालिक से आपका क्या संबंध है?",
    options: [
      { value: "child", label_en: "Son / Daughter", label_hi: "पुत्र / पुत्री" },
      { value: "spouse", label_en: "Spouse", label_hi: "पति / पत्नी" },
      { value: "other", label_en: "Other heir", label_hi: "अन्य वारिस" },
    ],
  },
  {
    id: "deed", q_en: "Is there a registered deed or will?", q_hi: "क्या कोई पंजीकृत दस्तावेज़ या वसीयत है?",
    options: [
      { value: "yes", label_en: "Yes, registered deed", label_hi: "हाँ, पंजीकृत दस्तावेज़" },
      { value: "no", label_en: "No — inheritance only", label_hi: "नहीं — केवल विरासत से" },
    ],
  },
  { id: "district", q_en: "Which district is the land in?", q_hi: "भूमि किस जिले में है?" },
  { id: "tehsil", q_en: "Which tehsil / patwari circle?", q_hi: "कौन सा तहसील / पटवारी हलका?" },
];

export const dept = (id: string) => DEPARTMENTS.find((d) => d.id === id)!;
export const service = (id: string) => SERVICES.find((s) => s.id === id)!;
export const district = (id: string) => DISTRICTS.find((d) => d.id === id)!;
