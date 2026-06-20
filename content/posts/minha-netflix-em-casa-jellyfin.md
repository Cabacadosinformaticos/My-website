---
title: A minha Netflix em casa com Jellyfin
desc: Porque decidi montar um serviço de media próprio, o que ganhei com isso e os problemas que vieram junto.
category: [Media Server, Homelab, Jellyfin]
date: Jun 2026
readTime: 12 min
cover: ""
---

Há uma ideia muito apelativa em ter a nossa própria Netflix em casa. Abrir uma app, escolher um filme ou série da nossa biblioteca e ver em qualquer dispositivo, sem depender de catálogos que mudam todos os meses.

Foi isso que me levou ao Jellyfin.

:::image-placeholder title="Jellyfin na sala" desc="Foto ou screenshot do Jellyfin numa TV, tablet ou browser, usando conteúdo de teste." ratio="16:9"
:::

## A ideia por trás

O que me interessa no Jellyfin não é só poupar subscrições. Claro que isso pesa, porque hoje há demasiadas plataformas e cada uma tem o seu catálogo fechado. Mas a parte que mais me chama é a sensação de controlo.

Quero poder organizar uma biblioteca minha, perceber onde estão os ficheiros, escolher como são servidos e não depender de uma app que muda regras, remove conteúdo ou aumenta preço sem eu poder fazer grande coisa.

Ao mesmo tempo, isto vem com uma troca clara: deixo de pagar só com dinheiro e passo a pagar também com tempo. Tempo a instalar, configurar, organizar, corrigir e aprender.

## Porque Jellyfin

Jellyfin é um servidor de media open source. Permite organizar filmes, séries, música e outros conteúdos numa biblioteca própria, com capas, metadados, utilizadores e reprodução em vários dispositivos.

O ponto mais importante para mim é controlo. A biblioteca é minha, corre na minha infraestrutura e não depende de uma subscrição mensal.

:::resource title="Jellyfin" url="https://jellyfin.org/docs/"
É o serviço que estou a usar para construir a minha biblioteca de media em casa.
:::

Escolhi Jellyfin também por ser open source. Para um serviço que vai gerir uma biblioteca pessoal e possivelmente perfis de utilizador, prefiro uma solução que não dependa de uma subscrição para desbloquear funcionalidades essenciais.

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

## Direct Play vs transcode

Uma das coisas que mais quero otimizar é evitar transcode quando não é necessário. Se o dispositivo consegue reproduzir o ficheiro original, o Jellyfin só precisa de enviar a stream. Isso é Direct Play e é o cenário ideal.

O transcode entra quando há incompatibilidade. Talvez a TV não suporte o codec. Talvez a ligação não aguente o bitrate. Talvez as legendas obriguem o servidor a gerar vídeo novo. Nesses casos, a MediaBox tem de trabalhar mais.

Isto muda a forma como penso a biblioteca. Não é só guardar ficheiros. É guardar ficheiros que façam sentido para os dispositivos onde vou ver.

## A parte boa

A parte boa é óbvia: liberdade.

Não há uma plataforma a remover uma série a meio. Não há várias subscrições para diferentes catálogos. Não há aquela sensação de pagar cada vez mais e encontrar cada vez menos do que se quer ver.

Também há uma satisfação especial em construir o próprio sistema. Instalar, configurar, testar, perceber porque algo não está a fazer transcoding como devia e ir ajustando até funcionar.

Outra coisa boa é que o sistema passa a ser meu de uma forma que uma plataforma nunca é. Se quero reorganizar bibliotecas, separar utilizadores ou mudar o storage, posso fazê-lo. Dá trabalho, mas não fico limitado por decisões de produto de outra empresa.

## A parte menos boa

A parte menos boa é igualmente óbvia: agora és tu que tens de tratar de tudo.

Tens de instalar o serviço, manter updates, organizar ficheiros, escolher nomes corretos, corrigir metadados, pensar em storage e lidar com problemas quando algo deixa de funcionar.

E depois há o maior problema de todos: espaço.

Também há a parte da manutenção invisível. Capas erradas, nomes mal interpretados, ficheiros duplicados, legendas fora de tempo, permissões estranhas e clientes que se comportam de forma diferente. Nada disto é dramático sozinho, mas tudo junto faz parte do custo real de ter o teu próprio serviço.

## O buraco negro do storage

No início parece controlado. Um filme ocupa alguns gigabytes, uma série ocupa mais qualquer coisa, e tudo parece razoável.

Depois começas a adicionar mais conteúdo. Alguns ficheiros têm 2 GB, outros 8 GB, outros 40 GB ou mais. A biblioteca cresce depressa e o disco começa a parecer pequeno.

Foi aí que entrou o disco externo de 10 TB.

:::image-placeholder title="Disco externo de 10 TB" desc="Foto do Seagate Expansion ligado à MediaBox." ratio="4:3"
:::

## O custo que substitui a subscrição

Quando deixas de pagar subscrições, não significa que deixas de gastar dinheiro. Só mudas onde gastas.

Em vez de mensalidades, aparecem:

- Discos com mais capacidade.
- Hardware para correr o servidor.
- Energia.
- Tempo de configuração.
- Tempo de manutenção.
- Eventuais backups.

Para mim, continua a compensar porque há aprendizagem e controlo. Mas não gosto da narrativa de que self-hosting é simplesmente "grátis". Não é. É outro modelo de custo.

## A minha solução temporária de NAS

Neste momento, uso um Seagate Expansion de 10 TB ligado por USB à MediaBox. Por cima disso, tenho uma VM com TrueNAS Scale, onde estou a aprender conceitos de NAS, permissões, partilhas e organização.

É importante dizer: isto não é uma solução ideal para dados importantes. É uma solução experimental para aprender.

:::danger title="Um disco USB não é uma estratégia de backup"
Ter um disco grande não significa ter segurança. Se os dados forem importantes, é preciso redundância, backups e uma estratégia de recuperação.
:::

:::resource title="TrueNAS Community Edition" url="https://www.truenas.com/truenas-community-edition/"
Uso TrueNAS Scale para experimentar gestão de storage e partilhas em rede.
:::

## O que quero melhorar

Antes de chamar isto de setup final, ainda há muita coisa a resolver:

| Área | O que falta melhorar |
|---|---|
| Organização | Estrutura consistente de filmes, séries e música |
| Metadata | Corrigir capas, nomes e identificações erradas |
| Performance | Confirmar quando há Direct Play e quando há transcode |
| Storage | Pensar em redundância e backups reais |
| Permissões | Separar melhor serviços e utilizadores |
| Automação | Só adicionar depois da base estar limpa |

Quero evitar o erro de automatizar cedo demais. Se a biblioteca estiver mal organizada, automação só torna a confusão maior e mais rápida.

## Ainda está no início

O Jellyfin ainda está numa fase inicial no meu setup. A base está lá, mas ainda há muito para configurar: organização automática, metadados, permissões, bibliotecas, performance e integração com o storage.

Mas a direção está clara. Quero uma biblioteca minha, controlada por mim, a correr em hardware pequeno e eficiente.

## Vale a pena?

Para mim, sim. Não porque seja mais simples. Não é. É mais trabalho do que pagar uma subscrição.

Vale a pena porque aprendo, porque controlo o sistema e porque gosto do processo. O objetivo não é só ver filmes. É construir a infraestrutura que permite isso acontecer.
