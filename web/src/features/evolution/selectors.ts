import type { Evidence, EvidenceRef, Schemas, Snapshot } from "@/lib/api/types";

export type Period = { from: string; to: string };
export type SeriesPoint = {
  day: string;
  x: number;
  value: number | null;
  evidence: Evidence | null;
};
export type UnitSeries = {
  unit: string | null;
  points: SeriesPoint[];
  records: Evidence[];
};

const civilFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export const metricLabels: Record<Schemas["WearableSeries"]["metric"], string> =
  {
    resting_heart_rate: "Frequência cardíaca em repouso",
    heart_rate: "Frequência cardíaca",
    hrv: "Variabilidade cardíaca (HRV)",
    sleep_total: "Sono total",
    sleep_deep: "Sono profundo",
    sleep_rem: "Sono REM",
    spo2: "Saturação de oxigênio",
    steps: "Passos",
  };

export function eventDay(
  record: Pick<Evidence, "occurredOn" | "occurredAt">,
): string | null {
  if (record.occurredOn) return record.occurredOn;
  if (!record.occurredAt) return null;
  const parts = civilFormatter.formatToParts(new Date(record.occurredAt));
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)?.value)
    .join("-");
}

// UTC is only an ordinal for chart spacing; it does not supply a collection time.
export function dayCoordinate(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date);
}

export function coordinateDay(value: number): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function inPeriod(day: string | null, period: Period): boolean {
  return (
    day !== null &&
    (!period.from || day >= period.from) &&
    (!period.to || day <= period.to)
  );
}

export function resolveSeries(
  snapshot: Snapshot,
  refs: EvidenceRef[],
  period: Period,
): {
  records: Evidence[];
  missingReferences: number;
  undated: Evidence[];
} {
  const index = new Map(
    snapshot.evidence.map((record) => [
      JSON.stringify([record.id, record.version]),
      record,
    ]),
  );
  const resolved = refs.map((ref) =>
    index.get(JSON.stringify([ref.id, ref.version])),
  );
  const records = resolved.filter((record): record is Evidence =>
    Boolean(record),
  );
  return {
    records: records
      .filter((record) => inPeriod(eventDay(record), period))
      .sort(
        (a, b) =>
          (eventDay(a) ?? "").localeCompare(eventDay(b) ?? "") ||
          (a.occurredAt ?? "").localeCompare(b.occurredAt ?? ""),
      ),
    missingReferences: resolved.filter((record) => !record).length,
    undated: records.filter((record) => !eventDay(record)),
  };
}

export function unitSeries(records: Evidence[], daily = false): UnitSeries[] {
  const grouped = new Map<string | null, Evidence[]>();
  for (const record of records) {
    const list = grouped.get(record.unit) ?? [];
    list.push(record);
    grouped.set(record.unit, list);
  }
  return Array.from(grouped, ([unit, group]) => {
    const points: SeriesPoint[] = group
      .flatMap((record) => {
        const day = eventDay(record);
        return day
          ? [
              {
                day,
                x: dayCoordinate(day),
                value: record.value,
                evidence: record,
              },
            ]
          : [];
      })
      .sort((a, b) => a.x - b.x);
    if (daily && points.length > 1) {
      const withGaps: SeriesPoint[] = [];
      points.forEach((point, index) => {
        const previous = points[index - 1];
        if (previous && point.x - previous.x > 86_400_000) {
          const x = previous.x + 86_400_000;
          withGaps.push({
            day: coordinateDay(x),
            x,
            value: null,
            evidence: null,
          });
        }
        withGaps.push(point);
      });
      return { unit, points: withGaps, records: group };
    }
    return { unit, points, records: group };
  });
}

export function dateWindow(records: Evidence[]): [string, string] | null {
  const dates = records
    .map(eventDay)
    .filter((day): day is string => day !== null)
    .sort();
  return dates.length ? [dates[0], dates[dates.length - 1]] : null;
}

export function overlapWindow(
  left: Evidence[],
  right: Evidence[],
): [string, string] | null {
  const a = dateWindow(left),
    b = dateWindow(right);
  if (!a || !b) return null;
  const from = a[0] > b[0] ? a[0] : b[0];
  const to = a[1] < b[1] ? a[1] : b[1];
  return from <= to ? [from, to] : null;
}

export function uniformReference(
  records: Evidence[],
): { min: number; max: number } | null {
  if (!records.length) return null;
  const reference = records[0].referenceRange;
  if (
    reference?.min === null ||
    reference?.min === undefined ||
    reference.max === null
  )
    return null;
  if (
    records.some(
      (record) =>
        record.referenceRange?.min !== reference.min ||
        record.referenceRange.max !== reference.max,
    )
  )
    return null;
  return { min: reference.min, max: reference.max };
}

export function datedEvents(
  snapshot: Snapshot,
  period: Period,
): Schemas["ContextItem"][] {
  return snapshot.clinicalContext.items
    .filter(
      (item) =>
        (item.kind === "medication" || item.kind === "symptom") &&
        inPeriod(item.startDate, period),
    )
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
}
