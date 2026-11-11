"use client";

import { ArrowUpRight, FileClock, Info, Network, Pill, Stethoscope, Users } from "lucide-react";
import type { Evidence, OpenEvidence, Snapshot } from "@/lib/api/types";
import { basisLabels, date, number, sectionMessage } from "@/lib/clinical/format";
import { EvidenceLinks } from "@/features/evidence/EvidenceLinks";
import { resolveEvidence } from "@/features/evidence/model";
import styles from "./briefing.module.css";

const contextLabels = {
  condition: "Condição registrada",
  symptom: "Sintoma relatado",
  medication: "Medicação informada",
  family_history: "História familiar",
};
const contextIcons = {
  condition: Stethoscope,
  symptom: Stethoscope,
  medication: Pill,
  family_history: Users,
};
const statusLabels = {
  normal: "Na referência",
  attention: "Atenção na origem",
  critical: "Crítico na origem",
  unknown: "Sem classificação",
};

function referenceLabel(evidence: Evidence) {
  const range = evidence.referenceRange;
  if (!range) return "Referência não informada";
  if (range.text) return `Referência: ${range.text}`;
  return `Referência: ${range.min !== null ? number(range.min) : "sem limite inferior"}–${range.max !== null ? number(range.max) : "sem limite superior"} ${evidence.unit ?? ""}`;
}

