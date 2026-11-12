---
title: Como o Fieldnote recupera quando um serviço falha
desc: Replicação, reenvio seguro e recuperação automática num protótipo para estudos de diário. As decisões de engenharia e os resultados de nove cenários no servidor.
category: [Sistemas Distribuídos, Backend, PostgreSQL]
date: Nov 2026
readTime: 6 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654835/cabacatech/2026-11/covers/posts/fieldnote-quando-um-no-falha-e555e37b5a.webp
related: [project:fieldnote, post:fieldnote-agendar-sem-interromper]
---

Parar a base de dados primária do Fieldnote deu-nos uma medição concreta: o Patroni promoveu outra réplica em 23,8 segundos. Esse número veio de um ensaio no servidor, em 9 de novembro de 2026. A recuperação automática já faz parte do protótipo e conseguimos observar como os serviços reagem quando uma componente deixa de responder.

O Fieldnote é um projeto que estou a desenvolver com o César Oliveira para estudos de diário e etnografia móvel. Um investigador define atividades. Os participantes enviam texto, fotografias, áudio ou vídeo a partir do telemóvel. Um registo pode descrever um momento que não volta a acontecer. Por isso, o significado de «guardado» tem consequências na arquitetura.

![Topologia lógica do Fieldnote usada nos ensaios de recuperação.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513994/cabacatech/2026-11/diagrams/fieldnote-logical-nodes-9fb8929971.webp)

## Três nós dentro da mesma máquina

O protótipo corre numa única VM, num único servidor físico. Dentro dela, o Docker Compose organiza os serviços em três nós lógicos. Cada grupo inclui uma réplica da API e membros dos clusters com estado. Existem ainda dois gateways de entrada.

Parar os contentores de um grupo permite observar a perda conjunta desses serviços. Isolar o grupo da rede permite ensaiar uma partição. Estes testes exercitam os protocolos de replicação e recuperação.

A demonstração concentra-se na recuperação dos serviços: os três grupos partilham a VM e o host físico. Essa topologia permite reproduzir o cluster num ambiente académico e ensaiar os protocolos de replicação. A disponibilidade perante a perda de hardware exigiria distribuir as réplicas por máquinas independentes.

## Confirmar exige mais do que receber

O PostgreSQL usa Patroni com modo síncrono estrito e uma réplica síncrona. O objetivo é impedir que a aplicação confirme uma escrita enquanto a cópia necessária não a recebeu. Perder a réplica pode, por isso, obrigar a esperar por outra antes de continuar a confirmar escritas.

O RabbitMQ usa quorum queues para o trabalho assíncrono. O Garage guarda os ficheiros através de uma interface S3 com replicação. São estados diferentes: um registo na base de dados, um trabalho para processar e um ficheiro enviado. Ter três APIs não resolve sozinho nenhum destes três problemas.

Também interessa aceitar períodos de indisponibilidade. Durante uma promoção de base de dados, um pedido pode falhar ou demorar. O cliente precisa de saber repetir sem criar um segundo registo. A recuperação do servidor e o comportamento do telemóvel fazem parte do mesmo percurso.

## O pedido pode chegar duas vezes

A app gera o UUID do registo antes de o enviar. A API associa esse identificador ao conteúdo. Se recebe novamente o mesmo UUID com o mesmo conteúdo, reconhece o reenvio. Se o conteúdo é diferente, responde com conflito.

Imaginemos que o servidor guarda a resposta e a ligação cai antes de o telemóvel receber a confirmação. O cliente ficou sem saber o resultado. Voltar a enviar o mesmo identificador permite resolver essa dúvida sem contar duas respostas no estudo.

Esta propriedade chama-se idempotência. Não depende de a rede entregar cada pedido uma única vez. Depende de a aplicação reconhecer as repetições, incluindo quando duas réplicas recebem o mesmo UUID quase em simultâneo. A inserção na base de dados trata também desse conflito.

## Ligar o registo ao processamento

Depois de guardar um registo com media, a aplicação precisa de pedir o processamento do ficheiro. Gravar primeiro e publicar depois deixaria um intervalo perigoso: uma falha entre as duas operações podia guardar o registo sem deixar trabalho no broker.

Usamos uma transactional outbox. A transação que grava o registo grava também um evento numa tabela. Um relay lê os eventos pendentes, publica no RabbitMQ com confirmação e marca-os como publicados. Vários relays podem trabalhar com `FOR UPDATE SKIP LOCKED`.

Ainda pode haver uma repetição: o relay publica e cai antes de marcar o evento. Na próxima passagem volta a publicá-lo. A entrega é pelo menos uma vez e o processamento tem de reconhecer o trabalho já tratado. A outbox fecha o intervalo entre a escrita e a intenção de publicar; não transforma duas operações numa entrega mágica de uma única vez.

## O que medimos no servidor

Os scripts de falhas passaram em nove cenários: API, nó lógico completo, primário, réplica síncrona, Garage, RabbitMQ, partição de rede, gateway e agendador.

| Ensaio | Resultado observado |
|---|---|
| Parar uma API | Os gateways voltaram a responder em 1,1 s e 1,7 s |
| Parar o primário PostgreSQL | Nova líder em 23,8 s |
| Parar um nó do Garage durante envios | 45 fotografias confirmadas, sem perdas nem duplicados |
| Parar o primeiro gateway durante tráfego gerado | 120 registos confirmados, sem perdas nem duplicados |
| Parar o agendador ativo | A reserva assumiu em 15,2 s, sem planos duplicados |

Os 120 registos vieram de clientes de carga que simulavam dez telemóveis. Os ensaios usam dados de demonstração e permitem repetir as condições. Nos testes de armazenamento e gateway verificámos contagens e duplicados. Nos restantes, a tabela apresenta os indicadores de disponibilidade e recuperação recolhidos.

## Do ensaio ao uso no telemóvel

A app inclui uma fila offline para conservar os registos até recuperar a ligação. A validação seguinte leva esse percurso ao telemóvel físico, incluindo o modo de avião e o reenvio. O restauro do backup cifrado já passou na stack de desenvolvimento, num ensaio separado dos nove cenários do servidor.

Para cada falha guardamos o que parámos, como a detetámos, o efeito no cliente e como voltou a redundância. Este método permite comparar o comportamento esperado com o observado e repetir a experiência depois de alterar a implementação. É a base para continuar a validar o percurso completo, desde o registo guardado no dispositivo até à consulta pelo investigador.
