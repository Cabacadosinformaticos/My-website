---
title: Como comecei o meu homelab
desc: A história de como um achado no OLX virou o início do meu pequeno laboratório de servidores em casa.
category: [Homelab, Servidores, Pessoal]
date: Jun 2026
readTime: 12 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654830/cabacatech/2026-11/covers/posts/como-comecei-o-meu-homelab-858dd0c8a6.webp
series: Diário do Homelab
seriesPart: 1
related: [project:homelab-proxmox-servidorzinho, post:servidor-minecraft-em-casa, post:chega-o-bifrost]
---

Durante anos tive aquela ideia na cabeça: um dia vou ter um servidor meu em casa. Não era só para ter uma máquina ligada. Era para poder experimentar virtualização, correr serviços, partir coisas sem medo e, claro, finalmente ter um servidor de Minecraft meu.

O problema é que quando se começa a pesquisar hardware para servidores, é muito fácil cair num buraco sem fundo. Há mini PCs baratos, workstations usadas, servidores empresariais antigos, NAS prontas, builds feitas à mão, soluções com pouco consumo e máquinas que parecem pequenas centrais elétricas.

Eu queria algo compacto, forte e que não me prendesse logo no primeiro mês.

![Mapa atual do homelab, desenhado a partir da configuração documentada.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794662557/cabacatech/2026-11/diagrams/homelab-overview-94b6f844de.webp)

## Porque isto me interessava tanto

O que me puxava para o homelab era ter um sítio meu para aprender coisas que, de outra forma, ficam muito abstratas.

Num vídeo, virtualização, DNS e backups parecem simples. Com máquinas reais e dados que queres mesmo manter, a conversa muda.

Eu queria um ambiente onde pudesse fazer perguntas práticas:

- O que acontece se uma VM ficar sem espaço?
- Como separo serviços para não depender tudo da mesma instalação?
- Como acedo a dashboards fora de casa sem abrir portas à internet?
- Como recupero se uma atualização partir um serviço?
- Quanto hardware é realmente necessário para isto?

O homelab nasceu dessa curiosidade. O Minecraft foi o primeiro serviço, mas o objetivo maior era aprender infraestrutura na prática.

## O achado no OLX

O Minisforum MS-A1 era uma daquelas máquinas que eu via e pensava: era perfeito, mas é caro. Tinha o tamanho certo, boa construção e aceitava hardware bastante sério para o formato.

Um dia, no meio da pesquisa, decidi procurar por "Minisforum" no OLX. Para minha surpresa, estava lá um MS-A1, o mesmo modelo que eu andava a ver, a um preço muito mais interessante. Melhor ainda: vinha com 64 GB de RAM.

Na altura, os preços da RAM estavam a subir bastante, por isso aquilo pareceu mesmo um achado. Não era uma compra pequena, mas era uma oportunidade difícil de ignorar.

O engraçado é que a compra resolveu uma parte do problema e criou outra. Antes, eu estava bloqueado por não ter hardware. Depois, passei a ter uma máquina capaz demais para aquilo que eu sabia fazer na altura. Isso mudou a pergunta de "o que posso correr?" para "como é que organizo isto sem fazer asneira?".

## Comprar mais do que precisava

Depois da compra, entrei na fase de decidir o que meter lá dentro. A minha mentalidade foi simples: quero que não falte nada.

Isso levou-me a montar uma máquina com bastante margem:

- AMD Ryzen 9 7900.
- 64 GB de RAM DDR5.
- SSD NVMe WD Black SN850X de 2 TB (mais tarde juntei-lhe um segundo, igual).
- Proxmox como base.

Olhando agora, tenho de admitir que foi um bocado exagerado. Com tudo o que tenho feito, raramente uso uma parte relevante do processador. Mas também é verdade que esta margem me deu liberdade para experimentar sem estar sempre preocupado com limites.

Com CPU e RAM a mais, é fácil resolver tudo atirando recursos para cima do problema. Isso pode esconder um serviço mal configurado, e só medindo o uso real se percebe se precisa mesmo desses recursos.

:::specs title="Servidor principal"
Nome: Servidorzinho
Máquina: Minisforum MS-A1
CPU: AMD Ryzen 9 7900
RAM: 64 GB DDR5
Storage: 2x WD Black SN850X 2 TB NVMe
Sistema: Proxmox VE 9
:::

## O primeiro objetivo: Minecraft

O objetivo mais emocional era simples: ter um servidor de Minecraft para mim e para amigos. Não um servidor frágil que mal aguenta meia dúzia de mods, mas algo capaz de correr várias instâncias, cada uma com os seus mundos, versões e modpacks.

Para isso acabei por usar uma VM com Debian 13.2.0-amd64 e AMP, da CubeCoders. O AMP dá uma interface web para gerir servidores, ficheiros, permissões e instâncias.

