---
title: Como comecei o meu homelab
desc: A história de como um achado no OLX virou o início do meu pequeno laboratório de servidores em casa.
category: [Homelab, Servidores, Pessoal]
date: Jun 2026
readTime: 8 min
cover: ""
---

Durante anos tive aquela ideia na cabeça: um dia vou ter um servidor meu em casa. Não era só para ter uma máquina ligada. Era para poder experimentar virtualização, correr serviços, partir coisas sem medo e, claro, finalmente ter um servidor de Minecraft meu.

O problema é que quando se começa a pesquisar hardware para servidores, é muito fácil cair num buraco sem fundo. Há mini PCs baratos, workstations usadas, servidores empresariais antigos, NAS prontas, builds feitas à mão, soluções com pouco consumo e máquinas que parecem pequenas centrais elétricas.

Eu queria algo compacto, forte e que não me prendesse logo no primeiro mês.

:::image-placeholder title="Foto inicial do setup" desc="Foto dos dois mini PCs ou do espaço onde o homelab está montado." ratio="16:9"
:::

## O achado no OLX

O Minisforum MS-A1 era uma daquelas máquinas que eu via e pensava: era perfeito, mas é caro. Tinha o tamanho certo, boa construção e aceitava hardware bastante sério para o formato.

Um dia, no meio da pesquisa, decidi procurar por "Minisforum" no OLX. Para minha surpresa, estava lá um MS-A1, o mesmo modelo que eu andava a ver, a um preço muito mais interessante. Melhor ainda: vinha com 64 GB de RAM.

Na altura, os preços da RAM estavam a subir bastante, por isso aquilo pareceu mesmo um achado. Não era uma compra pequena, mas era uma oportunidade difícil de ignorar.

## Comprar mais do que precisava

Depois da compra, entrei na fase de decidir o que meter lá dentro. A minha mentalidade foi simples: quero que não falte nada.

Isso levou-me a montar uma máquina com bastante margem:

- AMD Ryzen 9 7900.
- 64 GB de RAM DDR4.
- SSD NVMe WD Black SN850X de 2 TB.
- Proxmox como base.

Olhando agora, tenho de admitir que foi um bocado exagerado. Com tudo o que tenho feito, raramente uso uma parte relevante do processador. Mas também é verdade que esta margem me deu liberdade para experimentar sem estar sempre preocupado com limites.

:::specs title="Servidor principal"
Nome: Servidorzinho
Máquina: Minisforum MS-A1
CPU: AMD Ryzen 9 7900
RAM: 64 GB DDR4
Storage: WD Black SN850X 2 TB NVMe
Sistema: Proxmox VE 9.2.3
:::

## O primeiro objetivo: Minecraft

O objetivo mais emocional era simples: ter um servidor de Minecraft para mim e para amigos. Não um servidor frágil que mal aguenta meia dúzia de mods, mas algo capaz de correr várias instâncias, cada uma com os seus mundos, versões e modpacks.

Para isso acabei por usar uma VM com Debian 13.2.0-amd64 e AMP, da CubeCoders. O AMP dá uma interface web para gerir servidores, ficheiros, permissões e instâncias.

:::resource title="CubeCoders AMP" url="https://cubecoders.com/AMP"
É o painel que uso para gerir os servidores de Minecraft dentro da VM.
:::

O lado bom é que tudo fica muito mais confortável de gerir. O lado menos bom é que updates continuam a ser updates. Às vezes corre tudo bem. Outras vezes um mundo decide que já não quer arrancar e lá se vai a hora que era para jogar.

## O segundo objetivo: aprender

Se fosse só para jogar Minecraft, havia opções mais simples. O que tornou isto interessante foi o resto: Proxmox, VMs, LXCs, DNS, redes privadas, storage, permissões e backups.

O Proxmox tornou-se o centro do homelab. É onde crio máquinas virtuais, containers e serviços. É também onde comecei a perceber melhor a diferença entre "instalar uma aplicação" e "operar um serviço".

:::resource title="Proxmox VE" url="https://www.proxmox.com/en/products/proxmox-virtual-environment/overview"
É a plataforma de virtualização que uso nos dois servidores do homelab.
:::

:::image-placeholder title="Dashboard do Proxmox" desc="Screenshot do Proxmox com dados sensíveis borrados." ratio="16:9"
:::

## Segurança antes da comodidade

Uma coisa que decidi cedo foi evitar expor dashboards diretamente à internet. É tentador abrir uma porta no router e aceder a tudo de fora, mas isso pode trazer riscos sérios.

Para resolver a parte do acesso remoto, comecei a usar Tailscale. Assim consigo chegar aos serviços quando estou fora de casa, mas sem deixar painéis administrativos abertos para o mundo.

:::resource title="Tailscale" url="https://tailscale.com/docs"
Uso Tailscale para aceder ao homelab através de uma rede privada.
:::

## Depois veio a MediaBox

O segundo servidor apareceu porque o primeiro não era ideal para tudo. O Servidorzinho tem muito CPU, mas para vídeo eu queria Intel Quick Sync. Daí nasceu a MediaBox, um Lenovo ThinkPad M90Q com i5 14500T e Intel UHD Graphics 770.

A função dela é outra: media, Jellyfin, transcodificação e experiências com NAS.

:::image-placeholder title="Servidorzinho e MediaBox" desc="Foto dos dois servidores lado a lado ou nos seus locais finais." ratio="16:9"
:::

## O que aprendi até agora

Aprendi que um homelab nunca está acabado. Há sempre uma atualização, um serviço novo, uma configuração para melhorar ou uma ideia a testar.

Também aprendi que o hardware é só a parte visível. A parte realmente interessante está nas decisões pequenas: como aceder de fora, como separar serviços, como fazer backups, como lidar com DNS, como documentar o que foi feito e como recuperar quando algo parte.

E talvez a maior surpresa seja esta: o mais divertido não é ter tudo pronto. É construir, perceber, errar e corrigir.
