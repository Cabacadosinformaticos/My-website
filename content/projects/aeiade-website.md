---
title: Site da AEIADE
desc: O novo site da Associação de Estudantes do IADE, bilingue e administrável pela própria associação, com notícias, eventos, departamentos, loja, recursos e um portal para a Assembleia Geral. Em desenvolvimento.
category: [Web App, Full-stack, Associação]
year: 2026
type: Associação
duration: Mai 2026, em evolução
status: Em desenvolvimento
stack: [Next.js, Payload CMS, PostgreSQL, TypeScript, Tailwind CSS, Docker]
cover: ""
related: [project:cabacalab, post:como-este-site-foi-feito]
---

Faço parte da Associação de Estudantes do IADE desde o primeiro ano. Este projeto junta essa vida associativa com aquilo que gosto de fazer: estou a construir o novo site da AEIADE, o sítio onde os estudantes encontram eventos, notícias, a equipa, os departamentos e os documentos da associação.

:::callout title="Projeto em desenvolvimento"
O site está a ser desenvolvido para a associação e ainda não foi lançado na versão final. Por isso esta página fala da motivação, das tecnologias e do tipo de trabalho envolvido, sem mostrar o produto em detalhe nem dados internos.
:::

:::image-placeholder title="Identidade do site" desc="Imagem genérica com a identidade visual, sem conteúdo interno nem dados de membros." ratio="16:9"
:::

## Porque um site novo

Uma associação de estudantes muda de equipa todos os anos. Um site que só uma pessoa sabe atualizar fica desatualizado assim que essa pessoa sai. O objetivo principal era simples de dizer e difícil de fazer bem: um site que a própria associação consegue gerir, com permissões por departamento, sem precisar de um programador para publicar uma notícia.

Os outros requisitos vieram daí:

- **Bilingue**, em português e inglês, porque o IADE tem muitos estudantes internacionais.
- **Seguro**, porque há áreas reservadas e documentos que não são públicos.
- **Simples de alojar e de mudar de alojamento**, porque a associação não tem orçamento para infraestrutura.

## Do PHP ao Next.js

O projeto já passou por várias versões. A primeira proposta pedia uma solução simples em PHP, sem React. Construí essa versão (PHP, conteúdo em JSON, sessões, proteção CSRF e um backoffice), e foi ao usá-la que ficou claro que não chegava: gerir conteúdo bilingue, permissões e ficheiros à mão ia transformar cada funcionalidade nova num projeto.

A versão atual usa Next.js com o Payload CMS. O Payload é ao mesmo tempo o CMS e o painel de administração, e corre dentro da própria aplicação. Isto dá um painel à medida da associação sem ter de escrever um backoffice do zero.

:::timeline title="Versões"
Mai 2026 | Versão em PHP | Simples, sem framework. Mostrou os limites de gerir tudo à mão.
Jul 2026 | Versão em Next.js e Payload | Primeira publicação, num alojamento serverless.
Set 2026 | Mudança de alojamento | Base de dados e ficheiros fora da aplicação, para poder mudar de servidor sem perder nada.
Hoje | Novas fases | Novas secções e redesenho, a caminho do lançamento.
:::

## As tecnologias

| Peça | Tecnologia |
|---|---|
| Framework | Next.js com App Router, React 19, TypeScript |
| CMS e painel | Payload CMS |
| Base de dados | PostgreSQL |
| Ficheiros | Armazenamento compatível com S3 |
| Estilos e animação | Tailwind CSS e Motion |
| Traduções | next-intl |
| Testes | Vitest e Playwright |
| Entrega | Uma imagem Docker |

## Decisões que já valeram a pena

:::decision title="A aplicação não guarda nada no próprio disco"
A primeira publicação foi num alojamento serverless, e aprendi da pior forma que o disco desses servidores é temporário: o ficheiro de base de dados desapareceu. Hoje a base de dados e os ficheiros vivem fora da aplicação. Mudar de servidor passou a ser uma questão de configuração e de copiar dados, e já tive de o fazer uma vez sem perder nada.
:::

:::decision title="Páginas geradas a pedido"
Na primeira versão as páginas do CMS eram geradas no build. Cada notícia nova obrigava a publicar o site outra vez. Passei a gerá-las a pedido, e o build deixou de precisar da base de dados.
:::

:::decision title="Apagar é mandar para o lixo"
Com várias pessoas a editar, alguém vai apagar a coisa errada. O conteúdo apagado vai para uma área de lixo e há um registo de atividade de quem mudou o quê.
:::

## O que estou a fazer

- Painel de administração com papéis por departamento: cada departamento edita o seu conteúdo, a direção vê tudo.
- Um portal para a Assembleia Geral, com documentos e votações.
- Mais de 800 testes automáticos e um verificador de fluxos completos que percorre o site como um utilizador.
- Novas secções e um redesenho visual, a preparar o lançamento.

## O que estou a aprender

- Desenhar para quem vem depois de mim: documentação, permissões e um painel que não precisa de explicação.
- Fusos horários são traiçoeiros. Uma data escolhida num formulário era lida como UTC, e as sessões de verão apareciam marcadas uma hora mais tarde. Agora há uma função própria para a hora de Lisboa, testada nas duas mudanças de hora.
- Alterações à base de dados feitas à mão, por fora da aplicação, acabam desfeitas pela própria aplicação. Tudo passa pela API do CMS.
