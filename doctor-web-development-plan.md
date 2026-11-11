# Plano da experiência do médico e desenvolvimento web

## Direção confirmada

O produto possui um backend central que recebe informações de diferentes fontes sobre um paciente. O paciente consulta seu contexto e controla seu compartilhamento; o médico usa esse contexto para acompanhar a evolução.

**Carteira contínua de pacientes entra nesta versão**, conforme decisão do usuário. O planejamento anterior, centrado em uma sessão de consulta e uma apresentação de três minutos, está substituído por este plano de uso do produto. O prazo informado continua sábado, 14/11/2026, mas a duração da apresentação não determina a experiência.

Responsabilidade de Marcus: **web do médico + contrato de integração**. Backend e alterações no mobile permanecem com outros responsáveis. Integração real com fallback determinístico explicitamente identificado continua confirmada.

As jornadas e telas abaixo são propostas para revisão. Ainda não são funcionalidades implementadas. O contexto durável da frente está em [PRODUCT.md](PRODUCT.md).

O [plano completo de implementação](docs/doctor-web-implementation-plan.md) transforma esta experiência em tarefas, arquitetura, testes e critérios de conclusão. Sua fronteira de dados é o [contrato backend temporário](docs/doctor-backend-contract.md), acompanhado de [OpenAPI provisório](docs/contracts/doctor-api.v0.1.openapi.json). Esse rascunho existe apenas para planejar web e integração; não foi aprovado pelo responsável pelo backend e não representa APIs já disponíveis.

## O trabalho que a interface deve permitir

O médico precisa conseguir:

1. Identificar quais pacientes autorizados têm novas informações para revisar.
2. Entender o contexto de um paciente sem reconstruir manualmente seu histórico entre arquivos e aplicativos.
3. Investigar o que mudou, quando mudou e qual a fonte de cada informação.
4. Comparar a evolução de exames, sintomas, medicações e sinais disponíveis, respeitando as lacunas dos dados.
5. Retomar o acompanhamento sem perder a referência do que já revisou.

A organização principal será **carteira → paciente → contexto → evidência → revisão**. O processamento e as correlações acontecem no backend; a web apresenta os resultados e permite explorá-los.

## 1. Entrada e formação da carteira

### Identificação do médico

O uso contínuo começa com uma conta identificada do médico. A web deve conservar a carteira, os vínculos autorizados e o ponto de revisão entre acessos e dispositivos. O mecanismo de autenticação será alinhado com o responsável pelo backend; não escolher um provedor nem implementar identidade clínica paralela nesta frente.

Na primeira entrada, a carteira vazia explica como receber autorização de um paciente e oferece **Adicionar paciente por QR ou link**. Não oferecer busca global de históricos de pessoas sem vínculo.

### Inclusão com autorização do paciente

Fluxo proposto para o caminho já iniciado no mobile:

1. O paciente gera um convite de compartilhamento e o médico o abre por QR ou link.
2. Para adicionar à carteira, o médico se identifica e solicita o acompanhamento.
3. O paciente confirma **qual médico**, **quais categorias de dados** e **qual duração** do acompanhamento.
4. O backend ativa o vínculo individual médico–paciente.
5. A carteira recebe o paciente e a web abre seu resumo.

A confirmação poderá usar a interface de compartilhamento do mobile; sua implementação pertence à outra frente. Convite ainda não confirmado não libera conteúdo clínico contínuo.

Separar três estados com ciclos próprios: sessão de autenticação do médico, convite temporário de compartilhamento e autorização de acompanhamento. **Um link de duas horas não se transforma automaticamente em autorização permanente.** A duração do acompanhamento deve ser explícita e revogável; seu valor padrão ainda precisa ser definido.

O acesso pontual sem cadastro descrito em RF-M01 continua como modo temporário, quando autorizado pelo backend. Adicionar esse paciente à carteira exige identificação do médico e confirmação do paciente para o novo vínculo. Esse caminho conserva compatibilidade com o requisito anterior sem confundir as duas autorizações.

## 2. Carteira: o ponto de partida diário

A tela inicial apresenta uma lista pesquisável de pacientes autorizados. A unidade principal é uma linha de paciente, permitindo comparação rápida sem abrir vários painéis.

