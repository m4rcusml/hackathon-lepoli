import { describe, expect, it } from "vitest";
import { createFixture } from "@/lib/demo/fixture";
import { evidenceIndex, filterHistory, resolveEvidence } from "./model";

describe("referências e histórico", () => {
  it("exige a versão exata da evidência", () => {
    const snapshot = createFixture();
    expect(
      resolveEvidence(snapshot, { id: "ex-fer-2025", version: "1" })?.value,
    ).toBe(22);
    expect(
      resolveEvidence(snapshot, { id: "ex-fer-2025", version: "2" }),
    ).toBeUndefined();
    expect(evidenceIndex(snapshot).size).toBe(snapshot.evidence.length);
  });

  it("filtra pela data clínica sem confundir recebimento em 2026 com coleta em 2025", () => {
    const snapshot = createFixture();
    const filters = {
      kind: "document",
      source: "",
      from: "2025-01-01",
      to: "2025-12-31",
    };
    const events = filterHistory(snapshot, filters);
    expect(events).toHaveLength(1);
    expect(events[0].occurredOn).toBe("2025-10-18");
    expect(
      filterHistory(snapshot, {
        ...filters,
        from: "2026-01-01",
        to: "2026-12-31",
      }),
    ).toHaveLength(0);
  });

  it("mantém registros sem data fora de filtros datados e restringe fonte", () => {
    const snapshot = createFixture();
    snapshot.timeline.push({
      id: "undated",
      groupId: "undated",
      kind: "patient_report",
      label: "Sem data",
      occurredAt: null,
      occurredOn: null,
      receivedAt: snapshot.createdAt,
      evidenceRefs: [{ id: "vitamin-d", version: "1" }],
      documentId: null,
    });
    expect(
      filterHistory(snapshot, {
        kind: "",
        source: "src-patient",
        from: "",
        to: "",
      }).map((item) => item.id),
    ).toEqual(["undated"]);
    expect(
      filterHistory(snapshot, {
        kind: "",
        source: "src-patient",
        from: "2020-01-01",
        to: "",
      }),
    ).toHaveLength(0);
  });
});
