import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const patientUrl = "/demo/doctor/patients/usr-dan-2026";

async function control(page: Page, action: string, scenario?: string) {
  const previous = action === "scenario" ? await page.getByRole("main").elementHandle() : null;
  await page.evaluate(({ action, scenario }) => {
    window.dispatchEvent(new CustomEvent("rivio:scenario", { detail: { action, scenario } }));
  }, { action, scenario });
  if (previous) {
    await expect.poll(() => previous.evaluate((element) => element.isConnected)).toBe(false);
    await expect(page.getByRole("main")).not.toHaveText("Preparando seu espaço…");
  }
}

async function chooseScenario(page: Page, name: string) {
  await control(page, "scenario", name);
}

async function openPatient(page: Page) {
  await page.goto("/demo/doctor");
  await expect(
    page.getByRole("heading", { name: "Seus pacientes", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Daniel Vaz/ }).click();
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
}

async function expectAccessible(page: Page) {
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    scan.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      elements: nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

test("entrada, carteira, citação e histórico preservam a origem e o foco", async ({
  page,
}) => {
  const realApiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/doctor/"))
      realApiRequests.push(request.url());
  });
  await openPatient(page);
  const patientHeading = page.getByRole("heading", {
    name: "Daniel Vaz",
    exact: true,
  });
  await expect(patientHeading).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/demonstrativ[oa]|sintétic[oa]|fictíci[oa]/i);
  const citation = page.getByRole("button", {
    name: /^(?=.*Ferritina Sérica)(?=.*22 ng\/mL)(?=.*18\/10\/2025)/,
  });
  await citation.click();
  const inspector = page.getByRole("dialog", { name: "Ferritina Sérica" });
  await expect(inspector).toBeVisible();
  await expect(inspector.getByText("22", { exact: true })).toBeVisible();
  await expect(inspector.getByText("ng/mL", { exact: true })).toBeVisible();
  await expect(
    inspector.getByText("18/10/2025", { exact: true }),
  ).toBeVisible();
  await expect(
    inspector.getByText("11/11/2026, 11:30", { exact: true }),
  ).toBeVisible();
  await expect(
    inspector.getByText("Fleury Medicina e Saúde", { exact: true }),
  ).toBeVisible();
  await expect(
    inspector.getByText(
      "Original não disponível. Somente os dados estruturados foram recebidos.",
    ),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(inspector).not.toBeVisible();
  await expect(citation).toBeFocused();
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  const history = page.getByRole("tabpanel", {
    name: "Histórico",
    exact: true,
  });
  await history.getByLabel("De", { exact: true }).fill("2025-01-01");
  await history.getByLabel("Até", { exact: true }).fill("2025-12-31");
  await expect(
    history.getByRole("heading", { name: "Laudo laboratorial — 2025" }),
  ).toBeVisible();
  await expect(
    history.getByRole("heading", { name: "Laudo laboratorial — 2024" }),
  ).toHaveCount(0);
  await history
    .getByRole("button", {
      name: /^(?=.*Ferritina Sérica)(?=.*22 ng\/mL)(?=.*18\/10\/2025)/,
    })
    .click();
  await expect(
    page
      .getByRole("dialog", { name: "Ferritina Sérica" })
      .getByText("22", { exact: true }),
  ).toBeVisible();
  expect(realApiRequests).toEqual([]);
});

