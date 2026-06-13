---
title: Ter um servidor de Minecraft em casa é mais trabalhoso do que parece
desc: Entre AMP, mods, Docker, updates e amigos à espera, montar um servidor de Minecraft próprio acabou por ser uma escola de administração de sistemas.
category: [Minecraft, Homelab, Servidores]
date: Jun 2026
readTime: 9 min
cover: ""
---

Uma das grandes razões para eu querer um servidor em casa era Minecraft. Eu queria ter mundos meus, modpacks pesados, servidores para amigos e controlo total sobre as versões e configurações.

Na minha cabeça, isto era simples: montava o servidor, criava o mundo, convidava os amigos e estava feito.

Claro que não foi assim tão simples.

:::image-placeholder title="Servidor de Minecraft" desc="Screenshot de um mundo de Minecraft ou da lista de servidores, sem IP público visível." ratio="16:9"
:::

## A base técnica

O servidor corre numa VM dedicada dentro do Proxmox. Essa VM usa Debian 13.2.0-amd64 e tem recursos bastante generosos, porque pode correr várias instâncias de Minecraft ao mesmo tempo.

:::specs title="VM do Minecraft"
Sistema: Debian 13.2.0-amd64
vCPU: 10 vCores
RAM: 20 GB
Disco: Cerca de 250 GB SSD
Gestor: AMP da CubeCoders
:::

Pode parecer muito, e é. Mas muitos dos servidores que quero correr usam modpacks pesados, alguns com mais de 50 mods. Preferi dar margem à VM e depois ir ajustando se fosse preciso.

## O papel do AMP

Para gerir os servidores uso o AMP, da CubeCoders. Ele dá-me uma dashboard web onde posso criar instâncias, gerir ficheiros, mudar versões, configurar permissões e controlar recursos.

:::resource title="CubeCoders AMP" url="https://cubecoders.com/AMP"
É a ferramenta que uso para gerir várias instâncias de Minecraft sem fazer tudo à mão.
:::

O AMP é uma daquelas ferramentas que, quando funciona bem, parece magia. Crio uma instância, entro no painel, configuro a versão, mexo nos ficheiros e sigo a vida.

O problema é quando não funciona bem. Aí começa a parte divertida, ou irritante, dependendo da hora.

## Instâncias, containers e camadas

A forma como isto está organizado pode parecer confusa no início. Há um painel principal do AMP que gere várias instâncias. Cada instância representa um servidor ou mundo específico, e por baixo cada uma corre isolada em Docker.

```text title="modelo mental"
VM Debian
  -> AMP
       -> Instância 1
            -> Container Docker
       -> Instância 2
            -> Container Docker
       -> Instância 3
            -> Container Docker
```

Isto é bom porque separa os mundos. Cada servidor pode ter a sua versão, mods e configuração. Mas também significa que quando algo corre mal, é preciso perceber em que camada o problema está.

:::image-placeholder title="Painel de instâncias do AMP" desc="Screenshot do AMP com nomes dos mundos e utilizadores ocultados." ratio="16:9"
:::

## Updates: o inimigo natural da paz

Minecraft tem uma relação complicada com versões. O cliente muda, o servidor muda, os mods mudam, os plugins mudam e a autenticação também pode começar a implicar com versões antigas.

Na prática, há alturas em que o update deixa de ser opcional. Se os amigos querem entrar e o cliente já não se entende com o servidor, tenho de atualizar.

O processo real que uso é este:

```bash title="update do AMP"
getamp update
su -l amp
ampinstmgr upgradeall
```

Depois uso `Ctrl + D` para sair do utilizador `amp`.

O primeiro comando atualiza o script de instalação do AMP. O segundo muda para o utilizador do sistema onde o AMP está instalado. O terceiro atualiza as instâncias e componentes.

:::warning title="Faz backups antes de atualizar"
Especialmente em servidores com mods, nunca assumas que um update vai correr bem. Um backup antes de mexer pode salvar horas de frustração.
:::

## Quando só querias jogar

A parte mais cómica é que estes problemas quase sempre aparecem na pior altura. Uma pessoa chega a casa, quer jogar uma hora para descomprimir, abre o launcher e percebe que há updates para fazer.

Dez minutos depois, o servidor mostra `critical error`.

Mais dez minutos e aparece qualquer coisa como `cannot connect to the docker container`.

E de repente a sessão de Minecraft virou administração de sistemas.

## O lado bom

Apesar disso tudo, continuo a achar que vale muito a pena. Ter controlo total sobre os mundos é excelente. Posso criar servidores para amigos, dar permissões específicas, separar instâncias e deixar cada pessoa mexer no seu espaço.

Com Tailscale, também consigo aceder à administração sem expor o painel diretamente à internet.

:::resource title="Tailscale" url="https://tailscale.com/docs"
Uso Tailscale para acesso privado aos serviços do homelab, incluindo painéis administrativos.
:::

:::warning title="Não publiques painéis administrativos na internet sem proteção"
Se precisas de aceder ao AMP fora de casa, usa uma abordagem segura. Abrir portas no router para painéis internos pode dar problemas sérios.
:::

## O que isto me ensinou

O servidor de Minecraft acabou por ser uma desculpa perfeita para aprender coisas mais sérias: Linux, Docker, permissões, updates, rede, backups e troubleshooting.

No fim, eu queria jogar Minecraft com amigos. Acabei a aprender administração de sistemas porque os mods decidiram que era esse o caminho.
