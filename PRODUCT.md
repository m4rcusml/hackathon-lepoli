# Produto — experiência web do médico

<!-- impeccable:product-schema 1 -->

Este documento registra o contexto da frente web do médico. O backend central e o app mobile do paciente fazem parte do produto, mas sua implementação pertence a outras frentes.

## Platform

web

## Users

- Médico que consulta o histórico unificado e acompanha uma carteira de pacientes.
- Paciente, pelo app mobile, fornece informações e controla o compartilhamento de seus dados.

## Product Purpose

O produto tem um backend central que recebe informações sobre um paciente de diversas fontes, estrutura esse contexto e o disponibiliza para consulta pelo paciente e acompanhamento pelo médico.

A web deve ajudar o médico a entender o contexto de cada paciente, investigar as evidências e acompanhar mudanças ao longo do tempo.

## Operating Context

- Carteira contínua de pacientes faz parte desta versão, conforme decisão do usuário.
- A documentação anterior descreve acesso pontual por QR/link, leitura de briefing, séries temporais e exploração de relações clínicas.
- O desenvolvimento deve atender o uso do produto. Duração de apresentação não orienta a experiência ou o escopo.
- O prazo informado permanece sábado, 14/11/2026.

## Capabilities and Constraints

- Escopo de Marcus: web do médico e contrato de integração. Backend e mobile têm outros responsáveis.
- Integração real mobile → backend → web, com cenário determinístico explicitamente identificado para contingência e desenvolvimento.
- Histórico, briefing rastreável, séries temporais e grafo clínico são requisitos documentados.
- O acesso clínico documentado é somente leitura. Anotações são um requisito secundário; prescrição e edição do prontuário não foram solicitadas.
- A carteira contínua exige estender o contrato anterior de sessão temporária. Autenticação do médico, vínculo individual com o paciente, consentimento duradouro e revogação precisam ser alinhados com o backend.
- Método de autenticação, duração do vínculo e canal do responsável pelo backend permanecem abertos.
- O [contrato proposto](docs/doctor-backend-contract.md) e seu [OpenAPI](docs/contracts/doctor-api.v0.1.openapi.json) são temporários, não aprovados pelo backend e servem somente ao planejamento da web e da integração. Não afirmam que as APIs já existem.
- A execução da frente web está detalhada no [plano de implementação](docs/doctor-web-implementation-plan.md), separado da [experiência do médico](doctor-web-development-plan.md).

## Evidence on Hand

- `README.md`, `architecture-plan.md` e `functionalities.md` descrevem o produto e a arquitetura proposta.
- `mobile/src/types/index.ts` e `mobile/src/data/seedData.ts` contêm tipos e dados demonstrativos de Daniel Vaz.
- O mobile possui resultados laboratoriais, leituras de wearable e fluxos simulados de ingestão, alertas, chat e compartilhamento.
- Na inspeção de `origin/main` em `30ca3ed`, não existiam web nem backend versionados. Compartilhamento entre dispositivos ainda precisava de integração.
- Não existem medições iniciais de HbA1c, datas de início de medicamentos ou laudos originais utilizáveis no cenário inicial. Há inconsistências no simulador de wearable registradas no plano.

## Product Principles

- O backend unifica as fontes; o médico navega por paciente, contexto e evolução.
- Todo achado destacado deve permitir consultar a evidência de origem.
- O paciente controla quem acessa os dados e por quanto tempo.
- Ausência, desatualização e restrição de informação devem ser distinguíveis.
- Fatos registrados e interpretações sugeridas têm apresentações distintas.

## Stack

A frente web foi implementada em `web/` com React/Next.js App Router, TypeScript e Tailwind, Recharts para séries e `@xyflow/react` para relações. A validação usa mocks e um double HTTP de testes; integração real com backend/mobile permanece pendente. Resultados e limites estão no [registro da execução](docs/doctor-web-delivery.md).
