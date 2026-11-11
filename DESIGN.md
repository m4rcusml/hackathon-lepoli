---
name: "Rivio · Espaço do médico"
description: "Identidade web clínica de superfícies claras, navegação teal e evidência próxima do contexto."
colors:
  teal: "#087c73"
  teal-dark: "#075e59"
  background: "#f4f8f8"
  foreground: "#132f34"
  muted: "#4d646b"
  border: "#d7e3e5"
  surface: "#fff"
  rail: "#073e3e"
  rail-text: "#e3f2ef"
  rail-selected: "#1d5c56"
  rail-hover: "#155351"
  field-border: "#b8ccce"
  secondary-border: "#cbdcdd"
  secondary-hover: "#e8f2f0"
  focus: "#086eaa"
  slate-text: "#0f172a"
  slate-muted: "#475569"
  slate-border: "#e2e8f0"
  slate-contour: "#cbd5e1"
  slate-subtle: "#f8fafc"
  slate-surface: "#f1f5f9"
  clinical-teal: "#0f766e"
  clinical-teal-dark: "#115e59"
  clinical-tint: "#f0fdfa"
  clinical-border: "#99f6e4"
  clinical-highlight: "#ccfbf1"
  badge-positive-bg: "#eef8f4"
  badge-positive-text: "#15574c"
  badge-positive-border: "#c4dfd8"
  badge-warning-bg: "#fff7e6"
  badge-warning-text: "#80520d"
  badge-warning-border: "#e8d4a6"
  badge-neutral-bg: "#f1f5f7"
  badge-neutral-text: "#405b65"
  badge-neutral-border: "#d6e1e6"
  attention-bg: "#fffbeb"
  attention-text: "#92400e"
  critical-bg: "#fff1f2"
  critical-text: "#9f1239"
  relation-recorded: "#0b766e"
  relation-temporal: "#225f9f"
  relation-hypothesis: "#7654a2"
typography:
  display:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "42px"
    fontWeight: 750
    lineHeight: 1.22
    letterSpacing: "-0.035em"
  headline:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "30px"
    fontWeight: 750
    lineHeight: 1.22
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  subtitle:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.6
  small:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "12px"
    lineHeight: 1.6
  badge:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.5
  navigation:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.6
  tab:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.6
  cited-value:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "27px"
    fontWeight: 750
    lineHeight: 1.35
    letterSpacing: "-0.03em"
  measurement:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: "-0.03em"
rounded:
  badge: "4px"
  field: "5px"
  control: "6px"
  surface: "8px"
  workspace: "10px"
  graph-node: "0.6rem"
  avatar: "50%"
spacing:
  field-gap: "6px"
  compact: "8px"
  inline: "12px"
  stack: "16px"
  toolbar: "20px"
  panel: "24px"
  section: "32px"
  gutter: "32px"
  spacious: "48px"
  page-bottom: "44px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  button-primary-hover:
    backgroundColor: "{colors.teal-dark}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  text-action:
    textColor: "{colors.teal-dark}"
    typography: "{typography.label}"
    padding: "0"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  navigation-item:
    textColor: "{colors.rail-text}"
    typography: "{typography.navigation}"
    rounded: "{rounded.surface}"
    padding: "10px 4px"
    height: "64px"
  navigation-selected:
    backgroundColor: "{colors.rail-selected}"
  badge-positive:
    backgroundColor: "{colors.badge-positive-bg}"
    textColor: "{colors.badge-positive-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "3px 9px"
  badge-warning:
    backgroundColor: "{colors.badge-warning-bg}"
    textColor: "{colors.badge-warning-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "3px 9px"
  badge-neutral:
    backgroundColor: "{colors.badge-neutral-bg}"
    textColor: "{colors.badge-neutral-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "3px 9px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
    padding: "24px"
  patient-tab:
    typography: "{typography.tab}"
    padding: "14px 2px"
  shell-rail:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-text}"
    padding: "22px 10px"
    width: "88px"
    height: "100dvh"
  shell-topbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    padding: "0 32px"
    height: "64px"
  portfolio:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.workspace}"
    padding: "0"
  patient-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    padding: "1.75rem 1.5rem 1.25rem"
  cited-measurement:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.surface}"
    padding: "12px"
  review-dock:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.workspace}"
    padding: "14px 20px"
  evidence-inspector:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.slate-text}"
    padding: "0"
    width: "min(40rem, 100%)"
    height: "100dvh"
  graph-node:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.slate-text}"
    rounded: "{rounded.graph-node}"
    padding: "1rem"
    width: "218px"
