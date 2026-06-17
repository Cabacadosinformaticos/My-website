---
title: Servidorzinho
desc: Homelab em Proxmox montado num Minisforum MS-A1 para correr Minecraft, serviços internos, DNS local e acesso remoto privado.
category: [Homelab, Proxmox, Servidores]
year: 2026
type: Pessoal
duration: Em evolução
status: Em desenvolvimento
stack: [Proxmox VE, Debian, AMP, Docker, Tailscale, AdGuard Home]
cover: ""
---

O Servidorzinho é o meu servidor principal em casa. Começou como uma vontade antiga de explorar virtualização a sério e de ter finalmente um servidor de Minecraft meu, com recursos suficientes para não estar sempre a bater em limites.

A base é um Minisforum MS-A1 comprado em segunda mão, num achado improvável no OLX. A ideia inicial era simples: ter uma máquina pequena, potente e relativamente económica, capaz de correr várias experiências sem eu ficar imediatamente preso por CPU, RAM ou storage.

:::image-placeholder title="Foto do Servidorzinho" desc="Foto real do Minisforum MS-A1 no local onde está instalado, sem dados sensíveis visíveis." ratio="16:9"
:::

:::specs title="Hardware do Servidorzinho"
Máquina: Minisforum MS-A1
CPU: AMD Ryzen 9 7900
RAM: 64 GB DDR4
Storage: WD Black SN850X 2 TB M.2 2280 PCIe Gen4 NVMe
Hypervisor: Proxmox VE 9.2.3
Função principal: Servidor de Minecraft e serviços internos
:::

## A escolha do hardware

O MS-A1 não era a opção mais barata. Pelo contrário, era uma das máquinas que eu olhava com vontade mas sem grande intenção de comprar nova. Isso mudou quando apareceu uma unidade no OLX com um preço muito abaixo do normal e já com 64 GB de RAM.

Depois disso, escolhi componentes com uma mentalidade um bocado exagerada: queria garantir que não me faltava processador, memória nem espaço. Olhando agora, foi uma decisão pouco eficiente em alguns pontos. Até agora, com tudo o que tenho a correr, raramente vejo o processador a ser realmente puxado.

Ainda assim, não me arrependo. A máquina é compacta, tem imensa margem para crescer e consome pouco para o hardware que tem lá dentro.

:::decision title="Decisão técnica: comprar margem em vez de otimizar ao máximo"
Escolhi uma máquina mais forte do que precisava no momento porque queria liberdade para experimentar. A desvantagem é óbvia: paguei por recursos que ainda não uso totalmente. A vantagem é que posso criar VMs, LXCs e serviços sem redesenhar a infraestrutura a cada nova ideia.
:::

## Proxmox como base

Cada servidor do meu homelab corre Proxmox. No Servidorzinho, o Proxmox é a camada que me permite separar serviços, testar coisas sem destruir o resto e gerir tudo através de uma dashboard web.

Gosto especialmente desta separação: o servidor físico é estável, mas por cima dele posso criar VMs e LXCs com funções diferentes. Se uma experiência correr mal, apago ou restauro aquela parte, sem comprometer tudo.

:::resource title="Proxmox VE" url="https://www.proxmox.com/en/products/proxmox-virtual-environment/overview"
O Proxmox VE é a base de virtualização que uso nos dois servidores. É onde giro VMs, LXCs, storage e recursos.
:::

:::image-placeholder title="Dashboard do Proxmox" desc="Screenshot do Proxmox com IPs, nomes internos e dados sensíveis borrados." ratio="16:9"
:::

## Arquitetura geral

O objetivo desta máquina não é correr tudo diretamente no host. O Proxmox fica o mais limpo possível e cada serviço vive numa camada própria. Isto dá mais trabalho no início, mas compensa quando é preciso atualizar, reiniciar, isolar problemas ou remover uma experiência que correu mal.

O desenho atual é este:

```text title="visão lógica"
Minisforum MS-A1
  -> Proxmox VE 9.2.3
       -> VM Debian 13.2.0-amd64
            -> AMP
            -> Instâncias de Minecraft em containers Docker
       -> LXC AdGuard Home
            -> DNS local
            -> Listas de bloqueio
       -> Tailscale no host e em serviços selecionados
            -> Acesso privado a dashboards
```

A regra que tento seguir é simples: serviços com estado, ficheiros próprios ou requisitos mais chatos ficam isolados. Serviços pequenos e leves, como o AdGuard Home, fazem sentido em LXC. Serviços que precisam de um sistema mais completo, ou onde quero menos limitações, ficam em VM.

