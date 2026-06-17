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

## Arquitetura do serviço

O AdGuard Home está numa posição pequena mas crítica: fica entre os dispositivos da rede e os servidores DNS externos. Sempre que um dispositivo precisa de transformar um domínio num IP, o pedido passa por ele.

```text title="fluxo DNS"
Dispositivo na rede
  -> Router entrega DNS do AdGuard Home
       -> AdGuard Home recebe a query
            -> Verifica listas, regras e exceções
                 -> Bloqueia ou encaminha para upstream DNS
```

Isto significa que o AdGuard Home não bloqueia tráfego por magia. Ele bloqueia resolução de nomes. Se um domínio estiver numa lista de bloqueio, o cliente deixa de conseguir resolver esse domínio normalmente.

:::tip title="DNS não é firewall"
Bloqueio por DNS é útil, mas não substitui firewall, boas permissões, atualizações ou cuidado ao executar ficheiros. É uma camada, não a defesa inteira.
:::

## Porque usar DNS local

Bloqueadores como uBlock Origin continuam a ser excelentes no browser, mas atuam sobretudo no dispositivo e no navegador onde estão instalados. Um DNS local atua antes disso: quando um dispositivo tenta resolver um domínio, o AdGuard Home pode bloquear o pedido.

Isto não substitui boas práticas de segurança, nem substitui um bloqueador no browser. É mais uma camada.

:::resource title="AdGuard Home" url="https://adguard.com/en/adguard-home/overview.html"
Serviço que uso para bloquear domínios indesejados ao nível do DNS na rede doméstica.
:::

## O que o DNS local consegue fazer

Usar DNS local dá controlo centralizado. Em vez de configurar cada dispositivo individualmente, configuro a rede para usar o AdGuard Home.

Na prática, isto permite:

- Bloquear domínios de tracking antes de chegarem ao browser.
- Aplicar algumas proteções a telemóveis, TVs, consolas e dispositivos onde não instalo extensões.
- Ver que dispositivos fazem mais queries.
- Criar exceções para domínios que não quero bloquear.
- Ter uma visão geral do ruído que existe numa rede doméstica.

Mas também tem limites:

- Não remove todos os anúncios, especialmente os servidos pelo mesmo domínio do conteúdo.
- Não vê conteúdo dentro de HTTPS.
- Não substitui uBlock Origin no browser.
- Pode gerar falsos positivos.
- Pode ser contornado por dispositivos que usem DNS próprio ou DNS over HTTPS.

:::decision title="Decisão técnica: começar conservador"
Preferi começar com poucas listas e observar o comportamento da rede. É melhor bloquear menos e ajustar do que partir sites todos os dias com uma configuração demasiado agressiva.
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

## Porque LXC e não VM

O AdGuard Home é um bom candidato a LXC porque é leve e tem uma função muito específica. Não precisa de uma VM completa para correr bem.

Vantagens neste caso:

| Vantagem | Impacto |
|---|---|
| Menos overhead | Usa poucos recursos do host |
| Arranque rápido | Recupera depressa depois de reiniciar |
| IP próprio | Fácil apontar o router para ele |
| Separação do host | Não fica instalado diretamente no Proxmox |
| Backup simples | O container é pequeno |

A desvantagem é que, por ser um serviço crítico para a rede, não basta ser leve. Tem de ser previsível. Se o LXC estiver desligado ou se o IP mudar, a rede perde resolução de nomes.

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

## DHCP, IP fixo e propagação

O ponto mais importante foi garantir que o AdGuard Home mantém sempre o mesmo IP. Se o router distribuir outro IP ao LXC, todos os clientes continuam a apontar para o endereço antigo e a resolução de nomes falha.

O que fiz foi reservar o IP no router. Isto normalmente chama-se DHCP reservation, reserva de IP ou IP fixo por dispositivo. A ideia é associar o endereço MAC daquele LXC ou interface ao mesmo IP.

Depois disso, o router passa a entregar esse IP como DNS aos clientes da rede. Alguns dispositivos apanham a mudança rapidamente. Outros só atualizam quando renovam o lease DHCP, quando reiniciam a ligação Wi-Fi ou quando o router reinicia.