---

# Design System: Rivio · Espaço do médico

## Overview

**Creative North Star: "Contexto que acompanha o cuidado"**

A web do médico estende a identidade Rivio já estabelecida no mobile: teal profundo, superfícies claras e texto slate. A composição mantém uma presença de marca estável na navegação e deixa os registros clínicos ocuparem a área principal. O resultado é sóbrio, legível e orientado ao trabalho contínuo.

A densidade vem de linhas comparáveis, metadados próximos e divisores discretos. Valores citados, datas e ações de origem tornam a leitura investigável sem abrir cada registro antes de compará-lo. Painéis delimitam agrupamentos; o conteúdo clínico também vive diretamente sobre o fundo claro. A evidência abre em um inspector lateral, preservando o paciente e o contexto visual ao fundo. Este documento registra a implementação em `web/`, sem criar uma direção nova para o mobile.

**Key Characteristics:**

- Teal na navegação, nas ações e nos caminhos de investigação.
- Manrope local em toda a interface, com pesos e tamanhos definidos pela função.
- Superfícies planas, contornos discretos e cantos pequenos.
- Datas, unidades, origem e estado próximos do conteúdo clínico.
- Atalhos nomeados e controles de investigação disponíveis durante a leitura.
- Reorganização compacta no celular com rolagem localizada para conteúdo comparável.

## Colors

Os valores do frontmatter são normativos; os nomes abaixo explicam suas funções. Os módulos clínicos preservam uma família teal/slate próxima da paleta global, sem fingir que suas variantes literais já foram unificadas em variáveis CSS.

### Primary

- **Teal Rivio** (`teal`) dá presença às ações principais, ao cursor de edição e à seleção de abas. **Teal profundo** (`teal-dark`) conduz links, ações textuais e o hover do botão principal.
- **Teal de navegação** (`rail`) sustenta a barra lateral e sua versão horizontal. `rail-text`, `rail-selected` e `rail-hover` mantêm texto claro e estados discretos dentro dessa superfície escura.
- **Teal clínico** (`clinical-teal`, `clinical-teal-dark`) aparece em curvas, filtros selecionados e leitura de medições. `clinical-tint`, `clinical-border` e `clinical-highlight` dão contexto a seleções, valores, faixas de referência e avatares.

### Secondary

- **Azul de associação temporal** (`relation-temporal`) identifica relações temporais no grafo e na legenda. O mesmo papel recebe linha tracejada.
- **Violeta de hipótese** (`relation-hypothesis`) identifica interpretação sugerida no grafo e na legenda. O mesmo papel recebe linha pontilhada.

### Neutral

- **Fundo clínico claro** (`background`) forma o plano de trabalho. **Superfície branca** (`surface`) recebe painéis, campos, linhas da carteira e inspector.
- **Texto profundo** (`foreground`) e **texto secundário** (`muted`) definem o contraste global; `border` delimita agrupamentos sem criar relevo.
- A família `slate-text`, `slate-muted`, `slate-border`, `slate-contour`, `slate-subtle` e `slate-surface` é usada pelos módulos de carteira, evidência, evolução e relações. Texto escuro, metadados, linhas e fundos continuam tendo papéis separados.
- `field-border` delimita campos; `secondary-border` e `secondary-hover` pertencem às ações secundárias. `focus` é reservado ao contorno visível de teclado.