| Informação na linha | Utilidade |
| --- | --- |
| Nome e identificador necessário para diferenciar pacientes | Abrir a pessoa correta; não expor identificação desnecessária na lista. |
| Novas informações desde a última revisão | Saber onde há trabalho pendente. Agrupar por documento/evento, não por cada linha de biomarcador. |
| Achado ou mudança relevante fornecida pelo backend, com sua data | Dar contexto à priorização; não inventar um escore clínico na interface. |
| Data do último dado recebido e da última revisão do médico | Distinguir informação recente de histórico ainda não revisado. |
| Situação do compartilhamento | Saber se o acesso está ativo, aguardando confirmação, expirado ou encerrado. |

Filtros iniciais: **Com novidades**, **Todos com acesso ativo** e **Vínculos pendentes/encerrados**. A busca fica restrita à carteira do médico.

Na primeira inclusão, mostrar **Histórico disponível para revisão inicial**, sem tratar anos de dados como milhares de notificações novas. Pacientes com o mesmo nome precisam de informação de desambiguação antes de abrir.

Ao encerrar um vínculo, retirar os dados clínicos dos resultados e prévias. A retenção de uma identificação mínima do vínculo encerrado depende do contrato; o filtro de encerrados não preserva um espelho do histórico.

## 3. Espaço do paciente: orientação antes de exploração

Ao selecionar o paciente, o médico entra em um espaço único com cabeçalho persistente e quatro áreas: **Resumo**, **Evolução**, **Histórico** e **Relações**. O médico pode ir diretamente à área de interesse; elas não formam uma sequência obrigatória.

O cabeçalho mantém nome/identificação, dados demográficos disponíveis, situação do acesso e atalhos para **Fontes e atualização** e **Permissões**. Mostra claramente a pessoa em foco ao abrir qualquer detalhe.

### Resumo — o que preciso saber agora?

Conteúdo em ordem de uso:

1. **Desde sua última revisão:** documentos, eventos ou correções que chegaram; na primeira visita, contexto de revisão inicial.
2. **Síntese do paciente:** condições registradas, sintomas relatados e medicações conhecidas, sempre com origem e data. História familiar tem identificação própria.
3. **Achados destacados:** mudanças e resultados relevantes com comparação temporal quando houver, datas, fontes e explicação concisa do motivo do destaque.
4. **Informação que falta:** fonte sem sincronizar, dado não compartilhado, período sem cobertura ou medicação sem data de início.

Cada destaque oferece **Ver evidência** e, quando houver série, **Ver evolução**. O texto do briefing não é um bloco opaco: suas afirmações se ligam aos mesmos registros usados no histórico, nos gráficos e nas relações.

O exemplo de Daniel pode apresentar a ferritina registrada em 22 ng/mL em outubro/2025 e a evolução documentada de glicemia e LDL. Eventos recentes de wearable só entram se existirem no conjunto recebido. A interface não chama o exame de 2025 de recente por ter sido importado hoje.

### Inspector comum — de onde veio esta informação?

Uma área lateral de detalhes mantém o médico no contexto. Abrir um achado, ponto do gráfico, evento do histórico ou nó do grafo usa o mesmo padrão:

- Registro, valor/unidade ou descrição e faixa de referência quando aplicável.
- Data do evento/coleta separada da data de recebimento/processamento.
- Fonte, laboratório/dispositivo e documento relacionado.
- Histórico ou registros relacionados, com datas.
- Original, quando disponível; se não estiver, dizer que há somente dados estruturados.
- Indicação de informação extraída, relato do paciente ou interpretação produzida pelo sistema.
- Correção/versão do registro, quando fornecida pelo backend.

Ao trocar de aba, preservar paciente e seleção quando fizer sentido. Ao trocar de paciente, limpar os detalhes do anterior. No celular ou tela estreita, o detalhe ocupa uma área dedicada com retorno à posição anterior; não comprimir o conteúdo em uma coluna ilegível.

## 4. Evolução — como isso se comporta no tempo?