:::tip title="Regra prática"
Uso LXC quando quero leveza e controlo simples. Uso VM quando quero isolamento mais forte, compatibilidade mais previsível ou quando o serviço vai gerir outros processos por baixo.
:::

## Rede e acesso administrativo

O Proxmox expõe uma dashboard web, o AMP expõe outra dashboard e o AdGuard Home também tem a sua própria interface. Isto é confortável, mas também significa que há vários pontos administrativos dentro da rede.

Por isso, a lógica é separar acesso interno de acesso externo:

| Área | Como acedo | Exposição |
|---|---|---|
| Proxmox | Browser pela rede local ou Tailscale | Não fica aberto à internet |
| AMP | Browser pela rede local ou Tailscale | Não fica aberto à internet |
| AdGuard Home | Rede local | Usado como DNS interno |
| Minecraft | Acesso controlado conforme a instância | Separado da administração |

A parte importante é esta: jogar e administrar são coisas diferentes. Um servidor de jogo pode precisar de estar acessível a outras pessoas, mas isso não implica que o painel de administração também deva estar.

## A VM do Minecraft

O serviço principal deste servidor é uma VM Linux dedicada ao Minecraft. A VM corre Debian 13.2.0-amd64 e tem recursos generosos porque suporta várias instâncias ao mesmo tempo, muitas delas com mais de 50 mods.

:::specs title="VM do AMP"
Sistema: Debian 13.2.0-amd64
vCPU: 10 vCores
RAM: 20 GB
Disco: Cerca de 250 GB SSD
Função: Servidor de Minecraft com múltiplas instâncias
Gestor: AMP da CubeCoders
:::

A VM é só a base. O que realmente faz a gestão dos mundos, ficheiros, versões, permissões e recursos é o AMP, da CubeCoders.

:::resource title="CubeCoders AMP" url="https://cubecoders.com/AMP"
Uso o AMP para gerir as instâncias de Minecraft, permissões, ficheiros e recursos através de uma interface web.
:::

## Porque escolhi VM para o AMP

O AMP podia teoricamente viver de várias formas, mas optei por uma VM Debian dedicada por três razões:

1. **Isolamento operacional:** se o AMP ficar num estado estranho, reinicio a VM sem tocar no resto do host.
2. **Compatibilidade:** como o AMP gere instâncias, containers e ficheiros, prefiro dar-lhe um sistema Linux completo e previsível.
3. **Backups e migração:** uma VM é mais fácil de tratar como unidade lógica quando quero snapshot, backup ou mover para outro host no futuro.

Os 10 vCores e 20 GB de RAM são mais do que o consumo médio precisa, mas fazem sentido para picos. Servidores modded podem ter comportamento irregular: carregamento inicial pesado, geração de chunks, muitos mods a inicializar e jogadores a explorar zonas novas ao mesmo tempo.

:::decision title="Decisão técnica: alocar para picos, não para média"
O consumo médio parece baixo, mas o que estraga a experiência de jogo são picos. Preferi dar margem à VM para evitar lag quando várias instâncias ou modpacks pesados acordam ao mesmo tempo.
:::

## Como o AMP organiza os servidores

O AMP funciona como um painel principal que gere várias instâncias. Cada mundo ou servidor criado passa a ter a sua própria área de gestão, e por baixo cada instância corre isolada em Docker.

O modelo mental é este:

```text title="estrutura simplificada"
Painel principal do AMP
  -> Instância de Minecraft 1
       -> Container Docker
       -> Mundo, mods, versão e configuração própria
  -> Instância de Minecraft 2
       -> Container Docker
       -> Mundo, mods, versão e configuração própria
```

Visualmente, o painel é bastante intuitivo. O problema aparece mais quando é preciso ir ao terminal da VM para updates ou resolução de problemas.

:::image-placeholder title="Painel do AMP" desc="Screenshot do painel principal do AMP, com nomes dos servidores e utilizadores ocultados." ratio="16:9"
:::

## Modelo de permissões no AMP

Uma das vantagens do AMP é conseguir separar administração global de administração por instância. Isto é útil quando quero dar acesso a um amigo para gerir o próprio servidor sem lhe dar controlo sobre tudo.

O modelo que faz sentido para mim é:

| Perfil | Acesso | Uso |
|---|---|---|
| Admin global | Painel principal e todas as instâncias | Só eu |
| Gestor de instância | Uma instância específica | Amigo que gere um mundo |
| Jogador | Acesso ao jogo, sem painel | Utilizadores normais |

