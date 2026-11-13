# Residência de dados e consulta institucional

Data: 13/11/2026. **Decisão de desenho para implementação futura; não descreve integrações existentes.** Sem blockchain.

O pedido amplia o desenho do backend para intercâmbio entre instituições. A web continua consumindo o [contrato médico temporário](doctor-backend-contract.md), sem assumir guarda de dados, autorização clínica ou cobrança. O [fluxo institucional](institutional-access-flow.md) e a [pesquisa institucional](institutional-research.md) complementam esta decisão.

## 1. Decisão

Adotar **residência híbrida por origem e permissão**, com duas regras claras:

1. **Cofre pessoal central:** cópias enviadas pelo paciente e seus resultados estruturados podem compor um histórico longitudinal mantido pela plataforma. A guarda precisa estar explicitada ao paciente e ter ciclo de vida definido.
2. **Consulta institucional na origem:** bases e originais de laboratórios, hospitais e clínicas permanecem nos sistemas de origem. A plataforma solicita somente o recorte autorizado para um atendimento, estrutura o necessário e mantém dados institucionais em cache restrito àquele contexto. Não replica a base nem forma um histórico institucional permanente por padrão.

Consentimentos, políticas de acesso, referências de origem, auditoria e medição de uso ficam centralizados. Para o controle do produto, tratar esses metadados como sensíveis: um vínculo entre pessoa e instituição já pode revelar contexto de saúde. Identificadores pseudônimos e embeddings não serão tratados como dados anônimos por conveniência de implementação. Nenhuma projeção pode revelar existência, nomes ou contagens de fontes negadas.

Consultar na origem **não significa que os dados nunca saem da instituição**: o recorte selecionado trafega até o hub e é processado temporariamente. A diferença escolhida é não replicar a base ou guardar esses recortes indefinidamente. Essa transferência e seus destinos de processamento precisam constar das condições da integração.

**Centralizar a inteligência não exige centralizar todas as bases.** O módulo que prepara o contexto reúne fontes permitidas e entrega uma projeção uniforme ao médico, independentemente de um item vir do cofre pessoal ou de uma fonte institucional consultada. A interface esconde a implementação da busca, mas preserva origem, versão, cobertura e indisponibilidade.

Esta escolha responde à resistência de uma instituição em entregar sua base: ela pode participar fornecendo acesso limitado por paciente, finalidade, período e categoria. Isso reduz a transferência necessária, mas não assegura adesão comercial nem obriga que compartilhamentos externos passem pela plataforma.

## 2. Alternativas consideradas

| Alternativa | Vantagem | Custo e limite | Decisão |
| --- | --- | --- | --- |
| Centralizar cópias de todas as instituições | Histórico local disponível e processamento uniforme, quando a cópia está atualizada. | Exige aceitação de réplica, sincronização de correções, regras de retenção e revogação de todos os derivados. Mantém a objeção de entregar a base. | Não adotar como padrão institucional. |
| Consultar tudo na origem, sem cofre pessoal | Menor replicação institucional e atualização determinada pela fonte. | O paciente continua precisando guardar papel/PDF; cada atendimento depende da disponibilidade das fontes; dificulta continuidade sem integrações. | Insuficiente para o produto atual. |
| Cofre pessoal central + consulta institucional sob demanda | Aproveita uploads já previstos e permite participação institucional sem cópia integral. | Exige distinguir proveniência e ciclo de vida; conectores indisponíveis geram cobertura parcial; inteligência entre atendimentos não é permanente por padrão. | Adotar, por etapas. |

## 3. O que existe agora e o que será construído

O [README](../README.md), o [plano de arquitetura](../architecture-plan.md) e o [contexto do produto](../PRODUCT.md) descrevem ingestão central e histórico pessoal. A [entrega da web](doctor-web-delivery.md) registra uso de mocks/double HTTP e integração real pendente. Este documento não confirma banco de produção, backend clínico, conector, contrato com instituição ou capacidade de consultar uma base externa.

**MVP:** desenhar e integrar primeiro o cofre pessoal, extração, proveniência e controle de acesso com o backend responsável. Enquanto não houver conector real, somente uploads ou dados demonstrativos explicitamente isolados podem alimentar o cenário. Identificar uma fonte pelo nome em uma fixture não significa ter integração ou verificar a autenticidade do emissor.

**Primeira integração institucional:** uma instituição, um tipo de documento/resultado e um recorte assistencial explícito. Consultar na origem e aplicar o cache desta proposta. Não construir uma malha de conectores, um novo banco de grafo ou um índice institucional global antes dessa necessidade concreta.

**Materialização longitudinal excepcional:** somente quando houver acordo específico que permita guardar determinados registros institucionais no cofre e política de correção, retenção e acesso. Essa modalidade exige decisão própria; não é consequência automática do pagamento de uma consulta nem do consentimento para visualizar um pacote.

