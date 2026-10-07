---
title: Fieldnote
desc: Plataforma distribuída e tolerante a falhas para estudos de diário e etnografia móvel. Três nós lógicos com PostgreSQL replicado por Patroni, RabbitMQ com quorum queues, armazenamento S3 replicado, envio idempotente e um agendador por satisfação de restrições. Projeto do 5.º semestre no IADE.
category: [Sistemas Distribuídos, Backend, Mobile]
year: 2026
type: Académico
duration: Set 2026 a Dez 2026
status: Em desenvolvimento
stack: [Python 3.12, FastAPI, PostgreSQL 17, Patroni, etcd, RabbitMQ, Garage S3, Traefik, Tailscale, React Native, React, Docker, Prometheus]
cover: ""
github: https://github.com/Cabacadosinformaticos/fieldnote
related: [project:cabacalab, post:publicar-um-site-sem-abrir-portas]
---

O Fieldnote é uma plataforma para estudos de diário: um investigador cria um estudo com atividades, e os participantes registam no telemóvel o que estão a viver naquele momento, em texto, foto, vídeo ou áudio. É o projeto do 5.º semestre e é avaliado em simultâneo por cinco cadeiras: Projeto de Desenvolvimento de Software, Engenharia de Software, Sistemas Distribuídos, Inteligência Artificial e Segurança Informática.

O requisito que define a arquitetura é este: **um registo feito no momento não pode ser recolhido outra vez**. Se a fotografia tirada à saída de uma consulta se perde, perde-se o dado. Tudo o que se segue existe para garantir que um registo confirmado ao participante sobrevive à falha de qualquer componente.

:::callout title="Estado do projeto"
A arquitetura, os requisitos, o modelo de dados, o modelo de falhas e os protótipos estão concluídos e aprovados. A implementação começa agora: protótipo funcional a 13 de novembro de 2026, entrega final a 18 de dezembro. Os valores desta página são de desenho; os tempos de recuperação reais vão ser medidos e publicados aqui.
:::

:::stats
3 | Nós lógicos replicados
11 | Cenários de falha testados
5 | Cadeiras avaliam o projeto
104 | Tarefas no plano
:::

## O meu papel

Somos dois: eu e o César Oliveira. Fico com a arquitetura distribuída, o backend e o agendador, a parte com mais peso em Sistemas Distribuídos e Inteligência Artificial. O César trata do dashboard, dos ecrãs da app e do arquivo. A modelação UML é feita em conjunto.

## Topologia

O sistema corre em três nós lógicos num único host Docker. Cada nó tem uma réplica da API e um membro de cada cluster com estado. Parar todos os containers de um nó simula a perda de uma máquina inteira, e a decisão de usar um só host tem uma razão prática: tem de ser possível correr a demonstração inteira num portátil, se o servidor falhar no dia da apresentação.

:::image-placeholder title="Diagrama de componentes" desc="Os três nós lógicos com API, PostgreSQL, etcd, RabbitMQ e Garage em cada um, os dois gateways, os workers e a monitorização no nó 3." ratio="16:9"
:::

| Componente | Nó 1 | Nó 2 | Nó 3 | Estado |
|---|---|---|---|---|
| API (FastAPI) | réplica | réplica | réplica | sem estado |
| Gateway (Tailscale + Traefik) | gateway 1 | gateway 2 | | sem estado |
| Agendador | ativo ou reserva | ativo ou reserva | | estado na base de dados |
| Worker de media | | sim | sim | estado no broker |
| PostgreSQL + Patroni + etcd | membro | membro | membro | **com estado** |
| RabbitMQ (quorum queues) | membro | membro | membro | **com estado** |
| Garage (S3) | zona | zona | zona | **com estado** |
| Prometheus, Grafana, Mailpit | | | sim | não replicado |

Os clientes chegam ao Traefik por HTTPS dentro de um túnel WireGuard (Tailscale). A API expõe REST e server-sent events, fala com o PostgreSQL por libpq, publica e consome trabalho por AMQP, e assina URLs para o S3 do Garage. As notificações saem pelo Expo Push.

## Consistência: o que "confirmado" quer dizer

A API só responde "guardado" depois de o commit chegar a duas cópias.

