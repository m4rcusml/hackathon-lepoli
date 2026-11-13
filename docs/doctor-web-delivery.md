# Execução da frente web do médico

Registro iniciado em **11/11/2026**, branch `feat/doctor-web`, a partir de `30ca3ed`. README modificado e documentos locais anteriores foram preservados. Não houve alteração em `mobile/`, push, publicação ou mudança de infraestrutura.

O [plano original](doctor-web-implementation-plan.md) registra a etapa anterior de planejamento. Este arquivo registra a execução; não transforma o [contrato temporário](doctor-backend-contract.md) em contrato aprovado. Backend e mobile continuam de outras frentes.

## Pacotes

| Pacote | Resultado da implementação |
| --- | --- |
| W00 | Documentos e OpenAPI provisórios preservados. Tipos e validadores gerados do rascunho; aprovação do backend continua pendente. |
| W01 | `web/` independente, Next App Router, TS estrito, Tailwind, versões fixas/lockfile, scripts e configuração de exemplo. |
| W02 | Shell responsivo Rivio, navegação, carteira/paciente, abas por teclado, estados e inspector com foco. |
| W03 | `DoctorApi`, Zod/envelopes, JSON Schema pré-compilado, referências/escopos, transporte HTTP cancelável, QueryClient em memória, ponte limitada sem lógica clínica. |
| W04 | Fixture determinística, dados laboratoriais em paridade com mobile, wearable positivo sintético, cenários e controles exclusivamente demo. |
| W05 | Sessão delegada, parser/QR, troca de convite por POST, token removido da URL, consulta temporária separada, pedido explícito e confirmação externa. |
| W06 | Carteira com busca restrita, filtros/paginação, revisão inicial, proteção de homônimos e vínculos inativos sem prévias. |
| W07 | Snapshot estável, revalidação/foco, expiração monotônica, troca de contexto, bloqueio/revogação e aviso de atualização. |
| W08 | Inspector único, histórico agrupado, datas clínicas vs ingestão, fontes/cobertura/versões e origem estruturada. |
| W09 | Síntese e achados com referências, lacunas e indisponibilidade parcial sem dados inventados. |
| W10 | Recharts, períodos/seletores, unidades separadas, referências por resultado, lacunas, tabela equivalente e janelas incompatíveis explícitas. |
| W11 | React Flow com layout determinístico, filtros, natureza das relações, leitura sem mutação clínica e lista equivalente acessível. |
| W12 | Feed paginado preso ao snapshot, token final, idempotência, revisão por médico e proteção de novidades posteriores. |
| W13 | Visualizador autorizado de original PDF/imagem, MIME/versão imutável, cancelamento e liberação de blobs. Originais reais não disponíveis no cenário inicial. |
| W14 | Tipos, lint, build, 242 testes unitários/componentes e 23 jornadas de navegador aprovados após a remodelagem de UX. Axe sem violações nas superfícies verificadas em desktop e 390px. Câmera física requer verificação manual. |
| W15 | Fronteira pronta e transporte exercitado contra double HTTP. **Integração real bloqueada pela ausência de ambiente/contrato efetivo de backend**; não concluída entre dispositivos. |
| W16 | Impressão do sumário via navegador e rascunho em memória com limites de persistência explícitos. Não há geração automática de PDF nem notas persistentes. |

## Evidência de validação

- `npm ci --allow-remote=all`: instalação limpa e reproduzível neste Windows/npm 12; nenhum ajuste global.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado, sem erros ou avisos de código.
- `npm test`: **242 testes aprovados em 15 arquivos**. Fronteira HTTP/contrato, 32 conjuntos de escopos, snapshots/revisão/idempotência, ciclo de sessão/expiração monotônica, scanner/cleanup, evidências, séries, relações e atalhos da nova experiência.
- `npm run build`: aprovado, Next 16.4.6, com fontes locais e módulos pesados carregados sob demanda.
- `npm run test:e2e`: **23 jornadas aprovadas** em Chromium (14 demo + 9 HTTP), última rodada em 1,4 minuto. Transporte same-origin real da web exercitado contra double local, nunca contra o backend da equipe.
- Axe WCAG 2 A/AA e 2.1 A/AA: sem violações nas superfícies verificadas. Desktop: carteira, resumo, inspector, evolução e relações. Celular 390px: mesmas superfícies, com largura do documento contida e rolagem local nas tabelas.
- Navegação por teclado/foco: abas, Escape/retorno do inspector e lista de relações verificados nas jornadas. Câmera negada mantém colagem; testes do scanner verificam tracks/controladores e respostas tardias. Leitura por câmera física permanece manual.
- Na implementação inicial, a revisão independente de 12 capturas em 1440px/390px classificou três correções como **resolved**, disposition **ship** no passe de veredito. A remodelagem posterior tem seu próprio conjunto de 10 capturas, descrito abaixo.
- Produção: demo desabilitada responde 404; HTML inicial não contém nome/resultados clínicos; upstream ausente retorna 503 explícito com `no-store`.
- Impressão: botão invoca o recurso nativo; paciente e achados autorizados permanecem no modo print; navegação e controles são excluídos. Não foi declarado download automático de PDF.
- `npm run api:types`: regeneração aprovada, validadores idênticos por hash. Tipos e validação derivam do mesmo OpenAPI temporário.
- `npm audit --omit=dev`: zero vulnerabilidades reportadas. Auditoria completa ainda reporta sete ocorrências moderadas transitivas das ferramentas de lint (`minimatch`/TypeScript ESLint); atualização compatível não eliminou o aviso. Nenhuma atualização major forçada foi aplicada.

Resultados acima são da web com mocks/double. Testes não substituem aprovação de consentimento, persistência e integração reais.

