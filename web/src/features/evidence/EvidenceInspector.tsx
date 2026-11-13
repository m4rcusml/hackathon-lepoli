"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import type { EvidenceRef, OpenEvidence, Snapshot } from "@/lib/api/types";
import { date, number } from "@/lib/clinical/format";
import { resolveEvidence } from "./model";
import styles from "./evidence.module.css";

const provenance = {
  extracted: "Dado extraído da fonte",
  patient_reported: "Relato do paciente",
  provider_record: "Registro de profissional",
  derived: "Interpretação produzida pelo sistema",
};
const statuses = {
  normal: "Dentro da referência informada",
  attention: "Atenção sinalizada na origem",
  critical: "Destaque crítico informado na origem",
  unknown: "Sem classificação informada",
};
const allowedMime = new Set(["application/pdf", "image/png", "image/jpeg"]);

type Props = {
  snapshot: Snapshot;
  selection: EvidenceRef | null;
  onClose: () => void;
  onSelect?: OpenEvidence;
  loadOriginal: (documentId: string, signal: AbortSignal) => Promise<Blob>;
};

export function EvidenceInspector({
  snapshot,
  selection,
  onClose,
  onSelect,
  loadOriginal,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!selection || !element) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!element.open) element.showModal();
    return () => {
      if (element.open) element.close();
      previousFocus?.focus();
    };
  }, [selection]);
  if (!selection) return null;
  const evidence = resolveEvidence(snapshot, selection);
  return (
    <dialog
      ref={dialog}
      className={styles.inspector}
      aria-labelledby="evidence-heading"
      aria-describedby="evidence-patient"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onClose();
        }
      }}
    >
      <div className={styles.inspectorBody}>
        <div className={styles.inspectorHeader}>
          <div>
            <p id="evidence-patient" className="muted">
              {snapshot.patient.displayName} · Evidência
            </p>
            <h2 id="evidence-heading">
              {evidence?.label ?? "Evidência indisponível"}
            </h2>
          </div>
          <button
            type="button"
            className="button secondary"
            aria-label="Fechar evidência"
            onClick={onClose}
            autoFocus
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {evidence ? (
          <EvidenceDetail
            key={`${snapshot.id}:${selection.id}:${selection.version}`}
            snapshot={snapshot}
            evidence={evidence}
            loadOriginal={loadOriginal}
            onSelect={onSelect}
          />
        ) : (
          <p role="status">
            Esta versão do registro não está disponível no conjunto atual.
            Atualize o paciente para tentar novamente.
          </p>
        )}
      </div>
    </dialog>
  );
}