Esta separação é importante porque evita uma coisa clássica em homelabs: resolver comodidade com permissões demasiado largas. É muito fácil dar acesso a mais do que é preciso só para despachar. Depois, quando algo corre mal, torna-se difícil perceber o impacto.

## Backups dos mundos

Os mundos de Minecraft são a parte mais valiosa deste serviço. O AMP e a VM podem ser reinstalados, mas um mundo com horas de jogo não aparece outra vez do nada.

Neste tipo de setup, penso nos dados por prioridade:

1. **Mundos e saves:** prioridade máxima.
2. **Configurações de instâncias:** importante para recuperar depressa.
3. **Mods e plugins:** importante, mas normalmente recuperável.
4. **Sistema base:** recuperável a partir de instalação limpa e documentação.

:::warning title="Backup não é só cópia"
Um backup só é útil se souberes restaurá-lo. Para este tipo de serviço, o teste real é conseguir recuperar uma instância e abrir o mundo depois.
:::

## O lado chato dos updates

Os updates são a parte menos divertida deste setup. Como o Minecraft depende das versões do cliente, servidor, mods, plugins e autenticação, há alturas em que atualizar deixa de ser opcional. Quando o cliente atualiza ou quando a autenticação começa a implicar com versões antigas, é preciso atualizar tudo.

O fluxo que uso para atualizar o AMP é este:

```bash title="update do AMP"
getamp update
su -l amp
ampinstmgr upgradeall
```

Depois de correr o upgrade, uso `Ctrl + D` para sair do utilizador `amp`.

Na prática, o comando pode correr bem e ficar tudo impecável. Mas também pode acabar com uma ou mais instâncias a mostrar erros como `critical error` ou `cannot connect to the docker container`.

:::warning title="Atenção nos updates"
Antes de atualizar o AMP ou instâncias com mods, faz backup dos mundos. O update pode correr bem, mas quando falha normalmente falha na pior altura: quando alguém só queria jogar.
:::

## Checklist de troubleshooting

Quando uma instância falha depois de um update, tento não saltar logo para soluções aleatórias. O caminho que sigo é mais ou menos este:

1. Confirmar se o painel principal do AMP está funcional.
2. Confirmar se a VM Debian tem rede e espaço em disco.
3. Ver se a instância aparece como ativa, parada ou em erro.
4. Ler os logs da instância antes de reiniciar tudo.
5. Confirmar se o erro vem do Minecraft, de mods, do container ou do AMP.
6. Testar uma instância simples sem mods para separar problema da plataforma e problema do modpack.
7. Só depois mexer em updates, reinstalações ou restauração de backup.

Os erros mais chatos são os que parecem iguais por fora mas têm causas diferentes. `cannot connect to the docker container` pode apontar para uma falha no container, para uma instância que não subiu bem, para permissões ou para algo partido durante o update.

:::tip title="Não reinicies tudo como primeiro passo"
Reiniciar pode resolver sintomas, mas também apaga pistas. Logs antes, restart depois.
:::

## Acesso remoto sem abrir portas

Uma parte importante deste homelab é não expor painéis administrativos diretamente à internet. O Proxmox, o AMP e outros serviços são interfaces web muito úteis, mas não quero andar a abrir portas no router para chegar a eles.

Para resolver isso uso Tailscale. Com Tailscale consigo aceder aos meus servidores fora de casa através de uma rede privada, sem depender de port forwarding para painéis administrativos.

Também uso Tailscale em vários níveis: diretamente no Proxmox, nos serviços onde faz sentido e em alguns acessos partilhados. Como o AMP permite criar perfis de utilizador, consigo dar acesso limitado a um amigo para gerir o próprio servidor sem lhe abrir a minha rede toda.

:::resource title="Tailscale" url="https://tailscale.com/docs"
Uso Tailscale para acesso privado aos serviços do homelab sem expor dashboards diretamente na internet.
:::

:::warning title="Não exponhas painéis administrativos sem pensar"
Abrir portas para dashboards como Proxmox, AMP ou outros painéis internos pode criar riscos sérios. Se o objetivo é administração remota, uma VPN ou rede privada é normalmente uma opção mais limpa.
:::

## Onde entra o Tailscale

Uso Tailscale como uma camada privada por cima da rede normal. A vantagem principal não é só "aceder de fora". É conseguir controlar quem chega a quê sem transformar o router no centro de todas as regras.

O padrão que quero manter é:

