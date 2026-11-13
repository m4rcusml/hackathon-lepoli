"use client";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Activity, ArrowLeft, BookOpen, FileClock, GitBranch, LockKeyhole, NotebookPen, Printer, RefreshCw, ShieldCheck, Layers } from "lucide-react";
import { useDoctor, receive, useExpired } from "@/features/session/provider";
import type { PatientContext } from "@/lib/api/doctor-api";
import type { EvidenceRef, Snapshot } from "@/lib/api/types";
import { ApiError, isAccessError } from "@/lib/api/errors";
import { date, scopeLabels } from "@/lib/clinical/format";
import { Loading, Failure } from "@/components/ui/status";
import { Briefing } from "@/features/briefing/Briefing";
import { History } from "@/features/evidence/History";
import { Sources } from "@/features/evidence/Sources";
import { EvidenceInspector } from "@/features/evidence/EvidenceInspector";
import { Review } from "./review";
import { DraftNotes } from "./draft-notes";

const Evolution = dynamic(() => import("@/features/evolution/evolution"), {
  ssr: false,
  loading: () => <Loading label="Preparando as curvas…" />,
});
const ClinicalGraph = dynamic(() => import("@/features/graph/clinical-graph"), {
  ssr: false,
  loading: () => <Loading label="Preparando as relações…" />,
});
const tabs = [
  "Resumo",
  "Evolução",
  "Histórico",
  "Relações",
  "Fontes",
  "Permissões",
] as const;
type Tab = (typeof tabs)[number];
export function Workspace({
  patientId,
  temporaryAccessId,
  initialSection,
}: {
  patientId: string;
  temporaryAccessId?: string;
  initialSection?: string;
}) {
  const ctx = useDoctor();
  const client = useQueryClient();
  const [generation, setGeneration] = useState(0);
  const [blocked, setBlocked] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<Error | null>(null);
  const refreshController = useRef<AbortController | null>(null);
  const initialTab = tabs.find((name) => name === initialSection) ?? "Resumo";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [visited, setVisited] = useState<Tab[]>([initialTab]);
  const [selection, setSelection] = useState<EvidenceRef | null>(null);
  const [initialSeries, setInitialSeries] = useState<string>();
  const [afterReview, setAfterReview] = useState(false);
  const context: PatientContext = { patientId, temporaryAccessId };
  const prefix = [
    "clinical",
    ctx.mode,
    ctx.session?.doctor?.id ?? "anonymous",
    patientId,
    temporaryAccessId ?? "continuous",
    generation,
  ];
  const enabled =
    !!ctx.session &&
    !blocked &&
    (ctx.session.state === "authenticated" || !!temporaryAccessId);
  const snapshotQuery = useQuery({
    queryKey: [...prefix, "snapshot"],
    queryFn: async ({ signal }) =>
      receive(await ctx.api.snapshot(context, { signal })),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const snapshot = snapshotQuery.data?.data;
  const accessQuery = useQuery({
    queryKey: [...prefix, "access"],
    queryFn: async ({ signal }) => {
      const r = await ctx.api.access(
        context,
        snapshot
          ? {
              dataRevision: snapshot.dataRevision,
              accessRevision: snapshot.accessRevision,
            }
          : undefined,
        { signal },
      );
      if (
        r.data.access.patientId !== patientId ||
        (temporaryAccessId
          ? r.data.access.kind !== "temporary" ||
            r.data.access.contextId !== temporaryAccessId
          : r.data.access.kind !== "continuous")
      )
        throw new ApiError(502, "INVALID_RESPONSE");
      return receive(r);
    },
    enabled,
    staleTime: 0,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  });
  const expired = useExpired(snapshot?.access.expiresAt, snapshotQuery.data);
  const block = useCallback(
    (e: Error) => {
      refreshController.current?.abort();
      setRefreshing(false);
      setBlocked(e);
      setSelection(null);
      void client.cancelQueries({ queryKey: ["clinical"] });
      client.removeQueries({ queryKey: ["clinical"] });
    },
    [client],
  );
  // Authorization changes are external events: clear both cached content and mounted details.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Purge on an external access failure, rather than retaining an authorized preview.
    if (accessQuery.error) block(accessQuery.error);
  }, [accessQuery.error, block]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Expiration requires immediate disposal of clinical state.
    if (expired) block(new ApiError(403, "ACCESS_EXPIRED"));
  }, [expired, block]);
  useEffect(
    () => () => {
      refreshController.current?.abort();
      void client.cancelQueries({ queryKey: ["clinical"] });
      client.removeQueries({ queryKey: ["clinical"] });
    },
    [client],
  );
  const refresh = () => {
    setRefreshing(false);
    setRefreshError(null);
    setSelection(null);
    setBlocked(null);
    setAfterReview(false);
    void client.cancelQueries({ queryKey: ["clinical"] });
    client.removeQueries({ queryKey: ["clinical"] });
    setGeneration((x) => x + 1);
  };
  async function refreshData() {
    if (refreshing || !snapshot) return;
    const request = new AbortController();
    refreshController.current = request;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const next = receive(
        await ctx.api.snapshot(context, { signal: request.signal }),
      );
      if (request.signal.aborted) return;
      if (
        next.data.patientId !== patientId ||
        next.data.access.contextId !== snapshot.access.contextId ||
        next.data.accessRevision !== snapshot.accessRevision
      )
        throw new ApiError(409, "ACCESS_CHANGED");
      setSelection((old) =>
        old &&
        next.data.evidence.some(
          (e) => e.id === old.id && e.version === old.version,
        )
          ? old
          : null,
      );
      client.setQueryData([...prefix, "snapshot"], next);
      setAfterReview(false);
      client.setQueryData(
        [...prefix, "access"],
        receive({
          serverTime: next.serverTime,
          data: {
            access: next.data.access,
            accessRevision: next.data.accessRevision,
            latestDataRevision: next.data.dataRevision,
            hasNewData: false,
          },
        }),
      );
    } catch (e) {
      if (!request.signal.aborted) {
        if (isAccessError(e)) block(e as Error);
        else setRefreshError(e as Error);
      }
    } finally {
      if (!request.signal.aborted) setRefreshing(false);
    }
  }
  const selectTab = (next: Tab) => {
    setTab(next);
    setVisited((v) => (v.includes(next) ? v : [...v, next]));
  };
  const keyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    current: number,
  ) => {
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (current + tabs.length - 1) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTab(tabs[next]);
    document.getElementById(`tab-${next}`)?.focus();
  };
  if (!ctx.sessionReady) return <Loading />;
  if (ctx.sessionError)
    return <Failure error={ctx.sessionError} onRetry={ctx.refreshSession} />;
  if (!enabled && !blocked)
    return (
      <section className="empty-state">
        <h1>Identificação necessária</h1>
        <p>A sessão médica e o acesso temporário têm validades distintas.</p>
        <Link href={ctx.base} className="button">
          Voltar à entrada
        </Link>
      </section>
    );
  if (blocked || accessQuery.error || expired)
    return (
      <>
        <Link href={`${ctx.base}/patients`} className="text-link">
          <ArrowLeft size={15} />
          Voltar à carteira
        </Link>
        <Failure error={blocked ?? accessQuery.error} onRetry={refresh} />
      </>
    );
  if (snapshotQuery.error)
    return <Failure error={snapshotQuery.error} onRetry={refresh} />;
  if (!snapshot || !accessQuery.data)
    return <Loading label="Confirmando acesso e carregando contexto…" />;
  const mismatch =
    snapshot.patientId !== patientId ||
    snapshot.accessRevision !== accessQuery.data.data.accessRevision ||
    snapshot.access.contextId !== accessQuery.data.data.access.contextId ||
    snapshot.access.scopeVersion !==
      accessQuery.data.data.access.scopeVersion ||
    [...snapshot.access.scopes].sort().join("|") !==
      [...accessQuery.data.data.access.scopes].sort().join("|") ||
    (temporaryAccessId
      ? snapshot.access.contextId !== temporaryAccessId
      : snapshot.access.kind !== "continuous");
  if (mismatch)
    return (
      <Failure error={new ApiError(409, "ACCESS_CHANGED")} onRetry={refresh} />
    );
  const newData =
    afterReview ||
    (accessQuery.data.data.hasNewData &&
      accessQuery.data.data.latestDataRevision !== snapshot.dataRevision);
  const loadOriginal = async (id: string, signal: AbortSignal) => {
    try {
      return await ctx.api.original(context, id, { signal });
    } catch (e) {
      if (isAccessError(e)) block(e as Error);
      throw e;
    }
  };
  return (
    <>
      <Link
        href={
          temporaryAccessId
            ? `${ctx.base}/consultation`
            : `${ctx.base}/patients`
        }
        className="text-link no-print"
      >
        <ArrowLeft size={15} />
        {temporaryAccessId ? "Convite e acompanhamento" : "Minha carteira"}
      </Link>
      <header className="patient-heading">
        <div className="patient-identity">
          <div className="patient-avatar" aria-hidden="true">{snapshot.patient.displayName.split(" ").filter(Boolean).slice(0, 2).map((word) => word[0]).join("")}</div>
          <div>
          <h1>{snapshot.patient.displayName}</h1>
          <div className="patient-meta">
            <span>
              {snapshot.patient.age !== null
                ? `${snapshot.patient.age} anos`
                : "Idade não informada"}
            </span>
            <span>
              {snapshot.patient.biologicalSex ?? "Sexo não informado"}
            </span>
            <span>{snapshot.patient.disambiguationLabel}</span>
          </div>
          </div>
        </div>
        <div className="patient-actions">
          <button
            className="button secondary note-shortcut"
            onClick={() => {
              const notes = document.getElementById("consultation-notes") as HTMLDetailsElement | null;
              if (notes) notes.open = true;
              document.getElementById("draft-notes")?.focus();
            }}
          >
            <NotebookPen size={16} aria-hidden="true" /> Anotar
          </button>
          <button
            className="access-control"
            onClick={() => selectTab("Permissões")}
          >
            <LockKeyhole size={14} aria-hidden="true" />
            {temporaryAccessId ? "Consulta temporária" : "Acompanhamento autorizado"}
          </button>
          <button
            className="icon-button"
            aria-label="Imprimir sumário autorizado"
            onClick={() => {
              selectTab("Resumo");
              requestAnimationFrame(() => window.print());
            }}
          >
            <Printer size={18} />
          </button>
          {temporaryAccessId ? (
            <button
              className="button secondary"
              onClick={async () => {
                block(new ApiError(403, "ACCESS_EXPIRED"));
                ctx.setTemporary(null);
                try {
                  await ctx.api.closeTemporary(temporaryAccessId);
                } catch {
                  /* Context is already inaccessible locally. Server TTL remains authoritative. */
                }
              }}
            >
              Encerrar acesso
            </button>
          ) : null}
        </div>
      </header>
      {temporaryAccessId ? (
        <p className="muted">
          Acesso pontual válido até {date(snapshot.access.expiresAt)}. Não
          adiciona o paciente à carteira.
        </p>
      ) : null}
      {snapshot.coverage.truncated ? (
        <p className="notice">
          Cobertura parcial: {date(snapshot.coverage.from)} a{" "}
          {date(snapshot.coverage.to)}. Este conjunto não representa o histórico
          completo.
        </p>
      ) : null}
      {newData ? (
        <div className="notice" role="status">
          <div>
            <strong>Novas informações disponíveis</strong>
            <br />
            <span>
              O conjunto em leitura continua estável até você atualizar.
            </span>
          </div>
          <button
            className="button secondary"
            disabled={refreshing}
            onClick={() => void refreshData()}
          >
            <RefreshCw size={15} />
            {refreshing ? "Atualizando…" : "Atualizar contexto"}
          </button>
        </div>
      ) : null}
      {refreshError ? (
        <p role="alert">
          {refreshError.message} O conjunto anterior continua em leitura; a
          autorização permanece sujeita à revalidação.
        </p>
      ) : null}
      <div
        className="patient-tabs no-print"
        role="tablist"
        aria-label="Áreas do paciente"
      >
        {tabs.map((t, i) => (
          <button
            key={t}
            id={`tab-${i}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`panel-${i}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => selectTab(t)}
            onKeyDown={(e) => keyboard(e, i)}
          >
            {(() => { const Icon = [BookOpen, Activity, FileClock, GitBranch, Layers, ShieldCheck][i]; return <Icon size={16} aria-hidden="true" />; })()}{t}
          </button>
        ))}
      </div>
      {snapshot.access.kind === "continuous" ? (
        <Review
          key={snapshot.id}
          snapshot={snapshot}
          context={context}
          openEvidence={setSelection}
          onAccessError={block}
          onRecorded={(v) => {
            setAfterReview(v);
            void client.invalidateQueries({ queryKey: ["portfolio"] });
          }}
        />
      ) : null}
      <div className="workspace-body">
        {tabs.map((t, i) => (
          <section
            key={t}
            id={`panel-${i}`}
            role="tabpanel"
            aria-labelledby={`tab-${i}`}
            hidden={tab !== t}
            tabIndex={0}
          >
            {visited.includes(t) ? (
              t === "Resumo" ? (
                <>
                  <Briefing
                    snapshot={snapshot}
                    openEvidence={setSelection}
                    onEvolution={(id) => {
                      setInitialSeries(id);
                      selectTab("Evolução");
                    }}
                    onHistory={() => selectTab("Histórico")}
                    onGraph={() => selectTab("Relações")}
                  />
                  <p className="muted small">
                    Conjunto de {date(snapshot.createdAt)} · Coletas e
                    recebimentos identificados nas evidências.
                  </p>
                </>
              ) : t === "Evolução" ? (
                <Evolution
                  active={tab === "Evolução"}
                  snapshot={snapshot}
                  openEvidence={setSelection}
                  initialSeries={initialSeries}
                />
              ) : t === "Histórico" ? (
                <History snapshot={snapshot} openEvidence={setSelection} />
              ) : t === "Relações" ? (
                <ClinicalGraph
                  active={tab === "Relações"}
                  snapshot={snapshot}
                  openEvidence={setSelection}
                />
              ) : t === "Fontes" ? (
                <Sources snapshot={snapshot} />
              ) : (
                <Permissions snapshot={snapshot} />
              )
            ) : null}
          </section>
        ))}
      </div>
      <DraftNotes />
      <EvidenceInspector
        snapshot={snapshot}
        selection={selection}
        onClose={() => setSelection(null)}
        onSelect={setSelection}
        loadOriginal={loadOriginal}
      />
    </>
  );
}
function Permissions({ snapshot }: { snapshot: Snapshot }) {
  const ctx = useDoctor();
  return (
    <div className="panel stack">
      <h2>Compartilhamento deste paciente</h2>
      <dl className="permissions-list">
        <dt>Tipo de acesso</dt>
        <dd>
          {snapshot.access.kind === "continuous"
            ? "Acompanhamento contínuo"
            : "Consulta temporária"}
        </dd>
        <dt>Duração autorizada</dt>
        <dd>
          {snapshot.access.expiresAt
            ? `Até ${date(snapshot.access.expiresAt)}`
            : "Sem data final, conforme autorização explícita do paciente"}
        </dd>
        <dt>Categorias permitidas</dt>
        <dd>
          {snapshot.access.scopes.map((s) => (
            <span key={s} className="badge" style={{ margin: "0 6px 6px 0" }}>
              {scopeLabels[s]}
            </span>
          ))}
        </dd>
      </dl>
      <p className="muted">
        O paciente confirma categorias e duração no aplicativo e pode revogar o
        compartilhamento. O acesso é revalidado a cada 15 segundos enquanto esta
        área está em uso e ao retornar à aba.
      </p>
      <Link className="text-link" href={`${ctx.base}/consultation`}>
        Solicitar nova autorização por convite
      </Link>
      <p className="small muted">
        A web não pode ampliar ou aprovar suas próprias permissões.
      </p>
    </div>
  );
}
