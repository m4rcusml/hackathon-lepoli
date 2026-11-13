# Contrato backend médico — TEMPORÁRIO, somente para planejamento

> **RASCUNHO TEMPORÁRIO · `0.1-draft` · NÃO APROVADO PELO BACKEND.**
>
> Este contrato existe exclusivamente para planejarmos **a web do médico e seu contrato de integração**, produzirmos fixtures e desenvolvermos a interface sem bloquear na definição do backend. Nenhuma rota aqui é afirmada como existente. O documento não atribui ao backend obrigação de implementar estas escolhas, não substitui sua arquitetura e não confirma disponibilidade de autenticação, consentimento ou dados reais. O responsável pelo backend deverá validar ou substituir a proposta. Mudanças acordadas serão absorvidas na fronteira de integração da web.

Especificação legível por máquina: [doctor-api.v0.1.openapi.json](contracts/doctor-api.v0.1.openapi.json). Experiência planejada: [doctor-web-development-plan.md](../doctor-web-development-plan.md). Escopo do produto: [PRODUCT.md](../PRODUCT.md).

## 1. Objetivo e limites

A proposta cobre somente o que a experiência médica precisa consumir: identidade do profissional, carteira autorizada, acesso pontual, vínculo contínuo, contexto clínico rastreável, novidades e revisão. Backend recebe/estrutura os dados e aplica autorização; mobile confirma o compartilhamento pelo paciente; web apresenta e explora esse conjunto.

A web não implementará autenticação clínica própria, banco de consentimentos, extração de laudos, cálculo de anomalias, GraphRAG, HNSW, MCP ou escrita de resultados clínicos. As únicas mutações médicas propostas são encerrar sessões/contextos, solicitar vínculo e registrar o ponto de revisão do próprio médico. Prescrição, pedido de exame, chat privado do paciente e edição de prontuário estão fora desta versão do contrato.

**Precedência provisória:** regras de produto confirmadas pelo usuário → contrato efetivamente acordado com o backend → este rascunho → fixture. Conflitos entre este texto e o OpenAPI são defeitos a corrigir, nunca motivo para o frontend decidir silenciosamente uma política de autorização.

## 2. Convenções temporárias de transporte

| Decisão para planejamento | Proposta |
| --- | --- |
| Base visível ao navegador | `/api/doctor/v0`, na mesma origem da web. |
| Implantação | Reverse proxy para o backend ou ponte de transporte no Next, se necessária. A ponte não cria identidades, grants, diagnósticos ou decisões clínicas. |
| Sessão médica | Cookie do backend `doctor_session`, `HttpOnly`, `Secure` em HTTPS e `SameSite=Lax`; nome e política finais a ratificar. |
| Sessão temporária | Cookie separado `consultation_session`, ligado a contextos opacos. Não concede identidade médica ou carteira. |
| Bootstrap e CSRF | `GET /session` responde mesmo anônimo e entrega `csrfToken`; mutações exigem `X-CSRF-Token` mais validação de origem pelo backend. Não guardar esse token em logs ou storage persistente. |
| Login | Backend controla redirecionamento, callback e provedor. A web só inicia `/auth/start`; não escolhemos senha, OAuth ou fornecedor neste rascunho. Se houver convite, `loginContextId` faz o handoff no servidor. |
| Cache | Respostas clínicas e de autorização: `Cache-Control: no-store, private`. Nenhum token/dado clínico em localStorage, persistência de query ou cache público/service worker. |
| Resposta JSON | `{ "meta": { "requestId", "serverTime", "contractVersion": "0.1-draft" }, "data": ... }`. |
| Erro | `application/problem+json`: `type`, `title`, `status`, `code`, `detail`, `requestId`, `retryAfterSeconds`. Sem conteúdo clínico ou token no erro. |
| Identidade | `doctorId` é derivado da sessão. Parâmetros `patientId`, `grantId` ou `temporaryAccessId` são identificadores e nunca credenciais de acesso. |
| Concorrência | Identificadores de revisão e cursores são opacos. A web só testa igualdade quando especificado; nunca ordena ou incrementa esses valores. |

