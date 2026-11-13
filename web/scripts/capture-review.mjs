import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const baseURL = process.argv[2] ?? process.env.BASE_URL ?? "http://127.0.0.1:3000";
const directory = new URL("../../.impeccable/review/", import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function controlGeometry(locator, viewport) {
  if (!(await locator.isVisible())) return { visible: false, inViewport: false, unobstructed: false };
  const box = await locator.boundingBox();
  const inViewport = !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height;
  const unobstructed = inViewport && await locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return !!top && element.contains(top);
  });
  return { visible: true, inViewport, unobstructed, box };
}

try {
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 1000 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const capture = async (state) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await settle(page);
      const filename = `ux-${state}-${name}.png`;
      await page.screenshot({ path: fileURLToPath(new URL(filename, directory)), fullPage: state !== "evidence", animations: "disabled" });
      const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const geometry = await page.evaluate(() => ({ viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight }));
      const controls = state === "portfolio" ? {} : state === "evidence"
        ? { close: await controlGeometry(page.getByRole("button", { name: "Fechar evidência" }), viewport) }
        : {
          notes: await controlGeometry(page.getByRole("button", { name: "Anotar", exact: true }), viewport),
          print: await controlGeometry(page.getByRole("button", { name: "Imprimir sumário autorizado" }), viewport),
          review: await controlGeometry(page.getByRole("button", { name: "Concluir revisão das novidades" }), viewport),
        };
      const result = {
        state, viewport: name, filename, url: page.url(), ...geometry, controls,
        violations: scan.violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })),
        pageErrors: [...pageErrors],
      };
      results.push(result);
      console.log(JSON.stringify({ state, viewport: name, filename, overflow: geometry.documentWidth > viewport.width, violations: result.violations.length, controls }));
      return result;
    };

    await page.goto(new URL("/demo/doctor", baseURL).href);
    await expect(page.getByRole("heading", { name: "Seus pacientes", exact: true })).toBeVisible();
    await capture("portfolio");
    await page.getByRole("button", { name: /Daniel Vaz/ }).click();
    await expect(page.getByRole("heading", { name: "Daniel Vaz", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Concluir revisão das novidades" })).toBeEnabled();
    const patient = await capture("patient");

    await page.getByRole("button", { name: "Anotar", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Notas do médico" })).toBeFocused();
    patient.notesEditor = await controlGeometry(page.getByRole("textbox", { name: "Notas do médico" }), viewport);
    await page.locator("#consultation-notes").evaluate((element) => { element.open = false; });
    await page.evaluate(() => {
      window.__reviewPrintCalled = false;
      window.print = () => { window.__reviewPrintCalled = true; };
      window.scrollTo(0, 0);
    });
    await page.getByRole("button", { name: "Imprimir sumário autorizado" }).click();
    await expect.poll(() => page.evaluate(() => window.__reviewPrintCalled)).toBe(true);
    patient.printCalled = await page.evaluate(() => window.__reviewPrintCalled);
    await page.emulateMedia({ media: "print" });
    patient.printContentVisible = await page.getByRole("heading", { name: "Daniel Vaz", exact: true }).isVisible();
    patient.printControlsHidden = !(await page.getByRole("button", { name: "Concluir revisão das novidades" }).isVisible());
    await page.emulateMedia({ media: "screen" });

    await page.getByRole("button", { name: /^(?=.*Ferritina Sérica)(?=.*22 ng\/mL)(?=.*18\/10\/2025)/ }).click();
    await expect(page.getByRole("dialog", { name: "Ferritina Sérica" })).toBeVisible();
    await capture("evidence");
    await page.keyboard.press("Escape");
    await page.getByRole("tab", { name: "Evolução", exact: true }).click();
    await page.getByRole("combobox", { name: "Exame", exact: true }).selectOption("ferritina");
    await expect(page.getByRole("table")).toBeVisible();
    await expect.poll(() => page.locator(".recharts-wrapper").first().evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(200);
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    await capture("evolution");
    await page.getByRole("tab", { name: "Relações", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Lista de relações" })).toBeVisible();
    await expect.poll(() => page.locator(".react-flow").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(300);
    await expect.poll(() => page.locator(".react-flow__node").first().evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(170);
    await capture("graph");
    await context.close();
  }
} finally {
  await writeFile(new URL("ux-review-results.json", directory), JSON.stringify({ baseURL, capturedAt: new Date().toISOString(), results }, null, 2));
  await browser.close();
}

const problems = results.filter((result) => result.violations.length || result.documentWidth > result.viewportWidth || result.pageErrors.length || Object.values(result.controls).some((control) => !control.inViewport || !control.unobstructed) || (result.notesEditor && !result.notesEditor.unobstructed) || result.printCalled === false || result.printContentVisible === false || result.printControlsHidden === false);
console.log(`Captured ${results.length} states. ${problems.length} states require review. Details: .impeccable/review/ux-review-results.json`);
if (problems.length) process.exitCode = 1;