- **PostgreSQL** com Patroni em `synchronous_mode_strict` e uma réplica síncrona: o primário não confirma um commit sem a réplica o ter recebido. A perda de um nó lógico não perde nenhum registo confirmado (RPO zero, para esse cenário).
- **RabbitMQ** com quorum queues (Raft, 3 membros, maioria de 2). O publisher só recebe confirmação depois da replicação; os consumers fazem ack manual; uma mensagem que falha 5 vezes vai para uma dead letter queue.
- **Garage** com 3 cópias, uma por zona, e escrita confirmada com 2.

Em partição de rede, o sistema escolhe consistência. Um primário isolado perde a chave de líder no etcd e passa a só leitura, em vez de aceitar escritas que depois teriam de ser reconciliadas.

:::details title="O buraco do modo síncrono estrito, e como o evitamos"
Em `synchronous_mode_strict`, se a espera pela réplica for cancelada (por um timeout do cliente, por exemplo), o commit pode já estar escrito localmente sem estar replicado, e perder-se num failover. Por isso a API não define nenhum timeout que cancele essa espera. Se o pedido demorar demasiado, quem desiste é o telemóvel, e volta a enviar o mesmo registo com o mesmo UUID: a idempotência trata do resto.
:::

## Envio de um registo, passo a passo

O telemóvel não tem rede garantida, e um envio pode falhar a meio em qualquer ponto. O protocolo foi desenhado para que repetir seja sempre seguro.

```text title="protocolo de envio"
1. app     gera UUID do registo + SHA-256 do conteúdo, guarda na fila local (SQLite)
2. app  -> API      pede um URL de envio para o ficheiro do registo
3. API     cria media_object 'pending' e devolve URL assinado (10 min, tamanho e tipo assinados)
4. app  -> Garage   PUT do ficheiro pelo URL assinado
5. app  -> API      confirma o registo, com o mesmo UUID
6. API     verifica o objeto; numa só transação grava o registo e um evento no outbox
7. worker  valida o tipo real do ficheiro, remove metadados de localização, converte vídeo para H.264
8. job     apaga objetos 'pending' com mais de 7 dias
```

A chave de idempotência é o UUID gerado no telemóvel. Um reenvio com o mesmo UUID e o mesmo hash devolve `200`; com o mesmo UUID e um hash diferente devolve `409 Conflict`, porque é outro conteúdo a fingir ser o mesmo registo. Se o nó onde estava o URL de envio cair, o envio falha e a app pede um URL novo.

## Transactional outbox

Escrever na base de dados e depois publicar no RabbitMQ são duas operações, e qualquer uma pode falhar sozinha. A API escreve o registo e o evento na tabela `outbox_event` na mesma transação. Em cada réplica da API, um relay lê eventos pendentes com `SELECT ... FOR UPDATE SKIP LOCKED`, publica com confirmação e marca-os como publicados.

- Entrega **pelo menos uma vez**: um relay que cai depois de publicar e antes de marcar volta a publicar. Os consumers deduplicam pelo id do evento.
- Sem garantia de ordem entre relays, e nenhum consumer depende dela.
- Se o broker estiver em baixo, os eventos esperam na base de dados. Eventos publicados são apagados ao fim de 7 dias.

## Deteção e recuperação

:::specs title="Parâmetros de desenho"
Health check do Traefik: a cada 2 s, timeout de 1 s
Critério de saúde da API: consegue escrever na BD e chegar ao broker
Patroni: ttl 30 s, loop_wait 10 s
Lease do agendador: renovada a cada 5 s, expira aos 15 s
Retry da API: transação inteira, até 3 vezes
Pool de ligações: verificação antes do uso, connect timeout 3 s
:::

| Falha | Alvo de recuperação |
|---|---|
| Réplica da API | < 5 s (o Traefik deixa de a usar) |
| Gateway | < 5 s (a app troca para o segundo) |
| Agendador ativo | < 20 s (a reserva apanha a lease) |
| Réplica síncrona | alguns segundos de escritas em pausa |
| Primário PostgreSQL | até 45 s até à promoção |

Durante a promoção do primário, a API falha o próprio health check (porque não consegue escrever) e fica indisponível até 45 s. É um compromisso consciente: preferimos recusar pedidos durante esse tempo a confirmar registos que não estão replicados.

## O modelo de falhas

Cada cenário é provocado por scripts em `infra/chaos/` (`docker kill`, `docker stop`, desligar um nó da rede interna), com um gerador de carga a correr. Medimos o tempo de deteção, o tempo de recuperação, os pedidos falhados, os registos perdidos, os duplicados e se a redundância volta ao fim.