Os grupos `badge-positive-*`, `badge-warning-*` e `badge-neutral-*` comunicam estado com texto e contorno próprios. `attention-*` e `critical-*` são os pares de fundo/texto das classificações nas séries. `relation-recorded` mantém fatos registrados em teal com linha contínua. Cores de estado acompanham rótulos explícitos; não substituem a descrição do registro nem declaram normalidade clínica por conta própria.

**The Evidência Visível Rule.** Relação registrada, associação temporal e hipótese permanecem identificáveis por texto e estilo de linha, além da cor.

## Typography

**Display Font:** Manrope Variable, com fallback sans-serif.
**Body Font:** Manrope Variable, com o mesmo fallback.

A família é servida pelo pacote local `@fontsource-variable/manrope`, importado no layout da aplicação. Sua faixa variável é de 200 a 800. Não há dependência de um serviço remoto de fontes nem uma segunda família decorativa.

### Hierarchy

- **Display** (`display`): título da entrada, com quebra equilibrada. Reduz para 34px no breakpoint intermediário e 32px no compacto.
- **Headline** (`headline`): título de página, reduzido para 27px no compacto. O nome do paciente usa a variante local de 28px, reduzida para 25px; a carteira usa 1.75rem até 700px.
- **Title** (`title`): título de seção com peso 700. Reduz para 19px no compacto; o resumo lateral usa 15px.
- **Subtitle** (`subtitle`): subdivisões e cabeçalhos de conteúdo com peso 700. Achados usam 17px com entrelinha de 1.45; o inspector usa 1.5rem com entrelinha de 1.3.
- **Body** (`body`): leitura geral. Achados usam 13px, entrelinha de 1.7 e largura máxima de 72ch; evidências textuais usam entrelinha de 1.75. A entrada usa texto introdutório de 17px com entrelinha de 1.8 e largura de 45ch, reduzindo para 15px no compacto.
- **Label / Small / Badge**: ações com peso 650, metadados menores e estados compactos. Navegação global usa `navigation`; abas locais usam `tab`. Tabelas usam células de 13px e cabeçalhos de 11px; módulos preservam variantes em rem. Não existe uma razão modular única para todos os tamanhos.
- **Cited value** (`cited-value`): valor citado ao lado do achado. Unidade, data, classificação e referência permanecem menores e próximas do número. A evolução compara os dois últimos registros com números de 1.65rem e peso 750, reduzidos para 1.3rem até 600px.
- **Measurement** (`measurement`): número clínico em destaque, acompanhado de unidade e classificação textual.

**The Comparação Numérica Rule.** Tabelas, valores de séries e medições destacadas usam números tabulares; mantenha valor, unidade e data reconhecíveis durante a comparação.

## Layout

O shell desktop usa navegação sticky com largura de 88px e altura de viewport. Ícones e rótulos curtos se organizam verticalmente dentro dos itens. A área à direita cresce com `min-width: 0`. O topo sticky tem 64px; o conteúdo tem largura máxima de 1664px, centralização e padding de 28px 32px 44px. Esse máximo pertence ao conteúdo, sem incluir a navegação. A entrada autenticada mostra a carteira diretamente. A entrada de identificação preserva duas colunas proporcionais, máximo de 1100px e intervalo de 70px.

O ritmo recorrente é de 8, 12, 16 e 24px para proximidade, controles, pilhas e painéis. Cabeçalhos e transições maiores usam 28–32px. É um vocabulário observado, não uma exigência de converter todo ajuste local a uma grade rígida.

