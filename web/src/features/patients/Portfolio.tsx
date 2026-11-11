"use client";

import {
  Activity, ArrowRight, Check, Clock3, FileSearch, History, Plus, Search, ShieldCheck, Users,
} from "lucide-react";
import type { Schemas } from "@/lib/api/types";
import { date } from "@/lib/clinical/format";
import styles from "./portfolio.module.css";

export type PortfolioFilter = "active" | "with_updates" | "inactive";
export type PortfolioSection = "Resumo" | "Evolução" | "Histórico";
type Props = {
  data: Schemas["PatientList"];
  query: string;
  filter: PortfolioFilter;
  onQuery: (query: string) => void;
  onFilter: (filter: PortfolioFilter) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasPrevious: boolean;
  openPatient: (id: string, section?: PortfolioSection) => void;
  onAdd: () => void;
  loading?: boolean;
};
const filters: [PortfolioFilter, string][] = [
  ["with_updates", "Com novidades"],
  ["active", "Todos com acesso ativo"],
  ["inactive", "Pendentes e encerrados"],
];
const statusLabels = {
  pending: "Aguardando paciente", active: "Acesso ativo", expired: "Expirado", revoked: "Revogado", rejected: "Não aprovado",
};

export function Portfolio({
  data, query, filter, onQuery, onFilter, onNext, onPrevious, hasPrevious, openPatient, onAdd, loading = false,
}: Props) {
  const nameCounts = new Map<string, number>();
  for (const row of data.items) {
    if (row.accessStatus === "active" && row.patient) {
      const name = row.patient.displayName;
      nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    }
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.heading}>
        <div>
          <h1>Seus pacientes</h1>
          <p>O contexto de cada paciente, a um passo da próxima revisão.</p>
        </div>
        <button type="button" className="button" onClick={onAdd}>
          <Plus size={18} aria-hidden="true" /> Adicionar paciente
        </button>
      </div>

      <section className={styles.portfolio} aria-label="Carteira de pacientes" aria-busy={loading}>
        <div className={styles.controls}>
          <label className={styles.search}>
            <Search size={19} aria-hidden="true" />
            <span className={styles.srOnly}>Buscar na sua carteira</span>
            <input type="search" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Buscar na sua carteira" autoComplete="off" />
          </label>
          <div className={styles.filters} role="group" aria-label="Situação dos pacientes">
            {filters.map(([value, label]) => (
              <button type="button" key={value} aria-pressed={filter === value} onClick={() => onFilter(value)}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading} role="status">
            <span>Buscando na sua carteira…</span>
            <div className={styles.skeleton} aria-hidden="true" />
            <div className={styles.skeleton} aria-hidden="true" />
          </div>
        ) : data.items.length === 0 ? (
          <div className={styles.empty}>
            <Users size={32} aria-hidden="true" />
            <h2>{query ? "Nenhum paciente encontrado" : filter === "with_updates" ? "Nenhuma novidade pendente" : filter === "inactive" ? "Nenhum vínculo pendente ou encerrado" : "Sua carteira começa com uma autorização"}</h2>
            <p>{query ? "Confira o nome ou ajuste os filtros. A busca está limitada à sua carteira." : filter === "active" ? "Peça ao paciente o QR ou link de compartilhamento e solicite acompanhamento. O paciente confirma as categorias e a duração." : "Você pode consultar os pacientes com acesso ativo ou receber um novo convite."}</p>
            <button type="button" className="button secondary" onClick={onAdd}>Adicionar paciente por QR ou link</button>
          </div>
        ) : (
          <div className={styles.list}>
            {data.items.map((row, index) => {
              const active = row.accessStatus === "active" && row.patient !== null;
              const patient = active ? row.patient : null;
              const duplicate = patient ? (nameCounts.get(patient.displayName) ?? 0) > 1 : false;
              const distinguishable = !duplicate || Boolean(patient?.disambiguationLabel);
              const initial = row.review?.mode === "initial_review";
              const unread = row.review?.unreadGroupCount ?? null;
              const hasUpdates = initial || (unread !== null && unread > 0);

              return (
                <article className={styles.row} key={row.relationshipId} aria-label={patient?.displayName ?? `Vínculo ${index + 1}`}>
                  <div className={styles.identity}>
                    <span className={patient ? styles.avatar : styles.protectedAvatar} aria-hidden="true">
                      {patient ? patient.displayName.split(" ").map((part) => part[0]).slice(0, 2).join("") : <ShieldCheck size={20} />}
                    </span>
                    <div className={styles.person}>
                      {patient ? (
                        <>
                          <h2><button type="button" className={styles.patient} disabled={!distinguishable} onClick={() => openPatient(patient.id)}>{patient.displayName}<ArrowRight size={16} aria-hidden="true" /></button></h2>
                          <p>{[patient.age !== null ? `${patient.age} anos` : "", patient.disambiguationLabel].filter(Boolean).join(" · ") || "Perfil compartilhado"}</p>
                          {!distinguishable ? <p>Identificação adicional necessária para diferenciar homônimos.</p> : null}
                        </>
                      ) : <><h2>Vínculo {index + 1}</h2><p>Identificação protegida</p></>}
                      <span className={active ? styles.access : styles.inactiveStatus}>
                        {active ? <ShieldCheck size={13} aria-hidden="true" /> : <Clock3 size={13} aria-hidden="true" />}{statusLabels[row.accessStatus]}
                      </span>
                    </div>
                  </div>

                  {patient ? (
                    <>
                      <div className={styles.context}>
                        {row.review ? (
                          <span className={initial ? styles.initial : hasUpdates ? styles.updates : styles.reviewed}>
                            {hasUpdates ? <FileSearch size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
                            {initial ? "Revisão inicial" : unread === null ? "Revisão disponível" : unread > 0 ? `${unread} ${unread === 1 ? "novidade" : "novidades"}` : "Sem novidades pendentes"}
                          </span>
                        ) : <span className={styles.unavailable}>Revisão indisponível</span>}
                        <p className={styles.highlight}>{row.highlight || "Abra o contexto compartilhado para consultar os registros."}</p>
                        {row.lastReceivedAt ? <span className={styles.received}>Recebido em {date(row.lastReceivedAt)}</span> : null}
                      </div>

                      <dl className={styles.dates}>
                        <div><dt><Activity size={14} aria-hidden="true" /> Último dado clínico</dt><dd>{date(row.lastClinicalEventOn ?? row.lastClinicalEventAt)}</dd></div>
                        <div><dt><History size={14} aria-hidden="true" /> Última revisão</dt><dd>{row.review?.lastReviewedAt ? date(row.review.lastReviewedAt) : "Ainda não revisado"}</dd></div>
                      </dl>

                      <div className={styles.actions}>
                        <button type="button" className={styles.reviewAction} disabled={!distinguishable} onClick={() => openPatient(patient.id, "Resumo")}>
                          {hasUpdates ? "Revisar paciente" : "Abrir contexto"}<ArrowRight size={15} aria-hidden="true" />
                        </button>
                        <div className={styles.shortcuts}>
                          <button type="button" disabled={!distinguishable} onClick={() => openPatient(patient.id, "Evolução")}><Activity size={15} aria-hidden="true" /> Evolução</button>
                          <button type="button" disabled={!distinguishable} onClick={() => openPatient(patient.id, "Histórico")}><History size={15} aria-hidden="true" /> Histórico</button>
                        </div>
                      </div>
                    </>
                  ) : <p className={styles.inactiveMessage}>{row.accessStatus === "pending" ? "O paciente precisa confirmar o compartilhamento para liberar o contexto clínico." : "Conteúdo indisponível. Um novo compartilhamento depende da autorização do paciente."}</p>}
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.pagination}>
          <span>{loading ? "Atualizando lista" : `${data.items.length} ${data.items.length === 1 ? "vínculo" : "vínculos"} nesta página`}</span>
          {hasPrevious || data.page.hasMore ? <div>
            <button type="button" className="button secondary" disabled={!hasPrevious || loading} onClick={onPrevious}>Anterior</button>
            <button type="button" className="button secondary" disabled={!data.page.hasMore || loading} onClick={onNext}>Próxima</button>
          </div> : null}
        </div>
      </section>

      <p className={styles.privacy}><ShieldCheck size={16} aria-hidden="true" /> Somente pacientes que compartilharam acesso com você. O paciente pode encerrar o compartilhamento.</p>
    </div>
  );
}
