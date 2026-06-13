---
title: O lado menos glamoroso de ter servidores em casa
desc: Updates, DNS, backups, discos, segurança e outras partes pouco bonitas de manter um homelab.
category: [Homelab, Segurança, Infraestrutura]
date: Jun 2026
readTime: 7 min
cover: ""
---

Quando se fala de homelab, é fácil mostrar a parte bonita: dashboards, mini PCs, serviços próprios, media server, Minecraft, DNS local e acesso remoto.

Mas há uma parte menos glamorosa que aparece depressa: manter tudo isso a funcionar.

:::image-placeholder title="O lado real do setup" desc="Foto do setup com cabos, disco, mini PCs e a parte menos perfeita da infraestrutura." ratio="16:9"
:::

## Updates que aparecem na pior altura

Os updates são necessários, mas raramente aparecem quando dá jeito.

No servidor de Minecraft, por exemplo, atualizar não é só carregar num botão. Há AMP, instâncias, containers, versões do Minecraft, mods e autenticação. Quando algo falha, a tarde que era para jogar passa a ser uma sessão de troubleshooting.

```bash title="update do AMP"
getamp update
su -l amp
ampinstmgr upgradeall
```

Depois `Ctrl + D` para sair do utilizador `amp`.

:::warning title="O update não é o problema, a falta de plano é"
Antes de atualizar serviços importantes, convém saber como voltar atrás. Backups e snapshots não são glamour, mas salvam tempo.
:::

## DNS é invisível até falhar

O AdGuard Home é um ótimo exemplo de um serviço pequeno com impacto gigante. Enquanto funciona, ninguém repara. Quando falha, parece que a internet inteira morreu.

Se o router aponta para o AdGuard Home como DNS e o LXC está desligado, os dispositivos podem deixar de resolver domínios. A ligação à internet pode estar boa, mas nada abre porque os nomes não resolvem.

:::resource title="AdGuard Home" url="https://adguard.com/en/adguard-home/overview.html"
Uso AdGuard Home como DNS local para bloquear tracking, telemetry, malware, phishing e anúncios.
:::

:::danger title="Serviços pequenos também podem ser críticos"
Um LXC com poucos recursos pode ser essencial para a rede toda. Se ele falha, o impacto pode ser maior do que o tamanho do serviço sugere.
:::

## Segurança não é só firewall

Uma das decisões mais importantes foi não expor dashboards administrativos diretamente à internet. Proxmox, AMP, TrueNAS e outros painéis são úteis, mas não precisam de estar abertos ao mundo.

Para acesso remoto, uso Tailscale. Assim consigo chegar aos serviços fora de casa sem abrir portas desnecessárias no router.

:::resource title="Tailscale" url="https://tailscale.com/docs"
Uso Tailscale para acesso privado aos serviços do homelab.
:::

Segurança também é esconder dados em screenshots, usar permissões certas, não partilhar tokens, confirmar scripts antes de executar e não fingir que "é só uma rede doméstica".

## Scripts mágicos são confortáveis, mas perigosos

Usei Proxmox VE Helper-Scripts para instalar o AdGuard Home. Foi prático e funcionou bem.

Mas um comando que faz `curl` de um script remoto e o passa diretamente para `bash` deve sempre levantar uma sobrancelha.

:::resource title="Proxmox VE Helper-Scripts" url="https://community-scripts.org/"
Projeto comunitário útil para instalar serviços no Proxmox, desde que se leia o que vai ser executado.
:::

:::danger title="Não executes scripts às cegas"
Se um comando vem da internet e corre como root ou com permissões elevadas, ele pode fazer praticamente tudo no sistema. Lê primeiro, executa depois.
:::

## Storage cresce sempre

Também aprendi que storage é uma armadilha. No início parece que 10 TB é imenso. Depois começas a guardar media, backups, ISOs, snapshots, testes e ficheiros temporários.

De repente, o disco grande já não parece tão grande.

Pior: espaço não é segurança. Um disco de 10 TB continua a ser um único disco. Se falhar, falhou.

:::image-placeholder title="Storage e NAS experimental" desc="Foto ou diagrama simples do disco externo, MediaBox e VM TrueNAS." ratio="16:9"
:::

## Backups são a parte que ninguém quer fazer

Toda a gente sabe que backups são importantes. Quase ninguém quer gastar tempo com eles até perder alguma coisa.

No homelab, esta parte é ainda mais importante porque há muitas camadas: VMs, LXCs, configurações, ficheiros, mundos de Minecraft, bibliotecas de media e serviços com estado.

Um backup bom não é só "tenho uma cópia". É saber:

- O que está incluído.
- Onde está guardado.
- Como se restaura.
- Quanto tempo demora.
- Quando foi testado pela última vez.

## O que compensa

Mesmo com tudo isto, continuo a achar que vale a pena.

Ter servidores em casa obriga-me a aprender de forma prática. Não é ler um artigo sobre DNS, é partir o DNS e perceber porque nada abre. Não é ver um vídeo sobre storage, é montar uma VM com TrueNAS e descobrir as limitações de um disco USB. Não é só instalar Minecraft, é manter um serviço que outras pessoas usam.

O lado menos glamoroso é precisamente o lado que mais ensina.
