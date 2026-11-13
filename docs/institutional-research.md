# Pesquisa institucional: participantes, pagadores e unidade de serviço

Data: **13/11/2026**. Pesquisa inicial delegada ao `agy`, modelo **`gemini-3.8-flash-high`**; consolidação pelo coordenador após revisão independente por subagente e conferência de fontes primárias. Nenhuma instituição foi contatada.

**Estado:** pesquisa de produto e arquitetura, sem validação comercial ou parecer jurídico. Não há evidência de disposição a pagar registrada no repositório. Não foram confirmados parceiros, credenciais, contratos ou APIs disponíveis ao projeto.

Classificações:

- **Achado documental:** sustentado pelo texto da fonte primária vinculada.
- **Inferência:** interpretação para a decisão, não declaração da fonte.
- **Hipótese de produto:** comportamento ou modelo recomendado para testar.

O [fluxo](institutional-access-flow.md), a [residência](institutional-data-residency.md) e o [glossário](../GLOSSARY.md) registram o desenho consolidado. Blockchain está excluída.

## 1. O que a pesquisa permite afirmar

**Achado documental:** FHIR representa resultados diagnósticos, observações e referências de documentos. Os formatos não concedem acesso a prontuários nem comprovam integração com uma instituição. Fontes: [DiagnosticReport](https://hl7.org/fhir/R4/diagnosticreport.html), [Observation](https://hl7.org/fhir/R4/observation.html) e [DocumentReference](https://hl7.org/fhir/R4/documentreference.html).

**Achado documental:** a RNDS é uma infraestrutura pública de interoperabilidade que contempla instituições públicas e privadas. O Ministério descreve acesso assistencial por profissionais e acesso individual do cidadão via Meu SUS Digital. O guia apresenta integração como trabalho de gestor e integrador. Fontes: [Ministério da Saúde](https://www.gov.br/saude/pt-br/composicao/seidigi/rnds) e [guia RNDS](https://rnds-guia.saude.gov.br/).

**Limite documental:** o [guia REL aberto nesta pesquisa](https://rnds-guia.saude.gov.br/docs/rel/objetivo-rel/) restringe aquele modelo a exames de COVID-19 e Monkeypox. Não comprova disponibilidade de todos os biomarcadores, laboratórios ou históricos para nosso produto. Verificar perfil e cobertura de cada futura integração.

**Inferência:** podemos testar o valor de entregar contexto autorizado e rastreável com menos trabalho de organização. Não há fundamento para prometer exclusividade de tráfego, adesão institucional, economia de minutos ou redução de exames/reinternações sem medição específica.

## 2. Matriz: o que cada participante fornece e recebe

**Fornecer** significa capacidade técnica potencial, condicionada a finalidade, permissões, contratos e disponibilidade. **Receber** é o recorte recomendado pelo produto, não uma conclusão de permissão jurídica geral. Incentivos e barreiras são hipóteses para entrevistas.

| Participante | O que poderia fornecer | O que receberia no desenho | Valor a testar e barreira | Papel comercial sugerido |
| --- | --- | --- | --- | --- |
| Laboratório/diagnóstico | Laudo, resultados estruturados, unidades, referências, datas, identificador e versão do exame; referência do original quando permitida. | Histórico anterior pertinente à realização/interpretação do exame em contexto assistencial autorizado; confirmação de entrega do próprio resultado. Não recebe base de concorrentes. | Menos distribuição manual e melhor contexto comparativo. Integração e perda de relacionamento no portal podem dificultar adesão. Reduzir repetição de exames não é necessariamente incentivo econômico do laboratório. | Fonte candidata; não presumir pagamento para fornecer resultados nem remuneração automática por registro. |
| Hospital/rede assistencial | Documentos de atendimento/alta, resultados, medicações e demais registros previstos no recorte contratado. | Histórico externo autorizado para o atendimento, com evidências, limitações e síntese rastreável. | Menos busca manual e contexto na admissão/continuidade. Integração, governança e aprovação interna podem dificultar o piloto. | Comprador secundário ou parceiro assistencial, após validar o fluxo operacional. |
| Clínica/rede de consultórios | Registros dos próprios atendimentos e documentos elegíveis para o cofre ou uma consulta autorizada na origem. | Pacote pré-consulta com exames externos/pessoais, evolução e síntese com referências. | Testar redução do esforço de organizar documentos. Usar mais um portal pode aumentar o trabalho; adequação ao fluxo real é critério de adoção. | **Comprador inicial recomendado:** a clínica solicitante contrata o serviço para seus profissionais. |
| Operadora/plano | Elegibilidade, procedimentos, autorizações e informações pertinentes aos fluxos regulados de saúde suplementar. | Projeção própria de finalidade validada. O pacote assistencial do médico não é entregue automaticamente a áreas administrativa, atuarial ou comercial. | Patrocínio do cuidado é hipótese separada. Financiar atendimento não equivale a autorização para consultar histórico clínico. | Não priorizar como compradora do pacote assistencial nesta etapa; patrocínio futuro exige segregação de papéis. |
| Prontuário/software integrador | Transporte/exportação de registros de seu cliente, conforme instruções e permissões; não presumir que pode cedê-los em nome próprio. | Contexto autorizado dentro do fluxo do profissional e estado da integração. | Testar incorporação de contexto sem duplicar trabalho. Integração, suporte e custos precisam de negociação. | Canal/integrador possível; licença incorporada é alternativa sem compromisso firmado. |
| Paciente | Fotos, PDFs e registros pessoais que opte por fornecer ao cofre. | Histórico organizado, transparência de acessos e controle de compartilhamento. | Verificar facilidade de envio, correção e autorização sem subordinar seus controles à compra institucional. | Não paga por conceder/revogar acesso no modelo recomendado. Isso é escolha de produto, não evidência de baixa disposição a pagar. |

**Base técnica:** os recursos HL7 acima exemplificam resultados e documentos; a [ANS](https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/) documenta intercâmbio na saúde suplementar. Não pressupor que cada participante exponha todos os registros nesses formatos hoje.

Categorias que não se misturam automaticamente:

- **Assistencial:** resultados, documentos e sínteses destinados ao cuidado no contexto autorizado.
- **Administrativa/regulada:** elegibilidade, autorização, cobrança e informações exigidas no fluxo correspondente. TISS não contém apenas dados financeiros.
- **Pesquisa/análise agregada:** outra finalidade, fora do produto inicial. Remover nomes não comprova anonimização. Não habilitar pesquisa, análise atuarial ou treinamento como consequência implícita do cuidado.

## 3. Quem pagaria primeiro

**Hipótese principal:** uma rede de clínicas ambulatoriais paga pelo serviço que solicita e utiliza com profissionais identificados. O piloto pode começar com uploads pessoais, sem exigir adesão simultânea de várias instituições. Isso combina com a web desenvolvida e testa valor antes de construir muitos conectores.

O gestor da clínica/rede seria o decisor econômico; o profissional é usuário e o paciente controla o compartilhamento previsto. Verificar quem aprova orçamento, opera a integração e assume cada finalidade de tratamento.

**Hipótese secundária:** hospital/rede assistencial interessado em contexto externo num fluxo delimitado. O prontuário pode ser canal posterior. Operadora patrocinadora não herda acesso ao pacote assistencial; esse caso exige avaliação própria.

**Modelo a testar:** contratação B2B com preço/franquia definidos comercialmente e uso reconhecido por episódio. Mensalidade com franquia é compatível com a medição, mas não está escolhida nem precificada. Não há preço unitário, margem ou economia prometida.

**Por que a origem participaria?** Distribuição autorizada mais simples, integração menos trabalhosa ou contexto de outras fontes para seu cuidado assistencial são benefícios a testar. Preservar a base na origem reduz a exigência de réplica, mas não elimina custos, receio concorrencial ou contratos.

### Exemplos comerciais oficiais conferidos

A segunda rodada do `agy` investigou exemplos internacionais. O coordenador abriu as três páginas abaixo e incorporou somente o que o conteúdo sustenta; isso não seleciona fornecedor nem valida compradores no Brasil.

| Fonte primária | Achado documental na página consultada | Limite para nossa decisão |
| --- | --- | --- |
| [Redox — Pricing](https://redoxengine.com/pricing/) | Descreve plataforma com taxa anual, consumo relacionado a volume anual de transações e serviços gerenciados conforme escopo. Publica valores iniciais de alguns planos; não é correto dizer que a página não contém preços. | Exemplo de estrutura que combina plataforma e utilização. Não comprova que episódio clínico seja a unidade adequada ao nosso produto nem fornece nosso preço. |
| [Particle Health — página institucional](https://www.particlehealth.com/) | Oferece dados e insights via integração, incluindo produtos para atenção primária e prontuários. Não foi possível comprovar unidade de cobrança nessa página. | Demonstra posicionamento comercial, não um modelo documentado por paciente/mês ou por consulta. Não extrapolar para todo o site ou contratos privados. |
| [Health Gorilla — página institucional](https://www.healthgorilla.com/) | Apresenta organização e entrega rastreável de registros, com ofertas para prontuários, redes assistenciais e laboratórios. A página inclui publicação de resultados e recuperação de contexto para apoiar solicitação/interpretação de exames. Não identificamos unidade de cobrança nela. | Corrobora exemplos de troca de valor entre atores como posicionamento do fornecedor, sem provar adesão, benefício clínico ou preços no Brasil. |

**Inferência:** um serviço que organiza e entrega contexto é uma proposta comercial observável nesses exemplos; nossa medição por episódio continua sendo hipótese própria. Não atribuir às empresas modelo de paciente/mês, preços por requisição ou ausência geral de preços sem fonte específica.

## 4. O que contaria como consulta cobrável

As regras seguintes são **hipóteses de produto consolidadas com o desenho técnico**, não práticas obrigatórias de mercado nem regras existentes no contrato médico `0.1-draft`.

| Alternativa | Avaliação | Escolha |
| --- | --- | --- |
| Cada requisição HTTP | Cobra polling, paginação e repetição; desalinha preço do resultado. | Rejeitar. |
| Cada token/aba ou janela de duas horas | Confunde duração da autorização com serviço e pode duplicar a unidade ao reabrir. | Não usar o QR/acesso atual como unidade B2B. |
| Paciente ativo mensal | Alternativa de assinatura para acompanhamento; exige definir atividade e valor. | Alternativa futura, não unidade escolhida. |
| Primeiro pacote qualificado com recebimento confirmado no episódio | Mede entrega verificável; exige completude, identidade, confirmação e reconciliação. | **Hipótese inicial escolhida.** |

O [fluxo](institutional-access-flow.md) define qualificação: evidência externa/pessoal, resultados organizados, síntese fundamentada e cumprimento do recorte previamente acordado. Leitura apenas de dados da própria solicitante não qualifica esse produto.

Episódio: **instituição solicitante + paciente + atendimento validado + finalidade assistencial**. A primeira confirmação válida reconhece uma unidade. Trocar aba, recarregar, buscar evidência, renovar cache ou obter nova versão no mesmo episódio não cria outra. O episódio não nasce de identificador livre do navegador.

Erro, acesso negado, identidade ambígua, conteúdo vazio, pacote parcial e recebimento incerto não criam unidade. Uma tentativa sem confirmação não comprova entrega; confirmação não comprova que o médico leu. O desenho trata confirmação repetida, resposta perdida e omissão da confirmação pelo consumidor.

**Custos separados:** medir extração/normalização por documento e preparação/entrega por episódio. Processar um exame não significa consumir uma consulta cobrável. Custos de tentativas sem pacote elegível pertencem à operação e precisam entrar na viabilidade comercial, sem cobrança surpresa por erro.

Não remunerar a origem automaticamente por registro neste primeiro modelo; isso introduziria incentivos e questões jurídicas adicionais sem evidência de necessidade ou adesão.

## 5. Achados regulatórios que delimitam o desenho

### LGPD

**Achado documental:** saúde é dado sensível. O art. 11 contém hipóteses de tratamento, incluindo consentimento específico e situações sem consentimento; não há permissão universal. O §4º limita compartilhamento entre controladores para vantagem econômica e prevê exceções e condições, incluindo portabilidade solicitada pelo titular. O §5º veda a operadoras tratar dados de saúde para seleção de riscos na contratação ou exclusão de beneficiários. Fonte: [LGPD compilada](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), arts. 5º e 11.

**Inferência/pendência jurídica:** chamar a receita de serviço de tecnologia não demonstra licitude. Avaliar operação, finalidades e compartilhamentos concretos. O produto recomenda remunerar processamento/entrega para assistência, sujeito a essa validação; consentimento e pagamento não substituem os demais requisitos.

### Papéis no tratamento

**Achado documental:** a ANPD descreve controlador pelas decisões sobre finalidade e elementos essenciais; operador atua em nome do controlador, segundo instruções. Fonte: [ANPD — Titular de Dados](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados).

**Inferência:** centralizar ou consultar na origem não determina sozinho o papel. Processamento em trânsito também é tratamento. Incluir hub, instituições, integrador e eventual IA externa na avaliação. Não assumir risco jurídico mínimo ou responsabilidade automática apenas pela topologia.

### ANS e TISS

**Achado documental:** TISS é padrão obrigatório de troca eletrônica na saúde suplementar. Inclui ações administrativas, acompanhamento econômico, financeiro **e assistencial**, além da composição do Registro Eletrônico de Saúde. Fonte: [ANS — TISS](https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/), atualizada em 30/09/2026 na consulta.

**Inferência:** não descrevê-lo como estritamente financeiro. Sua existência tampouco comprova que uma integração forneça todos os laudos, wearables ou a linha do tempo desejada. Confirmar mensagens, campos e finalidade disponíveis.

### RNDS, FHIR e auditoria médica

**Achado documental:** HL7 separa representação de consentimento, autorização, auditoria e proveniência; fornece elementos sem impor uma única solução de segurança. Fonte: [FHIR R4 — Security and Privacy](https://hl7.org/fhir/R4/secpriv-module.html). Usar FHIR não implementa automaticamente nossas políticas.

RNDS é referência e possível integração a avaliar, não backend disponível ao projeto. Não prometer acesso universal nem usar página geral como evidência de condições comerciais.

**Correção da pesquisa inicial:** a [Resolução CFM 1.614/2001](https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2001/1614_2001.pdf) está marcada pelo CFM como revogada pela 2.448/2025. Não fundamentamos conclusões atuais nela. Regras e eventuais decisões judiciais de auditoria médica exigem análise específica; esse uso não integra o pacote assistencial inicial.

## 6. Residência após consolidação

**Decisão técnica:** cofre pessoal central para uploads/registros autorizados; bases institucionais na origem, com recortes processados temporariamente e cache restrito de até 15 minutos, sujeito a prazos menores e revalidação. Veja a [decisão completa](institutional-data-residency.md).

O recorte sai da origem para processamento transitório, que precisa estar autorizado. Não conservar resultados, grafos ou embeddings institucionais permanentes por padrão. Réplica longitudinal excepcional exige finalidade e ciclo próprios.

**Tradeoff:** menor exigência de replicação em troca de dependência da disponibilidade e das condições de cada fonte. Não há latência medida nem evidência sobre proporção de hospitais com APIs nesta pesquisa. Sem conector comprovado, o MVP usa uploads; nenhuma consulta federada é presumida.

## 7. Perguntas e critérios para validar com parceiros

Critérios de investigação propostos; nenhuma entrevista ou homologação aqui foi executada.

| Pergunta | Evidência mínima para avançar |
| --- | --- |
| Quem compra na clínica e qual problema pagaria para resolver? | Gestor/profissionais descrevem tarefa e esforço atuais; piloto concreto, preço e disposição a pagar registrados. |
| O que a origem disponibiliza e aceita compartilhar? | Amostra autorizada, formatos, versões, acesso, cache, correção e disponibilidade acordados, sem supor API aberta. |
| Quem recebe cada categoria e com qual finalidade? | Matriz de destinatários/finalidades e papéis validada, incluindo limites da operadora e dos fornecedores. |
| O fluxo econômico/assistencial é juridicamente viável? | Avaliação da operação, art. 11, destinos, retenção e faturamento; mudar o produto se necessário. |
| Qual recorte mínimo torna o pacote útil e elegível? | Exemplos aceitos por profissionais, evidências verificáveis e regras para ausência, conflito e incerteza. |
| Como reconhecer atendimento e confirmar entrega? | Episódio estável, consumidor homologado, recibo e reconciliação; falhas não duplicam unidade. |
| O ganho supera a fricção de outro sistema? | Observar tarefas reais e comparar esforço/tempo, sem presumir benefício clínico por clique. |
| Receita cobre extração, falhas e suporte? | Custos por documento/episódio, taxas de parcial/indisponibilidade e proposta comercial testável. |
| A origem atende disponibilidade e revogação necessárias? | Testar fonte, versões/validades e comportamento offline; definir quando bloquear ou usar cache ainda autorizado. |
| Uma IA externa pode receber o conteúdo? | Condições verificadas de uso, retenção, treino, destinos e exclusão; sem aprovação, síntese dependente indisponível. |

## 8. Limites e conclusão

Começar por clínica/rede assistencial solicitante, uploads pessoais e pacote delimitado. Recomendar serviço B2B por primeiro recebimento confirmado no episódio, quando houver contrato válido, e uma integração institucional na origem antes de expandir.

Não há evidência suficiente para afirmar preços típicos, disposição a pagar de pacientes/médicos, gratuidade de todas as operações RNDS ou unidades predominantes de agregadores privados. As três páginas comerciais conferidas sustentam apenas os exemplos da seção 3; referências genéricas a TEFCA ou fornecedores não comprovam condições para nosso produto nem o mercado brasileiro.

Antes de faturamento real, alinhar produto, episódio, condições das fontes, tratamento e retenção com os responsáveis. O desenho não implementa banco, conectores, faturamento ou nova interface web.

## 9. Fontes primárias efetivamente conferidas na consolidação

Todas abertas em **13/11/2026**. Reconferir normas quando forem usadas para contratar/implementar a operação.

1. [Planalto — LGPD compilada](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm): dados sensíveis e condições do art. 11; sem parecer sobre nosso modelo.
2. [ANPD — Titular de Dados](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados): papéis de controlador e operador.
3. [ANS — TISS](https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/): objetivos administrativos e assistenciais.
4. [Ministério da Saúde — RNDS](https://www.gov.br/saude/pt-br/composicao/seidigi/rnds): finalidade, participantes e modalidades de acesso.
5. [Guia RNDS](https://rnds-guia.saude.gov.br/): participação de gestor e integrador.
6. [Guia RNDS — Objetivo REL](https://rnds-guia.saude.gov.br/docs/rel/objetivo-rel/): limite do modelo consultado a COVID-19 e Monkeypox.
7. [HL7 FHIR R4 — DiagnosticReport](https://hl7.org/fhir/R4/diagnosticreport.html): resultados diagnósticos e representações.
8. [HL7 FHIR R4 — Observation](https://hl7.org/fhir/R4/observation.html): medidas, resultados e limites do recurso.
9. [HL7 FHIR R4 — DocumentReference](https://hl7.org/fhir/R4/documentreference.html): referências a notas, PDFs e documentos.
10. [HL7 FHIR R4 — Security and Privacy](https://hl7.org/fhir/R4/secpriv-module.html): consentimento, autorização, auditoria e proveniência.
11. [CFM — Resolução 1.614/2001, PDF oficial](https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2001/1614_2001.pdf): confirmação de revogação para excluir o uso como norma vigente.
12. [Redox — Pricing](https://redoxengine.com/pricing/): composição de plataforma, consumo e serviços; valores iniciais de planos existem na página.
13. [Particle Health — página institucional](https://www.particlehealth.com/): posicionamento de dados e insights; sem unidade de cobrança comprovada na página.
14. [Health Gorilla — página institucional](https://www.healthgorilla.com/): organização de contexto e ofertas por participante; sem unidade de cobrança comprovada na página.
