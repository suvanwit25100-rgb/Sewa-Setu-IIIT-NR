import { describe, it, expect, beforeAll } from "vitest";
import {
  createApplication, advanceApplication, approveApplication, rejectApplication,
  getApplication, getCitizen, listDocuments,
} from "../src/lib/db";
import { checkApplication } from "../src/lib/ai";

describe("application workflow engine", () => {
  it("a freshly created application starts auto_verifying, not draft", () => {
    const app = createApplication({ serviceId: "income_cert", citizenId: "demo", citizenName: "Sukhmati Kashyap", districtId: "bastar", channel: "web", assistedBy: null });
    expect(app.status).toBe("auto_verifying");
    expect(app.dueAt > app.submittedAt).toBe(true);
  });

  it("advanceApplication moves through the pipeline in order and stops at a terminal state", () => {
    const app = createApplication({ serviceId: "caste_cert", citizenId: "demo", citizenName: "Sukhmati Kashyap", districtId: "bastar", channel: "web", assistedBy: null });
    const step1 = advanceApplication(app.id)!;
    expect(step1.status).toBe("in_review");
    const step2 = advanceApplication(app.id)!;
    expect(step2.status).toBe("approved");
    const step3 = advanceApplication(app.id)!;
    expect(step3.status).toBe("delivered");
    const step4 = advanceApplication(app.id)!;
    expect(step4.status).toBe("delivered"); // no-op past terminal
  });

  it("approveApplication rejects a second approval on the same application", () => {
    const app = createApplication({ serviceId: "domicile_cert", citizenId: "demo", citizenName: "Sukhmati Kashyap", districtId: "bastar", channel: "web", assistedBy: null });
    const first = approveApplication(app.id);
    expect(first.error).toBeUndefined();
    expect(first.app?.status).toBe("approved");

    const second = approveApplication(app.id);
    expect(second.error).toBe("already_terminal");
  });

  it("rejectApplication refuses to reject an already-approved application", () => {
    const app = createApplication({ serviceId: "birth_cert", citizenId: "demo", citizenName: "Sukhmati Kashyap", districtId: "bastar", channel: "web", assistedBy: null });
    approveApplication(app.id);
    const result = rejectApplication(app.id);
    expect(result.error).toBe("already_terminal");
    expect(getApplication(app.id)?.status).toBe("approved"); // unchanged
  });

  it("returns null for an application that doesn't exist", () => {
    expect(advanceApplication("NOPE")).toBeNull();
    expect(approveApplication("NOPE").error).toBe("not_found");
  });
});

describe("Application Health Check", () => {
  let citizen: ReturnType<typeof getCitizen>;
  beforeAll(() => { citizen = getCitizen("demo"); });

  it("flags insufficient documents when the vault is empty for a document-heavy service", () => {
    const empty = { ...citizen!, id: "no-docs-citizen" };
    const health = checkApplication("scholarship", empty, []);
    expect(health.docsOk.have).toBeLessThan(health.docsOk.need);
  });

  it("is deterministic — the same service+citizen id always produces the same consistency verdict", () => {
    const vault = listDocuments("demo");
    const a = checkApplication("old_pension", citizen!, vault);
    const b = checkApplication("old_pension", citizen!, vault);
    expect(a.consistency.ok).toBe(b.consistency.ok);
    expect(a.overallOk).toBe(b.overallOk);
  });
});