A área oferece a seleção de um tema ou medida, um período e os eventos relacionados. Exames e sinais contínuos podem ser consultados juntos, mas usam datas e unidades reais.

- Selecionar biomarcador e consultar seus resultados por data, laboratório e referências daquela medição.
- Escolher sinais disponíveis do wearable e visualizar sua janela de cobertura.
- Usar um intervalo comum para relacionar registros quando as janelas coincidirem; explicar quando não há sobreposição.
- Incluir sintomas e início/ajuste de medicação como eventos somente quando essas datas existirem.
- Abrir um ponto ou intervalo para ver evidências no inspector.
- Alternar para uma tabela de valores, útil para leitura precisa e acessibilidade.

O sistema não transforma lacunas em zeros, não aproxima datas para criar correlação e não compara números de unidades diferentes como se fossem a mesma escala. Faixa laboratorial, mudança numérica e interpretação clínica têm apresentações distintas.

No cenário atual, exames terminam em 2025 e o wearable contém 30 dias relativos à data atual. A interface deve tornar isso evidente. HbA1c sem medição apresenta **Sem resultados disponíveis**; medicamentos sem início conhecido não recebem um marcador inventado.

## 5. Histórico — o registro unificado das fontes

Uma linha do tempo combina documentos, resultados, relatos e eventos enviados pelo backend. Filtros por período, tipo e fonte permitem localizar um registro específico.

- Um laudo aparece como evento que contém seus biomarcadores, evitando duplicar uma entrada para cada resultado.
- Um evento de wearable aponta para o período e as leituras que o sustentam.
- Relatos do paciente mantêm autor/origem; o médico não os confunde com condição diagnosticada.
- Eventos usam a data em que aconteceram. Itens recebidos depois mostram também **Recebido em**.
- Correções informadas pelo backend aparecem como atualizações rastreáveis, não como um segundo exame independente.

A lista de fontes informa separadamente última sincronização, último dado disponível e período coberto. Uma fonte conectada pode estar desatualizada. O médico vê o estado da integração; a gestão das conexões do paciente continua em sua própria frente.

## 6. Relações — investigar conexões com contexto

O grafo é uma ferramenta de aprofundamento vinculada ao paciente, não a porta obrigatória para entender seu histórico.

Ao entrar, mostrar um recorte legível dos registros e achados relevantes, com filtros por tema e período. Selecionar um achado em outra área pode abrir esse mesmo recorte em Relações.

Cada nó abre seu detalhe. Cada relação tem um significado legível e acesso às evidências que a sustentam. Diferenciar **fato registrado**, **associação temporal** e **hipótese sugerida pelo sistema**. Não representar uma associação como causa comprovada. Não converter histórico familiar em diagnóstico ativo.

Oferecer uma lista de relações equivalente para navegação por teclado e situações em que o grafo seja pouco legível. Não incluir nós, arestas ou rótulos derivados de categorias não compartilhadas.

## 7. Revisar e retomar o acompanhamento

A ação **Concluir revisão das novidades** registra explicitamente o conjunto revisado por aquele médico. Abrir um paciente, alternar abas ou rolar a página não conclui essa revisão automaticamente.

O backend registra um cursor/revisão do conjunto apresentado, não apenas a hora do clique. Assim, dados que chegam durante a leitura continuam novos. Essa ação organiza o trabalho do médico; não é uma declaração automática de normalidade, diagnóstico ou conduta.

Ao voltar, a carteira mostra as mudanças desde esse ponto: novos documentos, correções, eventos e atualizações relevantes. Atualizações de um mesmo documento são agrupadas. A revisão de um médico não altera a de outro.

Se houver conteúdo novo enquanto o médico investiga, mostrar um aviso **Novas informações disponíveis**. Atualizar mediante ação preserva filtros e seleção; não reorganizar o gráfico e o briefing silenciosamente durante a leitura.

Anotações clínicas e exportação podem complementar esse trabalho posteriormente. Não são necessárias para manter o ponto de revisão. Prescrição, solicitação de exames e edição do prontuário não foram incluídas no escopo.

## 8. Compartilhamento e estados de confiança

