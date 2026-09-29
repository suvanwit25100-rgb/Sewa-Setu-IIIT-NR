import { z } from "zod";

// Schemas for the endpoints most likely to receive bad input from a form —
// applied to the highest-traffic mutation routes rather than literally
// every route, given this prototype's scope.
export const CreateApplicationSchema = z.object({
  serviceId: z.string().min(1),
  citizenId: z.string().min(1).default("demo"),
  channel: z.enum(["web", "whatsapp", "assisted", "voice"]).default("web"),
  assistedBy: z.string().nullable().default(null),
});

export const CreateGrievanceSchema = z.object({
  applicationId: z.string().min(1),
  description: z.string().max(2000).optional(),
});

export const CreateDocumentSchema = z.object({
  citizenId: z.string().min(1).default("demo"),
  fileName: z.string().min(1).max(200),
});

export const LoginSchema = z.object({
  role: z.enum(["citizen", "operator", "officer", "admin"]),
});

export const ChatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  citizenId: z.string().min(1).default("demo"),
});

export const GrievanceStatusSchema = z.object({
  status: z.enum(["open", "acknowledged", "resolved"]),
});

/** Parses `body` against `schema`; returns `{ ok: true, data }` on success
 *  or `{ ok: false, issue }` (a human-readable message, suitable for
 *  Errors.validation) on failure. `ok` is a literal-typed discriminant so
 *  `if (!parsed.ok) return ...; parsed.data` narrows correctly — unlike an
 *  optional-field union, which TypeScript won't narrow via a sibling check. */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): { ok: true; data: T } | { ok: false; issue: string } {
  const result = schema.safeParse(body);
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  return { ok: false, issue: `${first.path.join(".") || "body"}: ${first.message}` };
}
