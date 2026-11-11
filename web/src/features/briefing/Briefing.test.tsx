// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createFixture } from "@/lib/demo/fixture";
import { Briefing } from "./Briefing";

afterEach(cleanup);

describe("síntese visual do paciente", () => {
  it("abre a versão citada da medição e leva à curva sem uma etapa intermediária", () => {
    const snapshot = createFixture();
    const openEvidence = vi.fn();
    const onEvolution = vi.fn();
    render(<Briefing snapshot={snapshot} openEvidence={openEvidence} onEvolution={onEvolution} />);
    const finding = screen.getByRole("heading", { name: "Ferritina abaixo da referência do laudo" }).closest("article")!;
    expect(within(finding).getByText("22", { exact: true })).toBeDefined();
    expect(within(finding).getByText("Referência: 30–400 ng/mL")).toBeDefined();
    fireEvent.click(within(finding).getByRole("button", { name: /Ver evidência: Ferritina Sérica.*18\/10\/2025.*22 ng\/mL.*Versão 1/ }));
    expect(openEvidence).toHaveBeenCalledWith({ id: "ex-fer-2025", version: "1" });
    fireEvent.click(within(finding).getByRole("button", { name: "Ver evolução de Ferritina Sérica" }));
    expect(onEvolution).toHaveBeenCalledWith("ferritina");
  });

  it("mostra versões ausentes sem substituí-las por uma versão disponível", () => {
    const snapshot = createFixture();
    snapshot.briefing.items = [{ ...snapshot.briefing.items[0], evidenceRefs: [{ id: "ex-fer-2025", version: "2" }] }];
    render(<Briefing snapshot={snapshot} openEvidence={vi.fn()} onEvolution={vi.fn()} />);
    const finding = screen.getByRole("heading", { name: snapshot.briefing.items[0].title }).closest("article")!;
    expect(within(finding).getByText("Evidência indisponível nesta versão")).toBeDefined();
    expect(within(finding).queryByRole("button", { name: /Ver evidência: Ferritina/ })).toBeNull();
  });

  it("não inventa datas e mantém todas as referências de um item de contexto acessíveis", () => {
    const snapshot = createFixture();
    snapshot.clinicalContext.items[0].evidenceRefs.push({ id: "vitamin-d", version: "1" });
    const openEvidence = vi.fn();
    render(<Briefing snapshot={snapshot} openEvidence={openEvidence} onEvolution={vi.fn()} />);
    const context = screen.getByRole("heading", { name: "Síntese do paciente" }).closest("section")!;
    expect(within(context).getAllByText("Início não informado")).toHaveLength(2);
    const refs = within(context).getAllByRole("button", { name: /Conferir origem/ });
    expect(refs).toHaveLength(3);
    fireEvent.click(refs[1]);
    expect(openEvidence).toHaveBeenCalledWith({ id: "vitamin-d", version: "1" });
  });

  it("atalhos abrem registros e relações, inclusive quando a síntese está indisponível", () => {
    const snapshot = createFixture("briefing-unavailable");
    const onHistory = vi.fn();
    const onGraph = vi.fn();
    render(<Briefing snapshot={snapshot} openEvidence={vi.fn()} onEvolution={vi.fn()} onHistory={onHistory} onGraph={onGraph} />);
    fireEvent.click(screen.getByRole("button", { name: "Consultar registros" }));
    expect(onHistory).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /Explore as relações/ }));
    expect(onGraph).toHaveBeenCalledOnce();
  });
});
