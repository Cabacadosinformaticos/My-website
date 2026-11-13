---
title: Homelab
desc: Dois servidores Proxmox em casa para os serviços da família, uma plataforma de desenvolvimento e aplicações públicas. Com backups em PBS, partilhas Samba e acesso privado por Tailscale.
category: [Homelab, Proxmox, Infraestrutura]
year: 2026
type: Pessoal
duration: Desde 2026, em evolução
status: Em produção
stack: [Proxmox VE, Debian, Ubuntu, Docker, ZFS, Proxmox Backup Server, Samba, Cockpit, Tailscale, Cloudflare Tunnel, AdGuard Home, AMP]
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654851/cabacatech/2026-11/covers/projects/homelab-proxmox-servidorzinho-054aa27752.webp
related: [project:cabacalab, post:chega-o-bifrost, post:backups-do-homelab-com-pbs, post:nas-com-samba-e-cockpit]
---

O homelab começou com um servidor de Minecraft e cresceu para dois hosts Proxmox. Hoje corre o DNS de casa, os jogos, uma plataforma de desenvolvimento e aplicações abertas à Internet. Desde 9 de novembro, tem também um Proxmox Backup Server e uma NAS com Samba e Cockpit.

Esta página reúne o desenho atual. Na série [Diário do Homelab](blog-post.html?id=como-comecei-o-meu-homelab), conto as decisões de cada etapa e os problemas que as motivaram.

![Distribuição dos serviços entre o Servidorzinho e o bifrost, com ligação direta entre os hosts e armazenamento USB para o PBS e a NAS.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794662557/cabacatech/2026-11/diagrams/homelab-overview-94b6f844de.webp)

:::stats
2 | Hosts Proxmox
96 GB | RAM instalada
2,5 GbE | Ligação direta
9 | Partes no diário
:::

## As máquinas e os seus papéis

| Máquina | Hardware | Papel |
|---|---|---|
| Servidorzinho | Minisforum MS-A1, Ryzen 9 7900, 64 GB DDR5, 2 × 2 TB NVMe | DNS, jogos, VPN e plataforma privada CabacaLab |
| bifrost | Minisforum MS-A1, Ryzen 7 8700G, 32 GB DDR5, 512 GB NVMe | VMs públicas, Fieldnote privado, PBS e NAS |

Os dois hosts ligam-se por um cabo direto de 2,5 GbE. O Servidorzinho usa essa ligação para chegar ao PBS no bifrost. Cada host mantém a sua gestão independente e as VMs passam de uma máquina para a outra por backup e restauro. A [parte 7](blog-post.html?id=chega-o-bifrost) explica esta escolha.

As aplicações públicas têm VMs próprias e entram na Internet através de Cloudflare Tunnels. Os serviços de administração e as aplicações privadas usam a rede local ou Tailscale, conforme a sua configuração. O Fieldnote, por exemplo, corre no bifrost com acesso privado através de Tailscale.

## O que corre em cada host

| Serviço | Host e ambiente | Função |
|---|---|---|
| AdGuard Home | Servidorzinho, LXC | DNS da casa e filtragem de pedidos |
| AMP | Servidorzinho, VM | Gestão dos servidores de jogos |
| Gateway VPN | Servidorzinho, VM | Saída para a Internet por VPN |
| [CabacaLab](project-detail.html?id=cabacalab) | Servidorzinho, VMs próprias | Bases de dados, cache, S3, HTTPS, deploys, monitorização e mapas |
| [IADE Horários](project-detail.html?id=iade-horarios) | bifrost, VM pública | Consulta pública dos horários do IADE |
| [Site da AEIADE](project-detail.html?id=aeiade-website) | bifrost, VM própria | Alojamento do site através do seu túnel |
| [Fieldnote](project-detail.html?id=fieldnote) | bifrost, VM privada | Ambiente do projeto, acessível por Tailscale |
| Proxmox Backup Server | bifrost, LXC | Destino dos backups dos dois hosts |
| Samba, Cockpit e DLNA | bifrost, LXC | Partilhas de ficheiros e biblioteca familiar na rede local |

## Como organizo os serviços

