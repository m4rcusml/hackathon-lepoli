export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(errorMessage(code));
    this.name = "ApiError";
  }
}
export function errorMessage(code: string): string {
  return (
    (
      {
        UNAUTHENTICATED: "Sua sessão terminou. Identifique-se novamente.",
        ACCESS_REVOKED:
          "O paciente encerrou o compartilhamento. Solicite uma nova autorização.",
        ACCESS_EXPIRED:
          "O período de compartilhamento terminou. Solicite uma nova autorização.",
        ACCESS_CHANGED:
          "As permissões mudaram. Carregue novamente os dados autorizados.",
        INVITATION_EXPIRED:
          "Este convite expirou. Peça um novo link ao paciente.",
        INVITATION_INVALID:
          "Convite inválido. Confira o link compartilhado pelo paciente.",
        INVALID_RESPONSE:
          "A resposta recebida não é compatível com a integração. Tente novamente.",
        SNAPSHOT_TOO_LARGE:
          "O conjunto excede o limite da integração. É necessário ajustar a cobertura no backend.",
        ORIGINAL_UNAVAILABLE:
          "O arquivo original não está disponível. Os dados estruturados continuam acessíveis.",
        UPSTREAM_NOT_CONFIGURED:
          "A integração ainda não foi configurada neste ambiente.",
        SERVICE_UNAVAILABLE:
          "Não foi possível confirmar o acesso com o serviço. Tente novamente.",
        REQUEST_PENDING: "O acompanhamento aguarda a confirmação do paciente.",
      } as Record<string, string>
    )[code] ?? "Não foi possível concluir a solicitação. Tente novamente."
  );
}
export const isAccessError = (e: unknown) =>
  e instanceof ApiError && [401, 403, 409, 410].includes(e.status);
