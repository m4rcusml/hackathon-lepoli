# Plano de implementação — web do médico

> Este documento preserva o planejamento inicial. A implementação posterior em `web/`, os resultados dos checks e as pendências externas estão no [registro de execução](doctor-web-delivery.md).

**Status: planejamento, sem implementação iniciada.** Escopo autorizado: web + contrato de integração. Carteira contínua faz parte desta versão. Prazo informado: sábado, 14/11/2026; duração da apresentação não orienta as entregas.

## 1. Documentos e decisões

- [Contexto do produto](../PRODUCT.md): fatos e decisões confirmados.
- [Experiência do médico](../doctor-web-development-plan.md): jornadas, conteúdo, comportamento e estados das telas.
- [Contrato backend temporário](doctor-backend-contract.md): hipóteses operacionais para desenvolver a web.
- [OpenAPI provisório](contracts/doctor-api.v0.1.openapi.json): formas de dados, operações e exemplos para mocks e testes.

O contrato é **TEMPORÁRIO, NÃO APROVADO PELO RESPONSÁVEL PELO BACKEND**. Não afirma que as APIs existem nem determina a implementação do backend. O plano usa essa fronteira para avançar a web; divergências reais serão mapeadas no cliente de integração, com revisão do documento e dos exemplos. Não espalhar nomes do backend por componentes.

### Dentro da nossa entrega

1. Aplicação independente em `web/`, com identidade visual coerente com o mobile.
2. Entrada do médico, integração de sessão, carteira autorizada e inclusão por QR/link.
3. Estados do vínculo contínuo: pendente, aprovado, rejeitado, expirado e revogado, conforme contrato.
4. Espaço do paciente: Resumo, Evolução, Histórico e Relações.
5. Inspector comum de evidências, fontes e permissões.
6. Novidades desde a revisão explícita e retomada do acompanhamento entre acessos, pela persistência do backend.
7. Modo pontual sem login de RF-M01, separado da carteira contínua.
8. Cenário determinístico isolado para desenvolvimento e contingência.
9. Testes, documentação de execução/configuração e validação de integração.

### Dependências externas, sem implementar nesta frente

Identidade médica, autenticação, emissão de convites, confirmação pelo paciente, persistência de consentimento/carteira/revisão, ingestão, banco, extração, GraphRAG, HNSW, detecção clínica e MCP. No mobile: chamada da API, aprovação do vínculo, escopos efetivos, URL do portal, cópia real do link e correção do cenário wearable.

A eventual ponte HTTP do Next apenas transporta chamadas ao backend. Ela não emite autorizações, não assina JWT, não gera prontuário nem mantém banco próprio.

## 2. Cobertura dos requisitos

| Origem | Entrega web | Prioridade |
| --- | --- | --- |
| RF-M01 | QR/link, acesso pontual com TTL, validação delegada ao backend, restrições e encerramento | P0 |
| RF-M02 / RN09 | Síntese e achados com citações que abrem a evidência correta | P0 |
| RF-M03 / RN10 | Séries com datas/unidades/referências e eventos documentados | P0 |
| RF-M04 / RN11 | Grafo e lista de relações, seleção e inspector | P0 |
| Decisão nova: carteira contínua | Médico identificado, pacientes autorizados, solicitações de vínculo | P0 |
| Decisão nova: acompanhamento | Novidades por médico, revisão explícita e sincronização | P0 |
| Rastreabilidade transversal | Histórico, fontes, cobertura, versão e detalhe estruturado | P0 |
| RF-M05 | Original PDF/imagem quando realmente disponível | P1; detalhe estruturado não depende disso |
| RF-M06 | Sumário para impressão / salvar como PDF | P1 |
| RF-M07 | Rascunho de notas da consulta, separado dos dados do paciente | P1, com limites de persistência explícitos |

P0 é uma entrega única de produto, inclusive carteira contínua; não concluir a versão somente com uma tela de paciente demonstrativa. P1 não reduz o aceite de P0.

