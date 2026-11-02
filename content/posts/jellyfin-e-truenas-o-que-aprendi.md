---
title: Jellyfin e TrueNAS, e porque desliguei tudo
desc: Montei um servidor de media com Jellyfin e uma NAS com TrueNAS num mini PC, liguei os dois e passei semanas a afinar. Funcionou, ensinou-me muito e não era a solução certa para mim. O que aprendi e o que procuro agora.
category: [Homelab, Media Server, Storage]
date: Out 2026
readTime: 11 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513978/cabacatech/2026-11/covers/posts/jellyfin-e-truenas-o-que-aprendi-9216c82566.webp
series: Diário do Homelab
seriesPart: 6
related: [post:chega-o-bifrost, post:o-lado-menos-glamoroso-do-homelab, project:homelab-proxmox-servidorzinho]
---

Durante uns meses, o meu homelab teve um segundo servidor dedicado a media: a MediaBox, um Lenovo ThinkCentre M90q Gen 5. Corria Jellyfin para ver a minha biblioteca em qualquer dispositivo e uma VM com TrueNAS Scale a gerir um disco de 10 TB. Mexi bastante nos dois e passei muito tempo a pô-los a trabalhar em conjunto.

Hoje estão os dois desligados, e a MediaBox vai ter outra vida. Este post conta o que montei, o que aprendi e porque decidi parar.

:::image-placeholder title="A MediaBox e o disco de 10 TB" desc="Foto do M90q com o disco externo, ou um diagrama do setup antigo." ratio="16:9"
:::

## O setup

:::specs title="MediaBox"
Máquina: Lenovo ThinkCentre M90q Gen 5
CPU: Intel Core i5 14500T, 14 núcleos
GPU integrada: Intel UHD Graphics 770, com Quick Sync
RAM: 32 GB DDR5
Base: Proxmox VE
Storage de media: Seagate Expansion 10 TB, por USB
:::

A ideia era separar a media do servidor principal. O [Servidorzinho](project-detail.html?id=homelab-proxmox-servidorzinho) tem um Ryzen 9 com muito CPU, mas para vídeo eu queria o Intel Quick Sync: a GPU integrada da Intel tem hardware dedicado a codificar e descodificar vídeo, e faz em tempo real, com poucos watts, o que um CPU faria com esforço.

```text title="como estava ligado"
MediaBox (Proxmox)
  -> VM TrueNAS Scale
       -> disco USB de 10 TB, passado diretamente à VM
       -> pool e datasets, partilhados pela rede
  -> Jellyfin
       -> lê a biblioteca a partir da partilha do TrueNAS
       -> transcodifica com Quick Sync quando é preciso
```

## O que aprendi com o Jellyfin

O Jellyfin é um servidor de media open source: organiza filmes, séries e música com capas e metadados, e serve-os para a TV, o telemóvel ou o browser. A parte que mais me ensinou foi perceber quando é que o servidor trabalha.

:::compare left="Direct Play" right="Transcode"
- O dispositivo consegue reproduzir o ficheiro original
- O servidor só envia o ficheiro
- Quase não gasta CPU nem GPU
- É o cenário ideal
|||
- O dispositivo não suporta o codec, a resolução ou o bitrate
- O servidor converte o vídeo em tempo real
- É aqui que o Quick Sync faz diferença
- Legendas em imagem também podem obrigar a converter
:::

Isto mudou a forma como penso numa biblioteca. Guardar ficheiros não chega: interessa guardá-los em formatos que os dispositivos onde vou ver conseguem reproduzir diretamente. Um servidor que transcodifica tudo está a compensar más escolhas de formato.

Também aprendi que a manutenção invisível existe: capas erradas, nomes mal interpretados, legendas fora de tempo, clientes que se comportam de forma diferente. Nada disto é grave sozinho, mas tudo junto é o custo real de ter o próprio serviço.

## O que aprendi com o TrueNAS

O TrueNAS Scale é um sistema operativo de NAS construído sobre ZFS. Pô-lo numa VM, com o disco passado diretamente, ensinou-me como funcionam pools, datasets, permissões e partilhas de rede, e como ligar um serviço (o Jellyfin) ao armazenamento de outro.

:::details title="Passar um disco USB a uma VM"
O Proxmox permite entregar um dispositivo físico diretamente a uma VM, em vez de lhe dar um disco virtual. A VM vê o disco como se estivesse ligado a ela. Isto é necessário para o ZFS, que quer falar com o disco real para gerir a integridade dos dados.

Por USB, isto funciona, mas tem limites: a ponte USB do disco pode esconder informação de saúde do disco, desligar-se num pico de consumo, ou mudar de identificador depois de um reboot. Para aprender serve. Para guardar dados importantes, não.
:::

:::danger title="Um disco não é um backup"
10 TB num só disco continuam a ser um só disco. Se falhar, falhou tudo. Capacidade e segurança são coisas diferentes.
:::

## Porque desliguei tudo

O problema principal foi a memória. O ZFS usa a RAM como cache (a ARC), e o TrueNAS foi desenhado para uma máquina dedicada: o projeto recomenda no mínimo 8 GB só para ele. Numa VM, num mini PC que também tinha de correr o Jellyfin e outras experiências, isso pesava demasiado para aquilo que eu precisava.

E quando olhei para o que eu realmente usava, percebi que não precisava de uma NAS completa. Precisava de:

- um painel web para gerir os ficheiros;
- poder usar o armazenamento como uma drive de rede nos meus computadores;
- um armazenamento compatível com S3, com Garage, para as aplicações;
- um sítio onde cada serviço do homelab guarde os seus backups.

O TrueNAS faz tudo isto e muito mais, e esse "muito mais" tem um custo de RAM que não se justificava. O Jellyfin desliguei-o ao mesmo tempo: sem o armazenamento por trás, não fazia sentido mantê-lo sozinho. Hei de voltar a ele.

## O que vem a seguir

A MediaBox deixou de ser servidor: vai ser o meu computador de secretária. O lugar dela no homelab vai ser ocupado por um segundo MS-A1, o [bifrost](blog-post.html?id=chega-o-bifrost). O disco de 10 TB vai voltar, ainda não sei bem em que máquina nem com que software.

Neste momento estou a comparar alternativas mais leves que cubram a lista acima. Quando escolher, escrevo sobre isso aqui.

## Valeu a pena?

Sim. Desligar um serviço depois de o montar parece um passo atrás, mas foi o resultado de perceber o que eu precisava. Sem ter passado semanas com o Jellyfin e o TrueNAS, não saberia escrever a lista do que procuro agora, nem saberia porque é que a RAM é o recurso que mais conta numa máquina de armazenamento.
