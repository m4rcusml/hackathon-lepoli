"use client";

import { useState } from "react";
import { FileText, History as HistoryIcon, CalendarDays } from "lucide-react";
import type { OpenEvidence, Snapshot } from "@/lib/api/types";
import { date } from "@/lib/clinical/format";
import { EvidenceLinks } from "./EvidenceLinks";
import { filterHistory } from "./model";
import styles from "./evidence.module.css";

const kinds = {
  document: "Laudo",
  wearable_event: "Evento de wearable",
  patient_report: "Relato do paciente",
  medication: "Medicação",
  condition: "Condição",
  correction: "Correção",
};

export function History({
  snapshot,
  openEvidence,
}: {
  snapshot: Snapshot;
  openEvidence: OpenEvidence;
}) {
  const [filters, setFilters] = useState({
    kind: "",
    source: "",
    from: "",
    to: "",
  });
  const events = filterHistory(snapshot, filters);
  const invalidRange = Boolean(
    filters.from && filters.to && filters.from > filters.to,
  );
  return (
    <section className="stack" aria-labelledby="history-heading">
      <div className="section-heading">
        <div>
          <h2 id="history-heading">Histórico unificado</h2>
          <p className="muted">
            Documentos e eventos agrupados pela origem, na data em que
            ocorreram.
          </p>
        </div>
        <HistoryIcon size={22} aria-hidden="true" />
      </div>
      <div className="toolbar">
        <label className="field">
          Tipo
          <select
            value={filters.kind}
            onChange={(event) =>
              setFilters({ ...filters, kind: event.target.value })
            }
          >
            <option value="">Todos os tipos</option>
            {Object.entries(kinds).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Fonte
          <select
            value={filters.source}
            onChange={(event) =>
              setFilters({ ...filters, source: event.target.value })
            }
          >
            <option value="">Todas as fontes</option>
            {snapshot.sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          De
          <input
            type="date"
            value={filters.from}
            onChange={(event) =>
              setFilters({ ...filters, from: event.target.value })
            }
          />
        </label>
        <label className="field">
          Até
          <input
            type="date"
            value={filters.to}
            onChange={(event) =>
              setFilters({ ...filters, to: event.target.value })
            }
          />
        </label>
        <button
          type="button"
          className="button secondary"
          onClick={() => setFilters({ kind: "", source: "", from: "", to: "" })}
        >
          Limpar filtros
        </button>
      </div>
      {invalidRange ? (
        <p role="alert">
          O fim do período precisa ser igual ou posterior ao início.
        </p>
      ) : null}
      <p className="muted">
        Cobertura recebida: {date(snapshot.coverage.from)} a{" "}
        {date(snapshot.coverage.to)}. Os filtros consultam somente este
        conjunto.
        {snapshot.coverage.truncated
          ? " Histórico recortado pelo serviço."
          : ""}
      </p>
      {!events.length || invalidRange ? (
        <div className="empty-state">
          <FileText size={28} aria-hidden="true" />
          <h3>
            {snapshot.timeline.length
              ? "Nenhum evento neste filtro"
              : "Sem eventos disponíveis"}
          </h3>
          <p>
            Ajuste o período, tipo ou fonte para consultar os registros
            compartilhados.
          </p>
        </div>
      ) : (
        <ol className={styles.timeline}>
          {events.map((event) => (
            <li key={event.id}>
              <div className={styles.eventDate}>
                <time
                  dateTime={event.occurredOn ?? event.occurredAt ?? undefined}
                >
                  <CalendarDays size={16} aria-hidden="true" /> {date(event.occurredOn ?? event.occurredAt)}
                </time>
                <span className="badge">{kinds[event.kind]}</span>
              </div>
              <div className={styles.eventContent}>
                <h3>{event.label}</h3>
                <p className={styles.eventSource}>
                  {[...new Set(event.evidenceRefs.flatMap((ref) => {
                    const evidence = snapshot.evidence.find((item) => item.id === ref.id && item.version === ref.version);
                    const source = snapshot.sources.find((source) => source.id === evidence?.sourceId);
                    return source ? [source.label] : [];
                  }))].join(" · ")}
                  {event.evidenceRefs.length ? ` · ${event.evidenceRefs.length} ${event.evidenceRefs.length === 1 ? "referência" : "referências"}` : ""}
                </p>
                <p className="muted">Recebido em {date(event.receivedAt)}</p>
                {event.kind === "correction" ? (
                  <p>
                    Atualização de um registro existente. Confira a versão na
                    evidência.
                  </p>
                ) : null}
                <EvidenceLinks
                  snapshot={snapshot}
                  refs={event.evidenceRefs}
                  openEvidence={openEvidence}
                />
                {event.evidenceRefs.length === 0 ? (
                  <p className="muted">
                    Sem evidência estruturada disponível para abrir.
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
