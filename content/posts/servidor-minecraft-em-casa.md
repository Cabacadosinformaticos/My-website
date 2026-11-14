---
title: Ter um servidor de Minecraft em casa é mais trabalhoso do que parece
desc: Entre AMP, mods, Docker, updates e amigos à espera, montar um servidor de Minecraft próprio acabou por ser uma escola de administração de sistemas.
category: [Minecraft, Homelab, Servidores]
date: Jun 2026
readTime: 13 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654845/cabacatech/2026-11/covers/posts/servidor-minecraft-em-casa-4520358e6d.webp
series: Diário do Homelab
seriesPart: 2
related: [post:o-lado-menos-glamoroso-do-homelab, project:homelab-proxmox-servidorzinho, post:dns-em-casa-com-adguard-home]
---

Uma das grandes razões para eu querer um servidor em casa era Minecraft. Eu queria ter mundos meus, modpacks pesados, servidores para amigos e controlo total sobre as versões e configurações.

Na minha cabeça, isto era simples: montava o servidor, criava o mundo, convidava os amigos e estava feito.

## O problema dos servidores modded

Minecraft vanilla já tem os seus detalhes, mas servidores com mods mudam completamente a conversa. Um modpack pesado não é só "Minecraft com mais coisas". É uma coleção de código de várias origens, versões e dependências, tudo a tentar correr em conjunto.

Isto cria problemas muito próprios:

- Mods que só funcionam numa versão específica.
- Clientes e servidor que precisam de estar alinhados.
- Mundo que fica preso a uma versão ou conjunto de mods.
- Mais uso de RAM.
- Arranques mais lentos.
- Mais hipóteses de conflito depois de updates.

Quando um amigo só quer entrar e jogar, nada disto interessa. Mas quando és tu que manténs o servidor, cada uma destas coisas passa a importar.

## A base técnica

O servidor corre numa VM dedicada dentro do Proxmox. Essa VM usa Debian 13.2.0-amd64 e tem recursos bastante generosos, porque pode correr várias instâncias de Minecraft ao mesmo tempo.

:::specs title="VM do Minecraft"
Sistema: Debian 13.2.0-amd64
vCPU: 10 vCores
RAM: 18 GiB
Disco: Cerca de 250 GB SSD
Gestor: AMP da CubeCoders
:::

Pode parecer muito e é. Mas muitos dos servidores que quero correr usam modpacks pesados, alguns com mais de 50 mods. Preferi dar margem à VM e depois ir ajustando se fosse preciso. Foi o que aconteceu: comecei com 20 GB e, quando a plataforma de desenvolvimento chegou ao mesmo servidor, baixei para 18 GiB e pus a VM a arrancar só depois dos serviços de infraestrutura, como o DNS. Um servidor de jogos pode esperar uns segundos; a rede da casa não.

Queria evitar que o servidor ficasse sem margem durante a geração de chunks, o arranque de modpacks ou picos com vários jogadores. Um servidor de jogo pode estar calmo 90% do tempo e mesmo assim precisar de folga nos outros 10%.

## O papel do AMP

Para gerir os servidores uso o AMP, da CubeCoders. Ele dá-me uma dashboard web onde posso criar instâncias, gerir ficheiros, mudar versões, configurar permissões e controlar recursos.

:::resource title="CubeCoders AMP" url="https://cubecoders.com/AMP"
É a ferramenta que uso para gerir várias instâncias de Minecraft sem fazer tudo à mão.
:::

O AMP é uma daquelas ferramentas que, quando funciona bem, parece magia. Crio uma instância, entro no painel, configuro a versão, mexo nos ficheiros e sigo a vida.

O problema é quando não funciona bem. Aí começa a parte divertida, ou irritante, dependendo da hora.

Mesmo assim, prefiro isto a gerir tudo à mão. O AMP dá-me uma forma visual de separar servidores, controlar recursos e dar acesso a outras pessoas sem lhes entregar a VM inteira.

## Instâncias, containers e camadas

A forma como isto está organizado pode parecer confusa no início. Há um painel principal do AMP que gere várias instâncias. Cada instância representa um servidor ou mundo específico e por baixo cada uma corre isolada em Docker.

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

![Painel de instâncias do AMP, com uma instância de Minecraft por servidor. Os nomes estão tapados.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794696639/cabacatech/2026-11/screenshots/homelab/amp-instances-14c010d95f.webp)

## O que pode correr mal

Quando uma instância não arranca, a causa pode estar em vários sítios:

| Sintoma | Possível causa |
|---|---|
| Servidor não aparece online | Instância parada, porta errada ou container em erro |
| Erro ao ligar ao container | Problema no Docker ou na instância do AMP |
| Crash durante arranque | Mod incompatível, falta de RAM ou ficheiro corrompido |
| Jogadores não conseguem entrar | Versão do cliente diferente ou autenticação |
| Lag forte | CPU, RAM, geração de chunks ou modpack pesado |

Isto ensinou-me a não assumir logo que "o servidor está partido". Às vezes é só um mod, outras vezes uma atualização a meio.

## Atualizar o AMP

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

## A rotina que quero melhorar

O ideal, antes de qualquer update grande, seria ter uma rotina mais disciplinada:

1. Avisar quem usa o servidor.
2. Fazer backup do mundo.
3. Confirmar espaço livre na VM.
4. Atualizar AMP e instâncias.
5. Testar uma instância de cada vez.
6. Confirmar logs antes de dizer que está tudo pronto.

Ainda não trato isto como um serviço profissional, mas quanto mais pessoas dependem do servidor, mais sentido faz ter um processo previsível.

## Quando só querias jogar

A parte mais cómica é que estes problemas quase sempre aparecem na pior altura. Uma pessoa chega a casa, quer jogar uma hora para descomprimir, abre o launcher e percebe que há updates para fazer.

Dez minutos depois, o servidor mostra `critical error`.

Mais dez minutos e aparece qualquer coisa como `cannot connect to the docker container`.

E de repente a sessão de Minecraft virou administração de sistemas.

É frustrante, mas também é exatamente o tipo de problema que ensina. Não há teoria que substitua aquela sensação de ter três pessoas à espera e uma mensagem de erro que não explica nada.

## O lado bom

Ter controlo total sobre os mundos é excelente. Posso criar servidores para amigos, dar permissões específicas, separar instâncias e deixar cada pessoa mexer no seu espaço.

Com Tailscale, também consigo aceder à administração sem expor o painel diretamente à internet. Explico isso na [parte 1](blog-post.html?id=como-comecei-o-meu-homelab).

## Porque continuo a preferir isto

Podia pagar por hosting de Minecraft. Provavelmente dava menos trabalho. Mas também aprendia muito menos.

Com isto, controlo a máquina, a VM, o painel, os backups, as permissões e a rede. Quando algo falha, sou obrigado a perceber onde falhou. E quando funciona, sei exatamente o que está a acontecer por baixo.

## O que isto me ensinou

O servidor de Minecraft serviu para aprender coisas mais sérias: Linux, Docker, permissões, updates, rede, backups e troubleshooting.

No fim, eu queria jogar Minecraft com amigos. Acabei a aprender administração de sistemas porque os mods decidiram que era esse o caminho.
