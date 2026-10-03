---
title: Africana Virtual Airways
desc: Plataforma web de uma companhia aérea virtual, feita no 4.º semestre de Engenharia Informática no IADE. Pesquisa de voos com escalas, reservas com PNR, frota, mapa de voos em tempo real e um backoffice de administração, em PHP sem framework e MySQL.
category: [Web App, Full-Stack, Académico]
year: 2026
type: Académico
duration: Abr 2026 a Mai 2026
status: Concluído
github: https://github.com/Cabacadosinformaticos/Africana-Virtual-Airways
stack: [PHP 8, MySQL 8, JavaScript, HTML, CSS, JWT, REST API, Leaflet]
cover: ""
related: [project:xplored, project:psp-lisboa-app, post:como-este-site-foi-feito]
---

O Africana Virtual Airways foi o projeto principal do 4.º semestre. O desafio era construir a plataforma digital completa de uma companhia aérea, desde o passageiro que pesquisa e reserva um voo até às ferramentas de gestão da administração. Foi o primeiro projeto de escala real em que trabalhei: dez tabelas relacionadas, uma API REST, integrações externas e dois tipos de utilizador com experiências diferentes.

:::image-placeholder title="Página inicial e pesquisa de voos" desc="Screenshot real da homepage com a caixa de pesquisa (existem capturas na documentação do projeto)." ratio="16:9"
:::

## A equipa e o meu papel

Fomos três: eu, o Muhammad Sacoor e o César Oliveira.

| Pessoa | Papel |
|---|---|
| Tiago Cabaça | Full-stack: sistema de reservas, itinerários, schema MySQL, backoffice de administração, autenticação e segurança, API, documentação técnica e UML |
| Muhammad Sacoor | Lead developer: arquitetura, integrações com VATSIM e meteorologia, mapa de voos em tempo real, globo 3D, motor de PNR |
| César Oliveira | Conteúdo e apoio: galeria da frota, entretenimento a bordo, testes de usabilidade e poster |

## O que a plataforma faz

- **Pesquisa de voos com escalas**, numa rede de 100 rotas entre 41 aeroportos.
- **Reservas com PNR**, dados de passageiros e um histórico de viagens.
- **Mapa de voos em tempo real**, com dados reais da rede VATSIM e meteorologia METAR.
- **Frota** de 18 aeronaves, com especificações e configuração de cabine.
- **Backoffice** para gerir voos, rotas, aeronaves e todas as reservas.

:::stats
10 | Tabelas na base de dados
100 | Rotas na rede
41 | Aeroportos
35 | Participantes no teste de usabilidade
:::

## Arquitetura

A versão final é PHP 8 sem framework e sem Composer, com MySQL 8 através de PDO. As páginas são renderizadas no servidor, e a parte dinâmica fala com uma API REST em JSON. O código partilhado (ligação à base de dados, autenticação, funções auxiliares e a lógica da rede de voos) vive numa pasta comum.

```text title="estrutura"
*.php            -> páginas renderizadas no servidor
api/*.php        -> endpoints REST, respostas sempre em JSON
includes/        -> base de dados, autenticação, helpers, rede de voos
schema.sql       -> 10 tabelas, script idempotente
```

A autenticação usa JWT (HS256) implementado à mão e palavras-passe com bcrypt. Os erros da API são sempre devolvidos em JSON, para nunca deixar escapar HTML ou um stack trace para o browser.

## Decisões técnicas

:::decision title="Pesquisa de rotas em largura, com limites"
Para encontrar voos com escalas, a pesquisa percorre a rede em largura (BFS), com um máximo de 3 segmentos, 50 caminhos candidatos e 8 resultados. Sem limites, uma rede de 100 rotas gera combinações suficientes para tornar a resposta lenta e imprevisível. Com eles, o tempo de resposta é estável.
:::

:::decision title="A reserva guarda uma fotografia do itinerário"
Cada reserva guarda o itinerário e os passageiros em JSON, ao lado das tabelas normalizadas. Se um voo mudar de horário depois, a reserva continua a mostrar o que o passageiro comprou. Apagar uma aeronave deixa o campo a nulo nos voos; apagar uma reserva apaga os seus dados em cascata.
:::

:::decision title="As APIs externas podem falhar"
A plataforma usa serviços externos para dados de voo, meteorologia e preço do combustível. Todos têm um valor de recurso: se um serviço falhar ou atingir o limite diário (a API de cotações só permite 25 pedidos por dia no plano gratuito), a plataforma continua a funcionar com um valor por defeito.
:::

:::decision title="Sem framework no backend final"
O backend começou numa micro-framework e foi migrado para PHP puro antes da entrega, para que o código entregue fosse exatamente o código apresentado e explicado na defesa. A migração obrigou a refazer os diagramas UML e a documentação da API, que descreviam a arquitetura antiga.
:::

## Problemas e lições

:::details title="O mapa em tempo real mostrava zero aviões"
Em Windows, sem os certificados configurados no PHP (`openssl.cafile` e `curl.cainfo`), os pedidos HTTPS às APIs externas falhavam em silêncio. O mapa carregava, mas com zero pilotos. O erro não aparecia em lado nenhum porque o recurso de fallback funcionava bem demais. Lição: um fallback precisa de deixar rasto num log.
:::

:::details title="O teste de usabilidade contrariou as nossas suposições"
Testámos a plataforma com 35 pessoas. Só 4 usaram telemóvel, e 19 descreveram o processo de reserva como longo ou confuso. São números menos simpáticos do que esperávamos, e são os mais úteis do projeto: mostram exatamente onde a próxima versão teria de mudar.
:::

## O que aprendi

A maior parte do trabalho num projeto deste tipo é tomar decisões de arquitetura que depois são difíceis de mudar. O schema que desenhei no início determinou a facilidade de todas as queries que vieram depois, e a migração de framework a meio mostrou o custo de mudar a base quando já há documentação escrita sobre ela.
