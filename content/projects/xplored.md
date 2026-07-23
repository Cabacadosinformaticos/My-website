---
title: Xplored
desc: App Android para descobrir locais com check-in por GPS, pontos, cupões, desafios de percurso e classificações, com backend em Spring Boot e MySQL. Projeto do 3.º semestre de Engenharia Informática no IADE, revisto e ampliado em outubro de 2026.
category: [Android, Mobile, Backend, Académico]
year: 2025
type: Académico
duration: Semestre, revisto em Out 2026
status: Concluído
github: https://github.com/Cabacadosinformaticos/Xplored
stack: [Kotlin, Jetpack Compose, Retrofit, Google Maps SDK, Spring Boot 3, Java 21, MySQL 8]
cover: ""
related: [project:psp-lisboa-app, project:africana-virtual-airways]
---

O Xplored é uma app para explorar uma zona da cidade como se fosse um jogo. O utilizador descobre locais no mapa, faz check-in por GPS quando lá está, ganha pontos, troca-os por cupões, faz desafios de percurso e compara-se com os outros numa tabela de classificação. Foi o projeto do 3.º semestre, e foi o primeiro em que trabalhei numa app Android nativa com um backend próprio.

:::image-placeholder title="Ecrãs da app" desc="Carrossel com os screenshots reais do emulador: mapa, detalhe de local, desafio de percurso, classificação, cupões e modo escuro." ratio="16:9"
:::

## A equipa e o meu papel

| Pessoa | Papel |
|---|---|
| Tiago Cabaça | Relatórios, mockups, design e base de dados; na revisão de 2026, correções, documentação, a maioria das funcionalidades novas e testes |
| Muhammad Sacoor | Backend em Spring Boot, Android, poster e vídeo |
| César Rodrigues | Android e apresentações |

## O que a app faz

- **Mapa de locais** com Google Maps e detalhe de cada local, com fotografias e avaliações.
- **Check-in por GPS**: só conta se estiveres perto do local.
- **Pontos e cupões**: cada check-in e cada desafio dá pontos, que se trocam por cupões.
- **Desafios de percurso**: rotas com várias paragens, ao estilo de um peddy-paper.
- **Classificação**, favoritos, modo escuro e moderação de locais sugeridos pelos utilizadores.

:::stats
14 | Controladores REST
20 | Locais de exemplo
40 | Avaliações de exemplo
8 | Funcionalidades novas em 2026
:::

## Arquitetura

```text title="visão geral"
App Android (Kotlin, Jetpack Compose)
  Retrofit, Google Maps SDK, sessão local
        |
        | REST + JSON
        v
API Spring Boot 3 (Java 21)
  14 controladores, JPA e JdbcTemplate
  /uploads para as fotografias
        |
        v
MySQL 8
  locais, utilizadores, check-ins, pontos, cupões, desafios, avaliações
```

Os locais de exemplo ficam no Parque das Nações e em Moscavide, à volta do campus. Os pontos são guardados como um registo de movimentos, em vez de um simples total. Assim é possível saber de onde veio cada ponto e corrigir um erro sem perder o histórico.

## A revisão de outubro de 2026

Um ano depois, voltei ao Xplored para o pôr a funcionar como devia. Fiz uma auditoria ao backend, que encontrou 16 defeitos, e acrescentei 8 funcionalidades. Os problemas mais interessantes:

:::details title="O mapa abria no meio do oceano"
Ao abrir o mapa focado num local, as coordenadas chegavam como `NaN` quando não havia foco. Um `NaN` passa na verificação `!= null`, e o mapa centrava-se em (0, 0), no golfo da Guiné. A verificação passou a confirmar que o valor é um número válido.
:::

:::details title="Os códigos de recuperação expiravam no momento em que eram criados"
O servidor e a base de dados tinham fusos horários diferentes na ligação JDBC. Os timestamps ficavam desviados uma hora e cada código de recuperação de palavra-passe nascia já expirado. Alinhar o fuso horário da ligação resolveu.
:::

:::details title="A Wikimedia recusava as imagens"
As fotografias de exemplo vêm da Wikimedia Commons, que devolvia 403 ao user agent por defeito da biblioteca de imagens. Um user agent próprio, identificado, como a Wikimedia pede, resolveu.
:::

:::details title="A distância do check-in estava desatualizada"
A app calculava a distância com a última localização conhecida, que podia ter minutos. Passou a pedir uma localização atualizada antes de validar o check-in.
:::

A chave do Google Maps passou também a ser lida de um ficheiro local através do Secrets Gradle Plugin, para não ficar no repositório.

## O que o Xplored me deu

Depois deste projeto, o desenvolvimento Android deixou de ser terra incógnita. Foi a base que me permitiu, meses mais tarde, liderar a parte técnica do [PSP Lisboa App](project-detail.html?id=psp-lisboa-app) em 48 horas. Voltar a ele um ano depois ensinou outra coisa: ler código antigo com olhos novos encontra problemas que, na altura, pareciam estar bem.
