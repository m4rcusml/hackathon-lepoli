# Prompt para Execução Autônoma (/goal): Desenvolvimento do App Mobile do Paciente

Copie e cole o bloco abaixo em uma nova sessão com o comando `/goal` para iniciar o ciclo de desenvolvimento autônomo do aplicativo mobile do paciente em **React Native**.

```markdown
/goal Execute o desenvolvimento autônomo completo do aplicativo mobile do paciente (React Native) para o Desafio Rivio (Hackathon Gama House), cumprindo rigorosamente os requisitos MUST HAVE documentados em functionalities.md e a arquitetura técnica de architecture-plan.md e README.md.

### CONTEXTO & REGRAS DE EXECUÇÃO:
1. Você atuará de forma 100% autônoma, iterativa e com auto-verificação, sem parar para pedir confirmações triviais.
2. Foque estritamente nos 6 requisitos MUST HAVE do paciente (Parte 1 de functionalities.md):
   - RF-P01: Upload & Extração Multimodal de Laudos (interface com upload de foto/PDF e parser estruturado).
   - RF-P02: Linha do Tempo Viva de Biomarcadores com faixas de referência históricas (gráficos temporais).
   - RF-P03: Injeção & Simulação de Dados de Wearables (botão/serviço que injeta 30 dias de BPM, HRV, Sono com cenário de arritmia determinístico).
   - RF-P04: Detecção & Notificação de Alertas Proativos (card de taquicardia noturna em repouso).
   - RF-P05: Chat Pessoal Confiável com Hybrid GraphRAG (chat contextualizado no histórico real cruzado).
   - RF-P06: Geração de Acesso Efêmero via QR Code Open Health (QR Code de alta densidade com JWT de 2h).
3. MOCKS DE HACKATHON PERMITIDOS:
   - Pule telas de cadastro/login formal (RF-P09): o app deve inicializar com a sessão pré-autenticada do paciente "Daniel, 32 anos".
   - Conexão nativa com HealthKit real (RF-P08) deve ser simulada via RF-P03 para garantir estabilidade e reprodutibilidade.
   - A extração do Gemini e o chat GraphRAG devem possuir clientes funcionais com fallback mockado caso as variáveis de ambiente de API não estejam configuradas localmente.

---

### ETAPAS DE CONSTRUÇÃO OBRIGATÓRIAS:

#### ETAPA 1: Setup do Projeto e Estrutura de Diretórios
- Crie o projeto mobile dentro da pasta `./mobile` utilizando Expo (TypeScript) ou React Native CLI com suporte a web preview (`npx create-expo-app@latest mobile --template blank-typescript` ou similar).
- Configure navegação (React Navigation ou Expo Router com abas inferiores: "Início/Timeline", "Exames", "Dispositivos", "Assistente", "Compartilhar").
- Instale dependências essenciais: ícones (`lucide-react-native` ou `@expo/vector-icons`), gráficos (`react-native-svg` + `victory-native` ou `react-native-chart-kit`), gerador de QR Code (`react-native-qrcode-svg`), gerenciamento de estado (`zustand`), e date formatting (`date-fns`).

#### ETAPA 2: Camada de Estado, Dados Mockados e Simulador
- Crie a store global com Zustand contendo:
  - Dados do usuário (Nome, Sexo Biológico, Idade).
  - Histórico de exames laboratoriais (Glicose, Colesterol LDL, HDL, Triglicérides, Ferritina, TSH) com datas históricas e faixas de referência.
  - Séries temporais de wearables (leituras diárias de BPM em repouso, HRV e sono profundo dos últimos 30 dias).
  - Alertas ativos e histórico de mensagens do chat.
- Implemente o motor do simulador determinístico (RF-P03): um botão "Injetar Dados de Wearable (Simulador)" que popula o estado e dispara o evento de taquicardia noturna (RF-P04).

#### ETAPA 3: Tela de Linha do Tempo e Biomarcadores (RF-P02)
- Construa a tela principal exibindo:
  - Resumo de saúde no topo com cards rápidos de sinais vitais (BPM atual, HRV, Sono).
  - Lista de biomarcadores acompanhados com status visual (Dentro da Faixa / Atenção / Fora da Faixa).
  - Gráfico de evolução temporal ao clicar no biomarcador, renderizando os pontos de cada exame e as linhas de faixa mínima e máxima.

#### ETAPA 4: Tela de Ingestão de Exames (RF-P01)
- Construa a tela de captura/upload com opções: "Tirar Foto" e "Enviar PDF/Imagem".
- Exiba feedback visual de processamento por IA ("Lendo biomarcadores com Gemini...").
- Crie a função de ingestão que adiciona os novos dados à linha do tempo com padronização canônica de nomes.

#### ETAPA 5: Tela de Monitoramento e Alertas Proativos (RF-P03 / RF-P04)
- Dashboard de wearables com gráficos de BPM ao longo das semanas e métricas de sono.
- Renderização em destaque do card de alerta vermelho/laranja quando anomalias forem detectadas, com botão direto para "Consultar Assistente" ou "Gerar QR Code para Médico".

#### ETAPA 6: Chat Pessoal com GraphRAG (RF-P05)
- Interface de chat moderna e responsiva (estilo bolhas de mensagem com avatar e timestamps).
- Respostas do assistente ancoradas nos dados do paciente: se o usuário perguntar sobre cansaço ou coração acelerado, a resposta cita explicitamente a ferritina baixa e o alerta de taquicardia do relógio.
- Sugestões de perguntas rápidas em chips (ex: "Como estão meus exames recentes?", "O que significa meu alerta de BPM?").

#### ETAPA 7: Tela de Compartilhamento Open Health via QR Code (RF-P06)
- Tela com layout limpo contendo o QR Code dinâmico gerado com biblioteca nativa.
- Payload do QR Code contendo a URL de acesso médico com token efêmero (`https://[app-medico]/consultation/{token}`).
- Contador regressivo visual de validade do token (2 horas) e botão para copiar link direto ou regenerar código.

#### ETAPA 8: Validação, Build & Commits
- Execute type-checking (`tsc --noEmit`) e garanta que não existem erros de TypeScript.
- Teste a execução do app localmente (via Expo Web ou emulador).
- Faça commit de todas as alterações na branch `main` com mensagens semânticas claras.
- Só finalize após auditar e garantir que todas as 6 funções MUST HAVE estão 100% integradas e navegáveis na interface.
```
