"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, LogOut, Users, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDoctor } from "./provider";
import { useEffect, useState, type ReactNode } from "react";
import { scenarioNames, type DemoScenario } from "@/lib/demo/scenarios";

export function Shell({ children }: { children: ReactNode }) {
  const ctx = useDoctor();
  const client = useQueryClient();
  const pathname = usePathname();
  const invitation = pathname.includes("/consultation");
  const [logoutState, setLogoutState] = useState<"pending" | "error" | null>(null);
  // Scenario control stays outside the clinical UI and never attaches to the real API.
  useEffect(() => {
    if (ctx.mode !== "demo" || !ctx.demo) return;
    const control = (event: Event) => {
      const { action, scenario } = (event as CustomEvent<{ action: string; scenario?: DemoScenario }>).detail ?? {};
      if (action === "scenario" && scenario && scenarioNames.includes(scenario)) {
        ctx.changeScenario(scenario);
        return;
      }
      if (action === "arrive") ctx.demo?.arrive();
      else if (action === "revoke") ctx.demo?.revoke();
      else if (action === "restrict") ctx.demo?.restrict();
      else if (action === "approve") ctx.demo?.decide("approved");
      else if (action === "reject") ctx.demo?.decide("rejected");
      else if (action === "doctor") {
        ctx.demo?.otherDoctor();
        ctx.refreshSession();
      } else return;
      void client.invalidateQueries({ predicate: (q) => q.queryKey.includes("access") || q.queryKey.includes("followup") || q.queryKey.includes("portfolio") });
    };
    window.addEventListener("rivio:scenario", control);
    return () => window.removeEventListener("rivio:scenario", control);
  }, [ctx, client]);
  async function logout() {
    setLogoutState("pending");
    await client.cancelQueries();
    client.removeQueries({ predicate: (q) => q.queryKey[1] !== "session" });
    ctx.setTemporary(null);
    ctx.setInvitation(null);
    try {
      await ctx.api.logout();
      ctx.clear();
    } catch {
      setLogoutState("error");
    }
  }
  const doctor = ctx.session?.doctor;
  const initials = doctor?.displayName.replace(/^Dra?\.\s*/i, "").split(" ").filter(Boolean).map((word) => word[0]).slice(0, 2).join("") ?? "MD";
  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Navegação principal">
        <Link href={ctx.base} className="brand" aria-label="Rivio, espaço do médico">
          <Activity aria-hidden="true" size={28} />
          <span>rivio<span className="brand-dot">.</span></span>
        </Link>
        <nav>
          <Link className="nav-link" href={`${ctx.base}/patients`} aria-current={!invitation ? "page" : undefined} aria-label="Minha carteira">
            <Users size={22} aria-hidden="true" /><span>Carteira</span>
          </Link>
          <Link className="nav-link" href={`${ctx.base}/consultation`} aria-current={invitation ? "page" : undefined} aria-label="Abrir convite">
            <ArrowUpRight size={22} aria-hidden="true" /><span>Convite</span>
          </Link>
        </nav>
        <div className="rail-foot" title="Acesso autorizado pelo paciente"><ShieldCheck size={22} aria-hidden="true" /><span>Acesso<br />autorizado</span></div>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <span className="topbar-title">Espaço do médico <span>/</span> {invitation ? "Compartilhamento" : "Acompanhamento"}</span>
          <div className="doctor-identity">
            <span className="identity-mark">{initials}</span>
            <span>{doctor?.displayName ?? "Acesso do médico"}<small>{doctor?.professionalIdentifier ?? "Identificação pelo serviço central"}</small></span>
            {ctx.session?.state === "authenticated" ? <button className="icon-button" aria-label="Sair" data-discard-context onClick={() => void logout()}><LogOut size={18} /></button> : null}
          </div>
        </header>
        <main id="main" className="main-content">
          {logoutState ? <section className="empty-state" role="status"><h1>{logoutState === "pending" ? "Encerrando sessão…" : "Não foi possível confirmar a saída no serviço"}</h1><p>O conteúdo clínico foi removido deste espaço.</p>{logoutState === "error" ? <button className="button" onClick={() => void logout()}>Tentar encerrar novamente</button> : null}</section> : <div key={`${ctx.mode}:${ctx.session ? (doctor?.id ?? "anonymous") : "blocked"}`}>{children}</div>}
        </main>
        <footer className="app-footer"><span>Rivio · Contexto que acompanha o cuidado.</span><span><ShieldCheck size={13} aria-hidden="true" /> Compartilhado pelo paciente</span></footer>
      </div>
    </div>
  );
}
