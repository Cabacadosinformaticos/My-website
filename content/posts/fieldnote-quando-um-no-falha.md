---
title: Como o Fieldnote recupera quando um serviço falha
desc: Replicação, reenvio seguro e recuperação automática num protótipo para estudos de diário. As decisões de engenharia e os resultados de nove cenários no servidor.
category: [Sistemas Distribuídos, Backend, PostgreSQL]
date: Nov 2026
readTime: 6 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654835/cabacatech/2026-11/covers/posts/fieldnote-quando-um-no-falha-e555e37b5a.webp
related: [project:fieldnote, post:fieldnote-agendar-sem-interromper]
---

Quando parámos a base de dados primária do Fieldnote, o Patroni promoveu outra réplica em 23,8 segundos. Medimos isso no servidor a 9 de novembro de 2026, com um script que mata o contentor e fica a ver o que acontece. O objetivo que tínhamos escrito era 45 segundos.

O Fieldnote é um projeto que desenvolvo com o César Oliveira para estudos de diário e etnografia móvel. O investigador define atividades. Os participantes enviam texto, fotografias, áudio ou vídeo a partir do telemóvel. Um registo pode descrever um momento que não volta a acontecer, por isso o que significa «guardado» pesa na arquitetura.

![Topologia lógica do Fieldnote usada nos ensaios de recuperação.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513994/cabacatech/2026-11/diagrams/fieldnote-logical-nodes-9fb8929971.webp)

## Três nós numa só máquina

O protótipo corre numa VM do bifrost (Ubuntu 24.04, hoje com 5 cores e 10 GiB), num único servidor físico. Lá dentro, o Docker Compose organiza 30 contentores em três nós lógicos. Cada nó tem uma réplica da API e membros dos clusters com estado. Há ainda dois gateways de entrada. Depois de reiniciar a VM, os 30 contentores voltaram a subir sozinhos.

Parar os contentores de um nó simula a perda desses serviços. Isolar o nó da rede simula uma partição. Isto testa os protocolos de replicação e recuperação. Não testa a perda de hardware, porque os três nós partilham a VM e a máquina física. Para isso, as réplicas teriam de estar em máquinas independentes.

## Confirmar exige mais do que receber

O PostgreSQL corre com Patroni em modo síncrono estrito e uma réplica síncrona. Esta é a parte da configuração que conta:

```yaml
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    synchronous_mode: true
    synchronous_mode_strict: true
```

A API só confirma um registo depois de ele estar escrito em dois nós da base de dados. Se a réplica síncrona cai, o Patroni passa outra réplica a síncrona. Durante essa troca as escritas esperam em vez de ficarem confirmadas num só nó.

A documentação do Patroni avisa que, mesmo em modo estrito, uma transação pode perder-se se a espera pela réplica for cancelada, porque o commit já está escrito no primário. Por isso a API não define nenhum timeout que possa cancelar essa espera. Só confirma depois de o commit voltar com sucesso e qualquer outro resultado chega à app como falha.

O RabbitMQ usa quorum queues para o trabalho assíncrono. O Garage guarda os ficheiros com uma interface S3 replicada. São três estados diferentes: um registo na base de dados, um trabalho por processar e um ficheiro enviado. Ter três APIs não resolve nenhum deles.

## O pedido pode chegar duas vezes

Durante uma promoção da base de dados, um pedido pode falhar ou demorar. O telemóvel tem de saber repetir sem criar um segundo registo.

A app gera o UUID do registo antes de o enviar. A API associa esse UUID ao conteúdo. Se receber o mesmo UUID com o mesmo conteúdo, reconhece o reenvio. Se o conteúdo for diferente, responde com conflito. Assim, se o servidor guarda a resposta e a ligação cai antes de o telemóvel a receber, o reenvio resolve a dúvida sem contar duas respostas no estudo. Funciona mesmo quando duas réplicas recebem o mesmo UUID quase ao mesmo tempo, porque a inserção na base de dados também trata o conflito.

A app conhece os dois gateways. Se um pedido falha por erro de rede ou com 502, 503 ou 504, tenta uma vez no outro. Cada tentativa espera cerca de 10 segundos. No emulador, com o gateway 1 parado e a app arrancada a frio, o convite abriu pelo gateway 2 passados esses 10 segundos. Falta repetir isto no telemóvel físico.

## Da gravação ao processamento

Depois de gravar um registo com media, a aplicação tem de pedir o processamento do ficheiro. Se gravasse primeiro e publicasse depois, uma falha entre as duas operações deixava o registo guardado e nenhum trabalho no broker.

Usamos uma transactional outbox. A transação que grava o registo grava também um evento numa tabela. Um relay lê os eventos por publicar, publica-os no RabbitMQ com confirmação e marca-os como publicados. Vários relays podem trabalhar em simultâneo porque cada um reserva os eventos com:

```sql
SELECT ... FOR UPDATE SKIP LOCKED
```

Pode haver repetições. Se o relay publica e cai antes de marcar o evento, na passagem seguinte volta a publicá-lo. A entrega é pelo menos uma vez. Quem processa tem de reconhecer o trabalho que já fez.

## O que medimos no servidor

Os scripts de falhas passaram nos nove cenários: API, nó lógico completo, primário, réplica síncrona, Garage, RabbitMQ, partição de rede, gateway e agendador. Correm a partir do repositório, um por cenário:

```sh
docker compose -f infra/deploy/compose.cluster.yaml exec -T pg1 patronictl list
bash infra/chaos/fs3-kill-primary.sh
```

Cada script mostra o estado antes, injeta a falha, mede, repõe o serviço, espera que o cluster volte a estar saudável e termina com `PASS` ou `FAIL`.

| Ensaio | Resultado observado |
|---|---|
| Parar uma API | Os gateways voltaram a responder em 1,1 s e 1,7 s |
| Parar o primário PostgreSQL | Nova líder em 23,8 s |
| Parar um nó do Garage durante envios | 45 fotografias confirmadas, sem perdas nem duplicados |
| Parar o primeiro gateway durante tráfego gerado | 120 registos confirmados, sem perdas nem duplicados |
| Parar o agendador ativo | A reserva assumiu em 15,2 s, sem planos duplicados |

Os 120 registos vieram de clientes de carga que simulavam dez telemóveis e eram só de texto: com o gateway 1 parado, um registo com media não consegue ser criado, porque o endpoint S3 do cluster passa por esse gateway. O envio de media com um nó de armazenamento perdido foi o ensaio das 45 fotografias. Usámos dados de demonstração. Nestes dois ensaios verificámos contagens e duplicados. Nos restantes, a tabela mostra os tempos de disponibilidade e recuperação.

## Próximo passo: o telemóvel

A app tem uma fila offline que guarda os registos até voltar a ligação. A validação seguinte leva esse percurso ao telemóvel físico, com modo de avião e reenvio. O restauro do backup cifrado já passou na stack de desenvolvimento, num ensaio à parte dos nove cenários do servidor.
