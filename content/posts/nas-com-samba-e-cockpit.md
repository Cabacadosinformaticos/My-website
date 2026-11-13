---
title: Uma NAS com Samba e Cockpit depois do TrueNAS
desc: O disco de 10 TB voltou ao homelab. Samba serve as partilhas, o Cockpit dá-lhes um painel e o DLNA leva os vídeos da família à televisão. Como ficou montado, as quotas e o que falta proteger.
category: [Homelab, Storage, Linux]
date: Nov 2026
readTime: 6 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654839/cabacatech/2026-11/covers/posts/nas-com-samba-e-cockpit-255e0e2204.webp
series: Diário do Homelab
seriesPart: 9
related: [post:jellyfin-e-truenas-o-que-aprendi, post:backups-do-homelab-com-pbs, project:homelab-proxmox-servidorzinho]
---

O disco de 10 TB que andou meses dentro de uma VM de TrueNAS voltou ao homelab a 9 de novembro, agora ligado ao bifrost. Antes de o reutilizar, listei o que tinha lá dentro: 105 GiB de filmes e séries antigos. Depois apaguei o disco todo e criei um pool ZFS novo.

Passei a ter duas partilhas, uma pessoal e outra para a família, num container Debian com Samba. No Windows aparecem como uma unidade de rede. A televisão tem um caminho à parte para ver a pasta da família.

O ponto de partida foi o [post do Jellyfin e do TrueNAS](blog-post.html?id=jellyfin-e-truenas-o-que-aprendi). O TrueNAS ensinou-me ZFS e permissões, mas a RAM que pedia era demasiada para eu abrir uma pasta no computador. Nextcloud e Immich ficaram para quando houver uma necessidade concreta de sincronização ou de gerir fotografias.

![Separação lógica dos backups e partilhas no disco USB do bifrost.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513999/cabacatech/2026-11/diagrams/pbs-and-nas-586f72e274.webp)

## Como está montado

O disco USB está no bifrost e o host Proxmox gere o pool ZFS. Criei um dataset para cada partilha e outro para os backups. O container da NAS recebe as pastas por bind mount. O ZFS trata do espaço e das quotas. O Samba trata do acesso pela rede.

O container é um LXC não privilegiado com Debian 13 e 1 GiB de RAM. O PBS vive noutro container, com 2 GiB. O host fica com a cache ZFS limitada a 2 GiB.

```text title="Do disco à partilha"
Disco USB no bifrost
  -> pool ZFS no host
       -> dataset pessoal  -> Samba -> computadores
       -> dataset familiar -> Samba -> computadores
                           -> DLNA  -> televisão
       -> dataset backups  -> PBS
```

Para o painel instalei o Cockpit e dois módulos da 45Drives: `cockpit-file-sharing`, que gere as partilhas Samba. O outro é o `cockpit-identities`, que gere os utilizadores. Não há módulo de ficheiros porque o `cockpit-files` ainda não existe para o Debian 13.

As partilhas ficam no registry do Samba, que é onde o módulo as escreve. O `smb.conf` só aponta para lá:

```ini title="smb.conf"
[global]
    include = registry
```

Se alguma coisa se comportar de forma estranha, `testparm -s` mostra a configuração e `net conf list` lista as partilhas.

O Cockpit teve uma surpresa logo à entrada. Entrar na interface não chega para mexer em partilhas ou utilizadores. É preciso carregar em "Turn on administrative access", que é um sudo com a palavra-passe do utilizador.

## As duas partilhas

| Partilha | Quota | Acesso |
|---|---|---|
| Pessoal | 1 TB | Só o meu utilizador, com autenticação |
| Familiar | 500 GB | Leitura para convidados, escrita para o grupo da família |

As quotas são dos datasets ZFS e não do Cockpit. São elas que mandam. Para ver o espaço de cada partilha:

```bash
zfs list -o name,used,avail,quota -r tank/nas
```

O dataset dos backups do PBS está no mesmo disco, com 3 TB. Somados, os três limites cabem nos 10 TB.

Para dar uma partilha a outra pessoa são quatro passos: um utilizador no container (`useradd` e `smbpasswd -a`), um dataset com quota, um ponto de montagem e a partilha. Os dois últimos também se fazem pelo Cockpit. Ainda não criei nenhuma, só quando houver quem a queira usar.

## O Windows recusou o convidado

No portátil, o Windows não quis entrar na partilha como convidado, por causa da política de assinatura SMB. O servidor estava acessível e o explorador é que recusava a sessão. Passei a entrar com o meu utilizador, mapeei a unidade e funcionou. O acesso de convidado ficou para a televisão e para os telemóveis.

Instalei também o `wsdd2` para o Windows descobrir o servidor pelo nome. Aparecer na rede não quer dizer que se consiga abrir a pasta, por isso testei leitura e escrita com a conta que a usa.

O container entrou ainda na rede Tailscale, o que me permite chegar à NAS de fora de casa pela rede privada, com as credenciais da partilha.

## A televisão

Instalei o `minidlna` para servir a pasta familiar à televisão. É a forma mais pequena de ver os vídeos sem trazer já de volta o Jellyfin. Na rede aparece como "NAS Familia", na porta 8200.

:::warning title="O DLNA não pede login"
Qualquer aparelho da rede local vê o que estiver na pasta familiar. Documentos privados ficam na partilha pessoal, que o DLNA não serve.
:::

A compatibilidade dos formatos depende do que a televisão sabe reproduzir. Continuo a escolher os ficheiros a pensar nela.

## O que falta

Os ficheiros das partilhas só existem neste disco. O mesmo disco guarda os backups das VMs, mas isso não é uma cópia das partilhas. O job do PBS que guarda este container leva só o sistema de ficheiros de raiz, por isso recuperaria o Debian, o Samba e o Cockpit e não as fotografias nem os documentos.

O pool tem um disco e a ponte USB não deixa ler o SMART. O ZFS avisa de corrupção mas não tem outra cópia para a reparar. Enquanto não houver uma segunda cópia, a NAS não é o único sítio onde guardo o que não se pode perder. O passo seguinte é essa cópia, descrita nos [backups com o PBS](blog-post.html?id=backups-do-homelab-com-pbs).
