---
title: Chega o bifrost, o segundo servidor do homelab
desc: O segundo MS-A1 já corre Proxmox e recebeu as VMs públicas. Como as mudei por backup e restauro, porque não fiz um cluster e o que a mudança me ensinou sobre o cloud-init.
category: [Homelab, Proxmox, Infraestrutura]
date: Nov 2026
readTime: 6 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654828/cabacatech/2026-11/covers/posts/chega-o-bifrost-64d6175814.webp
series: Diário do Homelab
seriesPart: 7
related: [project:homelab-proxmox-servidorzinho, post:backups-do-homelab-com-pbs, post:publicar-um-site-sem-abrir-portas]
---

O segundo Minisforum MS-A1 chegou e a 9 de novembro instalei-lhe o Proxmox. Chama-se bifrost e, nesse mesmo dia, passei para lá as VMs do IADE Horários e do site da AEIADE. O Servidorzinho ficou com o DNS da casa, os servidores de jogos, a VPN e a CabacaLab privada.

Em outubro isto ainda era um plano. Pelo meio vendi o Lenovo M90q Gen 5 onde tinha experimentado o Jellyfin e o TrueNAS. O meu computador de secretária é o mimir, outro Lenovo, um M90q Gen 6. São máquinas diferentes.

![Papéis das máquinas e ligação direta entre os hosts Proxmox.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794662557/cabacatech/2026-11/diagrams/homelab-overview-94b6f844de.webp)

## O que ficou em cada servidor

O bifrost é o servidor que fala com a Internet. Cada aplicação pública mantém a sua VM e continua a chegar ao exterior pelo seu Cloudflare Tunnel. Mudar de máquina não as juntou num sistema operativo comum.

| Servidor | O que corre |
|---|---|
| Servidorzinho | AdGuard Home, jogos, VPN e CabacaLab privada |
| bifrost | VMs públicas, Fieldnote privado, Proxmox Backup Server e NAS |

O Fieldnote tem uma VM própria no bifrost e só se chega a ela por Tailscale. O PBS e a NAS são dois containers no mesmo servidor e têm um artigo cada: [os backups](blog-post.html?id=backups-do-homelab-com-pbs) e [a NAS](blog-post.html?id=nas-com-samba-e-cockpit).

## Mover as VMs

Não há cluster, por isso uma VM muda de servidor por backup e restauro. Para cada uma desliguei a VM, fiz um `vzdump` em modo stop, copiei o ficheiro pelo cabo direto e restaurei no bifrost.

```bash title="mover uma VM entre os dois hosts"
qm shutdown 240
vzdump 240 --mode stop --compress zstd
scp /var/lib/vz/dump/vzdump-qemu-240-*.vma.zst root@bifrost:/var/lib/vz/dump/
# no bifrost
qmrestore /var/lib/vz/dump/vzdump-qemu-240-*.vma.zst 240 --storage local-lvm
```

A VM do IADE Horários tem 20 GiB e o backup demorou 19 segundos. A da AEIADE tem 30 GiB e demorou 22. Cada uma ficou cerca de minuto e meio fora do ar. Copiei também o ficheiro de firewall de cada VM e o MAC e o IP mantiveram-se.

As VMs antigas ficaram paradas no Servidorzinho até eu confirmar que os sites respondiam a partir do bifrost. Só as destruí depois de o primeiro backup para o PBS ficar verificado. Foi então que apaguei também os ficheiros do `vzdump`. Ter duas VMs com o mesmo MAC e o mesmo IP é um erro à espera de um arranque distraído.

## O que o restauro fez ao cloud-init

Na VM do IADE Horários as chaves SSH do servidor mudaram. O restauro altera o armazenamento na configuração gerada, o cloud-init interpreta isso como uma instância nova, gera chaves novas e volta a correr o `runcmd`. Neste caso reinstalou o Docker nas mesmas versões e não estragou nada, mas apanhou-me de surpresa.

Antes de mover a da AEIADE acrescentei esta linha, que mantém as chaves existentes:

```yaml title="/etc/cloud/cloud.cfg.d/99-keep-ssh-hostkeys.cfg"
ssh_deletekeys: false
```

O Coolify liga-se às VMs sem verificar a chave do servidor, por isso nenhum deploy sentiu a diferença.

## Dois Proxmox sem cluster

Pensei num cluster e descartei-o. Com dois nós, quando um deixa de estar disponível o outro perde o quórum. Resolver isso com um terceiro voto (um QDevice) seria mais um componente para manter. Duas máquinas também não dão alta disponibilidade às aplicações nem aos discos.

:::decision title="Hosts independentes, migração por backup"
Cada servidor tem a sua gestão e as suas VMs. Para mudar uma VM de máquina aceito um comando manual e uns minutos de paragem planeada. Em troca consigo explicar como recuperar cada serviço sem depender de configuração de alta disponibilidade.
:::

## A memória que se vê

O bifrost tem um Ryzen 7 8700G, 32 GB de DDR5 e um NVMe de 512 GB, na mesma caixa do Servidorzinho. O sistema só vê cerca de 28 GiB: 2 GiB ficaram reservados à GPU integrada e o resto são reservas do firmware e do kernel. Mantive a reserva da GPU para o caso de a vir a usar.

:::specs title="bifrost"
Máquina: Minisforum MS-A1
CPU: AMD Ryzen 7 8700G, 8 núcleos e 16 threads
RAM instalada: 32 GB DDR5
RAM visível: cerca de 28 GiB
Disco interno: NVMe de 512 GB
Rede: duas portas de 2,5 GbE
Base: Proxmox VE 9
:::

Somar as atribuições até aos 32 GB da caixa seria um erro. As VMs e os containers ficam com 21 GiB (IADE Horários 2, AEIADE 6, Fieldnote 10, PBS 2 e NAS 1) e limitei a cache ZFS a 2 GiB, para o host ter margem.

## O cabo direto

Liguei as segundas portas dos dois MS-A1 por um cabo de rede. O `iperf3` mediu 2,35 Gbit/s em cada sentido. É por aqui que o Servidorzinho envia os backups noturnos para o PBS sem passar pelo router. O plano inicial falava em backups cruzados entre os servidores. Acabei com um só PBS no bifrost, com o datastore num disco USB de 10 TB, separado do NVMe das VMs.

O disco esteve primeiro numa porta USB 2.0, a 480 Mbit/s. Troquei-o para uma porta USB 3 no mesmo dia e passou a ligar a 5 Gbit/s.

## O nome

Bifrost é a ponte da mitologia nórdica e o servidor que recebe o que vem da Internet. O mimir é o sábio que aconselha Odin. O Servidorzinho mantém o nome, porque o nome de um nó Proxmox está ligado às configurações dos guests e mudá-lo depois de instalado dá trabalho. O bifrost ainda não estava instalado, por isso recebeu o nome certo desde o início.

## O que falta

As aplicações públicas saíram do Servidorzinho e os dois hosts enviam backups para o PBS. Esse PBS está no bifrost, na mesma casa, num único disco. As partilhas da NAS têm uma só cópia e ainda não restaurei uma VM completa a partir do PBS. Esse teste é o primeiro da lista, descrito no [artigo sobre os backups](blog-post.html?id=backups-do-homelab-com-pbs).
