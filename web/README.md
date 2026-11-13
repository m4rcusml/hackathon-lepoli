# Rivio — web do médico

Aplicação independente em Next.js App Router, TypeScript estrito e Tailwind. Jornada: **carteira → paciente → contexto → evidência → revisão**. Não modifica `mobile/` e não contém backend clínico, identidade própria ou banco.

O contrato `0.1-draft` continua **temporário e não aprovado pelo backend**. As rotas e envelopes em uso são hipóteses de integração, não uma afirmação de APIs existentes nem uma obrigação para outra frente.

## Executar no Windows / PowerShell

Node.js >=22.12 (validado com 26.8.2), npm e Chrome/Chromium para os testes de navegador.

```powershell
cd C:\Users\marcus\Documents\Github\hackathon-lepoli\web
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Se o npm 12 deste ambiente rejeitar a obtenção de um tarball do registro com `EALLOWREMOTE`, a instalação desta sessão foi validada com `npm ci --allow-remote=all`. Nenhuma configuração global foi alterada.

- Entrada real: `http://localhost:3000/doctor`.
- Demonstração separada: `http://localhost:3000/demo/doctor`.
- Compatibilidade do convite: `/consultation/[token]` → `/doctor/consultation/[token]`.

Sem upstream, o modo real apresenta erro de configuração e permite tentar novamente. **Não há fallback automático para demo**, nem preenchimento de dados reais com fixtures. A demonstração é habilitada em desenvolvimento. Em build/produção exige `DOCTOR_DEMO_ENABLED=true`; com `false` ou ausente suas rotas devolvem 404.

```powershell
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

`test:e2e` inicia a web local na porta 3100 e um **double HTTP exclusivo de testes** na porta 4100. Não execute o double como serviço de produto. Não rode alterações no app durante essa suíte: hot reload descarta intencionalmente contextos mantidos só em memória. Traces/relatórios ficam em diretórios ignorados pelo Git.

## Configurar integração

```dotenv
DOCTOR_API_UPSTREAM_URL=http://localhost:4000/api/doctor/v0/
DOCTOR_WEB_ORIGIN=
DOCTOR_AUTH_REDIRECT_ORIGINS=
DOCTOR_DEMO_ENABLED=false
```

O primeiro valor é a base fixa no servidor, incluindo a base das operações. O navegador chama exclusivamente `/api/doctor/v0`. A ponte Next permite somente métodos/caminhos do rascunho, preserva cookies, CSRF, idempotência, status e streams, aplica `no-store` e não implementa autorização. Não aceita upstream escolhido pelo usuário. Redirecionamentos de login só podem ir à origem do upstream ou a origens exatas declaradas em `DOCTOR_AUTH_REDIRECT_ORIGINS` (separadas por vírgulas).

Quando a implantação usa proxy, `DOCTOR_WEB_ORIGIN` fixa a origem pública exata da web (por exemplo `https://medico.exemplo.com`, sem barra final). Sem essa configuração, o transporte compara `Origin` ao protocolo e ao `Host` recebidos. Os testes cobrem também o hostname interno normalizado pelo Next em desenvolvimento.

O backend é responsável por cookies `HttpOnly`, políticas `Secure`/`SameSite`, login/callback e validação de origem/CSRF. A ponte também exige origem igual à da web e header CSRF em POST. Domínio/path dos cookies, origem pública/callback e eventual proxy de produção precisam ser alinhados com o backend; não há reescrita improvisada de cookies.

Não colocar segredos em variáveis `NEXT_PUBLIC_*`. Nenhum token, snapshot, rascunho ou cache clínico é salvo em localStorage/sessionStorage, banco local ou service worker. Dados e tokens ficam em memória. O proxy não registra corpos clínicos. O responsável pelo ambiente deve evitar logar URLs brutas de convites no acesso HTTP; o portal usa `Referrer-Policy: no-referrer`, não carrega terceiros e remove o token do histórico do navegador ao resolver.

## Organização e fronteiras

- `src/lib/api/doctor-api.ts`: interface de operações; `http.ts`: transporte real cancelável.
- `src/lib/api/generated.ts`: tipos gerados do OpenAPI temporário.
- `src/lib/api/validators.js`: validação JSON Schema pré-compilada a partir do mesmo contrato, incluindo condicionais; sem compilação/eval no navegador.
- `src/lib/api/validate.ts`: envelope Zod, integridade das referências, identidade, escopos e projeções. Resposta inválida gera erro, sem coerção clínica.
- `src/lib/demo/`: transporte e fixture isolados; carregados somente no modo demo. Relógio em **11/11/2026 às 15:00 UTC**.
- `src/features/`: sessão, convites, carteira, paciente, briefing, evidências, evolução e relações.
- `tests/http-backend.mjs`: double para validar transporte, cookies, consentimento e persistência entre requests/login/reload **somente em testes**.

Após alterar o contrato acordado:

```powershell
npm run api:types
npm test
```

Esse comando gera tipos e validadores; não gera servidor. Ajustar mapeamentos em `lib/api` antes de alterar componentes. Não editar os arquivos gerados manualmente. A paridade da fixture laboratorial com o seed mobile é testada sem importar React Native nem alterar seus arquivos.

## Fluxos implementados

