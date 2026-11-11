"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { OpenEvidence, Schemas, Snapshot } from "@/lib/api/types";
import type { PatientContext } from "@/lib/api/doctor-api";
import { ApiError, isAccessError } from "@/lib/api/errors";
import { useDoctor } from "@/features/session/provider";
import { date } from "@/lib/clinical/format";
import { CheckCheck, FileClock } from "lucide-react";

export function Review({
  snapshot,
  context,
  openEvidence,
  onAccessError,
  onRecorded,
}: {
  snapshot: Snapshot;
  context: PatientContext;
  openEvidence: OpenEvidence;
  onAccessError: (e: Error) => void;
  onRecorded: (newData: boolean) => void;
}) {
  const ctx = useDoctor();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<Schemas["ReviewResult"]>();
  const intent = useRef<string | null>(null);
  const alive = useRef(true);
  // Mutation fetches are explicitly abortable as query cancellation does not cancel mutations.
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  const updates = useInfiniteQuery({
    queryKey: [
      "clinical",
      ctx.mode,
      ctx.session?.doctor?.id,
      context.patientId,
      context.temporaryAccessId ?? "continuous",
      snapshot.id,
      "updates",
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }) => {
      const page = await ctx.api.updates(context, snapshot.id, pageParam, {
        signal,
      });
      if (
        page.snapshotId !== snapshot.id ||
        page.throughCursor !== snapshot.updateHighWatermark ||
        (page.page.hasMore && !page.page.nextCursor) ||
        page.items.some((item) =>
          item.evidenceRefs.some(
            (ref) =>
              !snapshot.evidence.some(
                (e) => e.id === ref.id && e.version === ref.version,
              ),
          ),
        )
      )
        throw new ApiError(502, "INVALID_RESPONSE");
      return page;
    },
    getNextPageParam: (last) =>
      last.page.hasMore ? (last.page.nextCursor ?? undefined) : undefined,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const pages = updates.data?.pages ?? [];
  const last = pages.at(-1);
  useEffect(() => {
    if (isAccessError(updates.error)) onAccessError(updates.error as Error);
  }, [updates.error, onAccessError]);
  const complete = !!last && !last.page.hasMore && !!last.reviewToken;
  async function record() {
    if (!complete || saving || result) return;
    setSaving(true);
    setError(null);
    intent.current ??= crypto.randomUUID();
    controller.current = new AbortController();
    try {
      const r = await ctx.api.review(
        context,
        { snapshotId: snapshot.id, reviewToken: last!.reviewToken! },
        intent.current,
        { signal: controller.current.signal },
      );
      if (alive.current) {
        setResult(r);
        onRecorded(r.hasUpdatesAfterReview);
      }
    } catch (e) {
      if (alive.current) {
        const err = e as Error;
        setError(err);
        if (isAccessError(e)) onAccessError(err);
      }
    } finally {
      if (alive.current) setSaving(false);
    }
  }
  return (
    <section className="review-panel" aria-labelledby="review-heading">
      {updates.isPending ? (
        <p role="status">Carregando o conjunto de novidades…</p>
      ) : null}
      {updates.error ? (
        <div role="alert">
          <p>{updates.error.message}</p>
          <button className="text-link" onClick={() => void updates.refetch()}>
            Tentar carregar novidades novamente
          </button>
        </div>
      ) : null}
      <div className="review-items">
        {pages
          .flatMap((p) => p.items)
          .map((item) => (
            <div key={item.id}>
              <span className="badge neutral">
                {item.change === "corrected"
                  ? "Correção"
                  : item.change === "removed"
                    ? "Remoção"
                    : "Recebido"}
              </span>{" "}
              <span className="review-item-label">{item.label}</span>
              {item.evidenceRefs.map((ref, i) => (
                <button
                  key={`${ref.id}@${ref.version}`}
                  className="text-link"
                  onClick={() => openEvidence(ref)}
                >
                  Ver evidência {i + 1}
                </button>
              ))}
            </div>
          ))}
      </div>
      {error ? <p role="alert">{error.message}</p> : null}
      <div className="review-dock no-print">
        <div className="review-dock-label">
          {result ? <CheckCheck size={23} aria-hidden="true" /> : <FileClock size={23} aria-hidden="true" />}
          <div>
            <h2 id="review-heading">{snapshot.review?.mode === "initial_review" ? "Histórico disponível para revisão inicial" : "Desde sua última revisão"}</h2>
            {result ? <p role="status">Revisão deste conjunto registrada em {date(result.lastReviewedAt)}.{result.hasUpdatesAfterReview ? " Há informações posteriores que continuam novas." : ""}</p> : <p>{snapshot.review?.lastReviewedAt ? `Última revisão: ${date(snapshot.review.lastReviewedAt)}` : "Primeira leitura · conjunto de " + date(snapshot.createdAt)}</p>}
          </div>
        </div>
        <div className="review-dock-actions">
          {updates.hasNextPage ? <button className="button secondary" disabled={updates.isFetchingNextPage} onClick={() => void updates.fetchNextPage()}>Carregar próximas novidades</button> : null}
          {result ? <span className="badge"><CheckCheck size={14} aria-hidden="true" /> Revisão registrada</span> : (
          <button
            className="button"
            disabled={!complete || !!updates.error || saving}
            onClick={() => void record()}
          >
            <CheckCheck size={17} aria-hidden="true" />
            {saving ? "Registrando revisão…" : "Concluir revisão das novidades"}
          </button>
          )}
        </div>
        <span className="sr-only">Concluir registra apenas o conjunto apresentado a você. Não declara normalidade, diagnóstico ou conduta.</span>
      </div>
    </section>
  );
}
