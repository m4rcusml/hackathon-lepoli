import { describe, expect, it, vi } from "vitest";
import { authenticationUrl, createHttpApi } from "@/lib/api/http";
import { parseResponse } from "@/lib/api/validate";
import { createFixture, DEMO_TIME } from "@/lib/demo/fixture";

const envelope = (data: unknown) => ({
  meta: {
    requestId: "test-request",
    serverTime: DEMO_TIME,
    contractVersion: "0.1-draft",
  },
  data,
});
const json = (data: unknown) => Response.json(envelope(data));
const anonymous = {
  state: "anonymous",
  doctor: null,
  expiresAt: null,
  csrfToken: "csrf-test",
  pendingInvitation: null,
};
const ctx = { patientId: "usr-dan-2026" };

describe("provisional contract boundary", () => {
  it("validates a complete fixture and preserves civil dates", () => {
    const s = parseResponse("Snapshot", envelope(createFixture())).data;
    expect(
      s.evidence.find((item) => item.id === "ex-fer-2025")?.occurredOn,
    ).toBe("2025-10-18");
    expect(s.evidence.find((item) => item.id === "ex-fer-2025")?.value).toBe(
      22,
    );
  });

  it.each([
    {
      meta: {
        requestId: "r",
        serverTime: "yesterday",
        contractVersion: "0.1-draft",
      },
      data: anonymous,
    },
    { ...envelope(anonymous), unexpected: "field" },
    envelope({
      ...anonymous,
      doctor: { id: "d", displayName: "Doctor", professionalIdentifier: null },
    }),
  ])("rejects an invalid envelope or anonymous identity", (raw) => {
    expect(() => parseResponse("Session", raw)).toThrow();
  });

  it("rejects an inactive portfolio row carrying a clinical preview", () => {
    const patient = createFixture().patient;
    expect(() =>
      parseResponse(
        "PatientList",
        envelope({
          items: [
            {
              relationshipId: "r",
              accessStatus: "revoked",
              patient,
              lastClinicalEventAt: null,
              lastClinicalEventOn: null,
              lastReceivedAt: null,
              review: null,
              highlight: "Clinical detail",
            },
          ],
          page: { hasMore: false, nextCursor: null },
        }),
      ),
    ).toThrow();
  });

  it.each([
    "patient",
    "source",
    "document",
    "reference-version",
    "graph-endpoint",
    "duplicate-evidence",
  ] as const)("rejects broken %s closure", (defect) => {
    const s = createFixture();
    if (defect === "patient") s.patient.id = "another-patient";
    if (defect === "source") s.evidence[0].sourceId = "missing-source";
    if (defect === "document") s.evidence[0].documentId = "missing-document";
    if (defect === "reference-version")
      s.briefing.items[0].evidenceRefs[0].version = "missing-version";
    if (defect === "graph-endpoint") s.graph.edges[0].target = "missing-node";
    if (defect === "duplicate-evidence")
      s.evidence.push(structuredClone(s.evidence[0]));
    expect(() => parseResponse("Snapshot", envelope(s))).toThrow();
  });

  it("rejects a not-shared section with hidden items", () => {
    const s = createFixture();
    s.wearables.state = "not_shared";
    expect(() => parseResponse("Snapshot", envelope(s))).toThrow();
  });

  it("rejects evidence from an ungranted category", () => {
    const s = createFixture();
    s.access.scopes = ["read_exams"];
    expect(() => parseResponse("Snapshot", envelope(s))).toThrow();
  });

  it("rejects a temporary snapshot carrying a longitudinal review", () => {
    const s = createFixture();
    s.access.kind = "temporary";
    s.access.grantId = null;
    expect(() => parseResponse("Snapshot", envelope(s))).toThrow();
  });
});

describe("HTTP transport", () => {
  it("bootstraps CSRF and sends cookies, no-store and a token in the POST body only", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(anonymous))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const api = createHttpApi(fetcher);
    await api.session();
    await api.logout();
    const [url, options] = fetcher.mock.calls[1];
    expect(url).toBe("/api/doctor/v0/auth/logout");
    expect(options).toMatchObject({
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
    expect(new Headers(options?.headers).get("X-CSRF-Token")).toBe("csrf-test");
  });

  it("forwards cancellation and keeps a temporary context explicit", async () => {
    const controller = new AbortController();
    const s = createFixture();
    s.access.kind = "temporary";
    s.access.grantId = null;
    s.access.contextId = "temporary-test";
    s.review = null;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(json(s));
    const api = createHttpApi(fetcher);
    await api.snapshot(
      { ...ctx, temporaryAccessId: "temporary-test" },
      { signal: controller.signal },
    );
    expect(fetcher.mock.calls[0][0]).toContain(
      "temporaryAccessId=temporary-test",
    );
    expect(fetcher.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it.each([401, 403, 409])(
    "does not retry or fall back after HTTP %i",
    async (status) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json(
            {
              code: status === 401 ? "UNAUTHENTICATED" : "ACCESS_REVOKED",
              detail: "sensitive upstream text",
            },
            { status },
          ),
        );
      const api = createHttpApi(fetcher);
      await expect(api.snapshot(ctx)).rejects.toMatchObject({ status });
      expect(fetcher).toHaveBeenCalledTimes(1);
      await expect(api.snapshot(ctx)).rejects.not.toThrow(
        "sensitive upstream text",
      );
    },
  );

  it("rejects malformed successful responses instead of supplying demo data", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ data: { id: "invalid" } }));
    await expect(createHttpApi(fetcher).snapshot(ctx)).rejects.toMatchObject({
      status: 502,
      code: "INVALID_RESPONSE",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retains AbortError instead of turning cancellation into a service failure", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));
    await expect(
      createHttpApi(fetcher).session({ signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("maps network failure to a safe recoverable error", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("internal secret"));
    await expect(createHttpApi(fetcher).session()).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("forwards idempotency with the review body", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        json({
          status: "recorded",
          lastReviewedCursor: "cursor-1",
          lastReviewedAt: DEMO_TIME,
          hasUpdatesAfterReview: true,
        }),
      );
    await createHttpApi(fetcher).review(
      ctx,
      { snapshotId: "snapshot-1", reviewToken: "review-token" },
      "same-intention",
    );
    expect(
      new Headers(fetcher.mock.calls[0][1]?.headers).get("Idempotency-Key"),
    ).toBe("same-intention");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      snapshotId: "snapshot-1",
      reviewToken: "review-token",
    });
  });

  it("rejects HTML served as an original document", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("<script>unsafe</script>", {
          headers: { "Content-Type": "text/html" },
        }),
      );
    await expect(
      createHttpApi(fetcher).original(ctx, "document-1"),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/doctor\\evil",
    "/other",
    "/doctor?redirect=https://evil.example",
  ])("rejects an unsafe login return path %s", (target) => {
    expect(() => authenticationUrl(target)).toThrow();
  });
});
