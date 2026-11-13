import type { Evidence, EvidenceRef, Schemas, Snapshot } from "@/lib/api/types";

export const nodeKindLabels: Record<Schemas["GraphNode"]["kind"], string> = {
  patient: "Paciente",
  condition: "Condição registrada",
  symptom: "Sintoma relatado",
  medication: "Medicação",
  biomarker: "Biomarcador",
  wearable_event: "Evento de wearable",
  document: "Documento",
};

export function evidenceKey(ref: EvidenceRef): string {
  return JSON.stringify([ref.id, ref.version]);
}

export function graphEvidence(
  snapshot: Pick<Snapshot, "evidence">,
): Map<string, Evidence> {
  return new Map(snapshot.evidence.map((item) => [evidenceKey(item), item]));
}

export interface GraphFilters {
  focusId: string;
  from: string;
  to: string;
  basis: "" | Schemas["GraphEdge"]["basis"];
}

const eventDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function selectGraph(
  snapshot: Pick<Snapshot, "evidence" | "graph">,
  filters: GraphFilters,
) {
  if (snapshot.graph.state !== "available") return { nodes: [], edges: [] };
  const evidence = graphEvidence(snapshot);
  const hasPeriod = Boolean(filters.from || filters.to);
  const inPeriod = (refs: EvidenceRef[]) =>
    !hasPeriod ||
    refs.some((ref) => {
      const item = evidence.get(evidenceKey(ref));
      const day =
        item?.occurredOn ??
        (item?.occurredAt ? eventDay.format(new Date(item.occurredAt)) : null);
      return Boolean(
        day &&
        (!filters.from || day >= filters.from) &&
        (!filters.to || day <= filters.to),
      );
    });
  const nodeIds = new Set(snapshot.graph.nodes.map((node) => node.id));
  const edges = snapshot.graph.edges
    .filter(
      (edge) =>
        nodeIds.has(edge.source) &&
        nodeIds.has(edge.target) &&
        (!filters.basis || edge.basis === filters.basis) &&
        (!filters.focusId ||
          edge.source === filters.focusId ||
          edge.target === filters.focusId) &&
        inPeriod(edge.evidenceRefs),
    )
    .toSorted((a, b) => a.id.localeCompare(b.id));
  const connectedIds = new Set(
    edges.flatMap((edge) => [edge.source, edge.target]),
  );
  const nodes = snapshot.graph.nodes
    .filter(
      (node) =>
        connectedIds.has(node.id) ||
        ((!filters.focusId || filters.focusId === node.id) &&
          !filters.basis &&
          inPeriod(node.evidenceRefs)),
    )
    .toSorted(
      (a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id),
    );
  return { nodes, edges };
}

const columnByKind: Record<Schemas["GraphNode"]["kind"], number> = {
  patient: 0,
  condition: 1,
  symptom: 1,
  medication: 2,
  biomarker: 2,
  wearable_event: 2,
  document: 3,
};

export function initialGraphFocus(
  snapshot: Pick<Snapshot, "briefing" | "graph">,
) {
  const refs = snapshot.briefing.items[0]?.evidenceRefs ?? [];
  return (
    snapshot.graph.nodes.find(
      (node) =>
        node.kind !== "patient" &&
        node.evidenceRefs.some((ref) =>
          refs.some((item) => evidenceKey(item) === evidenceKey(ref)),
        ),
    )?.id ?? ""
  );
}

export function layoutGraph(nodes: Schemas["GraphNode"][], vertical = false) {
  const rows = new Map<number, number>();
  const columns = [
    ...new Set(nodes.map((node) => columnByKind[node.kind])),
  ].sort((a, b) => a - b);
  return nodes
    .toSorted(
      (a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id),
    )
    .map((node) => {
      const column = columns.indexOf(columnByKind[node.kind]);
      const row = rows.get(column) ?? 0;
      rows.set(column, row + 1);
      return {
        ...node,
        position: vertical
          ? { x: row * 260, y: column * 240 }
          : { x: column * 500, y: row * 180 },
      };
    });
}