:::resource title="CubeCoders AMP" url="https://cubecoders.com/AMP"
É o painel que uso para gerir os servidores de Minecraft dentro da VM.
:::

O lado bom é que tudo fica muito mais confortável de gerir. O lado menos bom é que updates continuam a ser updates. Às vezes corre tudo bem. Outras vezes um mundo decide que já não quer arrancar e lá se vai a hora que era para jogar.

Foi aqui que o projeto deixou de ser só "tenho um servidor de Minecraft" e passou a ser "tenho um serviço para manter". Um serviço tem utilizadores, expectativas, atualizações, permissões e dados que não queres perder.

## O segundo objetivo: aprender

Se fosse só para jogar Minecraft, havia opções mais simples. O que tornou isto interessante foi o resto: Proxmox, VMs, LXCs, DNS, redes privadas, storage, permissões e backups.

O Proxmox tornou-se o centro do homelab. É onde crio máquinas virtuais, containers e serviços. É também onde comecei a perceber melhor a diferença entre "instalar uma aplicação" e "operar um serviço".

:::resource title="Proxmox VE" url="https://www.proxmox.com/en/products/proxmox-virtual-environment/overview"
É a plataforma de virtualização que uso nos dois servidores do homelab.
:::

![Painel do Proxmox no servidorzinho, com a VM do AMP e o container do AdGuard a correr.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794696636/cabacatech/2026-11/screenshots/homelab/proxmox-dashboard-cfa1666265.webp)

## As primeiras decisões que mudaram tudo

As decisões que mais marcaram o setup não foram as peças de hardware. Foram decisões de organização:

| Decisão | Porque importou |
|---|---|
| Usar Proxmox | Separar experiências em VMs e LXCs |
| Não instalar tudo no host | Evitar transformar o servidor numa confusão |
| Usar Tailscale | Aceder remotamente sem expor dashboards |
| Separar media noutro servidor | Usar Quick Sync onde faz sentido (mais tarde voltei atrás, ver a parte 6) |
| Meter DNS local num LXC | Ter um serviço leve e isolado |

Estas escolhas fizeram-me perceber que infraestrutura é muito mais sobre fronteiras do que sobre potência. O importante é saber onde uma coisa começa e outra acaba.

## Segurança antes da comodidade

Uma coisa que decidi cedo foi evitar expor dashboards diretamente à internet. É tentador abrir uma porta no router e aceder a tudo de fora, mas isso pode trazer riscos sérios.

Para resolver a parte do acesso remoto, comecei a usar Tailscale. Assim consigo chegar ao Proxmox e ao AMP quando estou fora de casa, sem deixar painéis administrativos abertos para o mundo.

:::resource title="Tailscale" url="https://tailscale.com/docs"
Uso Tailscale para aceder ao homelab através de uma rede privada.
:::

## Depois veio a MediaBox

O segundo servidor apareceu porque o primeiro não era ideal para tudo. O Servidorzinho tem muito CPU, mas para vídeo eu queria Intel Quick Sync. Daí nasceu a MediaBox, um Lenovo ThinkCentre M90q Gen 5 com um i5 14500T e Intel UHD Graphics 770, para media, Jellyfin, transcodificação e experiências com NAS.

:::callout title="Atualização de outubro de 2026"
A MediaBox já não é servidor. Contei o que aprendi com ela na [parte 6](blog-post.html?id=jellyfin-e-truenas-o-que-aprendi) e quem ocupa agora o lugar dela na [parte 7](blog-post.html?id=chega-o-bifrost).
:::

![Diagrama da antiga experiência com MediaBox, TrueNAS e disco USB.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794662560/cabacatech/2026-11/diagrams/truenas-usb-previous-f8b10c7377.webp)

## O que eu faria diferente

Se começasse hoje, faria algumas coisas com mais calma:

- Documentava cada decisão desde o início.
- Criava uma lista clara de serviços críticos.
- Pensava em backups antes de pensar em novos serviços.
- Separava melhor experiências temporárias de serviços que quero manter.
- Media melhor consumo, temperatura e uso real antes de assumir necessidades.

Não quer dizer que tenha corrido mal. Pelo contrário, funcionou bem. Mas há uma diferença entre montar algo que funciona e montar algo que se entende daqui a seis meses.

## O que aprendi até agora

Aprendi que um homelab nunca está acabado. Há sempre uma atualização, um serviço novo, uma configuração para melhorar ou uma ideia a testar.

Também aprendi que o hardware é só a parte visível. A parte realmente interessante está nas decisões pequenas: como aceder de fora, como separar serviços, como fazer backups, como lidar com DNS, como documentar o que foi feito e como recuperar quando algo parte.

A maior surpresa foi o gosto que me dá construir, errar e corrigir.
