// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Schemas } from "@/lib/api/types";
import { Portfolio } from "./Portfolio";

const noop = vi.fn();
const props = {
  query: "",
  filter: "inactive" as const,
  onQuery: noop,
  onFilter: noop,
  onNext: noop,
  onPrevious: noop,
  hasPrevious: false,
  openPatient: noop,
  onAdd: noop,
};
const active: Schemas["PatientRow"] = {
  relationshipId: "active",
  accessStatus: "active",
  patient: { id: "patient", displayName: "Daniel Vaz", age: 32, biologicalSex: "Masculino", disambiguationLabel: null },
  highlight: "Exames até out/2025 · wearable até nov/2026",
  lastClinicalEventAt: null,
  lastClinicalEventOn: "2025-10-18",
  lastReceivedAt: "2026-11-11T15:00:00Z",
  review: { mode: "initial_review", unreadGroupCount: null, lastReviewedCursor: null, lastReviewedAt: null },
};
const list = (items: Schemas["PatientRow"][]): Schemas["PatientList"] => ({ items, page: { hasMore: false, nextCursor: null } });
afterEach(cleanup);

describe("carteira", () => {
  it("não renderiza perfil, destaque nem datas clínicas de vínculo inativo, mesmo num payload incorreto", () => {
    const row: Schemas["PatientRow"] = {
      relationshipId: "revoked",
      accessStatus: "revoked",
      patient: {
        id: "private",
        displayName: "Nome que deve ser protegido",
        age: 32,
        biologicalSex: "Masculino",
        disambiguationLabel: "Identificador privado",
      },
      highlight: "Achado privado",
      lastClinicalEventAt: null,
      lastClinicalEventOn: "2025-10-18",
      lastReceivedAt: "2026-11-11T15:00:00Z",
      review: {
        mode: "changes",
        unreadGroupCount: 9,
        lastReviewedCursor: null,
        lastReviewedAt: null,
      },
    };
    const markup = renderToStaticMarkup(
      <Portfolio
        {...props}
        data={{ items: [row], page: { hasMore: false, nextCursor: null } }}
      />,
    );
    expect(markup).not.toContain("Nome que deve ser protegido");
    expect(markup).not.toContain("Achado privado");
    expect(markup).not.toContain("18/10/2025");
    expect(markup).toContain("Revogado");
    expect(markup).toContain("Identificação protegida");
  });

  it("não transforma revisão inicial em uma contagem de notificações antigas", () => {
    const row: Schemas["PatientRow"] = {
      relationshipId: "active",
      accessStatus: "active",
      patient: {
        id: "patient",
        displayName: "Daniel Vaz",
        age: 32,
        biologicalSex: "Masculino",
        disambiguationLabel: null,
      },
      highlight: null,
      lastClinicalEventAt: null,
      lastClinicalEventOn: "2025-10-18",
      lastReceivedAt: null,
      review: {
        mode: "initial_review",
        unreadGroupCount: null,
        lastReviewedCursor: null,
        lastReviewedAt: null,
      },
    };
    const markup = renderToStaticMarkup(
      <Portfolio
        {...props}
        filter="active"
        data={{ items: [row], page: { hasMore: false, nextCursor: null } }}
      />,
    );
    expect(markup).toContain("Revisão inicial");
    expect(markup).not.toContain("novidade(s)");
  });

  it("abre contexto, evolução e histórico diretamente sem uma navegação intermediária", () => {
    const openPatient = vi.fn();
    render(<Portfolio {...props} filter="active" openPatient={openPatient} data={list([active])} />);
    fireEvent.click(screen.getByRole("button", { name: "Daniel Vaz" }));
    expect(openPatient).toHaveBeenLastCalledWith("patient");
    fireEvent.click(screen.getByRole("button", { name: "Revisar paciente" }));
    expect(openPatient).toHaveBeenLastCalledWith("patient", "Resumo");
    fireEvent.click(screen.getByRole("button", { name: "Evolução" }));
    expect(openPatient).toHaveBeenLastCalledWith("patient", "Evolução");
    fireEvent.click(screen.getByRole("button", { name: "Histórico" }));
    expect(openPatient).toHaveBeenLastCalledWith("patient", "Histórico");
    expect(screen.getByText("18/10/2025")).toBeVisible();
    expect(screen.getByText("Recebido em 11/11/2026, 12:00")).toBeVisible();
  });

  it("bloqueia todos os atalhos de homônimos sem identificação adicional", () => {
    const openPatient = vi.fn();
    const homonym = { ...active, relationshipId: "other", patient: { ...active.patient!, id: "other" } };
    render(<Portfolio {...props} filter="active" openPatient={openPatient} data={list([active, homonym])} />);
    for (const article of screen.getAllByRole("article", { name: "Daniel Vaz" })) {
      for (const button of within(article).getAllByRole("button")) {
        expect(button).toBeDisabled();
        fireEvent.click(button);
      }
    }
    expect(openPatient).not.toHaveBeenCalled();
  });

  it("não revela pacientes anteriores durante uma busca ou cria atalhos para acesso revogado", () => {
    const { rerender } = render(<Portfolio {...props} filter="active" loading data={list([active])} />);
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Buscando na sua carteira");
    rerender(<Portfolio {...props} data={list([{ ...active, accessStatus: "revoked" }])} />);
    expect(screen.queryByRole("button", { name: "Daniel Vaz" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Evolução" })).not.toBeInTheDocument();
    expect(screen.queryByText(active.highlight!)).not.toBeInTheDocument();
  });
});
