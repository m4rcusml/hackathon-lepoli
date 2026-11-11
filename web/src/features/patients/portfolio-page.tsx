"use client";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDoctor } from "@/features/session/provider";
import { Portfolio } from "./Portfolio";
import { Loading, Failure } from "@/components/ui/status";
import type { PatientQuery } from "@/lib/api/doctor-api";
export function PortfolioPage() {
  const ctx = useDoctor();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<NonNullable<PatientQuery["filter"]>>("active");
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const result = useQuery({
    placeholderData: keepPreviousData,
    queryKey: [
      "portfolio",
      ctx.mode,
      ctx.session?.doctor?.id,
      query,
      filter,
      cursors.at(-1),
    ],
    queryFn: ({ signal }) =>
      ctx.api.patients(
        { q: query, filter, cursor: cursors.at(-1) },
        { signal },
      ),
    enabled: ctx.session?.state === "authenticated",
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  });
  if (!ctx.sessionReady) return <Loading />;
  if (ctx.sessionError)
    return <Failure error={ctx.sessionError} onRetry={ctx.refreshSession} />;
  if (ctx.session?.state !== "authenticated")
    return (
      <section className="empty-state">
        <h1>Identifique-se para acessar sua carteira</h1>
        <p>O convite temporário não substitui a sessão médica.</p>
        <Link className="button" href={ctx.base}>
          Ir para a entrada
        </Link>
      </section>
    );
  return (
    <>
      {result.isPending ? (
        <Loading />
      ) : result.error ? (
        <Failure error={result.error} onRetry={() => void result.refetch()} />
      ) : (
        <Portfolio
          data={
            result.isPlaceholderData
              ? { items: [], page: { hasMore: false, nextCursor: null } }
              : result.data
          }
          loading={result.isPlaceholderData}
          query={query}
          filter={filter}
          onQuery={(q) => {
            setQuery(q);
            setCursors([undefined]);
          }}
          onFilter={(f) => {
            setFilter(f);
            setCursors([undefined]);
          }}
          onNext={() =>
            setCursors([...cursors, result.data.page.nextCursor ?? undefined])
          }
          onPrevious={() => setCursors(cursors.slice(0, -1))}
          hasPrevious={cursors.length > 1}
          openPatient={(id, section) =>
            router.push(`${ctx.base}/patients/${encodeURIComponent(id)}${section ? `?section=${encodeURIComponent(section)}` : ""}`)
          }
          onAdd={() => router.push(`${ctx.base}/consultation`)}
        />
      )}
    </>
  );
}
