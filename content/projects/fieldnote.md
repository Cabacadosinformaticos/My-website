---
title: Fieldnote
desc: Plataforma distribuída e tolerante a falhas para estudos de diário e etnografia móvel. Projeto do 5.º semestre de Engenharia Informática no IADE, partilhado por cinco cadeiras.
category: [Sistemas Distribuídos, Mobile, Backend]
year: 2026
type: Académico
duration: Set 2026 a Dez 2026
status: Em desenvolvimento
stack: [FastAPI, PostgreSQL, Patroni, RabbitMQ, Garage S3, React Native, React, Docker]
cover: ""
github: https://github.com/Cabacadosinformaticos/fieldnote
related: [project:cabacalab, post:como-comecei-o-meu-homelab]
---

O Fieldnote é uma plataforma para estudos de diário: um investigador cria um estudo com atividades, e os participantes registam no telemóvel o que estão a viver naquele momento, em texto, foto, vídeo ou áudio, com hora e local. É o projeto do 5.º semestre da licenciatura e é avaliado em simultâneo por cinco cadeiras: Projeto de Desenvolvimento de Software, Engenharia de Software, Sistemas Distribuídos, Inteligência Artificial e Segurança Informática.

:::callout title="Em desenvolvimento"
O projeto está na fase de desenho. A arquitetura, os requisitos e os protótipos de ecrã estão aprovados pelas cadeiras. O protótipo funcional está previsto para 13 de novembro de 2026 e a entrega final para 18 de dezembro de 2026. Esta página vai crescendo com o projeto.
:::

:::image-placeholder title="Mapa de conceitos do Fieldnote" desc="Diagrama de conceitos do relatório: estudo, atividade, participante, registo." ratio="16:9"
:::

## O problema

Num estudo de diário, um registo feito no momento não pode ser recolhido outra vez. Se a fotografia de uma refeição ou o áudio gravado à saída de uma consulta se perde, perde-se o dado. Isto junta três problemas difíceis de sistemas distribuídos:

- **Picos de envio.** Dezenas de participantes podem enviar vídeos ao mesmo tempo, à mesma hora do dia.
- **Estudos de semanas sem janela de manutenção.** O sistema tem de aguentar a falha de uma máquina sem parar.
- **Telemóveis com rede intermitente.** O participante grava no metro e o envio só acontece mais tarde.

A pergunta que orienta o desenho é simples: o que acontece a um registo quando alguma coisa falha pelo caminho?

## O meu papel

Somos dois: eu e o César Oliveira. Fico com a arquitetura e o backend, a parte que mais pesa na nota de Sistemas Distribuídos. O César trata do dashboard, dos ecrãs da app e do arquivo. Os diagramas UML fazemos em conjunto.

:::stats
5 | Cadeiras avaliam o projeto
3 | Nós lógicos replicados
42 | Ecrãs nos protótipos
104 | Tarefas no plano
:::

## Arquitetura

O sistema corre em três nós lógicos. Cada nó tem uma réplica da API e um membro de cada cluster: base de dados, fila de mensagens e armazenamento de ficheiros. Parar os containers de um nó simula a perda de uma máquina inteira.

| Camada | Tecnologia | Porquê |
|---|---|---|
| App do participante | React Native, Expo, SQLite | Funciona offline e guarda os registos numa fila local |
| Dashboard do investigador | React, Vite | Criação de estudos e consulta de dados |
| API | Python 3.12, FastAPI | Uma réplica por nó, sem estado |
| Base de dados | PostgreSQL 17, Patroni, etcd | Eleição automática de um novo primário quando o atual cai |
| Mensagens | RabbitMQ com quorum queues | As filas sobrevivem à perda de um nó |
| Ficheiros | Garage (compatível com S3) | Fotos, vídeos e áudio replicados entre nós |
| Acesso | Tailscale e Traefik | Dois pontos de entrada; a app troca para o segundo se o primeiro falhar |
| Observação | Prometheus, Grafana | Ver a falha a acontecer, e a recuperação |

:::image-placeholder title="Diagrama de arquitetura" desc="Os três nós lógicos, cada um com API, PostgreSQL, RabbitMQ e Garage, e os dois gateways." ratio="16:9"
:::

## Como um registo não se perde

Esta é a parte que mais gosto de explicar, porque cada passo responde a uma falha concreta.

1. **A app guarda primeiro, envia depois.** O registo entra numa fila local em SQLite. Sem rede, fica lá até haver.
2. **Cada registo tem identidade própria.** A app gera um UUID e calcula um hash do conteúdo. Se o envio for repetido, a API reconhece-o e não cria duplicados. Isto chama-se inserção idempotente.
3. **O ficheiro vai antes dos dados.** A API devolve um URL assinado, válido durante 10 minutos, e a app envia o ficheiro diretamente para o armazenamento. Só depois regista os metadados. Ficheiros que nunca chegam a ser confirmados são apagados ao fim de 7 dias.
4. **A base de dados e a fila nunca discordam.** Em vez de escrever na base de dados e depois publicar uma mensagem (e arriscar que uma das duas falhe), a API escreve as duas coisas na mesma transação, numa tabela de saída. Um processo à parte publica essa tabela no RabbitMQ. É o padrão transactional outbox.

:::details title="Os números do desenho"
| Parâmetro | Valor |
|---|---|
| Verificação de saúde dos nós | a cada 2 s |
| Renovação de lease | 5 s, expira aos 15 s |
| TTL do Patroni | 30 s |
| Duração máxima de vídeo | 2 minutos |
| Validade do URL de envio | 10 minutos |

São valores de desenho, ainda não medidos. Os tempos reais de recuperação vão ser medidos nos testes de falha e publicados aqui.
:::

## Decisões que tomámos

:::decision title="Um host Docker com três nós lógicos"
Considerámos três VMs com Docker Swarm. Ficou de fora porque eu queria conseguir correr o sistema inteiro no portátil, se o servidor falhar no dia da apresentação. Três nós lógicos num só host permitem demonstrar a tolerância a falhas em qualquer máquina.
:::

:::decision title="Acesso só por Tailscale"
Um projeto académico não precisa de estar exposto à Internet. Com Tailscale, os professores e os participantes de teste entram numa rede privada, e o projeto fica separado das minhas contas e domínio pessoais.
:::

:::decision title="Conta de participante opcional"
O participante entra por QR code, por código ou por uma bolsa de voluntários, e pode participar sem conta. Recolhemos o mínimo de dados pessoais, e mesmo assim cada pessoa só participa uma vez em cada estudo. A app permite apagar os próprios dados, com um período de 7 dias para voltar atrás.
:::

## Onde entra a Inteligência Artificial

A única componente de IA é o agendador. Decidir quando enviar cada pedido de registo a cada participante, respeitando horários, frequências e limites, é um problema de satisfação de restrições. O agendador resolve-o e devolve um plano de notificações por participante.

## Como estamos a organizar o trabalho

Antes de escrever código, fizemos cerca de 21 000 palavras de investigação em 9 documentos, um relatório de 46 páginas, uma memória descritiva de 25 e um modelo de falhas com 11 cenários. O plano vive num GitHub Project público, com 104 tarefas organizadas em épicos.

:::resource title="Repositório do Fieldnote" url="https://github.com/Cabacadosinformaticos/fieldnote" label="Ver no GitHub"
O código, a documentação e o plano de trabalho são públicos.
:::

## Próximos passos

- Protótipo funcional a 13 de novembro de 2026: API, base de dados replicada e envio de registos a partir da app.
- Testes de falha com medição real dos tempos de recuperação.
- Entrega final a 18 de dezembro de 2026.