```text title="configuração conceptual"
Router
  -> Reserva IP do AdGuard Home
  -> Entrega esse IP como DNS aos clientes
  -> Clientes usam AdGuard para resolver domínios
```

:::tip title="Teste antes de aplicar à rede toda"
Antes de mudar o DNS no router, testa manualmente num computador ou telemóvel. Assim confirmas que o AdGuard Home resolve domínios e bloqueia o que esperas.
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

## Como escolhi as listas

Não quis ativar todas as listas possíveis. Isso parece forte, mas pode criar muitos overlaps e falsos positivos. O meu objetivo inicial foi cobrir quatro áreas:

1. Bloqueio geral.
2. Tracking e telemetry.
3. Malware.
4. Phishing.

OISD Blocklist Big entrou porque costuma ser uma lista abrangente e com preocupação em reduzir falsos positivos. Dandelion Sprout entra mais focada em malware. Phishing URL Blocklist cobre um risco específico. AdGuard DNS Filter serve como base geral.

AdAway ficou desativada porque não queria começar logo com demasiadas listas sobrepostas. Se sentir que está a faltar bloqueio, posso testar mais tarde.

## Regras, exceções e falsos positivos

Uma parte importante de qualquer bloqueador DNS é aceitar que vai haver falsos positivos. Um domínio pode ser usado para tracking e, ao mesmo tempo, ser necessário para uma funcionalidade legítima de uma app.

Quando algo parte, a análise que faço é:

1. Ver que dispositivo teve problema.
2. Abrir o query log do AdGuard Home.
3. Filtrar pelo horário do problema.
4. Ver que domínio foi bloqueado.
5. Confirmar que lista ou regra bloqueou.
6. Criar exceção só se fizer sentido.

:::warning title="Não cries exceções às cegas"
Se uma app falha, a solução rápida é permitir tudo o que apareceu no log. A solução correta é perceber qual domínio é realmente necessário e permitir só esse.
:::

## O que bloqueio e o que não bloqueio

O meu objetivo principal é bloquear telemetry, malware, phishing e tracking abusivo. Também quero reduzir anúncios sempre que possível, porque detesto abrir um artigo, vídeo ou página e ter a experiência interrompida por popups e anúncios intrusivos.

Ao mesmo tempo, não quero uma configuração tão agressiva que comece a partir sites normais. Por isso comecei com poucas listas e vou ajustando conforme o comportamento da rede.

## Operação diária

Depois de configurado, o AdGuard Home é daqueles serviços que idealmente desaparecem. Se estiver sempre a chamar atenção, alguma coisa está mal.

Mesmo assim, há tarefas que quero manter:

| Tarefa | Frequência | Motivo |
|---|---|---|
| Ver query log | Quando algo falha | Encontrar falsos positivos |
| Rever listas | Ocasionalmente | Remover listas problemáticas |
| Confirmar updates | Ocasionalmente | Manter o serviço atualizado |
| Ver top clients | Ocasionalmente | Detetar dispositivos demasiado ruidosos |
| Exportar configuração | Depois de alterações grandes | Facilitar recuperação |

Também é um bom serviço para aprender sobre a própria rede. Há dispositivos que fazem muito mais pedidos do que eu esperava. TVs, apps móveis e alguns serviços de sistema conseguem ser bastante barulhentos.

## Plano de recuperação

Como o DNS fica crítico, preciso de uma forma simples de recuperar se algo falhar. O plano mínimo é:

1. Saber qual era o DNS original do router ou da operadora.
2. Conseguir entrar no router sem depender de DNS externo.
3. Ter o IP do AdGuard Home documentado.
4. Saber desligar temporariamente o bloqueio.
5. Ter uma exportação da configuração do AdGuard Home.

:::danger title="Documenta antes de partir"
Quando o DNS falha, pesquisar a solução fica mais difícil porque a própria internet parece avariada. O básico tem de estar documentado antes.
:::

## O resultado

O impacto é discreto, que é exatamente o que quero. O serviço corre com poucos recursos, fica sempre em segundo plano e protege todos os dispositivos que usam o DNS da rede.

Para mim, este é um dos melhores exemplos de um serviço de homelab pequeno mas útil: instala-se rápido, ensina conceitos importantes de rede e melhora a experiência de uso da casa toda.
