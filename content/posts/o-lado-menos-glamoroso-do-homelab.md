---
title: O lado menos glamoroso de ter servidores em casa
desc: Updates, DNS, backups, discos, segurança e outras partes pouco bonitas de manter um homelab.
category: [Homelab, Segurança, Infraestrutura]
date: Ago 2026
readTime: 11 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654841/cabacatech/2026-11/covers/posts/o-lado-menos-glamoroso-do-homelab-9f16f37d88.webp
series: Diário do Homelab
seriesPart: 4
related: [post:servidor-minecraft-em-casa, post:dns-em-casa-com-adguard-home, project:cabacalab]
---

Durante semanas, o meu AdGuard Home deitou fora cerca de 5 em cada 100 pedidos DNS sem eu dar por isso (conto na [parte 3](blog-post.html?id=dns-em-casa-com-adguard-home)). É o tipo de coisa que não aparece nas fotografias de um homelab, e que aparece depressa: manter tudo a funcionar.

![Visão geral dos papéis das máquinas do homelab.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794662557/cabacatech/2026-11/diagrams/homelab-overview-94b6f844de.webp)

## A diferença entre montar e manter

Montar um serviço é a parte entusiasmante. Escolher a ferramenta, criar a VM ou LXC, abrir a dashboard pela primeira vez e ver tudo a funcionar dá aquela sensação boa de progresso.

Manter é outra coisa: lembrar que o serviço existe quando há updates, saber onde estão os dados, ver se há backups e descobrir porque algo que funcionava ontem deixou de funcionar hoje.

## Updates que aparecem na pior altura

Os updates são necessários, mas raramente aparecem quando dá jeito.

No servidor de Minecraft, por exemplo, atualizar não é só carregar num botão. Há AMP, instâncias, containers, versões do Minecraft, mods e autenticação. Quando algo falha, a tarde que era para jogar passa a ser uma sessão de troubleshooting.

Contei o processo completo, com os comandos, na [parte 2](blog-post.html?id=servidor-minecraft-em-casa).

O Jellyfin envolve metadata, permissões e storage. No Proxmox, um update pode afetar a base onde tudo corre.

## DNS é invisível até falhar

O AdGuard Home corre num container com 1 GB de RAM. Enquanto funciona, ninguém repara. Quando falha, parece que a internet inteira morreu: a ligação está boa, mas nenhum nome resolve.

Expliquei como o montei, e o limite escondido que deitava pedidos fora, na [parte 3](blog-post.html?id=dns-em-casa-com-adguard-home).

## Segurança não é só firewall

Não exponho dashboards administrativos (Proxmox, AMP, TrueNAS) à internet. O acesso remoto é por Tailscale, como contei na [parte 1](blog-post.html?id=como-comecei-o-meu-homelab). Também escondo dados em screenshots e confirmo scripts antes de os executar.

## Scripts que se executam às cegas

Instalei o AdGuard Home com os Proxmox VE Helper-Scripts, que fazem `curl` de um script remoto direto para `bash`. Por isso leio o script antes de o correr. O aviso completo está na [parte 3](blog-post.html?id=dns-em-casa-com-adguard-home).

## Storage cresce sempre

Também aprendi que storage é uma armadilha. No início parece que 10 TB é imenso. Depois começas a guardar media, backups, ISOs, snapshots, testes e ficheiros temporários.

De repente, o disco grande já não parece tão grande.

Pior: espaço não é segurança. Um disco de 10 TB continua a ser um único disco. Se falhar, falhou.

![Diagrama da experiência anterior com TrueNAS e armazenamento por USB.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794662560/cabacatech/2026-11/diagrams/truenas-usb-previous-f8b10c7377.webp)

## Monitorizar não é opcional para sempre

No início, dá para ir vendo as coisas à mão. Entrar no Proxmox, abrir dashboards, confirmar espaço e seguir. Mas à medida que há mais serviços, isso deixa de escalar.

Mesmo num homelab pequeno, há sinais que quero acompanhar melhor:

| Sinal | Porque importa |
|---|---|
| Espaço livre | Evita serviços a falhar por disco cheio |
| Uso de RAM | Mostra containers ou VMs mal dimensionados |
| CPU em pico | Ajuda a perceber lag ou transcode |
| Estado dos backups | Backup que não correu é quase igual a não existir |
| Erros de disco | Pode antecipar perda de dados |

Ainda não tenho isto tão bem montado como quero, mas já percebi que "vou vendo" funciona só até ao dia em que não viste.

## Backups são a parte que ninguém quer fazer

No homelab há muitas camadas para proteger: VMs, LXCs, configurações, ficheiros, mundos de Minecraft, bibliotecas de media e serviços com estado.

Um backup só conta se souber responder a:

- O que está incluído.
- Onde está guardado.
- Como se restaura.
- Quanto tempo demora.
- Quando foi testado pela última vez.

O mais fácil é fazer backup do que é óbvio e esquecer o que dá trabalho. Guardar ficheiros é simples. Guardar configurações, permissões, tokens, listas de serviços e passos de recuperação já exige disciplina.

Para mim, a pergunta certa passou a ser: "se isto morresse hoje, eu saberia reconstruir?" Se a resposta for não, falta documentação ou backup.

## Documentação para mim próprio

Uma coisa que parece exagerada até fazer falta é documentação pessoal. Não documentação bonita para publicar, mas notas simples:

- IPs dos serviços.
- Onde cada coisa corre.
- Como foi instalada.
- Que portas usa.
- Que dados são importantes.
- Como se restaura.

Daqui a seis meses, eu já não vou lembrar todos os detalhes. Documentar é uma forma de ajudar o meu futuro eu.

## O que compensa

Ter servidores em casa obriga-me a aprender na prática. Foi ao montar uma VM com TrueNAS que descobri as limitações de um disco USB.
