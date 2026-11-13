// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createFixture } from "@/lib/demo/fixture";
import { EvidenceInspector } from "./EvidenceInspector";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() {
      this.open = false;
    },
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:authorized-original"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(cleanup);

describe("inspector de evidência", () => {
  it("abre um registro relacionado em um clique preservando a versão", () => {
    const snapshot = createFixture();
    const evidence = snapshot.evidence.find((item) => item.id === "ex-fer-2025")!;
    const onSelect = vi.fn();
    render(<EvidenceInspector snapshot={snapshot} selection={{ id: evidence.id, version: evidence.version }} onClose={vi.fn()} onSelect={onSelect} loadOriginal={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Ver evidência: Ferritina Sérica · 65 ng\/mL · 20\/05\/2023, versão 1/ }));
    expect(onSelect).toHaveBeenCalledWith({ id: "ex-fer-2023", version: "1" });
  });

  it("aborta download pendente ao sair do contexto e não abre resposta atrasada", async () => {
    const snapshot = createFixture();
    const evidence = snapshot.evidence.find(
      (item) => item.id === "ex-fer-2025",
    )!;
    const document = snapshot.documents.items.find(
      (item) => item.id === evidence.documentId,
    )!;
    document.originalAvailable = true;
    let finish!: (value: Blob) => void;
    let signal!: AbortSignal;
    const pending = new Promise<Blob>((resolve) => {
      finish = resolve;
    });
    const load = vi.fn((_id: string, nextSignal: AbortSignal) => {
      signal = nextSignal;
      return pending;
    });
    const rendered = render(
      <EvidenceInspector
        snapshot={snapshot}
        selection={{ id: evidence.id, version: evidence.version }}
        onClose={vi.fn()}
        loadOriginal={load}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir original autorizado" }),
    );
    rendered.unmount();
    expect(signal.aborted).toBe(true);
    finish(new Blob(["test"], { type: "application/pdf" }));
    await pending;
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("libera object URL do original ao trocar o contexto", async () => {
    const snapshot = createFixture();
    const evidence = snapshot.evidence.find(
      (item) => item.id === "ex-fer-2025",
    )!;
    const document = snapshot.documents.items.find(
      (item) => item.id === evidence.documentId,
    )!;
    document.originalAvailable = true;
    const rendered = render(
      <EvidenceInspector
        snapshot={snapshot}
        selection={{ id: evidence.id, version: evidence.version }}
        onClose={vi.fn()}
        loadOriginal={vi.fn(
          async () => new Blob(["test"], { type: "application/pdf" }),
        )}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir original autorizado" }),
    );
    await waitFor(() =>
      expect(screen.getByTitle(`Original de ${document.title}`)).toBeDefined(),
    );
    rendered.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:authorized-original",
    );
  });
});