- **Até 1200px:** resumo mantém coluna principal e contexto de 255px, com intervalo de 24px; cada achado empilha texto e valores citados. Acima desse limite, o contexto tem 292px e o intervalo é de 32px.
- **Até 1100px:** conteúdo com padding de 24px 24px 40px; topo e rodapé com laterais de 24px. O cabeçalho do paciente pode quebrar linha e a entrada reduz seu intervalo para 32px.
- **Até 1050px:** linhas da carteira passam de três para duas colunas e as datas ganham uma linha própria. No grafo, a lista lateral desce para abaixo do canvas.
- **Até 1000px:** o navegador de medidas sai da coluna de 218px e vira uma faixa horizontal com rolagem localizada, acima das curvas.
- **Até 900px:** contexto do resumo desce e se organiza em duas colunas; achados voltam a aproximar texto e valores lado a lado.
- **Até 720px:** navegação horizontal estática de 62px, com padding de 8px 16px; topo conserva 64px e conteúdo usa padding de 24px 16px 36px. A entrada vira uma coluna. Cabeçalhos, avisos e rodapé empilham; painéis usam padding de 18px. A barra de revisão usa laterais e base de 10px, empilha rótulo e ações e amplia o botão de concluir para toda a largura.
- **Até 700px:** carteira em coluna única; busca ocupa toda a linha, contexto ganha divisor e atalhos permanecem nomeados, com quebra quando necessária.
- **Até 650px:** timeline e detalhes da evidência passam de duas colunas para uma. O inspector reduz seu padding para 1.25rem; o canvas do grafo reduz de 31rem para 22rem.
- **Até 600px:** contexto lateral e cada achado do resumo viram uma coluna. Os dois campos de data dividem a linha quando há espaço; gráficos reduzem de 290px para 230px e eventos se empilham.

No paciente, abas sticky ficam abaixo do topo, com offset de 64px, rolagem horizontal localizada e rótulos sem quebra. A barra de revisão fica fixa a 16px da base, entre `calc(88px + 24px)` à esquerda e 24px à direita; o conteúdo reserva 132px inferiores, ampliados para 210px no compacto. Topo, abas e revisão usam respectivamente níveis 40, 30 e 45; o inspector modal permanece acima deles.

Tabelas preservam suas colunas dentro de um contêiner com `overflow: auto`, sem alargar a página. A carteira usa artigos com identidade, contexto e datas, seguidos pelas ações diretas. O grafo usa canvas e lista lateral de 290px; muda a orientação dos nós para vertical até 720px e mantém a leitura textual disponível. O inspector tem largura `min(40rem, 100%)`, altura de `100dvh` e ocupa toda a largura em telas estreitas.

Na impressão, a composição vira um documento: navegação, controles, barra de revisão e diálogos saem; fundo fica branco, texto usa 10pt e painéis evitam quebra interna. O grafo privilegia a lista textual de relações. Esta adaptação é para o conteúdo em leitura, não uma captura da tela interativa.

## Elevation & Depth

A interface é plana na maior parte do tempo. O fundo claro, o branco dos painéis e as linhas finas distinguem níveis. Sombras têm funções localizadas: separar uma sobreposição, distinguir a revisão fixa, destacar o tooltip e dar uma pequena definição aos nós do grafo. Não há sombra global para todo painel.

### Shadow Vocabulary

- **Inspector lateral** (`-8px 0 32px #0f172a18`): separa o detalhe sobreposto do espaço do paciente; o backdrop usa `#0f172a55`.
- **Tooltip de série** (`0 4px 16px #0f172a14`): mantém a leitura do dado sobre o gráfico.
- **Nó clínico** (`0 2px 7px rgb(15 23 42 / 5%)`): contorno suave dentro do canvas.
- **Revisão fixa** (`0 6px 24px #132f341a`): distingue a ação persistente da informação em rolagem.

O único movimento contínuo é o indicador de carregamento, com giro de 1s linear. Botões principais e secundários têm transição de fundo de 0.15s; medições citadas têm transição de contorno de 150ms. A preferência por movimento reduzido remove animações e transições; não se adiciona movimento de entrada às informações clínicas.

**The Plano de Trabalho Rule.** Painéis e listas permanecem planos; reserve sombra aos quatro papéis de profundidade registrados acima.

## Shapes

As formas são contidas: badges com canto de 4px, campos de 5px, botões de 6px, painéis e navegação de 8px. Carteira e barra de revisão usam 10px; o nó do grafo preserva 0.6rem. Avatares da carteira e do médico são circulares; a identidade do paciente usa um quadrado suavizado de 12px, reduzido para 10px no compacto. Bordas são normalmente de 1px, sem contornos ornamentais; o indicador ativo de aba é uma linha inferior de 3px. O inspector encosta à direita sem arredondar sua borda externa.

