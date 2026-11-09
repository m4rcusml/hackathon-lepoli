# Plano Técnico de Arquitetura da Solução: Hub de Saúde Pessoal

Definição arquitetural incorporando o ecossistema multiplataforma (**React Native** no mobile do paciente, **React/Next.js** na web do médico) e a camada de interoperabilidade com **Model Context Protocol (MCP)** para agentes de IA externos.

---

## 1. Visão Geral da Topologia do Sistema

```mermaid
flowchart TB
    subgraph CLIENTS["Camada de Apresentação & Clientes"]
        direction TB
        RN["App Mobile do Paciente\n(React Native / Expo Bare)"]
        WEB["Cockpit Clínico do Médico\n(React / Next.js Web)"]
        AGENTS["Agentes de IA Externos\n(ChatGPT Health, Claude, Agentes Autônomos)"]
    end

    subgraph PROTOCOLS["Protocolos de Acesso & Consentimento"]
        direction TB
        API_GW["REST / GraphQL Gateway\n(Mobile Session Auth)"]
        OH_GATE["Open Health Auth Gateway\n(Token Efêmero / QR Code)"]
        MCP_SRV["Servidor Clínico MCP\n(Model Context Protocol - SSE / JSON-RPC)"]
    end

    subgraph CORE["Core Engine de Inteligência Clínica"]
        direction TB
        LLM_EXT["Extrator Multimodal\n(Gemini 2.5 Flash Structured JSON)"]
        HNSW_RES["Entity Resolution Engine\n(pgvector HNSW Matcher)"]
        ANOM_WORKER["Worker de Anomalias Contínuas\n(Série Temporal -> Eventos de Grafo)"]
        GRAPHRAG["Motor Hybrid GraphRAG\n(Busca Vetorial + Traversal de Nós + Séries Numéricas)"]
    end

    subgraph STORAGE["Camada de Persistência Híbrida (PostgreSQL / Supabase)"]
        direction TB
        TS_STORE[("Tabelas de Série Temporal\n(Leituras Brutas de Wearables + Valores de Laudos)")]
        KG_STORE[("Tabelas de Grafo Clínico\n(Nós: Exames, Remédios, Alertas, Condições / Arestas)")]
        VEC_STORE[("Índice Vetorial HNSW\n(Embeddings de Biomarcadores & Laudos Textuais)")]
    end

    %% Conexões Paciente
    RN -- "Upload de Laudos & Métricas HealthKit" --> API_GW
    API_GW --> LLM_EXT
    API_GW --> TS_STORE
    LLM_EXT --> HNSW_RES
    HNSW_RES --> TS_STORE
    HNSW_RES --> KG_STORE
    HNSW_RES --> VEC_STORE

    %% Conexões Médico
    RN -. "Emite QR Code / Token Efêmero" .-> WEB
    WEB --> OH_GATE
    OH_GATE --> GRAPHRAG
    GRAPHRAG --> KG_STORE
    GRAPHRAG --> TS_STORE
    GRAPHRAG --> VEC_STORE

    %% Conexões Agente de IA via MCP
    RN -. "Concede Consentimento / Chave de Escopo" .-> AGENTS
    AGENTS -- "Tools / Resources (JSON-RPC via SSE)" --> MCP_SRV
    MCP_SRV --> GRAPHRAG
    MCP_SRV --> TS_STORE
    MCP_SRV --> KG_STORE

    %% Processamento em background
    TS_STORE --> ANOM_WORKER
    ANOM_WORKER -- "Materializa nó AlertaWearable" --> KG_STORE
```

---

## 2. Stack Tecnológica Detalhada

| Camada | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Mobile (Paciente)** | **React Native** (Expo Bare Workflow) | Acesso direto a APIs nativas do dispositivo: **Apple HealthKit** (iOS) e **Health Connect** (Android), `react-native-vision-camera` para captura rápida de laudos, e armazenamento local seguro (`expo-secure-store`). |
| **Web (Médico)** | **React** + **Next.js** (App Router) | Zero fricção para o médico no consultório (não requer instalação). Renderização server-side ultra-rápida, `@xyflow/react` para visualização interativa do grafo clínico e `Recharts` para séries temporais cruzadas. |
| **Interoperabilidade de IA** | **Servidor MCP** (`@modelcontextprotocol/sdk`) | Expõe ferramentas e recursos clínicos padronizados sob transporte SSE/HTTP com autenticação por token de consentimento do paciente para agentes (ChatGPT, Claude, copilotos hospitalares). |
| **Backend & APIs** | **Node.js (TypeScript) / Fastify** | Performance de I/O assíncrono para ingestão de séries temporais em lote e orquestração do pipeline GraphRAG. |
| **Banco de Dados Híbrido** | **PostgreSQL (Supabase)** | Unificação arquitetural: `pgvector` com índice **HNSW** para busca semântica, tabelas relacionais de nós/arestas para o **Grafo**, e particionamento temporal para séries contínuas. |
| **IA & Extração** | **Gemini API** | Extração multimodal estruturada (`response_format` JSON schema) de fotos e PDFs com alta tolerância a ruído e rotação. |