## 4. Matriz de guarda e retenção proposta

Os prazos abaixo são **padrões de engenharia propostos para um piloto**, não prazos legais, SLA ou políticas já implantadas. Precisam ser ratificados com os responsáveis clínico, jurídico, segurança e backend antes de dados reais. Quando uma finalidade de retenção independente for identificada, ela deve ser documentada por categoria; não se cria retenção ilimitada como precaução genérica.

| Categoria | Onde fica e quem acessa | Retenção e término propostos |
| --- | --- | --- |
| Original enviado pelo paciente | Cofre pessoal central, segregado por paciente. Paciente e destinatário com autorização atual; operação humana somente excepcional, justificada e auditada. | Enquanto o cofre estiver ativo e a guarda autorizada. Solicitação validada de exclusão bloqueia novas leituras de imediato; remoção do armazenamento ativo em até 24h, ressalvados itens com retenção independente previamente definida. Backups expiram em até 30 dias. |
| Resultados estruturados extraídos de upload pessoal | Mesmo cofre, ligados a documento, versão, campo de origem e estado de revisão. | Mesmo ciclo do original que os sustenta. Apagar o original não deixa um histórico extraído órfão como cópia permanente escondida. A retenção de um resultado separadamente exige decisão explícita e nova proveniência. |
| Leituras pessoais de wearable | Cofre pessoal central, com fonte, instante e cobertura. | Mesmo ciclo de guarda pessoal, sem inferir acesso institucional por ter conexão com o wearable. Regras de agregação e volume serão definidas com a ingestão real. |
| Base e original institucional | Sistema da instituição de origem. A plataforma usa referência restrita e stream autorizado quando necessário. | A plataforma não define a retenção do sistema de origem. Não guarda uma segunda cópia durável por padrão. O buffer de transporte termina ao concluir/cancelar a operação. |
| Resultados institucionais normalizados | Cache clínico do backend, isolado por instituição destinatária, paciente, episódio de acesso institucional e revisões de acesso/fonte. Somente o contexto autorizado os usa. | Até **15 minutos** após a obtenção que criou a materialização, reduzidos pelo menor prazo entre sessão, concessões, validade emitida pela fonte e validade do dado. Prazo fixo: ler, atualizar a tela ou confirmar recebimento não reinicia esse relógio. Exclusão lógica imediata após revogação/invalidação; remoção física até o limite do cache. Cache excluído de backups. |
| Snapshot, briefing, relações e outros derivados institucionais | Cache do mesmo contexto, com todas as dependências de evidência identificadas. | Mesmo limite de 15 minutos e mesmas revisões das fontes. Nunca sobrevivem como texto livre ou grafo permanente após a expiração de suas dependências. Conteúdo já recebido no navegador segue também o ciclo de revalidação da web. |
| Índices e embeddings de documentos pessoais | Índice restrito ao paciente, se necessário ao caso de uso efetivamente implementado. | Mesmo ciclo das evidências pessoais; exclusão/correção invalida o índice derivado. Não compartilhar um índice clínico entre pacientes. |
| Índices e embeddings de conteúdo institucional | Não criar índice persistente por paciente/instituição por padrão. Quando necessário ao processamento de um pacote, usar o cache do contexto. | Mesmo prazo do cache clínico, sem reaproveitar o vetor após apagar o texto de origem. Um catálogo geral de termos clínicos sem dados de pacientes é categoria separada. |
| Identificação da origem e vínculo de identidade | Diretório mínimo central e protegido: instituição, identificador local opaco, método/estado de verificação, versão e referência de política. Não retornar vínculos de outras instituições a solicitantes sem permissão. | Enquanto a conexão autorizada estiver ativa. Ao encerrar, remover o vínculo operacional e guardar somente o identificador necessário à trilha pelo prazo abaixo. Não formar um diretório clínico global de pessoas. |
| Consentimentos, concessões e políticas | Registro central de escopo, destinatário, finalidade, duração, emissor, revisão e decisão. Backend de autorização e auditores designados; médico vê somente seu contexto. | Vigentes enquanto o vínculo estiver ativo. Histórico mínimo por **180 dias após encerramento** no piloto; remover depois, salvo política de retenção independente validada. Revogar não apaga o fato de ter existido uma autorização. |
| Auditoria de acesso e processamento | Registro central com IDs opacos, ator, instituição, finalidade, decisão, referências/versionamento e horário. Sem valores clínicos, texto de laudo, prompt, resposta de IA ou token. | **180 dias** após o evento no piloto; acesso separado do atendimento. Após expirar, remover também os vínculos de correlação que não tenham outra finalidade ativa. |
| Medição e reconciliação de cobrança | Registro central do evento lógico, instituição pagadora, produto, atendimento, estado, revisões, chave de idempotência e identificador do pacote. Sem exames, diagnóstico ou corpo clínico. | **180 dias após fechamento/conciliação** no piloto; retenção contábil/fiscal final fica pendente de definição específica. Não ativar faturamento real com essa pendência. |

