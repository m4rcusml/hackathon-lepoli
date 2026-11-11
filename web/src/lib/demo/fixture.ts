import seed from "./laboratory-seed.json";
import base from "./base-snapshot.json";
import type {
  Evidence,
  EvidenceRef,
  Schemas,
  Snapshot,
  Scope,
} from "../api/types";

export const DEMO_TIME = "2026-11-11T15:00:00Z";
export const DEMO_PATIENT = "usr-dan-2026";
export const scenarioNames = [
  "active-initial",
  "active-with-updates",
  "concurrent-update",
  "restricted-exams",
  "pending-followup",
  "rejected-followup",
  "expired",
  "revoked",
  "temporary-only",
  "empty-portfolio",
  "empty-patient",
  "briefing-unavailable",
  "source-stale",
  "backend-unavailable",
  "invalid-response",
] as const;
export type DemoScenario = (typeof scenarioNames)[number];
export const ref = (e: Evidence): EvidenceRef => ({
  id: e.id,
  version: e.version,
});
const section = <T>(items: T[]) => ({
  state: items.length ? ("available" as const) : ("empty" as const),
  items,
  reasonCode: null,
});

// Metadata and wearable summaries below are synthetic; laboratory values mirror mobile seed.
export function createFixture(
  scenario: DemoScenario = "active-initial",
): Snapshot {
  const s = structuredClone(base) as Snapshot;
  s.patient.disambiguationLabel = "Identificação compartilhada";
  s.coverage = { from: "2022-03-15", to: "2026-11-11", truncated: false };
  const labIds: Record<string, string> = {
    "Fleury Medicina e Saúde": "src-fleury",
    "Laboratório Salomão Zoppi": "src-zoppi",
    "Dasa / Alta Excelência": "src-dasa",
  };
  s.sources = Object.entries(labIds).map(([label, id]) => ({
    id,
    label,
    kind: "laboratory",
    state: "stale",
    lastSyncedAt: DEMO_TIME,
    lastEventDate:
      id === "src-fleury"
        ? "2025-10-18"
        : id === "src-zoppi"
          ? "2023-05-20"
          : "2024-08-10",
    coverage: {
      from:
        id === "src-fleury"
          ? "2022-03-15"
          : id === "src-zoppi"
            ? "2023-05-20"
            : "2024-08-10",
      to:
        id === "src-fleury"
          ? "2025-10-18"
          : id === "src-zoppi"
            ? "2023-05-20"
            : "2024-08-10",
      truncated: false,
    },
  }));
  s.evidence = seed.map((e) => ({
    id: e.id,
    version: "1",
    kind: "lab_result",
    label: e.canonicalName,
    occurredOn: e.date,
    occurredAt: null,
    ingestedAt: "2026-11-11T14:30:00Z",
    sourceId: labIds[e.labName],
    documentId: `doc-${e.date}`,
    provenance: "extracted",
    value: e.value,
    unit: e.unit,
    referenceRange: { min: e.refMin, max: e.refMax, text: null },
    text: null,
    status: e.status as Evidence["status"],
    supersedes: null,
  }));
  s.exams = section(
    [...new Set(seed.map((e) => e.biomarkerId))].map((id) => ({
      id,
      label: seed.find((e) => e.biomarkerId === id)!.canonicalName,
      canonicalUnit: seed.find((e) => e.biomarkerId === id)!.unit,
      measurementRefs: s.evidence
        .filter((e) => seed.some((x) => x.id === e.id && x.biomarkerId === id))
        .map(ref),
    })),
  );
  s.documents = section(
    [...new Set(seed.map((e) => e.date))].map((day) => ({
      id: `doc-${day}`,
      title: `Laudo laboratorial — ${day.slice(0, 4)}`,
      sourceId: labIds[seed.find((e) => e.date === day)!.labName],
      occurredOn: day,
      receivedAt: "2026-11-11T14:30:00Z",
      mimeType: "application/pdf" as const,
      originalAvailable: false,
      evidenceRefs: s.evidence.filter((e) => e.occurredOn === day).map(ref),
    })),
  );
  s.timeline = s.documents.items.map((d) => ({
    id: `event-${d.id}`,
    groupId: d.id,
    kind: "document",
    label: d.title,
    occurredOn: d.occurredOn,
    occurredAt: null,
    receivedAt: d.receivedAt,
    evidenceRefs: d.evidenceRefs,
    documentId: d.id,
  }));
  s.sources.push({
    id: "src-patient",
    label: "Informado pelo paciente",
    kind: "patient",
    state: "unknown",
    lastSyncedAt: DEMO_TIME,
    lastEventDate: null,
    coverage: { from: null, to: null, truncated: false },
  });
  const context: Evidence[] = [
    {
      id: "family-history",
      kind: "family_history",
      label: "Histórico familiar de dislipidemia e arritmia",
      text: "História familiar; não é diagnóstico ativo do paciente.",
    },
    {
      id: "vitamin-d",
      kind: "medication",
      label: "Suplemento Vitamina D (2000 UI/dia)",
      text: "Data de início não informada.",
    },
  ].map((e) => ({
    ...e,
    version: "1",
    occurredOn: null,
    occurredAt: null,
    ingestedAt: DEMO_TIME,
    sourceId: "src-patient",
    documentId: null,
    provenance: "patient_reported",
    value: null,
    unit: null,
    referenceRange: null,
    status: "unknown",
    supersedes: null,
  })) as Evidence[];
  s.evidence.push(...context);
  s.clinicalContext = section(
    context.map((e) => ({
      id: e.id,
      kind: e.kind as "family_history" | "medication",
      label: e.label,
      startDate: null,
      endDate: null,
      evidenceRefs: [ref(e)],
    })),
  );
  const wearableDays = Array.from({ length: 30 }, (_, i) =>
    new Date(Date.UTC(2026, 9, 13 + i)).toISOString().slice(0, 10),
  );
  s.sources.push({
    id: "src-wearable",
    label: "Wearable · leituras diárias",
    kind: "wearable",
    state: scenario === "source-stale" ? "stale" : "current",
    lastSyncedAt: DEMO_TIME,
    lastEventDate: "2026-11-11",
    coverage: { from: "2026-10-13", to: "2026-11-11", truncated: false },
  });
  const metrics = [
    {
      id: "hrv",
      metric: "hrv" as const,
      unit: "ms",
      label: "Variabilidade cardíaca (HRV)",
      values: [54, 56, 58, 55, 57],
    },
    {
      id: "resting-heart-rate",
      metric: "resting_heart_rate" as const,
      unit: "bpm",
      label: "Frequência cardíaca em repouso",
      values: [62, 64, 61, 60, 63],
    },
  ];
  s.wearables = section(
    metrics.map((metric) => {
      const points: Evidence[] = wearableDays.map((day, i) => ({
        id: `${metric.id}-${day}`,
        version: "1",
        kind: "wearable_reading",
        label: metric.label,
        occurredOn: day,
        occurredAt: null,
        ingestedAt: DEMO_TIME,
        sourceId: "src-wearable",
        documentId: null,
        provenance: "extracted",
        value: metric.values[i % 5],
        unit: metric.unit,
        referenceRange: null,
        text: "Leitura diária, sem inferência de anomalia.",
        status: "unknown",
        supersedes: null,
      }));
      s.evidence.push(...points);
      return {
        id: metric.id,
        metric: metric.metric,
        unit: metric.unit,
        aggregation: "daily_summary" as const,
        coverage: {
          from: wearableDays[0],
          to: wearableDays[29],
          truncated: false,
        },
        pointRefs: points.map(ref),
      };
    }),
  );
  s.briefing.items.push(
    {
      id: "finding-ldl",
      title: "Evolução documentada do LDL",
      text: "112 mg/dL em 15/03/2022 e 156 mg/dL em 18/10/2025. Consulte a referência de cada laudo.",
      basis: "recorded_fact",
      evidenceRefs: ["ex-ldl-2022", "ex-ldl-2025"].map((id) => ({
        id,
        version: "1",
      })),
    },
    {
      id: "finding-glucose",
      title: "Glicemia de jejum no último laudo",
      text: "104 mg/dL em 18/10/2025; referência registrada de 70–99 mg/dL. A data de importação não altera a data de coleta.",
      basis: "recorded_fact",
      evidenceRefs: [{ id: "ex-glic-2025", version: "1" }],
    },
  );
  s.graph.nodes = [
    { id: "node-dan", kind: "patient", label: "Daniel Vaz", evidenceRefs: [] },
    ...s.exams.items.map((x) => ({
      id: `node-${x.id}`,
      kind: "biomarker" as const,
      label: x.label,
      evidenceRefs: x.measurementRefs,
    })),
    {
      id: "node-vitamin",
      kind: "medication",
      label: context[1].label,
      evidenceRefs: [ref(context[1])],
    },
  ];
  s.graph.edges = s.graph.nodes
    .filter((x) => x.id !== "node-dan")
    .map((x) => ({
      id: `edge-${x.id}`,
      source: "node-dan",
      target: x.id,
      label:
        x.kind === "medication"
          ? "Uso relatado, início desconhecido"
          : "Resultado laboratorial registrado",
      basis: "recorded_fact",
      evidenceRefs: x.evidenceRefs,
    }));
  if (["active-with-updates", "concurrent-update"].includes(scenario))
    s.review = {
      lastReviewedCursor: "cursor-before",
      lastReviewedAt: "2026-11-10T15:00:00Z",
      mode: "changes",
      unreadGroupCount: 2,
    };
  if (scenario === "briefing-unavailable")
    s.briefing = {
      state: "unavailable",
      items: [],
      reasonCode: "BRIEFING_GENERATION_UNAVAILABLE",
    };
  if (scenario === "restricted-exams") {
    s.access.scopes = ["read_exams"];
    s.access.scopeVersion = "scope-exams";
    s.accessRevision = "access-exams";
    s.evidence = s.evidence.filter((e) => e.kind === "lab_result");
    s.sources = s.sources.filter((x) => x.kind === "laboratory");
    s.clinicalContext = {
      state: "not_shared",
      items: [],
      reasonCode: "SCOPE_NOT_GRANTED",
    };
    s.wearables = {
      state: "not_shared",
      items: [],
      reasonCode: "SCOPE_NOT_GRANTED",
    };
    s.alerts = {
      state: "not_shared",
      items: [],
      reasonCode: "SCOPE_NOT_GRANTED",
    };
    s.briefing = {
      state: "not_shared",
      items: [],
      reasonCode: "SCOPE_NOT_GRANTED",
    };
    s.graph.nodes = s.graph.nodes.filter((x) => x.kind !== "medication");
    s.graph.edges = s.graph.edges.filter((x) => x.target !== "node-vitamin");
    s.coverage.to = "2025-10-18";
  }
  if (scenario === "empty-patient") {
    s.evidence = [];
    s.sources = [];
    s.timeline = [];
    s.coverage = { from: null, to: null, truncated: false };
    s.exams = section([]);
    s.wearables = section([]);
    s.clinicalContext = section([]);
    s.alerts = section([]);
    s.briefing = section([]);
    s.documents = section([]);
    s.graph = { state: "empty", nodes: [], edges: [], reasonCode: null };
  }
  return s;
}
export const demoDoctor: Schemas["Doctor"] = {
  id: "doctor-demo-1",
  displayName: "Dra. Helena Costa",
  professionalIdentifier: "Acesso autorizado",
};