:::details title="Os 11 cenários"
| # | Falha provocada | Comportamento esperado |
|---|---|---|
| 1 | Matar um container da API | Sem perdas nem duplicados; o Traefik usa as outras réplicas |
| 2 | Parar um nó inteiro e voltar a ligá-lo | O serviço continua em 2 de 3 nós |
| 3 | Matar o primário PostgreSQL | A réplica síncrona é promovida, sem perda de registos confirmados |
| 4 | Matar a réplica síncrona | Escritas em pausa uns segundos, depois retomam |
| 5 | Matar um nó do Garage durante o envio de um vídeo | O envio ligado a esse nó falha e a app pede um URL novo |
| 6 | Matar um nó do RabbitMQ | Nenhum evento perdido; o quorum continua |
| 7 | Isolar um nó da rede interna | Deixa de servir; os outros continuam a escrever; ressincroniza ao voltar |
| 8 | Telemóvel em modo de avião com 3 registos | Todos chegam uma vez, sem duplicados |
| 9 | Restaurar o último backup cifrado numa stack limpa | As contagens batem certo, exceto apagamentos pendentes |
| 10 | Parar o gateway 1 | A app troca para o gateway 2 em menos de 5 s |
| 11 | Matar o agendador ativo | A reserva apanha a lease em menos de 20 s |
:::

## O agendador: um problema de satisfação de restrições

A única componente de IA decide quando enviar cada pedido de registo a cada participante.

- **Variáveis**: uma por pedido (participante, atividade, ocorrência). O domínio são os intervalos de 15 minutos dentro da disponibilidade do participante e da janela da atividade, no máximo 56 valores, mais "não planeado".
- **Restrições**: intervalo mínimo entre pedidos ao mesmo participante, máximo de pedidos por dia por participante, máximo de pedidos no mesmo intervalo para todo o estudo.
- **Objetivo** lexicográfico: primeiro maximizar os pedidos planeados, depois uma pontuação de variedade, de rotina, ou equilibrada (0,5 e 0,5).
- **Método**: backtracking escrito à mão em Python, com MRV, LCV, forward checking e AC-3, em modo anytime com limite de 10 s por estudo. Sem biblioteca de solvers, porque o objetivo da cadeira é mostrar estes métodos.
- **Avaliação**: estudos gerados de 10, 50 e 100 participantes, orçamento fixo de 1 milhão de nós e uma ablação em cinco passos.

Há duas instâncias do agendador e só uma trabalha: a que tem a lease. A verificação da lease e a marcação de "enviado" acontecem na mesma instrução SQL, por isso um agendador que perdeu a lease não consegue enviar em duplicado.

## Segurança e privacidade

- **Autenticação**: Argon2id (19 MiB, 2 iterações), access tokens de 15 minutos, refresh tokens rotativos guardados em hash, com deteção de reutilização e revogação da família inteira. TOTP obrigatório para administradores.
- **Autorização**: administrador, investigador (por estudo) e participante (só os próprios registos), verificados em cada pedido.
- **Rede**: sem portas públicas; tudo passa pelo WireGuard do Tailscale, com HTTPS por cima.
- **Minimização**: conta de participante opcional; o identificador do dispositivo é um HMAC-SHA256 com um sal por estudo e o ID do Android é descartado; a localização é removida dos ficheiros quando a atividade não a pede; as exportações não levam identidade, localização nem media por defeito.
- **Apagamento**: o participante pede-o na app; os dados ficam ocultos de imediato e são apagados 7 dias depois. Os backups são cifrados com `age` antes de sair do host.

:::decision title="Acesso só por Tailscale"
Um projeto académico não precisa de estar exposto à Internet. Os professores e os participantes de teste entram numa rede privada, e o projeto fica separado das minhas contas e domínio pessoais.
:::

## Como estamos a trabalhar

Antes de escrever código fizemos cerca de 21 000 palavras de investigação em 9 documentos, um relatório de 46 páginas, uma memória descritiva de 25 e um modelo de falhas de 19 páginas com os 11 cenários. O plano vive num GitHub Project público com 104 tarefas organizadas em épicos.

:::resource title="Repositório do Fieldnote" url="https://github.com/Cabacadosinformaticos/fieldnote" label="Ver no GitHub"
O código, a documentação e o plano de trabalho são públicos.
:::

## Próximos passos

- Protótipo a 13 de novembro: API, PostgreSQL replicado, envio de registos a partir da app.
- Correr os 11 cenários e publicar aqui os tempos medidos.
- Entrega final a 18 de dezembro de 2026.
