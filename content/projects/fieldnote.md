---
title: Fieldnote
desc: Protótipo para estudos de diário e etnografia móvel, com app offline, dashboard e backend distribuído. Três nós lógicos numa VM, recuperação de serviços ensaiada e agendador por satisfação de restrições.
category: [Sistemas Distribuídos, Backend, Mobile]
year: 2026
type: Académico
duration: Set 2026 a Dez 2026
status: Em desenvolvimento
stack: [Python 3.12, FastAPI, PostgreSQL 17, Patroni, etcd, RabbitMQ, Garage S3, Traefik, Tailscale, React Native, React, Docker, Prometheus]
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654850/cabacatech/2026-11/covers/projects/fieldnote-097a5c156a.webp
github: https://github.com/Cabacadosinformaticos/fieldnote
related: [post:fieldnote-quando-um-no-falha, post:fieldnote-agendar-sem-interromper, project:cabacalab]
---

O Fieldnote já tem um protótipo funcional: o investigador cria estudos e atividades no dashboard e o participante regista texto, fotografia, vídeo ou áudio na app. A plataforma serve estudos de diário e etnografia móvel, em que interessa recolher uma experiência perto do momento em que aconteceu.

É o projeto do 5.º semestre no IADE, avaliado por Projeto de Desenvolvimento de Software, Engenharia de Software, Sistemas Distribuídos, Inteligência Artificial e Segurança Informática. Estou a desenvolvê-lo com o César Oliveira.

:::callout title="Estado em 12 de novembro de 2026"
O protótipo corre no servidor desde 9 de novembro, com API, dashboard, app com fila offline, agendador e processamento de media. A recuperação dos serviços foi validada em nove cenários de falha no servidor. A demonstração organiza três nós lógicos numa única VM e usa dados preparados para esse efeito.
:::

:::stats
3 | Nós lógicos numa VM
9 | Cenários de falha no servidor
5 | Unidades curriculares
2 | Elementos na equipa
:::

## O meu papel

Fico com a arquitetura distribuída, o backend e o agendador, com mais peso em Sistemas Distribuídos e Inteligência Artificial. O César trata do dashboard, dos ecrãs da app e do arquivo. Fazemos a modelação UML em conjunto.

O desenvolvimento partiu de investigação sobre estudos de diário e de entrevistas que ajudaram a rever os requisitos e os ecrãs. O protótipo usa dados de demonstração. Não apresentamos os testes técnicos como um estudo com participantes reais.

:::carousel
https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514028/cabacatech/2026-11/screenshots/fieldnote/fieldnote-portal-activities-a6aec4516a.webp | Dashboard real do Fieldnote com o estudo de demonstração Viver o Jardim da Estrela. Identidade da conta ocultada.
https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514025/cabacatech/2026-11/screenshots/fieldnote/fieldnote-app-03-hoje-373e8787e1.webp | Ecrã Hoje na app Android, com dados de demonstração.
https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514026/cabacatech/2026-11/screenshots/fieldnote/fieldnote-app-04-registo-escala-c471129ec4.webp | Resposta por escala na app Android, com dados de demonstração.
:::

## Topologia

![Três nós lógicos do Fieldnote dentro de uma única VM.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513994/cabacatech/2026-11/diagrams/fieldnote-logical-nodes-9fb8929971.webp)

O Docker Compose separa os serviços em três nós lógicos. Cada um inclui uma réplica da API e um membro dos clusters com estado. Dois gateways permitem entrar na plataforma por HTTPS através do Tailscale.

| Componente | Distribuição no protótipo |
|---|---|
| API FastAPI | Três réplicas |
| Tailscale e Traefik | Dois gateways |
| Agendador | Uma instância ativa e uma em espera |
| PostgreSQL, Patroni e etcd | Três membros |
| RabbitMQ | Três membros com quorum queues |
| Garage S3 | Três zonas lógicas |
| Processamento de media | Workers assíncronos |

Esta separação permite parar um grupo de contentores ou isolá-lo da rede para ensaiar o comportamento distribuído. O protótipo concentra-se na recuperação entre serviços e nós lógicos. A VM e o host físico são partilhados, pelo que a disponibilidade perante falhas de hardware exigiria distribuir as réplicas por máquinas independentes.

## Consistência: o que «confirmado» quer dizer

O PostgreSQL usa Patroni com modo síncrono estrito e uma réplica síncrona. A configuração exige a confirmação da réplica para concluir a escrita. Se faltar a réplica necessária, as escritas podem esperar em vez de receber uma confirmação sem essa cópia.

O RabbitMQ usa quorum queues e publisher confirms. O Garage replica os objetos de media. A durabilidade do registo depende destes percursos, não apenas de manter uma API disponível.

O objetivo de desenho é conservar os registos confirmados perante a perda de um nó lógico. Os testes acompanham a recuperação dos serviços e, nos cenários com tráfego de media e troca de gateway, verificam também as contagens de registos e os duplicados.

## Envio de um registo, passo a passo

