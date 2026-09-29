import { describe, it, expect } from "vitest";
import { createApplication, createGrievance, updateGrievanceStatus, computeMis, computeGovernance } from "../src/lib/db";

describe("grievance lifecycle", () => {
  it("open -> acknowledged -> resolved succeeds; resolved -> acknowledged is rejected", () => {
    const app = createApplication({ serviceId: "ration_card", citizenId: "demo", citizenName: "Sukhmati Kashyap", districtId: "bastar", channel: "web", assistedBy: null });
    const g = createGrievance(app.id, "test grievance")!;
    expect(g.status).toBe("open");

    const ack = updateGrievanceStatus(g.id, "acknowledged");
    expect(ack.error).toBeUndefined();
    expect(ack.grievance?.status).toBe("acknowledged");

    const resolved = updateGrievanceStatus(g.id, "resolved");
    expect(resolved.grievance?.status).toBe("resolved");

    const invalid = updateGrievanceStatus(g.id, "acknowledged");
    expect(invalid.error).toBe("invalid_transition");
  });

  it("refuses to create a grievance for a non-existent application", () => {
    expect(createGrievance("NOPE", "x")).toBeNull();
  });
});

describe("governance analytics (bottleneck + root cause)", () => {
  it("computeMis totals stay internally consistent", () => {
    const mis = computeMis();
    expect(mis.totals.total).toBeGreaterThan(0);
    expect(mis.totals.pending + mis.byStatus.filter((s) => ["approved", "delivered", "rejected"].includes(s.status)).reduce((s, x) => s + x.count, 0)).toBe(mis.totals.total);
  });

  it("computeGovernance's pipeline funnel is monotonically non-increasing", () => {
    const gov = computeGovernance();
    for (let i = 1; i < gov.pipeline.length; i++) {
      expect(gov.pipeline[i].count).toBeLessThanOrEqual(gov.pipeline[i - 1].count);
    }
  });

  it("root cause percentages never exceed 100 and the bottleneck stage is one of the funnel stages", () => {
    const gov = computeGovernance();
    for (const r of gov.rootCause) expect(r.pct).toBeLessThanOrEqual(100);
    expect(gov.pipeline.map((p) => p.stage)).toContain(gov.bottleneck.stage);
  });
});