function CitedMeasurements({ records, openEvidence }: { records: Evidence[]; openEvidence: OpenEvidence }) {
  const groups = new Map<string, Evidence[]>();
  for (const record of records) {
    const key = JSON.stringify([record.kind, record.label, record.unit]);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return (
    <div className={styles.measurements}>
      {[...groups.entries()].map(([key, items]) => {
        const values = items.flatMap((item) => [item.value!, item.referenceRange?.min ?? 0, item.referenceRange?.max ?? 0]);
        const low = Math.min(0, ...values);
        const high = Math.max(0, ...values);
        const span = high - low || 1;
        return (
          <div key={key} className={styles.measureGroup}>
            {items.sort((a, b) => (a.occurredOn ?? a.occurredAt ?? "").localeCompare(b.occurredOn ?? b.occurredAt ?? "")).map((item) => (
              <button
                type="button"
                key={`${item.id}:${item.version}`}
                className={styles.measure}
                data-status={item.status}
                onClick={() => openEvidence({ id: item.id, version: item.version })}
              >
                <span className={styles.srOnly}>Ver evidência: {item.label}. </span>
                <span className={styles.measureTop}><time dateTime={item.occurredOn ?? item.occurredAt ?? undefined}>{date(item.occurredOn ?? item.occurredAt)}</time><ArrowUpRight size={15} aria-hidden="true" /></span>
                {groups.size > 1 ? <span className={styles.measureLabel}>{item.label}</span> : null}
                <span className={styles.measureValue}><strong>{number(item.value!)}</strong> {item.unit ?? "Unidade não informada"}</span>
                <span className={styles.measureRail} aria-hidden="true"><span style={{ left: `${(Math.min(0, item.value!) - low) / span * 100}%`, width: `${Math.abs(item.value!) / span * 100}%` }} /></span>
                <span className={styles.railTicks} aria-hidden="true"><span>{number(low)}</span><span>{number(high)}</span></span>
                <span className={styles.measureStatus}>{statusLabels[item.status]}</span>
                <span className={styles.measureReference}>{referenceLabel(item)}</span>
                <span className={styles.srOnly}>Versão {item.version}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function Briefing({ snapshot, openEvidence, onEvolution, onHistory, onGraph }: {
  snapshot: Snapshot;
  openEvidence: OpenEvidence;
  onEvolution: (id: string) => void;
  onHistory?: () => void;
  onGraph?: () => void;
}) {
  const missing = [
    ...snapshot.clinicalContext.items.filter((item) => item.kind === "medication" && !item.startDate).map((item) => `${item.label}: data de início não informada.`),
    ...snapshot.sources.filter((source) => source.state !== "current").map((source) => `${source.label}: ${source.state === "stale" ? "fonte desatualizada" : source.state === "error" ? "falha de sincronização" : "atualização desconhecida"}. Último dado: ${date(source.lastEventDate)}.`),
    ...([ ["Exames", snapshot.exams], ["Wearable", snapshot.wearables], ["Contexto clínico", snapshot.clinicalContext], ["Alertas", snapshot.alerts] ] as const).filter(([, section]) => section.state !== "available").map(([label, section]) => `${label}: ${sectionMessage(section.state)}`),
  ];
  return (
    <div className={styles.briefing}>
      <section className={styles.main} aria-labelledby="findings-heading">
        <div className={styles.sectionHeading}>
          <div><h2 id="findings-heading">Achados e evidências</h2><p className="muted">Da informação à origem, em um clique.</p></div>
          {onHistory ? <button type="button" className="text-link" onClick={onHistory}>Ver histórico <ArrowUpRight size={15} aria-hidden="true" /></button> : null}
        </div>
        {snapshot.briefing.state !== "available" ? (
          <div className="empty-state"><p>{sectionMessage(snapshot.briefing.state)}</p><p className="muted">As categorias autorizadas continuam disponíveis no histórico e na evolução.</p>{onHistory ? <button type="button" className="button secondary" onClick={onHistory}>Consultar registros</button> : null}</div>
        ) : (
          <div className={styles.findings}>
            {snapshot.briefing.items.map((finding) => {
              const records = finding.evidenceRefs.flatMap((ref) => { const evidence = resolveEvidence(snapshot, ref); return evidence && evidence.value !== null ? [evidence] : []; });
              const remaining = finding.evidenceRefs.filter((ref) => !records.some((record) => record.id === ref.id && record.version === ref.version));
              const series = snapshot.exams.items.find((item) => item.measurementRefs.some((ref) => finding.evidenceRefs.some((findingRef) => ref.id === findingRef.id && ref.version === findingRef.version)));
              return (
                <article key={finding.id} className={styles.finding} data-basis={finding.basis}>
                  <div className={styles.findingCopy}>
                    <h3>{finding.title}</h3>
                    <span className={styles.basis}>{basisLabels[finding.basis]}</span>
                    <p className={styles.findingText}>{finding.text}</p>
                    {remaining.length ? <EvidenceLinks snapshot={snapshot} refs={remaining} openEvidence={openEvidence} /> : null}
                    {series ? <button type="button" className="text-link" onClick={() => onEvolution(series.id)}>Ver evolução de {series.label}<ArrowUpRight size={15} aria-hidden="true" /></button> : null}
                  </div>
                  {records.length ? <CitedMeasurements records={records} openEvidence={openEvidence} /> : null}
                </article>
              );
            })}
          </div>
        )}
        {onGraph && snapshot.graph.state === "available" ? <button type="button" className={styles.relationsLink} onClick={onGraph}><Network size={21} aria-hidden="true" /><span><strong>Explore as relações entre os registros</strong><small>Fatos, associações e hipóteses com suas evidências.</small></span><ArrowUpRight size={18} aria-hidden="true" /></button> : null}
      </section>
      <aside className={styles.sidebar} aria-label="Contexto e cobertura do paciente">
        <section className={styles.context} aria-labelledby="context-heading">
          <h2 id="context-heading">Síntese do paciente</h2>
          {snapshot.clinicalContext.state !== "available" ? <p className="muted">{sectionMessage(snapshot.clinicalContext.state)}</p> : (
            <dl className={styles.contextList}>{snapshot.clinicalContext.items.map((item) => { const Icon = contextIcons[item.kind]; return (
              <div key={item.id}><dt><Icon size={17} aria-hidden="true" />{contextLabels[item.kind]}</dt><dd><strong>{item.label}</strong><p className="muted">{item.startDate ? `Desde ${date(item.startDate)}` : "Início não informado"}{item.endDate ? ` · Até ${date(item.endDate)}` : ""}</p><EvidenceLinks snapshot={snapshot} refs={item.evidenceRefs} openEvidence={openEvidence} compact /></dd></div>
            ); })}</dl>
          )}
        </section>
        <section className={styles.coverage} aria-labelledby="coverage-heading"><h2 id="coverage-heading"><FileClock size={18} aria-hidden="true" />Cobertura recebida</h2><p>{date(snapshot.coverage.from)}<span aria-hidden="true"> → </span><span className={styles.srOnly}> a </span>{date(snapshot.coverage.to)}</p><span className="muted">Coleta e recebimento são datas distintas.</span>{snapshot.coverage.truncated ? <p className="muted">Histórico parcial; há dados fora deste recorte.</p> : null}</section>
        <section className={styles.gaps} aria-labelledby="gaps-heading"><h2 id="gaps-heading"><Info size={18} aria-hidden="true" />Informação que falta</h2>{missing.length ? <ul>{missing.map((text) => <li key={text}>{text}</li>)}</ul> : <p>Não foram sinalizadas lacunas adicionais neste conjunto.</p>}</section>
      </aside>
    </div>
  );
}
