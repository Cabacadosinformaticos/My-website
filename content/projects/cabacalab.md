---
title: CabacaLab
desc: Uma pequena cloud privada no meu servidor de casa. Bases de dados, cache, armazenamento S3, HTTPS, deploys, monitorização e mapas, prontos a usar por qualquer projeto meu sem montar infraestrutura de novo.
category: [Homelab, Infraestrutura, DevOps]
year: 2026
type: Pessoal
duration: Set 2026, em evolução
status: Em produção
stack: [Proxmox VE, Ubuntu, Docker, Caddy, PostgreSQL, PostGIS, Redis, Garage S3, Coolify, Prometheus, Grafana, Loki, ZFS, Tailscale]
cover: ""
related: [project:homelab-proxmox-servidorzinho, post:publicar-um-site-sem-abrir-portas, project:iade-horarios, project:mafra-no-bolso]
---

Cada projeto novo pedia a mesma coisa: uma base de dados, um sítio para guardar ficheiros, HTTPS, uma forma de fazer deploy e alguma maneira de saber se está vivo. Montar isto de raiz para cada projeto é trabalho repetido e é a forma mais rápida de acabar com cinco instalações diferentes de PostgreSQL, cada uma configurada à sua maneira.

O CabacaLab é a resposta: uma plataforma que corre no [Servidorzinho](project-detail.html?id=homelab-proxmox-servidorzinho) e que oferece estes serviços a qualquer projeto. A plataforma não conhece as aplicações. Cada projeto recebe a sua base de dados, o seu utilizador, o seu bucket e o seu subdomínio, e é isso.

:::image-placeholder title="Diagrama do CabacaLab" desc="Diagrama das VMs da plataforma e dos serviços em cada uma, sem IPs nem nomes de domínio." ratio="16:9"
:::

:::stats
6 | VMs na plataforma
23 | Serviços monitorizados
2 TB | Pool ZFS dedicado
3 | Aplicações a correr
:::

## O que a plataforma oferece

| Serviço | Tecnologia | Para quê |
|---|---|---|
| Base de dados | PostgreSQL 17 com PostGIS | Uma base de dados por projeto, com consultas geográficas |
| Cache e filas | Redis 7 | Sessões, cache e filas de trabalho |
| Ficheiros | Garage 2 (compatível com S3) | Uploads e ficheiros estáticos, com a mesma API da AWS |
| HTTPS | Caddy | Certificados wildcard automáticos e reverse proxy |
| Deploys | Coolify | Um push no Git e a aplicação é reconstruída |
| Email de testes | Mailpit | Apanha todos os emails enviados em desenvolvimento |
| Mapas | OSRM e PMTiles | Cálculo de rotas e mapas vetoriais de Portugal, sem depender de APIs externas |
| Monitorização | Prometheus, Grafana, Loki, Uptime Kuma | Métricas, logs e alertas |

## A organização em VMs

Separei a plataforma por responsabilidade, em VMs diferentes, para que um problema numa não leve as outras atrás:

:::specs title="VMs do CabacaLab"
Core: Proxy, bases de dados, cache, S3, monitorização (12 GiB)
Apps: Coolify e as aplicações (8 GiB)
Stage: Cópia de testes com base de dados própria (6 GiB)
Geo: Rotas e geração de mapas (8 GiB)
Public: Uma VM isolada por cada site aberto à Internet (2 a 6 GiB)
Template: Imagem base Ubuntu 24.04 com cloud-init
:::

Todas as VMs nascem do mesmo template: Ubuntu 24.04, Docker, Tailscale e a mesma estrutura de pastas. IPs fixos definidos no cloud-init, em vez de reservas no router, para que tudo seja reproduzível a partir do repositório de infraestrutura.

## Privado por defeito

Os painéis e serviços só existem dentro da rede de casa e da minha rede privada Tailscale. O HTTPS termina no proxy, e os registos DNS apontam para endereços privados, por isso um nome de domínio público não abre caminho nenhum para quem está de fora.

Dentro da VM principal há duas redes Docker separadas: uma para o proxy e outra para os dados. Um container que não está na rede de dados não consegue sequer ver as bases de dados.

Os sites que precisam de estar na Internet ficam em VMs próprias, cada uma com um Cloudflare Tunnel e regras de firewall que a impedem de falar com o resto. Expliquei essa decisão em detalhe no post [Pôr um site na Internet sem abrir portas](blog-post.html?id=publicar-um-site-sem-abrir-portas).

## Armazenamento

A plataforma tem um disco NVMe de 2 TB só para ela, com um pool ZFS:

- compressão lz4 e `atime` desligado;
- cache do ZFS limitada a 4 GiB, para não roubar memória às VMs;
- snapshots diários dos discos das VMs, guardados durante 7 dias;
- verificação mensal da integridade dos dados (scrub);
- `pg_dump` diário das bases de dados, guardado 30 dias.

:::warning title="Um snapshot não é um backup"
Os snapshots e os dumps vivem no mesmo disco que os dados. Protegem contra um erro meu, não contra a morte do disco. A cópia para fora do servidor é o próximo passo, e é uma das razões para ter um [segundo servidor](blog-post.html?id=chega-o-bifrost).
:::

## Problemas que resolvi

:::details title="O Coolify não conseguia ligar ao serviço de tempo real"
O painel do Coolify mostrava "Cannot connect to real-time service". O Coolify usa WebSockets em portas próprias, e o Caddy só encaminhava o tráfego HTTP normal. Em vez de abrir mais portas, encaminhei os caminhos de WebSocket pelo mesmo endereço HTTPS e configurei o Coolify para usar a porta 443.
:::

:::details title="Um certificado wildcard só cobre um nível"
Um certificado `*.dominio` cobre `app.dominio`, mas não `api.app.dominio`. Descobri-o quando o subdomínio da API de um projeto deixou de ter HTTPS. A solução foi achatar os nomes: `app-api.dominio` em vez de `api.app.dominio`.
:::

:::details title="A VM dos mapas não arrancava depois de um reboot"
Testei o reboot completo do servidor de propósito, um dia depois de montar tudo. Todas as VMs voltaram menos a dos mapas, que não estava marcada para arrancar com o host. Corrigi o arranque automático e a ordem de arranque. Duas falhas de luz no fim de setembro confirmaram que o teste tinha valido a pena: tudo voltou sozinho.
:::

:::details title="Um deploy é push e pull"
Durante dois dias, a página inicial da plataforma mostrou a versão antiga. Os commits estavam feitos, mas não tinham sido enviados para o repositório, e por isso o servidor não tinha nada de novo para puxar. Desde então, um deploy só está feito quando o servidor mostra a versão nova.
:::

## O que corre lá hoje

- [IADE Horários](project-detail.html?id=iade-horarios), aberto à Internet.
- [Mafra no Bolso](project-detail.html?id=mafra-no-bolso), a API e o backoffice.
- [O site da AEIADE](project-detail.html?id=aeiade-website), em desenvolvimento.

## O que aprendi

Montar a plataforma demorou um dia. O que a torna útil é tudo o que vem depois: testar o reboot, medir o uso de memória, perceber o que fica exposto e escrever cada decisão. A memória usada no host passou de 7 GiB para 39 GiB em menos de duas semanas, à medida que as aplicações chegaram. Planear para picos e não para a média, como já tinha aprendido com o Minecraft, voltou a ser a regra certa.