Carteira pesquisável com filtros/paginação; convites por colagem ou câmera QR; consulta pontual em memória; identificação delegada; pedido de acompanhamento com categorias e duração explícitas, confirmação externa e polling. Convite/sessão/vínculo são recursos independentes. Não existe ação médica para aprovar o próprio acesso.

No paciente: Resumo, Evolução, Histórico, Relações, Fontes e Permissões. Citações abrem a versão exata no inspector. Coleta/evento e recebimento são separados. Gráficos Recharts têm tabela equivalente; grafo React Flow tem lista equivalente. Categorias não compartilhadas, ausência e indisponibilidade são estados distintos.

A entrada autenticada já abre a carteira. Cada paciente tem atalhos para resumo, evolução e histórico; `?section=Evolução` também abre a área diretamente. O resumo aproxima achados, comparações citadas e contexto lateral. Medidas e registros relacionados abrem a evidência em um clique. As abas permanecem acessíveis durante a rolagem, a revisão fica na barra inferior e **Anotar** abre e foca o rascunho diretamente, preservando seu conteúdo entre áreas do paciente.

O snapshot fica estável durante investigação. A revalidação de autorização ocorre a cada 15 segundos em uso e ao retornar ao foco. Falha de autorização/revalidação bloqueia o conteúdo; revogação limpa consultas, detalhes, gráficos, grafo e originais. Expiração usa `serverTime` e tempo monotônico; o relógio local não estende acesso. Polling não garante revogação instantânea.

Revisão exige carregar todas as páginas vinculadas ao snapshot. Envia `snapshotId` e `reviewToken`, com chave de idempotência estável para repetir a intenção. Abertura, scroll e troca de aba não concluem revisão. Informações posteriores continuam novas. Atualizar manualmente preserva filtros e seleção ainda resolvível; mudança de autorização exige novo conjunto.

### Demonstração

A interface clínica não exibe faixas, rótulos ou controles demonstrativos, conforme solicitado. A separação entre os transportes, rotas e caches permanece intacta. Os casos do plano continuam disponíveis aos testes: inicial, novidades/concorrência, exames restritos, pendente/rejeitado, expirado/revogado, temporário, carteira/paciente vazios, briefing indisponível, fonte antiga, serviço indisponível e resposta inválida.

Os testes disparam o evento `rivio:scenario` no navegador, com `detail: { action, scenario? }`. A ação `scenario` escolhe um dos nomes de `src/lib/demo/scenarios.ts`; `arrive`, `revoke`, `restrict`, `approve`, `reject` e `doctor` representam eventos externos. O listener só se conecta ao transporte demonstrativo; não aprova permissões reais nem existe como ação do médico na interface.

Convites fictícios: `demo-consultation`, `demo-followup`, `demo-expired`. Trocar cenário/reiniciar descarta o estado demonstrativo. Revisões por médico duram somente a instância da demo; não são persistência real. Os resultados laboratoriais de Daniel preservam os IDs, valores, datas e referências do seed; wearable basal é sintético, fixo e positivo. Não há HbA1c, início de medicação ou original inventados. História familiar não é diagnóstico ativo e o grafo usa apenas relações registradas.

## Itens secundários

- **RF-M05:** abre PDF/JPEG/PNG somente quando `originalAvailable=true`, por requisição autorizada e MIME validado. Aborta/limpa blob ao fechar/trocar contexto. O cenário Daniel não tem originais; essa ausência é explícita. Um arquivo já salvo fora da aplicação não pode ser recolhido por revogação.
- **RF-M06:** o botão de impressão abre o sumário autorizado. Use o diálogo do navegador para imprimir ou salvar em PDF. Não é geração automática de PDF. Cabeçalho, datas/fontes e conteúdo do sumário permanecem; navegação e controles são ocultados. Curvas/tabelas também podem ser impressas com a aba Evolução selecionada pelo navegador.
- **RF-M07:** rascunho somente na memória da aba, identificado como não salvo/não compartilhado, com proteção de saída. Não grava no histórico. Revisão funciona sem notas; persistência de notas exige contrato próprio.

## Validação e pendências

Resultados e cobertura W00–W16: [registro de entrega](../docs/doctor-web-delivery.md). **Web validada com mocks/double HTTP não significa integração real validada.** Sessão real, aprovação/revogação no mobile, carteira/revisão persistidas no backend e testes entre dispositivos dependem dos responsáveis externos. Nenhum deploy, push, infraestrutura ou implementação mobile faz parte desta execução.

Após `npm run build`, `node scripts/verify-production.mjs` verifica demo desabilitada (404), HTML inicial sem dados clínicos e falha explícita quando não há upstream. `node scripts/capture-review.mjs` registra carteira, paciente, evidência, evolução e grafo em desktop/celular e executa verificações de acessibilidade/geometria. Usa `127.0.0.1:3000` por padrão; aceita outra base por argumento ou `BASE_URL`. Artefatos ficam fora do versionamento.

Documentação oficial consultada: [Next 16](https://nextjs.org/docs/app/getting-started/installation), [ponte HTTP](https://nextjs.org/docs/app/guides/backend-for-frontend), [TanStack Query 5 e cancelamento](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [Recharts 3](https://recharts.github.io/en-US/api/LineChart/), [React Flow 12 e acessibilidade](https://reactflow.dev/learn/advanced-use/accessibility), [ZXing Browser](https://github.com/zxing-js/browser), [Zod 4](https://zod.dev/api) e [Vitest](https://vitest.dev/config/). Versões exatas estão no lockfile.