Em uma ponte Next, base upstream/configuração sensível ficam no servidor. Preservar métodos, status, cookies, headers necessários e streams; allowlist das operações deste contrato, sem proxy aberto para URLs escolhidas pelo usuário. Cookie de backend com `Domain` incompatível precisa de alinhamento explícito de implantação; não improvisar reescrita de autenticação no cliente.

`returnTo` de login aceita somente caminhos relativos permitidos sob `/doctor`; rejeitar URL absoluta, `//host` ou destino externo. Links de convite entram na web por rotas existentes, mas o token só é enviado à API em corpo de `POST /sharing/resolve`. A página de entrada não deve carregar terceiros e usa política de referrer restritiva. Após a troca, remover o token da barra/histórico navegável usando rota sem token; não o registrar em logs de aplicação/analytics.

## 3. Três ciclos independentes

| Recurso | Autoridade e identidade | Expiração e resultado |
| --- | --- | --- |
| Sessão do médico | Backend autentica o profissional. | `Session.expiresAt`; perder login exige autenticar novamente e revalidar grants. |
| Convite/acesso pontual | Paciente compartilha um token; backend valida e emite contexto temporário. | Convite de consulta preserva o TTL máximo original de duas horas. Recarregar/resolver novamente não renova esse TTL. |
| Vínculo contínuo | Paciente aprova aquele médico, escopos e duração. | `Grant.expiresAt` próprio, revogável. `null` somente se o paciente aprovou explicitamente acesso sem data final. Nenhuma duração padrão está definida aqui. |

O backend distingue convite `consultation`, que pode gerar acesso clínico pontual, de convite `followup`, que pode servir somente para solicitar acompanhamento. Um convite sem leitura clínica retorna `temporaryAccess: null`.

### 3.1 Acesso pontual

1. `GET /session` prepara o contexto anônimo/CSRF.
2. `POST /sharing/resolve { token }` valida assinatura/registro, expiração e revogação no backend.
3. Resposta inclui convite e, se autorizado, `AccessContext.kind = temporary`. A prova fica no cookie HttpOnly; `temporaryAccessId`/`contextId` fica **somente em memória daquela aba**, sem URL nem sessionStorage/localStorage.
4. Leituras de snapshot/acesso/documento incluem `temporaryAccessId`. Ele só funciona junto ao cookie que o possui. Contexto explícito prevalece: não buscar um grant mais permissivo silenciosamente se esse acesso temporário for negado.
5. Consulta pontual não permite carteira, novidades por médico ou registrar revisão.
6. Botão **Encerrar acesso** chama o POST de fechamento e limpa estado local. Ao fechar aba, limpar memória e parar leituras. Não depender de `beforeunload` para fazer segurança.

**RN08 pendente de ratificação:** cookie compartilhado/restaurável e ausência de sinal confiável de fechamento de aba não garantem revogação global ao fechar a aba. A proposta encerra o contexto local, oferece fechamento explícito no servidor e respeita o TTL original. Nova abertura do token original pode gerar outra consulta enquanto o convite permanecer válido, conforme política final do backend. Não afirmar que fechar aba revoga o token para todos. Recarregar a rota sem token perde o contexto local e pede reabertura do link; nenhum contexto é recuperado por storage.

### 3.2 Inclusão e acompanhamento contínuo

