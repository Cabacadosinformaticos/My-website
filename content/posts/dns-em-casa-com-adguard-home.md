---
title: DNS em casa com AdGuard Home
desc: Como pus toda a rede de casa a resolver nomes através de um container de 1 GB, o que isso bloqueia, o que não bloqueia, e o dia em que um limite escondido começou a deitar pedidos fora em silêncio.
category: [Homelab, Redes, Segurança]
date: Jul 2026
readTime: 11 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513981/cabacatech/2026-11/covers/posts/dns-em-casa-com-adguard-home-593cd0367e.webp
series: Diário do Homelab
seriesPart: 3
related: [project:homelab-proxmox-servidorzinho, post:o-lado-menos-glamoroso-do-homelab, post:servidor-minecraft-em-casa]
---

O AdGuard Home é o serviço mais pequeno do meu homelab e um dos que tem mais impacto. Corre num container LXC com 1 GB de RAM e 8 GB de disco, e todos os dispositivos da casa lhe perguntam onde fica cada domínio antes de abrirem o que quer que seja. Se o domínio estiver numa lista de bloqueio, a resposta é "não existe".

:::image-placeholder title="Dashboard do AdGuard Home" desc="Screenshot da dashboard com estatísticas gerais, sem clientes, IPs nem domínios pessoais." ratio="16:9"
:::

## Como funciona um bloqueador de DNS

Antes de abrir uma página, o dispositivo tem de transformar um nome (`exemplo.com`) num endereço IP. Esse pedido vai para um servidor DNS. Na maioria das casas é o do router ou o da operadora. Na minha, é o AdGuard Home.

```text title="o caminho de um pedido"
Dispositivo na rede
  -> o router diz-lhe que o DNS é o AdGuard Home
       -> o AdGuard Home recebe o pedido
            -> verifica listas, regras e exceções
                 -> bloqueia, ou pergunta a um DNS externo e devolve a resposta
```

O AdGuard Home não vê nem filtra o tráfego. Filtra nomes. Um domínio bloqueado deixa de existir para a rede, e qualquer anúncio, script de tracking ou página de phishing alojado nesse domínio deixa de carregar.

:::compare left="O que um DNS local faz" right="O que não faz"
- Bloqueia domínios de tracking, telemetria, malware e phishing
- Protege dispositivos onde não dá para instalar extensões: TVs, consolas, telemóveis
- Mostra que dispositivos fazem mais pedidos, e a quê
- Uma configuração para a casa toda
|||
- Não remove anúncios servidos pelo mesmo domínio do conteúdo
- Não vê dentro do HTTPS
- Não substitui um bloqueador no browser
- Pode ser contornado por apps que usam o seu próprio DNS
:::

:::tip title="DNS não é firewall"
Bloquear por DNS é uma camada útil. Não substitui uma firewall, atualizações, boas permissões ou cuidado com o que se executa.
:::

## Porque um LXC e não uma VM

O AdGuard Home faz uma coisa só e gasta muito pouco. Um container LXC partilha o kernel do Proxmox, arranca em segundos e ocupa uma fração de uma VM. Fica separado do host, com IP próprio, sem estar instalado diretamente no Proxmox.

| Vantagem | Impacto |
|---|---|
| Pouco overhead | 1 GB de RAM chega com folga |
| Arranque rápido | Volta em segundos depois de um reboot |
| IP próprio | Fácil de apontar no router |
| Separado do host | O Proxmox não depende dele |

Por ser crítico para a rede, configurei-o para ser o primeiro serviço a arrancar quando o servidor liga.

## A instalação

Usei os Proxmox VE Helper-Scripts, um projeto comunitário que cria containers já configurados para serviços populares:

```bash title="instalação"
var_ram="1024" var_disk="8" bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/adguard.sh)"
```

As variáveis definem 1 GB de RAM e 8 GB de disco para o container.

:::danger title="Lê o script antes de o correr"
Um comando que descarrega um script e o passa diretamente ao `bash` pode fazer tudo no sistema onde corre. Estes scripts são úteis e poupam tempo, mas abro sempre o ficheiro antes de o executar.
:::

:::resource title="Proxmox VE Helper-Scripts" url="https://community-scripts.org/"
Scripts comunitários para instalar serviços comuns em Proxmox.
:::

## Apontar a rede para ele