A app guarda o registo numa fila local e mantém o seu UUID durante as tentativas de envio. Quando há media, pede um URL assinado e envia o ficheiro para o armazenamento. Depois confirma o registo na API.

A API verifica o pedido e associa-lhe o hash do conteúdo. Um reenvio com o mesmo UUID e conteúdo é reconhecido. Um UUID já usado com conteúdo diferente dá conflito. A inserção trata também da corrida entre pedidos recebidos por réplicas diferentes.

Se a ligação cair depois de o servidor guardar e antes de a app receber a resposta, a app pode repetir o mesmo pedido. A idempotência evita que essa dúvida produza dois registos.

## Transactional outbox

A transação que grava o registo grava também os eventos a publicar numa tabela de outbox. Relays leem eventos pendentes com `FOR UPDATE SKIP LOCKED`, publicam no RabbitMQ com confirmação e marcam a publicação.

Se um relay cair entre publicar e marcar, pode voltar a publicar o mesmo evento. O processamento precisa de reconhecer as repetições. Esta entrega pelo menos uma vez mantém a intenção de trabalho na base de dados quando o broker está indisponível.

## Deteção e recuperação

O Traefik verifica a saúde das APIs e encaminha os pedidos para as réplicas disponíveis. O Patroni gere a liderança da base de dados. O agendador usa uma lease renovável, para que uma instância em espera possa assumir depois da perda da ativa.

| Falha provocada em 9 de novembro | Resultado observado |
|---|---|
| Uma réplica da API | Gateways a responder em 1,1 s e 1,7 s |
| Primário PostgreSQL | Nova líder em 23,8 s |
| Réplica síncrona | Nova réplica síncrona em 9,9 s |
| Agendador ativo | Reserva assumiu em 15,2 s |

São medições dessa corrida no servidor, não limites garantidos. O cliente também tem tempos de espera próprios. A troca de gateway na app, por exemplo, depende de detetar o erro ou esgotar a tentativa anterior.

## O modelo de falhas

Há scripts para onze cenários. Nove passaram na corrida do servidor: perda de API, nó lógico, primário, réplica síncrona, nó de armazenamento, nó do broker, isolamento de rede, gateway e agendador.

No ensaio de armazenamento, os 45 registos com fotografia foram confirmados sem perdas nem duplicados. No de gateway, aconteceu o mesmo aos 120 registos enviados por clientes de carga. Estes resultados usam dados de demonstração e correspondem às condições dessa corrida.

O restauro do backup cifrado passou separadamente na stack de desenvolvimento. A validação seguinte da app inclui o modo de avião num telemóvel físico, para acompanhar o percurso completo da fila local até ao servidor.

## O agendador: satisfação de restrições

O agendador escolhe intervalos de 15 minutos dentro da disponibilidade do participante e da janela da atividade. Respeita intervalos mínimos, limites diários e capacidade por intervalo. Cada pedido pode ficar «não planeado». O objetivo maximiza primeiro os pedidos colocados e depois a pontuação de variedade ou rotina.

O solver usa backtracking, forward checking, MRV, LCV e branch and bound. O AC-3 identifica conflitos sem eliminar horários, porque permitir pedidos não planeados altera a validade dessa eliminação.

A carga ponderada distingue vídeo (5), fotografia e áudio (2) de texto, escala e escolha (1). O agendador inclui a carga já planeada de outros estudos. Resolve-os sequencialmente, sem procurar um ótimo global entre todos.

A avaliação usa estudos gerados. Em 300 problemas pequenos, de 6 a 12 pedidos, o solver igualou a pesquisa exaustiva na contagem e na pontuação. Em problemas maiores, o orçamento pode terminar antes da prova de optimalidade. Estes resultados não medem adesão nem qualidade das respostas de participantes.

## Segurança e privacidade

A plataforma tem autenticação, autorização por papel e por estudo, gestão de sessões e fluxos de apagamento. Os backups são cifrados. A rede privada Tailscale limita o acesso ao protótipo aos dispositivos autorizados.

Os testes e as demonstrações usam dados preparados para esse efeito. A privacidade orienta também a gestão dos dados do estudo e os percursos de consulta e apagamento disponíveis aos utilizadores.

## Como estamos a trabalhar

Mantemos requisitos, modelos, investigação e resultados de testes junto do projeto. Cada ensaio tem condições e indicadores definidos, para podermos repeti-lo à medida que a implementação evolui. O dashboard, a app e o backend partilham os mesmos percursos de estudo e recolha, revistos pela equipa ao longo do semestre.

:::resource title="Repositório do Fieldnote" url="https://github.com/Cabacadosinformaticos/fieldnote" label="Ver no GitHub"
Código e documentação do projeto, desenvolvido com o César Oliveira.
:::

## Próximos passos

- Executar o cenário offline no telemóvel físico e guardar o resultado.
- Alargar a medição de perda e duplicação aos cenários que só verificaram recuperação.
- Continuar a validação do protótipo para a entrega final, em dezembro de 2026.