Para registros duráveis sujeitos a backup, o prazo de backup proposto é de até 30 dias após sua remoção do armazenamento ativo. Uma restauração deve reaplicar a lista de exclusões e revogações antes de liberar leituras; não reintroduz dados apagados. O cache institucional não participa dessa rotina de backup.

Revogar **compartilhamento com um destinatário** bloqueia esse destinatário; não apaga automaticamente o cofre do paciente nem as concessões independentes de outros destinatários. Excluir uma evidência do cofre é uma intenção diferente, com invalidação de todos os seus derivados. Encerrar uma conexão institucional também é distinto de revogar apenas um médico.

## 5. Regras para preparar e servir o contexto

O módulo de preparação do contexto recebe a identidade autenticada do solicitante, o paciente já vinculado, o episódio de acesso institucional, o produto e os escopos autorizados. Devolve um snapshot autorizado ou estados explícitos de ausência/indisponibilidade. Buscar dados, interpretar documentos e decidir o que pode sair são parte da implementação desse módulo; a web não repete essas decisões.

1. Validar acesso atual antes de consultar a fonte. Permissão para consultar não implica permissão de guardar, exportar, treinar modelos ou redistribuir.
2. Confirmar a correspondência do paciente por vínculo verificado. Nome semelhante, embedding ou busca aproximada nunca resolvem identidade por conta própria. Ambiguidade exige confirmação pelo fluxo acordado; não executar uma busca clínica especulativa.
3. Solicitar o menor recorte necessário. Categoria, período, finalidade e destinatário integram o contexto. Dados administrativos e clínicos têm projeções separadas.
4. Receber conteúdo com origem, versão, data clínica, data de obtenção e validade declarada. Se a fonte não fornece versão estável, guardar uma referência de conteúdo restrita para distinguir revisões, sem usá-la como prova de autenticidade.
5. Extrair e normalizar preservando unidade e referência efetiva. Campo ilegível fica ausente ou pendente de revisão; incerteza da extração não vira fato confirmado.
6. Produzir derivados somente com fontes autorizadas e referências completas. Cada frase, medida ou relação precisa identificar as evidências que a sustentam. Se não for possível remover a contribuição de uma fonte, invalidar a projeção inteira e regenerar.
7. Revalidar acesso antes de entregar o snapshot ou iniciar o stream. Toda leitura subsequente verifica as concessões centrais e a autorização válida da fonte. A confirmação autenticada de recebimento também revalida a elegibilidade e a revisão do pacote, conforme o fluxo institucional. O TTL do cache não substitui uma autorização vigente.
8. Expiração ou alteração de revisão invalida o snapshot. Nova consulta exige revalidar a origem e obter uma materialização válida; copiar o cache antigo para uma chave nova não renova o prazo. Regenerar dentro do mesmo episódio de acesso institucional é atualização do contexto, não motivo automático para uma nova unidade cobrável; o [fluxo de cobrança](institutional-access-flow.md) define a deduplicação.

A chave de cache inclui ao menos destinatário institucional, paciente, episódio de acesso institucional, produto/recorte, revisões de acesso e versões das fontes. Não compartilhar um resultado clínico de cache entre duas instituições, médicos com permissões diferentes ou pacientes. Usar autorização antes da leitura, e não apenas como filtro de exibição posterior.

O navegador mantém o resultado somente em memória e as respostas clínicas continuam com `no-store`, conforme o rascunho médico. O backend pode manter o cache restrito descrito acima; isso não habilita cache HTTP público nem persistência no navegador. Jobs de extração não registram arquivos, prompts ou resultados em logs de diagnóstico.

Usar transporte cifrado e autenticado entre os participantes, destinos de fontes previamente cadastrados e armazenamento cifrado com controle de acesso segregado, inclusive nos backups duráveis permitidos. Documentos não escolhem URLs de integração nem fornecem instruções executáveis. Chaves e credenciais ficam fora dos registros clínicos, de auditoria e de cobrança; a implementação concreta desses controles precisa ser verificada na integração.

Um modelo de IA externo é outro destino de dados e precisa de condições verificadas de contratação, autorização de processamento, localidade, retenção, treinamento e descarte. Transmitir somente conteúdo permitido para aquela finalidade e por configuração aprovada; não presumir conformidade da API Gemini ou de outro fornecedor citado no plano anterior. Não promover conteúdo institucional à memória do assistente, ao cofre pessoal ou a uma base de treinamento. Enquanto essas condições não estiverem definidas, a projeção que depende do modelo permanece indisponível; dados já estruturados e autorizados podem continuar disponíveis sem ela.