function EvidenceDetail({
  snapshot,
  evidence,
  loadOriginal,
  onSelect,
}: {
  snapshot: Snapshot;
  evidence: Snapshot["evidence"][number];
  loadOriginal: Props["loadOriginal"];
  onSelect?: OpenEvidence;
}) {
  const source = snapshot.sources.find((item) => item.id === evidence.sourceId);
  const document = snapshot.documents.items.find(
    (item) => item.id === evidence.documentId,
  );
  const [original, setOriginal] = useState<{
    url: string;
    mime: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const objectUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );
  async function showOriginal() {
    if (!document?.originalAvailable || loading) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError("");
    try {
      const blob = await loadOriginal(document.id, request.signal);
      if (request.signal.aborted) return;
      if (!allowedMime.has(blob.type) || blob.type !== document.mimeType)
        throw new Error("INVALID_DOCUMENT");
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setOriginal({ url: objectUrl.current, mime: blob.type });
    } catch {
      if (!request.signal.aborted)
        setError(
          "Não foi possível abrir o original autorizado. Tente novamente.",
        );
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }
  return (
    <div className="stack">
      {evidence.value !== null ? (
        <div className={styles.measurement}>
          <strong>{number(evidence.value)}</strong>
          <span>{evidence.unit ?? "Unidade não informada"}</span>
          <p>{statuses[evidence.status]}</p>
        </div>
      ) : null}
      {evidence.text ? (
        <p className={styles.evidenceText}>{evidence.text}</p>
      ) : null}
      <dl className={styles.details}>
        <div>
          <dt>Data da coleta ou evento</dt>
          <dd>{date(evidence.occurredOn ?? evidence.occurredAt)}</dd>
        </div>
        <div>
          <dt>Recebido em</dt>
          <dd>{date(evidence.ingestedAt)}</dd>
        </div>
        <div>
          <dt>Fonte</dt>
          <dd>{source?.label ?? "Fonte indisponível"}</dd>
        </div>
        <div>
          <dt>Origem do registro</dt>
          <dd>{provenance[evidence.provenance]}</dd>
        </div>
        <div>
          <dt>Versão</dt>
          <dd>
            {evidence.version}
            {evidence.supersedes
              ? ` · Corrige a versão ${evidence.supersedes.version} do registro ${evidence.supersedes.id}`
              : ""}
          </dd>
        </div>
        {evidence.referenceRange ? (
          <div>
            <dt>Referência desta medição</dt>
            <dd>
              {evidence.referenceRange.text ??
                `${evidence.referenceRange.min !== null ? number(evidence.referenceRange.min) : "Sem limite inferior"} a ${evidence.referenceRange.max !== null ? number(evidence.referenceRange.max) : "Sem limite superior"} ${evidence.unit ?? ""}`}
            </dd>
          </div>
        ) : null}
      </dl>
      {document ? (
        <section className={styles.originalSection}>
          <h3>
            <FileText size={18} aria-hidden="true" /> Documento de origem
          </h3>
          <p>{document.title}</p>
          <p className="muted">
            Coleta: {date(document.occurredOn)} · Recebido em{" "}
            {date(document.receivedAt)}
          </p>
          {document.originalAvailable ? (
            <button
              type="button"
              className="button secondary"
              disabled={loading}
              onClick={showOriginal}
            >
              {loading
                ? "Abrindo original…"
                : original
                  ? "Reabrir original autorizado"
                  : "Abrir original autorizado"}
            </button>
          ) : (
            <p className="muted">
              Original não disponível. Somente os dados estruturados foram
              recebidos.
            </p>
          )}
        </section>
      ) : (
        <p className="muted">
          Não há documento original associado a este registro.
        </p>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {original ? (
        <section className={styles.originalSection}>
          <div className="section-heading">
            <h3>Original autorizado</h3>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
                objectUrl.current = null;
                setOriginal(null);
              }}
            >
              Fechar original
            </button>
          </div>
          {original.mime === "application/pdf" ? (
            <iframe
              className={styles.original}
              src={original.url}
              title={`Original de ${document?.title ?? evidence.label}`}
              sandbox=""
            />
          ) : (
            <div className={styles.originalImage}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Blob autorizado permanece na memória desta sessão. */}
              <img
                src={original.url}
                alt={`Original de ${document?.title ?? evidence.label}`}
              />
            </div>
          )}
        </section>
      ) : null}
      <section>
        <h3>Registros relacionados</h3>
        <ul className={styles.related}>
          {snapshot.evidence
            .filter(
              (item) =>
                item.id !== evidence.id &&
                item.kind === evidence.kind &&
                item.label === evidence.label,
            )
            .map((item) => (
              <li key={`${item.id}:${item.version}`}>
                <span>{date(item.occurredOn ?? item.occurredAt)}</span>
                {onSelect ? <button type="button" className="text-link" onClick={() => onSelect({ id: item.id, version: item.version })} aria-label={`Ver evidência: ${item.label}${item.value !== null ? ` · ${number(item.value)} ${item.unit ?? ""}` : ""} · ${date(item.occurredOn ?? item.occurredAt)}, versão ${item.version}`}>{item.value !== null ? `${number(item.value)} ${item.unit ?? ""}` : item.label}</button> : <strong>{item.value !== null ? `${number(item.value)} ${item.unit ?? ""}` : item.label}</strong>}
                <span className="muted">
                  {snapshot.sources.find((entry) => entry.id === item.sourceId)
                    ?.label ?? "Fonte indisponível"}
                </span>
              </li>
            ))}
        </ul>
        {!snapshot.evidence.some(
          (item) =>
            item.id !== evidence.id &&
            item.kind === evidence.kind &&
            item.label === evidence.label,
        ) ? (
          <p className="muted">
            Sem outros registros desta medida no conjunto recebido.
          </p>
        ) : null}
      </section>
    </div>
  );
}