- O host Proxmox acessível por mim via Tailscale.
- Serviços administrativos acessíveis por mim via Tailscale.
- Acesso partilhado apenas quando há um motivo claro.
- Contas e permissões separadas no serviço final, como no AMP.

Mesmo com Tailscale, continuo a tratar cada painel como algo sensível. Ter uma rede privada não torna um painel automaticamente seguro. Só reduz a exposição.

## DNS local com AdGuard Home

Além da VM do Minecraft, o Servidorzinho também corre um LXC com AdGuard Home. Uso-o como DNS local para bloquear tracking, telemetry, malware, phishing e alguns anúncios antes de o tráfego sair da rede.

:::specs title="LXC do AdGuard Home"
Tipo: LXC
RAM: 1 GB
Disco: 8 GB
Função: DNS local com filtros de bloqueio
Instalação: Proxmox VE Helper-Scripts
:::

A instalação foi feita com um script da comunidade Proxmox VE Helper-Scripts. O comando que usei define RAM e disco antes de executar o script:

```bash title="instalação do AdGuard Home"
var_ram="1024" var_disk="8" bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/adguard.sh)"
```

:::danger title="Cuidado com scripts externos"
Executar scripts diretamente da internet pode ser perigoso. Antes de colar um comando destes no terminal, deves abrir o script, perceber o que ele faz e confiar na origem.
:::

:::resource title="Proxmox VE Helper-Scripts" url="https://community-scripts.org/"
Usei este projeto para criar rapidamente o LXC do AdGuard Home no Proxmox.
:::

## Porque AdGuard em LXC

O AdGuard Home é leve, tem uma função bem definida e não precisa de uma VM completa. Por isso, LXC é uma boa escolha:

- Arranca rápido.
- Consome pouca RAM.
- É simples de reiniciar.
- Fica separado do host Proxmox.
- Pode ter IP próprio na rede.

Neste caso, o LXC tem 1 GB de RAM e 8 GB de disco. Para o serviço em si, isto é confortável. O objetivo não é espremer recursos ao máximo, é ter folga suficiente para logs, listas e atualizações sem pensar muito nisso.

## Filtros que uso no AdGuard Home

Comecei com uma configuração equilibrada. O objetivo não é bloquear tudo de forma agressiva, mas criar mais uma camada contra telemetry, malware e phishing.

| Lista | Estado | Objetivo |
|---|---|---|
| AdGuard DNS Filter | Ativa | Bloqueio geral |
| OISD Blocklist Big | Ativa | Tracking, ads e domínios abusivos |
| Dandelion Sprout's Anti-Malware List | Ativa | Malware |
| Phishing URL Blocklist | Ativa | Phishing |
| AdAway Default Blocklist | Inativa | Testar mais tarde se for preciso |

:::tip title="Dica prática"
Depois de mudares o DNS no router e confirmares que está tudo correto, reiniciar o router ajuda os dispositivos da rede a apanharem a nova configuração mais depressa.
:::

:::danger title="Se configurares mal o DNS, podes ficar sem internet"
Quando o router passa a apontar para o AdGuard Home, esse serviço fica crítico. Se o IP estiver errado, se o LXC estiver desligado ou se o DNS falhar, a rede pode parecer sem internet.
:::

## Falhas que quero evitar

Este setup tem alguns pontos onde uma má decisão pode criar problemas chatos:

| Risco | Impacto | Mitigação |
|---|---|---|
| VM do AMP sem backup | Perda de mundos | Backups regulares dos saves |
| Update de modpack sem teste | Instância partida | Backup antes de atualizar |
| DNS apontado para IP errado | Rede sem resolução de nomes | IP reservado no router |
| Painel exposto à internet | Risco de segurança | Acesso via Tailscale |
| Storage cheio | Instâncias instáveis | Monitorizar espaço livre |

O que torna isto interessante é que quase nenhum problema é isolado. Um update pode parecer problema do AMP, mas afinal é falta de espaço. Um problema de acesso pode parecer firewall, mas afinal é DNS. Um erro no Minecraft pode vir de um mod e não da infraestrutura.

## O que aprendi

Este projeto ensinou-me que um homelab não é só hardware. É uma mistura de virtualização, rede, backups, permissões, updates, DNS e muita paciência.

O Servidorzinho está longe de estar "acabado", mas essa é precisamente a parte interessante. É uma plataforma onde posso experimentar, partir, corrigir e perceber melhor como os serviços que usamos todos os dias funcionam por baixo.