1. Médico resolve o convite e recebe `loginContextId` quando acompanhamento pode ser solicitado. Se precisar se identificar, envia esse identificador opaco a `/auth/start`; backend liga o handoff ao cookie e ao state do login. Após callback, `GET /session.pendingInvitation` devolve os metadados do mesmo convite para continuar o pedido. Token bruto e `temporaryAccessId` não são persistidos nem carregados no redirecionamento; acesso clínico temporário não é restaurado automaticamente. Handoff expirado ou substituído exige novo convite, sem trocar silenciosamente o paciente.
2. Médico identificado solicita acompanhamento com categorias e duração explícitas.
3. Backend cria `FollowupRequest.pending`, ligado à identidade da sessão e ao convite já validado. Não recebe `doctorId` ou `patientId` arbitrários no corpo.
4. Mobile/paciente mostra identidade do médico, categorias pedidas e duração. Aprovar/rejeitar é operação externa à web médica e não foi definida como endpoint desta API.
5. Web consulta a solicitação até estado `approved`, `rejected`, `expired` ou `cancelled`.
6. Somente aprovação cria/ativa `Grant` e permite conteúdo contínuo na carteira. Convite pendente nunca libera conteúdo clínico contínuo.
7. Rejeitado: informar decisão e permitir retorno à carteira. Expirado/cancelado: pedir novo convite, sem autoaprovação ou repetição infinita.

Ampliar escopos ou duração também requer confirmação do paciente. No rascunho, usar uma nova solicitação autorizada pelo fluxo externo; não há endpoint médico que edite/aprove o próprio grant.

## 4. Operações propostas e telas consumidoras

Todos os caminhos abaixo são relativos à base temporária. Só a listagem/carteira, pedidos e revisão exigem identidade médica; leituras clínicas aceitam grant contínuo ou contexto pontual válido, conforme operação.

| Método e caminho | Entrada principal | Saída | Web que consome |
| --- | --- | --- | --- |
| `GET /session` | Cookies | `Session` anônima ou autenticada + CSRF e `pendingInvitation` | Entrada, layout, bootstrap e retomada do convite após login. |
| `GET /auth/start` | `returnTo` relativo permitido, `loginContextId` opcional | `302` controlado pelo backend | Identificação do médico e handoff do convite. |
| `POST /auth/logout` | CSRF | `204`, sessão invalidada | Sair e limpar estado. |
| `GET /patients` | `q`, `filter`, `cursor`, `limit` | `PatientList` | Carteira. |
| `POST /sharing/resolve` | Token no corpo + CSRF | `SharingResolution` | QR/link, entrada pontual ou pedido de vínculo. |
| `POST /follow-up-requests` | Convite, escopos, duração + CSRF/idempotência | `201 FollowupRequest` | Solicitar acompanhamento. |
| `GET /follow-up-requests/{requestId}` | Identidade da sessão | `FollowupRequest` atualizado | Aguardando confirmação/resultado. |
| `GET /patients/{patientId}/access` | Contexto e revisões conhecidas | `AccessStatus` | Revalidação e aviso de novos dados. |
| `GET /patients/{patientId}/snapshot` | Contexto autorizado | `Snapshot` consistente | Resumo, histórico, fontes, evolução, relações e inspector. |
| `GET /patients/{patientId}/updates` | `snapshotId`, cursor de página | `UpdatesPage` | Novidades/revisão do médico. |
| `POST /patients/{patientId}/reviews` | `snapshotId`, `reviewToken` + CSRF/idempotência | `ReviewResult` | Concluir revisão. |
| `GET /patients/{patientId}/documents/{documentId}/content` | Contexto autorizado | Stream PDF/JPEG/PNG | Original no inspector. |
| `POST /temporary-access/{temporaryAccessId}/close` | Contexto/cookie + CSRF | `204` idempotente | Botão Encerrar acesso pontual. |

Filtro da carteira: `active` por padrão, `with_updates` ou `inactive`. `limit` padrão 25, máximo 100. Busca e paginação são restritas à carteira da sessão. Cursores ficam ligados aos filtros; mudar filtro reinicia paginação. A ordenação deve ser estável e definida pelo backend; desempate por identificador. Não retornar quantidade ou destaque derivado de dados negados.

Linhas `pending`, `expired`, `revoked` ou `rejected` retornam somente identificador do vínculo e status; `patient`, datas clínicas, `review` e `highlight` ficam `null`. A decisão de preservar um rótulo pessoal mínimo após revogação permanece aberta; a fixture adota a opção conservadora, sem perfil clínico ou nome nessas linhas. `lastClinicalEventOn` preserva uma data civil conhecida quando não há instante; `lastClinicalEventAt` fica `null` nesse caso. Não fabricar meia-noite a partir de data de exame.