| Situação | Experiência proposta |
| --- | --- |
| Médico autenticado sem pacientes | Explicar a autorização pelo paciente e oferecer inclusão por QR/link. |
| Convite aguardando confirmação | Mostrar a pendência e o próximo passo; não liberar histórico contínuo. |
| Paciente sem exames ou wearable | Informar o que ainda não foi recebido; não preencher com dados demonstrativos. |
| Categoria não compartilhada | Mostrar **Não autorizado pelo paciente**, distinto de ausência de dados. |
| Fonte antiga ou sem sincronização | Informar a data e a cobertura daquela fonte. |
| Briefing indisponível | Manter acesso autorizado ao histórico e às séries; informar que a síntese está indisponível. |
| Backend indisponível | Erro com tentativa de recuperação. Não confirmar revisão nem trocar silenciosamente para dados demo. |
| Autorização expirada/revogada | Remover conteúdo clínico e solicitar nova autorização pelo paciente. |
| Sessão de login encerrada | Exigir nova identificação e revalidar os vínculos no retorno. |

Permissões ficam disponíveis em qualquer área: escopos, duração e situação do acompanhamento. Ampliar acesso solicita nova autorização ao paciente. Mostrar a ação de solicitar, sem permitir que o médico conceda acesso a si mesmo.

O estado de autenticação e o de autorização clínica são independentes. Revogação deve ser refletida durante a sessão e em todas as projeções dos dados. Conteúdo restrito não permanece em prévias da carteira, síntese, relações, citações ou caches.

## Organização e rotas propostas

| Superfície | Caminho proposto | Papel |
| --- | --- | --- |
| Entrada do médico | `/doctor` | Identificação e entrada no espaço de trabalho. |
| Carteira | `/doctor/patients` | Busca, novidades e situação dos vínculos. |
| Paciente | `/doctor/patients/[patientId]` | Resumo inicial e áreas de evolução, histórico e relações. |
| Entrada de convite temporário | `/doctor/consultation/[token]` | Resolver o convite e apresentar o modo autorizado; oferecer solicitação de vínculo quando aplicável. |
| Alias de compatibilidade | `/consultation/[token]` | Mesmo fluxo de resolução do link anterior. |

O contrato de navegação ainda não é uma decisão final de layout visual. A paleta e o vocabulário do mobile são a referência para continuidade entre os produtos. Priorizar leitura de valores, datas, tabelas e fontes no computador do consultório; oferecer adaptação estrutural para tela estreita e navegação por teclado.

## Impacto no escopo e no contrato

A carteira contínua amplia os RF do repositório. RF-M01 a RF-M04 continuam presentes, mas não descrevem identidade médica, vínculos persistentes ou revisão longitudinal. Não tratar esses comportamentos como simples persistência do token temporário no navegador.

| Capacidade necessária | Web — responsabilidade de Marcus | Dependência do backend/mobile |
| --- | --- | --- |
| Identidade do médico | Tela/fluxo de entrada e sessão autenticada | Autenticação e identidade estável do profissional. |
| Carteira | Lista, busca, filtros e estados de acesso | Listagem limitada aos vínculos do médico. |
| Autorização contínua | Receber convite, solicitar vínculo e mostrar estados | Confirmar no mobile e persistir o consentimento por médico/paciente, escopos e duração. |
| Contexto unificado | Resumo, histórico, inspector, séries e relações | Retornar registros autorizados, origens, datas, referências e sínteses. |
| Novidades e revisão | Agrupamento legível, concluir revisão e retomar | Versionamento, cursor por médico/paciente e persistência da revisão. |
| Revogação/atualização | Revalidar e retirar conteúdo, mostrar novos dados | Propagar estado do vínculo e revisão do conjunto clínico. |

O contrato deve definir:

