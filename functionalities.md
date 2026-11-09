# Especificação Funcional Priorizada: Hub de Saúde Pessoal

Este documento consolida as funcionalidades do sistema divididas entre os dois perfis de usuário (**Paciente / Mobile** e **Médico / Web**), ordenadas estritamente por prioridade de execução: do **MUST HAVE** (essencial para cumprir o edital e garantir a live demo de 10 minutos) ao **NICE-TO-HAVE** (recursos complementares de produto e pós-demo).

---

## PARTE 1: Funções do Paciente (App Mobile - React Native)

### 🔴 MUST HAVE (Obrigatório para a Live Demo)

#### RF-P01: Upload & Extração Multimodal de Laudos (O Passado)
* **Descrição:** O usuário fotografa um exame impresso ou anexa um arquivo PDF/imagem. A IA multimodal (Gemini) lê o documento e extrai de forma estruturada: nome do laboratório, data da coleta, biomarcadores identificados, valores numéricos, unidades e intervalos de referência.
* **Regra de Negócio Branda (RN01 - Tolerância a Ruído):** A IA aceita laudos amassados, fotos com sombras ou em ângulos inclinados. Se um campo estiver ilegível, extrai os demais e sinaliza o campo ausente sem travar o processamento.
* **Regra de Negócio Branda (RN02 - Padronização HNSW):** Variações textuais de um mesmo exame (ex: *"Glicemia de Jejum"*, *"Glicose Sérica"*) são mapeadas automaticamente para uma entidade canônica comum.

#### RF-P02: Linha do Tempo Viva de Biomarcadores
* **Descrição:** Tela que plota a evolução histórica de cada biomarcador (ex: histórico de Glicose, Colesterol ou TSH ao longo de meses/anos), com faixas coloridas indicando os limites de normalidade do laboratório.
* **Regra de Negócio Branda (RN03 - Histórico Contínuo):** Cada novo exame inserido adiciona pontos numéricos na série temporal correspondente, sem sobrescrever aferições anteriores.

#### RF-P03: Injeção & Simulação de Dados de Wearables (O Presente)
* **Descrição:** Botão/serviço no app que injeta dados contínuos de relógios inteligentes (Frequência Cardíaca/BPM, HRV, Sono Profundo/REM e SpO2) com um cenário fisiológico controlado para a demonstração (ex: 30 dias de histórico contendo episódios de taquicardia noturna).
* **Regra de Negócio Branda (RN04 - Determinismo da Demo):** O modo de simulação garante dados reprodutíveis e estáveis em palco, sem dependência de pareamento físico Bluetooth ou internet de alta latência.

#### RF-P04: Detecção & Notificação de Alertas Proativos
* **Descrição:** O app identifica padrões anômalos nas leituras contínuas e exibe um card de alerta em destaque recomendando a busca por orientação médica (ex: *"Detectamos 3 episódios de frequência cardíaca elevada em repouso nesta semana"*).
* **Regra de Negócio Branda (RN05 - Limiar de Anomalia):** Disparo de alerta quando BPM em repouso ultrapassa 100–110 por mais de 10 minutos sem registro de atividade física associada.

#### RF-P05: Chat Pessoal Confiável com Hybrid GraphRAG
* **Descrição:** Interface de chat onde o paciente tira dúvidas sobre seus sintomas e exames. O assistente responde cruzando os dados reais dos laudos com as leituras dos wearables.
* **Regra de Negócio Branda (RN06 - Salvaguarda Ética):** O chat nunca fornece diagnósticos definitivos; ele contextualiza achados e orienta formalmente a consulta médica.

#### RF-P06: Geração de Acesso Efêmero via QR Code (Open Health)
* **Descrição:** O paciente clica em *"Compartilhar com meu Médico"*, gerando na tela do celular um QR Code de alta densidade (e link de contingência) contendo um token assinado (JWT) para leitura pelo médico no consultório.
* **Regra de Negócio Branda (RN07 - Expiração Padrão):** O token nasce com validade padrão de 2 horas e permissão estrita de somente-leitura (Read-Only).

---

### 🟡 NICE-TO-HAVE (Secundário / Pós-Demo)

#### RF-P07: Revisão Manual de Dados Extraídos
* **Descrição:** Tela intermediária onde o usuário confere os valores lidos pelo OCR antes de salvar.
* *Nota de Prioridade:* Na demo, o fluxo pula direto para a confirmação automática para economizar tempo de palco.