## 5. Escopos provisórios e projeções autorizadas

| Escopo | Categoria habilitada |
| --- | --- |
| `read_clinical_context` | Condições, sintomas, medicações e histórico familiar compartilhados. É novo e exige aprovação explícita. |
| `read_exams` | Medições laboratoriais, laudos e originais autorizados. |
| `read_wearables` | Leituras, períodos cobertos e episódios do dispositivo. |
| `read_alerts` | Alertas compartilhados. Alertas derivados também exigem acesso às origens necessárias. |
| `read_graphrag_briefing` | Síntese/achados derivados das categorias já autorizadas; não concede acesso adicional às origens. |

Os três escopos existentes no mobile são preservados por nome. Nenhum deles implica `read_clinical_context`, `read_alerts` ou conversas privadas. `read_chat_notes` não integra v0.1. O toggle atual de alertas exige mapeamento novo; o de notas/conversas permanece fora da API médica nesta proposta. Isso precisa ser negociado com mobile/backend, não ativado automaticamente na web.

Backend filtra **cada projeção**: carteira, contagens de novidades, perfil/contexto, sources, evidence, timeline, briefing, nós, arestas e citações. Uma síntese só pode incluir afirmações sustentadas por fontes permitidas naquele contexto. Ocultar um nó na tela não resolve autorização se o texto ou a contagem ainda revelar seu conteúdo.

Se o backend não conseguir regenerar uma síntese/gráfico de relações com as fontes autorizadas, retorna `unavailable` para aquela projeção. Dados básicos autorizados continuam disponíveis. Não retornar texto não autorizado como fallback e não usar o cenário demo para preencher essa falta.

## 6. Snapshot e evidências

`Snapshot` retorna uma revisão estável do conjunto autorizado:

- Identidade: `id`, `patientId`, `createdAt`, `dataRevision`, `accessRevision`, `updateHighWatermark`.
- Autorização e contexto: `access`, `patient`, `coverage` e `review` (este último é `null` no acesso temporário).
- Registros: `sources`, `evidence`, `clinicalContext`, `exams`, `wearables`, `alerts`, `documents`, `timeline`.
- Projeções: `briefing` e `graph`, independentes da disponibilidade das medições básicas.

### 6.1 Estados de cada seção

Seções de itens usam `{ state, items, reasonCode }`:

| Estado | Significado | Dados |
| --- | --- | --- |
| `available` | Autorizado, há itens utilizáveis. | `items` não vazio. |
| `empty` | Autorizado, sem registros no recorte. | `items: []`. |
| `not_shared` | Categoria não autorizada. | `items: []`; sem contagem/metadado de conteúdo oculto. |
| `unavailable` | Autorizado, serviço/fonte/projeção indisponível. | `items: []`, código recuperável sem conteúdo restrito. |

Grafo usa o mesmo estado com `nodes`/`edges` no lugar de `items`; estado não disponível exige arrays vazios. A cobertura informa `from`, `to` e `truncated`; recortes são visíveis e nunca sugerem histórico completo quando não são. Para o volume inicial, o backend pode devolver um único snapshot com os dados do cenário. Escala, recortes históricos adicionais e limites finais precisam de alinhamento, sem descarte silencioso.

### 6.2 Referências e datas

`EvidenceRef = { id, version }` é usado nos achados, séries, eventos, nós e arestas. A referência deve resolver exatamente uma versão em `snapshot.evidence`. Referência ausente é erro de integração: desabilitar a navegação daquele achado e informar indisponibilidade; não buscar outro paciente ou uma versão qualquer.

Cada evidência informa fonte e, quando houver, documento, `occurredOn` (data civil), `occurredAt` (instante com fuso), `ingestedAt` (recebimento), valor/unidade/referência e origem do registro: extraído, relato do paciente, registro de profissional ou derivado. Datas desconhecidas permanecem `null`. Não criar horário a partir de uma data de coleta.

