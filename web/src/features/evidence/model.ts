import type { Evidence, EvidenceRef, Snapshot } from "@/lib/api/types";

export const evidenceKey = (ref: EvidenceRef) =>
  JSON.stringify([ref.id, ref.version]);

export function evidenceIndex(snapshot: Snapshot): Map<string, Evidence> {
  return new Map(snapshot.evidence.map((item) => [evidenceKey(item), item]));
}

export function resolveEvidence(
  snapshot: Snapshot,
  ref: EvidenceRef,
): Evidence | undefined {
  return snapshot.evidence.find(
    (item) => item.id === ref.id && item.version === ref.version,
  );
}

export function filterHistory(
  snapshot: Snapshot,
  filters: { kind: string; source: string; from: string; to: string },
) {
  const evidence = evidenceIndex(snapshot);
  return snapshot.timeline
    .filter((event) => {
      const occurred = event.occurredOn ?? event.occurredAt?.slice(0, 10);
      if (filters.kind && event.kind !== filters.kind) return false;
      if (
        filters.source &&
        !event.evidenceRefs.some(
          (ref) => evidence.get(evidenceKey(ref))?.sourceId === filters.source,
        )
      )
        return false;
      if (filters.from && (!occurred || occurred < filters.from)) return false;
      if (filters.to && (!occurred || occurred > filters.to)) return false;
      return true;
    })
    .sort(
      (a, b) =>
        (b.occurredOn ?? b.occurredAt ?? "").localeCompare(
          a.occurredOn ?? a.occurredAt ?? "",
        ) || a.id.localeCompare(b.id),
    );
}
