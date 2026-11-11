"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";
import { useDoctor } from "@/features/session/provider";
import { authenticationUrl } from "@/lib/api/http";
import { parseInvitation } from "./parse-invitation";
import { date, scopeLabels } from "@/lib/clinical/format";
import type { Scope, Schemas } from "@/lib/api/types";
import { Loading, Failure } from "@/components/ui/status";
import { Workspace } from "@/features/workspace/workspace";

const Scanner = dynamic(() => import("./scanner"), { ssr: false });
export function InvitationExperience({
  token,
  view,
}: {
  token?: string;
  view?: string;
}) {
  const ctx = useDoctor();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [resolving, setResolving] = useState(false);
  const [scanner, setScanner] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const pending = useRef(false);
  const api = ctx.api;
  const setInvitation = ctx.setInvitation;
  const setTemporary = ctx.setTemporary;
  const base = ctx.base;
  const resolveValue = useCallback(
    async (raw: string) => {
      if (pending.current) return;
      pending.current = true;
      setError(null);
      setScanner(false);
      setResolving(true);
      const request = new AbortController();
      controller.current = request;
      try {
        const parsed = parseInvitation(raw, window.location.origin);
        setValue("");
        const r = await api.resolve(parsed, { signal: request.signal });
        if (request.signal.aborted) return;
        setInvitation(r.data);
        setTemporary(r.data.temporaryAccess);
        router.replace(`${base}/consultation`);
      } catch (e) {
        if (!request.signal.aborted) {
          setError(e as Error);
          if (token)
            window.history.replaceState(null, "", `${base}/consultation`);
        }
      } finally {
        if (controller.current === request) {
          pending.current = false;
          if (!request.signal.aborted) setResolving(false);
        }
      }
    },
    [api, setInvitation, setTemporary, router, base, token],
  );
  useEffect(() => {
    if (token && ctx.sessionReady && ctx.session) {
      // Resolve first; then replace the URL. A route change before resolution cancels the exchange.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Token in the route is an external invitation event; its exchange is cancellable.
      void resolveValue(token);
    }
    return () => {
      controller.current?.abort();
      pending.current = false;
    };
  }, [token, ctx.sessionReady, ctx.session, base, resolveValue]);
  useEffect(() => () => controller.current?.abort(), []);
  const onRead = useCallback(
    (raw: string) => {
      void resolveValue(raw);
    },
    [resolveValue],
  );
  if (view === "patient" && ctx.temporary)
    return (
      <Workspace
        key={ctx.temporary.contextId}
        patientId={ctx.temporary.patientId}
        temporaryAccessId={ctx.temporary.contextId}
      />
    );
  const handoff = ctx.session?.pendingInvitation;
  const resolution: Schemas["SharingResolution"] | null =
    ctx.invitation ??
    (handoff
      ? {
          invitation: handoff.invitation,
          temporaryAccess: null,
          requiresDoctorAuthentication: false,
          loginContextId: handoff.loginContextId,
        }
      : null);
  return (
    <div className="sharing-form stack">
      <div>
        <h1>Abrir convite do paciente</h1>
        <p className="muted">
          Use o QR ou link compartilhado para consultar o contexto autorizado ou
          solicitar acompanhamento.
        </p>
      </div>
      {!ctx.sessionReady ? (
        <Loading label="Preparando a sessão…" />
      ) : ctx.sessionError ? (
        <Failure error={ctx.sessionError} onRetry={ctx.refreshSession} />
      ) : (
        <>
          {resolution ? (
            <SharingActions
              resolution={resolution}
              openTemporary={() =>
                router.replace(`${base}/consultation?view=patient`)
              }
            />
          ) : (
            <section className="panel stack">
              <h2>Receber compartilhamento</h2>
              <p>
                O convite é validado pelo serviço central. Um link de duas horas
                não cria acompanhamento permanente.
              </p>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void resolveValue(value);
                }}
              >
                <label className="field" htmlFor="invitation">
                  Link ou código de compartilhamento
                  <input
                    id="invitation"
                    autoComplete="off"
                    spellCheck={false}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    maxLength={4096}
                    placeholder="Cole o link recebido do paciente"
                    required
                    disabled={resolving}
                  />
                </label>
                <div className="sharing-options">
                  <button
                    className="button"
                    disabled={resolving || !value.trim()}
                  >
                    {resolving ? "Validando convite…" : "Validar convite"}
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={resolving}
                    onClick={() => setScanner((v) => !v)}
                  >
                    <QrCode size={18} />
                    Ler QR pela câmera
                  </button>
                </div>
              </form>
            </section>
          )}
          {scanner ? (
            <Scanner onRead={onRead} onClose={() => setScanner(false)} />
          ) : null}
          {resolving ? (
            <p role="status">Confirmando as permissões do convite…</p>
          ) : null}
          {error ? <p role="alert">{error.message}</p> : null}
          {resolution ? (
            <button
              className="text-link"
              onClick={() => {
                ctx.setInvitation(null);
                ctx.setTemporary(null);
              }}
            >
              Usar outro convite
            </button>
          ) : null}
          <p className="muted small">
            Ao recarregar uma consulta temporária, será necessário abrir
            novamente o convite. O prazo original não é renovado.
          </p>
          <Link href={`${ctx.base}/patients`} className="text-link">
            Voltar à carteira
          </Link>
        </>
      )}
    </div>
  );
}
function SharingActions({
  resolution,
  openTemporary,
}: {
  resolution: Schemas["SharingResolution"];
  openTemporary: () => void;
}) {
  const ctx = useDoctor();
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [duration, setDuration] = useState("");
  const [until, setUntil] = useState("");
  const [request, setRequest] = useState<Schemas["FollowupRequest"]>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intent = useRef<{ body: string; key: string } | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const poll = useQuery({
    queryKey: [ctx.mode, ctx.session?.doctor?.id, "followup", request?.id],
    queryFn: ({ signal }) => ctx.api.followup(request!.id, { signal }),
    enabled: !!request && request.status === "pending",
    refetchInterval: (q) =>
      q.state.data?.status === "pending" || !q.state.data ? 15000 : false,
    refetchOnWindowFocus: "always",
  });
  const current = poll.data ?? request;
  async function submit() {
    if (!duration || !scopes.length || saving) return;
    setSaving(true);
    setError(null);
    controller.current = new AbortController();
    try {
      const input: Schemas["FollowupRequestInput"] = {
        invitationId: resolution.invitation.id,
        requestedScopes: scopes,
        requestedDuration: {
          mode: duration as "until" | "until_revoked",
          expiresAt:
            duration === "until" ? new Date(until).toISOString() : null,
        },
      };
      const body = JSON.stringify(input);
      if (intent.current?.body !== body)
        intent.current = { body, key: crypto.randomUUID() };
      const r = await ctx.api.requestFollowup(input, intent.current.key, {
        signal: controller.current.signal,
      });
      if (!controller.current.signal.aborted) setRequest(r);
    } catch (e) {
      if (!controller.current.signal.aborted) setError(e as Error);
    } finally {
      if (!controller.current.signal.aborted) setSaving(false);
    }
  }
  return (
    <section className="panel stack">
      <div>
        <span className="badge neutral">Convite validado</span>
        <h2 style={{ marginTop: 16 }}>
          {resolution.invitation.kind === "consultation"
            ? "Consulta pontual disponível"
            : "Convite para solicitar acompanhamento"}
        </h2>
        <p className="muted">
          Convite válido até {date(resolution.invitation.expiresAt)}.
        </p>
      </div>
      {resolution.temporaryAccess && ctx.temporary ? (
        <button className="button" onClick={openTemporary}>
          Abrir consulta temporária
        </button>
      ) : null}
      {resolution.invitation.canRequestFollowup ? (
        ctx.session?.state !== "authenticated" ? (
          <div className="stack">
            <p>
              Para solicitar acompanhamento contínuo, identifique-se. O paciente
              ainda precisará confirmar.
            </p>
            {ctx.mode === "demo" ? (
              <button
                className="button secondary"
                onClick={() => {
                  ctx.demo?.login();
                  ctx.refreshSession();
                }}
              >
                Entrar no espaço do médico
              </button>
            ) : (
              <a
                className="button secondary"
                href={authenticationUrl(
                  "/doctor/consultation",
                  resolution.loginContextId,
                )}
              >
                Identificar-me para solicitar acompanhamento
              </a>
            )}
          </div>
        ) : current ? (
          <div className="stack" role="status">
            <h3>
              {
                {
                  pending: "Aguardando confirmação do paciente",
                  approved: "Acompanhamento confirmado pelo paciente",
                  rejected: "O paciente não aprovou o acompanhamento",
                  expired: "A solicitação expirou",
                  cancelled: "Solicitação cancelada",
                }[current.status]
              }
            </h3>
            <p>
              {current.status === "pending"
                ? "O paciente deve confirmar seu nome, as categorias pedidas e a duração no aplicativo. Nenhum dado contínuo é liberado pela pendência."
                : current.status === "approved"
                  ? "O vínculo individual está ativo. Consulte somente as categorias autorizadas."
                  : "Peça um novo convite ao paciente para tentar novamente."}
            </p>
            {current.status === "approved" &&
            current.grant?.status === "active" ? (
              <Link
                className="button"
                href={`${ctx.base}/patients/${encodeURIComponent(current.grant.patientId)}`}
              >
                Abrir paciente autorizado
              </Link>
            ) : null}
            {poll.error ? <p role="alert">{poll.error.message}</p> : null}
            {current.status === "pending" ? (
              <button className="text-link" onClick={() => void poll.refetch()}>
                Verificar confirmação
              </button>
            ) : null}
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <hr />
            <h3>Solicitar acompanhamento contínuo</h3>
            <p className="muted">
              Escolha categorias e duração. O paciente confirma a autorização no
              aplicativo.
            </p>
            <fieldset className="stack" style={{ border: 0, padding: 0 }}>
              <legend>Categorias solicitadas</legend>
              {resolution.invitation.permittedScopes.map((s) => (
                <label key={s}>
                  <input
                    type="checkbox"
                    checked={scopes.includes(s)}
                    onChange={(e) =>
                      setScopes((old) =>
                        e.target.checked
                          ? [...old, s]
                          : old.filter((x) => x !== s),
                      )
                    }
                  />
                  {scopeLabels[s]}
                </label>
              ))}
            </fieldset>
            <label className="field">
              Duração solicitada
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              >
                <option value="">Escolha a duração</option>
                <option value="until">Até uma data específica</option>
                <option value="until_revoked">
                  Até revogação, com confirmação explícita
                </option>
              </select>
            </label>
            {duration === "until" ? (
              <label className="field">
                Data e horário final (horário local)
                <input
                  type="datetime-local"
                  required
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                />
              </label>
            ) : null}
            {error ? <p role="alert">{error.message}</p> : null}
            <button
              className="button"
              disabled={
                !scopes.length ||
                !duration ||
                (duration === "until" && !until) ||
                saving
              }
            >
              {saving
                ? "Enviando solicitação…"
                : "Solicitar confirmação ao paciente"}
            </button>
          </form>
        )
      ) : (
        <p>Este convite permite apenas consulta pontual.</p>
      )}
    </section>
  );
}
