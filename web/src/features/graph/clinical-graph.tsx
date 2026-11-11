"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Evidence, OpenEvidence, Schemas, Snapshot } from "@/lib/api/types";
import { basisLabels, date, number, sectionMessage } from "@/lib/clinical/format";
import { ArrowRight, Network } from "lucide-react";
import {
  evidenceKey,
  graphEvidence,
  initialGraphFocus,
  layoutGraph,
  nodeKindLabels,
  selectGraph,
  type GraphFilters,
} from "./selectors";
import styles from "./clinical-graph.module.css";

type ClinicalNode = Node<{
  record: Schemas["GraphNode"];
  openEvidence: OpenEvidence;
  resolvable: boolean;
  vertical: boolean;
  latest: Evidence | null;
}>;

function EvidenceNode({ data }: NodeProps<ClinicalNode>) {
  const ref = data.latest
    ? { id: data.latest.id, version: data.latest.version }
    : data.record.evidenceRefs[0];
  return (
    <div className={styles.node} data-kind={data.record.kind}>
      <Handle
        type="target"
        position={data.vertical ? Position.Top : Position.Left}
        isConnectable={false}
      />
      <span className={styles.kind}>{nodeKindLabels[data.record.kind]}</span>
      {ref && data.resolvable ? (
        <button
          type="button"
          onClick={() => data.openEvidence(ref)}
          aria-label={`Ver evidência: ${data.record.label}`}
        >
          <strong>{data.record.label}</strong>
        </button>
      ) : (
        <strong>{data.record.label}</strong>
      )}
      {data.latest ? <div className={styles.nodeReading}>
        {data.latest.value !== null ? <span>{number(data.latest.value)} <small>{data.latest.unit}</small></span> : null}
        <time>{date(data.latest.occurredOn ?? data.latest.occurredAt)}</time>
      </div> : null}
      {ref && !data.resolvable ? (
        <span className={styles.invalid}>Evidência indisponível</span>
      ) : null}
      <Handle
        type="source"
        position={data.vertical ? Position.Bottom : Position.Right}
        isConnectable={false}
      />
    </div>
  );
}

