---
title: Uma NAS com Samba e Cockpit depois do TrueNAS
desc: O disco de 10 TB voltou ao homelab. Samba serve as partilhas, Cockpit dá-lhes um painel e DLNA leva os conteúdos da família à televisão. O desenho, as quotas e o que falta proteger.
category: [Homelab, Storage, Linux]
date: Nov 2026
readTime: 7 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654839/cabacatech/2026-11/covers/posts/nas-com-samba-e-cockpit-255e0e2204.webp
series: Diário do Homelab
seriesPart: 9
related: [post:jellyfin-e-truenas-o-que-aprendi, post:backups-do-homelab-com-pbs, project:homelab-proxmox-servidorzinho]
---

O disco de 10 TB voltou ao homelab com Samba, Cockpit e um servidor DLNA. Desde 9 de novembro, tenho uma partilha pessoal e outra para os conteúdos da família, servidas por um container no bifrost. O Windows acede aos ficheiros como uma unidade de rede. A televisão tem um caminho separado para descobrir a biblioteca familiar.

Depois da experiência com o [Jellyfin e o TrueNAS](blog-post.html?id=jellyfin-e-truenas-o-que-aprendi), queria reduzir os componentes necessários para guardar e partilhar ficheiros. O TrueNAS tinha-me ajudado a aprender ZFS e permissões, mas a memória que lhe destinava era demasiado peso para o uso que fazia dele.

O requisito mais imediato era simples: abrir uma pasta nos computadores, controlar quem pode escrever e gerir as partilhas num painel. A nova instalação concentra-se nesse uso. Serviços como Nextcloud ou Immich ficaram para uma necessidade futura de sincronização ou gestão de fotografias.

![Separação lógica dos backups e partilhas no disco USB do bifrost.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513999/cabacatech/2026-11/diagrams/pbs-and-nas-586f72e274.webp)

## O armazenamento fica no host

O disco USB está ligado ao bifrost e o host Proxmox gere o pool ZFS. Criei datasets separados para os backups, a partilha pessoal e a partilha familiar. O container da NAS recebe as pastas que deve servir através de bind mounts.

Assim, o Samba trata do acesso aos ficheiros pela rede. O ZFS trata da organização do armazenamento e dos limites de espaço. O Cockpit permite gerir o sistema e, com módulos próprios, os utilizadores e as partilhas.

```text title="Do disco à partilha"
Disco USB no bifrost
  -> pool ZFS no host
       -> dataset pessoal -> Samba -> computadores
       -> dataset familiar -> Samba -> computadores
                           -> DLNA  -> televisão
       -> dataset backups  -> PBS
```

O LXC é não privilegiado, corre Debian 13 e tem 1 GiB de RAM atribuído. O PBS usa outro container, com 2 GiB. O host também usa memória para gerir o ZFS. Limitei a ARC a 2 GiB para controlar essa parte do orçamento.

Separar os containers permite gerir os serviços de ficheiros sem os misturar com o processo do PBS. Cada serviço tem o seu sistema, a sua configuração e os seus recursos atribuídos.

## O que o Cockpit acrescenta

Instalei os módulos `cockpit-file-sharing` e `cockpit-identities`, da 45Drives. O primeiro permite gerir as partilhas Samba. O segundo trata das identidades usadas no acesso. As partilhas ficam no registry do Samba, que é o mecanismo usado pelo módulo para guardar a configuração.

Esta escolha evita manter, em paralelo, definições manuais que o painel desconhece. Quando for preciso diagnosticar um problema, a configuração do serviço continua a poder ser consultada com as ferramentas do Samba.

O login no Cockpit abre o painel, mas as operações administrativas exigem ativar o acesso administrativo. Essa distinção apareceu logo na utilização inicial: conseguir entrar na interface não significa ter uma sessão com permissões para alterar utilizadores ou partilhas.

:::tip title="Painel e armazenamento têm tarefas diferentes"
Uso o Cockpit para gerir as partilhas e as identidades. As quotas desta instalação pertencem aos datasets ZFS no host. Antes de alterar um limite, confirmo em que camada ele foi definido.
:::

