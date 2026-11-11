import { describe, expect, it } from "vitest";
import type { Evidence, Schemas } from "@/lib/api/types";
import {
  evidenceKey,
  initialGraphFocus,
  layoutGraph,
  selectGraph,
  type GraphFilters,
} from "./selectors";

const ref = { id: "exam-1", version: "v2" };
const evidence: Evidence = {
  ...ref,
  kind: "lab_result",
  label: "Glicemia",
  occurredOn: "2025-10-18",
  occurredAt: null,
  ingestedAt: "2026-11-11T12:00:00Z",
  sourceId: "lab-1",
  documentId: null,
  provenance: "extracted",
  value: 104,
  unit: "mg/dL",
  referenceRange: null,
  text: null,
  status: "attention",
  supersedes: null,
};
const nodes: Schemas["GraphNode"][] = [
  { id: "patient", kind: "patient", label: "Paciente", evidenceRefs: [] },
  { id: "glucose", kind: "biomarker", label: "Glicemia", evidenceRefs: [ref] },
  {
    id: "unknown-date",
    kind: "medication",
    label: "Medicação sem início conhecido",
    evidenceRefs: [{ id: "med", version: "v1" }],
  },
];
const edges: Schemas["GraphEdge"][] = [
  {
    id: "edge-1",
    source: "patient",
    target: "glucose",
    basis: "recorded_fact",
    label: "Resultado registrado",
    evidenceRefs: [ref],
  },
  {
    id: "edge-2",
    source: "glucose",
    target: "unknown-date",
    basis: "suggested_hypothesis",
    label: "Hipótese fornecida",
    evidenceRefs: [ref],
  },
];
const snapshot = {
  evidence: [evidence],
  graph: { state: "available", nodes, edges, reasonCode: null },
} satisfies Pick<Schemas["Snapshot"], "evidence" | "graph">;
const all: GraphFilters = { focusId: "", from: "", to: "", basis: "" };

describe("clinical graph selection", () => {
  it("does not display graph payload when projection is not shared", () => {
    expect(
      selectGraph(
        { ...snapshot, graph: { ...snapshot.graph, state: "not_shared" } },
        all,
      ),
    ).toEqual({ nodes: [], edges: [] });
  });

  it("filters by clinical event date, not ingestion date", () => {
    expect(selectGraph(snapshot, { ...all, from: "2026-01-01" }).edges).toEqual(
      [],
    );
    expect(
      selectGraph(snapshot, { ...all, from: "2025-10-18", to: "2025-10-18" })
        .edges,
    ).toHaveLength(2);
  });

  it("does not resolve a different version when selecting a dated relation", () => {
    const previousVersion = { ...evidence, version: "v1" };
    expect(
      selectGraph(
        { ...snapshot, evidence: [previousVersion] },
        { ...all, from: "2025-01-01" },
      ).edges,
    ).toEqual([]);
    expect(evidenceKey(ref)).not.toBe(evidenceKey(previousVersion));
  });

  it("uses the displayed São Paulo date for event instants across UTC midnight", () => {
    const instant = {
      ...evidence,
      occurredOn: null,
      occurredAt: "2025-10-19T01:00:00Z",
    };
    expect(
      selectGraph(
        { ...snapshot, evidence: [instant] },
        { ...all, from: "2025-10-18", to: "2025-10-18" },
      ).edges,
    ).toHaveLength(2);
  });

  it("keeps endpoints as context when focusing a record and never creates relations", () => {
    const result = selectGraph(snapshot, { ...all, focusId: "patient" });
    expect(result.edges.map((edge) => edge.id)).toEqual(["edge-1"]);
    expect(result.nodes.map((node) => node.id).sort()).toEqual([
      "glucose",
      "patient",
    ]);
    expect(result.edges[0].basis).toBe("recorded_fact");
  });

  it("filters the supplied basis without interpreting associations", () => {
    const result = selectGraph(snapshot, {
      ...all,
      basis: "suggested_hypothesis",
    });
    expect(result.edges.map((edge) => edge.id)).toEqual(["edge-2"]);
    expect(result.nodes.map((node) => node.id).sort()).toEqual([
      "glucose",
      "unknown-date",
    ]);
  });

  it("ignores dangling edges", () => {
    expect(
      selectGraph(
        {
          ...snapshot,
          graph: {
            ...snapshot.graph,
            edges: [{ ...edges[0], target: "missing-node" }],
          },
        },
        all,
      ).edges,
    ).toEqual([]);
  });
});

describe("clinical graph layout", () => {
  it.each([false, true])(
    "is deterministic in orientation %s without mutating the payload",
    (vertical) => {
      const before = JSON.stringify(nodes);
      const layout = layoutGraph(nodes, vertical);
      expect(layoutGraph([...nodes].reverse(), vertical)).toEqual(layout);
      expect(JSON.stringify(nodes)).toBe(before);
      expect(
        new Set(layout.map((node) => `${node.position.x}:${node.position.y}`))
          .size,
      ).toBe(nodes.length);
    },
  );
  it("focuses only an exact evidence version supplied by the first finding", () => {
    const finding = {
      id: "finding",
      title: "Glicemia",
      text: "Registrado",
      basis: "recorded_fact" as const,
      evidenceRefs: [ref],
    };
    const input = {
      ...snapshot,
      briefing: {
        state: "available" as const,
        reasonCode: null,
        items: [finding],
      },
    };
    expect(initialGraphFocus(input)).toBe("glucose");
    expect(
      initialGraphFocus({
        ...input,
        briefing: {
          ...input.briefing,
          items: [
            { ...finding, evidenceRefs: [{ ...ref, version: "unknown" }] },
          ],
        },
      }),
    ).toBe("");
  });
});