## 3. Arquitetura web

### Stack e dependências

Seguir Next.js App Router + TypeScript + Tailwind, Recharts, `@xyflow/react` e Lucide já propostos no repositório. Adicionar somente o necessário:

| Ferramenta proposta | Motivo e limite |
| --- | --- |
| `@tanstack/react-query` | Dados remotos, cancelamento, polling e invalidação; cache somente em memória, sem plugin de persistência. |
| `zod` | Validar entradas e respostas críticas na fronteira HTTP; componentes recebem dados normalizados. Não reproduzir regras clínicas. |
| `@zxing/browser` | Decodificação do QR da webcam, carregada apenas ao abrir o scanner. Não depender exclusivamente de uma API nativa de detecção. |
| `openapi-typescript` (desenvolvimento) | Gerar tipos do rascunho OpenAPI; nenhuma geração de servidor. |
| Vitest + Testing Library | Lógica de sessão/dados, concorrência e componentes com estados relevantes. |
| Playwright (desenvolvimento) | Jornadas reais do navegador, arquivos, rotas e integração HTTP. |

Usar `fetch`, `URL`, `Intl` e recursos nativos para HTTP, links e formatação. Não adicionar Axios, Zustand, framework de formulários ou motor de layout do grafo por padrão. Instalar e fixar versões compatíveis durante W01, consultando documentação oficial e mantendo `package-lock.json`; não escolher versões de memória nem usar `latest` em scripts permanentes.

