---
title: A minha Netflix em casa com Jellyfin
desc: Porque decidi montar um serviço de media próprio, o que ganhei com isso e os problemas que vieram junto.
category: [Media Server, Homelab, Jellyfin]
date: Jun 2026
readTime: 8 min
cover: ""
---

Há uma ideia muito apelativa em ter a nossa própria Netflix em casa. Abrir uma app, escolher um filme ou série da nossa biblioteca e ver em qualquer dispositivo, sem depender de catálogos que mudam todos os meses.

Foi isso que me levou ao Jellyfin.

:::image-placeholder title="Jellyfin na sala" desc="Foto ou screenshot do Jellyfin numa TV, tablet ou browser, usando conteúdo de teste." ratio="16:9"
:::

## Porque Jellyfin

Jellyfin é um servidor de media open source. Permite organizar filmes, séries, música e outros conteúdos numa biblioteca própria, com capas, metadados, utilizadores e reprodução em vários dispositivos.

O ponto mais importante para mim é controlo. A biblioteca é minha, corre na minha infraestrutura e não depende de uma subscrição mensal.

:::resource title="Jellyfin" url="https://jellyfin.org/docs/"
É o serviço que estou a usar para construir a minha biblioteca de media em casa.
:::

## A MediaBox

Para correr isto, uso a MediaBox: um Lenovo ThinkPad M90Q com um Intel Core i5 14500T e Intel UHD Graphics 770.

Este servidor foi escolhido por causa do Intel Quick Sync. A transcodificação de vídeo pode ser pesada, principalmente quando um ficheiro precisa de ser convertido para outro formato, resolução ou bitrate. Com Quick Sync, muito desse trabalho passa para a GPU integrada.

:::specs title="MediaBox"
Máquina: Lenovo ThinkPad M90Q
CPU: Intel Core i5 14500T
GPU integrada: Intel UHD Graphics 770
RAM: 32 GB DDR5
Hypervisor: Proxmox VE 9.2.1
Função: Media server e storage experimental
:::

:::resource title="Intel Video Processing Library" url="https://www.intel.com/content/www/us/en/developer/tools/vpl/overview.html"
Referência da Intel sobre processamento de vídeo por hardware, o tipo de tecnologia que torna este setup mais eficiente.
:::

## A parte boa

A parte boa é óbvia: liberdade.

Não há uma plataforma a remover uma série a meio. Não há várias subscrições para diferentes catálogos. Não há aquela sensação de pagar cada vez mais e encontrar cada vez menos do que se quer ver.

Também há uma satisfação especial em construir o próprio sistema. Instalar, configurar, testar, perceber porque algo não está a fazer transcoding como devia e ir ajustando até funcionar.

## A parte menos boa

A parte menos boa é igualmente óbvia: agora és tu que tens de tratar de tudo.

Tens de instalar o serviço, manter updates, organizar ficheiros, escolher nomes corretos, corrigir metadados, pensar em storage e lidar com problemas quando algo deixa de funcionar.

E depois há o maior problema de todos: espaço.

## O buraco negro do storage

No início parece controlado. Um filme ocupa alguns gigabytes, uma série ocupa mais qualquer coisa, e tudo parece razoável.

Depois começas a adicionar mais conteúdo. Alguns ficheiros têm 2 GB, outros 8 GB, outros 40 GB ou mais. A biblioteca cresce depressa e o disco começa a parecer pequeno.

Foi aí que entrou o disco externo de 10 TB.

:::image-placeholder title="Disco externo de 10 TB" desc="Foto do Seagate Expansion ligado à MediaBox." ratio="4:3"
:::

## A minha solução temporária de NAS

Neste momento, uso um Seagate Expansion de 10 TB ligado por USB à MediaBox. Por cima disso, tenho uma VM com TrueNAS Scale, onde estou a aprender conceitos de NAS, permissões, partilhas e organização.

É importante dizer: isto não é uma solução ideal para dados importantes. É uma solução experimental para aprender.

:::danger title="Um disco USB não é uma estratégia de backup"
Ter um disco grande não significa ter segurança. Se os dados forem importantes, é preciso redundância, backups e uma estratégia de recuperação.
:::

:::resource title="TrueNAS Community Edition" url="https://www.truenas.com/truenas-community-edition/"
Uso TrueNAS Scale para experimentar gestão de storage e partilhas em rede.
:::

## Ainda está no início

O Jellyfin ainda está numa fase inicial no meu setup. A base está lá, mas ainda há muito para configurar: organização automática, metadados, permissões, bibliotecas, performance e integração com o storage.

Mas a direção está clara. Quero uma biblioteca minha, controlada por mim, a correr em hardware pequeno e eficiente.

## Vale a pena?

Para mim, sim. Não porque seja mais simples. Não é. É mais trabalho do que pagar uma subscrição.

Vale a pena porque aprendo, porque controlo o sistema e porque gosto do processo. O objetivo não é só ver filmes. É construir a infraestrutura que permite isso acontecer.