#### RF-P08: Conexão Nativa em Segundo Plano com Apple Health / Health Connect
* **Descrição:** Sincronização em background direto das APIs nativas do iOS/Android para relógios reais.
* *Nota de Prioridade:* Substituído com total fidelidade pelo simulador determinístico (RF-P03) durante a apresentação.

#### RF-P09: Cadastro Formal de Usuário & Login Social
* **Descrição:** Telas de cadastro com email/senha, validação por SMS ou login com Apple/Google.
* *Nota de Prioridade:* Na demo, o app já inicia com a sessão ativa de um paciente fictício (*"Daniel, 32 anos"*).

#### RF-P10: Painel de Revogação & Gestão de Agentes MCP
* **Descrição:** Tela para visualizar quais copilotos de IA externos ou médicos possuem autorização ativa, permitindo revogação instantânea com um clique.
* *Nota de Prioridade:* A funcionalidade do servidor MCP roda no backend; a interface visual de governança no app mobile é secundária para o pitch inicial.

#### RF-P11: Seletor de Tempo de Expiração do Compartilhamento
* **Descrição:** Dropdown para o paciente escolher entre 1h, 4h ou 24h de validade para o QR Code.
* *Nota de Prioridade:* O valor fixo de 2h atende perfeitamente ao caso de uso de consulta médica.

---

## PARTE 2: Funções do Médico (Cockpit Web - React / Next.js)

### 🔴 MUST HAVE (Obrigatório para a Live Demo)

#### RF-M01: Acesso Efêmero Zero-Login via QR Code / Magic Link
* **Descrição:** O médico aponta a câmera do notebook para o QR Code do paciente (ou clica no link compartilhado) e acessa imediatamente o cockpit clínico sem precisar criar conta ou fazer login.
* **Regra de Negócio Branda (RN08 - Zero Fricção):** A sessão expira quando o tempo do token termina ou quando o médico fecha a aba do navegador.

#### RF-M02: Briefing Clínico Pré-Consulta por IA (GraphRAG)
* **Descrição:** Painel no topo da tela com um resumo executivo de 30 segundos contendo: principais queixas recentes, medicamentos em uso, exames laboratoriais alterados e anomalias registradas pelos wearables.
* **Regra de Negócio Branda (RN09 - Rastreabilidade):** Cada ponto destacado no resumo referencia a data e o laudo de origem.

#### RF-M03: Painel de Séries Temporais Cruzadas (Evolução Clínica)
* **Descrição:** Gráficos interativos sincronizados que cruzam a evolução de exames históricos (ex: Colesterol e Glicemia) com as séries contínuas dos wearables (BPM e HRV dos últimos 90 dias) e marcadores de início/troca de fármacos.
* **Regra de Negócio Branda (RN10 - Correlação Visual):** Permite identificar visualmente se o início de um remédio gerou melhora no exame laboratorial ou efeitos colaterais registrados no relógio.

#### RF-M04: Visualizador Interativo do Grafo Clínico
* **Descrição:** Mapa de nós e conexões renderizado na tela (`@xyflow/react`) mostrando as relações: `Paciente -> Condição -> Medicamento -> Alerta de Wearable -> Exame`.
* **Regra de Negócio Branda (RN11 - Exploração Não-Linear):** O médico pode clicar em qualquer nó para inspecionar os detalhes clínicos e valores registrados.

---

### 🟡 NICE-TO-HAVE (Secundário / Pós-Demo)

#### RF-M05: Visualização do Laudo Original (PDF / Imagem)
* **Descrição:** Modal que abre a digitalização original do laudo laboratorial ou a foto tirada pelo paciente para checagem de assinatura médica e selo do laboratório.
* *Nota de Prioridade:* Para a live demo, o foco é a visualização dos dados estruturados e do gráfico.

#### RF-M06: Exportação de Sumário Clínico em PDF
* **Descrição:** Botão para gerar e baixar um relatório em PDF com o briefing da IA e os gráficos para anexar ao prontuário eletrônico do hospital (PEP).
* *Nota de Prioridade:* Excelente diferencial para o roadmap comercial B2B, mas dispensável para os 10 minutos de apresentação.

#### RF-M07: Bloco de Anotações Clínicas da Consulta
* **Descrição:** Campo de texto simples onde o médico pode registrar notas ou impressões durante o atendimento.
* *Nota de Prioridade:* Prontuários tradicionais já possuem essa área; o valor do produto está na inteligência agregada e não na edição de texto.