Ícones são vetores de traço da família Lucide, geralmente entre 14 e 24px. A marca usa sua composição vetorial e tipográfica existente. Capturas de revisão são evidência de teste; não são imagens para reutilizar na interface. Não há fotografia ou ilustração raster decorativa no build documentado.

## Components

### Buttons

Ações pequenas e explícitas, com texto em caixa normal e ícone opcional alinhado ao rótulo.

- **Primary:** usa `button-primary`, borda teal de 1px, altura mínima de 42px e intervalo de 8px. No hover, muda apenas para o teal profundo; não há deslocamento ou aumento de sombra.
- **Secondary:** usa `button-secondary`, borda de `secondary-border` e fundo de `secondary-hover` no hover. Compartilha altura, padding e tipografia do principal.
- **Text action:** sem caixa ou fundo, texto teal profundo sublinhado com offset de 4px; aproxima a origem do achado ou conduz uma ação secundária.
- **Icon action:** caixa mínima de 40px, canto de 6px, borda discreta e fundo branco; recebe nome acessível quando não tem rótulo visível.
- **Focus / disabled:** contorno global de 3px na cor `focus`, separado por 3px; controles desabilitados usam opacidade de 0.55 e cursor de indisponível.

### Chips

Badges são indicadores, sem aparência de botão. Usam padding de 3px 9px, canto pequeno e contorno próprio nos estados positivo, atenção e neutro. Filtros da carteira são botões separados: transparentes em repouso, fundo claro no hover e superfície teal suave com contorno no selecionado. A seleção também é exposta por `aria-pressed`. Tópicos e legenda do grafo seguem a mesma distinção entre rótulo e controle selecionável.

### Cards / Containers

Painéis brancos têm contorno discreto, canto de 8px e padding de 24px, reduzido a 18px no compacto. Achados e histórico usam linhas sobre o plano de trabalho para manter leitura contínua; não se converte cada registro em um cartão com sombra. O contexto do resumo usa superfície verde acinzentada, padding de 22px e divisores entre síntese, cobertura e lacunas.

### Patient portfolio

A carteira é um contêiner branco de canto de 10px. Cada paciente ocupa um artigo com três colunas: identidade e acesso, estado de revisão e contexto, datas clínicas e de revisão. A linha de ações fica abaixo com divisor discreto. O botão principal abre o resumo; Evolução e Histórico têm atalhos diretos. Busca e filtros ficam no mesmo cabeçalho, com estados separados de carregamento, vazio e vínculos sem acesso. Um vínculo indisponível mantém a identificação protegida e não apresenta atalhos clínicos.

### Inputs / Fields

Campos globais têm fundo branco, borda de 1px em `field-border`, canto de 5px, padding de 10px 12px e altura mínima de 42px. Rótulos ficam acima com intervalo de 6px. O foco usa o contorno global. A busca da carteira é uma variante sem borda interna, dentro da área de controles. Filtros de evolução usam cantos de 8px e altura mínima de 44px; filtros do grafo preservam seu canto de 0.45rem. Checkboxes usam a cor teal e caixa de 16px.

### Navigation

A navegação global fica sobre teal escuro, com texto claro, ícone de traço e item ativo em superfície tonal. O desktop usa ícone sobre rótulo curto; o compacto usa ícone e rótulo lado a lado. O texto inferior da barra é oculto no compacto. As abas sticky do paciente vivem sobre o plano claro, com ícones, texto secundário em repouso, teal profundo e traço inferior na selecionada. Navegação global e abas conservam papéis visuais distintos; as abas permitem setas, Home e End pelo teclado.

### Cited measurements

O achado aproxima texto e registros numéricos citados. Cada medição é um botão branco com canto de 8px e padding de 12px, contendo data, valor, unidade, classificação e referência da própria evidência. O contorno muda para teal no hover. A barra de 5px usa a mesma escala apenas dentro do grupo de tipo, rótulo e unidade equivalentes; seus limites ficam visíveis. Atenção e crítico recebem barra ocre, além do rótulo explícito. O botão abre diretamente a versão citada no inspector; os registros sem valor continuam em ações textuais de evidência. O atalho de evolução seleciona a série relacionada.