const nodeTypes = { clinical: EvidenceNode };
const compactQuery = "(max-width: 720px)";
const compactSnapshot = () => window.matchMedia(compactQuery).matches;
const subscribeCompact = (notify: () => void) => {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const edgeColors = {
  recorded_fact: "#0b766e",
  temporal_association: "#225f9f",
  suggested_hypothesis: "#7654a2",
};
const ariaLabels = {
  "node.a11yDescription.default":
    "Use Tab para acessar a evidência do registro. O grafo é somente leitura.",
  "node.a11yDescription.keyboardDisabled":
    "Use Tab para acessar a evidência do registro. O grafo é somente leitura.",
  "node.a11yDescription.ariaLiveMessage": () =>
    "Posição de apresentação atualizada.",
  "edge.a11yDescription.default":
    "Use a lista de relações abaixo para consultar as evidências. O grafo é somente leitura.",
  "controls.ariaLabel": "Controles do grafo",
  "controls.zoomIn.ariaLabel": "Ampliar grafo",
  "controls.zoomOut.ariaLabel": "Reduzir grafo",
  "controls.fitView.ariaLabel": "Enquadrar registros",
  "controls.interactive.ariaLabel": "Alternar interação",
  "minimap.ariaLabel": "Visão geral do grafo",
  "handle.ariaLabel": "Conexão de apresentação, somente leitura",
};

export default function ClinicalGraph({
  snapshot,
  openEvidence,
  active = true,
}: {
  snapshot: Snapshot;
  openEvidence: OpenEvidence;
  active?: boolean;
}) {
  const vertical = useSyncExternalStore(
    subscribeCompact,
    compactSnapshot,
    () => false,
  );
  const [filters, setFilters] = useState<GraphFilters>(() => ({
    focusId: initialGraphFocus(snapshot),
    from: "",
    to: "",
    basis: "",
  }));
  const index = useMemo(() => graphEvidence(snapshot), [snapshot]);
  const graph = useMemo(
    () => selectGraph(snapshot, filters),
    [snapshot, filters],
  );
  const nodes: ClinicalNode[] = useMemo(
    () =>
      layoutGraph(graph.nodes, vertical).map((node) => ({
        id: node.id,
        type: "clinical",
        position: node.position,
        data: {
          record: node,
          openEvidence,
          vertical,
          resolvable: node.evidenceRefs.every((ref) =>
            index.has(evidenceKey(ref)),
          ),
          latest: node.evidenceRefs
            .map((ref) => index.get(evidenceKey(ref)))
            .filter((item): item is Evidence => !!item)
            .toSorted((a, b) => (a.occurredOn ?? a.occurredAt ?? "").localeCompare(b.occurredOn ?? b.occurredAt ?? ""))
            .at(-1) ?? null,
        },
        ariaLabel: `${nodeKindLabels[node.kind]}: ${node.label}`,
        selectable: false,
        draggable: false,
        deletable: false,
        connectable: false,
        focusable: true,
      })),
    [graph.nodes, index, openEvidence, vertical],
  );
  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep",
        ariaLabel: `${edge.label}. ${basisLabels[edge.basis]}. Evidências disponíveis na lista de relações.`,
        style: {
          stroke: edgeColors[edge.basis],
          strokeWidth: 1.7,
          strokeDasharray:
            edge.basis === "temporal_association"
              ? "7 4"
              : edge.basis === "suggested_hypothesis"
                ? "2 4"
                : undefined,
        },
        labelStyle: { fill: "#334155", fontSize: 13 },
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.96 },
        selectable: false,
        deletable: false,
        reconnectable: false,
        focusable: true,
      })),
    [graph.edges],
  );
  const labels = useMemo(
    () => new Map(snapshot.graph.nodes.map((node) => [node.id, node.label])),
    [snapshot.graph.nodes],
  );
  const set = (key: keyof GraphFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const invalidRange = Boolean(
    filters.from && filters.to && filters.from > filters.to,
  );

  if (snapshot.graph.state !== "available")
    return (
      <section className="panel empty-state" aria-label="Relações">
        <h2>Relações</h2>
        <p>{sectionMessage(snapshot.graph.state)}</p>
      </section>
    );

  return (
    <section className="stack" aria-label="Relações clínicas">
      <div className="section-heading">
        <div>
          <h2>Relações</h2>
          <p className="muted">
            Investigue os registros e suas origens. Associações e hipóteses não
            estabelecem causalidade.
          </p>
        </div>
      </div>
      <div className={styles.topics} role="group" aria-label="Foco rápido do grafo">
        <button type="button" aria-pressed={!filters.focusId} onClick={() => set("focusId", "")}><Network size={15} aria-hidden="true" /> Visão completa</button>
        {snapshot.graph.nodes.filter((node) => node.kind === "biomarker" || node.kind === "condition" || node.kind === "symptom").map((node) => <button key={node.id} type="button" aria-pressed={filters.focusId === node.id} onClick={() => set("focusId", node.id)}>{node.label}</button>)}
      </div>
      <div className={`panel ${styles.filters}`}>
        <label>
          Tema
          <select
            value={filters.focusId}
            onChange={(event) => set("focusId", event.target.value)}
          >
            <option value="">Todos os registros</option>
            {snapshot.graph.nodes
              .filter((node) => node.kind !== "patient")
              .map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
          </select>
        </label>
        <label>
          Natureza da relação
          <select
            value={filters.basis}
            onChange={(event) => set("basis", event.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(basisLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Evento a partir de
          <input
            type="date"
            value={filters.from}
            onChange={(event) => set("from", event.target.value)}
            max={filters.to || undefined}
          />
        </label>
        <label>
          Evento até
          <input
            type="date"
            value={filters.to}
            onChange={(event) => set("to", event.target.value)}
            min={filters.from || undefined}
          />
        </label>
        <button
          className="button secondary"
          type="button"
          onClick={() =>
            setFilters({ focusId: "", from: "", to: "", basis: "" })
          }
        >
          Limpar filtros
        </button>
      </div>
      <p className="muted">
        Cobertura recebida: {date(snapshot.coverage.from)} a{" "}
        {date(snapshot.coverage.to)}.
        {snapshot.coverage.truncated
          ? " O conjunto tem cobertura parcial."
          : ""}{" "}
        Filtros de data excluem registros sem data de evento.
      </p>
      {invalidRange ? (
        <p role="alert">
          O início do período deve ser anterior ou igual ao fim.
        </p>
      ) : null}
      <div className={styles.legend} role="group" aria-label="Legenda das relações">
        {Object.entries(basisLabels).map(([basis, label]) => (
          <button key={basis} type="button" aria-pressed={filters.basis === basis} onClick={() => set("basis", filters.basis === basis ? "" : basis)}>
            <i className={styles.line} data-basis={basis} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {!graph.nodes.length || invalidRange ? (
        <div className="panel empty-state">
          <p>Nenhum registro corresponde ao recorte selecionado.</p>
        </div>
      ) : (
        <div className={styles.exploration}>
          <div className={styles.graphArea}>
            <div className={styles.canvasHeading}><strong>{filters.focusId ? labels.get(filters.focusId) : "Visão completa"}</strong><span>{graph.nodes.length} registros · {graph.edges.length} relações</span></div>
            <div className={styles.canvas} aria-label="Visualização do grafo">
            {active ? (
              <ReactFlow
                key={`${snapshot.id}:${vertical}:${JSON.stringify(filters)}`}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.08, minZoom: 0.85, maxZoom: 1.1 }}
                minZoom={0.2}
                maxZoom={1.7}
                nodesDraggable={false}
                nodesConnectable={false}
                edgesReconnectable={false}
                deleteKeyCode={null}
                nodesFocusable
                edgesFocusable
                elementsSelectable={false}
                ariaLabelConfig={ariaLabels}
                onEdgeClick={(_, edge) => {
                  const ref = graph.edges.find((item) => item.id === edge.id)
                    ?.evidenceRefs[0];
                  if (ref && index.has(evidenceKey(ref))) openEvidence(ref);
                }}
              >
                <Background color="#d9e5e3" gap={24} />
                <Controls showInteractive={false} />
              </ReactFlow>
            ) : null}
          </div>
            <p className={styles.canvasHelp}>
            Arraste o grafo para explorar. Use os controles para ampliar ou
            enquadrar. Abra um registro para conferir a evidência.
            </p>
          </div>
          <aside className={styles.relationAside} aria-label="Detalhes do recorte">
            <h3 className={styles.listTitle}>Lista de relações</h3>
            <p className={styles.listIntro}>Do contexto à origem, em um clique.</p>
            {graph.edges.length ? (
              <ul className={styles.list}>
                {graph.edges.map((edge) => (
                  <li key={edge.id} className={styles.relation}>
                    <span className={styles.relationBasis} data-basis={edge.basis}><i className={styles.line} data-basis={edge.basis} aria-hidden="true" />{basisLabels[edge.basis]}</span>
                    <h4 aria-label={`${labels.get(edge.source)} para ${labels.get(edge.target)}`}>
                      {labels.get(edge.source)} <ArrowRight size={14} aria-hidden="true" /> {labels.get(edge.target)}
                    </h4>
                    <p>{edge.label}</p>
                    <div className={styles.references}>
                      {edge.evidenceRefs.map((ref) => {
                        const item = index.get(evidenceKey(ref));
                        return (
                          <button
                            className="text-link"
                            type="button"
                            key={evidenceKey(ref)}
                            disabled={!item}
                            onClick={() => openEvidence(ref)}
                          >
                            {item
                              ? `${item.label} · ${date(item.occurredOn ?? item.occurredAt)}`
                              : "Evidência indisponível"}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                Sem relações fornecidas para este recorte.
              </p>
            )}
            <h3 className={`${styles.listTitle} ${styles.recordsTitle}`}>Registros deste recorte</h3>
            <div className={styles.nodeList}>
              {graph.nodes.map((node) => {
                const ref = node.evidenceRefs[0];
                return ref ? (
                  <button
                    key={node.id}
                    className="button secondary"
                    type="button"
                    disabled={!index.has(evidenceKey(ref))}
                    onClick={() => openEvidence(ref)}
                  >
                    {node.label}
                  </button>
                ) : (
                  <span key={node.id} className="badge">
                    {node.label}
                  </span>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
