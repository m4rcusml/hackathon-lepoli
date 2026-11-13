# Compartilhamento de contexto clínico

Vocabulário do hub pessoal e do acesso assistencial entre instituições. As definições distinguem atendimento, autorização, conteúdo entregue e cobrança.

## Linguagem

**Consulta clínica**:
Atendimento de um paciente por um profissional de saúde. Sua realização, por si só, não significa consumo cobrável da plataforma.
_Evitar_: consulta ao banco, chamada de API, consulta cobrável.

**Instituição de origem**:
Organização que mantém e responde pelos registros de saúde que produziu ou custodia.
_Evitar_: dona dos dados do paciente.

**Instituição solicitante**:
Organização assistencial em nome da qual um profissional identificado solicita um recorte autorizado do histórico de um paciente.
_Evitar_: instituição destinatária irrestrita.

**Cofre pessoal**:
Conjunto de documentos e registros que o paciente fornece ao hub para organizar seu histórico e controlar seu compartilhamento.
_Evitar_: réplica das bases institucionais.

**Autorização de acesso**:
Permissão delimitada por paciente, destinatário, finalidade, categorias de informação e duração. Não equivale a uma autorização genérica para todo tratamento ou uso comercial.
_Evitar_: acesso total, consentimento universal.

**Episódio de acesso institucional**:
Contexto de uso ligado a uma instituição solicitante, um paciente, um atendimento e uma finalidade assistencial definidos. Pode envolver várias leituras e atualizações do mesmo conjunto autorizado.
_Evitar_: requisição, clique, sessão do navegador.

**Pacote clínico**:
Recorte do histórico autorizado, acompanhado de origem, versões, cobertura e limitações; pode incluir síntese rastreável quando disponível.
_Evitar_: prontuário completo, verdade clínica definitiva.

**Evento de uso**:
Registro de uma ação ou resultado do acesso à plataforma, inclusive tentativas negadas e falhas. Nem todo evento de uso é cobrável.
_Evitar_: venda de dado, cobrança automática por acesso.

**Evento de cobrança**:
Reconhecimento de uma unidade de serviço contratada, após a entrega confirmada de um pacote clínico elegível no episódio. Não é uma cobrança por cada dado ou leitura.
_Evitar_: consulta HTTP, compra do histórico do paciente.

**Materialização longitudinal**:
Conservação continuada, no hub, de uma cópia autorizada de informações provenientes de uma instituição, com finalidade e ciclo de vida próprios.
_Evitar_: cache, cópia implícita.
