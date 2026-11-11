import type { Snapshot } from "@/lib/api/types";
import { date } from "@/lib/clinical/format";
import styles from "./evidence.module.css";

const sourceStates = {
  current: "Atualizada",
  stale: "Desatualizada",
  error: "Falha de sincronização",
  unknown: "Atualização desconhecida",
};
const sourceKinds = {
  laboratory: "Laboratório",
  wearable: "Wearable",
  patient: "Paciente",
  clinical_record: "Registro clínico",
  other: "Outra fonte",
};

export function Sources({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="stack" aria-labelledby="sources-heading">
      <div>
        <h2 id="sources-heading">Fontes e atualização</h2>
        <p className="muted">
          Sincronização recente não significa exame recente. As datas abaixo têm
          funções diferentes.
        </p>
      </div>
      {snapshot.sources.length === 0 ? (
        <p className="empty-state">
          Nenhuma fonte disponível neste conjunto autorizado.
        </p>
      ) : (
        <div className="table-wrap">
          <table className={styles.sources}>
            <caption className={styles.srOnly}>
              Fontes autorizadas e períodos disponíveis para{" "}
              {snapshot.patient.displayName}
            </caption>
            <thead>
              <tr>
                <th scope="col">Fonte</th>
                <th scope="col">Situação</th>
                <th scope="col">Última sincronização</th>
                <th scope="col">Último dado clínico</th>
                <th scope="col">Cobertura</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.sources.map((source) => (
                <tr key={source.id}>
                  <th scope="row">
                    {source.label}
                    <small>{sourceKinds[source.kind]}</small>
                  </th>
                  <td><span className={styles.sourceState} data-state={source.state}>{sourceStates[source.state]}</span></td>
                  <td>{date(source.lastSyncedAt)}</td>
                  <td>{date(source.lastEventDate)}</td>
                  <td>
                    {date(source.coverage.from)} a {date(source.coverage.to)}
                    {source.coverage.truncated ? (
                      <small>Recorte parcial</small>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted">
        Somente fontes permitidas pelo compartilhamento são exibidas. As
        conexões são gerenciadas pelo paciente.
      </p>
    </section>
  );
}
