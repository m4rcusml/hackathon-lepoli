"use client";
import { useEffect, useState } from "react";

export function DraftNotes() {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!value.trim()) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest("a[href], [data-discard-context]")
          : null;
      if (!target) return;
      if (
        target instanceof HTMLAnchorElement &&
        new URL(target.href).href === window.location.href
      )
        return;
      if (
        !window.confirm(
          "Este rascunho não foi salvo. Deseja sair e descartá-lo?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", navigate, true);
    };
  }, [value]);
  return (
    <details id="consultation-notes" className="panel no-print consultation-notes">
      <summary>Rascunho de notas da consulta</summary>
      <div className="stack" style={{ marginTop: 16 }}>
        <p className="muted">
          Somente na memória desta aba. Não salvo, não compartilhado e não faz
          parte do prontuário. Sair do paciente ou perder autorização descarta o
          rascunho.
        </p>
        <label className="field" htmlFor="draft-notes">
          Notas do médico
          <textarea
            id="draft-notes"
            className="notes-area"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={10000}
            placeholder="Rascunho temporário da sua leitura"
          />
        </label>
        <span className="small muted" role="status">
          {value ? "Rascunho não salvo" : "Nenhuma nota registrada"}
        </span>
        <button
          className="text-link"
          type="button"
          disabled={!value}
          onClick={() => setValue("")}
        >
          Descartar rascunho
        </button>
      </div>
    </details>
  );
}