### Review dock

A revisão contínua mantém título, data e conclusão na barra inferior fixa. O agrupamento usa branco, borda suave, canto de 10px e padding de 14px 20px. O botão de concluir permanece desabilitado enquanto o conjunto de novidades não está completo, durante erro ou envio. Depois do registro, o estado confirmado substitui a ação. Novidades e suas referências continuam disponíveis acima do conteúdo; rolar ou abrir evidências não marca revisão automaticamente. As notas ficam em um bloco expansível com atalho no cabeçalho do paciente.

### Evidence inspector

O detalhe é uma sobreposição branca lateral, sem substituir o espaço do paciente. O cabeçalho mantém paciente, nome da evidência e botão de fechar; o corpo aproxima medição, unidade, classificação, datas e origem. Uma medição usa superfície teal muito clara com contorno e número tabular de destaque. Metadados têm divisores, duas colunas no desktop e uma no compacto. O diálogo usa foco modal, Escape, ação de fechar e devolução de foco ao acionador; um snippet estático do sidecar representa sua aparência, não substitui esse comportamento da aplicação.

### Clinical series and relations

O navegador lateral de medidas mostra nome, último valor e data. Seleção usa superfície teal suave e contorno, com `aria-pressed`; um sinal de wearable pode ser incluído na comparação. A área principal mostra registro anterior, último registro e diferença numérica antes da curva, mantendo ações diretas de evidência. Período e seletores continuam disponíveis acima.

Curvas usam teal e pontos com centro branco; o contorno do ponto acompanha a classificação registrada em teal, ocre ou vinho. Grade horizontal slate e datas legíveis apoiam a comparação. A faixa de referência usa teal claro; evento de contexto tem marcador violeta. O gráfico acompanha uma tabela com valores, fontes e ações de evidência. Séries com unidades distintas mantêm grupos e escalas separados.

Nós do grafo têm largura de 218px, fundo branco, borda teal discreta e rótulo de tipo. Paciente e documento têm superfícies tonais próprias. O último registro disponível acrescenta valor, unidade e data ao nó sem ocultar suas evidências. Tópicos e legenda são filtros diretos; a lista de relações fica ao lado do canvas no desktop. Fatos usam linha contínua teal; associações, tracejado azul; hipóteses, pontilhado violeta. Cada relação também aparece em lista com seus fundamentos e referências. Cores e conexões não transformam uma hipótese em fato.

## Do's and Don'ts

### Do:

- **Do** manter Manrope local, números tabulares e a hierarquia tipográfica registrada.
- **Do** usar teal para ações e investigação, com texto de estado sempre explícito.
- **Do** manter a identidade do paciente e a origem próximas do conteúdo investigado.
- **Do** manter atalhos nomeados, medições citadas e ações de evidência junto ao contexto que explicam.
- **Do** reorganizar o shell nos breakpoints documentados e conter a rolagem de tabelas e abas.
- **Do** preservar foco visível, navegação por teclado e a preferência por movimento reduzido.
- **Do** usar o sidecar para consultar os snippets e extensões; o frontmatter continua sendo a fonte normativa dos tokens.

### Don't:

- **Don't** substituir a família local por uma fonte decorativa ou depender de fonte remota.
- **Don't** usar somente cor para distinguir fato, associação, hipótese ou estado clínico.
- **Don't** aplicar sombra e elevação a todos os painéis ou a cada registro da lista.
- **Don't** remover datas, unidades ou rótulos de origem para deixar um número isolado em destaque.
- **Don't** comprimir tabelas até perder legibilidade nem permitir que elas alarguem o shell no celular.
- **Don't** usar avisos ou controles de demonstração como parte da interface clínica; a separação entre execução real e cenários permanece técnica.
- **Don't** tratar capturas de revisão ou conteúdo sintético como assets e identidade permanente.
