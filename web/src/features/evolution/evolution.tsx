"use client";

import { useId, useState } from "react";
import { Activity, ArrowRight, FlaskConical, MoveRight } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  Evidence,
  OpenEvidence,
  Schemas,
  Snapshot,
} from "@/lib/api/types";
import { date, number, sectionMessage } from "@/lib/clinical/format";
import {
  coordinateDay,
  datedEvents,
  dateWindow,
  dayCoordinate,
  metricLabels,
  overlapWindow,
  resolveSeries,
  uniformReference,
  unitSeries,
  type Period,
  type SeriesPoint,
  type UnitSeries,
} from "./selectors";
import styles from "./evolution.module.css";

type Props = {
  snapshot: Snapshot;
  openEvidence: OpenEvidence;
  initialSeries?: string;
  active?: boolean;
};
const statusLabels: Record<Evidence["status"], string> = {
  normal: "Na referência",
  attention: "Atenção",
  critical: "Sinalizado como crítico",
  unknown: "Sem classificação",
};

function rangeLabel(reference: Evidence["referenceRange"]): string {
  if (!reference) return "Não informada";
  if (reference.text) return reference.text;
  if (reference.min !== null && reference.max !== null)
    return `${number(reference.min)} a ${number(reference.max)}`;
  if (reference.min !== null) return `A partir de ${number(reference.min)}`;
  if (reference.max !== null) return `Até ${number(reference.max)}`;
  return "Não informada";
}

function PointTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: SeriesPoint }>;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point?.evidence) return null;
  return (
    <div className={styles.tooltip}>
      <p>{date(point.evidence.occurredOn ?? point.evidence.occurredAt)}</p>
      <p>
        <strong>
          {point.value === null ? "Sem valor" : number(point.value)}{" "}
          {point.evidence.unit}
        </strong>
      </p>
      <p>Referência: {rangeLabel(point.evidence.referenceRange)}</p>
    </div>
  );
}