**Fechamento de referências no v0.1:** todos os `EvidenceRef` do snapshot e das páginas de novidades presas a ele devem resolver em `snapshot.evidence`, inclusive registros fora do recorte exibido nas curvas. Fontes/documentos necessários também precisam estar presentes e autorizados. Filtros de período iniciais são locais sobre a cobertura devolvida; não existe nesta proposta uma chamada para buscar qualquer período histórico arbitrário. `truncated` nunca autoriza omitir a origem de uma citação. Se o limite do snapshot impedir esse fechamento, retornar `422 SNAPSHOT_TOO_LARGE` explicitamente, sem entregar um conjunto incompleto nem habilitar sua revisão. A web mostra a limitação; não promete acesso a histórico fora da cobertura recebida.

O backend fornece unidades canônicas e mantém a unidade/referência efetiva de cada medição. A web não unifica medidas incompatíveis por aproximação. Correções usam nova `version` e `supersedes`; o feed registra a mudança sem criar exame independente.

`sources` contém apenas fontes autorizadas com estado de atualização, última sincronização, última data de evento e cobertura. Fonte sincronizada hoje pode conter exame de 2025. O relógio da web não muda a data clínica. Falta de uma métrica não vira zero.

### 6.3 Projeções e originais

O briefing contém achados com `basis`: `recorded_fact`, `temporal_association` ou `suggested_hypothesis`, mais referências de evidência. A web apresenta a distinção. Backend não retorna causa comprovada onde só há associação.

O grafo retorna entidades/relações e referências, **sem posições, dimensões ou layout**. A organização visual fica na web. Histórico familiar é um tipo de evidência/contexto próprio; não vira diagnóstico ativo.

O original é acessado por stream same-origin com autorização em **cada requisição**. **`documentId` identifica um arquivo/versão binária imutável**: substituir o arquivo cria um novo ID; o stream nunca passa a devolver outro binário sob o ID citado pelo snapshot. Correção de metadados pode gerar nova versão da evidência sem substituir o arquivo. `originalAvailable: false` evita botão enganoso; mesmo `true` deve tratar `404 ORIGINAL_UNAVAILABLE`. Não há URL pública ou assinatura duradoura armazenada no snapshot. Fechar/revogar acesso remove o visualizador e suas referências locais; um arquivo já baixado é uma cópia externa à sessão e não pode ser recolhido por este contrato.

## 7. Novidades, paginação e revisão sem perder concorrência

O backend mantém um fluxo de mudanças por médico/vínculo/versão de escopos. `dataRevision`, `snapshotId`, cursores e `reviewToken` são opacos; só o backend sabe ordená-los e validá-los.

1. Web obtém o snapshot **S**, cujo `updateHighWatermark` fixa o limite superior de mudanças daquela leitura.
2. `GET /updates?snapshotId=S` começa no cursor de revisão daquele médico. Páginas subsequentes usam `page.nextCursor` e continuam presas a **S**; novas entradas não deslocam as páginas abertas.
3. Itens são agrupados por documento/evento. Uma importação com dez biomarcadores conta como um grupo. Primeira inclusão usa `mode: initial_review`, com histórico disponível e sem notificar cada item antigo.
4. `reviewToken` só aparece na última página (`hasMore: false`). Ele vincula médico, grant, scopeVersion, snapshot e limite superior servido. Web só habilita concluir após carregar as páginas necessárias do conjunto; pode oferecer carregar mais até completar.
5. A ação explícita envia `{ snapshotId: S, reviewToken }`. Backend revalida identidade, grant e escopos e avança a revisão até aquele limite, nunca até a hora atual.
6. Dados que chegaram depois de **S** continuam novos (`hasUpdatesAfterReview: true`). A revisão de outro médico não é alterada.
7. Requisição antiga que chega após uma revisão mais nova não regride o cursor: responde `already_recorded` com o estado atual. Se snapshot/token não puder mais ser validado, responde `409` e exige obter novo snapshot/feed antes de nova confirmação.