test("evolução usa valores e datas da evidência, sem sobrepor janelas incompatíveis", async ({
  page,
}) => {
  await page.goto(patientUrl);
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Evolução", exact: true }).click();
  const evolution = page.getByRole("tabpanel", {
    name: "Evolução",
    exact: true,
  });
  await evolution
    .getByRole("combobox", { name: "Exame", exact: true })
    .selectOption("ferritina");
  const table = evolution.getByRole("table", {
    name: "Ferritina Sérica: valores, fontes e evidências",
  });
  await expect(table.getByRole("row")).toHaveCount(3);
  const result = table.getByRole("row").filter({ hasText: "18/10/2025" });
  await expect
    .poll(async () =>
      evolution
        .locator(".recharts-wrapper")
        .first()
        .evaluate((e) => e.getBoundingClientRect().height),
    )
    .toBeGreaterThan(200);
  await expect(evolution.locator(".recharts-surface").first()).toBeVisible();
  await expect(
    result.getByRole("cell", { name: "22 ng/mL", exact: true }),
  ).toBeVisible();
  await result.getByRole("button", { name: /Ver evidência/ }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Ferritina Sérica" })
      .getByText("22", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar evidência" }).click();
  await evolution
    .getByRole("combobox", { name: "Sinal do wearable", exact: true })
    .selectOption("hrv");
  await expect(
    evolution.getByText(/As janelas não se sobrepõem: exames de/),
  ).toBeVisible();
  await expect(
    evolution.getByText(/início não informado; sem marcador na curva/),
  ).toBeVisible();
  await evolution
    .getByRole("combobox", { name: "Exame", exact: true })
    .selectOption("__hba1c_empty");
  await expect(
    evolution.getByRole("heading", {
      name: "Sem resultados disponíveis de HbA1c",
    }),
  ).toBeVisible();
});

test("carteira abre evolução em um clique e mantém anotação e revisão acessíveis", async ({ page }) => {
  await page.goto("/demo/doctor");
  await expect(page.getByRole("heading", { name: "Seus pacientes", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/demonstrativ[oa]|sintétic[oa]|fictíci[oa]/i);
  const patient = page.getByRole("article", { name: "Daniel Vaz", exact: true });
  await patient.getByRole("button", { name: "Evolução", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Evolução", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Evolução", exact: true }).getByRole("combobox", { name: "Exame", exact: true })).toBeVisible();
  const complete = page.getByRole("button", { name: "Concluir revisão das novidades", exact: true });
  await expect(complete).toBeVisible();
  await expect(complete).toBeInViewport();
  await page.getByRole("button", { name: "Anotar", exact: true }).click();
  const notes = page.getByRole("textbox", { name: "Notas do médico", exact: true });
  await expect(notes).toBeFocused();
  await expect(notes).toBeVisible();
  await notes.fill("Comparar com os registros anteriores.");
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  await expect(complete).toBeVisible();
  await expect(complete).toBeInViewport();
  await expect(notes).toHaveValue("Comparar com os registros anteriores.");
  await page.getByRole("button", { name: "Descartar rascunho", exact: true }).click();
});

test("relações têm lista equivalente e evidência navegável pelo teclado", async ({
  page,
}) => {
  await page.goto(patientUrl);
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  const summary = page.getByRole("tab", { name: "Resumo", exact: true });
  await summary.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Evolução", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Relações", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const graph = page.getByRole("tabpanel", { name: "Relações", exact: true });
  await expect
    .poll(async () =>
      graph
        .locator(".react-flow")
        .evaluate((e) => e.getBoundingClientRect().height),
    )
    .toBeGreaterThan(300);
  await expect(graph.locator(".react-flow__node").first()).toBeVisible();
  await expect(
    graph.getByRole("heading", { name: "Lista de relações" }),
  ).toBeVisible();
  await graph
    .getByRole("combobox", { name: "Tema", exact: true })
    .selectOption("node-ferritina");
  const relationList = graph.getByRole("list");
  await expect(relationList.getByRole("listitem")).toHaveCount(1);
  await expect(
    relationList.getByText("Fato registrado", { exact: true }),
  ).toBeVisible();
  const evidence = relationList.getByRole("button", {
    name: "Ferritina Sérica · 18/10/2025",
    exact: true,
  });
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByRole("dialog", { name: "Ferritina Sérica" })
      .getByText("22", { exact: true }),
  ).toBeVisible();
});

test("escopo só exames não expõe contexto, wearable, síntese ou relações proibidas", async ({
  page,
}) => {
  await page.goto(patientUrl);
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await chooseScenario(page, "restricted-exams");
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  const main = page.getByRole("main");
  await expect(
    main.getByText(/Não autorizado pelo paciente/).first(),
  ).toBeVisible();
  await expect(main.getByText(/Suplemento Vitamina D/)).toHaveCount(0);
  await expect(
    main.getByText(/Histórico familiar de dislipidemia e arritmia/),
  ).toHaveCount(0);
  await expect(
    main.getByText(/Wearable · leituras basais/),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Evolução", exact: true }).click();
  const evolution = page.getByRole("tabpanel", {
    name: "Evolução",
    exact: true,
  });
  await expect(
    evolution
      .getByRole("combobox", { name: "Sinal do wearable", exact: true })
      .getByRole("option"),
  ).toHaveCount(1);
  await page.getByRole("tab", { name: "Relações", exact: true }).click();
  await expect(main.getByText(/Suplemento Vitamina D/)).toHaveCount(0);
  await expect(main.getByText(/Uso relatado, início desconhecido/)).toHaveCount(
    0,
  );
  await page.getByRole("tab", { name: "Fontes", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Fontes", exact: true })
      .getByText(/Wearable ·/),
  ).toHaveCount(0);
});

test("revogação remove inspector, dados clínicos e prévias da carteira", async ({
  page,
}) => {
  await page.goto(patientUrl);
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: /^(?=.*Ferritina Sérica)(?=.*22 ng\/mL)(?=.*18\/10\/2025)/,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Ferritina Sérica" }),
  ).toBeVisible();
  // An external consent decision can arrive while the evidence modal is open.
  await control(page, "revoke");
  await expect(
    page.getByText(
      "O paciente encerrou o compartilhamento. Solicite uma nova autorização.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("main").getByText(/Ferritina Sérica/),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Voltar à carteira", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pendentes e encerrados", exact: true })
    .click();
  await expect(
    page.getByRole("article").getByText("Revogado", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main").getByText(/Daniel Vaz/)).toHaveCount(0);
  await expect(
    page.getByText("Identificação protegida", { exact: true }),
  ).toBeVisible();
});

test("última página habilita revisão e chegada concorrente continua como novidade", async ({
  page,
}) => {
  await page.goto(patientUrl);
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await chooseScenario(page, "active-with-updates");
  const review = page.getByRole("region", {
    name: "Desde sua última revisão",
    exact: true,
  });
  const complete = review.getByRole("button", {
    name: "Concluir revisão das novidades",
    exact: true,
  });
  await expect(
    review.getByRole("button", { name: "Carregar próximas novidades" }),
  ).toBeVisible();
  await expect(complete).toBeDisabled();
  await review
    .getByRole("button", { name: "Carregar próximas novidades" })
    .click();
  await expect(complete).toBeEnabled();
  await control(page, "arrive");
  await expect(
    page.getByText("Novas informações disponíveis", { exact: true }),
  ).toBeVisible();
  await complete.click();
  await expect(
    review.getByText(/Há informações posteriores que continuam novas/),
  ).toBeVisible();
  await page
    .getByRole("main")
    .getByRole("link", { name: "Minha carteira", exact: true })
    .click();
  await expect(page.getByText("1 novidade", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Daniel Vaz/ }).click();
  await expect(
    page
      .getByRole("region", { name: "Desde sua última revisão" })
      .getByRole("button", { name: "Concluir revisão das novidades" }),
  ).toBeEnabled();
});

test("atualizar contexto preserva filtros, aba, evidência selecionada e rascunho", async ({
  page,
}) => {
  await page.goto(patientUrl);
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Anotar", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Notas do médico", exact: true })
    .fill("Rascunho de teste em memória.");
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  const history = page.getByRole("tabpanel", {
    name: "Histórico",
    exact: true,
  });
  await history.getByLabel("De", { exact: true }).fill("2025-01-01");
  await history
    .getByRole("combobox", { name: "Fonte", exact: true })
    .selectOption("src-fleury");
  await page.getByRole("tab", { name: "Relações", exact: true }).click();
  const graph = page.getByRole("tabpanel", { name: "Relações", exact: true });
  await graph
    .getByRole("combobox", { name: "Tema", exact: true })
    .selectOption("node-ferritina");
  await page.getByRole("tab", { name: "Evolução", exact: true }).click();
  const evolution = page.getByRole("tabpanel", {
    name: "Evolução",
    exact: true,
  });
  await evolution
    .getByRole("combobox", { name: "Exame", exact: true })
    .selectOption("ferritina");
  await evolution.getByLabel("De", { exact: true }).fill("2025-01-01");
  await evolution
    .getByRole("button", {
      name: /Ver evidência de Ferritina Sérica em 18\/10\/2025/,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Ferritina Sérica" }),
  ).toBeVisible();
  await control(page, "arrive");
  await expect(
    page.getByText("Novas informações disponíveis", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Atualizar contexto",
      exact: true,
      includeHidden: true,
    })
    .dispatchEvent("click");
  await expect(
    page.getByText("Novas informações disponíveis", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "Ferritina Sérica" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("tab", { name: "Evolução", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    evolution.getByRole("combobox", { name: "Exame", exact: true }),
  ).toHaveValue("ferritina");
  await expect(evolution.getByLabel("De", { exact: true })).toHaveValue(
    "2025-01-01",
  );
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  await expect(
    history.getByRole("combobox", { name: "Fonte", exact: true }),
  ).toHaveValue("src-fleury");
  await expect(history.getByLabel("De", { exact: true })).toHaveValue(
    "2025-01-01",
  );
  await page.getByRole("tab", { name: "Relações", exact: true }).click();
  await expect(
    graph.getByRole("combobox", { name: "Tema", exact: true }),
  ).toHaveValue("node-ferritina");
  await page.getByRole("tab", { name: "Resumo", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Notas do médico", exact: true }),
  ).toHaveValue("Rascunho de teste em memória.");
  await page
    .getByRole("button", { name: "Descartar rascunho", exact: true })
    .click();
});

test("pedido de acompanhamento aguarda decisão externa e libera só o escopo aprovado", async ({
  page,
}) => {
  await page.goto("/demo/doctor/consultation");
  await expect(
    page.getByRole("heading", { name: "Abrir convite do paciente" }),
  ).toBeVisible();
  await chooseScenario(page, "pending-followup");
  await page
    .getByLabel("Link ou código de compartilhamento")
    .fill("demo-followup");
  await page
    .getByRole("button", { name: "Validar convite", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Convite para solicitar acompanhamento",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Abrir consulta temporária" }),
  ).toHaveCount(0);
  await page
    .getByRole("checkbox", { name: "Exames e laudos", exact: true })
    .check();
  await page
    .getByRole("combobox", { name: "Duração solicitada" })
    .selectOption("until_revoked");
  await page
    .getByRole("button", { name: "Solicitar confirmação ao paciente" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Aguardando confirmação do paciente" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Abrir paciente autorizado" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("main").getByText(/Daniel Vaz|Ferritina Sérica/),
  ).toHaveCount(0);
  await control(page, "approve");
  await expect(
    page.getByRole("heading", {
      name: "Acompanhamento confirmado pelo paciente",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Abrir paciente autorizado" }).click();
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText(/Suplemento Vitamina D/),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Evolução", exact: true }).click();
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("consulta temporária retira token da URL, não permite revisão e perde memória no reload", async ({
  page,
}) => {
  await page.goto("/demo/doctor/consultation/demo-consultation");
  await expect(page).toHaveURL(/\/demo\/doctor\/consultation$/);
  await expect(
    page.getByRole("heading", { name: "Consulta pontual disponível" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Abrir consulta temporária" }).click();
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Consulta temporária", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Concluir revisão das novidades" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Encerrar acesso", exact: true }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/demo-consultation|temporary-demo/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Receber compartilhamento" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Abrir consulta temporária" }),
  ).toHaveCount(0);
});

test("câmera negada mantém o recebimento por link funcional", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        throw new DOMException("Permission denied", "NotAllowedError");
      },
    });
  });
  await page.goto("/demo/doctor/consultation");
  await page.getByRole("button", { name: "Ler QR pela câmera" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Não foi possível usar a câmera",
  );
  await page.getByRole("button", { name: "Fechar câmera" }).click();
  await expect(page.getByRole("region", { name: "Leitor de QR" })).toHaveCount(
    0,
  );
  await page
    .getByLabel("Link ou código de compartilhamento")
    .fill("demo-followup");
  await page
    .getByRole("button", { name: "Validar convite", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Convite para solicitar acompanhamento",
    }),
  ).toBeVisible();
});

test("WCAG em carteira, paciente, evidência, evolução e relações no desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/demo/doctor/patients");
  await expect(
    page.getByRole("heading", { name: "Seus pacientes", exact: true }),
  ).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: /Daniel Vaz/ }).click();
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await expectAccessible(page);
  await page
    .getByRole("button", {
      name: /^(?=.*Ferritina Sérica)(?=.*22 ng\/mL)(?=.*18\/10\/2025)/,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Ferritina Sérica" }),
  ).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "Evolução", exact: true }).click();
  await expect(
    page
      .getByRole("tabpanel", { name: "Evolução", exact: true })
      .getByRole("table"),
  ).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("tab", { name: "Relações", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lista de relações" }),
  ).toBeVisible();
  await expectAccessible(page);
});

test("curvas e relações mantêm leitura e rolagem contida em 390px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(patientUrl);
  await page.getByRole("tab", { name: "Evolução", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Exame", exact: true })
    .selectOption("ferritina");
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect(
    await page
      .getByRole("table")
      .locator("..")
      .evaluate((e) => e.scrollWidth > e.clientWidth),
  ).toBe(true);
  await expectAccessible(page);
  await page.getByRole("tab", { name: "Relações", exact: true }).click();
  await expect(page.locator(".react-flow__node").first()).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".react-flow__node")
        .first()
        .evaluate((e) => e.getBoundingClientRect().width),
    )
    .toBeGreaterThan(170);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await expectAccessible(page);
});

test("WCAG e ausência de overflow da página em tela estreita", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo/doctor/patients");
  await expect(
    page.getByRole("heading", { name: "Seus pacientes", exact: true }),
  ).toBeVisible();
  await expectAccessible(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /Daniel Vaz/ }).click();
  await expect(
    page.getByRole("heading", { name: "Daniel Vaz", exact: true }),
  ).toBeVisible();
  await expectAccessible(page);
  await page
    .getByRole("button", {
      name: /^(?=.*Ferritina Sérica)(?=.*22 ng\/mL)(?=.*18\/10\/2025)/,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Ferritina Sérica" }),
  ).toBeVisible();
  await expectAccessible(page);
});
