---
title: Jellyfin e TrueNAS e porque desliguei tudo
desc: Montei um servidor de media com Jellyfin e uma NAS com TrueNAS num mini PC, liguei os dois e passei semanas a afinar. Funcionou, ensinou-me muito e não era a solução certa para mim. O que aprendi e o que procuro agora.
category: [Homelab, Media Server, Storage]
date: Out 2026
readTime: 7 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654836/cabacatech/2026-11/covers/posts/jellyfin-e-truenas-o-que-aprendi-1a06618964.webp
series: Diário do Homelab
seriesPart: 6
related: [post:nas-com-samba-e-cockpit, post:mimir-desktop-remoto, project:homelab-proxmox-servidorzinho]
---

Durante uns meses o meu homelab teve um segundo servidor só para media. Era a MediaBox, um Lenovo ThinkCentre M90q Gen 5, com Proxmox, o Jellyfin para ver a biblioteca em qualquer dispositivo e uma VM de TrueNAS Scale a gerir um disco de 10 TB. Passei semanas a pôr os dois a trabalhar em conjunto. Em outubro desliguei-os.

:::info title="Atualização de 12 de novembro de 2026"
Vendi a MediaBox. O computador de secretária é outra máquina, o [mimir, um M90q Gen 6](blog-post.html?id=mimir-desktop-remoto). A 9 de novembro, o disco de 10 TB voltou ao homelab no bifrost, com [Samba, Cockpit e DLNA](blog-post.html?id=nas-com-samba-e-cockpit). O texto abaixo conta a experiência que levou a essa mudança.
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

Queria tirar a media do [Servidorzinho](project-detail.html?id=homelab-proxmox-servidorzinho). Esse tem um Ryzen 9 com CPU de sobra, mas para vídeo eu queria o Quick Sync da Intel, que codifica e descodifica em hardware, em tempo real e com poucos watts.

```text title="como estava ligado"
MediaBox (Proxmox)
  -> VM TrueNAS Scale
       -> disco USB de 10 TB, passado diretamente à VM
       -> pool e datasets, partilhados pela rede
  -> Jellyfin
       -> lê a biblioteca a partir da partilha do TrueNAS
       -> transcodifica com Quick Sync quando é preciso
```

## O Jellyfin

A parte que mais me ensinou foi perceber quando o servidor trabalha. Se o dispositivo consegue reproduzir o ficheiro original, o Jellyfin limita-se a enviá-lo (direct play) e quase não gasta CPU. Se o dispositivo não aceita o codec, a resolução ou o bitrate, o servidor converte o vídeo em tempo real. É aí que o Quick Sync faz diferença. Legendas em imagem também podem obrigar a converter.

Isto mudou a forma como penso numa biblioteca. Interessa-me guardar os ficheiros em formatos que os meus dispositivos reproduzem diretamente. Um servidor que transcodifica tudo está a compensar escolhas erradas de formato.

O resto foi manutenção que não se vê à primeira: capas erradas, nomes mal interpretados, legendas fora de tempo, clientes que se comportam de forma diferente. Nenhuma é grave sozinha. Juntas, são o custo de ter o serviço em casa.

## O TrueNAS

O TrueNAS Scale é um sistema de NAS construído sobre ZFS. Pu-lo numa VM, com o disco USB passado diretamente pelo Proxmox. Foi assim que aprendi como funcionam pools, datasets, permissões e partilhas de rede. Aprendi também a ligar o Jellyfin ao armazenamento de outro sistema.

Passar um disco USB a uma VM funciona mas tem limites. A ponte USB pode esconder o estado de saúde do disco, desligar-se num pico de consumo ou mudar de identificador depois de um reboot. Para aprender serve. Para dados que não posso perder, não.

E 10 TB num só disco continuam a ser um só disco. Se falhar, falha tudo.

Quando listei o disco em novembro, para o reutilizar, o dataset `Jellyfin` do pool estava vazio. Os 105 GiB que lá estavam eram filmes e séries antigos de um PC (7 filmes e 2 séries), noutro dataset.

## Porque desliguei tudo

O problema foi a memória. O ZFS usa a RAM como cache (a ARC) e o TrueNAS foi pensado para uma máquina dedicada: o projeto recomenda um mínimo de 8 GB só para ele. Numa VM, num mini PC que também corria o Jellyfin e outras experiências, isso pesava demais para o que eu precisava.

Quando listei o que usava de facto, vi que não queria uma NAS completa. Queria:

- um painel web para gerir ficheiros;
- usar o armazenamento como unidade de rede nos meus computadores;
- armazenamento compatível com S3, com Garage, para as aplicações;
- um sítio onde cada serviço do homelab guarde os seus backups.

O TrueNAS faz tudo isto e muito mais. Esse "muito mais" custava RAM que eu não tinha para dar. O Jellyfin desliguei-o ao mesmo tempo, porque sem o armazenamento por trás não fazia sentido mantê-lo sozinho. Hei de voltar a ele.

## O que veio a seguir

Quando desliguei tudo, estava a preparar a entrada do segundo MS-A1, o [bifrost](blog-post.html?id=chega-o-bifrost). Procurava também uma forma de reutilizar o disco de 10 TB. Em novembro ficou decidido: [Samba e Cockpit para as partilhas](blog-post.html?id=nas-com-samba-e-cockpit) e [PBS para os backups das VMs](blog-post.html?id=backups-do-homelab-com-pbs). O armazenamento S3 das aplicações continua na CabacaLab.

Sem estas semanas com o Jellyfin e o TrueNAS não teria conseguido escrever a lista de cima. Foi com elas que percebi que, numa máquina de armazenamento, a RAM é o recurso que mais pesa.