`Idempotency-Key` é obrigatória em criação do pedido e revisão. Retry de mesma intenção usa a mesma chave e corpo; reutilizar a chave com outro corpo responde `409 IDEMPOTENCY_CONFLICT`. No timeout de uma mutação, não presumir sucesso nem enviar outra intenção com nova chave automaticamente.

Mudança de escopos/grant invalida snapshots, páginas e tokens de revisão anteriores. Não é permitido confirmar um conjunto antigo depois de perder autorização sobre ele. O backend pode manter o marcador histórico de revisão internamente, mas precisa reemitir um cursor compatível com a nova projeção antes da web continuar.

## 8. Revalidação e invalidação local

Proposta operacional para a primeira implementação: consultar `/access` a cada **15 segundos enquanto a tela estiver visível** e imediatamente ao retornar à aba. A chamada informa `knownAccessRevision` e `knownDataRevision` do snapshot. O backend compara as revisões, sem exigir que a web entenda seu conteúdo.

- Grant revogado/expirado: `403` com código específico; limpar imediatamente os dados clínicos e bloquear novas leituras.
- `knownAccessRevision` diferente: `409 ACCESS_CHANGED`; invalidar snapshot, páginas, evidências, arquivo aberto e `reviewToken`, revalidar e buscar somente a nova projeção permitida.
- Dados novos com mesmo acesso: `200`, `hasNewData: true`; manter o recorte em leitura e oferecer **Atualizar informações**. Não substituir gráfico/briefing silenciosamente.
- Sessão médica expirada: `401 SESSION_EXPIRED`; limpar contexto e pedir nova identificação. Não tentar usar um contexto temporário mais permissivo como fallback.
- Revalidação indisponível: colocar o conteúdo em estado bloqueado/incerto, suspender mutações e oferecer tentar novamente. Não continuar exibindo os dados indefinidamente como se o acesso estivesse confirmado.

Toda outra leitura clínica e cada stream de original revalidam o acesso no servidor, independentemente do polling. `15s` é uma hipótese de implementação para planejar a web, não SLA nem promessa de revogação instantânea. A expiração conhecida também é controlada localmente usando `serverTime`/`expiresAt`, sem renová-la no reload.

A web deve cancelar/ignorar respostas antigas após troca de paciente, logout ou mudança de autorização. Usar a identidade do contexto e sua geração/revisão como parte da chave da consulta. Uma resposta iniciada antes da revogação não pode recolocar dados no estado depois de ele ter sido limpo.

## 9. Erros e ação da interface

| HTTP / código de domínio | Tratamento web |
| --- | --- |
| `401 SESSION_REQUIRED` ou `SESSION_EXPIRED` | Pedir identificação quando o recurso exige médico; limpar dados da sessão encerrada. |
| `403 ACCESS_DENIED`, `ACCESS_REVOKED`, `ACCESS_EXPIRED` | Limpar conteúdo; explicar situação sem revelar dados; solicitar nova autorização quando cabível. |
| `403 CSRF_INVALID` | Reobter bootstrap; não repetir mutação sem resolver contexto e preservar a mesma intenção/idempotência. |
| `404 NOT_FOUND` | Recurso inexistente ou não pertencente ao vínculo. Não distinguir publicamente um paciente não autorizado. |
| `404 ORIGINAL_UNAVAILABLE` | Manter evidência estruturada autorizada e indicar ausência do original. |
| `409 ACCESS_CHANGED` | Descartar toda projeção antiga e obter autorização/snapshot novos. |
| `409 SNAPSHOT_STALE`, `CURSOR_INVALID`, `REVIEW_TOKEN_INVALID` | Atualizar conjunto e pedir nova revisão explícita; não concluir automaticamente. |
| `409 IDEMPOTENCY_CONFLICT` | Parar retry automático e indicar conflito da intenção. |
| `409 AUTH_CONTEXT_INVALID` | Handoff de convite expirado/substituído; voltar ao fluxo de convite sem promover acesso temporário. |
| `410 INVITE_EXPIRED`, `INVITE_REVOKED` | Pedir novo link/QR; não abrir Daniel demo. |
| `422 VALIDATION_ERROR` | Erro de entrada com recuperação; não enviar um token/URL arbitrário como autorização. |
| `422 SNAPSHOT_TOO_LARGE` | Informar que o recorte não pôde ser preparado com referências completas; não apresentar conjunto inconsistente ou confirmar revisão. |
| `429 RATE_LIMITED` | Respeitar `Retry-After`/`retryAfterSeconds`; não criar loop de polling. |
| `503 SERVICE_UNAVAILABLE` / falha de rede | Mostrar estado recuperável, sem mock automático. No acesso inicial, sem conteúdo; em revalidação, bloquear o que não puder ser confirmado. |