:::decision title="Um ambiente por função"
Os serviços correm em VMs ou containers próprios. Uso LXC para serviços como DNS, PBS e Samba. As aplicações com Docker e os ambientes com redes próprias correm em VMs. O host Proxmox gere os recursos, a rede e o armazenamento ZFS.
:::

:::decision title="Acesso definido por aplicação"
As aplicações públicas têm túneis próprios e regras de rede por VM. Para os serviços privados, uso a rede local e Tailscale. A distribuição física dos serviços complementa essa configuração.
:::

:::decision title="Memória e arranque planeados"
Atribuo memória a cada serviço e deixo folga para os picos dos jogos e das aplicações. No Servidorzinho, o DNS arranca primeiro e os serviços seguintes têm uma ordem definida. No bifrost, a ARC do ZFS tem um limite de 2 GiB.
:::

## Backups e ficheiros têm coberturas diferentes

Os dois hosts têm jobs noturnos configurados para o PBS. O datastore fica num dataset ZFS do disco USB de 10 TB ligado ao bifrost, com quota de 3 TB. A retenção conserva 7 pontos diários, 4 semanais e 6 mensais. A verificação tem uma tarefa semanal.

O mesmo disco contém os datasets das partilhas Samba, separados do datastore. A partilha pessoal tem quota de 1 TB e a familiar de 500 GB. O Cockpit gere as partilhas e as identidades. O DLNA serve a biblioteca familiar na rede local.

As partilhas têm uma única cópia. Os backups dos containers cobrem os seus sistemas de raiz, mas excluem os datasets montados a partir do host. Também falta uma cópia fora de casa e um ensaio de restauro completo de uma VM. Estes são os próximos pontos de trabalho na recuperação do homelab.

## Como chegou aqui

:::timeline
O início | O achado no OLX | Um MS-A1 em segunda mão com 64 GB de RAM. Nasce o Servidorzinho.
Primeiros serviços | Minecraft e DNS | AMP para os jogos e AdGuard Home para a casa.
A experiência de media | MediaBox | Jellyfin e TrueNAS num Lenovo M90q Gen 5. A experiência termina e a máquina acaba por ser vendida.
Set 2026 | CabacaLab | Um segundo NVMe de 2 TB recebe a plataforma privada de desenvolvimento.
Set 2026 | Primeiros sites públicos | IADE Horários e o site da AEIADE passam a ter VMs e túneis próprios.
Out 2026 | Preparar a nova distribuição | O segundo MS-A1 já chegou. O desktop passa a ser o mimir, um M90q Gen 6 separado da antiga MediaBox.
9 Nov 2026 | bifrost instalado | Proxmox instalado e VMs públicas transferidas. Fieldnote privado, PBS e NAS entram neste host.
:::

## Diário do Homelab

1. [Como comecei o meu homelab](blog-post.html?id=como-comecei-o-meu-homelab)
2. [Ter um servidor de Minecraft em casa é mais trabalhoso do que parece](blog-post.html?id=servidor-minecraft-em-casa)
3. [DNS em casa com AdGuard Home](blog-post.html?id=dns-em-casa-com-adguard-home)
4. [O lado menos glamoroso de ter servidores em casa](blog-post.html?id=o-lado-menos-glamoroso-do-homelab)
5. [Pôr um site na Internet sem abrir portas](blog-post.html?id=publicar-um-site-sem-abrir-portas)
6. [Jellyfin e TrueNAS e porque desliguei tudo](blog-post.html?id=jellyfin-e-truenas-o-que-aprendi)
7. [Chega o bifrost, o segundo servidor do homelab](blog-post.html?id=chega-o-bifrost)
8. [Backups do homelab com Proxmox Backup Server](blog-post.html?id=backups-do-homelab-com-pbs)
9. [Uma NAS com Samba e Cockpit depois do TrueNAS](blog-post.html?id=nas-com-samba-e-cockpit)

## O que vem a seguir

- Restaurar uma VM num ambiente isolado, confirmar os serviços e registar o tempo de recuperação.
- Criar uma segunda cópia dos ficheiros das partilhas da NAS.
- Definir um destino de backup fora de casa.
- Acompanhar os resultados dos jobs do PBS e a evolução do espaço usado.
