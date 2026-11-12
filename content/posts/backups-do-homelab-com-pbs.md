---
title: Backups do homelab com Proxmox Backup Server
desc: Os dois hosts Proxmox já têm backups noturnos configurados para um PBS no bifrost. O destino, a retenção, a verificação e os dados que continuam sem segunda cópia.
category: [Homelab, Proxmox, Backups]
date: Nov 2026
readTime: 7 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654827/cabacatech/2026-11/covers/posts/backups-do-homelab-com-pbs-d5d72faa84.webp
series: Diário do Homelab
seriesPart: 8
related: [post:chega-o-bifrost, post:nas-com-samba-e-cockpit, project:homelab-proxmox-servidorzinho]
---

Configurei o Proxmox Backup Server para receber os backups dos dois servidores do homelab. O PBS corre num container no bifrost e guarda o datastore num disco USB de 10 TB. As tarefas noturnas ficaram definidas a 9 de novembro.

Até aqui, a CabacaLab já produzia dumps das bases de dados e snapshots locais. Eram úteis para voltar atrás numa alteração, mas continuavam dependentes do armazenamento do servidor. A falta de um destino separado aparecia repetidamente na lista de coisas por resolver.

Com um destino próprio, passei a poder definir a retenção das VMs e acompanhar as tarefas dos dois hosts no mesmo serviço. A decisão seguinte foi dividir o disco entre esse histórico de backups e os ficheiros da NAS.

![Os dois hosts enviam backups para o PBS. NAS e backups usam datasets separados no mesmo disco USB.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513999/cabacatech/2026-11/diagrams/pbs-and-nas-586f72e274.webp)

## Porque escolhi o PBS

Queria um destino comum para as VMs e os containers dos dois hosts Proxmox. Podia ter ficado com ficheiros de backup completos num disco de rede. Escolhi o PBS pela integração com o Proxmox e pela deduplicação dos dados guardados.

A deduplicação permite reutilizar blocos que já existem no datastore. Isso é útil quando vários pontos de recuperação contêm grande parte dos mesmos dados: o histórico pode manter versões sucessivas sem guardar repetidamente todos os blocos iguais.

O PBS também reúne as tarefas de retenção e de verificação. A vantagem prática é ter um local onde consultar os backups e o resultado das operações, em vez de depender apenas da existência de ficheiros numa pasta.

:::decision title="Um destino comum para os dois hosts"
O Servidorzinho envia os seus backups pela ligação direta ao bifrost. O bifrost usa o mesmo PBS. A solução centraliza a gestão, mas concentra o destino de recuperação numa só máquina e num só disco.
:::

## Onde ficam os dados

O PBS está num LXC não privilegiado com 2 GiB de RAM e um disco de sistema de 8 GB. O datastore está fora desse disco de sistema: usa um dataset ZFS do disco USB, montado no container.

Separei esse dataset das partilhas da NAS. O espaço de backup tem uma quota ZFS de 3 TB. A quota limita o crescimento do datastore para que a retenção de VMs não ocupe todo o disco partilhado com os ficheiros pessoais.

O host continua a gerir o pool ZFS. O container recebe o caminho de que precisa para o PBS, sem receber o disco USB inteiro. Isto também ajuda a perceber o que depende de quê: se o pool deixar de estar disponível no host, o PBS perde o seu armazenamento de backup.

:::warning title="Uma quota não apaga backups antigos"
Quando o datastore atinge o limite, novos backups podem falhar. A quota não escolhe automaticamente que pontos de recuperação deve eliminar. A retenção e a recolha de espaço têm tarefas próprias e precisam de ser acompanhadas.
:::

Os dois hosts usam credenciais próprias, com permissões de backup e restauro no datastore. As credenciais dos hosts não têm permissão para apagar backups. A manutenção da retenção fica do lado do PBS. É uma forma de limitar o que uma credencial usada diariamente pode fazer.

## A agenda que deixei configurada

Desfasei as tarefas dos dois servidores para distribuir o trabalho ao longo da madrugada. Os backups começam primeiro e a aplicação da retenção fica para depois.

| Operação | Agenda configurada |
|---|---|
| Backup do Servidorzinho | Todos os dias às 01:30 |
| Backup do bifrost | Todos os dias às 02:30 |
| Aplicação da retenção | Todos os dias às 05:30 |
| Garbage collection | Sábado às 05:00 |
| Verificação | Domingo às 06:00 |

Os jobs dos hosts abrangem todos os guests e usam o modo snapshot. A política conserva 7 pontos diários, 4 semanais e 6 mensais. Estas categorias definem a seleção dos pontos a manter. Não correspondem necessariamente a 17 cópias completas diferentes de cada VM.

A retenção escolhe os pontos de recuperação que permanecem. A garbage collection trata dos dados que deixaram de ser necessários. Separar as duas operações evita esperar que a eliminação de um ponto liberte imediatamente todo o espaço que parecia ocupar.

Na rotina de acompanhamento, interessa consultar o resultado de cada job e confirmar os pontos de recuperação disponíveis por VM. Uma falha por falta de espaço pede uma resposta diferente de uma falha de comunicação com o datastore. O histórico das tarefas ajuda a encontrar essa diferença.

## Verificar os dados e recuperar o serviço

A verificação semanal está configurada para ignorar backups já verificados e voltar a verificá-los após 30 dias. O objetivo é detetar problemas nos dados guardados, em vez de só descobrir uma falha quando precisar deles.

Essa verificação cobre uma camada diferente do arranque da aplicação. Um restauro completo precisa ainda de confirmar a configuração da VM, os discos e o funcionamento dos serviços depois do arranque. Nas aplicações com bases de dados, também quero confirmar o estado dos dados e o acesso pela aplicação.

Um ensaio de recuperação deve começar por uma VM com poucas dependências, restaurada num ambiente isolado. Isso permite testar o caminho de recuperação sem criar conflitos com o serviço que continua em produção. Depois faz sentido avançar para uma aplicação que dependa de vários serviços.

## O que falta proteger e testar

A configuração ficou feita a 9 de novembro. O restauro completo de uma VM ainda está por ensaiar. Esse exercício deve confirmar a aplicação e registar o tempo gasto, além de verificar os dados que o PBS guarda.

O disco do PBS é um único disco. O ZFS consegue detetar corrupção, mas neste pool não existe outra cópia redundante que permita reparar automaticamente os dados. A ponte USB também impede a leitura do SMART do disco, o que reduz a informação de saúde disponível.

No caso do bifrost, o destino está separado do NVMe das VMs, mas continua ligado ao mesmo host. Uma falha desse host pode impedir o acesso imediato às cópias. Um incidente em casa pode atingir os servidores e o disco ao mesmo tempo.

Há ainda uma exclusão que merece ficar escrita: os backups dos containers PBS e NAS cobrem os respetivos sistemas de ficheiros de raiz. Os datasets montados a partir do host, incluindo os ficheiros das partilhas da NAS, não entram nesses backups. Restaurar o container da NAS não recria os documentos guardados na partilha.

O próximo trabalho é criar uma segunda cópia desses ficheiros e definir um destino fora de casa. Entretanto, a rotina precisa de incluir a leitura dos resultados das tarefas e um teste de restauro. Ter o PBS instalado dá-me as ferramentas para fazer esse trabalho; o acompanhamento é que vai mostrar se a proteção continua a funcionar ao longo dos meses.
