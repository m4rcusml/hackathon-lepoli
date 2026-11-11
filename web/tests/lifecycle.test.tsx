// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useExpired } from "@/features/session/provider";
import { Review } from "@/features/workspace/review";
import { Shell } from "@/features/session/shell";
import { PortfolioPage } from "@/features/patients/portfolio-page";
import { createDemoApi } from "@/lib/demo/api";
import { createFixture, demoDoctor, DEMO_TIME } from "@/lib/demo/fixture";
import type { Schemas } from "@/lib/api/types";

const runtime = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/features/session/provider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/session/provider")>()),
  useDoctor: () => runtime.value,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/doctor/patients",
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("authorization expiry from server time", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "performance", "Date"],
    });
    vi.setSystemTime(new Date("2099-01-01T00:00:00Z"));
  });

  it("uses elapsed monotonic time despite a divergent wall clock", () => {
    const response = { serverTime: DEMO_TIME, receivedAt: performance.now() };
    const hook = renderHook(() => useExpired("2026-11-11T15:00:02Z", response));
    expect(hook.result.current).toBe(false);
    act(() => vi.advanceTimersByTime(2001));
    expect(hook.result.current).toBe(true);
  });
  it("reschedules deadlines beyond the maximum browser timer duration", () => {
    const response = { serverTime: DEMO_TIME, receivedAt: performance.now() };
    const hook = renderHook(() => useExpired("2026-12-11T15:00:00Z", response));
    act(() => vi.advanceTimersByTime(2147483647));
    expect(hook.result.current).toBe(false);
    act(() => vi.advanceTimersByTime(30 * 86400000 - 2147483647 + 1));
    expect(hook.result.current).toBe(true);
  });

  it("does not extend a deadline when revalidating or remounting", () => {
    const start = performance.now();
    const hook = renderHook(
      ({ elapsed }) =>
        useExpired("2026-11-11T15:00:02Z", {
          serverTime: elapsed ? "2026-11-11T15:00:01Z" : DEMO_TIME,
          receivedAt: start + elapsed,
        }),
      { initialProps: { elapsed: 0 } },
    );
    act(() => vi.advanceTimersByTime(1000));
    hook.rerender({ elapsed: 1000 });
    expect(hook.result.current).toBe(false);
    act(() => vi.advanceTimersByTime(1001));
    expect(hook.result.current).toBe(true);
    hook.unmount();
    const reopened = renderHook(() =>
      useExpired("2026-11-11T15:00:02Z", {
        serverTime: "2026-11-11T15:00:03Z",
        receivedAt: performance.now(),
      }),
    );
    expect(reopened.result.current).toBe(true);
  });

  it("clears authorization timers on unmount and replaces an obsolete timer", () => {
    const start = performance.now();
    const hook = renderHook(
      ({ expiresAt }) =>
        useExpired(expiresAt, { serverTime: DEMO_TIME, receivedAt: start }),
      { initialProps: { expiresAt: "2026-11-11T15:00:02Z" } },
    );
    expect(vi.getTimerCount()).toBe(1);
    hook.rerender({ expiresAt: "2026-11-11T15:00:04Z" });
    expect(vi.getTimerCount()).toBe(1);
    hook.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not invent a deadline for explicitly unlimited access", () => {
    const hook = renderHook(() =>
      useExpired(null, {
        serverTime: DEMO_TIME,
        receivedAt: performance.now(),
      }),
    );
    expect(hook.result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

function setup() {
  const { api } = createDemoApi("active-with-updates", 0);
  const clear = vi.fn();
  const setTemporary = vi.fn();
  const setInvitation = vi.fn();
  runtime.value = {
    mode: "real",
    api,
    session: {
      state: "authenticated",
      doctor: demoDoctor,
      expiresAt: "2026-11-11T23:00:00Z",
      csrfToken: "test-csrf",
      pendingInvitation: null,
    },
    sessionReady: true,
    sessionError: null,
    refreshSession: vi.fn(),
    clear,
    base: "/doctor",
    temporary: null,
    setTemporary,
    invitation: null,
    setInvitation,
    scenario: "active-with-updates",
    changeScenario: vi.fn(),
  };
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return { api, client, clear, setTemporary, setInvitation };
}

function updatePage(
  s: Schemas["Snapshot"],
  hasMore = false,
): Schemas["UpdatesPage"] {
  return {
    snapshotId: s.id,
    mode: "changes",
    throughCursor: s.updateHighWatermark,
    items: [],
    page: { hasMore, nextCursor: hasMore ? "page-two" : null },
    reviewToken: hasMore ? null : "review-test",
  };
}

describe("review lifecycle and logout", () => {
  it("keeps the portfolio search focused while requesting the next query", async () => {
    const { api, client } = setup();
    const rows = await api.patients({});
    api.patients = vi
      .fn()
      .mockResolvedValueOnce(rows)
      .mockImplementation(() => new Promise(() => {}));
    render(
      <QueryClientProvider client={client}>
        <PortfolioPage />
      </QueryClientProvider>,
    );
    const search = await screen.findByRole("searchbox", {
      name: "Buscar na sua carteira",
    });
    search.focus();
    fireEvent.change(search, { target: { value: "D" } });
    await waitFor(() => expect(api.patients).toHaveBeenCalledTimes(2));
    expect(
      screen.queryByRole("searchbox", { name: "Buscar na sua carteira" }),
    ).toBe(search);
    expect(document.activeElement).toBe(search);
  });

  it("enables review only after every page is served", async () => {
    const { api, client } = setup();
    const s = createFixture("active-with-updates");
    api.updates = vi
      .fn()
      .mockResolvedValueOnce(updatePage(s, true))
      .mockResolvedValueOnce(updatePage(s));
    render(
      <QueryClientProvider client={client}>
        <Review
          snapshot={s}
          context={{ patientId: s.patientId }}
          openEvidence={vi.fn()}
          onAccessError={vi.fn()}
          onRecorded={vi.fn()}
        />
      </QueryClientProvider>,
    );
    const review = screen.getByRole("button", {
      name: "Concluir revisão das novidades",
    });
    await screen.findByRole("button", { name: "Carregar próximas novidades" });
    expect(review.hasAttribute("disabled")).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Carregar próximas novidades" }),
    );
    await waitFor(() => expect(review.hasAttribute("disabled")).toBe(false));
  });

  it("aborts an in-flight review and ignores its late response after unmount", async () => {
    const { api, client } = setup();
    const s = createFixture();
    let finish!: (value: Schemas["ReviewResult"]) => void;
    api.updates = vi.fn().mockResolvedValue(updatePage(s));
    const mutation = vi.fn<typeof api.review>().mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    api.review = mutation;
    const onRecorded = vi.fn();
    const view = render(
      <QueryClientProvider client={client}>
        <Review
          snapshot={s}
          context={{ patientId: s.patientId }}
          openEvidence={vi.fn()}
          onAccessError={vi.fn()}
          onRecorded={onRecorded}
        />
      </QueryClientProvider>,
    );
    const review = screen.getByRole("button", {
      name: "Concluir revisão das novidades",
    });
    await waitFor(() => expect(review.hasAttribute("disabled")).toBe(false));
    fireEvent.click(review);
    await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
    const signal = mutation.mock.calls[0][3]?.signal;
    view.unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () =>
      finish({
        status: "recorded",
        lastReviewedCursor: s.updateHighWatermark,
        lastReviewedAt: DEMO_TIME,
        hasUpdatesAfterReview: true,
      }),
    );
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("hides clinical content and clears cached reads even if logout fails", async () => {
    const { api, client, setTemporary, setInvitation } = setup();
    api.logout = vi.fn().mockRejectedValue(new Error("upstream unavailable"));
    client.setQueryData(
      ["clinical", "real", "patient", "snapshot"],
      createFixture(),
    );
    const surface = (
      <QueryClientProvider client={client}>
        <Shell>
          <p>Conteúdo clínico sensível</p>
        </Shell>
      </QueryClientProvider>
    );
    const view = render(surface);
    expect(screen.getByText("Conteúdo clínico sensível")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    await screen.findByText("Não foi possível confirmar a saída no serviço");
    expect(screen.queryByText("Conteúdo clínico sensível")).toBeNull();
    expect(client.getQueriesData({ queryKey: ["clinical"] })).toEqual([]);
    expect(setTemporary).toHaveBeenCalledWith(null);
    expect(setInvitation).toHaveBeenCalledWith(null);
    const prior = runtime.value as Record<string, unknown>;
    runtime.value = { ...prior, session: undefined };
    view.rerender(
      <QueryClientProvider client={client}>
        <Shell>
          <p>Conteúdo clínico sensível</p>
        </Shell>
      </QueryClientProvider>,
    );
    runtime.value = prior;
    view.rerender(
      <QueryClientProvider client={client}>
        <Shell>
          <p>Conteúdo clínico sensível</p>
        </Shell>
      </QueryClientProvider>,
    );
    expect(screen.queryByText("Conteúdo clínico sensível")).toBeNull();
    expect(
      screen.getByText("Não foi possível confirmar a saída no serviço"),
    ).toBeTruthy();
  });
});