`requestId` permite correlacionar falha sem expor dados pessoais. Campos desconhecidos de domínio devem ser tratados como erro de contrato ou estado não suportado; não reinterpretar como permissão concedida.

## 10. Exemplos de planejamento

**Todos os IDs, cookies, tokens, horários de ingestão, identidade do médico e datas de autorização dos exemplos são sintéticos, sem validade real.** O valor laboratorial de ferritina abaixo é preservado do seed existente. Não há laudo original utilizável nem medição inicial de HbA1c; o exemplo não inventa esses dados. O OpenAPI contém os exemplos JSON completos de respostas, incluindo um snapshot mínimo coerente.

### 10.1 Sessão anônima

```json
{
  "meta": {
    "requestId": "req-demo-001",
    "serverTime": "2026-11-11T15:00:00Z",
    "contractVersion": "0.1-draft"
  },
  "data": {
    "state": "anonymous",
    "doctor": null,
    "expiresAt": null,
    "csrfToken": "csrf-demonstrativo-sem-validade",
    "pendingInvitation": null
  }
}
```

### 10.2 Solicitar acompanhamento

`POST /follow-up-requests`, com `X-CSRF-Token` e `Idempotency-Key`:

```json
{
  "invitationId": "invite-demo-1",
  "requestedScopes": ["read_exams", "read_wearables", "read_graphrag_briefing"],
  "requestedDuration": {
    "mode": "until",
    "expiresAt": "2026-12-11T15:00:00Z"
  }
}
```

Essa duração de um exemplo não é um padrão de produto. A resposta é `pending`, com `grant: null`, até o paciente confirmar. A API médica não possui operação de autoaprovação.

### 10.3 Evidência e citação no snapshot

```json
{
  "id": "ex-fer-2025",
  "version": "1",
  "kind": "lab_result",
  "label": "Ferritina Sérica",
  "occurredOn": "2025-10-18",
  "occurredAt": null,
  "ingestedAt": "2026-11-11T14:30:00Z",
  "sourceId": "src-fleury",
  "documentId": "doc-fleury-2025",
  "provenance": "extracted",
  "value": 22,
  "unit": "ng/mL",
  "referenceRange": { "min": 30, "max": 400, "text": null },
  "text": null,
  "status": "attention",
  "supersedes": null
}
```

Achado, ponto e nó apontam para `{ "id": "ex-fer-2025", "version": "1" }`. O documento correspondente tem `originalAvailable: false`. Nenhuma URI fictícia `file:///` é entregue como original acessível pelo navegador.

### 10.4 Concluir revisão de um conjunto estável

Última página de `/updates` fornece `snapshotId: snap-demo-1`, `throughCursor: cursor-demo-high-1` e `reviewToken: review-demo-snap-1-sem-validade`. Depois da ação do médico:

```json
{
  "snapshotId": "snap-demo-1",
  "reviewToken": "review-demo-snap-1-sem-validade"
}
```

