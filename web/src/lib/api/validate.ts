import { z } from "zod";
import * as validators from "./validators.js";
import { ApiError } from "./errors";
import type { Schemas, Snapshot } from "./types";

const envelope = z
  .object({
    meta: z
      .object({
        requestId: z.string().min(1),
        serverTime: z.iso.datetime({ offset: true }),
        contractVersion: z.literal("0.1-draft"),
      })
      .strict(),
    data: z.unknown(),
  })
  .strict();
export function validate<K extends keyof typeof validators>(
  name: K,
  raw: unknown,
): Schemas[K] {
  if (!validators[name](raw)) throw new ApiError(502, "INVALID_RESPONSE");
  return raw as Schemas[K];
}
export function parseResponse<K extends keyof typeof validators>(
  name: K,
  raw: unknown,
) {
  const parsed = envelope.safeParse(raw);
  if (!parsed.success) throw new ApiError(502, "INVALID_RESPONSE");
  const data = validate(name, parsed.data.data);
  if (name === "Snapshot") assertSnapshot(data as Snapshot);
  return { data, serverTime: parsed.data.meta.serverTime };
}
export function assertSnapshot(s: Snapshot) {
  const invalid = () => {
    throw new ApiError(502, "INVALID_RESPONSE");
  };
  if (s.patientId !== s.patient.id || s.patientId !== s.access.patientId)
    invalid();
  const evidence = new Map(s.evidence.map((e) => [`${e.id}@${e.version}`, e]));
  if (evidence.size !== s.evidence.length) invalid();
  const sources = new Set(s.sources.map((x) => x.id));
  const docs = new Set(s.documents.items.map((x) => x.id));
  if (
    sources.size !== s.sources.length ||
    docs.size !== s.documents.items.length ||
    new Set(s.graph.nodes.map((n) => n.id)).size !== s.graph.nodes.length ||
    new Set(s.graph.edges.map((e) => e.id)).size !== s.graph.edges.length
  )
    invalid();
  const refs = (rs: Schemas["EvidenceRef"][]) => {
    for (const r of rs) if (!evidence.has(`${r.id}@${r.version}`)) invalid();
  };
  for (const e of s.evidence) {
    if (!sources.has(e.sourceId) || (e.documentId && !docs.has(e.documentId)))
      invalid();
    if (e.supersedes) refs([e.supersedes]);
  }
  for (const x of [
    ...s.clinicalContext.items,
    ...s.alerts.items,
    ...s.briefing.items,
    ...s.timeline,
    ...s.documents.items,
    ...s.graph.nodes,
    ...s.graph.edges,
  ])
    refs(x.evidenceRefs);
  for (const d of s.documents.items) if (!sources.has(d.sourceId)) invalid();
  for (const series of s.exams.items) refs(series.measurementRefs);
  for (const series of s.wearables.items) refs(series.pointRefs);
  const nodes = new Set(s.graph.nodes.map((x) => x.id));
  for (const edge of s.graph.edges)
    if (!nodes.has(edge.source) || !nodes.has(edge.target)) invalid();
  if (
    s.graph.nodes.some(
      (n) => n.kind !== "patient" && n.evidenceRefs.length === 0,
    )
  )
    invalid();
  // Defense in depth: backend must project every category before transport.
  const scopes = s.access.scopes;
  const allowed = (kind: Schemas["Evidence"]["kind"]) => {
    if (kind === "lab_result" || kind === "document")
      return scopes.includes("read_exams");
    if (kind.startsWith("wearable")) return scopes.includes("read_wearables");
    return scopes.includes("read_clinical_context");
  };
  if (s.evidence.some((e) => !allowed(e.kind))) invalid();
  if (
    !scopes.includes("read_exams") &&
    (s.exams.state !== "not_shared" || s.documents.state !== "not_shared")
  )
    invalid();
  if (!scopes.includes("read_wearables") && s.wearables.state !== "not_shared")
    invalid();
  if (
    !scopes.includes("read_clinical_context") &&
    s.clinicalContext.state !== "not_shared"
  )
    invalid();
  if (!scopes.includes("read_alerts") && s.alerts.state !== "not_shared")
    invalid();
  if (
    !scopes.includes("read_graphrag_briefing") &&
    s.briefing.state !== "not_shared"
  )
    invalid();
  for (const source of s.sources) {
    if (
      (source.kind === "laboratory" && !scopes.includes("read_exams")) ||
      (source.kind === "wearable" && !scopes.includes("read_wearables")) ||
      (["patient", "clinical_record"].includes(source.kind) &&
        !scopes.includes("read_clinical_context"))
    )
      invalid();
  }
  for (const node of s.graph.nodes) {
    if (
      (node.kind === "biomarker" || node.kind === "document") &&
      !scopes.includes("read_exams")
    )
      invalid();
    if (node.kind === "wearable_event" && !scopes.includes("read_wearables"))
      invalid();
    if (
      ["condition", "symptom", "medication"].includes(node.kind) &&
      !scopes.includes("read_clinical_context")
    )
      invalid();
  }
}
