---
title: Mafra no Bolso
desc: App Android e iOS que funciona como conselheiro de visita ao concelho de Mafra. Em vez de listar tudo o que existe, responde a uma pergunta concreta - o que faço nos próximos 90 minutos, a partir daqui? Em desenvolvimento.
category: [Mobile, Backend, Geo]
year: 2026
type: Pessoal
duration: Set 2026, em evolução
status: Em desenvolvimento
stack: [Flutter, Riverpod, Laravel, PostgreSQL, PostGIS, Redis, OpenStreetMap]
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654854/cabacatech/2026-11/covers/projects/mafra-no-bolso-8f9b8d6157.webp
related: [project:cabacalab, project:homelab-proxmox-servidorzinho]
---

Quem visita Mafra costuma ir ao Palácio e à Ericeira e voltar para casa. O concelho tem muito mais do que isso, mas a informação está espalhada: os mapas mostram pontos sem organizar uma visita e o site da câmara não foi pensado para ser usado na rua, de telemóvel na mão. O Mafra no Bolso tenta resolver isso.

:::callout title="Projeto em desenvolvimento"
As fases 0 e 1 estão concluídas e a fase 2 está em curso. A app ainda não foi publicada nas lojas.
:::

:::carousel
https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514022/cabacatech/2026-11/screenshots/mafra-no-bolso/mafra-home-pt-9e5b425641.webp | Início do Mafra no Bolso, capturado no emulador Android.
https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794514023/cabacatech/2026-11/screenshots/mafra-no-bolso/mafra-detail-pt-d201c11a9b.webp | Detalhe da Basílica de Mafra na aplicação.
:::

## Um conselheiro, não um catálogo

Esta é a decisão de que tudo o resto depende. Um catálogo responde a "o que existe em Mafra?". Um conselheiro responde a "o que devo fazer agora, a partir de onde estou, com o tempo que tenho?". A primeira pergunta dá uma lista de 200 sítios. A segunda dá três sugestões e uma razão para cada uma.

:::compare left="Catálogo" right="Conselheiro"
- Lista tudo o que existe
- O utilizador filtra e decide sozinho
- Igual para toda a gente, a qualquer hora
|||
- Sugere poucas opções para aquele momento
- Explica porque sugere cada uma
- Depende de onde estás, do tempo que tens e do tempo que faz
:::

## Como as sugestões são calculadas

O motor de sugestões é determinístico: pontuações e regras explícitas, em vez de uma caixa preta. Cada recomendação mostra a razão por que aparece, por exemplo a distância, o horário de abertura ou a meteorologia. Uma sugestão em que o utilizador consegue ver a razão é uma sugestão em que pode confiar e é fácil de corrigir quando está errada.

A app pede ao servidor sugestões para a posição e o tempo disponível e o servidor cruza:

- a localização, com consultas geográficas em PostGIS;
- os horários de cada sítio;
- a previsão do IPMA (uma praia com chuva não é sugestão);
- rotas já preparadas, que o utilizador pode seguir passo a passo.

## Arquitetura

| Camada | Tecnologia | Papel |
|---|---|---|
| App | Flutter e Riverpod | Android e iOS com o mesmo código; guarda as últimas respostas para funcionar sem rede |
| API e backoffice | Laravel | Sugestões, pesquisa, rotas e a gestão de conteúdos |
| Dados | PostgreSQL com PostGIS | Locais, rotas, guias e consultas por distância |
| Cache e filas | Redis | Na plataforma do meu homelab |
| Mapa | OpenStreetMap | Mapa base, com tema claro e escuro |

Escolhi Flutter pela interface rica em mobile e Laravel porque já conhecia PHP. A API e a base de dados correm no [CabacaLab](project-detail.html?id=cabacalab), a plataforma que montei no meu servidor.

Não há contas de utilizador. As rotas ficam associadas ao dispositivo e as estatísticas de uso são agregadas por local e por dia, sem guardar dados por pessoa.

:::stats
17 | Locais com guia próprio
5 | Rotas preparadas
2 | Línguas, PT e EN
:::

## Conteúdo com cuidado

Cada local tem um guia: história, lendas, como visitar, destaques, natureza e dicas. O guia do Palácio Nacional de Mafra, por exemplo, tem 7 capítulos de história, 5 lendas e uma visita em 8 passos. As fotografias vêm da Wikimedia Commons, com os créditos de cada autor.

## Problemas pelo caminho

:::details title="O modo escuro mostrava o mapa claro"
O estilo do mapa base não tinha um identificador e por isso os dois temas partilhavam a mesma cache de tiles. Mudar para escuro continuava a mostrar tiles claros já guardados. Dar um identificador a cada estilo resolveu.
:::

:::details title="Rotas com paragens no meio do Atlântico"
As paragens de algumas rotas apareciam nas coordenadas 0, 0. A consulta que carregava as rotas não incluía as colunas de latitude e longitude das paragens e os valores em falta chegavam à app como zero.
:::

:::details title="Testes que falhavam sozinhos"
Os providers do Riverpod deixavam temporizadores de nova tentativa ativos depois de o teste acabar. Libertar os containers antes do fim de cada teste estabilizou a bateria de testes.
:::

## Próximos passos

- Concluir a fase 2: mais locais, mais rotas e o acompanhamento de uma rota em curso.
- Preparar a publicação nas lojas.
