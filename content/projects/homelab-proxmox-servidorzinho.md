---
title: Homelab
desc: O meu laboratório de servidores em casa. Dois Minisforum MS-A1 com Proxmox, uma cloud privada para os meus projetos, DNS para a casa toda, servidores de jogos e sites abertos à Internet sem portas abertas no router.
category: [Homelab, Proxmox, Infraestrutura]
year: 2026
type: Pessoal
duration: Desde 2026, em evolução
status: Em produção
stack: [Proxmox VE, Debian, Ubuntu, Docker, ZFS, Tailscale, Cloudflare Tunnel, AdGuard Home, AMP]
cover: ""
related: [project:cabacalab, post:como-comecei-o-meu-homelab, post:chega-o-bifrost, project:iade-horarios]
---

O homelab começou com uma vontade antiga: ter um servidor meu em casa para experimentar virtualização e, claro, ter um servidor de Minecraft. Hoje são dois servidores Proxmox que correm os serviços da casa, uma plataforma de desenvolvimento para os meus projetos e os sites que tenho abertos à Internet.

Esta página é o mapa. Os detalhes de cada parte, com o que correu bem e o que correu mal, estão na série [Diário do Homelab](blog-post.html?id=como-comecei-o-meu-homelab).

:::image-placeholder title="Mapa do homelab" desc="Diagrama dos dois servidores, a ligação direta entre eles, a rede de casa, a rede Tailscale e os túneis para a Internet." ratio="16:9"
:::

:::stats
2 | Servidores Proxmox
9 | VMs e containers
0 | Portas abertas no router
96 GB | De RAM entre os dois
:::

## As máquinas

| Máquina | Hardware | Papel |
|---|---|---|
| Servidorzinho | Minisforum MS-A1, Ryzen 9 7900, 64 GB DDR5, 2x 2 TB NVMe | Tudo o que é privado: DNS, jogos, VPN, a plataforma de desenvolvimento |
| bifrost | Minisforum MS-A1, Ryzen 7 8700G, 32 GB DDR5, 512 GB NVMe | Tudo o que é público: sites e projetos abertos à Internet |

Os dois ligam-se por um cabo direto de 2,5 GbE, fora da rede de casa, para mover VMs e trocar backups. Não formam um cluster, e expliquei porquê em [A MediaBox reformou-se. Chega o bifrost](blog-post.html?id=chega-o-bifrost).

## O que corre

| Serviço | Onde | Para quê |
|---|---|---|
| AdGuard Home | Container LXC | DNS da casa toda, com bloqueio de tracking, malware e phishing |
| AMP | VM Debian | Servidores de Minecraft com mods, um container por mundo |
| Gateway VPN | VM | Saída para a Internet por VPN, para os meus dispositivos fora de casa |
| [CabacaLab](project-detail.html?id=cabacalab) | 4 VMs | Bases de dados, cache, S3, HTTPS, deploys, monitorização e mapas para os meus projetos |
| [IADE Horários](project-detail.html?id=iade-horarios) | VM pública | Horários do IADE, aberto à Internet |
| [Site da AEIADE](project-detail.html?id=aeiade-website) | VM pública | Em desenvolvimento |

## Os princípios

Ao fim de meses a montar, partir e corrigir, o homelab segue meia dúzia de regras. Cada uma veio de um problema concreto.

:::decision title="Privado por defeito"
Os painéis de administração (Proxmox, AMP, bases de dados, monitorização) só existem dentro de casa e na minha rede Tailscale. O que é público entra por túneis de saída, sem portas abertas, em VMs isoladas. Ver [Pôr um site na Internet sem abrir portas](blog-post.html?id=publicar-um-site-sem-abrir-portas).
:::

:::decision title="Nada instalado no host"
O Proxmox só corre o Proxmox. Cada serviço vive na sua VM ou no seu container. Um serviço partido parte-se sozinho.
:::

:::decision title="Container quando chega, VM quando é preciso"
Serviços leves e simples, como o DNS, correm em containers LXC. Serviços com Docker, redes próprias ou requisitos de isolamento correm em VMs. A gateway VPN, por exemplo, é uma VM porque o encaminhamento do WireGuard dava problemas num container sem privilégios.
:::

:::decision title="Planear para os picos"
Um servidor de jogos está calmo 90% do tempo e precisa de folga nos outros 10%. A memória é distribuída a pensar nos picos, e a ordem de arranque garante que a infraestrutura (DNS primeiro) está de pé antes dos serviços que dependem dela.
:::

:::decision title="Testar o que se diz que funciona"
Testei o reboot completo do servidor de propósito, um dia depois de montar a plataforma. Quando houve duas falhas de luz no fim de setembro, todas as VMs voltaram sozinhas.
:::

## Como chegou aqui

:::timeline
O início | O achado no OLX | Um MS-A1 em segunda mão com 64 GB de RAM. Nasce o Servidorzinho.
Primeiros serviços | Minecraft e DNS | O AMP para os servidores de jogos e o AdGuard Home para a casa toda.
Segundo servidor | A MediaBox | Um segundo servidor para Jellyfin e TrueNAS, que acabou por não ser a solução certa.
Set 2026 | CabacaLab | Um segundo disco de 2 TB e uma cloud privada para os meus projetos, montada num dia.
Set 2026 | Os primeiros sites públicos | IADE Horários e o site da AEIADE, por túneis e em VMs isoladas.
Out 2026 | Chega o bifrost | Um segundo MS-A1 só para o que é público.
:::

## A série

1. [Como comecei o meu homelab](blog-post.html?id=como-comecei-o-meu-homelab)
2. [Ter um servidor de Minecraft em casa é mais trabalhoso do que parece](blog-post.html?id=servidor-minecraft-em-casa)
3. [DNS em casa com AdGuard Home](blog-post.html?id=dns-em-casa-com-adguard-home)
4. [O lado menos glamoroso de ter servidores em casa](blog-post.html?id=o-lado-menos-glamoroso-do-homelab)
5. [Pôr um site na Internet sem abrir portas](blog-post.html?id=publicar-um-site-sem-abrir-portas)
6. [Jellyfin e TrueNAS, e porque desliguei tudo](blog-post.html?id=jellyfin-e-truenas-o-que-aprendi)
7. [A MediaBox reformou-se. Chega o bifrost](blog-post.html?id=chega-o-bifrost)

## O que vem a seguir

- Montar o bifrost e mover para lá as VMs públicas.
- Backups cruzados entre os dois servidores, com um restauro completo testado.
- Escolher uma solução de armazenamento mais leve do que o TrueNAS, com painel web, drive de rede, S3 e espaço para os backups de cada serviço.
- Voltar a pôr o disco de 10 TB a trabalhar.
