import { describe, it, expect } from "vitest";
import { slaRisk, delayRisk } from "../src/lib/ai";
import type { Application } from "../src/lib/types";

function app(overrides: Partial<Application> = {}): Application {
  const submittedAt = new Date(Date.now() - 5 * 864e5).toISOString();
  return {
    id: "A1", serviceId: "income_cert", citizenId: "demo", citizenName: "Test",
    districtId: "raipur", status: "in_review", channel: "web", assistedBy: null,
    submittedAt, slaDays: 15, dueAt: new Date(new Date(submittedAt).getTime() + 15 * 864e5).toISOString(),
    updatedAt: submittedAt, autoVerified: 1,
    ...overrides,
  };
}

describe("slaRisk (SLA Intelligence)", () => {
  it("is LOW risk early in the SLA window", () => {
    const a = app({ submittedAt: new Date().toISOString(), dueAt: new Date(Date.now() + 30 * 864e5).toISOString(), slaDays: 30 });
    expect(slaRisk(a).risk).toBe("low");
  });

  it("is EXCEEDED once past the due date and still pending", () => {
    const a = app({
      submittedAt: new Date(Date.now() - 40 * 864e5).toISOString(),
      dueAt: new Date(Date.now() - 10 * 864e5).toISOString(),
      slaDays: 30, status: "in_review",
    });
    expect(slaRisk(a).risk).toBe("exceeded");
  });

  it("is LOW risk (100% elapsed, non-alarming) once delivered — a finished app isn't 'at risk'", () => {
    const a = app({ status: "delivered" });
    const r = slaRisk(a);
    expect(r.risk).toBe("low");
    expect(r.elapsedPct).toBe(100);
  });
});

describe("delayRisk (decision-support indicator)", () => {
  it("stays within the documented 4-96 score band", () => {
    const a = app();
    const { pct } = delayRisk(a);
    expect(pct).toBeGreaterThanOrEqual(4);
    expect(pct).toBeLessThanOrEqual(96);
  });

  it("scores an un-auto-verified application higher than an equivalent auto-verified one", () => {
    const base = app({ autoVerified: 1 });
    const risky = app({ autoVerified: 0 });
    expect(delayRisk(risky).pct).toBeGreaterThan(delayRisk(base).pct);
  });

  it("always returns at least one human-readable reason", () => {
    const { reasons_en, reasons_hi } = delayRisk(app());
    expect(reasons_en.length).toBeGreaterThan(0);
    expect(reasons_hi.length).toBe(reasons_en.length);
  });
});