---

## 3. POV 1: App Mobile do Usuário Comum (React Native)

O app mobile atua como o **coletor central de dados** e a **carteira de consentimento de saúde** do usuário.

```mermaid
flowchart LR
    subgraph RN_APP["React Native Mobile App"]
        direction TB
        CAM["Vision Camera\n(Captura de Laudos)"]
        HEALTH["HealthKit / Health Connect\n(Background Sync Worker)"]
        UI_TL["Linha do Tempo & Chat GraphRAG\n(Zustand + TanStack Query)"]
        CONSENT["Gerador de Consentimento\n(JWT Efêmero + QR Code Nativo)"]
    end

    subgraph SYNC_FLOW["Processamento em Background"]
        BATCH["Buffer Local de Métricas\n(Watermark de Última Sincronização)"]
        API_PUSH["POST /api/wearables/batch\n(Lotes com Idempotência)"]
    end

    CAM --> API_PUSH
    HEALTH --> BATCH --> API_PUSH
    CONSENT --> UI_TL
```

### Componentes Nativos Essenciais:
1. **Background Health Sync (`react-native-health` / `react-native-health-connect`):**
   - Agendamento de sync periódico de passos, batimento em repouso, variabilidade de frequência cardíaca (HRV), saturação de O2 e estágios do sono.
   - Envio em lotes compactados contendo chave de idempotência (`user_id + device_id + metric + timestamp`).
2. **Scanner e Captura Multimodal:**
   - Detecção de bordas de papel e compressão de imagem antes do upload direto para o pipeline de extração.
3. **Módulo de Emissão de Consentimento:**
   - Geração de assinaturas temporárias (Open Health Token) com escopo e duração limitados.
   - Geração de QR Code via biblioteca nativa para leitura física imediata no consultório.
   - Dashboard de revogação de acessos: exibe quais médicos e agentes externos possuem permissões ativas.

---

## 4. POV 2: Cockpit Clínico do Médico (React / Next.js Web)

Aplicação web responsiva e de alta densidade de informação projetada para o computador do consultório médico, eliminando etapas de cadastro manual.

```mermaid
flowchart TD
    subgraph INGRESS["Entrada sem Fricção"]
        URL["/consultation/[token] ou Leitura de QR Code"]
        VERIFY{"Validação de Assinatura\n& Expiração (TTL)"}
        URL --> VERIFY
    end

    subgraph DASHBOARD["Cockpit Médico de 1 Página (React / Next.js)"]
        direction TB
        B1["1. Briefing Executivo por IA (GraphRAG)\n- Resumo de 30s das alterações críticas\n- Alertas de wearables correlacionados com remédios"]
        B2["2. Séries Temporais Cruzadas (Recharts)\n- Curva de biomarcadores (10 anos)\n- Sinais dos wearables (últimos 90 dias)\n- Marcadores de início/fim de medicações"]
        B3["3. Navegador de Grafo Clínico (@xyflow/react)\n- Nós interativos: Paciente -> Sintoma -> Droga -> Resposta"]
    end

    VERIFY -- "Token Válido" --> DASHBOARD
```

### Componentes de Interface do Médico:
1. **Zero-Login Gateway:**
   - Middleware no Next.js intercepta o parâmetro `[token]`, valida no backend a assinatura criptográfica e autoriza a sessão temporária na memória do navegador.
2. **Briefing Clínico Sintético:**
   - Renderiza diagnósticos prováveis, alterações laboratoriais e incongruências temporais (ex: taquicardia noturna após introdução de novo fármaco) geradas pelo motor GraphRAG.
3. **Matriz de Correlação Temporal:**
   - Sobreposição de gráficos de linhas com zoom sincronizado, permitindo ao médico correlacionar eventos agudos dos wearables com laudos laboratoriais crônicos.

