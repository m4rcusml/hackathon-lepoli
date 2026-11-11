export function date(value: string | null | undefined): string {
  if (!value) return "Data não informada";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
export function number(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(
    value,
  );
}
export const basisLabels = {
  recorded_fact: "Fato registrado",
  temporal_association: "Associação temporal",
  suggested_hypothesis: "Hipótese do sistema",
};
export const scopeLabels = {
  read_clinical_context: "Contexto clínico",
  read_exams: "Exames e laudos",
  read_wearables: "Wearable",
  read_alerts: "Alertas",
  read_graphrag_briefing: "Síntese e achados",
};
export const sectionMessage = (state: string) =>
  ({
    empty: "Sem registros disponíveis neste conjunto.",
    not_shared: "Não autorizado pelo paciente.",
    unavailable: "Informação indisponível. Tente atualizar o conjunto.",
  })[state] ?? "";
