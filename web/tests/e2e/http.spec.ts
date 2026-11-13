import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

// These checks validate the web against an HTTP test double, not the team's real backend.
const controlUrl = "http://127.0.0.1:4100/__test";
const patientPath = "/doctor/patients/patient-http";
test.describe.configure({ mode: "default" });

async function control(
  request: APIRequestContext,
  input: Record<string, unknown>,
) {
  const response = await request.post(controlUrl, { data: input });
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function login(page: Page) {
  await page.goto("/doctor");
  await page
    .getByRole("link", { name: /Identificar-me pelo serviço central/ })
    .click();
  await expect(page).toHaveURL(/\/doctor\/patients$/);
  await expect(
    page.getByRole("heading", { name: "Seus pacientes" }),
  ).toBeVisible();
}
async function openPatient(page: Page) {
  await page.getByRole("button", { name: /Paciente HTTP de teste/ }).click();
  await expect(page).toHaveURL(new RegExp(`${patientPath}$`));
  await expect(
    page.getByRole("heading", { name: "Paciente HTTP de teste", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Concluir revisão das novidades" }),
  ).toBeEnabled();
}
async function revalidate(page: Page) {
  // TanStack Query 5.107 subscribes on window; synthetic document events do not bubble by default.
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
}

test.beforeEach(async ({ request }) => {
  await control(request, { reset: true });
});

test("E01 · sessão HTTP, carteira, evidência e histórico usam o mesmo registro", async ({
  page,
}) => {
  await login(page);
  await openPatient(page);
  await page
    .getByRole("button", { name: /Ver evidência/ })
    .first()
    .click();
  const inspector = page.getByRole("dialog");
  await expect(inspector).toBeVisible();
  await expect(
    inspector.getByRole("heading", { name: "Ferritina Sérica", exact: true }),
  ).toBeVisible();
  await expect(inspector.getByText("22", { exact: true })).toBeVisible();
  await expect(inspector.getByText("ng/mL", { exact: true })).toBeVisible();
  await expect(
    inspector.getByText("18/10/2025", { exact: true }),
  ).toBeVisible();
  await expect(
    inspector.getByText("Original não disponível.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fechar evidência", exact: true })
    .click();
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Histórico", exact: true }),
  ).toContainText("Laudo laboratorial Fleury");
  await expect(
    page.getByText("Ambiente demonstrativo", { exact: true }),
  ).toHaveCount(0);
});

test("E02 · pedido pendente só abre o paciente após confirmação externa", async ({
  page,
  request,
}) => {
  await control(request, { grantStatus: "pending" });
  await login(page);
  await page
    .getByRole("button", { name: "Adicionar paciente", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Link ou código de compartilhamento" })
    .fill("http-followup");
  await page.getByRole("button", { name: "Validar convite" }).click();
  await expect(page.getByRole("checkbox").first()).toBeVisible();
  for (const checkbox of await page.getByRole("checkbox").all())
    await checkbox.check();
  await page.getByLabel("Duração solicitada").selectOption("until_revoked");
  await page
    .getByRole("button", { name: "Solicitar confirmação ao paciente" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Aguardando confirmação do paciente" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir paciente autorizado" }),
  ).toHaveCount(0);
  const denied = await page.request.get(
    "/api/doctor/v0/patients/patient-http/snapshot",
  );
  expect(denied.status()).toBe(403);
  await control(request, { decide: "approved" });
  await page.getByRole("button", { name: "Verificar confirmação" }).click();
  await page.getByRole("link", { name: "Abrir paciente autorizado" }).click();
  await expect(
    page.getByRole("heading", { name: "Paciente HTTP de teste", exact: true }),
  ).toBeVisible();
});

test("E05 · revisão persiste no serviço de teste e preserva uma chegada posterior", async ({
  page,
  request,
}) => {
  await login(page);
  await openPatient(page);
  await control(request, { arrive: true });
  await revalidate(page);
  await expect(
    page.getByText("Novas informações disponíveis", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Concluir revisão das novidades" })
    .click();
  await expect(
    page.getByText("Há informações posteriores que continuam novas.", {
      exact: false,
    }),
  ).toBeVisible();
  let backend = await (await request.get(controlUrl)).json();
  expect(backend.reviews["doctor-http-a"].cursor).toBe(1);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Identificação necessária",
      exact: true,
    }),
  ).toBeVisible();
  await login(page);
  await page.reload();
  await expect(page.getByText("1 novidade", { exact: true })).toBeVisible();
  await openPatient(page);
  await expect(
    page.getByText("Correção documental posterior ao conjunto anterior", {
      exact: true,
    }),
  ).toBeVisible();
  backend = await (await request.get(controlUrl)).json();
  expect(backend.reviews["doctor-http-a"].cursor).toBe(1);
});

test("E06 · revogar durante leitura remove contexto e inspector", async ({
  page,
  request,
}) => {
  await login(page);
  await openPatient(page);
  await page
    .getByRole("button", { name: /Ver evidência/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await control(request, { grantStatus: "revoked" });
  await revalidate(page);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "O paciente encerrou o compartilhamento",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Paciente HTTP de teste", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Ferritina Sérica", exact: true }),
  ).toHaveCount(0);
});

for (const failure of [
  { status: 401, code: "UNAUTHENTICATED", text: "Sua sessão terminou." },
  {
    status: 403,
    code: "ACCESS_REVOKED",
    text: "O paciente encerrou o compartilhamento.",
  },
  {
    status: 503,
    code: "SERVICE_UNAVAILABLE",
    text: "Não foi possível confirmar o acesso com o serviço.",
  },
]) {
  test(`E07 · HTTP ${failure.status} bloqueia contexto sem substituir por demo`, async ({
    page,
    request,
  }) => {
    await login(page);
    await control(request, { failure: { ...failure, path: "/snapshot" } });
    await page.getByRole("button", { name: /Paciente HTTP de teste/ }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText(failure.text);
    await expect(
      page.getByRole("heading", {
        name: "Paciente HTTP de teste",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(page.getByText("Daniel Vaz", { exact: true })).toHaveCount(0);
    await expect(
      page.getByText("Ambiente demonstrativo", { exact: true }),
    ).toHaveCount(0);
    expect(page.url()).toContain("/doctor/patients/patient-http");
  });
}

test("E07 · payload HTTP inválido é erro de integração sem dados substitutos", async ({
  page,
  request,
}) => {
  await login(page);
  await control(request, { invalidSnapshot: true });
  await page.getByRole("button", { name: /Paciente HTTP de teste/ }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "A resposta recebida não é compatível com a integração.",
  );
  await expect(page.getByText("Daniel Vaz", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("E09 · resposta clínica atrasada não reaparece depois de sair", async ({
  page,
  request,
}) => {
  await login(page);
  await control(request, { snapshotDelayMs: 1500 });
  await page.getByRole("button", { name: /Paciente HTTP de teste/ }).click();
  await expect
    .poll(
      async () =>
        (await (await request.get(controlUrl)).json()).pendingSnapshots,
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Identificação necessária",
      exact: true,
    }),
  ).toBeVisible();
  await expect
    .poll(
      async () =>
        (await (await request.get(controlUrl)).json()).pendingSnapshots,
    )
    .toBe(0);
  await expect(
    page.getByRole("heading", { name: "Paciente HTTP de teste", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Ferritina Sérica", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Concluir revisão das novidades" }),
  ).toHaveCount(0);
});