---

## 5. O Servidor MCP: Interoperabilidade para Agentes de IA Externos

O **Model Context Protocol (MCP)** é a camada que permite a ecossistemas externos de agentes (como o ChatGPT Health, Claude Desktop, ou copilotos hospitalares proprietários) consultarem os dados de seus respectivos pacientes de forma controlada, segura e padronizada.

```mermaid
sequenceDiagram
    autonumber
    actor A as Agente de IA Externo (ex: Claude / ChatGPT)
    participant MCP as Servidor Clínico MCP
    participant Auth as Validador de Escopo & Consentimento
    participant RAG as Motor Hybrid GraphRAG
    participant Core as Base de Dados Híbrida

    A->>MCP: Handshake JSON-RPC (SSE / HTTP)
    A->>MCP: ListToolsRequest / ListResourcesRequest
    MCP-->>A: Retorna catálogo de ferramentas clínicas disponíveis
    
    A->>MCP: CallToolRequest: "get_biomarker_history" {patient_id, biomarker, consent_token}
    MCP->>Auth: Verifica se token do paciente autoriza este agente
    Auth-->>MCP: Acesso Concedido (Escopo: read_biomarkers)
    MCP->>Core: Busca na camada de séries temporais via ID Canônico
    Core-->>MCP: Retorna histórico estruturado
    MCP-->>A: JSON-RPC Response com valores, datas e faixas de referência
```

### Especificação de Ferramentas (`Tools`) do Servidor MCP:

O servidor MCP expõe as seguintes ferramentas utilitárias tipadas para os LLMs externos:

#### 1. `get_patient_clinical_briefing`
* **Descrição:** Retorna a síntese clínica gerada pelo GraphRAG contendo diagnósticos ativos, medicações em uso e alertas críticos.
* **Argumentos:**
  ```json
  {
    "patient_id": "uuid",
    "consent_token": "string"
  }
  ```

#### 2. `get_biomarker_history`
* **Descrição:** Retorna a série histórica de um biomarcador específico (com padronização canônica) contendo valores numéricos, datas e faixas de referência.
* **Argumentos:**
  ```json
  {
    "patient_id": "uuid",
    "biomarker_query": "string",
    "start_date": "ISO8601 string (opcional)",
    "consent_token": "string"
  }
  ```

#### 3. `get_wearable_anomalies`
* **Descrição:** Consulta anomalias fisiológicas detectadas pelos vestíveis (arritmias, quedas de oxigenação, desvios extremos de sono ou HRV) em uma janela temporal.
* **Argumentos:**
  ```json
  {
    "patient_id": "uuid",
    "days_back": 30,
    "metric_filter": "heart_rate | hrv | sleep | spo2 (opcional)",
    "consent_token": "string"
  }
  ```

#### 4. `query_clinical_knowledge_graph`
* **Descrição:** Executa uma travessia semântica nas arestas do grafo de conhecimento a partir de um sintoma, medicamento ou laudo para descobrir conexões clínicas indiretas.
* **Argumentos:**
  ```json
  {
    "patient_id": "uuid",
    "source_entity": "string",
    "max_hops": 2,
    "consent_token": "string"
  }
  ```

### Especificação de Recursos (`Resources`) do Servidor MCP:
* `health://patients/{patient_id}/summary`: Retorna o documento Markdown estruturado contendo o perfil de saúde consolidado.
* `health://patients/{patient_id}/timeline`: Retorna a linha do tempo canônica em formato JSON-LD / FHIR-lite.

---

## 6. Fluxo de Dados End-to-End Integrado

```
[Paciente: React Native] 
       │ 
       ├─► (Foto/PDF) ──► Gemini 2.5 ──► HNSW Matcher ──► PostgreSQL (Nós & Séries)
       │                                                         ▲
       └─► (HealthKit) ─► Time-Series API ──► Anomaly Worker ────┤
                                                                 │
                                                       Hybrid GraphRAG
                                                                 │
                   ┌─────────────────────────────────────────────┴────────────────────────────┐
                   ▼                                                                          ▼
      [Médico: React Web Dashboard]                                              [Agentes IA: MCP Server]
      - Briefing Clínico em 30s                                                  - Tools: get_biomarker_history
      - Gráficos Cruzados Recharts                                               - Tools: get_wearable_anomalies
      - Navegação de Grafo @xyflow                                               - Tools: query_clinical_graph
```