## Decisões técnicas de execução

Zod valida envelope/metadados e Ajv pré-compila os schemas OpenAPI durante desenvolvimento para cobrir também `if/then`, seção restrita, sessão e tipos condicionais. O navegador recebe funções geradas; não compila schemas por `eval`. O script único gera tipos e validadores. Isso evita manter uma cópia manual divergente do contrato.

O demo carrega por importação dinâmica somente em `/demo/doctor`. O modo real nunca chama o transporte demonstrativo. O serviço em `web/tests/http-backend.mjs` existe apenas para testes de cookies/transporte/persistência entre requests e não implementa um backend do produto.

O mobile foi consultado como fonte do cenário laboratorial/identidade visual, sem importar store React Native. Os trechos de wearable inválidos do simulador não foram reaproveitados. As relações da fixture são fatos documentados (paciente → resultado ou uso relatado), sem inferência de causalidade ou doença a partir de história familiar.

A inspeção visual identificou e corrigiu a regra do scaffold que descartava exports de CSS Modules: o loader Tailwind agora atua somente em `globals.css`. Os testes passaram a exigir dimensões reais do gráfico/grafo. Outro ajuste ancorou os textos acessíveis absolutos ao contêiner de rolagem da tabela, removendo overflow no celular sem esconder dados. O grafo abre um recorte rastreável ao primeiro achado, com orientação vertical em tela estreita e zoom legível; a lista conserva o mesmo recorte.

O sistema visual está documentado em `DESIGN.md` e `.impeccable/design.json`, extraídos da implementação. As capturas são artefatos locais ignorados pelo Git. A aplicação permanece disponível para revisão local em `http://127.0.0.1:3000/demo/doctor`, com demo explicitamente habilitada no processo de prévia.

## Pendências externas para W15

1. Responsável pelo backend ratificar/substituir rotas, envelopes e campos do `0.1-draft`.
2. Fornecer ambiente upstream, autenticação, cookies/domínios/callback e origem pública da web.
3. Confirmar no mobile a aprovação daquele médico/categorias/duração, rejeição, revogação e semântica do acesso pontual.
4. Validar carteira e revisão persistentes após logout/novo dispositivo, com token de snapshot e chegadas concorrentes reais.
5. Conferir limites/retensão de snapshots e originais, e a semântica RN08 de fechamento de aba.
6. Fazer leitura QR em câmera física e fluxo entre dispositivos reais.

Nenhuma diferença de API real foi registrada porque **nenhuma API real foi disponibilizada/inspecionada nesta execução**. Não há credencial, método de login ou duração padrão inventados como substituição. A ausência do backend não bloqueou a implementação da web.

## Remodelagem da experiência médica — 11/11/2026

Executada a pedido do usuário, com subagentes separados para carteira, contexto/evidências e evolução/relações. Identidade visual Rivio e as fronteiras de integração foram preservadas.

- Entrada autenticada abre a carteira diretamente; a navegação desktop ocupa 88px e o topo 64px.
- Carteira em linhas de trabalho responsivas, com novidades, identidade e datas próximas. **Revisar**, **Evolução** e **Histórico** abrem a área escolhida em um clique.
- Resumo coloca achados primeiro, compara medidas citadas com valores/datas reais e mantém contexto, medicações e lacunas ao lado. Uma medida abre sua referência e versão exatas.
- Abas ficam acessíveis durante rolagem. A barra de revisão acompanha a investigação e mantém a exigência de carregar todas as páginas antes de registrar explicitamente o snapshot.
- **Anotar** abre e foca o rascunho em uma ação. Notas permanecem em memória durante a troca de abas e continuam sendo descartadas ao sair/perder autorização.
- Evolução oferece seleção direta de medidas, comparação anterior/atual e curvas com tabela equivalente. Relações aproximam grafo, focos rápidos, legenda filtrável e lista textual.
- Registros relacionados no inspector são navegáveis diretamente. Rótulos acessíveis incluem o conteúdo visível e preservam a medição/versão selecionada.
- Faixas, rótulos e controles demonstrativos foram retirados da interface conforme solicitação explícita. Rotas, transportes, caches e bloqueios reais continuam separados. O harness de cenários usa eventos somente no transporte isolado, documentados no README da web.

Na validação foram corrigidos: uma corrida do status de aprovação no mock (sem aceitar respostas clínicas ou de outro médico atrasadas), conteúdo mínimo da tabela alargando a coluna em grid e textos acessíveis absolutos escapando da lista rolável. O lint agora ignora também relatórios/traces gerados; testes e fontes continuam analisados.

Tipos, lint, build, 242 testes e 23 jornadas passaram. As 10 capturas `ux-*` em `.impeccable/review/` foram abertas e conferidas em 1440×1000 e 390×844; o relatório `ux-review-results.json` registra zero violações Axe, zero erros de página e largura contida nos dez estados. Botões de notas, revisão, impressão e fechamento de evidência ficaram visíveis e sem obstrução; foco do rascunho e impressão também foram verificados. A checagem de produção confirma demo desabilitada com 404, ausência de dados clínicos no HTML inicial e falha explícita sem upstream.

O detector mecânico apontou uma borda de 3px no indicador da aba selecionada como possível borda de cartão. A revisão independente classificou o aviso como falso positivo: é uma seleção linear de navegação, sem cartão arredondado nessa região.

A revisão independente final desta remodelagem retornou **disposition: ship** após abrir as dez capturas e conferir pontos de interação no código, sem achados materiais ou recaptura necessária. Seu escopo cobre essas superfícies e o relatório de QA fornecido; não substitui validação clínica nem integração real. DESIGN.md e seu sidecar foram atualizados com os tokens e componentes efetivamente implementados.