## 6. Revogação, correção e disponibilidade

| Situação | Comportamento escolhido |
| --- | --- |
| Paciente revoga acesso do hospital B enquanto um pacote está sendo gerado | Incrementar revisão de acesso, cancelar ou descartar o resultado pendente e bloquear entrega. Invalidar cache e derivados daquele destinatário. Não gerar cobrança por pacote não entregue/aceito, conforme fluxo institucional. |
| Paciente revoga depois de o médico receber o pacote | Bloquear novas leituras e streams; sinalizar a mudança à web, que limpa seu estado na revalidação. Não prometer recolher arquivo já exportado ou apagar o prontuário independente do destinatário. Eventual guarda pelo destinatário precisa ter condições próprias, não o TTL do cache da plataforma. |
| Consentimento vence antes dos 15 minutos do cache | O prazo menor prevalece. Requisição subsequente é negada; expirar cache não renova a concessão e atualizar a tela não reinicia o prazo. |
| Fonte institucional fica offline | Retornar `unavailable` para o recorte que não pôde ser obtido. Um snapshot ainda dentro da validade só pode ser servido quando também houver autorização da fonte ainda válida; exibir quando foi obtido. Se a autorização precisar de verificação online que falhou, bloquear o recorte. Não usar cache expirado como se fosse dado atual. |
| Uma fonte funciona e outra está indisponível | Entregar as seções autorizadas utilizáveis com cobertura parcial explícita. Não declarar pacote completo nem cobrar como completo. Ausência de fonte não é ausência de doença ou de resultado. |
| A fonte corrige um exame | Nova versão substitui a projeção corrente; invalidar caches, citações, resumos, relações e vetores dependentes da anterior. Não contar a correção como outro exame. Referência antiga não passa silenciosamente a devolver o novo binário. |
| Correção não é comunicada em tempo real | O limite de cache restringe a janela de desatualização; nova obtenção compara versões. A interface informa data de obtenção e não promete atualização instantânea. Detectar correções sem webhook depende do protocolo acordado com a fonte. |
| O paciente enviou uma foto e a instituição retorna o mesmo laudo | Preservar as duas proveniências e reconciliar somente com identificadores/documento compatíveis. Similaridade textual não prova duplicidade. Não elevar automaticamente a confiança da foto anterior. |
| Fontes discordam ou usam unidades incompatíveis | Mostrar versões e origens, sem calcular média ou escolher uma como verdade silenciosamente. Não plotar na mesma série valores sem equivalência validada. |
| Resultado clínico antigo é obtido hoje | Manter data clínica antiga e horário de obtenção atual. Não renomear o resultado como atual nem inferir estado clínico presente. |
| O processamento só extrai parte de um documento | Marcar cobertura e estado de revisão. Não fabricar campos nem fazer inferências que dependam do trecho ausente. |
| Há pedido de exclusão e retenção independente de um registro | Remover o uso corrente e restringir o registro à finalidade documentada de retenção. Não mantê-lo acessível ao médico apenas porque existe uma cópia retida. |

O desenho herda do [contrato temporário](doctor-backend-contract.md) a revalidação da web a cada 15 segundos visíveis e ao retomar a aba, com validação no servidor em toda leitura. Isso é hipótese de implementação, não garantia de revogação instantânea nem controle sobre uma cópia já recebida. Não altera o TTL máximo já proposto para convite pontual nem converte consentimento pessoal em permissão institucional irrestrita.

## 7. Critérios para aceitar a implementação

Antes de afirmar a primeira integração institucional como concluída, demonstrar:

- Um upload pessoal acessível pelo paciente e apenas pelos destinatários autorizados, com proveniência de extração e acesso ao original disponível ou ausência explícita.
- Uma consulta real à fonte com recorte mínimo e identificação verificada; paciente ambíguo bloqueado antes de retornar conteúdo clínico.
- Cache expirando pelo menor prazo, sem cópia durável ou backup institucional implícito, e sem reutilização entre contextos de autorização diferentes.
- Revogação durante extração impedindo a entrega e invalidando todos os derivados; resposta atrasada não repopula o estado da web.
- Fonte offline e correção de exame produzindo estados e versões coerentes, sem fallback sintético automático.
- Auditoria e medição suficientes para investigar um evento sem registrar seu conteúdo clínico ou segredos.
- Exclusão do cofre propagada a originais, resultados, índices e backups segundo a política acordada, inclusive em restauração.
- Ausência de segunda cobrança ao regenerar um snapshot expirado dentro do mesmo episódio de acesso institucional elegível; nenhuma atualização de tela prolonga o TTL da materialização anterior.

Não há testes de execução novos neste documento: ele define decisões e critérios. Conectores, banco, processamento de IA, cobrança e aplicação dos prazos precisam ser implementados e verificados com os respectivos responsáveis.
