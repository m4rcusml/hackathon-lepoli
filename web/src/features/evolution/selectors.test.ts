import { describe, expect, it } from "vitest";
import type { Evidence, Snapshot } from "@/lib/api/types";
import {
  coordinateDay,
  datedEvents,
  dayCoordinate,
  eventDay,
  overlapWindow,
  resolveSeries,
  uniformReference,
  unitSeries,
} from "./selectors";

function evidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "e1",
    version: "1",
    kind: "lab_result",
    label: "Glicemia",
    occurredOn: "2025-10-18",
    occurredAt: null,
    ingestedAt: "2026-11-11T15:00:00Z",
    sourceId: "lab",
    documentId: null,
    provenance: "extracted",
    value: 104,
    unit: "mg/dL",
    referenceRange: { min: 70, max: 99, text: null },
    text: null,
    status: "attention",
    supersedes: null,
    ...overrides,
  };
}

describe("evolution selectors", () => {
  it("preserves a civil collection date and converts instants only to the display timezone", () => {
    expect(eventDay(evidence())).toBe("2025-10-18");
    expect(coordinateDay(dayCoordinate("2025-10-18"))).toBe("2025-10-18");
    expect(
      eventDay(
        evidence({ occurredOn: null, occurredAt: "2025-10-18T01:30:00Z" }),
      ),
    ).toBe("2025-10-17");
    expect(eventDay(evidence({ occurredOn: null }))).toBeNull();
  });

  it("resolves the exact evidence version, orders by event date and excludes dates outside the filter", () => {
    const snapshot = {
      evidence: [evidence(), evidence({ id: "old", occurredOn: "2022-03-15" })],
    } as Snapshot;
    const result = resolveSeries(
      snapshot,
      [
        { id: "e1", version: "2" },
        { id: "old", version: "1" },
        { id: "e1", version: "1" },
      ],
      { from: "2025-01-01", to: "" },
    );
    expect(result.missingReferences).toBe(1);
    expect(result.records.map((record) => record.id)).toEqual(["e1"]);
  });

  it("separates incompatible units and preserves null instead of replacing it with zero", () => {
    const result = unitSeries([
      evidence(),
      evidence({ id: "si", unit: "mmol/L", value: 5.8 }),
      evidence({ id: "missing", value: null }),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].points.map((point) => point.value)).toEqual([104, null]);
    expect(result[1].unit).toBe("mmol/L");
  });

  it("breaks a daily wearable curve at missing days without inventing a measurement", () => {
    const result = unitSeries(
      [
        evidence({ occurredOn: "2026-11-01" }),
        evidence({ id: "later", occurredOn: "2026-11-04" }),
      ],
      true,
    );
    expect(result[0].points[1]).toMatchObject({
      day: "2026-11-02",
      value: null,
      evidence: null,
    });
  });

  it("does not suggest overlap between 2025 exams and 2026 wearables", () => {
    expect(
      overlapWindow([evidence()], [evidence({ occurredOn: "2026-11-11" })]),
    ).toBeNull();
    expect(overlapWindow([evidence()], [evidence()])).toEqual([
      "2025-10-18",
      "2025-10-18",
    ]);
  });

  it("only draws a common reference when all laboratories report the same range", () => {
    expect(uniformReference([evidence()])).toEqual({ min: 70, max: 99 });
    expect(
      uniformReference([
        evidence(),
        evidence({ referenceRange: { min: 70, max: 100, text: null } }),
      ]),
    ).toBeNull();
  });

  it("does not invent medication start dates from ingestion", () => {
    const snapshot = {
      clinicalContext: {
        items: [
          { id: "undated", kind: "medication", startDate: null },
          { id: "dated", kind: "medication", startDate: "2025-10-18" },
        ],
      },
    } as Snapshot;
    expect(
      datedEvents(snapshot, { from: "", to: "" }).map((item) => item.id),
    ).toEqual(["dated"]);
  });
});
