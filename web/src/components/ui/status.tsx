"use client";
import { AlertCircle, LoaderCircle } from "lucide-react";
export function Loading({
  label = "Carregando informações…",
}: {
  label?: string;
}) {
  return (
    <div className="empty-state" role="status">
      <LoaderCircle className="spin" size={24} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
export function Failure({
  error,
  onRetry,
}: {
  error?: Error | null;
  onRetry?: () => void;
}) {
  return (
    <section className="empty-state" role="alert">
      <AlertCircle size={28} aria-hidden="true" />
      <h2>Não foi possível continuar</h2>
      <p>{error?.message ?? "O acesso precisa ser confirmado novamente."}</p>
      {onRetry ? (
        <button className="button secondary" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </section>
  );
}