Instalar foi a parte fácil. A parte sensível foi pôr a casa toda a depender dele.

1. Testar primeiro num só dispositivo, com o DNS configurado à mão.
2. Reservar o IP do container no router, para que nunca mude.
3. Mudar o DNS que o router entrega aos clientes para esse IP.
4. Confirmar no registo de pedidos do AdGuard que os dispositivos estavam a chegar.

Alguns dispositivos mudam logo. Outros só quando renovam o lease DHCP, quando voltam a ligar ao Wi-Fi ou quando o router reinicia.

:::warning title="O DNS passa a ser um ponto único de falha"
Se o container estiver desligado ou mudar de IP, a rede deixa de resolver nomes. A ligação à Internet está boa, mas nada abre. É das falhas mais confusas de diagnosticar, porque parece que a Internet caiu.
:::

## O servidor não depende do DNS que serve

Há uma armadilha aqui. Se o próprio Proxmox usar o AdGuard Home como DNS, e o AdGuard Home for um container desse Proxmox, o servidor fica dependente de um serviço que só existe depois de ele arrancar. Configurei o host com DNS externo próprio e testei com o container desligado: o servidor continua a resolver nomes e a atualizar-se normalmente.

## As listas que uso

Comecei com poucas listas, de propósito. Ativar todas as listas que existem parece mais seguro e acaba em sites partidos todos os dias.

| Lista | Para quê |
|---|---|
| AdGuard DNS Filter | Base geral |
| OISD Blocklist Big | Lista ampla, com cuidado em evitar falsos positivos |
| Dandelion Sprout's Anti-Malware List | Malware |
| Phishing URL Blocklist | Phishing |

A AdAway Default Blocklist ficou desligada, para testar mais tarde se fizer falta.

:::details title="Como trato um falso positivo"
Quando uma app ou um site deixa de funcionar:

1. Vejo que dispositivo teve o problema e a que horas.
2. Abro o registo de pedidos e filtro por esse dispositivo e esse momento.
3. Encontro o domínio bloqueado e a lista que o bloqueou.
4. Crio uma exceção só para esse domínio, e só se fizer sentido.

A tentação é permitir tudo o que aparece no registo até a app funcionar. Isso desfaz o trabalho das listas. Uma exceção por domínio, depois de perceber para que serve, é mais lento e muito mais limpo.
:::

## Atualização de outubro: o limite que deitava pedidos fora

Depois de publicar este post, durante semanas, de vez em quando, uma página demorava a abrir sem razão aparente. Nada de grave, o tipo de coisa que se atribui ao Wi-Fi.

A 5 de outubro fiz um teste com 100 pedidos seguidos e só 95 tiveram resposta. A causa era uma opção por defeito do AdGuard Home: um limite de 20 pedidos por segundo por cliente. O problema é que o limite contava a sub-rede inteira como um só cliente. Toda a casa partilhava os mesmos 20 pedidos por segundo, e os que passavam o limite eram deitados fora sem erro nenhum. Uma página moderna faz dezenas de pedidos DNS ao abrir; com vários dispositivos ativos, o limite chegava depressa.

Desliguei o limite (numa rede de casa, atrás do router, não protege de nada), configurei dois servidores externos por DNS over HTTPS e um DNS normal de recurso. O mesmo teste com 200 pedidos deu 200 respostas.

:::stats
95/100 | Respostas antes
200/200 | Respostas depois
1 GB | RAM do container
:::

A lição é a mesma que aparece em quase tudo no homelab: os valores por defeito foram pensados para outro cenário. Vale a pena saber o que cada um faz antes de confiar nele.

## Plano de recuperação

Quando o DNS falha, procurar a solução na Internet fica difícil, porque a Internet parece avariada. Por isso o básico está escrito antes de ser preciso:

- O DNS original do router, para voltar atrás em segundos.
- Como entrar no router sem depender de DNS.
- O IP do AdGuard Home e onde está reservado.
- Como desligar a filtragem temporariamente.
- Uma exportação da configuração.

## O resultado

O impacto é discreto, que é exatamente o objetivo. Um serviço de DNS que chama a atenção é um serviço com problemas. Este instala-se numa tarde, gasta quase nada, protege todos os dispositivos da casa, e ensina mais sobre redes do que qualquer outro serviço do homelab.