## Duas partilhas com limites próprios

A partilha pessoal tem uma quota de 1 TB. A familiar tem 500 GB. A ideia é tornar o espaço de cada utilização previsível e evitar que um conjunto de vídeos cresça sem limite sobre o restante disco.

| Partilha | Limite configurado | Acesso |
|---|---|---|
| Pessoal | 1 TB | Acesso autenticado do proprietário |
| Familiar | 500 GB | Escrita para o grupo autorizado e leitura de convidado |

As quotas são tetos de utilização dentro do mesmo pool. Na mesma unidade existe ainda o dataset do PBS, com um limite de 3 TB. A divisão ajuda a controlar o crescimento das diferentes utilizações do disco.

Para criar uma partilha de outra pessoa, o desenho prevê uma identidade própria e um dataset com quota. Essa extensão ainda não está configurada. Prefiro acrescentá-la quando houver um uso concreto, com as permissões verificadas a partir do dispositivo que vai aceder.

## O Windows precisou de autenticação

No portátil, o Windows recusou o acesso como convidado devido à política de segurança de SMB. Resolvi o acesso com uma conta autenticada e confirmei o mapeamento da unidade de rede.

A conta autenticada funcionou com a política de segurança do cliente. O problema estava no método de acesso escolhido: o serviço estava acessível na rede, mas o explorador recusava a sessão de convidado.

A descoberta do servidor em Windows usa `wsdd2`. A descoberta e as permissões resolvem problemas diferentes: ver o nome do servidor na rede não demonstra que o utilizador consegue abrir a pasta ou gravar nela. Depois de configurar uma partilha, interessa testar leitura e escrita com a conta que a vai usar.

O container também entrou na rede Tailscale para permitir acesso privado a partir de fora. O computador remoto chega à NAS pela rede privada e apresenta as credenciais da partilha.

## Os conteúdos da família chegam por DLNA

Instalei `minidlna` no container para servir a pasta familiar à televisão. É uma forma de disponibilizar os ficheiros sem recuperar já a biblioteca e os clientes do Jellyfin.

O DLNA desta instalação não exige login. Por isso, a pasta familiar deve conter apenas conteúdos que possam ser vistos pelos dispositivos da rede local. A partilha pessoal não faz parte da biblioteca apresentada por esse serviço.

:::warning title="A pasta familiar é visível na rede local"
Os conteúdos publicados por DLNA podem ser descobertos sem autenticação. Documentos privados devem ficar fora dessa pasta. As permissões de escrita do Samba não tornam privada a biblioteca que o DLNA anuncia.
:::

O `minidlna` apresenta os ficheiros ao dispositivo que os vai reproduzir. A compatibilidade dos formatos fica do lado desse dispositivo, por isso continuo a escolher os ficheiros a pensar no equipamento onde serão vistos.

## A NAS ainda precisa do seu próprio backup

O ponto por resolver é a segunda cópia dos ficheiros. As partilhas vivem num único disco USB. O mesmo disco guarda os backups das VMs, mas isso não constitui um backup dos ficheiros da NAS.

Os datasets das partilhas são montados no container a partir do host. O job que guarda o sistema de ficheiros de raiz desse container não inclui esses datasets. Recuperar o Debian, o Samba e o Cockpit é uma operação diferente de recuperar as fotografias e os documentos.

Além disso, o pool tem um único disco e a ponte USB não deixa consultar o SMART. O ZFS consegue sinalizar corrupção, mas não tem uma réplica redundante neste pool para a reparar. Preciso de um destino adicional e de verificar a recuperação antes de tratar esta NAS como o único local para dados insubstituíveis.

Por agora, a configuração resolveu a partilha de ficheiros e ficou com os limites de espaço definidos. O acesso pelo Windows e o login no painel foram confirmados. O trabalho seguinte é proteger os dados da NAS com o mesmo cuidado que comecei a aplicar às VMs no [PBS](blog-post.html?id=backups-do-homelab-com-pbs).
