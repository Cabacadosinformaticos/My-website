---
title: Backups do homelab com Proxmox Backup Server
desc: Os dois hosts Proxmox já têm backups noturnos para um PBS no bifrost. A configuração, a agenda, o primeiro backup e os dados que continuam sem segunda cópia.
category: [Homelab, Proxmox, Backups]
date: Nov 2026
readTime: 6 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654827/cabacatech/2026-11/covers/posts/backups-do-homelab-com-pbs-d5d72faa84.webp
series: Diário do Homelab
seriesPart: 8
related: [post:chega-o-bifrost, post:nas-com-samba-e-cockpit, project:homelab-proxmox-servidorzinho]
---

Até 9 de novembro nenhum dos meus dois servidores tinha backups das VMs fora dele próprio. Havia dumps das bases de dados e snapshots locais da CabacaLab, que servem para voltar atrás numa alteração e morrem com o disco onde estão. Nessa noite montei um Proxmox Backup Server no bifrost e deixei os dois hosts a enviar-lhe as VMs todas as madrugadas.

O PBS corre num container LXC não privilegiado, com 2 GiB de RAM e 8 GB de disco. O datastore não está nesse disco. Fica num dataset ZFS do disco USB de 10 TB, montado no container, ao lado das partilhas da [NAS](blog-post.html?id=nas-com-samba-e-cockpit).

![Os dois hosts enviam backups para o PBS. NAS e backups usam datasets separados no mesmo disco USB.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513999/cabacatech/2026-11/diagrams/pbs-and-nas-586f72e274.webp)

## Porque o PBS

A alternativa era guardar ficheiros de `vzdump` completos numa pasta de rede. Escolhi o PBS porque deduplica: dois pontos de recuperação da mesma VM partilham quase todos os blocos e só se paga o que mudou. No primeiro backup, os 12 guests dos dois hosts ocuparam 105 GiB no datastore, com compressão de 1,20x.

Também queria um único sítio onde ver o histórico e o resultado das tarefas dos dois servidores, em vez de abrir pastas à procura de ficheiros.

## O disco e a quota

O host gere o pool ZFS e o container só recebe o caminho do datastore. O dataset dos backups tem uma quota de 3 TB, para o histórico das VMs não comer o espaço das partilhas pessoais no mesmo disco:

```bash
zfs set quota=3T tank/backups
```

Uma quota não escolhe o que apagar. Quando o datastore enche, os backups novos falham e os antigos ficam onde estão, por isso o que limpa o espaço é a retenção.

Cada host tem o seu token de API no PBS, com o papel `DatastoreBackup` só neste datastore. Pode fazer backups e restauros e não pode apagar nada. Se um dos servidores for comprometido, o histórico não vai com ele.

Instalar tudo teve um tropeção. O primeiro `datastore create` falhou em silêncio porque lhe passei `--notes`, que esse comando não aceita. Como o datastore não existia, o `pvesm add` seguinte também falhou. Voltei a criá-lo sem a opção e gerei os tokens outra vez.

## A agenda

Desfasei os dois servidores para espalhar o trabalho pela madrugada. A retenção corre depois dos backups.

| Operação | Quando |
|---|---|
| Backup do Servidorzinho | Todos os dias às 01:30 |
| Backup do bifrost | Todos os dias às 02:30 |
| Retenção (prune) | Todos os dias às 05:30 |
| Garbage collection | Sábado às 05:00 |
| Verificação | Domingo às 06:00 |

Os jobs abrangem todos os guests e usam o modo snapshot. A retenção guarda 7 pontos diários, 4 semanais e 6 mensais, mas são pontos de recuperação e não 17 cópias completas de cada VM. A garbage collection só liberta o espaço dos blocos que já nenhum ponto usa, por isso apagar um backup antigo não devolve de imediato tudo o que parecia ocupar.

A verificação ignora os backups já verificados e repete-os ao fim de 30 dias.

## O primeiro backup

Lancei-o à mão antes de confiar na agenda. O Servidorzinho levou cerca de 14 minutos para 8 guests, dos quais 8,5 foram só para o AMP, que tem 250 GiB. O bifrost levou 2 minutos para 4. Os dois terminaram sem erros e uma verificação manual do datastore deu 0 erros.

Só depois disso apaguei as VMs antigas que tinha deixado paradas no Servidorzinho depois da mudança para o bifrost.

Para ver se um host fala com o PBS:

```bash
pvesm status
```

No container, o histórico das tarefas está em `proxmox-backup-manager task list`. Uma falha por falta de espaço e uma falha de ligação ao datastore não têm a mesma solução. O histórico mostra qual das duas aconteceu.

## O que ainda não está protegido

O restauro completo de uma VM ainda não foi ensaiado. A verificação do PBS garante que os blocos guardados estão intactos. Não prova que a VM arranca nem que a aplicação responde. O primeiro teste vai ser numa VM com poucas dependências, restaurada num ambiente isolado, para não colidir com a original. Depois tentarei uma aplicação com base de dados.

O disco é um só. O ZFS deteta corrupção mas, sem outra cópia no pool, não a consegue reparar. A ponte USB também não deixa ler o SMART. Também não sei o modelo do disco que está lá dentro.

O destino dos backups está separado do NVMe das VMs, mas está ligado ao mesmo host e na mesma casa. Uma falha do bifrost corta o acesso às cópias e um incidente em casa apanha servidores e disco ao mesmo tempo.

Os backups dos containers PBS e NAS cobrem só o sistema de ficheiros de raiz. Os datasets montados a partir do host, incluindo os documentos das partilhas, ficam de fora. Restaurar o container da NAS não os recria.

:::warning title="Ainda não há alertas de falha"
Os jobs correm sozinhos mas, se um falhar, só o vejo se abrir o histórico. Estou a pensar num aviso por ntfy ou por email.
:::

O que vem a seguir é uma segunda cópia das partilhas da NAS, um destino fora de casa (ainda não escolhi qual) e os alertas.
