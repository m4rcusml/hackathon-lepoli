import type { EvidenceRef, OpenEvidence, Snapshot } from "@/lib/api/types";
import { date, number } from "@/lib/clinical/format";
import { resolveEvidence, evidenceKey } from "./model";
import styles from "./evidence.module.css";

export function EvidenceLinks({
  snapshot,
  refs,
  openEvidence,
  compact = false,
}: {
  snapshot: Snapshot;
  refs: EvidenceRef[];
  openEvidence: OpenEvidence;
  compact?: boolean;
}) {
  return (
    <div className={styles.links}>
      {refs.map((ref) => {
        const evidence = resolveEvidence(snapshot, ref);
        return evidence ? (
          <button
            type="button"
            key={evidenceKey(ref)}
            className="text-link"
            onClick={() => openEvidence(ref)}
            aria-label={`${compact ? "Conferir origem" : "Ver evidência"}: ${evidence.label}${evidence.value !== null ? ` · ${number(evidence.value)} ${evidence.unit ?? ""}` : ""} ${date(evidence.occurredOn ?? evidence.occurredAt)}, versão ${ref.version}`}
          >
            {compact ? "Conferir origem" : <>{evidence.label}{evidence.value !== null ? ` · ${number(evidence.value)} ${evidence.unit ?? ""}` : ""} <span className="muted">{date(evidence.occurredOn ?? evidence.occurredAt)}</span></>}
          </button>
        ) : (
          <span key={evidenceKey(ref)} className="muted">
            Evidência indisponível nesta versão
          </span>
        );
      })}
    </div>
  );
}