A documentação oficial confirma o App Router e distingue [Route Handlers para a ponte HTTP](https://nextjs.org/docs/app/guides/backend-for-frontend) do [Proxy, que não deve ser a solução completa de autorização](https://nextjs.org/docs/app/getting-started/proxy). As decisões de dados e cancelamento seguem as referências de [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) e [useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQuery).

### Responsabilidade das camadas

```text
Rotas e layouts
  → módulos de experiência (carteira, paciente, compartilhamento)
    → consultas/mutações e estado de apresentação
      → DoctorApi (interface pequena de operações do contrato)
        → transporte HTTP real OU transporte demonstrativo
```

- `DoctorApi` é uma fronteira por operações existentes, sem classes/repositórios genéricos.
- Tipos de transporte saem do OpenAPI; validação em execução cobre sessão, acesso, envelopes, snapshot, revisão e referências. Pequenos seletores constroem índices por ID e séries para as telas.
- Recharts e React Flow recebem dados derivados do mesmo snapshot; não têm uma cópia própria do histórico.
- O layout e metadados de páginas não contêm informação clínica. Carregar o contexto clínico autorizado pelo cliente, mantendo HTML inicial e caches de servidor sem prontuário.
- Carregar gráficos, grafo, scanner e visualizador de original somente quando usados. Não iniciar câmera na entrada da página.

### Estrutura prevista

```text
web/
  src/app/doctor/                         entrada, carteira, paciente e convite real
  src/app/demo/doctor/                    mesmas experiências com fonte demonstrativa
  src/app/consultation/[token]/           compatibilidade do link
  src/app/api/doctor/v0/[...path]/route.ts ponte de transporte, se necessária
  src/components/ui/                     controles comuns, tabs, estados, drawer
  src/features/session/                  identidade e integração de login/logout
  src/features/sharing/                  parser, QR, resolução e pedido de vínculo
  src/features/patients/                 carteira, busca e paginação
  src/features/workspace/                contexto, abas, cabeçalho e revisão
  src/features/evidence/                 inspector, fontes, histórico e originais
  src/features/briefing/                 resumo e citações
  src/features/evolution/                curvas, filtros e tabela de valores
  src/features/graph/                    nós, arestas, recortes e lista equivalente
  src/lib/api/                           tipos gerados, validação, transporte e erros
  src/lib/demo/                          fixture e comportamento determinísticos
  src/lib/clinical/                      seletores de apresentação, unidades e datas
  tests/                                 componentes, contratos e jornadas
  .env.example
  README.md
```

Criar arquivos conforme cada entrega os exigir; não gerar diretórios vazios ou wrappers sem função. Não mover o mobile ou reorganizar o repositório inteiro. Nenhum agente da web modifica `mobile/`.

## 4. Contrato aplicado à navegação

Base proposta: `/api/doctor/v0`, sob a mesma origem do navegador. Produção pode usar reverse proxy; se isso não estiver disponível, W03 implementa a ponte limitada do Next. O backend continua dono dos cookies, do login e da autorização.

| Fluxo/tela | Operações propostas do contrato |
| --- | --- |
| Entrada e retorno do login | `getDoctorSession`, `startDoctorAuthentication`, `logoutDoctor` |
| Carteira | `listDoctorPatients` |
| QR/link e acesso pontual | `resolveSharingToken`, `closeTemporaryAccess` |
| Solicitação de acompanhamento | `requestPatientFollowup`, `getPatientFollowupRequest` |
| Paciente e revalidação | `getPatientSnapshot`, `revalidatePatientAccess` |
| Novidades e conclusão | `getPatientUpdates`, `recordPatientReview` |
| Original do laudo | `streamOriginalDocument` |

### Sessão, convite e vínculo

- Bootstrap da sessão fornece estado anônimo/autenticado e token CSRF. Mutações usam a sessão do backend; `doctorId` nunca é uma credencial enviada pelo usuário.
- Login é um redirecionamento para o fluxo do backend com retorno relativo permitido. A web não cria autenticação substituta, senha mock em modo real ou provedor próprio.
- QR/link é interpretado localmente e o token trocado por POST. Não navegar para a origem arbitrária lida na câmera. Após resolver, retirar o token da URL com substituição do histórico; não salvar em storage, logs ou ferramentas de análise.
- Usar `/doctor/consultation` sem token para a consulta pontual já resolvida. O contexto clínico temporário fica somente em memória; reload dessa rota solicita reabrir o link ou colar um novo convite, sem restaurar acesso pelo histórico.
- Quando o convite exige login para solicitar acompanhamento, preservar a intenção no backend com um identificador de retomada ligado ao cookie. O retorno da autenticação recupera somente os metadados do convite, não o contexto clínico temporário. O rascunho detalha esse handoff; não guardar o token bruto ou o acesso temporário para atravessar o redirect.
- Acesso temporário utiliza seu próprio contexto em memória e não libera carteira/revisão contínua. O médico estar logado não promove esse acesso.
- Pedido de vínculo usa `Idempotency-Key`, escopos e duração explícitos. Pendência tem polling e próximo passo; rejeição/expiração não ativa o paciente.
- `closeTemporaryAccess` atende a ação explícita de encerramento. Fechar aba limpa o contexto local; requisição de encerramento no unload é somente best-effort. Não prometer revogação global infalível ao fechar uma aba. A interpretação literal da RN08 precisa ser ratificada no backend.

### Estado remoto, autorização e concorrência

- As chaves de consulta incluem modo, identidade da sessão, paciente e contexto de acesso; snapshot inclui sua identidade/revisão. Não compartilhar cache entre médicos, grants ou modo real/demo.
- Consumir `AbortSignal` no fetch. Troca de paciente/contexto, logout e perda de autorização cancelam chamadas e descartam respostas tardias. Cada resposta só pode atualizar o contexto que a originou.
- Consultar estado de acesso a cada **15 segundos enquanto o contexto estiver em uso**, e imediatamente ao voltar ao foco. Esse intervalo é hipótese do rascunho, não garantia de revogação instantânea. Não manter timers de abas/componentes desmontados.
- Nova revisão de dados sinaliza **Novas informações disponíveis**, sem substituir silenciosamente o snapshot em investigação. Mudança de autorização invalida os dados anteriores e força nova resolução.
- Expiração/revogação limpa snapshot, índices, inspector, gráficos, grafo e originais. Falha de revalidação apresenta bloqueio/incerteza até recuperar; não confirmar acesso com base em cache antigo.
- Erros 401/403/409 de acesso não recebem retries cegos. Mutações usam a mesma chave de idempotência ao repetir uma intenção após timeout; uma intenção nova usa nova chave.
- Contador de validade usa `serverTime`, `expiresAt` e relógio monotônico desde o recebimento, sem reiniciar em reload. Ao retornar do background, revalidar.
- Em `getPatientUpdates`, todas as páginas se referem ao mesmo snapshot/limite superior. Somente a última página fornece `reviewToken`; habilitar concluir revisão após carregar o conjunto completo.
- Na primeira versão, filtros de período/tema operam somente sobre a cobertura recebida; não há promessa de buscar recortes históricos adicionais. O snapshot deve incluir todas as evidências citadas por suas visualizações e pelo feed de novidades vinculado, mesmo que uma evidência esteja fora da curva exibida. Se o backend não puder fechar essas referências no volume permitido, deve retornar erro explícito de limite, não um conjunto impossível de revisar.
- `recordPatientReview` envia `{snapshotId, reviewToken}`, não a hora atual do navegador. O backend impede regressão e rejeita token de outra identidade, vínculo ou versão de escopo. Dados posteriores permanecem novos.

### Transporte e configuração

Prever `.env.example` com `DOCTOR_API_UPSTREAM_URL` (servidor), origem pública da web quando exigida pelo login e sinalização explícita para habilitar a rota demo. Nomes finais serão registrados no setup; nenhum segredo usa prefixo público.

A ponte limita paths/métodos aos descritos no contrato, usa upstream fixo configurado, preserva cookies/CSRF/idempotência/erros e aplica `no-store`. Não recebe URL de destino do usuário nem funciona como proxy aberto. Cookies e redirects precisam do alinhamento de domínio/path com o backend. Sem Service Worker ou cache persistente de prontuário. Stream de documento revalida autorização a cada solicitação.

## 5. Plano de trabalho com critérios de saída

W00 corresponde aos documentos produzidos nesta etapa e sua validação estática; continua provisório para o backend. As tarefas W01 a W16 estão **planejadas**, sem implementação iniciada. Documentação/validação de W00 não é evidência de integração real.

| ID | Trabalho e resultado concreto | Dependências | Critério de saída |
| --- | --- | --- | --- |
| W00 | Versionar contrato provisório, exemplos, decisões abertas e mapeamento de operações | — | JSON legível e referências/exemplos validados; status temporário explícito; revisão cruzada com a experiência. |
| W01 | Criar Next em `web/`, scripts, TypeScript estrito, estilos, lint/testes e `.env.example` | W00 | Iniciar/buildar a base; lockfile fixo, secrets/`.next` ignorados; mobile sem alteração. |
| W02 | Shell, navegação, hierarquia da carteira/paciente e componentes comuns | W01 | Rotas real/demo, abas, tabela, estados e inspector navegáveis por teclado; identidade do paciente sempre reconhecível. |
| W03 | Tipos/validação, `DoctorApi`, HTTP, erros, QueryClient e ponte quando necessária | W01, W00 | Chamadas canceláveis, CSRF e credenciais corretas; 401/403/parcial inválido testados; sem lógica clínica no proxy. |
| W04 | Fixture, relógio fixo e transporte demo com cenários controlados | W03 | Mesmo formato de API; coerência dos IDs/citações; transições reproduzíveis; nenhuma chamada ao backend real pelo demo. |
| W05 | Sessão, scanner, parser, convite, acesso pontual e solicitação de vínculo | W02–W04 | Login integrado, QR e colagem funcionam; câmera fecha; pending/rejected/expired e grant ativo distinguíveis; nenhum vínculo autoaprovado. |
| W06 | Carteira: busca autorizada, filtros, paginação, primeira inclusão e estados do vínculo | W02–W04 | Busca não sai da carteira; filtro/página mantidos; sem prévias clínicas em vínculos inativos; não duplicar paciente por reenvio do convite. |
| W07 | Espaço do paciente, snapshot, polling de acesso e banner de atualização | W05, W06 | Troca de paciente não reaproveita dados; snapshot estável durante leitura; revogação limpa todas as áreas. |
| W08 | Índice de evidências, inspector, histórico agrupado e fontes/cobertura | W07 | Mesmo registro abre de qualquer origem; coleta/ingestão distintas; correções rastreáveis; ausência e restrição diferentes. |
| W09 | Resumo e briefing com fontes, novidades e lacunas | W08 | Achados abrem referências válidas; texto não inventa relato/diagnóstico; indisponibilidade de síntese preserva dados básicos autorizados. |
| W10 | Séries, seleção de biomarcador/sinal, intervalos, eventos e tabela | W07, interface do W08 estabilizada | Datas/unidades/referências corretas; sincronização por data quando aplicável; sem transformar lacuna em zero ou criar eventos sem data. |
| W11 | Grafo e lista de relações com recorte/inspector | W07, interface do W08 estabilizada | Seleção por mouse/teclado; relação factual/temporal/hipótese legível; sem criar/alterar registro clínico ao mover nós. |
| W12 | Novidades paginadas, revisão explícita e retomada | W07, W09 | Última página habilita revisão; idempotência e concorrência testadas; não absorver dados posteriores nem afetar outro médico. |
| W13 | RF-M05: abrir original autorizado quando disponível | W08, endpoint de conteúdo | PDF/imagem no contexto correto; erros recuperáveis; limpar blob/iframe ao trocar acesso. Sem original: detalhe estruturado continua útil. |
| W14 | Revisão integrada, responsividade, acessibilidade e testes P0 | W05–W12 | Jornadas da matriz passam, build/typecheck/lint; scanner físico e permissões conferidos; revisão de dados e escopos consistente. |
| W15 | Conectar ambiente backend, ajustar mapeamentos e documentar operação | W14 + serviços externos disponíveis | Fluxo real entre dispositivos validado; carteira e revisão sobrevivem a novo login pelo backend; contrato e limitações atualizados. |
| W16 | RF-M06 e RF-M07, se realizados: impressão e rascunho de notas | P0 validado | Exportação contém somente dados permitidos; notas identificadas como rascunho, sem escrever no histórico compartilhado. |

W05, W06 e W07 formam a primeira fatia utilizável. W08 estabelece a base para briefing, curvas e grafo. Não começar componentes especializados com estruturas de dados próprias enquanto W03/W08 mudam.

### RF-M05 a RF-M07 sem ampliar o backend silenciosamente

- **Original:** visualização somente com conteúdo disponível e autorizado; nenhum PDF com selo/assinatura fabricados. `documentId` identifica um arquivo/versão imutável: substituição do arquivo recebe novo ID, preservando o original da evidência em investigação. Cópia já baixada pelo usuário não pode ser retirada pela web depois de uma revogação.
- **PDF:** usar inicialmente página de impressão com cabeçalho, datas/fontes e gráficos legíveis, acionada pelo recurso do navegador. Documentar como salvar em PDF. Se for exigido download automático de um arquivo gerado, tratar como extensão explícita; não chamar impressão de geração automática.
- **Notas:** por padrão, rascunho apenas em memória da aba, com aviso de não salvamento e proteção de navegação contra descarte acidental; sem localStorage de dados clínicos. Persistência entre sessões exige contrato próprio de notas do médico e alinhamento externo. A conclusão de revisão funciona sem notas.

## 6. Divisão entre agentes

Até quatro frentes simultâneas, contando o coordenador. Não há despacho de implementação nesta etapa de planejamento.

| Frente | Responsabilidade e arquivos | Condição para paralelizar |
| --- | --- | --- |
| Coordenador | W00/W01/W03/W05/W07/W12/W15; rotas, sessão, transportes, tipos, dependências e integração | Mantém interfaces compartilhadas estáveis e integra os demais resultados. |
| Agente de contexto | W06/W08/W09; `features/patients`, `features/evidence`, `features/briefing` | Após W02/W03 e props/callbacks acordados; não altera transportes, rotas ou lockfile. |
| Agente de evolução | W10; `features/evolution` e seletores/testes específicos | Recebe snapshot tipado e callback `openEvidence` do coordenador. |
| Agente de relações | W11; `features/graph` e testes específicos | Mesmas referências de evidência; não altera clínica nem contrato. |

Todos recebem: arquivos permitidos, contrato exato, critérios de saída e testes exigidos. Mudanças de schema/props são propostas ao coordenador, sem edição simultânea de arquivos comuns. Um só agente modifica `package.json`/lockfile. Revisão final pode reaproveitar um agente após sua entrega.

AGY e Kiro podem receber uma tarefa delimitada ou um alinhamento de interface quando suas sessões/responsabilidades estiverem identificadas. Não presumir que AGY é dono do backend nem iniciar trabalho sobre o mobile. Evitar Claude Code conforme orientação do usuário. Agentes não fazem push, merge, publicação ou migração como efeito colateral de suas tarefas.

## 7. Fixture e cenários de desenvolvimento

Preservar nomes, IDs laboratoriais, valores, unidades e referências existentes de Daniel. Acrescentar apenas metadados sintéticos necessários à navegação (médico fictício, grant, source/document/evidence IDs e revisões) com identificação demonstrativa.

Não importar a store React Native na web. Reutilizar somente módulos puros se o setup permitir sem acoplamento; caso contrário, fixture própria rastreável ao seed com checagem de paridade dos resultados. Não extrair pacote compartilhado nem alterar mobile sem alinhamento.

| Cenário | Comportamento que deve poder ser reproduzido |
| --- | --- |
| `active-initial` | Daniel autorizado, histórico inicial, sem cursor de revisão. |
| `active-with-updates` | Documento/evento novo agrupado e revisão anterior. |
| `concurrent-update` | Novo dado chega depois do snapshot; revisão mantém esse dado novo. |
| `restricted-exams` | Somente categorias concedidas; sem vazamento em síntese, relações ou contagens. |
| `pending-followup` / `rejected-followup` | Pedido não ativa acesso contínuo; próximo passo explícito. |
| `expired` / `revoked` | Carteira e espaço removem dados clínicos conforme mudança de acesso. |
| `temporary-only` | Consulta de duas horas sem carteira ou revisão contínua. |
| `empty-portfolio` / `empty-patient` | Explicações e ações úteis; sem preencher com valores fictícios no modo real. |
| `briefing-unavailable` / `source-stale` | Dados básicos disponíveis e estados parciais honestos. |
| `backend-unavailable` / `invalid-response` | Recuperação, bloqueio quando autorização incerta, nenhum fallback automático. |

O wearable inicial pode ficar basal; para o cenário anômalo, acordar leituras sintéticas válidas e percentuais calculados a partir delas. Não copiar o HRV negativo nem a narrativa divergente do mobile. Sem passos aleatórios, datas relativas ao relógio real ou mensagens com “hoje” fora do relógio de cenário. Não inventar HbA1c, datas de medicação ou laudo original.

O transporte demo simula transições em memória e reinicia de forma determinística. Isso não comprova persistência real. Os testes HTTP devem também cobrir novo login/reload contra um backend de teste com estado persistente. Mudar entre modo demo e real recria o contexto de consultas; nunca mesclar pacientes ou completar respostas reais com fixture.

## 8. Matriz de validação

### Contrato e lógica de fronteira

- Validar OpenAPI, referências e exemplos; verificar fixture contra os schemas usados.
- URL/token: caminhos suportados, entrada vazia, tamanho inválido, origem externa e token expirado; nunca navegar para conteúdo arbitrário do QR.
- Respostas inválidas, evidência inexistente, unidade incompatível e seção parcial: erro ou ausência explícita, sem queda silenciosa para mock.
- Sessão/vínculo: identificar médico por sessão, separar temporário e contínuo, concluir somente após aprovação, rejeitar escopos/cursores de outro contexto.
- Revisão: páginas de um snapshot, idempotência, novas informações concorrentes, resposta atrasada e revisão em outra aba sem regressão.
- Revogação: cancelar requisições, limpar views e cache; resposta antiga não pode repopular os dados.
- Datas: data sem horário sem deslocamento de fuso; relógio divergente não prolonga consentimento; referências e unidades por medição.

### Componentes e acessibilidade

Testar estados relevantes da carteira, convite, resumo, inspector e revisão. Curvas têm tabela equivalente; grafo tem lista equivalente e mensagens em português. Diálogos devolvem foco, abas têm semântica e navegação de teclado, status não dependem só de cor. Verificar larguras de notebook e tela estreita, nomes extensos e muitas fontes.

### Jornadas de navegador

| ID | Jornada | Evidência de conclusão |
| --- | --- | --- |
| E01 | Login → carteira → paciente → resumo → citação → histórico | Registro de origem correto, contexto preservado. |
| E02 | Convite → pedido → confirmação externa → paciente ativo | Pendência não libera dados; grant aprovado aparece sem cadastro manual do paciente. |
| E03 | Link pontual → snapshot → expiração/encerramento | Sem carteira/revisão; TTL não reinicia; página perde acesso corretamente. |
| E04 | Evolução → ponto → inspector → relação | Mesmo ID, data e valor entre visualizações. |
| E05 | Carregar novidades → concluir → novo acesso | Cursor persiste pelo backend; novos dados posteriores continuam pendentes. |
| E06 | Restringir/revogar no mobile com portal aberto | Conteúdo removido no ciclo de revalidação/foco; nenhuma resposta atrasada o restaura. |
| E07 | Indisponibilidade / payload inválido / síntese parcial | Estado correto e recuperação; sem substituição por Daniel demo. |
| E08 | Negar câmera → colar link; abrir e fechar scanner | Contingência funciona e todas as tracks da câmera param. |
| E09 | Sair/trocar identidade/contexto durante fetch de paciente/original | Sem dados cruzados, cache/original anteriores descartados. |
| E10 | Original e impressão, se entregues | Conteúdo permitido, legível e sem autenticação pública por URL estática. |

Usar Vitest/Testing Library para comportamento e Playwright para navegador, conforme as referências oficiais de [Vitest no Next](https://nextjs.org/docs/app/guides/testing/vitest) e [Playwright no Next](https://nextjs.org/docs/app/guides/testing/playwright). Não criar testes que apenas repetem o JSX nem meta de cobertura arbitrária.

Na implementação, criar scripts equivalentes a `typecheck`, `lint` (`eslint .`), `test`, `test:e2e`, `build` e `api:types`. Rodar os checks relevantes e uma validação integrada após juntar as frentes. Repetir somente após alterações, falhas ou lacunas materiais.

## 9. Comportamento específico das visualizações

- **Séries:** ordenar pontos pela data, respeitar unidade/referência de cada laboratório e limitar sincronização a datas compatíveis. Recharts oferece `syncId` e `syncMethod`; não usar o índice das amostras para alinhar séries com frequências distintas ([API oficial](https://recharts.github.io/api/LineChart/)). Marcadores não inferem eficácia de tratamento.
- **Grafo:** backend fornece semântica, rótulos e referências, sem coordenadas de tela. Layout inicial determinístico por tipo/ID e recorte; zoom/pan/arranjo são estado de apresentação. Desativar criação, reconexão e exclusão clínica. Usar os recursos documentados de [acessibilidade do React Flow](https://reactflow.dev/learn/advanced-use/accessibility), além da lista equivalente.
- **Scanner:** decodificar somente QR, limitar chamadas repetidas após leitura bem-sucedida, impedir dupla submissão, fechar tracks ao desmontar. O [projeto oficial ZXing Browser](https://github.com/zxing-js/browser) documenta a camada de decodificação no navegador.
- **Originais:** requisitar conteúdo autorizado, aceitar MIME permitido e falhas de conteúdo, sem executar HTML de documento. Ao revogar/trocar paciente, abortar download, fechar visualizador e revogar object URL. Um arquivo já salvo fora da aplicação fica fora desse controle.

## 10. Calendário e pontos de integração

| Período | Trabalho principal | Resultado esperado |
| --- | --- | --- |
| Quarta, 11/11 | W00; iniciar W01–W04 | Contrato/fixture revisados e fundação executável para primeira fatia. |
| Quinta, 12/11 | W05–W09; abrir W10/W11 em paralelo | Carteira e espaço com evidências; visualizações sobre a mesma base; conectar APIs já disponíveis. |
| Sexta, 13/11 | W10–W15, priorizando revisão/consentimento e integração real | P0 validado entre dispositivos e falhas cobertas; tratar diferenças do backend na fronteira. |
| Sábado, 14/11 | Resolver pendências P0, conferir ambiente e entregar documentação | Build utilizável, evidências dos checks e limites declarados. P1 apenas após P0 validado. |

Essa distribuição é uma ordem de execução, não uma afirmação de capacidade já disponível. Se a API atrasar, avançar a web inteira contra o contrato provisório e distinguir **web validada com mocks** de **integração real validada**. Não assumir implementação do backend para preservar uma data.

### Dependências a encaminhar ao responsável pelo backend

1. Primeira fatia: sessão médica, listagem autorizada, acesso e snapshot.
2. Em seguida: convite, pedido/decisão de vínculo e escopos/revogação efetivos.
3. Depois: paginação de novidades e persistência da revisão coerente com snapshot.
4. Conteúdo original e síntese/grafo ricos podem evoluir sem bloquear os dados estruturados.

A ordem organiza a integração; todas as dependências P0 ainda precisam existir para declarar a entrega real completa. Método de login, duração padrão do vínculo, origem de hospedagem, semântica de fechamento da aba e aceitação do contrato permanecem decisões externas. Nenhuma delas impede planejar a web com substitutos demonstrativos explícitos.

## 11. Definição de entrega completa

- P0 atende aos requisitos e à carteira contínua confirmada pelo usuário.
- `web/README.md` descreve instalação, comandos, modos, configuração, limitações e integração com backend/mobile.
- `.env.example` não contém credenciais; nenhuma dependência da web altera o mobile.
- Contrato está versionado, com diferenças do backend real registradas e status provisório preservado enquanto não for validado por seu responsável.
- Build, typecheck, lint, testes relevantes e verificação visual/acessível têm resultado registrado.
- Fluxos de consentimento, persistência e revisão têm evidência real quando declarados integrados; fixture não substitui essa evidência.
- P1 tem estado explícito: entregue, não realizado ou dependente de definição externa; não chamar um rascunho não salvo de prontuário persistente.
- Nenhuma publicação, merge ou migração de infraestrutura é necessária para concluir este planejamento. Durante a implementação, hospedar apenas no ambiente acordado e validar o caminho real de API/cookies/HTTPS.

Não há código de aplicação nesta entrega de planejamento. O próximo trabalho executável é W01, seguido por W03/W04, usando o rascunho W00 como fronteira temporária.

## 12. Validação documental realizada em W00

Na revisão de 11/11/2026, a especificação `0.1-draft` passou por validação formal OpenAPI 3.1 e validação dos exemplos declarados em media types contra JSON Schema e formatos. Foram conferidos IDs de operações, referências de evidência/versão, fontes, documentos e extremidades do grafo dos exemplos, além dos links locais entre os documentos.

Uma revisão independente identificou e levou à correção de retomada do convite após login, cobertura das evidências do feed e imutabilidade do original por `documentId`. Isso valida a coerência do rascunho para planejamento; não valida autorização, persistência ou comportamento de qualquer serviço real. Os testes funcionais das tarefas seguintes ainda não foram executados.