function SeriesFigure({
  active,
  group,
  title,
  snapshot,
  openEvidence,
  syncId,
  domain,
  events,
}: {
  active: boolean;
  group: UnitSeries;
  title: string;
  snapshot: Snapshot;
  openEvidence: OpenEvidence;
  syncId?: string;
  domain?: [number, number];
  events: Schemas["ContextItem"][];
}) {
  const headingId = useId();
  const reference = uniformReference(group.records);
  const sources = new Map(
    snapshot.sources.map((source) => [source.id, source.label]),
  );
  const period = dateWindow(group.records);
  const latest = group.records.at(-1);
  const previous = group.records.at(-2);
  const difference =
    latest?.value !== null && latest?.value !== undefined &&
    previous?.value !== null && previous?.value !== undefined
      ? latest.value - previous.value
      : null;
  const clickableDot = (props: {
    cx?: number;
    cy?: number;
    payload?: SeriesPoint;
  }) => {
    const record = props.payload?.evidence;
    if (!record || record.value === null) return <g />;
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={5}
        fill="#fff"
        stroke={record.status === "critical" ? "#9f1239" : record.status === "attention" ? "#9a5b11" : "#0f766e"}
        strokeWidth={2}
        style={{ cursor: "pointer" }}
        onClick={() => openEvidence({ id: record.id, version: record.version })}
      />
    );
  };
  return (
    <figure className={styles.figure} aria-labelledby={headingId}>
      <div className={styles.heading}>
        <h3 id={headingId}>
          {title}{" "}
          <span className="muted">{group.unit ?? "Unidade não informada"}</span>
        </h3>
        <p>
          {period
            ? `${date(period[0])} a ${date(period[1])}`
            : "Sem data de coleta"}
        </p>
      </div>
      {latest ? (
        <div className={styles.comparison} aria-label={`Últimos registros de ${title}`}>
          {previous ? (
            <>
              <button type="button" className={styles.reading} onClick={() => openEvidence({ id: previous.id, version: previous.version })}>
                <span>Registro anterior · {date(previous.occurredOn ?? previous.occurredAt)}</span>
                <strong>{previous.value === null ? "Sem valor" : number(previous.value)} <small>{previous.unit}</small></strong>
                <span className={styles.srOnly}>Ver evidência de {title}</span>
              </button>
              <MoveRight size={22} className={styles.comparisonArrow} aria-hidden="true" />
            </>
          ) : null}
          <button type="button" className={`${styles.reading} ${styles.latestReading}`} onClick={() => openEvidence({ id: latest.id, version: latest.version })}>
            <span>Último registro · {date(latest.occurredOn ?? latest.occurredAt)}</span>
            <strong>{latest.value === null ? "Sem valor" : number(latest.value)} <small>{latest.unit}</small></strong>
            <span className={`${styles.status} ${latest.status === "attention" ? styles.attention : latest.status === "critical" ? styles.critical : ""}`}>{statusLabels[latest.status]}</span>
            <span className={styles.srOnly}>Ver evidência de {title}</span>
          </button>
          {difference !== null ? (
            <div className={styles.difference}>
              <span>Variação entre registros</span>
              <strong>{difference > 0 ? "+" : ""}{number(difference)} {group.unit}</strong>
            </div>
          ) : null}
        </div>
      ) : null}
      {active && group.points.length ? (
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart
              data={group.points}
              syncId={syncId}
              syncMethod="value"
              accessibilityLayer
              title={`${title}, valores por data. Consulte a tabela abaixo para fontes e evidências.`}
              margin={{ top: 16, right: 24, bottom: 8, left: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="x"
                type="number"
                scale="time"
                domain={domain ?? ["dataMin", "dataMax"]}
                tickCount={4}
                tickFormatter={(x) => date(coordinateDay(Number(x)))}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                width={48}
                domain={["auto", "auto"]}
                tickFormatter={number}
              />
              <Tooltip content={<PointTooltip />} />
              {reference ? (
                <ReferenceArea
                  y1={reference.min}
                  y2={reference.max}
                  fill="#ccfbf1"
                  fillOpacity={0.45}
                  ifOverflow="extendDomain"
                />
              ) : null}
              {events.map((event) =>
                event.startDate ? (
                  <ReferenceLine
                    key={event.id}
                    x={dayCoordinate(event.startDate)}
                    stroke="#7c3aed"
                    strokeDasharray="4 4"
                  />
                ) : null,
              )}
              <Line
                dataKey="value"
                name={title}
                type="linear"
                stroke="#0f766e"
                strokeWidth={2.5}
                connectNulls={false}
                dot={clickableDot}
                activeDot={clickableDot}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      <figcaption className={styles.caption}>
        Pontos representam registros recebidos; linhas não representam medições
        entre coletas. Alinhamento por dia, sem inferir horário de coleta.
        {reference
          ? ` Faixa sombreada: referência comum de ${number(reference.min)} a ${number(reference.max)} ${group.unit ?? ""}.`
          : " Consulte a referência de cada registro na tabela."}
        {events.length
          ? " Linhas verticais indicam eventos com data documentada, listados abaixo."
          : ""}
      </figcaption>
      <div className="table-wrap">
        <table>
          <caption className={styles.srOnly}>
            {title}: valores, fontes e evidências
          </caption>
          <thead>
            <tr>
              <th scope="col">Coleta / evento</th>
              <th scope="col">Valor</th>
              <th scope="col">Referência</th>
              <th scope="col">Fonte</th>
              <th scope="col">Classificação recebida</th>
              <th scope="col">Evidência</th>
            </tr>
          </thead>
          <tbody>
            {group.records.map((record) => (
              <tr key={`${record.id}:${record.version}`}>
                <td>{date(record.occurredOn ?? record.occurredAt)}</td>
                <td className={styles.value}>
                  {record.value === null
                    ? "Não informado"
                    : number(record.value)}{" "}
                  {record.unit}
                </td>
                <td>
                  {rangeLabel(record.referenceRange)}{" "}
                  {record.referenceRange ? record.unit : ""}
                </td>
                <td>{sources.get(record.sourceId) ?? "Fonte indisponível"}</td>
                <td>
                  <span
                    className={`${styles.status} ${record.status === "attention" ? styles.attention : record.status === "critical" ? styles.critical : ""}`}
                  >
                    {statusLabels[record.status]}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      openEvidence({ id: record.id, version: record.version })
                    }
                  >
                    Ver evidência
                    <span className={styles.srOnly}>
                      {" "}
                      de {title} em{" "}
                      {date(record.occurredOn ?? record.occurredAt)}
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export default function Evolution({
  snapshot,
  openEvidence,
  initialSeries,
  active = true,
}: Props) {
  const [examId, setExamId] = useState(
    () =>
      snapshot.exams.items.find(
        (item) =>
          item.id === initialSeries ||
          item.measurementRefs.some((ref) => ref.id === initialSeries),
      )?.id ??
      snapshot.exams.items[0]?.id ??
      "",
  );
  const [wearableId, setWearableId] = useState("");
  const [period, setPeriod] = useState<Period>({ from: "", to: "" });
  const [requestedSeries, setRequestedSeries] = useState(initialSeries);
  const syncId = useId();
  if (requestedSeries !== initialSeries) {
    setRequestedSeries(initialSeries);
    const requested = snapshot.exams.items.find(
      (item) =>
        item.id === initialSeries ||
        item.measurementRefs.some((ref) => ref.id === initialSeries),
    );
    if (requested) setExamId(requested.id);
  }
  const exam = snapshot.exams.items.find((item) => item.id === examId);
  const wearable = snapshot.wearables.items.find(
    (item) => item.id === wearableId,
  );
  const exams = resolveSeries(snapshot, exam?.measurementRefs ?? [], period);
  const wearables = resolveSeries(snapshot, wearable?.pointRefs ?? [], period);
  const overlap = overlapWindow(exams.records, wearables.records);
  const examWindow = dateWindow(exams.records),
    wearableWindow = dateWindow(wearables.records);
  const domain: [number, number] | undefined =
    overlap && examWindow && wearableWindow
      ? [
          dayCoordinate(
            examWindow[0] < wearableWindow[0]
              ? examWindow[0]
              : wearableWindow[0],
          ),
          dayCoordinate(
            examWindow[1] > wearableWindow[1]
              ? examWindow[1]
              : wearableWindow[1],
          ),
        ]
      : undefined;
  const events = datedEvents(snapshot, period);
  const unknownMedicationDates = snapshot.clinicalContext.items.filter(
    (item) => item.kind === "medication" && !item.startDate,
  );
  const invalidPeriod = Boolean(
    period.from && period.to && period.from > period.to,
  );
  const examGroups = unitSeries(exams.records);
  const wearableGroups = unitSeries(
    wearables.records,
    wearable?.aggregation === "daily_summary",
  );
  const selectedCount = examGroups.length + wearableGroups.length;
  const missingReferences =
    exams.missingReferences + wearables.missingReferences;
  const showMissingHba1c =
    (snapshot.exams.state === "available" ||
      snapshot.exams.state === "empty") &&
    !snapshot.exams.items.some((item) =>
      /hba1c|hemoglobina.*glicad/i.test(`${item.id} ${item.label}`),
    );

  return (
    <section className="stack" aria-labelledby="evolution-heading">
      <div className="section-heading">
        <div>
          <h2 id="evolution-heading">Evolução</h2>
          <p className="muted">
            Compare registros ao longo do tempo e abra a evidência de cada
            medição.
          </p>
        </div>
      </div>
      <div className={`panel ${styles.filters}`}>
        <label className={styles.select}>
          Exame
          <select
            value={examId}
            onChange={(event) => setExamId(event.target.value)}
          >
            <option value="">Nenhum exame</option>
            {snapshot.exams.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            {showMissingHba1c ? (
              <option value="__hba1c_empty">
                Hemoglobina glicada (HbA1c) — sem resultados
              </option>
            ) : null}
          </select>
        </label>
        <label className={styles.select}>
          Sinal do wearable
          <select
            value={wearableId}
            onChange={(event) => setWearableId(event.target.value)}
          >
            <option value="">Não comparar wearable</option>
            {snapshot.wearables.items.map((item) => (
              <option key={item.id} value={item.id}>
                {metricLabels[item.metric]} ({item.unit})
              </option>
            ))}
          </select>
        </label>
        <label className={styles.date}>
          De
          <input
            type="date"
            value={period.from}
            max={period.to || undefined}
            onChange={(event) =>
              setPeriod((current) => ({ ...current, from: event.target.value }))
            }
          />
        </label>
        <label className={styles.date}>
          Até
          <input
            type="date"
            value={period.to}
            min={period.from || undefined}
            onChange={(event) =>
              setPeriod((current) => ({ ...current, to: event.target.value }))
            }
          />
        </label>
        {period.from || period.to ? (
          <button
            type="button"
            className="button secondary"
            onClick={() => setPeriod({ from: "", to: "" })}
          >
            Todo o período disponível
          </button>
        ) : null}
      </div>
      <div className={styles.explorer}>
        <aside className={styles.navigator} aria-label="Trocar medida com um clique">
          <h3><FlaskConical size={16} aria-hidden="true" /> Exames</h3>
          <div className={styles.measureList}>
            {snapshot.exams.items.map((item) => {
              const records = resolveSeries(snapshot, item.measurementRefs, period).records;
              const latest = records.at(-1);
              return (
                <button key={item.id} type="button" className={styles.measure} aria-pressed={examId === item.id} onClick={() => setExamId(item.id)}>
                  <span className={styles.srOnly}>Selecionar </span>
                  <span className={styles.measureName}>{item.label}<ArrowRight size={15} aria-hidden="true" /></span>
                  {latest ? <><strong>{latest.value === null ? "Sem valor" : number(latest.value)} <small>{latest.unit}</small></strong><span className={styles.measureDate}>{date(latest.occurredOn ?? latest.occurredAt)} · {statusLabels[latest.status]}</span></> : <span className={styles.measureDate}>Sem coleta neste período</span>}
                </button>
              );
            })}
          </div>
          {snapshot.wearables.items.length ? <>
            <h3><Activity size={16} aria-hidden="true" /> Wearable</h3>
            <p className={styles.navigatorHint}>Selecione um sinal para comparar.</p>
            <div className={styles.measureList}>
              {snapshot.wearables.items.map((item) => {
                const latest = resolveSeries(snapshot, item.pointRefs, period).records.at(-1);
                return <button key={item.id} type="button" className={styles.measure} aria-pressed={wearableId === item.id} onClick={() => setWearableId(wearableId === item.id ? "" : item.id)}>
                  <span className={styles.srOnly}>Comparar </span>
                  <span className={styles.measureName}>{metricLabels[item.metric]}<ArrowRight size={15} aria-hidden="true" /></span>
                  {latest ? <><strong>{latest.value === null ? "Sem valor" : number(latest.value)} <small>{latest.unit}</small></strong><span className={styles.measureDate}>{date(latest.occurredOn ?? latest.occurredAt)}</span></> : <span className={styles.measureDate}>Sem leitura neste período</span>}
                </button>;
              })}
            </div>
          </> : null}
        </aside>
        <div className={styles.plotArea}>
      {invalidPeriod ? (
        <p role="alert" className={`${styles.note} ${styles.warning}`}>
          A data inicial precisa ser anterior ou igual à final.
        </p>
      ) : null}
      <p className="muted">
        Cobertura recebida: {date(snapshot.coverage.from)} a{" "}
        {date(snapshot.coverage.to)}. Os filtros consultam somente este
        conjunto.
        {snapshot.coverage.truncated
          ? " O histórico recebido está incompleto."
          : ""}
      </p>
      {snapshot.exams.state !== "available" ? (
        <p className={styles.note}>{sectionMessage(snapshot.exams.state)}</p>
      ) : null}
      {snapshot.wearables.state !== "available" ? (
        <p className={styles.note}>
          Wearable: {sectionMessage(snapshot.wearables.state)}
        </p>
      ) : null}
      {examId === "__hba1c_empty" ? (
        <div className="panel empty-state">
          <h3>Sem resultados disponíveis de HbA1c</h3>
          <p>
            Nenhuma medição de hemoglobina glicada foi recebida neste conjunto.
          </p>
        </div>
      ) : null}
      {missingReferences ? (
        <p role="alert" className={`${styles.note} ${styles.warning}`}>
          Há referências de evidência indisponíveis. Esses registros não podem
          ser apresentados como medições válidas.
        </p>
      ) : null}
      {exam && wearable && examWindow && wearableWindow ? (
        <p className={styles.note}>
          {overlap
            ? `Há cobertura simultânea de ${date(overlap[0])} a ${date(overlap[1])}. Os gráficos usam a mesma escala de datas, com unidades independentes. Sincronização somente em dias com registros correspondentes.`
            : `As janelas não se sobrepõem: exames de ${date(examWindow[0])} a ${date(examWindow[1])}; wearable de ${date(wearableWindow[0])} a ${date(wearableWindow[1])}. Não é possível inferir uma associação temporal entre essas medições.`}
        </p>
      ) : null}
      {wearable ? (
        <p className="muted">
          Cobertura do sinal: {date(wearable.coverage.from)} a{" "}
          {date(wearable.coverage.to)}.{" "}
          {wearable.aggregation === "daily_summary"
            ? "Resumos diários; lacunas interrompem a curva."
            : wearable.aggregation === "episode"
              ? "Registros por episódio."
              : "Leituras recebidas, sem agregação adicional."}
        </p>
      ) : null}
      {!invalidPeriod ? (
        <>
          {examGroups.length && exam ? (
            <div className="panel">
              {examGroups.map((group) => (
                <SeriesFigure
                  active={active}
                  key={group.unit ?? "unknown"}
                  group={group}
                  title={exam.label}
                  snapshot={snapshot}
                  openEvidence={openEvidence}
                  syncId={overlap ? syncId : undefined}
                  domain={domain}
                  events={events.filter(
                    (event) =>
                      event.startDate &&
                      examWindow &&
                      event.startDate >= examWindow[0] &&
                      event.startDate <= examWindow[1],
                  )}
                />
              ))}
            </div>
          ) : null}
          {wearableGroups.length && wearable ? (
            <div className="panel">
              {wearableGroups.map((group) => (
                <SeriesFigure
                  active={active}
                  key={group.unit ?? "unknown"}
                  group={group}
                  title={metricLabels[wearable.metric]}
                  snapshot={snapshot}
                  openEvidence={openEvidence}
                  syncId={overlap ? syncId : undefined}
                  domain={domain}
                  events={events.filter(
                    (event) =>
                      event.startDate &&
                      wearableWindow &&
                      event.startDate >= wearableWindow[0] &&
                      event.startDate <= wearableWindow[1],
                  )}
                />
              ))}
            </div>
          ) : null}
          {!selectedCount && examId !== "__hba1c_empty" ? (
            <div className="panel empty-state">
              <h3>Nenhuma medição neste período</h3>
              <p>
                Escolha uma medida disponível ou amplie o intervalo de datas.
              </p>
            </div>
          ) : null}
        </>
      ) : null}
      {exams.undated.length + wearables.undated.length ? (
        <div className="panel">
          <h3>Registros sem data de evento</h3>
          <p className="muted">
            Permanecem fora das curvas para não atribuir uma data inexistente.
          </p>
          {[...exams.undated, ...wearables.undated].map((record) => (
            <p key={`${record.id}:${record.version}`}>
              <button
                className="text-link"
                type="button"
                onClick={() =>
                  openEvidence({ id: record.id, version: record.version })
                }
              >
                {record.label}:{" "}
                {record.value === null ? "Sem valor" : number(record.value)}{" "}
                {record.unit}
              </button>
            </p>
          ))}
        </div>
      ) : null}
      {events.length || unknownMedicationDates.length ? (
        <section className="panel" aria-labelledby="evolution-events">
          <h3 id="evolution-events">Eventos documentados</h3>
          {events.length ? (
            <ul className={styles.events}>
              {events.map((event) => (
                <li key={event.id}>
                  <span>
                    {date(event.startDate)} · {event.label}
                  </span>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => openEvidence(event.evidenceRefs[0])}
                  >
                    Ver evidência
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {unknownMedicationDates.map((item) => (
            <p key={item.id} className="muted">
              {item.label}: início não informado; sem marcador na curva.
            </p>
          ))}
        </section>
      ) : null}
        </div>
      </div>
    </section>
  );
}
