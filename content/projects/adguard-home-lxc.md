---
title: AdGuard Home no Proxmox
desc: LXC leve em Proxmox para bloquear tracking, telemetry, malware, phishing e anúncios ao nível do DNS da rede doméstica.
category: [Homelab, DNS, Segurança]
year: 2026
type: Pessoal
duration: 1 dia
status: Em produção
stack: [Proxmox VE, LXC, AdGuard Home, DNS, Router]
cover: ""
---

O AdGuard Home é um dos serviços mais pequenos do meu homelab, mas também um dos que têm impacto mais direto no dia a dia. Ele funciona como DNS local da rede doméstica e bloqueia pedidos para domínios associados a tracking, telemetry, phishing, malware e alguns anúncios.

Tecnicamente, corre num LXC dentro do Proxmox. Na prática, é uma camada extra de proteção e limpeza para todos os dispositivos da casa.

:::image-placeholder title="Dashboard do AdGuard Home" desc="Screenshot da dashboard com estatísticas gerais, ocultando clientes, IPs e domínios sensíveis." ratio="16:9"
:::

:::specs title="LXC do AdGuard Home"
Host: Servidorzinho
Hypervisor: Proxmox VE 9.2.3
Tipo: LXC
RAM: 1 GB
Disco: 8 GB
Função: DNS local com filtros de bloqueio
:::

## Porque usar DNS local

Bloqueadores como uBlock Origin continuam a ser excelentes no browser, mas atuam sobretudo no dispositivo e no navegador onde estão instalados. Um DNS local atua antes disso: quando um dispositivo tenta resolver um domínio, o AdGuard Home pode bloquear o pedido.

Isto não substitui boas práticas de segurança, nem substitui um bloqueador no browser. É mais uma camada.

:::resource title="AdGuard Home" url="https://adguard.com/en/adguard-home/overview.html"
Serviço que uso para bloquear domínios indesejados ao nível do DNS na rede doméstica.
:::

## Instalação via Proxmox VE Helper-Scripts

Instalei o serviço através dos Proxmox VE Helper-Scripts, que simplificam a criação de LXCs e VMs para serviços populares.

O comando usado foi:

```bash title="instalação"
var_ram="1024" var_disk="8" bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/adguard.sh)"
```

Neste comando, `var_ram="1024"` define 1 GB de RAM e `var_disk="8"` define 8 GB de disco para o LXC.

:::danger title="Lê scripts antes de os executar"
Este método é prático, mas não deve ser usado às cegas. Um script corrido diretamente com `curl` e `bash` tem acesso ao sistema onde está a ser executado.
:::

:::resource title="Proxmox VE Helper-Scripts" url="https://community-scripts.org/"
Projeto comunitário com scripts para instalar serviços comuns em Proxmox.
:::

## Configuração no router

A parte mais sensível não foi instalar o AdGuard Home. Foi apontar a rede para ele.

O processo foi:

1. Instalar e configurar o AdGuard Home.
2. Reservar o IP do LXC no router para ele não mudar.
3. Alterar o DNS entregue pelo router para o IP do AdGuard Home.
4. Confirmar que os dispositivos estavam a usar o DNS novo.
5. Reiniciar o router depois de validar a configuração.

:::warning title="O DNS passa a ser crítico"
Se o router apontar para o IP errado, ou se o LXC estiver desligado, os dispositivos podem deixar de resolver domínios. Pode parecer que a internet caiu, mesmo que a ligação esteja funcional.
:::

## Listas de bloqueio

Comecei com uma configuração equilibrada. Queria bloquear o que me incomoda mais, sem transformar a rede num falso positivo constante.

| Lista | Estado | Motivo |
|---|---|---|
| AdGuard DNS Filter | Ativa | Base geral de bloqueio |
| OISD Blocklist Big | Ativa | Lista ampla com bom equilíbrio |
| Dandelion Sprout's Anti-Malware List | Ativa | Proteção contra malware |
| Phishing URL Blocklist | Ativa | Proteção contra phishing |
| AdAway Default Blocklist | Inativa | Reservada para testar se precisar |

:::image-placeholder title="Listas de bloqueio" desc="Screenshot da página de filtros do AdGuard Home com dados privados ocultados." ratio="16:9"
:::

## O que bloqueio e o que não bloqueio

O meu objetivo principal é bloquear telemetry, malware, phishing e tracking abusivo. Também quero reduzir anúncios sempre que possível, porque detesto abrir um artigo, vídeo ou página e ter a experiência interrompida por popups e anúncios intrusivos.

Ao mesmo tempo, não quero uma configuração tão agressiva que comece a partir sites normais. Por isso comecei com poucas listas e vou ajustando conforme o comportamento da rede.

## O resultado

O impacto é discreto, que é exatamente o que quero. O serviço corre com poucos recursos, fica sempre em segundo plano e protege todos os dispositivos que usam o DNS da rede.

Para mim, este é um dos melhores exemplos de um serviço de homelab pequeno mas útil: instala-se rápido, ensina conceitos importantes de rede e melhora a experiência de uso da casa toda.