O backend pode responder `status: recorded`, `lastReviewedCursor: cursor-demo-high-1` e `hasUpdatesAfterReview: true` se chegou um novo evento depois do snapshot. Essa novidade não foi consumida pela revisão anterior.

### 10.5 Seção indisponível ou não compartilhada

```json
{
  "briefing": {
    "state": "unavailable",
    "items": [],
    "reasonCode": "BRIEFING_GENERATION_UNAVAILABLE"
  },
  "wearables": {
    "state": "not_shared",
    "items": [],
    "reasonCode": "SCOPE_NOT_GRANTED"
  }
}
```

Trecho ilustrativo de snapshot, não envelope completo. Exames autorizados permanecem utilizáveis. Não retornar quantos eventos wearable foram ocultados.

## 11. Casos mínimos a validar contra o contrato

1. Sessão anônima recebe bootstrap; não lista carteira nem registra revisão.
2. Convite pontual válido abre apenas dados permitidos, sem criar vínculo contínuo ou reiniciar TTL.
3. Pedido autenticado permanece pendente até aprovação externa; rejeição/expiração têm recuperação explícita.
4. Carteira/revisão são isoladas por médico; nenhuma entrada arbitrária de `doctorId` altera isso.
5. Fontes negadas não aparecem em resultados, contagens, texto de briefing, evidências ou relações.
6. Cada `EvidenceRef` resolve ID e versão; originais continuam sujeitos ao grant atual.
7. Paginação de novidades mantém snapshot/highwater; primeira inclusão não produz uma avalanche de notificações antigas.
8. Evento recebido depois do snapshot permanece novo após concluir revisão; resposta antiga não regride o marcador.
9. Revogação/expiração/scopeVersion novo bloqueiam respostas antigas, documentos abertos e confirmações pendentes.
10. Síntese indisponível não derruba exames; API indisponível não abre um paciente demonstrativo automaticamente.
11. Repetição idempotente da mesma intenção não cria duas solicitações nem confirmações; reutilização com corpo distinto falha.
12. Fechar contexto temporário invalida só aquele contexto; fechamento de aba não é anunciado como revogação global garantida.

## 12. Decisões que o backend precisa ratificar

| Aberto | Hipótese temporária usada para planejar a web |
| --- | --- |
| Rotas, nomes e envelopes finais | Base/formatos deste documento e OpenAPI; adaptáveis na fronteira web. |
| Provedor, login e cookies | Backend controla identidade; mesma origem para a web; nenhum provedor escolhido. |
| Duração de sessão/convite e vínculo | Convite de consulta respeita duas horas; grant tem duração expressamente aprovada, sem padrão inventado. |
| RN08 e reabertura de convite | Contexto temporário por aba e encerramento explícito; sem promessa de revogação global ao fechar aba. |
| Confirmação no mobile e ampliação de escopos | Confirmação externa ao portal médico; nenhuma autoaprovação. |
| Escopos novos e tradução dos toggles atuais | Somente os escopos explícitos da tabela; conversas privadas fora v0.1. |
| Retenção de rótulo pessoal após acesso encerrado | Linhas inativas conservadoras, sem perfil/nome/dados clínicos. |
| Limites de snapshot e retenção de versões/cursors | Recorte declarado e feed paginado estável; validade/limites finais a definir. |
| Granularidade/frequência de atualizações | Grupo por documento/evento, cursor por médico/grant/escopo; polling inicial de 15s. |
| Disponibilidade do grafo e briefing | Estados parciais explícitos; sem projeção não autorizada nem fallback sintético automático. |
| Originais e arquivos | Stream autorizado por requisição; nenhum original presumido a partir de URI fictícia. |
| Implantação, upstream e canal de integração | Acordar com o responsável pelo backend antes de afirmar integração real concluída. |

Ao receber a API efetiva, registrar diferenças, atualizar versão deste rascunho/mocks e ajustar somente os módulos de fronteira e testes afetados quando a mudança não alterar o produto. Decisões de experiência ou autorização incompatíveis voltam para alinhamento; não manter uma falsa compatibilidade que amplie acesso.