- `doctorId`, `patientId`, `grantId`, status, escopos e datas do vínculo; convite e sessão com identificadores/expirações próprios.
- Listagem de pacientes autorizados e resumo das novidades por médico. Convites pendentes não retornam histórico clínico contínuo.
- Snapshot com revisão estável dos dados, fontes, evidências e períodos cobertos. Dados básicos não dependem de o motor de síntese estar disponível.
- Medições com ID, documento de origem, data de coleta/evento, data de ingestão, unidade e referência. Eventos e relações usam as mesmas identidades.
- Diferenças desde o cursor do médico, incluindo correções e remoções autorizadas; agrupamento por documento/evento.
- Confirmação de revisão com o cursor visto na interface. Novidades concorrentes não são marcadas como revisadas por engano.
- Fluxo de solicitação/aprovação/revogação do vínculo e detecção de mudanças durante uma sessão.
- Aplicação dos escopos em todas as projeções, sem vazamento por contagem, texto derivado, citação ou grafo.
- URLs de API/web, formato de erros e mecanismo de autenticação; respostas clínicas sem cache e sem tokens/dados clínicos em localStorage.

As operações são propostas de contrato, não endpoints já existentes. Fastify, banco, GraphRAG, HNSW, MCP e ingestão não serão implementados nesta frente web.

## Sequência de desenvolvimento por dependência

1. **Contrato e cenário de uso:** identidade, vínculo, snapshot e revisão. Preparar exemplos de paciente com novidades, carteira vazia, acesso pendente, restrito e revogado.
2. **Carteira e entrada de paciente:** integrar autenticação, convites e estados. O vínculo contínuo deve funcionar entre sessões e não depender da memória local da web.
3. **Resumo, histórico e inspector:** estabelecer uma única forma de abrir evidências e navegar pelas fontes. Esta é a base comum das outras visualizações.
4. **Evolução e relações:** construir em paralelo após estabilizar as entidades e o inspector; ambas partem do mesmo conjunto de dados.
5. **Retomada e sincronização:** persistir revisão, apresentar novidades concorrentes e refletir alterações de consentimento.
6. **Integração e validação:** verificar o percurso entre dispositivos e a recuperação dos estados de falha. Prazo final informado: sábado; ordenar entregas por essas dependências.

O coordenador mantém contrato, navegação e integração. Gráficos e grafo podem ser delegados com arquivos delimitados. Alinhar mudanças do mobile com seu responsável/AGY; usar Kiro em tarefas delimitadas se disponível e evitar Claude Code conforme orientação do usuário. Uma frente altera dependências e arquivos comuns por vez.

## Critérios de conclusão da experiência principal

- Médico autenticado retoma a própria carteira após sair e entrar novamente.
- Paciente só entra em acompanhamento ativo após autorizar aquele médico, escopos e duração.
- Carteira distingue histórico inicial, novidades não revisadas e situação do acesso.
- Todo destaque rastreável abre o registro certo; valores, datas e fontes coincidem entre as áreas.
- Médico compara evolução sem dados inventados ou deslocados no tempo.
- Concluir revisão afeta somente o cursor daquele médico e não absorve dados recebidos depois do snapshot.
- Restrições e revogação são aplicadas também a prévias, briefing, buscas, contagens e grafo.
- Sessão temporária e acompanhamento contínuo têm comportamentos distintos e compreensíveis.
- Typecheck, lint, build, testes de autorização/revisão e verificação de navegação e acessibilidade são executados na implementação.

## Fallback e limitações atuais

O fallback permanece uma modalidade separada de demonstração/desenvolvimento, com dados identificados como sintéticos e comportamento determinístico. Ele usa os mesmos contratos e componentes, sem preencher lacunas de pacientes reais nem transformar erros de autorização em acesso demo.

A inspeção inicial de `origin/main`, no commit `30ca3ed`, encontrou apenas documentação e o app mobile. As dependências já levantadas permanecem: tokens sem validação real, toggles sem efeito sobre autorização, revogação local, laudos com URIs fictícias, falta de vínculo documento–medição e cenário wearable com HRV negativo. Os resultados iniciais de HbA1c e datas de medicação não existem.

Além dessas correções externas, a carteira contínua requer identidade, consentimento persistente e revisão por médico no backend. Nome/canal do responsável pelo backend, método de autenticação, duração padrão do vínculo e ambiente de hospedagem ainda precisam de alinhamento. Esses pontos não impedem revisar a experiência, mas precisam ser resolvidos para implementá-la de ponta a ponta.

Este documento planeja a experiência e suas dependências. Nenhuma aplicação foi implementada ou validada funcionalmente nesta etapa.
