"use client";
import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck } from "lucide-react";
import { useDoctor } from "./provider";
import { authenticationUrl } from "@/lib/api/http";
import { Failure, Loading } from "@/components/ui/status";
import { PortfolioPage } from "@/features/patients/portfolio-page";
export function Entry() {
  const ctx = useDoctor();
  if (ctx.session?.state === "authenticated") return <PortfolioPage />;
  return (
    <div className="entry-layout">
      <div className="entry-main">
        <h1>
          O contexto do paciente.
          <br />
          <span>Ao alcance do cuidado.</span>
        </h1>
        <p className="lead">
          Acompanhe sua carteira, entenda o que mudou e volte à fonte de cada
          informação.
        </p>
        <div className="entry-actions">
          {!ctx.sessionReady ? (
            <Loading label="Verificando sua sessão…" />
          ) : ctx.sessionError ? (
            <Failure error={ctx.sessionError} onRetry={ctx.refreshSession} />
          ) : ctx.mode === "demo" ? (
            <button
              className="button"
              onClick={() => {
                ctx.demo?.login();
                ctx.refreshSession();
              }}
            >
              Entrar no espaço do médico
            </button>
          ) : (
            <a className="button" href={authenticationUrl()}>
              Identificar-me pelo serviço central <ArrowRight size={18} />
            </a>
          )}
          <Link className="text-link" href={`${ctx.base}/consultation`}>
            Tenho um link ou QR do paciente <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="entry-aside">
        <ShieldCheck size={32} />
        <h2>
          O paciente decide.
          <br />
          Você acompanha.
        </h2>
        <p>A carteira reúne apenas pacientes com acompanhamento autorizado.</p>
        <hr />
        <FileCheck2 size={24} />
        <h3>Da síntese à evidência</h3>
        <p>
          Consulte exames, histórico e relações com origem, data e limites de
          cada registro.
        </p>
        <p className="small">
          Um convite temporário permite somente o acesso aprovado.
          Acompanhamento contínuo exige confirmação específica do paciente.
        </p>
      </div>
    </div>
  );
}
