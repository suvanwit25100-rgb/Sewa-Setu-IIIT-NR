import { getApplication } from "@/lib/db";
import { service, dept } from "@/lib/reference";
import { ok, Errors } from "@/lib/api";
import { getSession } from "@/lib/auth";
import type { AppStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGES: AppStatus[] = ["submitted", "auto_verifying", "in_review", "approved", "delivered"];
const STAGE_LABEL: Record<AppStatus, string> = {
  submitted: "Application Submitted", auto_verifying: "Document Verification",
  in_review: "Department Review", approved: "Approval", delivered: "Delivered", rejected: "Rejected",
};

// This schema doesn't record a timestamp per stage transition (only
// submittedAt + the last updatedAt), so intermediate stage timestamps are
// not fabricated here — only the two we actually know are populated.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Errors.unauthenticated();

  const { id } = await params;
  const app = getApplication(id);
  if (!app) return Errors.notFound("Application");

  const svc = service(app.serviceId);
  const d = dept(svc.departmentId);
  const currentIdx = app.status === "rejected" ? STAGES.indexOf("in_review") : STAGES.indexOf(app.status);

  const timeline = STAGES.map((stage, i) => {
    const reached = i <= currentIdx;
    const isCurrent = i === currentIdx && !["delivered", "rejected"].includes(app.status);
    return {
      stage, label: STAGE_LABEL[stage], department: d.name_en,
      status: reached ? (isCurrent ? "IN_PROGRESS" : "DONE") : "PENDING",
      startedAt: i === 0 ? app.submittedAt : reached ? app.updatedAt : null,
      completedAt: reached && !isCurrent ? app.updatedAt : null,
      citizenActionRequired: false,
    };
  });

  return ok({ applicationId: id, currentStage: app.status, timeline, rejected: app.status === "rejected" });
}