export function projectFixture(snapshot: Snapshot, scopes: Scope[]): Snapshot {
  const s = structuredClone(snapshot);
  s.access.scopes = [...scopes];
  const allowedKind = (kind: Evidence["kind"]) =>
    kind === "lab_result" || kind === "document"
      ? scopes.includes("read_exams")
      : kind.startsWith("wearable")
        ? scopes.includes("read_wearables")
        : scopes.includes("read_clinical_context");
  s.evidence = s.evidence.filter((e) => allowedKind(e.kind));
  const ids = new Set(s.evidence.map((e) => JSON.stringify([e.id, e.version])));
  const permittedRefs = (refs: EvidenceRef[]) =>
    refs.every((ref) => ids.has(JSON.stringify([ref.id, ref.version])));
  const denied = {
    state: "not_shared" as const,
    items: [],
    reasonCode: "SCOPE_NOT_GRANTED",
  };
  if (!scopes.includes("read_exams")) {
    s.exams = denied;
    s.documents = denied;
  }
  if (!scopes.includes("read_clinical_context")) s.clinicalContext = denied;
  if (!scopes.includes("read_wearables")) s.wearables = denied;
  if (!scopes.includes("read_alerts")) s.alerts = denied;
  else if (s.alerts.state === "available")
    s.alerts = section(
      s.alerts.items.filter((item) => permittedRefs(item.evidenceRefs)),
    );
  if (!scopes.includes("read_graphrag_briefing")) s.briefing = denied;
  else if (s.briefing.state === "available")
    s.briefing = section(
      s.briefing.items.filter((item) => permittedRefs(item.evidenceRefs)),
    );
  s.timeline = s.timeline.filter(
    (item) => item.evidenceRefs.length > 0 && permittedRefs(item.evidenceRefs),
  );
  const sourceIds = new Set([
    ...s.evidence.map((item) => item.sourceId),
    ...s.documents.items.map((item) => item.sourceId),
  ]);
  s.sources = s.sources.filter((source) => sourceIds.has(source.id));
  const allowedNode = (node: Schemas["GraphNode"]) =>
    node.kind === "patient" ||
    (node.evidenceRefs.length > 0 && permittedRefs(node.evidenceRefs));
  s.graph.nodes = s.graph.nodes.filter(allowedNode);
  const nodeIds = new Set(s.graph.nodes.map((node) => node.id));
  s.graph.edges = s.graph.edges.filter(
    (edge) =>
      nodeIds.has(edge.source) &&
      nodeIds.has(edge.target) &&
      permittedRefs(edge.evidenceRefs),
  );
  if (s.graph.state === "available" && !s.graph.nodes.length)
    s.graph = { state: "empty", nodes: [], edges: [], reasonCode: null };
  const dates = s.evidence
    .map((item) => item.occurredOn)
    .filter((day): day is string => day !== null)
    .sort();
  s.coverage = {
    from: dates[0] ?? null,
    to: dates.at(-1) ?? null,
    truncated: s.coverage.truncated,
  };
  return s;
}
