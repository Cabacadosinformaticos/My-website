---
title: O lado menos glamoroso de ter servidores em casa
desc: Updates, DNS, backups, discos, segurança e outras partes pouco bonitas de manter um homelab.
category: [Homelab, Segurança, Infraestrutura]
date: Ago 2026
readTime: 11 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513980/cabacatech/2026-11/covers/posts/o-lado-menos-glamoroso-do-homelab-2d816de744.webp
series: Diário do Homelab
seriesPart: 4
related: [post:servidor-minecraft-em-casa, post:dns-em-casa-com-adguard-home, project:cabacalab]
---

Quando se fala de homelab, é fácil mostrar a parte bonita: dashboards, mini PCs, serviços próprios, media server, Minecraft, DNS local e acesso remoto.

Mas há uma parte menos glamorosa que aparece depressa: manter tudo isso a funcionar.

:::image-placeholder title="O lado real do setup" desc="Foto do setup com cabos, disco, mini PCs e a parte menos perfeita da infraestrutura." ratio="16:9"
:::

## A diferença entre montar e manter

Montar um serviço é a parte entusiasmante. Escolher a ferramenta, criar a VM ou LXC, abrir a dashboard pela primeira vez e ver tudo a funcionar dá aquela sensação boa de progresso.

Manter é outra coisa. Manter é lembrar que aquele serviço existe quando há updates. É saber onde estão os dados. É perceber se há backups. É descobrir porque algo que funcionava ontem deixou de funcionar hoje.

Foi essa diferença que o homelab me mostrou mais depressa do que eu esperava.

## Updates que aparecem na pior altura

Os updates são necessários, mas raramente aparecem quando dá jeito.

No servidor de Minecraft, por exemplo, atualizar não é só carregar num botão. Há AMP, instâncias, containers, versões do Minecraft, mods e autenticação. Quando algo falha, a tarde que era para jogar passa a ser uma sessão de troubleshooting.

Contei o processo completo, com os comandos, na [parte 2](blog-post.html?id=servidor-minecraft-em-casa).

:::warning title="O update não é o problema, a falta de plano é"
Antes de atualizar serviços importantes, convém saber como voltar atrás. Backups e snapshots não são glamour, mas salvam tempo.
:::

O problema dos updates não é só o comando. É o contexto. Atualizar um serviço isolado é uma coisa. Atualizar algo que tem dados, utilizadores, dependências e hábitos à volta é outra.

No Minecraft, um update pode envolver AMP, containers, mods e versões do cliente. No Jellyfin, pode envolver metadata, permissões e storage. No Proxmox, pode afetar a base onde tudo corre. A palavra "update" parece sempre pequena demais para aquilo que pode implicar.

## DNS é invisível até falhar

O AdGuard Home é um ótimo exemplo de um serviço pequeno com impacto gigante. Enquanto funciona, ninguém repara. Quando falha, parece que a internet inteira morreu: a ligação está boa, mas nenhum nome resolve.

:::danger title="Serviços pequenos também podem ser críticos"
Um container com 1 GB de RAM pode ser essencial para a rede toda. O tamanho de um serviço não diz nada sobre o impacto da sua falha.
:::

Isto mudou a forma como olho para serviços "simples". Expliquei como o montei, e o limite escondido que andava a deitar pedidos fora, na [parte 3](blog-post.html?id=dns-em-casa-com-adguard-home).

## Segurança não é só firewall

Uma das decisões mais importantes foi não expor dashboards administrativos diretamente à internet. Proxmox, AMP, TrueNAS e outros painéis são úteis, mas não precisam de estar abertos ao mundo.

Para acesso remoto, uso Tailscale. Assim consigo chegar aos serviços fora de casa sem abrir portas desnecessárias no router.

:::resource title="Tailscale" url="https://tailscale.com/docs"
Uso Tailscale para acesso privado aos serviços do homelab.
:::

Segurança também é esconder dados em screenshots, usar permissões certas, não partilhar tokens, confirmar scripts antes de executar e não fingir que "é só uma rede doméstica".

Também é separar papéis. Acesso para jogar não é acesso para administrar. Acesso para ver media não é acesso para alterar storage. Acesso por Tailscale não elimina a necessidade de permissões no serviço final.

## Scripts mágicos são confortáveis, mas perigosos

Usei os Proxmox VE Helper-Scripts para instalar o AdGuard Home. Foi prático e funcionou bem.

Mas um comando que faz `curl` de um script remoto e o passa diretamente para `bash` deve sempre levantar uma sobrancelha.

:::resource title="Proxmox VE Helper-Scripts" url="https://community-scripts.org/"
Projeto comunitário útil para instalar serviços no Proxmox, desde que se leia o que vai ser executado.
:::

:::danger title="Não executes scripts às cegas"
Se um comando vem da internet e corre como root ou com permissões elevadas, ele pode fazer praticamente tudo no sistema. Lê primeiro, executa depois.
:::

Isto não quer dizer que scripts comunitários sejam maus. Pelo contrário, podem poupar imenso tempo. Mas há uma diferença entre usar uma ferramenta e abdicar de perceber o que ela faz.

## Storage cresce sempre

Também aprendi que storage é uma armadilha. No início parece que 10 TB é imenso. Depois começas a guardar media, backups, ISOs, snapshots, testes e ficheiros temporários.

De repente, o disco grande já não parece tão grande.

Pior: espaço não é segurança. Um disco de 10 TB continua a ser um único disco. Se falhar, falhou.

:::image-placeholder title="Storage e NAS experimental" desc="Foto ou diagrama simples do disco externo, MediaBox e VM TrueNAS." ratio="16:9"
:::

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

Toda a gente sabe que backups são importantes. Quase ninguém quer gastar tempo com eles até perder alguma coisa.

No homelab, esta parte é ainda mais importante porque há muitas camadas: VMs, LXCs, configurações, ficheiros, mundos de Minecraft, bibliotecas de media e serviços com estado.

Um backup bom não é só "tenho uma cópia". É saber:

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

Mesmo com tudo isto, continuo a achar que vale a pena.

Ter servidores em casa obriga-me a aprender de forma prática. Não é ler um artigo sobre DNS, é partir o DNS e perceber porque nada abre. Não é ver um vídeo sobre storage, é montar uma VM com TrueNAS e descobrir as limitações de um disco USB. Não é só instalar Minecraft, é manter um serviço que outras pessoas usam.

O lado menos glamoroso é precisamente o lado que mais ensina.
